import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
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

/** 'network': the request itself failed (offline, server down) — worth a retry. */
export type EventErrorKind = "network" | "not_found";

export interface UseEventResult {
  event: EventData | null;
  participants: Participant[];
  responseCount: number;
  isLoading: boolean;
  error: string | null;
  errorKind: EventErrorKind | null;
  refetch: () => Promise<void>;
}

class EventFetchError extends Error {
  constructor(message: string, readonly kind: EventErrorKind) { super(message); }
}

interface EventPayload { event: EventData; participants: Participant[]; responseCount: number }

/** Stable empty list: a new array per render would retrigger consumers' effects. */
const NO_PARTICIPANTS: Participant[] = [];

/** Placeholder patterns from unresolved route templates are not event links. */
const isInvalidSlug = (slug: string) => slug.startsWith(":") || slug === "slug" || slug.length < 3;

/** The answer depends on who asks (permissions), so the account is part of the key. */
export const eventQueryKey = (slug: string | undefined, userId: string | null | undefined) =>
  ["event", slug, userId ?? "anon"] as const;

async function fetchEvent(slug: string): Promise<EventPayload> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

  let response: Response;
  try {
    response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-event?slug=${encodeURIComponent(slug)}`,
      { method: "GET", headers },
    );
  } catch {
    throw new EventFetchError("Network request failed", "network");
  }

  let result: { success?: boolean; error?: string; event?: EventData; participants?: Participant[]; response_count?: number } | null = null;
  try { result = await response.json(); } catch { /* A gateway or offline page is not JSON. */ }

  if (!result?.success || !result.event) {
    throw new EventFetchError(result?.error || "Failed to fetch event",
      !result || response.status >= 500 ? "network" : "not_found");
  }
  return { event: result.event, participants: result.participants || NO_PARTICIPANTS, responseCount: result.response_count || 0 };
}

/**
 * One event with its participants. Cached per event and account: reopening an
 * event shows it at once and refreshes in the background. Refetches (e.g. Form
 * Studio autosave → onUpdate) never bring the full-screen loader back, because
 * `isLoading` is only true while there is nothing to show yet.
 */
export function useEvent(slug: string | undefined): UseEventResult {
  const auth = useAuthContext();
  const valid = !!slug && !isInvalidSlug(slug);
  const query = useQuery({
    queryKey: eventQueryKey(slug, auth.user?.id),
    // Wait for the restored session: an anonymous first request would answer
    // "not found" for a private event and flash the wrong screen.
    enabled: valid && !auth.isLoading,
    queryFn: () => fetchEvent(slug!),
    // "Not found" is final; a failed connection gets one more try.
    retry: (failures, error) => error instanceof EventFetchError && error.kind === "network" && failures < 1,
  });

  const queryRefetch = query.refetch;
  const refetch = useCallback(async () => { await queryRefetch(); }, [queryRefetch]);

  const failure = query.error;
  const error = !slug ? "No event slug provided"
    : !valid ? "Invalid event link. Please use a valid event URL or access code."
    : failure ? (failure instanceof Error ? failure.message : "Failed to fetch event")
    : null;
  const errorKind: EventErrorKind | null = !valid ? "not_found"
    : failure ? (failure instanceof EventFetchError ? failure.kind : "network")
    : null;

  return {
    event: query.data?.event ?? null,
    participants: query.data?.participants ?? NO_PARTICIPANTS,
    responseCount: query.data?.responseCount ?? 0,
    isLoading: valid && query.isPending,
    error,
    errorKind,
    refetch,
  };
}
