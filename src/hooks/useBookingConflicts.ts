import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MarketplaceBooking } from "@/hooks/useMarketplaceBookings";

export type ConflictType =
  | "guide_overlap"
  | "guide_daily_limit"
  | "service_overcapacity";

export interface Conflict {
  type: ConflictType;
  message: string;
  relatedBookingIds?: string[];
}

interface ServiceMeta {
  id: string;
  duration_minutes: number | null;
  max_participants: number | null;
}

interface GuideMeta {
  id: string;
  max_daily_bookings: number | null;
}

const ACTIVE_STATUSES = new Set([
  "pending_confirmation",
  "confirmed",
  "completed",
]);

function parseBookingRange(b: MarketplaceBooking, durationMinutes: number): { start: Date; end: Date } | null {
  if (!b.booking_date || !b.booking_time) return null;
  const start = new Date(`${b.booking_date}T${b.booking_time}`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start, end };
}

function intervalsOverlap(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Fetch services + guides metadata for conflict calc. */
function useConflictMeta(agencyId: string | null | undefined) {
  return useQuery({
    queryKey: ["booking-conflict-meta", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      if (!agencyId) return { services: new Map<string, ServiceMeta>(), guides: new Map<string, GuideMeta>() };
      const [svcRes, guideRes] = await Promise.all([
        supabase
          .from("marketplace_services")
          .select("id, duration_minutes, max_participants")
          .eq("agency_id", agencyId),
        supabase
          .from("agency_guides")
          .select("id, max_daily_bookings")
          .eq("agency_id", agencyId),
      ]);
      const services = new Map<string, ServiceMeta>();
      (svcRes.data ?? []).forEach((s) => services.set(s.id as string, s as ServiceMeta));
      const guides = new Map<string, GuideMeta>();
      (guideRes.data ?? []).forEach((g) => guides.set(g.id as string, g as GuideMeta));
      return { services, guides };
    },
  });
}

export function useBookingConflicts(
  agencyId: string | null | undefined,
  bookings: MarketplaceBooking[],
): Map<string, Conflict[]> {
  const { data: meta } = useConflictMeta(agencyId);

  return useMemo(() => {
    const result = new Map<string, Conflict[]>();
    if (!meta) return result;

    // Pre-compute booking intervals
    const intervals = bookings
      .filter((b) => ACTIVE_STATUSES.has(b.status))
      .map((b) => {
        const durationMinutes = meta.services.get(b.service_id as string)?.duration_minutes ?? 60;
        return { booking: b, range: parseBookingRange(b, durationMinutes) };
      })
      .filter((x): x is { booking: MarketplaceBooking; range: { start: Date; end: Date } } => x.range !== null);

    // Helper: count bookings per guide per date
    const guideDateCount = new Map<string, number>();
    intervals.forEach(({ booking }) => {
      const gid = (booking as unknown as { assigned_guide_id?: string | null }).assigned_guide_id;
      if (!gid) return;
      const key = `${gid}|${booking.booking_date}`;
      guideDateCount.set(key, (guideDateCount.get(key) ?? 0) + 1);
    });

    // Helper: count bookings per service per slot (date + time)
    const serviceSlotCount = new Map<string, number>();
    intervals.forEach(({ booking }) => {
      const key = `${booking.service_id}|${booking.booking_date}|${booking.booking_time}`;
      serviceSlotCount.set(key, (serviceSlotCount.get(key) ?? 0) + 1);
    });

    intervals.forEach(({ booking, range }) => {
      const conflicts: Conflict[] = [];
      const gid = (booking as unknown as { assigned_guide_id?: string | null }).assigned_guide_id;

      // 1. Guide overlap with other bookings
      if (gid) {
        const overlappers: string[] = [];
        intervals.forEach((other) => {
          if (other.booking.id === booking.id) return;
          const otherGid = (other.booking as unknown as { assigned_guide_id?: string | null }).assigned_guide_id;
          if (otherGid !== gid) return;
          if (intervalsOverlap(range, other.range)) overlappers.push(other.booking.id);
        });
        if (overlappers.length > 0) {
          conflicts.push({
            type: "guide_overlap",
            message: `Guide ist zeitgleich bei ${overlappers.length} anderer Buchung${overlappers.length > 1 ? "en" : ""} eingeteilt`,
            relatedBookingIds: overlappers,
          });
        }

        // 2. Guide daily limit
        const guide = meta.guides.get(gid);
        const limit = guide?.max_daily_bookings ?? null;
        if (limit !== null && limit > 0) {
          const count = guideDateCount.get(`${gid}|${booking.booking_date}`) ?? 0;
          if (count > limit) {
            conflicts.push({
              type: "guide_daily_limit",
              message: `Guide hat ${count} Buchungen an diesem Tag (Limit: ${limit})`,
            });
          }
        }
      }

      // 3. Service over-capacity at same slot (multiple bookings at identical date+time)
      const slotKey = `${booking.service_id}|${booking.booking_date}|${booking.booking_time}`;
      const slotCount = serviceSlotCount.get(slotKey) ?? 0;
      if (slotCount > 1) {
        conflicts.push({
          type: "service_overcapacity",
          message: `${slotCount} Buchungen für denselben Service zur selben Zeit`,
        });
      }

      if (conflicts.length > 0) result.set(booking.id, conflicts);
    });

    return result;
  }, [bookings, meta]);
}
