/**
 * export-user-data — GDPR Art. 20 (Data Portability).
 *
 * Returns a structured JSON document containing all personal data the
 * authenticated caller has stored in EventBliss. The user identifies
 * themselves with their access token; the function uses service-role
 * privileges only to bypass RLS so it can read every table that mentions
 * the user, never to look at someone else's data.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const TABLES_BY_USER_ID = [
  // Direct ownership by user_id / created_by
  "profiles",
  "user_roles",
  "user_activity_logs",
  "user_feedback",
  "user_achievements",
  "game_stats",
  "subscriptions",
  "ai_usage",
  "ai_credit_adjustments",
  "voucher_redemptions",
  "affiliates",
  "agency_members",
  "agency_guides",
  "agency_interactions",
  "event_folders",
  "event_templates",
];

const TABLES_BY_CREATED_BY = [
  "events", // created_by
];

const TABLES_BY_CUSTOMER_ID = [
  "marketplace_bookings",
  "marketplace_reviews",
];

const TABLES_BY_EMAIL = [
  "newsletter_subscribers",
];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid_session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email;

    // Service-role client (bypasses RLS — only used to collect THIS user's rows)
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const exportData: Record<string, unknown> = {
      meta: {
        format: "EventBliss Data Export v1",
        generated_at: new Date().toISOString(),
        gdpr_basis: "Art. 20 GDPR — Right to data portability",
        controller: "MYFAMBLISS GROUP LTD, Gladstonos 12–14, 8046 Paphos, Cyprus",
        contact: "privacy@event-bliss.com",
        user_id: userId,
        user_email: userEmail,
      },
      auth_user: {
        id: userData.user.id,
        email: userData.user.email,
        email_confirmed_at: userData.user.email_confirmed_at,
        last_sign_in_at: userData.user.last_sign_in_at,
        created_at: userData.user.created_at,
        raw_user_meta_data: userData.user.user_metadata,
      },
    };

    // Collect rows from each table
    for (const table of TABLES_BY_USER_ID) {
      const { data, error } = await admin.from(table).select("*").eq("user_id", userId);
      if (!error) exportData[table] = data ?? [];
      else exportData[table] = { error: error.message };
    }

    for (const table of TABLES_BY_CREATED_BY) {
      const { data, error } = await admin.from(table).select("*").eq("created_by", userId);
      if (!error) exportData[table] = data ?? [];
      else exportData[table] = { error: error.message };
    }

    for (const table of TABLES_BY_CUSTOMER_ID) {
      const { data, error } = await admin.from(table).select("*").eq("customer_id", userId);
      if (!error) exportData[table] = data ?? [];
      else exportData[table] = { error: error.message };
    }

    if (userEmail) {
      for (const table of TABLES_BY_EMAIL) {
        const { data, error } = await admin.from(table).select("*").eq("email", userEmail);
        if (!error) exportData[table] = data ?? [];
        else exportData[table] = { error: error.message };
      }
    }

    // Events the user participates in (via participants.user_id)
    const { data: participants } = await admin
      .from("participants")
      .select("*, events(*)")
      .eq("user_id", userId);
    exportData.participants_with_events = participants ?? [];

    // Expenses paid by this user
    const { data: expenses } = await admin
      .from("expenses")
      .select("*")
      .eq("created_by_user_id", userId);
    exportData.expenses_created = expenses ?? [];

    // Audit log entry
    await admin.from("admin_audit_log").insert({
      admin_user_id: null,
      admin_email: "self-export@event-bliss.com",
      action: "user_data_export",
      target_type: "auth.users",
      target_id: userId,
      metadata: { exported_at: new Date().toISOString() },
    });

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="eventbliss-data-export-${userId.slice(0, 8)}.json"`,
      },
    });
  } catch (err) {
    console.error("[export-user-data] unexpected error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
