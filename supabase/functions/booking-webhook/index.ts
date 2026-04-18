import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BOOKING-WEBHOOK] ${step}${detailsStr}`);
};

// ---- Inline provider webhook validators ----
// Edge Functions run in Deno and cannot import from src/lib directly.
// We duplicate the minimal webhook validation logic here.

async function hmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const buf = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface WebhookEvent {
  type: 'booking_created' | 'booking_cancelled' | 'booking_rescheduled' | 'booking_completed';
  externalBookingId: string;
  data: Record<string, any>;
}

async function validateCalendlyWebhook(
  headers: Record<string, string>,
  body: string,
  secret: string,
): Promise<WebhookEvent | null> {
  const signature = headers['calendly-webhook-signature'];
  if (!signature) return null;

  const parts = signature.split(',');
  const tPart = parts.find((p: string) => p.startsWith('t='));
  const vPart = parts.find((p: string) => p.startsWith('v1='));
  if (!tPart || !vPart) return null;

  const timestamp = tPart.slice(2);
  const expectedSig = vPart.slice(3);
  const computed = await hmacSha256(secret, `${timestamp}.${body}`);
  if (computed !== expectedSig) return null;

  const payload = JSON.parse(body);
  const typeMap: Record<string, WebhookEvent['type']> = {
    'invitee.created': 'booking_created',
    'invitee.canceled': 'booking_cancelled',
  };
  const mapped = typeMap[payload.event];
  if (!mapped) return null;

  const eventUri: string = payload.payload?.event || '';
  return {
    type: mapped,
    externalBookingId: eventUri.split('/').pop() || '',
    data: payload.payload || {},
  };
}

async function validateCalcomWebhook(
  headers: Record<string, string>,
  body: string,
  secret: string,
): Promise<WebhookEvent | null> {
  const signature = headers['x-cal-signature-256'];
  if (!signature) return null;

  const computed = await hmacSha256(secret, body);
  if (computed !== signature) return null;

  const payload = JSON.parse(body);
  const typeMap: Record<string, WebhookEvent['type']> = {
    BOOKING_CREATED: 'booking_created',
    BOOKING_CANCELLED: 'booking_cancelled',
    BOOKING_RESCHEDULED: 'booking_rescheduled',
    BOOKING_COMPLETED: 'booking_completed',
  };
  const mapped = typeMap[payload.triggerEvent];
  if (!mapped) return null;

  const bp = payload.payload || {};
  return {
    type: mapped,
    externalBookingId: String(bp.bookingId || bp.uid || ''),
    data: bp,
  };
}

async function validateCustomApiWebhook(
  headers: Record<string, string>,
  body: string,
  secret: string,
): Promise<WebhookEvent | null> {
  const signature = headers['x-webhook-signature'];
  if (!signature) return null;

  const computed = await hmacSha256(secret, body);
  if (computed !== signature) return null;

  const payload = JSON.parse(body);
  const eventType: string = payload.type || payload.event || payload.eventType || '';
  const typeMap: Record<string, WebhookEvent['type']> = {
    booking_created: 'booking_created',
    booking_cancelled: 'booking_cancelled',
    booking_canceled: 'booking_cancelled',
    booking_rescheduled: 'booking_rescheduled',
    booking_completed: 'booking_completed',
  };
  const mapped = typeMap[eventType];
  if (!mapped) return null;

  return {
    type: mapped,
    externalBookingId: String(payload.externalBookingId || payload.bookingId || payload.id || ''),
    data: payload.data || payload,
  };
}

type WebhookValidator = (
  headers: Record<string, string>,
  body: string,
  secret: string,
) => Promise<WebhookEvent | null>;

const validators: Record<string, WebhookValidator> = {
  calendly: validateCalendlyWebhook,
  cal_com: validateCalcomWebhook,
  custom_api: validateCustomApiWebhook,
};

// ---- Generate booking number ----

function generateBookingNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EB-${datePart}-${rand}`;
}

