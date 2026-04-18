import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgencyService {
  id: string;
  slug: string;
  status: string;
  category: string;
  subcategory: string | null;
  price_cents: number;
  price_type: string;
  min_participants: number | null;
  max_participants: number | null;
  duration_minutes: number | null;
  location_type: string;
  location_address: string | null;
  location_city: string | null;
  location_country: string;
  cover_image_url: string | null;
  gallery_urls: string[];
  is_featured: boolean;
  avg_rating: number;
  review_count: number;
  booking_count: number;
  advance_booking_days: number;
  cancellation_policy: string;
  requires_deposit: boolean;
  deposit_percent: number;
  auto_confirm: boolean;
  payment_method: "online" | "on_site";
  capacity_per_slot: number;
  groups_per_slot: number;
  groups_per_guide: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  scheduling_mode: "always_available" | "weekly_recurring" | "specific_dates" | "mixed";
  recurrence_interval: number;
  recurrence_anchor_date: string | null;
  admin_rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined translation (DE)
  title: string;
  short_description: string | null;
  description: string | null;
  includes: string[];
  requirements: string[];
}

export interface CreateServiceInput {
  agency_id: string;
  category: string;
  subcategory?: string;
  price_cents: number;
  price_type: string;
  min_participants?: number;
  max_participants?: number;
  duration_minutes?: number;
  location_type?: string;
  location_address?: string;
  location_city?: string;
  cover_image_url?: string;
  gallery_urls?: string[];
  advance_booking_days?: number;
  cancellation_policy?: string;
  auto_confirm?: boolean;
  payment_method?: "online" | "on_site";
  capacity_per_slot?: number;
  groups_per_slot?: number;
  groups_per_guide?: number;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  scheduling_mode?: "always_available" | "weekly_recurring" | "specific_dates" | "mixed";
  recurrence_interval?: number;
  recurrence_anchor_date?: string;
  /** Parsed list of one-off dates; inserted into marketplace_service_dates after the main service row. */
  specific_dates?: Array<{ date: string; start_time: string; end_time: string; notes?: string }>;
  // Booking mode
  booking_mode?: string;
  external_booking_url?: string;
  external_provider?: string;
  external_provider_config?: Record<string, unknown>;
  // Translation (DE)
  title: string;
  short_description?: string;
  description?: string;
  includes?: string[];
  requirements?: string[];
}

// ---------------------------------------------------------------------------
// Slug generator
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) + "-" + Math.random().toString(36).slice(2, 6);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAgencyServices(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-services", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_services")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) return [] as AgencyService[];

      const ids = data.map((s: any) => s.id);
      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("*").in("service_id", ids).eq("locale", "de");

      const txMap = new Map<string, any>();
      for (const tx of translations || []) txMap.set(tx.service_id, tx);

      return data.map((s: any): AgencyService => {
        const tx = txMap.get(s.id);
        return { ...s, title: tx?.title || "Ohne Titel", short_description: tx?.short_description, description: tx?.description, includes: tx?.includes || [], requirements: tx?.requirements || [] };
      });
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateServiceInput) => {
      const slug = slugify(input.title);
      const { data, error } = await (supabase.from as any)("marketplace_services")
        .insert({ agency_id: input.agency_id, slug, status: "draft", category: input.category, subcategory: input.subcategory, price_cents: input.price_cents, price_type: input.price_type, min_participants: input.min_participants, max_participants: input.max_participants, duration_minutes: input.duration_minutes, location_type: input.location_type || "flexible", location_address: input.location_address, location_city: input.location_city, cover_image_url: input.cover_image_url, gallery_urls: input.gallery_urls || [], advance_booking_days: input.advance_booking_days || 2, cancellation_policy: input.cancellation_policy || "moderate", auto_confirm: input.auto_confirm || false, payment_method: input.payment_method || "online", capacity_per_slot: input.capacity_per_slot ?? 10, groups_per_slot: input.groups_per_slot ?? 1, groups_per_guide: input.groups_per_guide ?? 1, buffer_before_minutes: input.buffer_before_minutes ?? 0, buffer_after_minutes: input.buffer_after_minutes ?? 15, scheduling_mode: input.scheduling_mode || "weekly_recurring", recurrence_interval: input.recurrence_interval ?? 1, recurrence_anchor_date: input.recurrence_anchor_date || null, booking_mode: input.booking_mode || "internal", external_booking_url: input.external_booking_url, external_provider: input.external_provider, external_provider_config: input.external_provider_config || {} })
        .select("id").single();
      if (error) throw error;

      // Insert DE translation
      await (supabase.from as any)("marketplace_service_translations")
        .insert({ service_id: data.id, locale: "de", title: input.title, short_description: input.short_description, description: input.description, includes: input.includes || [], requirements: input.requirements || [] });

      // Insert one-off dates if provided (scheduling_mode 'specific_dates' or 'mixed')
      if (input.specific_dates?.length) {
        await (supabase.from as any)("marketplace_service_dates")
          .insert(
            input.specific_dates.map((d) => ({
              service_id: data.id,
              date: d.date,
              start_time: d.start_time,
              end_time: d.end_time,
              notes: d.notes ?? null,
            })),
          );
      }

      return data;
    },
    onSuccess: (_, input) => {
      toast.success("Service erstellt");
      qc.invalidateQueries({ queryKey: ["agency-services", input.agency_id] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agencyId, ...fields }: { id: string; agencyId: string; [k: string]: any }) => {
      const { title, short_description, description, includes, requirements, specific_dates, ...serviceFields } = fields;
      if (Object.keys(serviceFields).length > 0) {
        const { error } = await (supabase.from as any)("marketplace_services").update(serviceFields).eq("id", id);
        if (error) throw error;
      }
      if (title !== undefined) {
        await (supabase.from as any)("marketplace_service_translations")
          .upsert({ service_id: id, locale: "de", title, short_description, description, includes: includes || [], requirements: requirements || [] }, { onConflict: "service_id,locale" });
      }
      // If specific_dates array was provided, replace them (delete-all-then-insert)
      if (Array.isArray(specific_dates)) {
        await (supabase.from as any)("marketplace_service_dates").delete().eq("service_id", id);
        if (specific_dates.length > 0) {
          await (supabase.from as any)("marketplace_service_dates")
            .insert(specific_dates.map((d: { date: string; start_time: string; end_time: string; notes?: string }) => ({
              service_id: id,
              date: d.date,
              start_time: d.start_time,
              end_time: d.end_time,
              notes: d.notes ?? null,
            })));
        }
      }
      return { id, agencyId };
    },
    onSuccess: (d) => {
      toast.success("Service aktualisiert");
      qc.invalidateQueries({ queryKey: ["agency-services", d.agencyId] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useSubmitForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agencyId }: { id: string; agencyId: string }) => {
      const { error } = await (supabase.from as any)("marketplace_services")
        .update({ status: "pending_review" }).eq("id", id);
      if (error) throw error;
      return { agencyId };
    },
    onSuccess: (d) => {
      toast.success("Zur Prüfung eingereicht");
      qc.invalidateQueries({ queryKey: ["agency-services", d.agencyId] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agencyId }: { id: string; agencyId: string }) => {
      const { error } = await (supabase.from as any)("marketplace_services").delete().eq("id", id);
      if (error) throw error;
      return { agencyId };
    },
    onSuccess: (d) => {
      toast.success("Service geloescht");
      qc.invalidateQueries({ queryKey: ["agency-services", d.agencyId] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
