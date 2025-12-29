import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REDEEM-VOUCHER] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { code } = await req.json();
    if (!code) throw new Error("Voucher code is required");
    logStep("Voucher code received", { code });

    // Find the voucher
    const { data: voucher, error: voucherError } = await supabaseClient
      .from("vouchers")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (voucherError) throw voucherError;
    if (!voucher) throw new Error("Invalid or expired voucher code");
    logStep("Voucher found", { voucherId: voucher.id, type: voucher.discount_type });

    // Check if voucher is still valid
    if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) {
      throw new Error("Voucher has expired");
    }

    // Check max uses
    if (voucher.max_uses && voucher.used_count >= voucher.max_uses) {
      throw new Error("Voucher has reached maximum redemptions");
    }

    // Check if user already redeemed this voucher
    const { data: existingRedemption } = await supabaseClient
      .from("voucher_redemptions")
      .select("id")
      .eq("voucher_id", voucher.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRedemption) {
      throw new Error("You have already redeemed this voucher");
    }

    // Process based on voucher type
    let subscriptionId = null;

    if (voucher.discount_type === "lifetime") {
      // Create or update subscription to lifetime
      const { data: existingSub } = await supabaseClient
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingSub) {
        const { error } = await supabaseClient
          .from("subscriptions")
          .update({ plan: "lifetime", expires_at: null })
          .eq("id", existingSub.id);
        if (error) throw error;
        subscriptionId = existingSub.id;
      } else {
        const { data: newSub, error } = await supabaseClient
          .from("subscriptions")
          .insert({ user_id: user.id, plan: "lifetime", expires_at: null })
          .select()
          .single();
        if (error) throw error;
        subscriptionId = newSub.id;
      }
      logStep("Lifetime subscription granted");
    } else if (voucher.discount_type === "free_trial") {
      // Create subscription with trial period
      const trialDays = voucher.discount_value || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + trialDays);

      const { data: existingSub } = await supabaseClient
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingSub) {
        const { error } = await supabaseClient
          .from("subscriptions")
          .update({ plan: "premium", expires_at: expiresAt.toISOString() })
          .eq("id", existingSub.id);
        if (error) throw error;
        subscriptionId = existingSub.id;
      } else {
        const { data: newSub, error } = await supabaseClient
          .from("subscriptions")
          .insert({ user_id: user.id, plan: "premium", expires_at: expiresAt.toISOString() })
          .select()
          .single();
        if (error) throw error;
        subscriptionId = newSub.id;
      }
      logStep("Free trial granted", { days: trialDays });
    }

    // Record the redemption
    const { error: redemptionError } = await supabaseClient.from("voucher_redemptions").insert({
      voucher_id: voucher.id,
      user_id: user.id,
      subscription_id: subscriptionId,
    });
    if (redemptionError) throw redemptionError;

    // Increment used_count
    await supabaseClient
      .from("vouchers")
      .update({ used_count: voucher.used_count + 1 })
      .eq("id", voucher.id);

    logStep("Voucher redeemed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        message: voucher.discount_type === "lifetime" 
          ? "Lifetime access granted!" 
          : voucher.discount_type === "free_trial"
          ? `${voucher.discount_value} days free trial activated!`
          : "Voucher applied successfully!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
