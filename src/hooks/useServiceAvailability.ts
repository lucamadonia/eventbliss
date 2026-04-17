import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimeSlot {
  start: string;
  end: string;
  /** Slot hat noch Kapazität frei (egal ob für die gewünschte Gruppengröße ausreichend) */
  available: boolean;
  /** Effektive Teilnehmer-Obergrenze dieses Slots (groups_per_slot × capacity_per_slot, oder Slot-Override) */
  maxParticipants: number;
  /** Aktuell gebuchte Teilnehmer */
  currentParticipants: number;
  /** Noch verfügbare Plätze (Personen) */
  availableParticipants: number;
  /** Maximale parallele Gruppen */
  maxGroups: number;
  /** Aktuell gebuchte Gruppen/Bookings */
  currentGroups: number;
}

/**
 * Berechnet verfügbare Tage & Zeit-Slots für einen Service in einem Monat.
 * Kombiniert wöchentliche Verfügbarkeit, blockierte Termine und bestehende Buchungen.
 * Zählt Teilnehmer (summiert participant_count), nicht Buchungs-Zeilen.
 */
export function useServiceAvailability(
  serviceId: string | undefined,
  year: number,
  month: number, // 0-indexed (JS Date convention)
) {
  return useQuery({
    queryKey: ["service-availability", serviceId, year, month],
    enabled: !!serviceId,
    queryFn: async () => {
      // 1. Service-Kapazitätsfelder
      const { data: service } = await (supabase.from as any)("marketplace_services")
        .select("capacity_per_slot, groups_per_slot")
        .eq("id", serviceId)
        .single();
      const capacityPerSlot = service?.capacity_per_slot ?? 10;
      const groupsPerSlot = service?.groups_per_slot ?? 1;
      const defaultMaxParticipants = capacityPerSlot * groupsPerSlot;

      // 2. Wöchentliche Verfügbarkeits-Slots
      const { data: slots } = await (supabase.from as any)("marketplace_availability")
        .select("*").eq("service_id", serviceId).eq("is_active", true);

      // 3. Blockierte Termine für den Monat
      const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
      const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const { data: blocked } = await (supabase.from as any)("marketplace_blocked_dates")
        .select("blocked_date").eq("service_id", serviceId)
        .gte("blocked_date", monthStart).lte("blocked_date", monthEnd);

      // 4. Bestehende Buchungen (nicht storniert) — summiere Teilnehmer
      const { data: bookings } = await (supabase.from as any)("marketplace_bookings")
        .select("booking_date, booking_time, participant_count").eq("service_id", serviceId)
        .gte("booking_date", monthStart).lte("booking_date", monthEnd)
        .not("status", "in", '("cancelled_by_customer","cancelled_by_agency","refunded")');

      const blockedSet = new Set((blocked || []).map((b: any) => b.blocked_date));

      // Key = "date|HH:MM" — summiere Teilnehmer und zähle Gruppen
      const participantsByKey = new Map<string, number>();
      const groupsByKey = new Map<string, number>();
      for (const b of bookings || []) {
        const timeKey = typeof b.booking_time === "string" ? b.booking_time.slice(0, 5) : b.booking_time;
        const key = `${b.booking_date}|${timeKey}`;
        participantsByKey.set(key, (participantsByKey.get(key) || 0) + (b.participant_count || 0));
        groupsByKey.set(key, (groupsByKey.get(key) || 0) + 1);
      }

      // Tages-Lookup
      const weeklySlots = new Map<number, any[]>();
      for (const s of slots || []) {
        const list = weeklySlots.get(s.day_of_week) || [];
        list.push(s);
        weeklySlots.set(s.day_of_week, list);
      }

      const availableDates = new Map<string, TimeSlot[]>();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date().toISOString().split("T")[0];

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateStr = date.toISOString().split("T")[0];

        if (dateStr < today) continue;
        if (blockedSet.has(dateStr)) continue;

        const dow = date.getDay();
        const daySlots = weeklySlots.get(dow);
        if (!daySlots?.length) continue;

        const timeSlots: TimeSlot[] = daySlots.map((s: any) => {
          const startKey = typeof s.start_time === "string" ? s.start_time.slice(0, 5) : s.start_time;
          const key = `${dateStr}|${startKey}`;
          // Slot-spezifischer Override > Service-Default
          const maxParticipants = s.max_participants ?? defaultMaxParticipants;
          const currentParticipants = participantsByKey.get(key) || 0;
          const availableParticipants = Math.max(0, maxParticipants - currentParticipants);
          const currentGroups = groupsByKey.get(key) || 0;
          const maxGroups = groupsPerSlot;
          // Ein Slot gilt als frei, solange noch mindestens ein Platz UND
          // die Gruppen-Obergrenze nicht erreicht ist (beides muss passen).
          const available = availableParticipants > 0 && currentGroups < maxGroups;
          return {
            start: startKey,
            end: typeof s.end_time === "string" ? s.end_time.slice(0, 5) : s.end_time,
            available,
            maxParticipants,
            currentParticipants,
            availableParticipants,
            maxGroups,
            currentGroups,
          };
        });

        // Nur Tage listen, an denen mindestens ein Slot noch verfügbar ist
        if (timeSlots.some((t) => t.available)) {
          availableDates.set(dateStr, timeSlots);
        } else if (timeSlots.length > 0) {
          // Trotzdem aufnehmen, damit UI "ausgebucht" zeigen kann
          availableDates.set(dateStr, timeSlots);
        }
      }

      return availableDates;
    },
    staleTime: 60_000,
  });
}
