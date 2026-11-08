// Shared guards for edge functions that must distinguish trusted server-side
// callers (pg_cron / other functions using the service-role key) from end users,
// check the platform admin role, or build Stripe redirect URLs from a
// client-supplied origin.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSafeOrigin } from "./origin.ts";

/** Constant-time string comparison (avoids leaking how many chars matched). */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Compare against itself when lengths differ so timing does not depend on
  // where the first mismatch is; the length check still fails the result.
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

function bearerToken(req: Request): string {
  const auth = req.headers.get("Authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

/** True if the request carries the project's service-role key as Bearer
 *  (pg_cron jobs, server-to-server calls). verify_jwt is off for these
 *  functions, so an exact key match is the only accepted proof. */
export function isServiceRoleRequest(req: Request): boolean {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const token = bearerToken(req);
  if (!key || !token) return false;
  return timingSafeEqual(token, key);
}

/** True if the user holds the platform `admin` role (same check as create-user). */
export async function isPlatformAdmin(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !error && !!data;
}

const TRUSTED_RETURN_HOSTS = new Set(["event-bliss.com", "www.event-bliss.com"]);

/** Origin for Stripe success/cancel URLs. A client-supplied return_origin is
 *  only honoured when it is one of our own https hosts (prod or a Vercel
 *  preview); anything else falls back to getSafeOrigin(req). */
export function resolveReturnOrigin(req: Request, candidate: unknown): string {
  if (typeof candidate === "string" && candidate) {
    try {
      const url = new URL(candidate);
      if (
        url.protocol === "https:" &&
        (TRUSTED_RETURN_HOSTS.has(url.hostname) || url.hostname.endsWith(".vercel.app"))
      ) {
        return url.origin;
      }
    } catch {
      // malformed → fall through
    }
  }
  return getSafeOrigin(req);
}

/** Hex SHA-256 of a string. */
export async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
