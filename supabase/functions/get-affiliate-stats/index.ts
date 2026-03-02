import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-AFFILIATE-STATS] ${step}${detailsStr}`);
};

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

    const unauthorized = (message: string) => {
      logStep("UNAUTHORIZED", { message });
      return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    };

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return unauthorized("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return unauthorized("Missing bearer token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) return unauthorized(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user) return unauthorized("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Get affiliate record for user
    const { data: affiliate, error: affError } = await supabaseClient
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (affError) throw new Error(`Error fetching affiliate: ${affError.message}`);
    if (!affiliate) {
      return new Response(JSON.stringify({ isAffiliate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found affiliate", { affiliateId: affiliate.id });

    // Get commission stats
    const { data: commissions, error: commError } = await supabaseClient
      .from("affiliate_commissions")
      .select("*")
      .eq("affiliate_id", affiliate.id);

    if (commError) throw new Error(`Error fetching commissions: ${commError.message}`);

    // Calculate stats
    const pendingCommissions = commissions?.filter((c) => c.status === "pending") || [];
    const approvedCommissions = commissions?.filter((c) => c.status === "approved") || [];
    const paidCommissions = commissions?.filter((c) => c.status === "paid") || [];

    const totalPending = pendingCommissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);
    const totalApproved = approvedCommissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);
    const totalPaid = paidCommissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

    // Get voucher stats
    const { data: affiliateVouchers, error: avError } = await supabaseClient
      .from("affiliate_vouchers")
      .select(
        `
        id,
        voucher:vouchers(id, code, used_count)
      `
      )
      .eq("affiliate_id", affiliate.id);

    if (avError) throw new Error(`Error fetching vouchers: ${avError.message}`);

    const totalRedemptions =
      affiliateVouchers?.reduce((sum, av) => {
        const voucher = av.voucher as any;
        return sum + (voucher?.used_count || 0);
      }, 0) || 0;

    // Get payout stats
    const { data: payouts, error: payError } = await supabaseClient
      .from("affiliate_payouts")
      .select("*")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false });

    if (payError) throw new Error(`Error fetching payouts: ${payError.message}`);

    const lastPayout = payouts?.[0] || null;

    // Monthly stats (last 12 months)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthCommissions =
        commissions?.filter((c) => {
          const date = new Date(c.created_at);
          return date >= monthStart && date <= monthEnd;
        }) || [];

      monthlyStats.push({
        month: monthStart.toISOString().slice(0, 7),
        earnings: monthCommissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0),
        conversions: monthCommissions.length,
      });
    }

    const stats = {
      isAffiliate: true,
      affiliate: {
        id: affiliate.id,
        company_name: affiliate.company_name,
        contact_name: affiliate.contact_name,
        email: affiliate.email,
        status: affiliate.status,
        tier: affiliate.tier,
        commission_type: affiliate.commission_type,
        commission_rate: affiliate.commission_rate,
        total_earnings: parseFloat(affiliate.total_earnings) || 0,
        pending_balance: parseFloat(affiliate.pending_balance) || 0,
      },
      commissions: {
        total: commissions?.length || 0,
        pending: pendingCommissions.length,
        approved: approvedCommissions.length,
        paid: paidCommissions.length,
        totalPending,
        totalApproved,
        totalPaid,
        totalEarnings: totalPending + totalApproved + totalPaid,
      },
      vouchers: {
        count: affiliateVouchers?.length || 0,
        totalRedemptions,
      },
      payouts: {
        count: payouts?.length || 0,
        last: lastPayout
          ? {
              amount: parseFloat(lastPayout.amount),
              status: lastPayout.status,
              date: lastPayout.processed_at || lastPayout.created_at,
            }
          : null,
      },
      monthlyStats,
    };

    logStep("Stats calculated", { affiliateId: affiliate.id });

    return new Response(JSON.stringify(stats), {
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