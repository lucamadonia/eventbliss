import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyTeamMember {
  id: string;
  user_id: string | null;
  email: string;
  role: "owner" | "admin" | "manager" | "assistant";
  status: "invited" | "active" | "deactivated";
}

export function useAgencyTeamMembers(agencyId: string | null | undefined) {
  return useQuery({
    queryKey: ["agency-team-members", agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<AgencyTeamMember[]> => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("agency_members")
        .select("id, user_id, email, role, status")
        .eq("agency_id", agencyId)
        .eq("status", "active")
        .order("role", { ascending: true });
      if (error) {
        console.error("[useAgencyTeamMembers]", error);
        return [];
      }
      return (data as AgencyTeamMember[]) ?? [];
    },
  });
}

export interface AgencyServiceOption {
  id: string;
  title: string;
  price_cents: number;
  min_participants: number | null;
  max_participants: number | null;
  category: string | null;
}

export function useAgencyServices(agencyId: string | null | undefined) {
  return useQuery({
    queryKey: ["agency-services", agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<AgencyServiceOption[]> => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("marketplace_services")
        .select("id, title, price_cents, min_participants, max_participants, category")
        .eq("agency_id", agencyId)
        .eq("status", "approved")
        .order("title", { ascending: true });
      if (error) {
        console.error("[useAgencyServices]", error);
        return [];
      }
      return (data as AgencyServiceOption[]) ?? [];
    },
  });
}

export interface CreateManualBookingInput {
  agencyId: string;
  serviceId: string;
  bookingDate: string; // 'YYYY-MM-DD'
  bookingTime: string; // 'HH:MM'
  participantCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerNotes?: string | null;
  assignedGuideId?: string | null;
  assignedTeamMemberId?: string | null;
  unitPriceCentsOverride?: number | null;
}

export function useCreateManualBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateManualBookingInput): Promise<string> => {
      const { data, error } = await supabase.rpc("create_manual_booking", {
        p_agency_id: input.agencyId,
        p_service_id: input.serviceId,
        p_booking_date: input.bookingDate,
        p_booking_time: input.bookingTime,
        p_participant_count: input.participantCount,
        p_customer_name: input.customerName,
        p_customer_email: input.customerEmail,
        p_customer_phone: input.customerPhone ?? null,
        p_customer_notes: input.customerNotes ?? null,
        p_assigned_guide_id: input.assignedGuideId ?? null,
        p_assigned_team_member_id: input.assignedTeamMemberId ?? null,
        p_unit_price_cents: input.unitPriceCentsOverride ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: ["agency-bookings"] });
      qc.invalidateQueries({ queryKey: ["marketplace-bookings"] });
      qc.invalidateQueries({ queryKey: ["agency-earnings", vars.agencyId] });
      qc.invalidateQueries({ queryKey: ["agency-booking-calendar", vars.agencyId] });
    },
  });
}