// ---- Main handler ----

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');
    const agencyId = url.searchParams.get('agency_id');

    if (!provider || !agencyId) {
      logStep('FEHLER: Fehlende Query-Parameter', { provider, agencyId });
      return new Response(
        JSON.stringify({ error: 'provider und agency_id werden als Query-Parameter benötigt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const validate = validators[provider];
    if (!validate) {
      logStep('FEHLER: Unbekannter Provider', { provider });
      return new Response(
        JSON.stringify({ error: `Unbekannter Booking-Provider: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    // Look up the agency's provider config to get webhook secret
    logStep('Provider-Konfiguration wird abgerufen', { agencyId, provider });

    const { data: services, error: serviceError } = await supabaseClient
      .from('marketplace_services')
      .select('id, external_provider_config')
      .eq('agency_id', agencyId)
      .eq('external_provider', provider)
      .limit(1);

    if (serviceError || !services || services.length === 0) {
      logStep('FEHLER: Kein Service mit diesem Provider gefunden', { agencyId, provider, error: serviceError });
      return new Response(
        JSON.stringify({ error: 'Kein konfigurierter Service für diesen Provider gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const service = services[0];
    const providerConfig = service.external_provider_config || {};
    const webhookSecret: string = providerConfig.webhookSecret || '';

    if (!webhookSecret) {
      logStep('FEHLER: Kein Webhook-Secret konfiguriert', { agencyId, provider });
      return new Response(
        JSON.stringify({ error: 'Webhook-Secret nicht konfiguriert' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Read body and normalize headers to lowercase
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value: string, key: string) => {
      headers[key.toLowerCase()] = value;
    });

    // Validate webhook signature
    logStep('Webhook-Signatur wird validiert', { provider });
    const event = await validate(headers, body, webhookSecret);

    if (!event) {
      logStep('FEHLER: Ungültige Webhook-Signatur', { provider });
      return new Response(
        JSON.stringify({ error: 'Ungültige Webhook-Signatur' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    logStep('Webhook-Event empfangen', { type: event.type, externalId: event.externalBookingId });

    // Process event based on type
    switch (event.type) {
      case 'booking_created': {
        logStep('Neue Buchung wird angelegt', { externalId: event.externalBookingId });

        const customerName = event.data.name || event.data.invitee?.name || 'Unbekannt';
        const customerEmail = event.data.email || event.data.invitee?.email || '';
        const customerPhone = event.data.phone || event.data.invitee?.phone || null;
        const bookingDate = event.data.date || event.data.scheduled_event?.start_time?.split('T')[0] || new Date().toISOString().split('T')[0];
        const bookingTime = event.data.time || event.data.scheduled_event?.start_time?.slice(11, 16) || '00:00';
        const participantCount = event.data.participantCount || event.data.participant_count || 1;

        // Pull the service's actual price so the external booking isn't
        // stored as a 0 € row (which would then surface as a fake 0 € on
        // /my-bookings if ever joined). External providers don't tell us
        // the paid amount, so we use the service's list price as the
        // authoritative EventBliss-side figure.
        const unitPrice = service.price_cents ?? 0;
        const totalFromService = service.price_type === 'per_person'
          ? unitPrice * participantCount
          : unitPrice;
        const platformFee = Math.round(totalFromService * 0.10);
        const agencyPayout = totalFromService - platformFee;

        const { error: insertError } = await supabaseClient
          .from('marketplace_bookings')
          .insert({
            booking_number: generateBookingNumber(),
            service_id: service.id,
            agency_id: agencyId,
            // Use a system/placeholder customer_id for external bookings;
            // the real customer may not have an EventBliss account.
            customer_id: agencyId, // Agency acts as placeholder
            status: 'confirmed',
            booking_date: bookingDate,
            booking_time: bookingTime,
            participant_count: participantCount,
            unit_price_cents: unitPrice,
            total_price_cents: totalFromService,
            platform_fee_cents: platformFee,
            agency_payout_cents: agencyPayout,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            customer_notes: `Externe Buchung via ${provider} | ID: ${event.externalBookingId}`,
            confirmed_at: new Date().toISOString(),
          });

        if (insertError) {
          logStep('FEHLER: Buchung konnte nicht angelegt werden', { error: insertError });
          return new Response(
            JSON.stringify({ error: 'Buchung konnte nicht gespeichert werden' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        logStep('Buchung erfolgreich angelegt', { externalId: event.externalBookingId });
        break;
      }

      case 'booking_cancelled': {
        logStep('Buchung wird storniert', { externalId: event.externalBookingId });

        // Find the booking by external ID stored in customer_notes
        const { data: bookings } = await supabaseClient
          .from('marketplace_bookings')
          .select('id')
          .eq('service_id', service.id)
          .like('customer_notes', `%${event.externalBookingId}%`)
          .limit(1);

        if (bookings && bookings.length > 0) {
          const { error: updateError } = await supabaseClient
            .from('marketplace_bookings')
            .update({
              status: 'cancelled_by_customer',
              cancelled_at: new Date().toISOString(),
              cancellation_reason: `Storniert via ${provider} Webhook`,
            })
            .eq('id', bookings[0].id);

          if (updateError) {
            logStep('FEHLER: Buchung konnte nicht storniert werden', { error: updateError });
          } else {
            logStep('Buchung erfolgreich storniert', { bookingId: bookings[0].id });
          }
        } else {
          logStep('WARNUNG: Keine passende Buchung für Stornierung gefunden', { externalId: event.externalBookingId });
        }
        break;
      }

      case 'booking_rescheduled': {
        logStep('Buchung wird umgebucht', { externalId: event.externalBookingId });

        const newDate = event.data.date || event.data.new_start_time?.split('T')[0];
        const newTime = event.data.time || event.data.new_start_time?.slice(11, 16);

        const { data: bookings } = await supabaseClient
          .from('marketplace_bookings')
          .select('id')
          .eq('service_id', service.id)
          .like('customer_notes', `%${event.externalBookingId}%`)
          .limit(1);

        if (bookings && bookings.length > 0) {
          const updateData: Record<string, any> = {};
          if (newDate) updateData.booking_date = newDate;
          if (newTime) updateData.booking_time = newTime;

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabaseClient
              .from('marketplace_bookings')
              .update(updateData)
              .eq('id', bookings[0].id);

            if (updateError) {
              logStep('FEHLER: Buchung konnte nicht umgebucht werden', { error: updateError });
            } else {
              logStep('Buchung erfolgreich umgebucht', { bookingId: bookings[0].id, newDate, newTime });
            }
          }
        } else {
          logStep('WARNUNG: Keine passende Buchung für Umbuchung gefunden', { externalId: event.externalBookingId });
        }
        break;
      }

      case 'booking_completed': {
        logStep('Buchung als abgeschlossen markiert', { externalId: event.externalBookingId });

        const { data: bookings } = await supabaseClient
          .from('marketplace_bookings')
          .select('id')
          .eq('service_id', service.id)
          .like('customer_notes', `%${event.externalBookingId}%`)
          .limit(1);

        if (bookings && bookings.length > 0) {
          const { error: updateError } = await supabaseClient
            .from('marketplace_bookings')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', bookings[0].id);

          if (updateError) {
            logStep('FEHLER: Buchung konnte nicht als abgeschlossen markiert werden', { error: updateError });
          } else {
            logStep('Buchung erfolgreich abgeschlossen', { bookingId: bookings[0].id });
          }
        } else {
          logStep('WARNUNG: Keine passende Buchung gefunden', { externalId: event.externalBookingId });
        }
        break;
      }

      default:
        logStep('Unbekannter Event-Typ, wird ignoriert', { type: event.type });
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('FEHLER: Unerwarteter Fehler', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
