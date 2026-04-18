import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// ?target=deno for SubtleCrypto-safe build (see stripe-webhook for details)
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeadersWithStripe } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MARKETPLACE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeadersWithStripe(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_MARKETPLACE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing Stripe configuration" });
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
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

    // Idempotency check
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
        const bookingId = session.metadata?.booking_id;

        if (!bookingId) {
          logStep("No booking_id in session metadata, skipping (not a marketplace payment)");
          break;
        }

        logStep("Checkout completed for booking", { bookingId, sessionId: session.id });

        // Fetch the booking to check auto_confirm on its service
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

          if (service?.auto_confirm) {
            newStatus = "confirmed";
          }
        }

        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

        const updateData: Record<string, any> = {
          status: newStatus,
          stripe_payment_intent_id: paymentIntentId,
          stripe_checkout_session_id: session.id,
        };

        if (newStatus === "confirmed") {
          updateData.confirmed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabaseClient
          .from("marketplace_bookings")
          .update(updateData)
          .eq("id", bookingId);

        if (updateError) {
          logStep("ERROR updating booking", { error: updateError, bookingId });
        } else {
          logStep("Booking updated", { bookingId, newStatus });
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id || null;

        if (!paymentIntentId) {
          logStep("No payment_intent on charge, skipping");
          break;
        }

        logStep("Charge refunded", { paymentIntentId, chargeId: charge.id });

        // Find booking by payment intent
        const { data: booking, error: findError } = await supabaseClient
          .from("marketplace_bookings")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (findError || !booking) {
          logStep("No marketplace booking found for payment intent", { paymentIntentId });
          break;
        }

        const refundAmountCents = charge.amount_refunded || 0;

        const { error: updateError } = await supabaseClient
          .from("marketplace_bookings")
          .update({
            status: "refunded",
            stripe_refund_id: charge.refunds?.data?.[0]?.id || null,
            refund_amount_cents: refundAmountCents,
            refunded_at: new Date().toISOString(),
          })
          .eq("id", booking.id);

        if (updateError) {
          logStep("ERROR updating booking for refund", { error: updateError, bookingId: booking.id });
        } else {
          logStep("Booking refunded", { bookingId: booking.id, refundAmountCents });
        }

        break;
      }

      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        logStep("Transfer created", {
          transferId: transfer.id,
          amount: transfer.amount,
          destination: transfer.destination,
        });

        // Optional: track transfer on the booking if metadata contains booking_id
        const sourceTransaction = transfer.source_transaction;
        if (sourceTransaction) {
          // Try to find a booking linked to this transfer's payment intent
          // This is informational logging — no booking update required
          logStep("Transfer source transaction", { sourceTransaction });
        }

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
