import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketplaceBooking {
  id: string;
  booking_number: string;
  service_id: string;
  agency_id: string;
  customer_id: string;
  event_id: string | null;
  status: string;
  booking_date: string;
  booking_time: string;
  participant_count: number;
  unit_price_cents: number;
  total_price_cents: number;
  platform_fee_cents: number;
  agency_payout_cents: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_notes: string | null;
  agency_notes: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  payment_method?: string | null;
  stripe_payment_intent_id?: string | null;
  created_at: string;
  // Joined
  service_title?: string;
  service_slug?: string;
  agency_name?: string;
}

export type CancellationReasonCode =
  | "agency_unavailable"
  | "agency_staff_shortage"
  | "agency_weather"
  | "customer_no_show"
  | "customer_unreachable"
  | "agency_other"
  | "customer_other";

// ---------------------------------------------------------------------------
// Customer bookings
// ---------------------------------------------------------------------------

export function useMyBookings() {
  return useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await (supabase.from as any)("marketplace_bookings")
        .select("*, marketplace_services(slug), agencies(name)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data || []).map((b: any): MarketplaceBooking => ({
        ...b,
        service_slug: b.marketplace_services?.slug,
        agency_name: b.agencies?.name,
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// Agency bookings
// ---------------------------------------------------------------------------

export function useAgencyBookings(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-bookings", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_bookings")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!data?.length) return [];

      // Fetch service titles
      const serviceIds = [...new Set(data.map((b: any) => b.service_id))];
      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("service_id, title").in("service_id", serviceIds).eq("locale", "de");
      const titleMap = new Map<string, string>();
      for (const t of translations || []) titleMap.set(t.service_id, t.title);

      return data.map((b: any): MarketplaceBooking => ({
        ...b,
        service_title: titleMap.get(b.service_id) || "Service",
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await (supabase.from as any)("marketplace_bookings")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Buchung bestätigt");
      qc.invalidateQueries({ queryKey: ["agency-bookings"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export interface CancelBookingInput {
  bookingId: string;
  reason?: string;
  reasonCode?: CancellationReasonCode;
  reasonText?: string;
  asAgency?: boolean;
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason, reasonCode, reasonText, asAgency }: CancelBookingInput) => {
      // Combine reason code + free text into a single string for the legacy
      // cancellation_reason column. The dedicated audit-log table is kept in
      // sync via an additional insert so § 7 (Agentur-Vertrag) is enforceable.
      const combinedReason =
        reasonCode || reasonText
          ? [reasonCode, reasonText].filter(Boolean).join(" — ")
          : reason || null;

      const newStatus = asAgency ? "cancelled_by_agency" : "cancelled_by_customer";

      const { error } = await (supabase.from as any)("marketplace_bookings")
        .update({
          status: newStatus,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: combinedReason,
        })
        .eq("id", bookingId);
      if (error) throw error;

      // Best-effort audit log entry. If the table isn't there yet (migration
      // lagging) or an RLS policy rejects, we swallow the error to avoid
      // undoing the cancellation — the trigger from Agent 3's migration
      // should cover most cases once deployed.
      if (reasonCode) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await (supabase.from as any)("marketplace_booking_cancellations").insert({
            booking_id: bookingId,
            cancelled_by: asAgency ? "agency" : "customer",
            cancelled_by_user_id: user?.id ?? null,
            reason_code: reasonCode,
            reason_text: reasonText || null,
          });
        } catch {
          // Swallow — trigger or RLS handles persistence.
        }
      }
    },
    onSuccess: () => {
      toast.success("Buchung storniert");
      qc.invalidateQueries({ queryKey: ["agency-bookings"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["event-bookings"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

// ---------------------------------------------------------------------------
// Event bookings — all bookings linked to a specific event
// ---------------------------------------------------------------------------

export function useEventBookings(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-bookings", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_bookings")
        .select("*, marketplace_services(slug), agencies(name)")
        .eq("event_id", eventId)
        .order("booking_date", { ascending: true });
      if (error) throw error;

      if (!data?.length) return [];

      // Fetch service titles
      const serviceIds = [...new Set(data.map((b: any) => b.service_id))];
      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("service_id, title").in("service_id", serviceIds).eq("locale", "de");
      const titleMap = new Map<string, string>();
      for (const t of translations || []) titleMap.set(t.service_id, t.title);

      return data.map((b: any): MarketplaceBooking => ({
        ...b,
        service_title: titleMap.get(b.service_id) || "Service",
        service_slug: b.marketplace_services?.slug,
        agency_name: b.agencies?.name,
      }));
    },
  });
}

export function useCompleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await (supabase.from as any)("marketplace_bookings")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Buchung abgeschlossen");
      qc.invalidateQueries({ queryKey: ["agency-bookings"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
