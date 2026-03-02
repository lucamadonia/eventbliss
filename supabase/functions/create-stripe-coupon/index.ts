import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Verify admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Unauthorized - Admin access required");
    }

    logStep("Admin verified", { userId: user.id });

    // Parse request body
    const body = await req.json();
    const { voucher_id, code, discount_type, discount_value } = body;

    if (!voucher_id || !code || !discount_type) {
      throw new Error("Missing required fields: voucher_id, code, discount_type");
    }

    logStep("Creating Stripe coupon", { code, discount_type, discount_value });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create Stripe coupon based on discount type
    let couponParams: Stripe.CouponCreateParams = {
      duration: "once",
      name: `EventBliss Discount - ${code}`,
    };

    if (discount_type === "percentage") {
      couponParams.percent_off = discount_value;
    } else if (discount_type === "fixed") {
      // Stripe expects amount in cents
      couponParams.amount_off = Math.round(discount_value * 100);
      couponParams.currency = "eur";
    } else {
      throw new Error(`Unsupported discount type for Stripe: ${discount_type}`);
    }

    const coupon = await stripe.coupons.create(couponParams);
    logStep("Stripe coupon created", { couponId: coupon.id });

    // Create promotion code so users can enter the code in checkout
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code,
      active: true,
    });
    logStep("Stripe promotion code created", { promoCodeId: promotionCode.id, code: promotionCode.code });

    // Update voucher with stripe_coupon_id
    const { error: updateError } = await supabaseClient
      .from("vouchers")
      .update({ stripe_coupon_id: coupon.id })
      .eq("id", voucher_id);

    if (updateError) {
      logStep("Error updating voucher with stripe_coupon_id", { error: updateError });
      // Don't fail - coupon was created successfully
    } else {
      logStep("Voucher updated with stripe_coupon_id", { voucher_id, stripe_coupon_id: coupon.id });
    }

    return new Response(JSON.stringify({ 
      success: true,
      coupon_id: coupon.id,
      promotion_code: promotionCode.code 
    }), {
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
