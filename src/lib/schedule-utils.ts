/**
 * schedule-utils.ts — the schedule tab's rules without any UI: days, times,
 * money and the checks that warn an organiser before a plan goes wrong.
 * Days are local calendar days as YYYY-MM-DD, times are HH:MM.
 */

export type ActivityCategory =
  | "food" | "activity" | "transport" | "party"
  | "sightseeing" | "accommodation" | "relaxation" | "other";

export const CATEGORY_META: Record<ActivityCategory, { icon: string; color: string }> = {
  food:          { icon: "🍕", color: "from-orange-500 to-amber-400" },
  activity:      { icon: "🎯", color: "from-violet-500 to-purple-500" },
  transport:     { icon: "🚐", color: "from-blue-500 to-cyan-400" },
  party:         { icon: "🎉", color: "from-pink-500 to-rose-400" },
  sightseeing:   { icon: "🗺", color: "from-emerald-500 to-teal-400" },
  accommodation: { icon: "🏨", color: "from-indigo-500 to-blue-400" },
  relaxation:    { icon: "💆", color: "from-cyan-400 to-sky-300" },
  other:         { icon: "📌", color: "from-gray-500 to-slate-400" },
};

export const ACTIVITY_CATEGORIES = Object.keys(CATEGORY_META) as ActivityCategory[];

/** Unknown or missing categories from the database show as "other". */
export const activityCategory = (value: string | null | undefined): ActivityCategory =>
  ACTIVITY_CATEGORIES.includes(value as ActivityCategory) ? (value as ActivityCategory) : "other";

/** "14:30:00" from the database → "14:30". */
export const hhmm = (time: string | null | undefined): string | null => (time ? time.slice(0, 5) : null);

/** Local calendar day as YYYY-MM-DD (never shifted by the UTC offset). */
export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const localMidnight = (day: string) => new Date(`${day}T00:00:00`);

export function dayAfter(day: string): string {
  const date = localMidnight(day);
  date.setDate(date.getDate() + 1);
  return isoDay(date);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((localMidnight(to).getTime() - localMidnight(from).getTime()) / 86_400_000);
}

export function formatDayLabel(day: string, locale: string): string {
  return localMidnight(day).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit" });
}

/** "2h", "1.5h" or "45min"; empty when there is no positive span. */
export function computeDuration(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return "";
  const diffMs = new Date(`2000-01-01T${endTime}`).getTime() - new Date(`2000-01-01T${startTime}`).getTime();
  if (!(diffMs > 0)) return "";
  const hours = diffMs / 3_600_000;
  if (hours >= 1) return `${Math.round(hours * 10) / 10}h`;
  return `${Math.round(diffMs / 60_000)}min`;
}

export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    // An unknown currency code must not take the whole tab down.
    return `${amount} ${currency}`;
  }
}

/** "12,50" and "12.50" both mean twelve fifty; empty means no cost. */
export function parseCost(text: string): number | null | "invalid" {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^\d+([.,]\d+)?$/.test(trimmed)) return "invalid";
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) && value < 100_000_000 ? Math.round(value * 100) / 100 : "invalid";
}

interface Timed { id: string; dayDate: string; startTime: string | null; endTime: string | null }

/**
 * Ids of activities whose time range collides with another one on the same
 * day. Only real ranges count: an activity without an end time is a moment,
 * and back-to-back slots (10–11, 11–12) do not collide.
 */
export function overlappingIds(activities: Timed[]): Set<string> {
  const result = new Set<string>();
  const ranged = activities.filter((a) => a.startTime && a.endTime && a.endTime > a.startTime);
  for (let i = 0; i < ranged.length; i++) {
    for (let j = i + 1; j < ranged.length; j++) {
      const a = ranged[i], b = ranged[j];
      if (a.dayDate === b.dayDate && a.startTime! < b.endTime! && b.startTime! < a.endTime!) {
        result.add(a.id);
        result.add(b.id);
      }
    }
  }
  return result;
}

/** A weekend may start a day early or run a few days long; a month off is a typo. */
export const FAR_FROM_EVENT_DAYS = 7;

export function isFarFromEvent(day: string, eventDay: string | null): boolean {
  if (!day || !eventDay) return false;
  return Math.abs(daysBetween(eventDay, day)) > FAR_FROM_EVENT_DAYS;
}
