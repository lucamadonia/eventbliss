import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isUniqueViolation, planVoucherGrant } from "../_shared/stripe-compat.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REDEEM-VOUCHER] ${step}${detailsStr}`);
};

/**
 * Compensates a claimed slot when the grant fails. There is no decrement RPC,
 * so this uses an optimistic compare-and-set on used_count (best effort).
 */
// deno-lint-ignore no-explicit-any
async function releaseVoucherSlot(db: any, voucherId: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await db
      .from("vouchers")
      .select("used_count")
      .eq("id", voucherId)
      .maybeSingle();
    if (error || !data || !(data.used_count > 0)) break;
    const { data: updated, error: updError } = await db
      .from("vouchers")
      .update({ used_count: data.used_count - 1 })
      .eq("id", voucherId)
      .eq("used_count", data.used_count)
      .select("id");
    if (!updError && updated && updated.length > 0) return;
  }
  logStep("WARN could not release voucher slot after failed grant", { voucherId });
}

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated");

    const { code } = await req.json();
    if (!code) throw new Error("Voucher code is required");
    logStep("Voucher code received");

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

    // Percentage and fixed discount vouchers must be used in Stripe checkout
    if (voucher.discount_type === "percentage" || voucher.discount_type === "fixed") {
      throw new Error("DISCOUNT_VOUCHER:This voucher code gives you a discount. Please click 'Subscribe' or 'Buy once' and enter the code in the Stripe checkout.");
    }
    if (voucher.discount_type !== "lifetime" && voucher.discount_type !== "free_trial") {
      throw new Error("UNSUPPORTED_VOUCHER:This voucher type cannot be redeemed here.");
    }

    // Decide BEFORE claiming a slot whether the grant is allowed at all —
    // a voucher must never shorten or silently replace a paid / lifetime /
    // longer subscription (see planVoucherGrant).
    const { data: existingSub, error: existingSubError } = await supabaseClient
      .from("subscriptions")
      .select("id, plan, provider, plan_type, expires_at, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingSubError) throw existingSubError;

    const plan = planVoucherGrant(
      existingSub,
      voucher.discount_type,
      Number(voucher.discount_value) || 30,
      Date.now(),
    );
    if (plan.action === "reject") {
      logStep("Grant rejected", { code: plan.code });
      throw new Error(
        plan.code === "ALREADY_LIFETIME"
          ? "ALREADY_LIFETIME:You already have unlimited Premium access."
          : "ACTIVE_PAID_SUBSCRIPTION:You already have an active paid subscription. Please cancel it first or redeem the voucher after it ends.",
      );
    }

    // 1) Atomically claim a redemption slot FIRST. The RPC raises when
    //    used_count >= max_uses, so concurrent redemptions cannot overshoot.
    const { error: incrementError } = await supabaseClient.rpc("increment_voucher_used_count", {
      p_voucher_id: voucher.id,
      p_max_uses: voucher.max_uses || 999999,
    });
    if (incrementError) {
      throw new Error("MAX_REDEMPTIONS:Voucher has reached maximum redemptions");
    }

    // 2) Record the redemption BEFORE granting. UNIQUE (voucher_id, user_id)
    //    (migration 20261108120000) makes a concurrent double-redeem by the
    //    same user fail here with 23505 instead of granting twice.
    const { data: redemption, error: redemptionError } = await supabaseClient
      .from("voucher_redemptions")
      .insert({ voucher_id: voucher.id, user_id: user.id, subscription_id: existingSub?.id ?? null })
      .select("id")
      .single();
    if (redemptionError) {
      await releaseVoucherSlot(supabaseClient, voucher.id);
      if (isUniqueViolation(redemptionError)) {
        logStep("Duplicate redemption blocked by unique constraint");
        return new Response(
          JSON.stringify({
            success: false,
            code: "ALREADY_REDEEMED",
            error: "ALREADY_REDEEMED:You have already redeemed this voucher",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
        );
      }
      throw redemptionError;
    }

    // 3) Grant premium. On failure undo the redemption row and the slot.
    const grant: Record<string, unknown> = {
      plan: "premium",
      provider: "manual",
      is_manual: true,
      plan_type: plan.planType,
      expires_at: plan.expiresAt,
      // Only inactive Stripe rows can reach this point; drop the stale link
      // so old Stripe webhooks no longer address this row.
      stripe_subscription_id: null,
    };
    try {
      if (existingSub) {
        const { error } = await supabaseClient
          .from("subscriptions")
          .update(grant)
          .eq("id", existingSub.id);
        if (error) throw error;
      } else {
        const { data: newSub, error } = await supabaseClient
          .from("subscriptions")
          .insert({ user_id: user.id, ...grant })
          .select("id")
          .single();
        if (error) throw error;
        // Link the new subscription; failure here is cosmetic only.
        const { error: linkError } = await supabaseClient
          .from("voucher_redemptions")
          .update({ subscription_id: newSub.id })
          .eq("id", redemption.id);
        if (linkError) logStep("WARN could not link redemption to subscription", { error: linkError.message });
      }
    } catch (grantError) {
      const { error: deleteError } = await supabaseClient
        .from("voucher_redemptions")
        .delete()
        .eq("id", redemption.id);
      if (deleteError) logStep("WARN could not delete redemption after failed grant", { error: deleteError.message });
      await releaseVoucherSlot(supabaseClient, voucher.id);
      throw grantError;
    }
    logStep(voucher.discount_type === "lifetime" ? "Lifetime subscription granted" : "Free trial granted", {
      expiresAt: plan.expiresAt,
    });

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
