import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventData {
  id: string;
  name: string;
  honoree_name: string;
  event_type: string;
  event_date: string | null;
  description: string | null;
  status: string;
  locale: string;
  currency: string;
  timezone: string;
  theme: Record<string, unknown>;
  settings: {
    date_blocks?: Record<string, string>;
    no_gos?: string[];
    focus_points?: string[];
    form_locked?: boolean;
    locked_block?: string;
  };
  survey_deadline: string | null;
  is_form_locked: boolean;
  locked_block: string | null;
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  role: "organizer" | "guest";
  status: "invited" | "confirmed" | "declined" | "maybe";
  avatar_url: string | null;
}

export interface UseEventResult {
  event: EventData | null;
  participants: Participant[];
  responseCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEvent(slug: string | undefined): UseEventResult {
  const [event, setEvent] = useState<EventData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = async () => {
    if (!slug) {
      setError("No event slug provided");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke("get-event", {
        body: null,
        method: "GET",
        headers: {},
      });

      // Use query params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-event?slug=${slug}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch event");
      }

      setEvent(result.event);
      setParticipants(result.participants || []);
      setResponseCount(result.response_count || 0);
    } catch (err) {
      console.error("Error fetching event:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch event");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  return {
    event,
    participants,
    responseCount,
    isLoading,
    error,
    refetch: fetchEvent,
  };
}
