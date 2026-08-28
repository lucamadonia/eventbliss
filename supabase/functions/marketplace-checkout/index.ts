import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getSafeOrigin } from "../_shared/origin.ts";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../_shared/rate-limit.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MARKETPLACE-CHECKOUT] ${step}${detailsStr}`);
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function json(corsHeaders: Record<string, string>, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function optionalUser(
  req: Request,
  supabaseAdmin: ReturnType<typeof createClient>,
): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  // The service client can verify the supplied user JWT without relying on
  // SUPABASE_ANON_KEY being present in the Edge runtime.
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(corsHeaders, { error: "Method not allowed" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
    logStep("ERROR", { message: "Missing server configuration" });
    return json(corsHeaders, { error: "Server configuration error" }, 500);
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    const body = await req.json();
    const user = await optionalUser(req, supabaseAdmin);
    const isGuestCreation = body?.action === "create_guest_booking";
    const bookingLanguage = cleanText(body?.locale, 2).toLowerCase() || null;

    let booking: any;
    let guestPublicPath: string | null = null;
    let serviceSlug = "";

    if (isGuestCreation) {
      if (!checkRateLimit("marketplace-guest-booking", getClientIp(req), 5, 60_000)) {
        return rateLimitResponse(corsHeaders);
      }

      const serviceId = cleanText(body?.service_id, 64);
      const bookingDate = cleanText(body?.booking_date, 10);
      const bookingTime = cleanText(body?.booking_time, 5);
      const customerName = cleanText(body?.customer_name, 120);
      const customerEmail = cleanText(body?.customer_email, 320).toLowerCase();
      const customerPhone = cleanText(body?.customer_phone, 40) || null;
      const customerNotes = cleanText(body?.customer_notes, 1000) || null;
      const participantCount = Number(body?.participant_count);

      if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || !TIME_RE.test(bookingTime)) {
        return json(corsHeaders, { error: "Bitte wähle einen gültigen Termin." }, 400);
      }
      if (!customerName || !EMAIL_RE.test(customerEmail)) {
        return json(corsHeaders, { error: "Name und gültige E-Mail-Adresse sind erforderlich." }, 400);
      }
      if (!Number.isInteger(participantCount) || participantCount < 1 || participantCount > 500) {
        return json(corsHeaders, { error: "Ungültige Teilnehmerzahl." }, 400);
      }

      const { data: service, error: serviceError } = await supabaseAdmin
        .from("marketplace_services")
        .select("id, slug, agency_id, status, price_cents, price_type, min_participants, max_participants, capacity_per_slot, groups_per_slot, advance_booking_days, auto_confirm, payment_method")
        .eq("id", serviceId)
        .eq("status", "approved")
        .single();

      if (serviceError || !service) {
        return json(corsHeaders, { error: "Dieses Angebot ist nicht mehr buchbar." }, 404);
      }

      const minParticipants = service.min_participants ?? 1;
      const maxParticipants = service.max_participants ?? 500;
      if (participantCount < minParticipants || participantCount > maxParticipants) {
        return json(corsHeaders, {
          error: `Für dieses Angebot sind ${minParticipants} bis ${maxParticipants} Personen möglich.`,
        }, 400);
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const earliest = new Date(today);
      earliest.setUTCDate(earliest.getUTCDate() + Math.max(0, service.advance_booking_days ?? 0));
      const requestedDate = new Date(`${bookingDate}T00:00:00Z`);
      if (Number.isNaN(requestedDate.getTime()) || requestedDate < earliest) {
        return json(corsHeaders, { error: "Dieser Termin liegt außerhalb des Buchungszeitraums." }, 400);
      }

      const { data: blockedDate } = await supabaseAdmin
        .from("marketplace_blocked_dates")
        .select("blocked_date")
        .eq("service_id", service.id)
        .eq("blocked_date", bookingDate)
        .maybeSingle();
      if (blockedDate) return json(corsHeaders, { error: "Dieser Tag ist nicht verfügbar." }, 409);

      const { data: slotBookings, error: slotError } = await supabaseAdmin
        .from("marketplace_bookings")
        .select("participant_count")
        .eq("service_id", service.id)
        .eq("booking_date", bookingDate)
        .eq("booking_time", bookingTime)
        .not("status", "in", '("cancelled_by_customer","cancelled_by_agency","refunded")');
      if (slotError) throw slotError;

      const participantsBooked = (slotBookings ?? []).reduce(
        (sum: number, row: any) => sum + Number(row.participant_count ?? 0),
        0,
      );
      const groupsBooked = slotBookings?.length ?? 0;
      const groupsPerSlot = Math.max(1, service.groups_per_slot ?? 1);
      const slotCapacity = Math.max(1, service.capacity_per_slot ?? 10) * groupsPerSlot;
      if (participantsBooked + participantCount > slotCapacity || groupsBooked >= groupsPerSlot) {
        return json(corsHeaders, {
          error: "Dieser Zeitslot ist für die gewünschte Gruppe nicht mehr frei.",
        }, 409);
      }

      const unitPriceCents = Math.max(0, Number(service.price_cents ?? 0));
      const totalPriceCents = service.price_type === "per_person"
        ? unitPriceCents * participantCount
        : unitPriceCents;
      const platformFeeCents = Math.round(totalPriceCents * 0.10);
      const paymentMethod = service.payment_method === "on_site" ? "on_site" : "online";
      const status = paymentMethod === "on_site"
        ? (service.auto_confirm ? "confirmed" : "pending_confirmation")
        : "pending_payment";

      const { data: created, error: createError } = await supabaseAdmin
        .from("marketplace_bookings")
        .insert({
          service_id: service.id,
          agency_id: service.agency_id,
          customer_id: user?.id ?? null,
          event_id: null,
          status,
          booking_date: bookingDate,
          booking_time: bookingTime,
          participant_count: participantCount,
          unit_price_cents: unitPriceCents,
          total_price_cents: totalPriceCents,
          platform_fee_cents: platformFeeCents,
          agency_payout_cents: totalPriceCents - platformFeeCents,
          currency: "EUR",
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_notes: customerNotes,
          payment_method: paymentMethod,
          language: bookingLanguage ?? "de",
          confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
        })
        .select("*")
        .single();

      if (createError || !created) {
        if (createError?.code === "23505") {
          return json(corsHeaders, {
            error: "Dieser Zeitslot wurde gerade vergeben. Bitte wähle einen anderen.",
          }, 409);
        }
        throw createError ?? new Error("Guest booking could not be created");
      }

      booking = created;
      serviceSlug = service.slug;
      guestPublicPath = `/booking/${encodeURIComponent(created.booking_number)}?t=${encodeURIComponent(created.public_token)}`;
      logStep("Guest booking created", { bookingId: created.id, bookingNumber: created.booking_number });
    } else {
      if (!user) return json(corsHeaders, { error: "Nicht autorisiert" }, 401);

      const bookingId = cleanText(body?.booking_id, 64);
      if (!bookingId) return json(corsHeaders, { error: "booking_id ist erforderlich" }, 400);

      const { data: ownedBooking, error: bookingError } = await supabaseAdmin
        .from("marketplace_bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("customer_id", user.id)
        .single();
      if (bookingError || !ownedBooking) {
        return json(corsHeaders, { error: "Buchung nicht gefunden" }, 404);
      }
      booking = ownedBooking;
    }

    const { data: translations } = await supabaseAdmin
      .from("marketplace_service_translations")
      .select("title, locale")
      .eq("service_id", booking.service_id)
      .in("locale", [bookingLanguage ?? "de", "de", "en"]);
    const preferredTitle = translations?.find((t: any) => t.locale === bookingLanguage)?.title;
    const germanTitle = translations?.find((t: any) => t.locale === "de")?.title;
    const serviceTitle = preferredTitle || germanTitle || translations?.[0]?.title || "Marketplace Service";

    const { data: agency } = await supabaseAdmin
      .from("agencies")
      .select("name, slug")
      .eq("id", booking.agency_id)
      .single();
    const agencyName = agency?.name ?? "EventBliss Partner";

    if (booking.payment_method === "on_site") {
      return json(corsHeaders, {
        id: booking.id,
        booking_number: booking.booking_number,
        paymentMethod: "on_site",
        publicPath: guestPublicPath,
      });
    }

    const origin = getSafeOrigin(req);
    const customerId = user?.id ? String(user.id) : "guest";
    const metadata: Record<string, string> = {
      booking_id: String(booking.id),
      booking_number: String(booking.booking_number ?? ""),
      agency_id: String(booking.agency_id),
      agency_name: String(agencyName).slice(0, 500),
      agency_slug: String(agency?.slug ?? ""),
      service_id: String(booking.service_id),
      customer_id: customerId,
      customer_email: String(booking.customer_email ?? user?.email ?? ""),
      customer_name: String(booking.customer_name ?? "").slice(0, 500),
      booking_date: String(booking.booking_date ?? ""),
      booking_time: String(booking.booking_time ?? ""),
      participant_count: String(booking.participant_count ?? ""),
      total_price_cents: String(booking.total_price_cents ?? ""),
      platform_fee_cents: String(booking.platform_fee_cents ?? ""),
      agency_payout_cents: String(booking.agency_payout_cents ?? ""),
      source: user ? "marketplace" : "marketplace_guest",
    };

    const successPath = guestPublicPath ?? `/booking-success?booking=${encodeURIComponent(booking.id)}`;
    const cancelPath = guestPublicPath
      ? `/marketplace/service/${encodeURIComponent(serviceSlug)}`
      : `/my-bookings?cancelled=true&booking=${encodeURIComponent(booking.id)}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.customer_email ?? user?.email ?? undefined,
      client_reference_id: String(booking.id),
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: serviceTitle,
            description: `Buchung ${booking.booking_number} · ${agencyName}`,
            metadata: { booking_id: String(booking.id), agency_id: String(booking.agency_id) },
          },
          unit_amount: booking.total_price_cents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        description: `EventBliss Buchung ${booking.booking_number} (${agencyName})`,
        metadata,
      },
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata,
    });

    const bookingUpdate: Record<string, unknown> = { stripe_checkout_session_id: session.id };
    if (bookingLanguage) bookingUpdate.language = bookingLanguage;
    const { error: updateError } = await supabaseAdmin
      .from("marketplace_bookings")
      .update(bookingUpdate)
      .eq("id", booking.id);
    if (updateError) logStep("WARN", { message: "Checkout session update failed", error: updateError });

    logStep("Checkout session created", { bookingId: booking.id, sessionId: session.id, guest: !user });
    return json(corsHeaders, {
      url: session.url,
      id: booking.id,
      booking_number: booking.booking_number,
      paymentMethod: "online",
      publicPath: guestPublicPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return json(corsHeaders, { error: "Die Buchung konnte nicht abgeschlossen werden." }, 500);
  }
});
