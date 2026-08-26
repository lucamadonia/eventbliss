import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { data: dbSub } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Active RevenueCat subscription (native IAP) is the source of truth —
    // return it directly and never overwrite it with the Stripe lookup.
    if (
      dbSub &&
      dbSub.provider === "revenuecat" &&
      dbSub.plan === "premium" &&
      (!dbSub.expires_at || new Date(dbSub.expires_at) > new Date())
    ) {
      logStep("Active RevenueCat subscription found", {
        planType: dbSub.plan_type,
        expiresAt: dbSub.expires_at,
      });
      return new Response(JSON.stringify({
        subscribed: true,
        plan: "premium",
        plan_type: dbSub.plan_type || (dbSub.expires_at ? "monthly" : "lifetime"),
        subscription_end: dbSub.expires_at,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    /*
      Unbefristete Kaeufe und vom Adminbereich vergebene Abos (Probe-Abos
      eingeschlossen). RevenueCat ist oben schon abgehandelt.

      ZWEI FEHLER STANDEN HIER. Die Bedingung liess jedes manuelle Abo durch,
      auch ein ABGELAUFENES — `!stripe_subscription_id` allein genuegte. Und
      die Antwort behauptete danach pauschal "lifetime" mit
      `subscription_end: null`. Ein Probe-Abo sah damit fuer jeden Aufrufer wie
      ein unbefristetes Premium aus, und zwar auch noch nach seinem Ende. Dass
      in der App nichts Falsches ankam, lag allein daran, dass usePremium
      anschliessend die Datenbank liest und dort das Datum steht.
    */
    const manualStillValid =
      !dbSub?.expires_at || new Date(dbSub.expires_at) > new Date();
    if (
      dbSub &&
      dbSub.plan === "premium" &&
      dbSub.provider !== "revenuecat" &&
      // Beide Altfaelle bleiben drin — kein stripe_subscription_id (manuell,
      // Einmalkauf) ODER keine Frist. Neu ist nur: abgelaufen zaehlt nicht mehr.
      (!dbSub.stripe_subscription_id || !dbSub.expires_at) &&
      manualStillValid
    ) {
      logStep("Lifetime/manual subscription found", {
        planType: dbSub.plan_type,
        expiresAt: dbSub.expires_at,
      });
      return new Response(JSON.stringify({
        subscribed: true,
        plan: "premium",
        plan_type: dbSub.plan_type || (dbSub.expires_at ? "monthly" : "lifetime"),
        subscription_end: dbSub.expires_at ?? null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If no Stripe key, fall back to DB-only check
    if (!stripeKey) {
      logStep("No STRIPE_SECRET_KEY, using DB-only check");
      if (dbSub && dbSub.plan === "premium") {
        return new Response(JSON.stringify({
          subscribed: true,
          plan: "premium",
          plan_type: dbSub.stripe_subscription_id ? "monthly" : "lifetime",
          subscription_end: dbSub.expires_at,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      return new Response(JSON.stringify({ subscribed: false, plan: "free", plan_type: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, plan: "free", plan_type: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const startedAt = new Date(subscription.start_date * 1000).toISOString();
      const interval = subscription.items.data[0]?.price?.recurring?.interval;
      const isYearly = interval === "year";
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        interval, 
        isYearly, 
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        expiresAt: subscriptionEnd 
      });

      // Always upsert to keep DB in sync with Stripe
      const { error: upsertError } = await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        plan: "premium",
        provider: "stripe",
        plan_type: isYearly ? "yearly" : "monthly",
        product_id: subscription.items.data[0]?.price?.id ?? null,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        expires_at: subscriptionEnd,
        started_at: startedAt,
      }, { onConflict: "user_id" });

      if (upsertError) {
        logStep("ERROR upserting subscription", { error: upsertError.message });
      } else {
        logStep("Subscription synced to database successfully");
      }

      return new Response(JSON.stringify({
        subscribed: true,
        plan: "premium",
        plan_type: isYearly ? "yearly" : "monthly",
        subscription_end: subscriptionEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ subscribed: false, plan: "free", plan_type: "free" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
