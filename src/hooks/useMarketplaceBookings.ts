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
  created_at: string;
  // Joined
  service_title?: string;
  service_slug?: string;
  agency_name?: string;
}

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
      toast.success("Buchung bestaetigt");
      qc.invalidateQueries({ queryKey: ["agency-bookings"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason, asAgency }: { bookingId: string; reason?: string; asAgency?: boolean }) => {
      const { error } = await (supabase.from as any)("marketplace_bookings")
        .update({
          status: asAgency ? "cancelled_by_agency" : "cancelled_by_customer",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || null,
        })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Buchung storniert");
      qc.invalidateQueries({ queryKey: ["agency-bookings"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
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
