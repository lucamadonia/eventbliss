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
