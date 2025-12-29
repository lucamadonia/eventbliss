import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
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
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check database for existing subscription (including lifetime)
    const { data: dbSub } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Check for lifetime subscription (no stripe_subscription_id but plan is premium and no expiry)
    if (dbSub && dbSub.plan === "premium" && !dbSub.stripe_subscription_id && !dbSub.expires_at) {
      logStep("Lifetime subscription found in database");
      return new Response(JSON.stringify({
        subscribed: true,
        plan: "premium",
        plan_type: "lifetime",
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check for valid database subscription with expiry
    if (dbSub && dbSub.plan === "premium" && dbSub.expires_at) {
      const expiresAt = new Date(dbSub.expires_at);
      if (expiresAt > new Date()) {
        logStep("Active monthly subscription found in database", { expiresAt: dbSub.expires_at });
        return new Response(JSON.stringify({
          subscribed: true,
          plan: "premium",
          plan_type: "monthly",
          subscription_end: dbSub.expires_at,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Fallback: Check Stripe directly
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, user is not subscribed");
      
      // Update subscription in database to free
      await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: "free",
          stripe_customer_id: null,
          stripe_subscription_id: null,
          expires_at: null,
        }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        plan_type: "free",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      stripeSubscriptionId = subscription.id;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });

      // Update subscription in database
      await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: "premium",
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          expires_at: subscriptionEnd,
          started_at: new Date(subscription.start_date * 1000).toISOString(),
        }, { onConflict: "user_id" });

      return new Response(JSON.stringify({
        subscribed: true,
        plan: "premium",
        plan_type: "monthly",
        subscription_end: subscriptionEnd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("No active subscription found");
      
      // Update subscription in database to free (only if not already lifetime)
      if (!dbSub || dbSub.plan !== "premium" || dbSub.stripe_subscription_id) {
        await supabaseClient
          .from("subscriptions")
          .upsert({
            user_id: user.id,
            plan: "free",
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            expires_at: null,
          }, { onConflict: "user_id" });
      }

      return new Response(JSON.stringify({
        subscribed: false,
        plan: "free",
        plan_type: "free",
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
