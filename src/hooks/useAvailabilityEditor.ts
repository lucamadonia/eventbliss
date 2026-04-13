import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────── */
export interface AvailabilitySlot {
  id: string;
  service_id: string;
  day_of_week: number; // 0=Sun … 6=Sat
  start_time: string;  // HH:mm:ss
  end_time: string;
  max_bookings: number;
  is_active: boolean;
  created_at?: string;
}

export interface BlockedDate {
  id: string;
  service_id: string;
  blocked_date: string; // YYYY-MM-DD
  reason: string | null;
  created_at?: string;
}

interface AddSlotInput {
  service_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_bookings?: number;
  is_active?: boolean;
}

interface UpdateSlotInput {
  id: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  max_bookings?: number;
  is_active?: boolean;
}

interface BlockDateInput {
  service_id: string;
  blocked_date: string;
  reason?: string;
}

/* ─── Availability Slots ─────────────────────────────── */

export function useAvailabilitySlots(serviceId: string | undefined) {
  return useQuery({
    queryKey: ["availability-slots", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_availability")
        .select("*")
        .eq("service_id", serviceId)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      return (data || []) as AvailabilitySlot[];
    },
  });
}

export function useAddSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddSlotInput) => {
      const { data, error } = await (supabase.from as any)("marketplace_availability")
        .insert({
          service_id: input.service_id,
          day_of_week: input.day_of_week,
          start_time: input.start_time,
          end_time: input.end_time,
          max_bookings: input.max_bookings ?? 1,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AvailabilitySlot;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["availability-slots", variables.service_id] });
      qc.invalidateQueries({ queryKey: ["service-availability"] });
      toast.success("Zeitslot hinzugefügt");
    },
    onError: () => toast.error("Fehler beim Hinzufügen des Zeitslots"),
  });
}

export function useUpdateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSlotInput) => {
      const { id, ...fields } = input;
      const { data, error } = await (supabase.from as any)("marketplace_availability")
        .update(fields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as AvailabilitySlot;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["availability-slots", data.service_id] });
      qc.invalidateQueries({ queryKey: ["service-availability"] });
      toast.success("Zeitslot aktualisiert");
    },
    onError: () => toast.error("Fehler beim Aktualisieren"),
  });
}

export function useRemoveSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, serviceId }: { id: string; serviceId: string }) => {
      const { error } = await (supabase.from as any)("marketplace_availability")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, serviceId };
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["availability-slots", variables.serviceId] });
      qc.invalidateQueries({ queryKey: ["service-availability"] });
      toast.success("Zeitslot entfernt");
    },
    onError: () => toast.error("Fehler beim Entfernen"),
  });
}

/* ─── Blocked Dates ──────────────────────────────────── */

export function useBlockedDates(serviceId: string | undefined) {
  return useQuery({
    queryKey: ["blocked-dates", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_blocked_dates")
        .select("*")
        .eq("service_id", serviceId)
        .order("blocked_date");

      if (error) throw error;
      return (data || []) as BlockedDate[];
    },
  });
}

export function useBlockDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BlockDateInput) => {
      const { data, error } = await (supabase.from as any)("marketplace_blocked_dates")
        .insert({
          service_id: input.service_id,
          blocked_date: input.blocked_date,
          reason: input.reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BlockedDate;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["blocked-dates", variables.service_id] });
      qc.invalidateQueries({ queryKey: ["service-availability"] });
      toast.success("Datum gesperrt");
    },
    onError: () => toast.error("Fehler beim Sperren des Datums"),
  });
}

export function useUnblockDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, serviceId }: { id: string; serviceId: string }) => {
      const { error } = await (supabase.from as any)("marketplace_blocked_dates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, serviceId };
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["blocked-dates", variables.serviceId] });
      qc.invalidateQueries({ queryKey: ["service-availability"] });
      toast.success("Datum entsperrt");
    },
    onError: () => toast.error("Fehler beim Entsperren"),
  });
}
