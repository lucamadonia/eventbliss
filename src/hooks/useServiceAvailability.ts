import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  maxBookings: number;
  currentBookings: number;
  availableCount: number;
}

/**
 * Compute available dates & time slots for a service in a given month.
 * Combines weekly recurring availability, blocked dates, and existing bookings.
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
      // 1. Fetch weekly availability slots
      const { data: slots } = await (supabase.from as any)("marketplace_availability")
        .select("*").eq("service_id", serviceId).eq("is_active", true);

      // 2. Fetch blocked dates for the month
      const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
      const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const { data: blocked } = await (supabase.from as any)("marketplace_blocked_dates")
        .select("blocked_date").eq("service_id", serviceId)
        .gte("blocked_date", monthStart).lte("blocked_date", monthEnd);

      // 3. Fetch existing bookings for the month (non-cancelled)
      const { data: bookings } = await (supabase.from as any)("marketplace_bookings")
        .select("booking_date, booking_time").eq("service_id", serviceId)
        .gte("booking_date", monthStart).lte("booking_date", monthEnd)
        .not("status", "in", '("cancelled_by_customer","cancelled_by_agency","refunded")');

      // Build lookup sets
      const blockedSet = new Set((blocked || []).map((b: any) => b.blocked_date));

      // Count bookings per date|time combination
      const bookingCounts = new Map<string, number>();
      for (const b of bookings || []) {
        const key = `${b.booking_date}|${b.booking_time}`;
        bookingCounts.set(key, (bookingCounts.get(key) || 0) + 1);
      }

      // Build a map of day_of_week -> slots
      const weeklySlots = new Map<number, any[]>();
      for (const s of slots || []) {
        const list = weeklySlots.get(s.day_of_week) || [];
        list.push(s);
        weeklySlots.set(s.day_of_week, list);
      }

      // 4. Iterate through each day of the month
      const availableDates = new Map<string, TimeSlot[]>();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date().toISOString().split("T")[0];

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateStr = date.toISOString().split("T")[0];

        // Skip past dates
        if (dateStr < today) continue;
        // Skip blocked dates
        if (blockedSet.has(dateStr)) continue;

        const dow = date.getDay(); // 0=Sun
        const daySlots = weeklySlots.get(dow);
        if (!daySlots?.length) continue;

        const timeSlots: TimeSlot[] = daySlots.map((s: any) => {
          const key = `${dateStr}|${s.start_time}`;
          const maxBookings = s.max_bookings ?? 1;
          const currentBookings = bookingCounts.get(key) || 0;
          const availableCount = Math.max(0, maxBookings - currentBookings);
          return {
            start: s.start_time.slice(0, 5),
            end: s.end_time.slice(0, 5),
            available: availableCount > 0,
            maxBookings,
            currentBookings,
            availableCount,
          };
        });

        // Only add if at least one slot has availability
        if (timeSlots.some((t) => t.availableCount > 0)) {
          availableDates.set(dateStr, timeSlots);
        }
      }

      return availableDates;
    },
    staleTime: 60_000,
  });
}
