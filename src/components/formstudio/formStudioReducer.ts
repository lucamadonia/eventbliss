/**
 * formStudioReducer — pure state machine for the native Form Studio.
 *
 * Holds the working draft of an event's survey settings plus a small undo
 * history and the autosave lifecycle flag. All mutations flow through here so
 * the autosave hook (useFormStudio) only has to watch `saveState`.
 *
 * Destructive actions (deleting a custom question, applying a preset, disabling
 * a question) snapshot the settings into `history` so a single UNDO can bring
 * them back. Everything else is non-destructive and skips the snapshot.
 *
 * SET_DATE_RANGES is the Studio side of the P5 dual-write: it stores the real
 * ranges in `date_ranges` AND re-derives the legacy `date_blocks`/`date_warnings`
 * records so every legacy reader keeps working.
 */
import {
  type EventSettings,
  type QuestionConfig,
  type QuestionConfigs,
  type SelectOption,
  type ActivityOption,
  type CustomQuestion,
  type BrandingConfig,
  type DateRangeBlock,
  mergeWithDefaults,
} from "@/lib/survey-config";
import type { CoreKey } from "@/components/formstudio/questionRegistry";

/** Settings fields that hold a question's editable option list. */
export type OptionsFieldKey =
  | "attendance_options"
  | "duration_options"
  | "budget_options"
  | "destination_options"
  | "travel_options"
  | "fitness_options"
  | "alcohol_options"
  | "activity_options";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export interface FormStudioState {
  settings: EventSettings;
  saveState: SaveState;
  /** Undo snapshots, newest first. Capped at HISTORY_LIMIT. */
  history: EventSettings[];
}

export type FormStudioAction =
  | { type: "SET_QUESTION_CONFIG"; key: CoreKey; cfg: QuestionConfig }
  | { type: "SET_OPTIONS"; optionsKey: OptionsFieldKey; options: SelectOption[] | ActivityOption[] }
  | { type: "REORDER_QUESTIONS"; order: string[] }
  | { type: "UPSERT_CUSTOM_QUESTION"; question: CustomQuestion }
  | { type: "DELETE_CUSTOM_QUESTION"; id: string }
  | { type: "SET_DATE_RANGES"; ranges: DateRangeBlock[] }
  | { type: "SET_BRANDING"; branding: BrandingConfig }
  | { type: "SET_LIST"; key: "no_gos" | "focus_points"; items: string[] }
  | { type: "APPLY_PRESET"; config: QuestionConfigs }
  | { type: "UNDO" }
  | { type: "MARK_SAVING" }
  | { type: "MARK_SAVED" }
  | { type: "MARK_ERROR" }
  | { type: "RESYNC"; settings: EventSettings };

const HISTORY_LIMIT = 20;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Build a fresh state from an event's (possibly partial) stored settings. */
export function makeInitialState(settings: Partial<EventSettings> | null): FormStudioState {
  return { settings: mergeWithDefaults(settings), saveState: "idle", history: [] };
}

/** Push the current settings onto the undo stack (used by destructive actions). */
function snapshot(state: FormStudioState): EventSettings[] {
  return [clone(state.settings), ...state.history].slice(0, HISTORY_LIMIT);
}

/** Re-derive the legacy date_blocks/date_warnings records from real ranges. */
function deriveDateRecords(ranges: DateRangeBlock[]): {
  date_blocks: Record<string, string>;
  date_warnings: Record<string, string>;
} {
  const date_blocks: Record<string, string> = {};
  const date_warnings: Record<string, string> = {};
  for (const r of ranges) {
    date_blocks[r.key] = r.label || `${r.start} – ${r.end}`;
    if (r.warning) date_warnings[r.key] = r.warning;
  }
  return { date_blocks, date_warnings };
}

/** Wrap a settings update, flagging the draft dirty. */
function dirty(state: FormStudioState, settings: EventSettings, history?: EventSettings[]): FormStudioState {
  return { settings, saveState: "dirty", history: history ?? state.history };
}

export function formStudioReducer(state: FormStudioState, action: FormStudioAction): FormStudioState {
  switch (action.type) {
    case "SET_QUESTION_CONFIG": {
      const prev = state.settings.question_config?.[action.key];
      const isDisabling = prev?.enabled === true && action.cfg.enabled === false;
      const question_config = {
        ...(state.settings.question_config as QuestionConfigs),
        [action.key]: action.cfg,
      };
      return dirty(
        state,
        { ...state.settings, question_config },
        isDisabling ? snapshot(state) : undefined,
      );
    }

    case "SET_OPTIONS": {
      const settings = clone(state.settings);
      // The optionsKey is a validated union; activity_options carries the wider
      // ActivityOption[] which SET_OPTIONS also accepts.
      (settings as unknown as Record<string, unknown>)[action.optionsKey] = action.options;
      return dirty(state, settings);
    }

    case "REORDER_QUESTIONS":
      return dirty(state, { ...state.settings, question_order: action.order });

    case "UPSERT_CUSTOM_QUESTION": {
      const existing = state.settings.custom_questions ?? [];
      const idx = existing.findIndex((q) => q.id === action.question.id);
      const custom_questions =
        idx >= 0
          ? existing.map((q) => (q.id === action.question.id ? action.question : q))
          : [...existing, action.question];
      return dirty(state, { ...state.settings, custom_questions });
    }

    case "DELETE_CUSTOM_QUESTION": {
      const custom_questions = (state.settings.custom_questions ?? []).filter((q) => q.id !== action.id);
      const question_order = (state.settings.question_order ?? []).filter(
        (id) => id !== `custom:${action.id}`,
      );
      return dirty(state, { ...state.settings, custom_questions, question_order }, snapshot(state));
    }

    case "SET_DATE_RANGES": {
      const { date_blocks, date_warnings } = deriveDateRecords(action.ranges);
      return dirty(state, { ...state.settings, date_ranges: action.ranges, date_blocks, date_warnings });
    }

    case "SET_BRANDING":
      return dirty(state, { ...state.settings, branding: action.branding });

    case "SET_LIST":
      return dirty(state, { ...state.settings, [action.key]: action.items });

    case "APPLY_PRESET":
      return dirty(state, { ...state.settings, question_config: clone(action.config) }, snapshot(state));

    case "UNDO": {
      if (state.history.length === 0) return state;
      const [restored, ...rest] = state.history;
      return { settings: clone(restored), saveState: "dirty", history: rest };
    }

    case "MARK_SAVING":
      return { ...state, saveState: "saving" };

    case "MARK_SAVED":
      // A dirty edit may have landed between MARK_SAVING and here; never
      // downgrade an in-flight dirty draft to "saved".
      return state.saveState === "dirty" ? state : { ...state, saveState: "saved" };

    case "MARK_ERROR":
      return { ...state, saveState: "error" };

    case "RESYNC":
      return { settings: action.settings, saveState: "saved", history: state.history };

    default:
      return state;
  }
}
