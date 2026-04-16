import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyEarningsSummary {
  agency_id: string;
  pending_count: number;
  confirmed_count: number;
  completed_count: number;
  cancelled_count: number;
  earnings_total_cents: number;
  earnings_mtd_cents: number;
  earnings_last_month_cents: number;
  participants_total: number;
  paid_bookings_count: number;
}

export interface AgencyTopService {
  agency_id: string;
  service_id: string;
  service_title: string | null;
  booking_count: number;
  revenue_cents: number;
  participants_total: number;
}

export interface AgencyMonthlyEarnings {
  agency_id: string;
  month: string; // ISO date
  earnings_cents: number;
  bookings_count: number;
  participants: number;
}

const EMPTY_SUMMARY: Omit<AgencyEarningsSummary, "agency_id"> = {
  pending_count: 0,
  confirmed_count: 0,
  completed_count: 0,
  cancelled_count: 0,
  earnings_total_cents: 0,
  earnings_mtd_cents: 0,
  earnings_last_month_cents: 0,
  participants_total: 0,
  paid_bookings_count: 0,
};

export function useAgencyEarnings(agencyId: string | null | undefined) {
  return useQuery({
    queryKey: ["agency-earnings", agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<AgencyEarningsSummary> => {
      if (!agencyId) return { agency_id: "", ...EMPTY_SUMMARY };
      const { data, error } = await supabase
        .from("agency_earnings_summary")
        .select("*")
        .eq("agency_id", agencyId)
        .maybeSingle();
      if (error) throw error;
      return (data as AgencyEarningsSummary) ?? { agency_id: agencyId, ...EMPTY_SUMMARY };
    },
  });
}

export function useAgencyTopServices(agencyId: string | null | undefined, limit = 3) {
  return useQuery({
    queryKey: ["agency-top-services", agencyId, limit],
    enabled: !!agencyId,
    queryFn: async (): Promise<AgencyTopService[]> => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("agency_top_services")
        .select("*")
        .eq("agency_id", agencyId)
        .order("revenue_cents", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as AgencyTopService[]) ?? [];
    },
  });
}

export function useAgencyMonthlyEarnings(agencyId: string | null | undefined) {
  return useQuery({
    queryKey: ["agency-monthly-earnings", agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<AgencyMonthlyEarnings[]> => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("agency_earnings_monthly")
        .select("*")
        .eq("agency_id", agencyId)
        .order("month", { ascending: true });
      if (error) throw error;
      return (data as AgencyMonthlyEarnings[]) ?? [];
    },
  });
}

export interface AgencyGuide {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  max_daily_bookings?: number | null;
}

export function useAgencyGuidesList(agencyId: string | null | undefined) {
  return useQuery({
    queryKey: ["agency-guides-list", agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<AgencyGuide[]> => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("agency_guides")
        .select("id, name, email, is_active, max_daily_bookings")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) {
        console.error("[useAgencyGuidesList]", error);
        return [];
      }
      return (data as AgencyGuide[]) ?? [];
    },
  });
}

export function useAssignGuideToBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, guideId }: { bookingId: string; guideId: string | null }) => {
      const { error } = await supabase
        .from("marketplace_bookings")
        .update({ assigned_guide_id: guideId })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency-bookings"] });
      qc.invalidateQueries({ queryKey: ["marketplace-bookings"] });
    },
  });
}
