// Shared authorization helpers for edge functions that run with the SERVICE
// ROLE key (which bypasses RLS). These functions MUST re-implement access
// control themselves — the helpers below verify the caller's JWT and their
// membership/organizer status for a given event.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

/** Resolve the authenticated user id from a Bearer token, or null. */
export async function getUserId(req: Request, supabase: SupabaseClient): Promise<string | null> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  // The anon apikey is sent as a Bearer by supabase-js on unauthenticated
  // calls; getUser rejects it, so we correctly fall through to null.
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

/** True if the user is any participant of the event. */
export async function isEventMember(
  supabase: SupabaseClient,
  eventId: string,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase
    .from("participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** True if the user created the event or holds an organizer participant seat. */
export async function isEventOrganizer(
  supabase: SupabaseClient,
  eventId: string,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
  const { data: ev } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .maybeSingle();
  if (ev?.created_by && ev.created_by === userId) return true;
  const { data } = await supabase
    .from("participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("role", "organizer")
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** True if the supplied invite token belongs to an organizer seat of the event.
 *  Used to authorize the guest event-creation flow (no JWT yet) to persist its
 *  own settings, using the organizer_token returned by create-event. */
export async function organizerTokenValid(
  supabase: SupabaseClient,
  eventId: string,
  token: string | null | undefined,
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const { data } = await supabase
    .from("participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("invite_token", token)
    .eq("role", "organizer")
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** True if the event's organizer has opted this tab into public visibility
 *  (settings.public_visible_tabs) — preserves the "share schedule/expenses with
 *  guests" feature while still blocking IDOR of non-public events. */
export async function eventTabIsPublic(
  supabase: SupabaseClient,
  eventId: string,
  tabKeys: string[],
): Promise<boolean> {
  const { data } = await supabase
    .from("events")
    .select("settings")
    .eq("id", eventId)
    .maybeSingle();
  const tabs = (data?.settings as { public_visible_tabs?: unknown } | null)?.public_visible_tabs;
  if (!Array.isArray(tabs)) return false;
  return tabKeys.some((k) => tabs.includes(k));
}

export function unauthorized(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ success: false, error: "Not authorized" }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
