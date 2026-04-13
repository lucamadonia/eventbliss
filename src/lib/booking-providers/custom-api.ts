import type {
  BookingProvider,
  DateRange,
  ExternalBookingParams,
  ExternalBookingResult,
  TimeSlot,
  WebhookEvent,
} from './types';

/**
 * Generic provider for agencies with their own booking system.
 *
 * Agencies configure custom endpoint URLs in `external_provider_config`:
 *   - customEndpoints.availability  (GET)
 *   - customEndpoints.createBooking (POST)
 *   - customEndpoints.cancelBooking (DELETE)
 *
 * All endpoints are authenticated via Bearer token from `config.apiKey`.
 * Webhook validation uses HMAC-SHA256 in the `X-Webhook-Signature` header.
 */
export class CustomApiProvider implements BookingProvider {
  id = 'custom_api';
  name = 'custom_api';
  displayName = 'Custom API';
  logoUrl = undefined;

  // ---- Configuration check ----

  isConfigured(config: Record<string, any>): boolean {
    const endpoints = config.customEndpoints || {};
    return Boolean(endpoints.availability || endpoints.createBooking);
  }

  // ---- Availability ----

  async getAvailability(config: Record<string, any>, dateRange: DateRange): Promise<TimeSlot[]> {
    const endpoint = config.customEndpoints?.availability;
    if (!endpoint) {
      throw new Error('Custom API: availability-Endpoint ist nicht konfiguriert');
    }

    const url = new URL(endpoint);
    url.searchParams.set('start', dateRange.start);
    url.searchParams.set('end', dateRange.end);

    const response = await fetch(url.toString(), {
      headers: buildAuthHeaders(config),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Custom API Verfügbarkeitsabfrage fehlgeschlagen: ${response.status} – ${errorBody}`);
    }

    const data = await response.json();

    // Expect the external API to return an array of slot objects.
    // We attempt to map common field names to our TimeSlot interface.
    const rawSlots: any[] = Array.isArray(data) ? data : data.slots || data.data || [];

    return rawSlots.map((slot: any) => ({
      date: slot.date || slot.day || '',
      startTime: slot.startTime || slot.start_time || slot.start || '',
      endTime: slot.endTime || slot.end_time || slot.end || '',
      available: slot.available !== false,
      maxCapacity: slot.maxCapacity || slot.max_capacity,
      currentBookings: slot.currentBookings || slot.current_bookings,
    }));
  }

  // ---- Create booking ----

  async createBooking(
    config: Record<string, any>,
    params: ExternalBookingParams,
  ): Promise<ExternalBookingResult> {
    const endpoint = config.customEndpoints?.createBooking;
    if (!endpoint) {
      throw new Error('Custom API: createBooking-Endpoint ist nicht konfiguriert');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...buildAuthHeaders(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: params.serviceId,
        agencyId: params.agencyId,
        date: params.date,
        time: params.time,
        participantCount: params.participantCount,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        customerNotes: params.customerNotes,
        source: 'eventbliss',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Custom API Buchung fehlgeschlagen: ${response.status} – ${errorBody}`);
    }

    const data = await response.json();

    return {
      externalBookingId: String(
        data.externalBookingId || data.bookingId || data.id || '',
      ),
      confirmationUrl: data.confirmationUrl || data.confirmation_url,
      status: data.status === 'confirmed' ? 'confirmed' : 'pending',
    };
  }

  // ---- Cancel booking ----

  async cancelBooking(config: Record<string, any>, externalBookingId: string): Promise<void> {
    const endpoint = config.customEndpoints?.cancelBooking;
    if (!endpoint) {
      throw new Error('Custom API: cancelBooking-Endpoint ist nicht konfiguriert');
    }

    const url = `${endpoint.replace(/\/+$/, '')}/${externalBookingId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: buildAuthHeaders(config),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Custom API Stornierung fehlgeschlagen: ${response.status} – ${errorBody}`);
    }
  }

  // ---- Webhook validation ----

  async validateWebhook(
    request: { headers: Record<string, string>; body: string },
    secret: string,
  ): Promise<WebhookEvent | null> {
    const signature =
      request.headers['x-webhook-signature'] || request.headers['X-Webhook-Signature'];

    if (!signature) return null;

    // HMAC-SHA256 of the raw body
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(request.body));
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSig !== signature) return null;

    const payload = JSON.parse(request.body);

    // Expect the external system to send a standardized event type
    const eventType: string = payload.type || payload.event || payload.eventType || '';

    const typeMap: Record<string, WebhookEvent['type']> = {
      booking_created: 'booking_created',
      booking_cancelled: 'booking_cancelled',
      booking_canceled: 'booking_cancelled',
      booking_rescheduled: 'booking_rescheduled',
      booking_completed: 'booking_completed',
    };

    const mappedType = typeMap[eventType];
    if (!mappedType) return null;

    return {
      type: mappedType,
      externalBookingId: String(
        payload.externalBookingId || payload.bookingId || payload.id || '',
      ),
      data: payload.data || payload,
    };
  }
}

// ---- Helpers ----

function buildAuthHeaders(config: Record<string, any>): Record<string, string> {
  const headers: Record<string, string> = {};
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  return headers;
}
