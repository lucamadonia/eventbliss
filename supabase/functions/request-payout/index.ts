import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-PAYOUT] ${step}${detailsStr}`);
};

const MIN_PAYOUT_AMOUNT = 50; // Minimum payout amount in EUR

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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

    // Get affiliate record for user
    const { data: affiliate, error: affError } = await supabaseClient
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (affError) throw new Error(`Error fetching affiliate: ${affError.message}`);
    if (!affiliate) throw new Error("No active affiliate account found");

    logStep("Found affiliate", { affiliateId: affiliate.id, pendingBalance: affiliate.pending_balance });

    // Check minimum payout amount
    const pendingBalance = parseFloat(affiliate.pending_balance) || 0;
    if (pendingBalance < MIN_PAYOUT_AMOUNT) {
      throw new Error(`Minimum payout amount is €${MIN_PAYOUT_AMOUNT}. Current balance: €${pendingBalance.toFixed(2)}`);
    }

    // Check if there's a pending payout request
    const { data: existingPayout, error: existingError } = await supabaseClient
      .from("affiliate_payouts")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingError) throw new Error(`Error checking existing payouts: ${existingError.message}`);
    if (existingPayout) {
      throw new Error("You already have a pending payout request");
    }

    // Get approved commissions that haven't been paid out yet
    const { data: approvedCommissions, error: commError } = await supabaseClient
      .from("affiliate_commissions")
      .select("id, commission_amount")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "approved")
      .is("payout_id", null);

    if (commError) throw new Error(`Error fetching commissions: ${commError.message}`);

    // Calculate payout amount from approved commissions
    const payoutAmount = approvedCommissions?.reduce((sum, c: any) => sum + parseFloat(c.commission_amount), 0) || 0;

    if (payoutAmount < MIN_PAYOUT_AMOUNT) {
      throw new Error(`Not enough approved commissions for payout. Approved amount: €${payoutAmount.toFixed(2)}, Minimum: €${MIN_PAYOUT_AMOUNT}`);
    }

    // Create payout request
    const { data: payout, error: payoutError } = await supabaseClient
      .from("affiliate_payouts")
      .insert({
        affiliate_id: affiliate.id,
        amount: payoutAmount,
        currency: "EUR",
        status: "pending",
        payout_method: affiliate.payout_method,
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        commission_count: approvedCommissions?.length || 0,
        notes: "Requested by affiliate"
      })
      .select()
      .single();

    if (payoutError) throw new Error(`Error creating payout: ${payoutError.message}`);

    logStep("Payout request created", { payoutId: payout.id, amount: payoutAmount });

    // Update commissions to link to this payout
    if (approvedCommissions && approvedCommissions.length > 0) {
      const commissionIds = approvedCommissions.map(c => c.id);
      const { error: updateError } = await supabaseClient
        .from("affiliate_commissions")
        .update({ payout_id: payout.id })
        .in("id", commissionIds);

      if (updateError) {
        logStep("Warning: Failed to link commissions to payout", { error: updateError });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      payout: {
        id: payout.id,
        amount: payoutAmount,
        status: payout.status,
        created_at: payout.created_at
      }
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