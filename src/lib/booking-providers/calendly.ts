import type {
  BookingProvider,
  DateRange,
  ExternalBookingParams,
  ExternalBookingResult,
  TimeSlot,
  WebhookEvent,
} from './types';

const CALENDLY_API_BASE = 'https://api.calendly.com';
const CALENDLY_AUTH_BASE = 'https://auth.calendly.com';
const CALENDLY_CLIENT_ID = ''; // Set via environment / config

/**
 * Calendly v2 API provider.
 *
 * Notes:
 * - Calendly does not expose a direct "create booking" API; bookings are
 *   created through their hosted scheduling page. `createBooking` therefore
 *   returns a `confirmationUrl` that the customer should be redirected to.
 * - Availability is fetched via the event_type_available_times endpoint.
 * - Webhook validation uses the `Calendly-Webhook-Signature` header.
 */
export class CalendlyProvider implements BookingProvider {
  id = 'calendly';
  name = 'calendly';
  displayName = 'Calendly';
  logoUrl = 'https://assets.calendly.com/assets/logo.svg';

  // ---- Configuration check ----

  isConfigured(config: Record<string, any>): boolean {
    return Boolean(config.accessToken || config.apiKey);
  }

  // ---- Availability ----

  async getAvailability(config: Record<string, any>, dateRange: DateRange): Promise<TimeSlot[]> {
    const token = config.accessToken || config.apiKey;
    const eventTypeId = config.eventTypeId;

    if (!token || !eventTypeId) {
      throw new Error('Calendly: accessToken/apiKey und eventTypeId werden benötigt');
    }

    const url = new URL(`${CALENDLY_API_BASE}/event_type_available_times`);
    url.searchParams.set('event_type', eventTypeId);
    url.searchParams.set('start_time', `${dateRange.start}T00:00:00Z`);
    url.searchParams.set('end_time', `${dateRange.end}T23:59:59Z`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Calendly Verfügbarkeitsabfrage fehlgeschlagen: ${response.status} – ${errorBody}`);
    }

    const data = await response.json();
    const slots: TimeSlot[] = (data.collection ?? []).map((slot: any) => {
      const start = new Date(slot.start_time);
      const end = slot.end_time ? new Date(slot.end_time) : new Date(start.getTime() + 30 * 60_000);

      return {
        date: start.toISOString().split('T')[0],
        startTime: start.toISOString().slice(11, 16),
        endTime: end.toISOString().slice(11, 16),
        available: slot.status === 'available',
      } satisfies TimeSlot;
    });

    return slots;
  }

  // ---- Create booking (redirect-based) ----

  async createBooking(
    config: Record<string, any>,
    params: ExternalBookingParams,
  ): Promise<ExternalBookingResult> {
    // Calendly does not support direct booking creation via API.
    // Build a pre-filled scheduling link instead.
    const schedulingUrl = config.schedulingUrl || config.eventTypeUrl;

    if (!schedulingUrl) {
      throw new Error('Calendly: schedulingUrl / eventTypeUrl wird für Buchungserstellung benötigt');
    }

    const url = new URL(schedulingUrl);
    url.searchParams.set('name', params.customerName);
    url.searchParams.set('email', params.customerEmail);
    if (params.customerPhone) {
      url.searchParams.set('a1', params.customerPhone); // custom answer slot
    }
    if (params.customerNotes) {
      url.searchParams.set('a2', params.customerNotes);
    }

    return {
      externalBookingId: `calendly_pending_${Date.now()}`,
      confirmationUrl: url.toString(),
      status: 'pending',
    };
  }

  // ---- Cancel booking ----

  async cancelBooking(config: Record<string, any>, externalBookingId: string): Promise<void> {
    const token = config.accessToken || config.apiKey;
    if (!token) {
      throw new Error('Calendly: accessToken/apiKey wird für Stornierung benötigt');
    }

    const response = await fetch(
      `${CALENDLY_API_BASE}/scheduled_events/${externalBookingId}/cancellation`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Cancelled via EventBliss' }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Calendly Stornierung fehlgeschlagen: ${response.status} – ${errorBody}`);
    }
  }

  // ---- Webhook validation ----

  async validateWebhook(
    request: { headers: Record<string, string>; body: string },
    secret: string,
  ): Promise<WebhookEvent | null> {
    const signature = request.headers['calendly-webhook-signature'] || request.headers['Calendly-Webhook-Signature'];
    if (!signature) return null;

    // Calendly signature format: "t=<timestamp>,v1=<hash>"
    const parts = signature.split(',');
    const timestampPart = parts.find((p: string) => p.startsWith('t='));
    const signaturePart = parts.find((p: string) => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) return null;

    const timestamp = timestampPart.slice(2);
    const expectedSig = signaturePart.slice(3);

    // Build the signed payload: "<timestamp>.<body>"
    const signedPayload = `${timestamp}.${request.body}`;

    // Compute HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSig !== expectedSig) return null;

    // Parse event payload
    const payload = JSON.parse(request.body);
    const eventType = payload.event;

    const typeMap: Record<string, WebhookEvent['type']> = {
      'invitee.created': 'booking_created',
      'invitee.canceled': 'booking_cancelled',
    };

    const mappedType = typeMap[eventType];
    if (!mappedType) return null;

    const inviteeUri: string = payload.payload?.uri || '';
    const eventUri: string = payload.payload?.event || '';
    // Extract UUID from URI (last segment)
    const externalId = eventUri.split('/').pop() || inviteeUri.split('/').pop() || '';

    return {
      type: mappedType,
      externalBookingId: externalId,
      data: payload.payload || {},
    };
  }

  // ---- OAuth ----

  getAuthUrl(agencyId: string, redirectUrl: string): string {
    const url = new URL(`${CALENDLY_AUTH_BASE}/oauth/authorize`);
    url.searchParams.set('client_id', CALENDLY_CLIENT_ID);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUrl);
    url.searchParams.set('state', agencyId);
    return url.toString();
  }

  async handleCallback(code: string, _agencyId: string): Promise<Record<string, any>> {
    const response = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: CALENDLY_CLIENT_ID,
        redirect_uri: '', // must match the original redirect_uri
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Calendly OAuth fehlgeschlagen: ${response.status} – ${errorBody}`);
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      tokenType: tokens.token_type,
    };
  }
}
