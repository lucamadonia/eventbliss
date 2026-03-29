import { useEffect, useState, useCallback } from "react";
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

export function useMyEvents() {
  const { user } = useAuthContext();
  const [events, setEvents] = useState<EventWithParticipants[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<EventWithParticipants[]>([]);
  const [deletedEvents, setDeletedEvents] = useState<EventWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
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
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      // Get events created by user (includes archived/deleted that RLS may hide from participants)
      const { data: createdEvents, error: createdError } = await supabase
        .from("events")
        .select("id, name, slug, event_type, event_date, status, honoree_name, created_at, archived_at, deleted_at")
        .eq("created_by", user.id);

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

      // Separate into active, archived, and deleted
      const allEvents = Array.from(eventMap.values());
      const sortByCreated = (a: EventWithParticipants, b: EventWithParticipants) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

      setEvents(allEvents.filter((e) => !e.archived_at && !e.deleted_at).sort(sortByCreated));
      setArchivedEvents(allEvents.filter((e) => e.archived_at && !e.deleted_at).sort(sortByCreated));
      setDeletedEvents(allEvents.filter((e) => e.deleted_at).sort(sortByCreated));
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  return { events, archivedEvents, deletedEvents, isLoading, refetch: fetchEvents };
}
