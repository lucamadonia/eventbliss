import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

// Price IDs are configured via Supabase secrets (no hardcoded fallbacks —
// the function fails loudly if a price is not configured for the current
// Stripe account).
const PRICE_ENV_VARS = {
  monthly: "STRIPE_PRICE_MONTHLY",
  yearly: "STRIPE_PRICE_YEARLY",
  lifetime: "STRIPE_PRICE_LIFETIME",
} as const;

function getPriceId(planType: string): string {
  const envVar =
    PRICE_ENV_VARS[planType as keyof typeof PRICE_ENV_VARS] ??
    PRICE_ENV_VARS.monthly;
  const priceId = Deno.env.get(envVar);
  if (!priceId) throw new Error(`${envVar} not configured`);
  return priceId;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Parse request body for plan_type and locale
    let planType = "monthly";
    let locale = "de";
    let returnOrigin = "";
    try {
      const body = await req.json();
      planType = body.plan_type || "monthly";
      locale = body.locale || "de";
      returnOrigin = body.return_origin || "";
    } catch {
      // No body or invalid JSON, use default
    }

    // Map our locale codes to Stripe-supported locales
    const stripeLocaleMap: Record<string, string> = {
      de: "de",
      en: "en",
      es: "es",
      fr: "fr",
      it: "it",
      nl: "nl",
      pt: "pt",
      pl: "pl",
      tr: "tr",
      ar: "ar",
    };
    const stripeLocale = stripeLocaleMap[locale] || "de";

    logStep("Plan type and locale requested", { planType, locale, stripeLocale });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = returnOrigin || req.headers.get("origin") || "https://event-bliss.com";
    const priceId = getPriceId(planType);
    const mode = planType === "lifetime" ? "payment" : "subscription";
    
    logStep("Selected price", { priceId, mode, planType });

    logStep("Creating checkout session", { priceId, mode, planType });
    
    // Create checkout session with locale for Stripe UI
    // Use English locale and allow promotion codes for coupon input
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      locale: "en", // Always English for Stripe UI
      allow_promotion_codes: true, // Allow users to enter coupon codes
      success_url: `${origin}/premium?success=true`,
      cancel_url: `${origin}/premium?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
