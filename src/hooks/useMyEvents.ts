import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";

interface EventWithParticipants {
  id: string;
  name: string;
  slug: string;
  event_type: string;
  event_date: string | null;
  status: string;
  honoree_name: string;
  created_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  participant_count: number;
  is_organizer: boolean;
}

async function fetchMyEvents(userId: string): Promise<EventWithParticipants[]> {
  try {
    // Get events where user is a participant
    const { data: participantEvents, error: participantError } = await supabase
      .from("participants")
      .select(`
        event_id,
        role,
        events (
          id,
          name,
          slug,
          event_type,
          event_date,
          status,
          honoree_name,
          created_at,
          archived_at,
          deleted_at
        )
      `)
      .eq("user_id", userId);

    if (participantError) throw participantError;

    // Get events created by user (includes archived/deleted that RLS may hide from participants)
    const { data: createdEvents, error: createdError } = await supabase
      .from("events")
      .select("id, name, slug, event_type, event_date, status, honoree_name, created_at, archived_at, deleted_at")
      .eq("created_by", userId);

    if (createdError) throw createdError;

    // Merge and deduplicate
    const eventMap = new Map<string, EventWithParticipants>();

    participantEvents?.forEach((p) => {
      const event = p.events as any;
      if (event) {
        eventMap.set(event.id, {
          ...event,
          participant_count: 0,
          is_organizer: p.role === "organizer",
        });
      }
    });

    createdEvents?.forEach((event) => {
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, {
          ...event,
          archived_at: event.archived_at ?? null,
          deleted_at: event.deleted_at ?? null,
          participant_count: 0,
          is_organizer: true,
        });
      } else {
        const existing = eventMap.get(event.id)!;
        existing.is_organizer = true;
        existing.archived_at = event.archived_at ?? existing.archived_at;
        existing.deleted_at = event.deleted_at ?? existing.deleted_at;
      }
    });

    // Fetch participant counts
    const eventIds = Array.from(eventMap.keys());
    if (eventIds.length > 0) {
      const { data: counts } = await supabase
        .from("participants")
        .select("event_id")
        .in("event_id", eventIds);

      const countMap = new Map<string, number>();
      counts?.forEach((c) => {
        countMap.set(c.event_id, (countMap.get(c.event_id) || 0) + 1);
      });

      eventMap.forEach((event, id) => {
        event.participant_count = countMap.get(id) || 0;
      });
    }

    return Array.from(eventMap.values());
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

export function useMyEvents() {
  const { user } = useAuthContext();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["my-events", userId],
    enabled: !!user,
    queryFn: () => fetchMyEvents(userId!),
  });

  const allEvents = query.data;

  // Separate into active, archived, and deleted
  const { events, archivedEvents, deletedEvents } = useMemo(() => {
    const all = allEvents ?? [];
    const sortByCreated = (a: EventWithParticipants, b: EventWithParticipants) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    return {
      events: all.filter((e) => !e.archived_at && !e.deleted_at).sort(sortByCreated),
      archivedEvents: all.filter((e) => e.archived_at && !e.deleted_at).sort(sortByCreated),
      deletedEvents: all.filter((e) => e.deleted_at).sort(sortByCreated),
    };
  }, [allEvents]);

  const queryRefetch = query.refetch;
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  return { events, archivedEvents, deletedEvents, isLoading: query.isPending, refetch };
}
