/**
 * event-visuals.ts — one look per event type, shared by the events list and
 * the event page. Pure data: importing it must not pull a screen with it.
 */
export interface EventTypeMeta { emoji: string; labelKey: string; color: string }

export const EVENT_TYPE_META: Record<string, EventTypeMeta> = {
  bachelor:     { emoji: "🎉", labelKey: "nativeDashboard.eventTypes.bachelor", color: "from-violet-500 to-purple-600" },
  bachelorette: { emoji: "👑", labelKey: "nativeDashboard.eventTypes.bachelorette", color: "from-pink-500 to-rose-600" },
  birthday:     { emoji: "🎂", labelKey: "nativeDashboard.eventTypes.birthday", color: "from-amber-500 to-orange-600" },
  wedding:      { emoji: "💍", labelKey: "nativeDashboard.eventTypes.wedding", color: "from-cyan-500 to-blue-600" },
  other:        { emoji: "🌟", labelKey: "nativeDashboard.eventTypes.other", color: "from-teal-500 to-emerald-600" },
};

export const eventTypeMeta = (eventType: string): EventTypeMeta => EVENT_TYPE_META[eventType] ?? EVENT_TYPE_META.other;

/** Types with their own hero picture in /public/images/event-heroes. */
const HERO_TYPES = ["bachelor", "bachelorette", "birthday", "trip", "other"];

export const eventHeroImage = (eventType: string): string =>
  `/images/event-heroes/${HERO_TYPES.includes(eventType) ? eventType : "other"}.webp`;
