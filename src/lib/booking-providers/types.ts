export interface TimeSlot {
  date: string;       // ISO date
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  available: boolean;
  maxCapacity?: number;
  currentBookings?: number;
}

export interface DateRange {
  start: string;  // ISO date
  end: string;    // ISO date
}

export interface ExternalBookingParams {
  serviceId: string;
  agencyId: string;
  date: string;
  time: string;
  participantCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerNotes?: string;
}

export interface ExternalBookingResult {
  externalBookingId: string;
  confirmationUrl?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface WebhookEvent {
  type: 'booking_created' | 'booking_cancelled' | 'booking_rescheduled' | 'booking_completed';
  externalBookingId: string;
  data: Record<string, any>;
}

export interface BookingProvider {
  id: string;
  name: string;
  displayName: string;
  logoUrl?: string;

  // Check if provider is configured for this agency
  isConfigured(config: Record<string, any>): boolean;

  // Get available time slots
  getAvailability(config: Record<string, any>, dateRange: DateRange): Promise<TimeSlot[]>;

  // Create a booking
  createBooking(config: Record<string, any>, params: ExternalBookingParams): Promise<ExternalBookingResult>;

  // Cancel a booking
  cancelBooking(config: Record<string, any>, externalBookingId: string): Promise<void>;

  // Validate and parse incoming webhook
  validateWebhook(request: { headers: Record<string, string>; body: string }, secret: string): Promise<WebhookEvent | null>;

  // Get OAuth authorization URL (if needed)
  getAuthUrl?(agencyId: string, redirectUrl: string): string;

  // Handle OAuth callback
  handleCallback?(code: string, agencyId: string): Promise<Record<string, any>>;
}

export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
  eventTypeId?: string;
  calendarId?: string;
  customEndpoints?: {
    availability?: string;
    createBooking?: string;
    cancelBooking?: string;
  };
  [key: string]: any;
}
