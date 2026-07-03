/**
 * Custom-question presets — single source of truth.
 *
 * Previously defined twice with diverging ids and content:
 *   - EventQuestionsStep.tsx  CUSTOM_PRESETS  (hardcoded German, ids: dietary/song/tshirt/license)
 *   - CustomQuestionBuilder.tsx QUESTION_PRESETS (i18n'd, ids: dietary/song_wish/tshirt_size/…)
 *
 * Canonical ids follow the wizard's short form (they may already exist in
 * live events' custom_questions), content comes from the dashboard's i18n
 * keys (dashboard.form.customQuestions.presetQuestions.*). The wizard's
 * legacy long ids are listed in `aliases` so "already added" detection
 * keeps matching questions created by the old dashboard builder.
 */
import type { CustomQuestion } from "@/lib/survey-config";

type TFn = (key: string) => string;

export interface CustomQuestionPreset {
  /** Canonical question id used when the preset is added. */
  id: string;
  /** Legacy ids the same preset was created under by older editors. */
  aliases: string[];
  emoji: string;
  /** Short chip label key (dashboard namespace). */
  labelKey: string;
  build: (t: TFn) => Omit<CustomQuestion, "id">;
}

export const CUSTOM_QUESTION_PRESETS: CustomQuestionPreset[] = [
  {
    id: "dietary",
    aliases: [],
    emoji: "🥗",
    labelKey: "dashboard.form.customQuestions.presets.dietary",
    build: (t) => ({
      type: "textarea",
      label: t("dashboard.form.customQuestions.presetQuestions.dietary.label"),
      placeholder: t("dashboard.form.customQuestions.presetQuestions.dietary.placeholder"),
      required: false,
    }),
  },
  {
    id: "song",
    aliases: ["song_wish"],
    emoji: "🎵",
    labelKey: "dashboard.form.customQuestions.presets.songWish",
    build: (t) => ({
      type: "text",
      label: t("dashboard.form.customQuestions.presetQuestions.songWish.label"),
      placeholder: t("dashboard.form.customQuestions.presetQuestions.songWish.placeholder"),
      required: false,
    }),
  },
  {
    id: "tshirt",
    aliases: ["tshirt_size"],
    emoji: "👕",
    labelKey: "dashboard.form.customQuestions.presets.tshirtSize",
    build: (t) => ({
      type: "select",
      label: t("dashboard.form.customQuestions.presetQuestions.tshirtSize.label"),
      options: ["XS", "S", "M", "L", "XL", "XXL"],
      required: false,
    }),
  },
  {
    id: "license",
    aliases: ["drivers_license"],
    emoji: "🚗",
    labelKey: "dashboard.form.customQuestions.presets.driversLicense",
    build: (t) => ({
      type: "toggle",
      label: t("dashboard.form.customQuestions.presetQuestions.driversLicense.label"),
      required: false,
    }),
  },
  {
    id: "special_wishes",
    aliases: [],
    emoji: "✨",
    labelKey: "dashboard.form.customQuestions.presets.specialWishes",
    build: (t) => ({
      type: "textarea",
      label: t("dashboard.form.customQuestions.presetQuestions.specialWishes.label"),
      placeholder: t("dashboard.form.customQuestions.presetQuestions.specialWishes.placeholder"),
      required: false,
    }),
  },
];

/** True if a preset (by canonical id or any alias) is already among the questions. */
export function presetAlreadyAdded(preset: CustomQuestionPreset, questions: CustomQuestion[]): boolean {
  const ids = new Set([preset.id, ...preset.aliases]);
  return questions.some((q) => ids.has(q.id));
}
