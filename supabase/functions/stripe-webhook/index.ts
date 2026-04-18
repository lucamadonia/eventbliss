import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// NOTE: ?target=deno forces esm.sh to serve a SubtleCrypto-compatible build.
// Without it, `constructEventAsync` can fall back to Node's sync `crypto`
// which is absent in Deno Edge Runtime and throws
// "SubtleCryptoProvider cannot be used in a synchronous context".
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeadersWithStripe } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Track affiliate commission when a coupon is used
async function trackAffiliateCommission(
  supabaseClient: any,
  session: Stripe.Checkout.Session,
  stripe: Stripe
) {
  try {
    // Check if a discount/coupon was applied
    const discounts = session.total_details?.breakdown?.discounts || [];
    if (discounts.length === 0) {
      logStep("No discounts applied to session");
      return;
    }

    // Get the coupon ID from the discount
    let stripeCouponId: string | null = null;
    
    if (session.discount?.coupon) {
      stripeCouponId = session.discount.coupon.id;
    } else if (discounts[0]?.discount?.coupon) {
      stripeCouponId = discounts[0].discount.coupon.id;
    }

    if (!stripeCouponId) {
      logStep("No coupon ID found in session");
      return;
    }

    logStep("Coupon found", { stripeCouponId });

    // Find the voucher in our database
    const { data: voucher, error: voucherError } = await supabaseClient
      .from("vouchers")
      .select("id, code")
      .eq("stripe_coupon_id", stripeCouponId)
      .maybeSingle();

    if (voucherError || !voucher) {
      logStep("Voucher not found for coupon", { stripeCouponId, error: voucherError });
      return;
    }

    logStep("Found voucher", { voucherId: voucher.id, code: voucher.code });

    // Find the affiliate linked to this voucher
    const { data: affiliateVoucher, error: avError } = await supabaseClient
      .from("affiliate_vouchers")
      .select(`
        id,
        custom_commission_type,
        custom_commission_rate,
        affiliate:affiliates!inner(
          id,
          status,
          commission_type,
          commission_rate
        )
      `)
      .eq("voucher_id", voucher.id)
      .maybeSingle();

    if (avError || !affiliateVoucher) {
      logStep("No affiliate found for voucher", { voucherId: voucher.id, error: avError });
      return;
    }

    const affiliate = affiliateVoucher.affiliate;
    
    if (affiliate.status !== 'active') {
      logStep("Affiliate is not active", { affiliateId: affiliate.id, status: affiliate.status });
      return;
    }

    logStep("Found affiliate", { affiliateId: affiliate.id });

    // Determine commission type and rate (custom overrides default)
    const commissionType = affiliateVoucher.custom_commission_type || affiliate.commission_type;
    const commissionRate = affiliateVoucher.custom_commission_rate || affiliate.commission_rate;

    // Calculate commission amount (session.amount_total is in cents)
    const orderAmount = (session.amount_total || 0) / 100; // Convert to decimal
    let commissionAmount: number;

    if (commissionType === 'percentage') {
      commissionAmount = (orderAmount * commissionRate) / 100;
    } else {
      commissionAmount = commissionRate; // Fixed amount
    }

    logStep("Calculated commission", { 
      orderAmount, 
      commissionType, 
      commissionRate, 
      commissionAmount 
    });

    // Create commission record
    const { error: commissionError } = await supabaseClient
      .from("affiliate_commissions")
      .insert({
        affiliate_id: affiliate.id,
        voucher_id: voucher.id,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        customer_email: session.customer_email || session.customer_details?.email,
        order_amount: orderAmount,
        commission_type: commissionType,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        currency: session.currency?.toUpperCase() || 'EUR',
        status: 'pending'
      });

    if (commissionError) {
      logStep("ERROR creating commission", { error: commissionError });
      return;
    }

    // Update affiliate's pending balance and total earnings
    const { error: updateError } = await supabaseClient.rpc("increment_affiliate_balance", {
      p_affiliate_id: affiliate.id,
      p_amount: commissionAmount,
    });

    if (updateError) {
      logStep("ERROR updating affiliate balance", { error: updateError });
    } else {
      logStep("Commission tracked successfully", { 
        affiliateId: affiliate.id, 
        commissionAmount 
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in trackAffiliateCommission", { message: errorMessage });
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeadersWithStripe(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing Stripe configuration" });
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  // Create Supabase client with service role for database updates
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR", { message: "No signature provided" });
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("ERROR", { message: "Webhook signature verification failed", error: errorMessage });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    // Idempotency check - skip already processed events
    const { data: existingEvent } = await supabaseClient
      .from("processed_webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      logStep("Event already processed, skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record this event as being processed
    await supabaseClient.from("processed_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, customerId: session.customer });

        // Marketplace booking? Route to marketplace handling instead of the
        // subscription flow. This makes a SINGLE Stripe Dashboard endpoint
        // work for both worlds — if the user also has a dedicated
        // marketplace-webhook endpoint, that one processes it independently
        // (both are idempotent via processed_webhook_events).
        const isMarketplace =
          session.metadata?.source === "marketplace" ||
          !!session.metadata?.booking_id;
        if (isMarketplace) {
          const bookingId = session.metadata?.booking_id;
          if (bookingId) {
            logStep("Routing marketplace checkout.session.completed", { bookingId });

            // Determine status based on service.auto_confirm — mirror of
            // marketplace-webhook logic
            const { data: booking } = await supabaseClient
              .from("marketplace_bookings")
              .select("service_id")
              .eq("id", bookingId)
              .single();
            let newStatus = "pending_confirmation";
            if (booking?.service_id) {
              const { data: service } = await supabaseClient
                .from("marketplace_services")
                .select("auto_confirm")
                .eq("id", booking.service_id)
                .single();
              if (service?.auto_confirm) newStatus = "confirmed";
            }
            const paymentIntentId = typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id || null;
            const update: Record<string, unknown> = {
              status: newStatus,
              stripe_payment_intent_id: paymentIntentId,
              stripe_checkout_session_id: session.id,
            };
            if (newStatus === "confirmed") update.confirmed_at = new Date().toISOString();

            const { error: updateError } = await supabaseClient
              .from("marketplace_bookings")
              .update(update)
              .eq("id", bookingId);
            if (updateError) {
              logStep("ERROR updating marketplace booking", { bookingId, error: updateError });
            } else {
              logStep("Marketplace booking updated via stripe-webhook", { bookingId, newStatus });
            }
          }
          break;
        }

        // Track affiliate commission if a coupon was used
        await trackAffiliateCommission(supabaseClient, session, stripe);

        const customerId = session.customer as string;
        const customerEmail = session.customer_email || session.customer_details?.email;
        const planType = session.metadata?.plan_type || "monthly";
        let userId = session.metadata?.user_id;

        // B2B Agency tier subscription: route to agency_marketplace_subscriptions
        if (planType.startsWith("agency_") && session.subscription) {
          const tier = session.metadata?.tier as "professional" | "enterprise";
          const agencyId = session.metadata?.agency_id;
          const subscriptionId = session.subscription as string;
          if (!agencyId || (tier !== "professional" && tier !== "enterprise")) {
            logStep("Agency checkout missing agency_id or invalid tier", { agencyId, tier });
            break;
          }
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await supabaseClient
            .from("agency_marketplace_subscriptions")
            .upsert({
              agency_id: agencyId,
              tier,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              started_at: new Date(subscription.start_date * 1000).toISOString(),
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
              is_active: true,
            }, { onConflict: "agency_id" });
          await supabaseClient
            .from("agencies")
            .update({ marketplace_tier: tier })
            .eq("id", agencyId);
          logStep("Agency tier subscription created", { agencyId, tier, subscriptionId });
          break;
        }

        // Fallback: Find user by email if user_id is missing from metadata
        if (!userId && customerEmail) {
          logStep("No user_id in metadata, searching by email", { email: customerEmail });
          
          const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();
          
          if (profileError) {
            logStep("Error searching profile by email", { error: profileError });
          } else if (profile) {
            userId = profile.id;
            logStep("Found user by email", { userId, email: customerEmail });
          }
        }

        if (!userId) {
          logStep("ERROR", { message: "No user_id found by metadata or email", customerEmail });
          break;
        }

        // Determine subscription details based on plan type
        if (planType === "lifetime") {
          // Lifetime purchase - no expiration
          logStep("Processing lifetime purchase", { userId, customerId });
          
          await supabaseClient
            .from("subscriptions")
            .upsert({
              user_id: userId,
              plan: "premium",
              stripe_customer_id: customerId,
              stripe_subscription_id: null, // No subscription for one-time payments
              expires_at: null, // Lifetime = no expiration
              started_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
          
          logStep("Lifetime subscription created", { userId });
        } else if (session.subscription) {
          // Monthly subscription
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          logStep("Processing monthly subscription", { userId, subscriptionId });
          
          await supabaseClient
            .from("subscriptions")
            .upsert({
              user_id: userId,
              plan: "premium",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
              started_at: new Date(subscription.start_date * 1000).toISOString(),
            }, { onConflict: "user_id" });
          
          logStep("Monthly subscription created", { userId, subscriptionId });
        }
        break;
      }

      case "charge.refunded": {
        // Also mirror the marketplace-webhook refund handling here so a
        // single Stripe endpoint can cover both subscription and
        // marketplace refunds.
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id || null;
        if (paymentIntentId) {
          const { data: mpBooking } = await supabaseClient
            .from("marketplace_bookings")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .maybeSingle();
          if (mpBooking) {
            const refundAmountCents = charge.amount_refunded || 0;
            await supabaseClient
              .from("marketplace_bookings")
              .update({
                status: "refunded",
                stripe_refund_id: charge.refunds?.data?.[0]?.id || null,
                refund_amount_cents: refundAmountCents,
                refunded_at: new Date().toISOString(),
              })
              .eq("id", mpBooking.id);
            logStep("Marketplace booking refunded via stripe-webhook", {
              bookingId: mpBooking.id,
              refundAmountCents,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        // Check if this is an agency tier subscription first
        const { data: agencySub } = await supabaseClient
          .from("agency_marketplace_subscriptions")
          .select("agency_id, tier")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (agencySub) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          await supabaseClient
            .from("agency_marketplace_subscriptions")
            .update({
              is_active: isActive,
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
          if (!isActive) {
            await supabaseClient
              .from("agencies")
              .update({ marketplace_tier: "starter" })
              .eq("id", agencySub.agency_id);
          }
          logStep("Agency subscription updated", { agencyId: agencySub.agency_id, isActive });
          break;
        }

        // Find user by stripe_subscription_id
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (existingSub) {
          if (subscription.status === "active") {
            await supabaseClient
              .from("subscriptions")
              .update({
                plan: "premium",
                expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("stripe_subscription_id", subscription.id);
            
            logStep("Subscription renewed", { userId: existingSub.user_id });
          } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
            await supabaseClient
              .from("subscriptions")
              .update({
                plan: "free",
                expires_at: null,
              })
              .eq("stripe_subscription_id", subscription.id);
            
            logStep("Subscription canceled", { userId: existingSub.user_id });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // Handle agency tier cancellation first
        const { data: agencySub } = await supabaseClient
          .from("agency_marketplace_subscriptions")
          .select("agency_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (agencySub) {
          await supabaseClient
            .from("agency_marketplace_subscriptions")
            .update({ tier: "starter", is_active: false, expires_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subscription.id);
          await supabaseClient
            .from("agencies")
            .update({ marketplace_tier: "starter" })
            .eq("id", agencySub.agency_id);
          logStep("Agency tier downgraded to starter", { agencyId: agencySub.agency_id });
          break;
        }

        await supabaseClient
          .from("subscriptions")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            expires_at: null,
          })
          .eq("stripe_subscription_id", subscription.id);
        
        logStep("User downgraded to free");
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          logStep("Invoice paid, updating subscription", { subscriptionId: subscription.id });
          
          await supabaseClient
            .from("subscriptions")
            .update({
              plan: "premium",
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id, customerId: invoice.customer });
        // Optionally mark subscription as past_due or send notification
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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