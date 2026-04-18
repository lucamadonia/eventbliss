import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MARKETPLACE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!stripeKey) {
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY" });
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      logStep("ERROR", { message: "Auth failed", error: authError });
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id ist erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("marketplace_bookings")
      .select("*")
      .eq("id", booking_id)
      .eq("customer_id", user.id)
      .single();

    if (bookingError || !booking) {
      logStep("ERROR", { message: "Booking not found", booking_id, error: bookingError });
      return new Response(JSON.stringify({ error: "Buchung nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Booking found", { bookingId: booking.id, bookingNumber: booking.booking_number });

    // Fetch service title via translation (prefer DE)
    const { data: translations } = await supabaseAdmin
      .from("marketplace_service_translations")
      .select("title, locale")
      .eq("service_id", booking.service_id)
      .in("locale", ["de", "en"]);

    let serviceTitle = "Marketplace Service";
    if (translations && translations.length > 0) {
      const deTx = translations.find((t: any) => t.locale === "de");
      serviceTitle = deTx?.title || translations[0]?.title || serviceTitle;
    }

    // Fetch agency display info (optional, used for receipt description)
    const { data: agency } = await supabaseAdmin
      .from("agencies")
      .select("name, slug")
      .eq("id", booking.agency_id)
      .single();

    const agencyName = agency?.name ?? "EventBliss Partner";

    // Calculate amount (charged in full to our Stripe account)
    const total = booking.total_price_cents;

    logStep("Creating checkout session (platform account)", {
      total,
      platformFee: booking.platform_fee_cents,
      agencyPayout: booking.agency_payout_cents,
      agencyId: booking.agency_id,
    });

    // Determine origin for redirect URLs
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://event-bliss.com";

    // Build rich metadata so the payment is traceable end-to-end to
    // booking / agency / customer without needing Stripe Connect.
    // NOTE: all metadata values must be strings <= 500 chars.
    const metadata: Record<string, string> = {
      booking_id: String(booking.id),
      booking_number: String(booking.booking_number ?? ""),
      agency_id: String(booking.agency_id),
      agency_name: String(agencyName).slice(0, 500),
      agency_slug: String(agency?.slug ?? ""),
      service_id: String(booking.service_id),
      customer_id: String(user.id),
      customer_email: String(booking.customer_email ?? user.email ?? ""),
      customer_name: String(booking.customer_name ?? "").slice(0, 500),
      booking_date: String(booking.booking_date ?? ""),
      booking_time: String(booking.booking_time ?? ""),
      participant_count: String(booking.participant_count ?? ""),
      total_price_cents: String(booking.total_price_cents ?? ""),
      platform_fee_cents: String(booking.platform_fee_cents ?? ""),
      agency_payout_cents: String(booking.agency_payout_cents ?? ""),
      source: "marketplace",
    };

    // Create Stripe Checkout Session on the platform account.
    // No transfer_data / destination → funds settle on our account.
    // Agency payout is handled off-Stripe (manual or later batch transfer)
    // and is tracked via marketplace_bookings.agency_payout_cents.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: booking.customer_email ?? user.email ?? undefined,
      client_reference_id: String(booking.id),
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: serviceTitle,
              description: `Buchung ${booking.booking_number} · ${agencyName}`,
              metadata: {
                booking_id: String(booking.id),
                agency_id: String(booking.agency_id),
              },
            },
            unit_amount: total,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        description: `EventBliss Buchung ${booking.booking_number} (${agencyName})`,
        metadata,
      },
      success_url: `${origin}/booking-success?booking=${booking_id}`,
      cancel_url: `${origin}/my-bookings?cancelled=true&booking=${booking_id}`,
      metadata,
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Update booking with checkout session ID
    const { error: updateError } = await supabaseAdmin
      .from("marketplace_bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking_id);

    if (updateError) {
      logStep("WARN", { message: "Failed to update booking with session ID", error: updateError });
    }

    return new Response(JSON.stringify({ url: session.url }), {
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
