/**
 * responseHelpers — types, constants, and pure helpers for the native responses tab.
 */
import type { TFunction } from "i18next";
import {
  CheckCircle, HelpCircle, XCircle, MapPin, DollarSign,
  CalendarDays, Car, Dumbbell, Wine,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

export interface ResponseRow {
  id: string;
  participant: string;
  attendance: string;
  budget: string;
  destination: string;
  duration_pref: string;
  travel_pref: string;
  fitness_level: string;
  alcohol: string | null;
  restrictions: string | null;
  suggestions: string | null;
  partial_days: string | null;
  preferences: string[];
  date_blocks: string[];
  de_city: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceFilter = "alle" | "yes" | "maybe" | "no";

export interface CategoryDef {
  key: keyof ResponseRow;
  i18nKey: string;
  icon: typeof MapPin;
  gradient: string;
}

// ─── Constants ───────────────────────────────────────────────────

export const ATTENDANCE_CONFIG = {
  yes: {
    icon: CheckCircle,
    i18nKey: "confirmed",
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    gradient: "from-emerald-500 to-teal-600",
  },
  maybe: {
    icon: HelpCircle,
    i18nKey: "maybe",
    dot: "bg-amber-500",
    text: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    gradient: "from-amber-500 to-orange-600",
  },
  no: {
    icon: XCircle,
    i18nKey: "declined",
    dot: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    gradient: "from-red-500 to-rose-600",
  },
} as const;

export const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-indigo-500 to-violet-600",
  "from-fuchsia-500 to-pink-600",
  "from-sky-500 to-cyan-600",
];

export const CATEGORIES: CategoryDef[] = [
  { key: "attendance",    i18nKey: "attendance",    icon: CheckCircle,  gradient: "from-emerald-500 to-teal-600" },
  { key: "budget",        i18nKey: "budget",        icon: DollarSign,   gradient: "from-amber-500 to-orange-600" },
  { key: "destination",   i18nKey: "destination",   icon: MapPin,       gradient: "from-cyan-500 to-blue-600" },
  { key: "duration_pref", i18nKey: "duration_pref", icon: CalendarDays, gradient: "from-violet-500 to-purple-600" },
  { key: "travel_pref",   i18nKey: "travel_pref",   icon: Car,          gradient: "from-pink-500 to-rose-600" },
  { key: "fitness_level", i18nKey: "fitness_level",  icon: Dumbbell,     gradient: "from-indigo-500 to-violet-600" },
  { key: "alcohol",       i18nKey: "alcohol",        icon: Wine,         gradient: "from-fuchsia-500 to-pink-600" },
];

// ─── Helpers ─────────────────────────────────────────────────────

export function timeAgo(dateStr: string, t: TFunction): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("nativeResponses.timeAgo.justNow");
  if (mins < 60) return t("nativeResponses.timeAgo.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("nativeResponses.timeAgo.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days === 1) return t("nativeResponses.timeAgo.yesterday");
  if (days < 7) return t("nativeResponses.timeAgo.daysAgo", { count: days });
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function countValues(arr: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  arr.forEach((v) => {
    const key = v.trim();
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
