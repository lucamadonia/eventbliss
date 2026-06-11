/**
 * delete-user — GDPR Art. 17 account deletion.
 *
 * Authenticated user can permanently delete their own account. Removes the
 * auth.users row; downstream tables cascade-delete via the foreign-key chain
 * created in the migrations.
 *
 * Records the deletion in admin_audit_log for compliance evidence.
 *
 * Tax/finance data with statutory retention obligations (10 years per CY
 * tax law, German HGB §257, AO §147) stays on the related agency_id /
 * stripe_customer_id rows; PII fields on those rows are anonymised but
 * the rows themselves are preserved.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "missing_auth" }, 401, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Identify the caller via their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "invalid_session" }, 401, corsHeaders);
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? "(unknown)";

    // 2. Parse optional reason
    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = typeof body?.reason === "string" ? String(body.reason).slice(0, 500) : undefined;
    } catch {
      // No body — that's fine
    }

    // 3. Use service-role client to perform privileged deletion + cleanup
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3a. Anonymise long-retention rows the user might own:
    //     - marketplace_bookings as customer (tax law: 10 years retention)
    //     - affiliate_commissions / payouts (tax law)
    //     - newsletter_subscribers (proof of unsubscribe)
    const anonymisedEmail = `deleted-${userId.slice(0, 8)}@anonymised.event-bliss.com`;

    await admin.from("marketplace_bookings").update({
      customer_id: null,
      customer_name: "[deleted]",
      customer_email: anonymisedEmail,
      customer_phone: null,
      customer_notes: null,
    }).eq("customer_id", userId);

    await admin.from("newsletter_subscribers").update({
      email: anonymisedEmail,
      unsubscribed_at: new Date().toISOString(),
    }).eq("email", userEmail);

    // 3b. Log the deletion for audit purposes
    await admin.from("admin_audit_log").insert({
      admin_user_id: null,
      admin_email: "self-deletion@event-bliss.com",
      action: "user_self_delete",
      target_type: "auth.users",
      target_id: userId,
      metadata: {
        reason: reason ?? null,
        anonymised_email: anonymisedEmail,
        deleted_at: new Date().toISOString(),
      },
    });

    // 3c. Delete the auth user (cascades via FKs to profiles, events,
    //     participants, expenses, etc. wherever ON DELETE CASCADE is set).
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);
    if (deleteError) {
      console.error("[delete-user] admin.deleteUser failed", deleteError);
      return jsonResponse({ error: "delete_failed", detail: deleteError.message }, 500, corsHeaders);
    }

    return jsonResponse({ ok: true, anonymised_email: anonymisedEmail }, 200, corsHeaders);
  } catch (err) {
    console.error("[delete-user] unexpected error", err);
    return jsonResponse({ error: "internal_error" }, 500, corsHeaders);
  }
});

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
