import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimeSlot {
  start: string;           // "HH:MM"
  end: string;             // "HH:MM"
  /** Slot hat noch Kapazität frei (egal ob für die gewünschte Gruppengröße ausreichend) */
  available: boolean;
  maxParticipants: number;
  currentParticipants: number;
  availableParticipants: number;
  maxGroups: number;
  currentGroups: number;
  /** Optional Label für Einzeltermine (z. B. "Sommer-Special") */
  label?: string;
  /** Quelle: weekly = wöchentlich wiederkehrend, specific = Einzeltermin, always = always_available */
  source: "weekly" | "specific" | "always";
}

type SchedulingMode = "always_available" | "weekly_recurring" | "specific_dates" | "mixed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function normalizeHHMM(t: string | null | undefined): string {
  if (!t) return "00:00";
  return t.slice(0, 5);
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso + "T00:00:00Z").getTime();
  const b = new Date(bIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

// always_available default hourly blocks (local time)
const ALWAYS_DEFAULT_HOURS = [10, 12, 14, 16, 18];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useServiceAvailability(
  serviceId: string | undefined,
  year: number,
  month: number, // 0-indexed
) {
  return useQuery({
    queryKey: ["service-availability", serviceId, year, month],
    enabled: !!serviceId,
    queryFn: async () => {
      // 1. Service
      const { data: service } = await (supabase.from as any)("marketplace_services")
        .select(
          "capacity_per_slot, groups_per_slot, duration_minutes, buffer_before_minutes, buffer_after_minutes, scheduling_mode, recurrence_interval, recurrence_anchor_date, advance_booking_days, created_at",
        )
        .eq("id", serviceId)
        .single();

      const capacityPerSlot = service?.capacity_per_slot ?? 10;
      const groupsPerSlot = service?.groups_per_slot ?? 1;
      const defaultCap = capacityPerSlot * groupsPerSlot;
      const durationMin = service?.duration_minutes ?? 120;
      const bufBefore = service?.buffer_before_minutes ?? 0;
      const bufAfter = service?.buffer_after_minutes ?? 0;
      const mode: SchedulingMode = (service?.scheduling_mode ?? "weekly_recurring") as SchedulingMode;
      const interval = Math.max(1, service?.recurrence_interval ?? 1);
      const anchorIso: string = service?.recurrence_anchor_date
        ?? (service?.created_at ? String(service.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10));
      const leadTimeDays = service?.advance_booking_days ?? 0;

      // 2. Weekly slots (only if mode uses them)
      const usesWeekly = mode === "weekly_recurring" || mode === "mixed";
      const usesSpecific = mode === "specific_dates" || mode === "mixed";
      const usesAlways = mode === "always_available";

      const { data: weekly } = usesWeekly
        ? await (supabase.from as any)("marketplace_availability")
            .select("*").eq("service_id", serviceId).eq("is_active", true)
        : { data: [] as any[] };

      // 3. Blocked dates
      const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
      const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const { data: blocked } = await (supabase.from as any)("marketplace_blocked_dates")
        .select("blocked_date").eq("service_id", serviceId)
        .gte("blocked_date", monthStart).lte("blocked_date", monthEnd);

      // 4. Specific one-off dates in month
      const { data: specific } = usesSpecific
        ? await (supabase.from as any)("marketplace_service_dates")
            .select("date, start_time, end_time, max_participants, notes")
            .eq("service_id", serviceId)
            .gte("date", monthStart).lte("date", monthEnd)
        : { data: [] as any[] };

      // 5. Existing bookings in the month (not cancelled)
      const { data: bookings } = await (supabase.from as any)("marketplace_bookings")
        .select("booking_date, booking_time, participant_count").eq("service_id", serviceId)
        .gte("booking_date", monthStart).lte("booking_date", monthEnd)
        .not("status", "in", '("cancelled_by_customer","cancelled_by_agency","refunded")');

      const blockedSet = new Set((blocked || []).map((b: any) => b.blocked_date));

      // Pre-group bookings by date for buffer-aware counting
      const bookingsByDate = new Map<string, Array<{ startMin: number; endMin: number; participants: number }>>();
      for (const b of bookings || []) {
        const bt = normalizeHHMM(b.booking_time);
        const startMin = toMinutes(bt);
        const endMin = startMin + durationMin;
        const list = bookingsByDate.get(b.booking_date) || [];
        list.push({
          startMin,
          endMin,
          participants: b.participant_count || 0,
        });
        bookingsByDate.set(b.booking_date, list);
      }

      // Compute capacity usage for a given slot-window on a given date.
      // A booking occupies its duration PLUS the service-defined buffer on
      // both sides. Any overlap with the queried slot window counts the
      // booking's participants against the slot's capacity. This keeps
      // parallel-group slots independent only if the agency defines enough
      // gap in their weekly slot config.
      const usageFor = (dateIso: string, slotStartMin: number, slotEndMin: number) => {
        const slotStart = slotStartMin - bufBefore;
        const slotEnd = slotEndMin + bufAfter;
        const list = bookingsByDate.get(dateIso) || [];
        let participants = 0;
        let groups = 0;
        for (const b of list) {
          const bStart = b.startMin - bufBefore;
          const bEnd = b.endMin + bufAfter;
          if (bStart < slotEnd && bEnd > slotStart) {
            participants += b.participants;
            groups += 1;
          }
        }
        return { participants, groups };
      };

      // Group weekly slots by day_of_week
      const weeklyByDow = new Map<number, Array<{ start_time: string; end_time: string; max_participants: number | null }>>();
      for (const s of weekly || []) {
        const dow = s.day_of_week as number;
        const list = weeklyByDow.get(dow) || [];
        list.push({
          start_time: normalizeHHMM(s.start_time),
          end_time: normalizeHHMM(s.end_time),
          max_participants: s.max_participants ?? null,
        });
        weeklyByDow.set(dow, list);
      }

      // Group specific dates by ISO date
      const specificByDate = new Map<string, Array<{ start_time: string; end_time: string; max_participants: number | null; notes: string | null }>>();
      for (const s of specific || []) {
        const list = specificByDate.get(s.date) || [];
        list.push({
          start_time: normalizeHHMM(s.start_time),
          end_time: normalizeHHMM(s.end_time),
          max_participants: s.max_participants ?? null,
          notes: s.notes ?? null,
        });
        specificByDate.set(s.date, list);
      }

      // Earliest bookable date (lead time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const earliest = new Date(today);
      earliest.setDate(earliest.getDate() + leadTimeDays);
      const earliestIso = earliest.toISOString().slice(0, 10);

      const availableDates = new Map<string, TimeSlot[]>();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateIso = date.toISOString().split("T")[0];

        if (dateIso < earliestIso) continue;
        if (blockedSet.has(dateIso)) continue;

        const slots: TimeSlot[] = [];

        // --- Always-available synthetic slots ---
        if (usesAlways) {
          for (const h of ALWAYS_DEFAULT_HOURS) {
            const startMin = h * 60;
            const endMin = startMin + durationMin;
            const used = usageFor(dateIso, startMin, endMin);
            const maxP = defaultCap;
            const avail = Math.max(0, maxP - used.participants);
            slots.push({
              start: minutesToTime(startMin),
              end: minutesToTime(endMin),
              maxParticipants: maxP,
              currentParticipants: used.participants,
              availableParticipants: avail,
              maxGroups: groupsPerSlot,
              currentGroups: used.groups,
              available: avail > 0 && used.groups < groupsPerSlot,
              source: "always",
            });
          }
        }

        // --- Weekly recurring slots (respecting recurrence_interval) ---
        if (usesWeekly) {
          const dow = date.getDay();
          const daySlots = weeklyByDow.get(dow);
          if (daySlots?.length) {
            // Recurrence interval filter
            let include = true;
            if (interval > 1) {
              const diff = daysBetween(anchorIso, dateIso);
              if (diff < 0) {
                include = false;
              } else {
                include = Math.floor(diff / 7) % interval === 0;
              }
            }
            if (include) {
              for (const s of daySlots) {
                const startMin = toMinutes(s.start_time);
                const endMin = toMinutes(s.end_time);
                const maxP = s.max_participants ?? defaultCap;
                const used = usageFor(dateIso, startMin, endMin);
                const avail = Math.max(0, maxP - used.participants);
                slots.push({
                  start: s.start_time,
                  end: s.end_time,
                  maxParticipants: maxP,
                  currentParticipants: used.participants,
                  availableParticipants: avail,
                  maxGroups: groupsPerSlot,
                  currentGroups: used.groups,
                  available: avail > 0 && used.groups < groupsPerSlot,
                  source: "weekly",
                });
              }
            }
          }
        }

        // --- Specific one-off dates ---
        if (usesSpecific) {
          const list = specificByDate.get(dateIso);
          if (list?.length) {
            for (const s of list) {
              const startMin = toMinutes(s.start_time);
              const endMin = toMinutes(s.end_time);
              const maxP = s.max_participants ?? defaultCap;
              const used = usageFor(dateIso, startMin, endMin);
              const avail = Math.max(0, maxP - used.participants);
              slots.push({
                start: s.start_time,
                end: s.end_time,
                maxParticipants: maxP,
                currentParticipants: used.participants,
                availableParticipants: avail,
                maxGroups: groupsPerSlot,
                currentGroups: used.groups,
                available: avail > 0 && used.groups < groupsPerSlot,
                source: "specific",
                label: s.notes ?? undefined,
              });
            }
          }
        }

        // De-duplicate: if mixed mode produces the same start time from two
        // sources, keep the one with explicit capacity override (specific beats weekly)
        if (slots.length > 1) {
          const byStart = new Map<string, TimeSlot>();
          for (const sl of slots) {
            const existing = byStart.get(sl.start);
            if (!existing || (sl.source === "specific" && existing.source !== "specific")) {
              byStart.set(sl.start, sl);
            }
          }
          const deduped = Array.from(byStart.values()).sort(
            (a, b) => toMinutes(a.start) - toMinutes(b.start),
          );
          if (deduped.length) availableDates.set(dateIso, deduped);
        } else if (slots.length === 1) {
          availableDates.set(dateIso, slots);
        }
      }

      return availableDates;
    },
    staleTime: 60_000,
  });
}
