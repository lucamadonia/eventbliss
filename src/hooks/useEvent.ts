import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type EventSettings } from "@/lib/survey-config";

export interface EventData {
  id: string;
  slug: string;
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
  access_code: string | null;
  settings: Partial<EventSettings> | null;
  survey_deadline: string | null;
  is_form_locked: boolean;
  locked_block: string | null;
  creator_is_premium: boolean;
  created_by: string | null;
}

export interface DashboardPermissions {
  can_view_responses: boolean;
  can_add_expenses: boolean;
  can_view_all_expenses: boolean;
  can_edit_settings: boolean;
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  role: "organizer" | "guest";
  status: "invited" | "confirmed" | "declined" | "maybe";
  avatar_url: string | null;
  can_access_dashboard?: boolean;
  dashboard_permissions?: DashboardPermissions;
  invite_token?: string;
  invite_sent_at?: string | null;
  invite_claimed_at?: string | null;
  user_id?: string | null;
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

    // Validate slug format - reject placeholder patterns
    if (slug.startsWith(':') || slug === 'slug' || slug.length < 3) {
      setError("Invalid event link. Please use a valid event URL or access code.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get auth token if available
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-event?slug=${slug}`,
        { method: "GET", headers }
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
