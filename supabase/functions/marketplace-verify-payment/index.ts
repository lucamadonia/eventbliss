// Self-healing fallback when the Stripe → Supabase webhook doesn't fire
// (e.g. webhook not configured yet, signature mismatch, transient failure).
//
// Called from BookingSuccess on mount when a booking exists but has no
// stripe_payment_intent_id despite having a stripe_checkout_session_id.
// This queries Stripe for the Checkout Session, and if it's paid, mirrors
// the same update the marketplace-webhook would have done:
//   - status: pending_payment → confirmed or pending_confirmation (per service.auto_confirm)
//   - stripe_payment_intent_id populated
//   - confirmed_at set when auto-confirmed
//
// Idempotent: if the booking already has a PI, no-op.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const log = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MARKETPLACE-VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    // Auth (user scoped via RLS)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id fehlt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: booking, error: bookingErr } = await supabase
      .from("marketplace_bookings")
      .select("*")
      .eq("id", booking_id)
      .eq("customer_id", user.id)
      .single();
    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: "Buchung nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bereits korrekt? → nichts zu tun
    if (booking.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ status: "already_confirmed", booking }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kein Checkout-Session → noch nicht bezahlt
    if (!booking.stripe_checkout_session_id) {
      return new Response(JSON.stringify({ status: "no_session" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Verifying session with Stripe", { sessionId: booking.stripe_checkout_session_id });
    const session = await stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ status: "not_paid", payment_status: session.payment_status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the session is actually linked to this booking via metadata
    if (session.metadata?.booking_id && session.metadata.booking_id !== booking.id) {
      log("WARN session metadata booking_id mismatch", {
        sessionBookingId: session.metadata.booking_id,
        requestedBookingId: booking.id,
      });
      return new Response(JSON.stringify({ error: "Session stimmt nicht mit der Buchung überein" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine new status from service auto_confirm (same logic as webhook)
    const { data: service } = await supabase
      .from("marketplace_services")
      .select("auto_confirm")
      .eq("id", booking.service_id)
      .single();

    const newStatus = service?.auto_confirm ? "confirmed" : "pending_confirmation";
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

    const update: Record<string, unknown> = {
      status: newStatus,
      stripe_payment_intent_id: paymentIntentId,
    };
    if (newStatus === "confirmed") update.confirmed_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from("marketplace_bookings")
      .update(update)
      .eq("id", booking.id)
      .select("*")
      .single();

    if (updateErr) {
      log("ERROR updating booking", updateErr);
      return new Response(JSON.stringify({ error: "Update fehlgeschlagen" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Booking reconciled via Stripe session", {
      bookingId: booking.id,
      newStatus,
      paymentIntentId,
    });

    return new Response(JSON.stringify({ status: "confirmed_now", booking: updated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
