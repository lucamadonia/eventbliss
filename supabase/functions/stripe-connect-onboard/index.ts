import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONNECT-ONBOARD] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!stripeKey) {
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY" });
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  // Create admin client for DB operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    // Authenticate the user via the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      logStep("ERROR", { message: "Auth failed", error: authError });
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { agency_id } = await req.json();
    if (!agency_id) {
      return new Response(JSON.stringify({ error: "agency_id ist erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user is a member of this agency
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("agency_members")
      .select("id, role")
      .eq("agency_id", agency_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) {
      logStep("ERROR", { message: "User is not a member of this agency", agency_id });
      return new Response(JSON.stringify({ error: "Du bist kein Mitglied dieser Agentur" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Membership verified", { role: membership.role });

    // Check if there's already a Stripe account for this agency
    const { data: existingAccount } = await supabaseAdmin
      .from("agency_stripe_accounts")
      .select("id, stripe_account_id, onboarding_complete")
      .eq("agency_id", agency_id)
      .maybeSingle();

    let stripeAccountId: string;

    if (existingAccount?.stripe_account_id) {
      // Already has a Stripe account — reuse it (maybe onboarding was not completed)
      stripeAccountId = existingAccount.stripe_account_id;
      logStep("Existing Stripe account found", { stripeAccountId });
    } else {
      // Create a new Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: "express",
        country: "DE",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { agency_id },
      });

      stripeAccountId = account.id;
      logStep("Stripe account created", { stripeAccountId });

      // Insert into agency_stripe_accounts
      const { error: insertError } = await supabaseAdmin
        .from("agency_stripe_accounts")
        .insert({
          agency_id,
          stripe_account_id: stripeAccountId,
          onboarding_complete: false,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
          country: "DE",
          default_currency: "EUR",
        });

      if (insertError) {
        logStep("ERROR inserting stripe account", { error: insertError });
        return new Response(JSON.stringify({ error: "Datenbankfehler beim Speichern" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build return URL (origin from Referer or hardcoded)
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://event-bliss.com";
    const returnUrl = `${origin}/agency?section=stripe`;

    // Create an Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    logStep("Account link created", { url: accountLink.url });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
