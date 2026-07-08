import { supabase } from "@/integrations/supabase/client";

/**
 * Headers for a direct fetch() to a Supabase edge function. Always sends the
 * anon apikey and, when a session exists, the user's Bearer token — required by
 * functions that now authorize the caller (get-responses, get-expenses,
 * get-planner-data, update-event-settings, …).
 */
export async function edgeHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
    ...extra,
  };
}
