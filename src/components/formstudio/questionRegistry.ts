/**
 * questionRegistry — single metadata + policy table for the 9 core questions.
 *
 * This is where the renderer/DB constraints become UX policy instead of
 * scattered ifs: the responses table has CHECK constraints on the columns
 * behind attendance/travel/fitness/alcohol, so their option VALUES are
 * immutable (labels/emojis stay editable); attendance can never be disabled
 * (the dashboard RSVP evaluation depends on it); multiSelect is only honored
 * by the guest renderer for duration/budget/destination.
 *
 * Consumed by Form Studio AND retrofitted into the legacy editors
 * (CoreQuestionEditor policy props) — fixing the live bug where custom
 * values on CHECK-constrained questions made guest submissions fail.
 */
import type { QuestionConfigs, EventSettings, SelectOption } from "@/lib/survey-config";
import { VALUE_LOCKED_QUESTIONS, MULTI_CAPABLE_QUESTIONS } from "@/lib/survey-config";

export type CoreKey = keyof QuestionConfigs;

export interface QuestionPolicy {
  /** Can the organizer hide this question? */
  canDisable: boolean;
  /** Can options be added/removed? (false = value set fixed by DB CHECKs) */
  canEditValues: boolean;
  /** Are label/emoji edits allowed? (always true today, kept explicit) */
  canEditLabels: boolean;
  /** Does the guest renderer honor multiSelect for this question? */
  canMultiSelect: boolean;
}

export interface CoreQuestionMeta {
  key: CoreKey;
  emoji: string;
  group: "basics" | "logistik" | "vibe";
  /** i18n keys — wizard namespace (native surface). */
  titleKey: string;
  descKey: string;
  /** The settings field holding this question's options (null: date_blocks). */
  optionsKey: keyof Pick<
    EventSettings,
    | "attendance_options" | "duration_options" | "budget_options"
    | "destination_options" | "travel_options" | "fitness_options"
    | "alcohol_options" | "activity_options"
  > | null;
  policy: QuestionPolicy;
  /** Max options for free users (only meaningful where canEditValues). */
  maxOptionsFree: number;
  /** Max options for premium users. */
  maxOptionsPremium: number;
}

const policyFor = (key: CoreKey): QuestionPolicy => ({
  canDisable: key !== "attendance",
  canEditValues: !VALUE_LOCKED_QUESTIONS.includes(key),
  canEditLabels: true,
  canMultiSelect: MULTI_CAPABLE_QUESTIONS.includes(key),
});

const meta = (
  key: CoreKey,
  emoji: string,
  group: CoreQuestionMeta["group"],
  optionsKey: CoreQuestionMeta["optionsKey"],
): CoreQuestionMeta => ({
  key,
  emoji,
  group,
  titleKey: `native.create.questions.q.${key}.title`,
  descKey: `native.create.questions.q.${key}.desc`,
  optionsKey,
  policy: policyFor(key),
  maxOptionsFree: 5,
  maxOptionsPremium: 12,
});

export const CORE_QUESTION_META: CoreQuestionMeta[] = [
  meta("attendance", "🎉", "basics", "attendance_options"),
  meta("duration", "🗓️", "basics", "duration_options"),
  meta("date_blocks", "📅", "basics", null),
  meta("budget", "💶", "logistik", "budget_options"),
  meta("destination", "📍", "logistik", "destination_options"),
  meta("travel", "🧳", "logistik", "travel_options"),
  meta("activities", "🎯", "vibe", "activity_options"),
  meta("fitness", "💪", "vibe", "fitness_options"),
  meta("alcohol", "🍻", "vibe", "alcohol_options"),
];

export const CORE_META_BY_KEY: Record<CoreKey, CoreQuestionMeta> = Object.fromEntries(
  CORE_QUESTION_META.map((m) => [m.key, m]),
) as Record<CoreKey, CoreQuestionMeta>;

export const STUDIO_GROUPS: { id: CoreQuestionMeta["group"]; labelKey: string }[] = [
  { id: "basics", labelKey: "native.create.questions.groups.basics" },
  { id: "logistik", labelKey: "native.create.questions.groups.logistik" },
  { id: "vibe", labelKey: "native.create.questions.groups.vibe" },
];

/** Premium limits for custom questions (unified: 1 free everywhere). */
export const FREE_CUSTOM_QUESTION_LIMIT = 1;
/** Custom question types that require premium. */
export const PREMIUM_CUSTOM_TYPES = ["rating", "number", "date"] as const;

/** Options of a question from the settings draft (empty array for date_blocks). */
export function optionsOf(settings: EventSettings, key: CoreKey): SelectOption[] {
  const m = CORE_META_BY_KEY[key];
  if (!m.optionsKey) return [];
  return (settings[m.optionsKey] as SelectOption[]) ?? [];
}
