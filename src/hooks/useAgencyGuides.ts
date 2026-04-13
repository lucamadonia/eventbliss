import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgencyGuide {
  id: string;
  agency_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  specialties: string[];
  max_daily_bookings: number;
  color: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuideQualification {
  service_id: string;
  guide_id: string;
  qualified_at: string;
}

export interface BookingGuideAssignment {
  id: string;
  booking_id: string;
  guide_id: string;
  role: string;
  confirmed: boolean;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  guide_name?: string;
  guide_color?: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useAgencyGuides(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-guides", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_guides")
        .select("*")
        .eq("agency_id", agencyId)
        .order("name");
      if (error) throw error;
      return (data || []) as AgencyGuide[];
    },
  });
}

export function useGuideQualifications(guideId: string | undefined) {
  return useQuery({
    queryKey: ["guide-qualifications", guideId],
    enabled: !!guideId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("service_guide_qualifications")
        .select("*")
        .eq("guide_id", guideId);
      if (error) throw error;
      return (data || []) as GuideQualification[];
    },
  });
}

export function useBookingGuides(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["booking-guides", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("booking_guide_assignments")
        .select("*, agency_guides(name, color)")
        .eq("booking_id", bookingId);
      if (error) throw error;
      return (data || []).map((a: any): BookingGuideAssignment => ({
        ...a,
        guide_name: a.agency_guides?.name,
        guide_color: a.agency_guides?.color,
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (guide: {
      agency_id: string;
      name: string;
      email?: string;
      phone?: string;
      specialties?: string[];
      max_daily_bookings?: number;
      color?: string;
      notes?: string;
    }) => {
      const { data, error } = await (supabase.from as any)("agency_guides")
        .insert(guide)
        .select()
        .single();
      if (error) throw error;
      return data as AgencyGuide;
    },
    onSuccess: (data) => {
      toast.success("Guide erstellt");
      qc.invalidateQueries({ queryKey: ["agency-guides", data.agency_id] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useUpdateGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<AgencyGuide> & { id: string }) => {
      const { data, error } = await (supabase.from as any)("agency_guides")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AgencyGuide;
    },
    onSuccess: (data) => {
      toast.success("Guide aktualisiert");
      qc.invalidateQueries({ queryKey: ["agency-guides", data.agency_id] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useDeleteGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agencyId }: { id: string; agencyId: string }) => {
      const { error } = await (supabase.from as any)("agency_guides")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return agencyId;
    },
    onSuccess: (agencyId) => {
      toast.success("Guide gelöscht");
      qc.invalidateQueries({ queryKey: ["agency-guides", agencyId] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useAssignGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: {
      booking_id: string;
      guide_id: string;
      role?: string;
      notes?: string;
    }) => {
      const { data, error } = await (supabase.from as any)("booking_guide_assignments")
        .insert(assignment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success("Guide zugewiesen");
      qc.invalidateQueries({ queryKey: ["booking-guides", variables.booking_id] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useUnassignGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bookingId }: { id: string; bookingId: string }) => {
      const { error } = await (supabase.from as any)("booking_guide_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return bookingId;
    },
    onSuccess: (bookingId) => {
      toast.success("Zuweisung entfernt");
      qc.invalidateQueries({ queryKey: ["booking-guides", bookingId] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
