import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const AGENCY_PRICE_IDS = {
  professional: Deno.env.get("STRIPE_PRICE_AGENCY_PROFESSIONAL") ?? "",
  enterprise: Deno.env.get("STRIPE_PRICE_AGENCY_ENTERPRISE") ?? "",
};

type AgencyTier = "professional" | "enterprise";

const log = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AGENCY-SUBSCRIBE] ${step}${suffix}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email missing");

    const body = await req.json().catch(() => ({}));
    const tier = body.tier as AgencyTier;
    const locale = (body.locale as string) || "de";
    const returnOrigin = (body.return_origin as string) || req.headers.get("origin") || "https://event-bliss.com";

    if (tier !== "professional" && tier !== "enterprise") {
      throw new Error(`Invalid tier "${tier}". Must be "professional" or "enterprise".`);
    }

    const priceId = AGENCY_PRICE_IDS[tier];
    if (!priceId) {
      throw new Error(`Stripe price ID not configured for tier "${tier}". Set STRIPE_PRICE_AGENCY_${tier.toUpperCase()}.`);
    }

    const { data: agency, error: agencyError } = await supabaseClient
      .from("agencies")
      .select("id, name, slug, owner_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (agencyError) throw new Error(`Agency lookup failed: ${agencyError.message}`);
    if (!agency) throw new Error("No agency found for this user. Create an agency first.");

    log("Agency resolved", { agencyId: agency.id, tier });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      locale: locale as Stripe.Checkout.SessionCreateParams.Locale,
      allow_promotion_codes: true,
      success_url: `${returnOrigin}/agency?tier_upgraded=${tier}`,
      cancel_url: `${returnOrigin}/agency/pricing?canceled=1`,
      metadata: {
        user_id: user.id,
        agency_id: agency.id,
        plan_type: `agency_${tier}`,
        tier,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          agency_id: agency.id,
          plan_type: `agency_${tier}`,
          tier,
        },
      },
    });

    log("Checkout session created", { sessionId: session.id, tier, agencyId: agency.id });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
