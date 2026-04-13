import type {
  BookingProvider,
  DateRange,
  ExternalBookingParams,
  ExternalBookingResult,
  TimeSlot,
  WebhookEvent,
} from './types';

const CALCOM_API_BASE = 'https://api.cal.com';

/**
 * cal.com API v2 provider.
 *
 * Authentication is via API key (no OAuth required).
 */
export class CalcomProvider implements BookingProvider {
  id = 'cal_com';
  name = 'cal_com';
  displayName = 'Cal.com';
  logoUrl = 'https://cal.com/logo.svg';

  // ---- Configuration check ----

  isConfigured(config: Record<string, any>): boolean {
    return Boolean(config.apiKey);
  }

  // ---- Availability ----

  async getAvailability(config: Record<string, any>, dateRange: DateRange): Promise<TimeSlot[]> {
    const { apiKey, eventTypeId } = config;

    if (!apiKey || !eventTypeId) {
      throw new Error('Cal.com: apiKey und eventTypeId werden benötigt');
    }

    const url = new URL(`${CALCOM_API_BASE}/v2/slots/available`);
    url.searchParams.set('startTime', `${dateRange.start}T00:00:00Z`);
    url.searchParams.set('endTime', `${dateRange.end}T23:59:59Z`);
    url.searchParams.set('eventTypeId', eventTypeId);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Cal.com Verfügbarkeitsabfrage fehlgeschlagen: ${response.status} – ${errorBody}`);
    }

    const data = await response.json();

    // cal.com v2 returns { data: { slots: { "YYYY-MM-DD": [{ time: "..." }] } } }
    const slotsMap: Record<string, any[]> = data.data?.slots || {};
    const slots: TimeSlot[] = [];

    for (const [date, daySlots] of Object.entries(slotsMap)) {
      for (const slot of daySlots) {
        const startDate = new Date(slot.time);
        // Default 30min duration if not provided
        const endDate = new Date(startDate.getTime() + (config.durationMinutes || 30) * 60_000);

        slots.push({
          date,
          startTime: startDate.toISOString().slice(11, 16),
          endTime: endDate.toISOString().slice(11, 16),
          available: true,
        });
      }
    }

    return slots;
  }

  // ---- Create booking ----

  async createBooking(
    config: Record<string, any>,
    params: ExternalBookingParams,
  ): Promise<ExternalBookingResult> {
    const { apiKey, eventTypeId } = config;

    if (!apiKey || !eventTypeId) {
      throw new Error('Cal.com: apiKey und eventTypeId werden für Buchungen benötigt');
    }

    const response = await fetch(`${CALCOM_API_BASE}/v2/bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify({
        eventTypeId: Number(eventTypeId),
        start: `${params.date}T${params.time}:00Z`,
        attendee: {
          name: params.customerName,
          email: params.customerEmail,
          timeZone: config.timeZone || 'Europe/Berlin',
        },
        metadata: {
          serviceId: params.serviceId,
          agencyId: params.agencyId,
          participantCount: params.participantCount,
          phone: params.customerPhone,
          notes: params.customerNotes,
          source: 'eventbliss',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Cal.com Buchung fehlgeschlagen: ${response.status} – ${errorBody}`);
    }

    const data = await response.json();
    const booking = data.data;

    return {
      externalBookingId: String(booking.id || booking.uid),
      confirmationUrl: booking.meetingUrl || undefined,
      status: booking.status === 'ACCEPTED' ? 'confirmed' : 'pending',
    };
  }

  // ---- Cancel booking ----

  async cancelBooking(config: Record<string, any>, externalBookingId: string): Promise<void> {
    const { apiKey } = config;
    if (!apiKey) {
      throw new Error('Cal.com: apiKey wird für Stornierung benötigt');
    }

    const response = await fetch(`${CALCOM_API_BASE}/v2/bookings/${externalBookingId}/cancel`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify({
        cancellationReason: 'Cancelled via EventBliss',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Cal.com Stornierung fehlgeschlagen: ${response.status} – ${errorBody}`);
    }
  }

  // ---- Webhook validation ----

  async validateWebhook(
    request: { headers: Record<string, string>; body: string },
    secret: string,
  ): Promise<WebhookEvent | null> {
    // cal.com signs webhooks with a secret via HMAC-SHA256 in the X-Cal-Signature-256 header
    const signature =
      request.headers['x-cal-signature-256'] || request.headers['X-Cal-Signature-256'];

    if (!signature) return null;

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
    const triggerEvent: string = payload.triggerEvent || '';

    const typeMap: Record<string, WebhookEvent['type']> = {
      BOOKING_CREATED: 'booking_created',
      BOOKING_CANCELLED: 'booking_cancelled',
      BOOKING_RESCHEDULED: 'booking_rescheduled',
      BOOKING_COMPLETED: 'booking_completed',
    };

    const mappedType = typeMap[triggerEvent];
    if (!mappedType) return null;

    const bookingPayload = payload.payload || {};

    return {
      type: mappedType,
      externalBookingId: String(bookingPayload.bookingId || bookingPayload.uid || ''),
      data: bookingPayload,
    };
  }
}
