// iCal generator for activity export
import { format, parseISO } from "date-fns";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  day_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
}

interface EventInfo {
  name: string;
  id: string;
}

function formatDateForICal(date: string, time: string | null): string {
  const dateObj = parseISO(date);
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
    return format(dateObj, "yyyyMMdd'T'HHmmss");
  }
  return format(dateObj, "yyyyMMdd");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateICalContent(
  activities: Activity[],
  event: EventInfo
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//STAG Event Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(event.name)}`,
  ];

  activities.forEach((activity) => {
    const uid = `${activity.id}@stag-planner`;
    const dtStart = formatDateForICal(activity.day_date, activity.start_time);
    const dtEnd = activity.end_time 
      ? formatDateForICal(activity.day_date, activity.end_time)
      : activity.start_time
        ? formatDateForICal(activity.day_date, activity.start_time)
        : formatDateForICal(activity.day_date, null);
    
    const isAllDay = !activity.start_time;
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`);
    
    if (isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    } else {
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    }
    
    lines.push(`SUMMARY:${escapeICalText(activity.title)}`);
    
    if (activity.description) {
      lines.push(`DESCRIPTION:${escapeICalText(activity.description)}`);
    }
    
    if (activity.location) {
      lines.push(`LOCATION:${escapeICalText(activity.location)}`);
    }
    
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
}

export function downloadICalFile(
  activities: Activity[],
  event: EventInfo,
  filename?: string
): void {
  const content = generateICalContent(activities, event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${event.name.replace(/\s+/g, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Booking-specific iCal generation
// ---------------------------------------------------------------------------

interface BookingForICal {
  id: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_notes?: string;
  participant_count: number;
  status: string;
}

interface ServiceForICal {
  title: string;
  duration_minutes: number;
  location_city?: string;
  location_address?: string;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function mapBookingStatusToICal(status: string): string {
  switch (status) {
    case 'confirmed':
    case 'completed':
    case 'in_progress':
      return 'CONFIRMED';
    case 'pending_payment':
    case 'pending_confirmation':
      return 'TENTATIVE';
    case 'cancelled_by_customer':
    case 'cancelled_by_agency':
    case 'refunded':
    case 'no_show':
      return 'CANCELLED';
    default:
      return 'TENTATIVE';
  }
}

export function generateBookingICalContent(
  booking: BookingForICal,
  service: ServiceForICal
): string {
  const dtStart = formatDateForICal(booking.booking_date, booking.booking_time);
  const endTime = addMinutesToTime(booking.booking_time, service.duration_minutes);
  const dtEnd = formatDateForICal(booking.booking_date, endTime);

  const summary = `${service.title} - ${booking.customer_name}`;

  const descriptionParts: string[] = [
    `${booking.participant_count} Teilnehmer`,
  ];
  if (booking.customer_email) descriptionParts.push(booking.customer_email);
  if (booking.customer_phone) descriptionParts.push(booking.customer_phone);
  if (booking.customer_notes) descriptionParts.push(booking.customer_notes);

  const locationParts: string[] = [];
  if (service.location_city) locationParts.push(service.location_city);
  if (service.location_address) locationParts.push(service.location_address);

  const icalStatus = mapBookingStatusToICal(booking.status);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventBliss//Booking Calendar//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@eventbliss`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICalText(summary)}`,
    `DESCRIPTION:${escapeICalText(descriptionParts.join('\n'))}`,
  ];

  if (locationParts.length > 0) {
    lines.push(`LOCATION:${escapeICalText(locationParts.join(', '))}`);
  }

  lines.push(`STATUS:${icalStatus}`);

  // VALARM: 1 hour before
  lines.push('BEGIN:VALARM');
  lines.push('TRIGGER:-PT1H');
  lines.push('ACTION:DISPLAY');
  lines.push(`DESCRIPTION:${escapeICalText(summary)} in 1 Stunde`);
  lines.push('END:VALARM');

  // VALARM: 24 hours before
  lines.push('BEGIN:VALARM');
  lines.push('TRIGGER:-PT24H');
  lines.push('ACTION:DISPLAY');
  lines.push(`DESCRIPTION:${escapeICalText(summary)} morgen`);
  lines.push('END:VALARM');

  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

export function downloadBookingICalFile(
  booking: BookingForICal,
  service: ServiceForICal,
  filename?: string
): void {
  const content = generateBookingICalContent(booking, service);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `buchung-${booking.id.slice(0, 8)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
