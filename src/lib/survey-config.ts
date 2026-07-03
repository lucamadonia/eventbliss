// TypeScript interfaces for dynamic survey configuration

export interface DateBlockOption {
  key: string;
  label: string;
  warning?: string;
}

/**
 * A date block with its REAL date range. Canonical home of this interface
 * (moved from DateRangeBlockEditor, which re-exports it for compat).
 * Persisted in settings.date_ranges since the Form Studio rebuild — the
 * legacy settings.date_blocks record only stores the flattened label,
 * which destroyed start/end on every save round-trip.
 */
export interface DateRangeBlock {
  key: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  label?: string;
  warning?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  emoji?: string;
}

// Question configuration for enabling/disabling questions and single/multi select
export interface QuestionConfig {
  enabled: boolean;
  multiSelect: boolean;
}

export interface QuestionConfigs {
  attendance: QuestionConfig;
  duration: QuestionConfig;
  date_blocks: QuestionConfig;
  budget: QuestionConfig;
  destination: QuestionConfig;
  travel: QuestionConfig;
  activities: QuestionConfig;
  fitness: QuestionConfig;
  alcohol: QuestionConfig;
}

export interface ActivityOption {
  value: string;
  label: string;
  emoji?: string;
  category?: 'action' | 'chill' | 'food' | 'outdoor' | 'other';
}

export interface BrandingConfig {
  primary_color: string;
  accent_color: string;
  background_style: 'gradient' | 'solid' | 'image' | 'dark';
  logo_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  key_date_label?: string;
  key_date?: string;
  template_id?: string;
}

export interface SurveyConfig {
  // Form lock status
  form_locked: boolean;
  locked_block?: string;
  
  // Date blocks configuration
  date_blocks: Record<string, string>;
  date_warnings?: Record<string, string>;
  
  // Budget options (e.g., ["80-150", "150-250", "250-400", "400+"])
  budget_options: SelectOption[];
  
  // Destination options
  destination_options: SelectOption[];
  
  // Activity options
  activity_options: ActivityOption[];
  
  // Duration options
  duration_options: SelectOption[];
  
  // Travel options
  travel_options: SelectOption[];
  
  // Fitness options
  fitness_options: SelectOption[];
  
  // Alcohol options
  alcohol_options: SelectOption[];
  
  // Attendance options
  attendance_options: SelectOption[];
  
  // No-gos list
  no_gos: string[];
  
  // Focus points
  focus_points: string[];
  
  // Custom questions (future feature)
  custom_questions?: CustomQuestion[];

  // Question visibility and multi-select configuration
  question_config?: QuestionConfigs;

  /**
   * Display order of questions on the guest form. Entries are core question
   * keys ('budget', …) or 'custom:<id>' for custom questions. Unknown ids
   * are ignored; missing ids are appended in default order — old events
   * without this key render exactly as before.
   */
  question_order?: string[];

  /**
   * Date blocks WITH their real start/end dates (see DateRangeBlock).
   * Always written alongside the legacy date_blocks/date_warnings records
   * (dual-write) so every legacy reader keeps working.
   */
  date_ranges?: DateRangeBlock[];
}

export type CustomQuestionType =
  | 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'toggle'
  // Premium types (Form Studio): answers stored as strings in meta.custom_answers
  | 'rating'   // "1".."5"
  | 'number'   // decimal string
  | 'date';    // yyyy-MM-dd

export interface CustomQuestion {
  id: string;
  type: CustomQuestionType;
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  /** Optional bounds for type 'number' */
  min?: number;
  max?: number;
}

export const DEFAULT_QUESTION_CONFIG: QuestionConfigs = {
  attendance: { enabled: true, multiSelect: false },
  duration: { enabled: true, multiSelect: false },
  date_blocks: { enabled: true, multiSelect: true },
  budget: { enabled: true, multiSelect: false },
  destination: { enabled: true, multiSelect: false },
  travel: { enabled: true, multiSelect: false },
  activities: { enabled: true, multiSelect: true },
  fitness: { enabled: true, multiSelect: false },
  alcohol: { enabled: true, multiSelect: false },
};

/** The 9 core question keys, in the order they appear on the survey. */
export const CORE_QUESTION_KEYS: (keyof QuestionConfigs)[] = [
  'attendance', 'duration', 'date_blocks', 'budget',
  'destination', 'travel', 'activities', 'fitness', 'alcohol',
];

/**
 * Smart per-event-type defaults for the "choose your questions" step.
 * Travel-heavy questions (destination/travel) are pre-disabled for local events
 * (birthday/other). `attendance` is ALWAYS enabled — the whole RSVP/dashboard
 * evaluation depends on it, so it must never be switched off.
 */
export function questionConfigForEventType(eventType: string): QuestionConfigs {
  const base: QuestionConfigs = JSON.parse(JSON.stringify(DEFAULT_QUESTION_CONFIG));
  if (eventType === 'birthday' || eventType === 'other') {
    base.destination = { ...base.destination, enabled: false };
    base.travel = { ...base.travel, enabled: false };
  }
  base.attendance.enabled = true;
  return base;
}

export interface EventSettings extends SurveyConfig {
  branding?: BrandingConfig;
}

// Default configuration for new events
export const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
  form_locked: false,
  date_blocks: {},
  date_warnings: {},
  
  budget_options: [
    { value: "80-150", label: "80–150 €" },
    { value: "150-250", label: "150–250 €" },
    { value: "250-400", label: "250–400 €" },
    { value: "400+", label: "400 €+" },
  ],
  
  destination_options: [
    { value: "de_city", label: "Großstadt in Deutschland" },
    { value: "barcelona", label: "Barcelona", emoji: "🇪🇸" },
    { value: "lisbon", label: "Lissabon", emoji: "🇵🇹" },
    { value: "prague", label: "Prag", emoji: "🇨🇿" },
    { value: "budapest", label: "Budapest", emoji: "🇭🇺" },
    { value: "either", label: "Egal – Hauptsache cool" },
  ],
  
  activity_options: [
    { value: "karting", label: "Karting", emoji: "🏎️", category: "action" },
    { value: "escape_room", label: "Escape Room", emoji: "🔐", category: "action" },
    { value: "lasertag", label: "Lasertag", emoji: "🔫", category: "action" },
    { value: "axe_throwing", label: "Axtwerfen", emoji: "🪓", category: "action" },
    { value: "vr_simracing", label: "VR Arena / Sim-Racing", emoji: "🎮", category: "action" },
    { value: "climbing", label: "Kletterhalle / Bouldern", emoji: "🧗", category: "outdoor" },
    { value: "bubble_soccer", label: "Bubble Soccer", emoji: "⚽", category: "action" },
    { value: "outdoor", label: "Outdoor Challenge", emoji: "🏕️", category: "outdoor" },
    { value: "wellness", label: "Wellness / Sauna", emoji: "🧖", category: "chill" },
    { value: "food", label: "Food / Dinner Experience", emoji: "🍽️", category: "food" },
    { value: "mixed", label: "Gemischt – alles ein bisschen", emoji: "🎯", category: "other" },
  ],
  
  duration_options: [
    { value: "day", label: "Tages-JGA (nur Samstag)" },
    { value: "weekend", label: "Wochenende (2–3 Tage)" },
    { value: "either", label: "Egal – beides ok" },
  ],
  
  travel_options: [
    { value: "daytrip", label: "Tagestrip ohne Übernachtung" },
    { value: "one_night", label: "1 Nacht ist ok" },
    { value: "two_nights", label: "2 Nächte sind ok" },
    { value: "either", label: "Egal – flexibel" },
  ],
  
  fitness_options: [
    { value: "chill", label: "Entspannt", emoji: "🛋️" },
    { value: "normal", label: "Normal", emoji: "🚶" },
    { value: "sporty", label: "Sportlich", emoji: "💪" },
  ],
  
  alcohol_options: [
    { value: "yes", label: "Mit Alkohol ok", emoji: "🍻" },
    { value: "no", label: "Lieber alkoholfrei" },
    { value: "either", label: "Egal" },
  ],
  
  attendance_options: [
    { value: "yes", label: "Ja, bin dabei!", emoji: "🎉" },
    { value: "maybe", label: "Vielleicht / unter Vorbehalt" },
    { value: "no", label: "Leider nein", emoji: "😔" },
  ],
  
  no_gos: [],
  focus_points: [],
  
  question_config: {
    attendance: { enabled: true, multiSelect: false },
    duration: { enabled: true, multiSelect: false },
    date_blocks: { enabled: true, multiSelect: true },
    budget: { enabled: true, multiSelect: false },
    destination: { enabled: true, multiSelect: false },
    travel: { enabled: true, multiSelect: false },
    activities: { enabled: true, multiSelect: true },
    fitness: { enabled: true, multiSelect: false },
    alcohol: { enabled: true, multiSelect: false },
  },
};

export const DEFAULT_BRANDING: BrandingConfig = {
  primary_color: "#8B5CF6",
  accent_color: "#06B6D4",
  background_style: "gradient",
};

// Helper to merge user settings with defaults
export function mergeWithDefaults(settings: Partial<EventSettings> | null): EventSettings {
  if (!settings) {
    return { ...DEFAULT_SURVEY_CONFIG, branding: DEFAULT_BRANDING };
  }
  
  return {
    ...DEFAULT_SURVEY_CONFIG,
    ...settings,
    branding: {
      ...DEFAULT_BRANDING,
      ...(settings.branding || {}),
    },
    question_config: {
      ...DEFAULT_QUESTION_CONFIG,
      ...(settings.question_config || {}),
    },
    // Ensure arrays have defaults if empty
    budget_options: settings.budget_options?.length ? settings.budget_options : DEFAULT_SURVEY_CONFIG.budget_options,
    destination_options: settings.destination_options?.length ? settings.destination_options : DEFAULT_SURVEY_CONFIG.destination_options,
    activity_options: settings.activity_options?.length ? settings.activity_options : DEFAULT_SURVEY_CONFIG.activity_options,
    duration_options: settings.duration_options?.length ? settings.duration_options : DEFAULT_SURVEY_CONFIG.duration_options,
    travel_options: settings.travel_options?.length ? settings.travel_options : DEFAULT_SURVEY_CONFIG.travel_options,
    fitness_options: settings.fitness_options?.length ? settings.fitness_options : DEFAULT_SURVEY_CONFIG.fitness_options,
    alcohol_options: settings.alcohol_options?.length ? settings.alcohol_options : DEFAULT_SURVEY_CONFIG.alcohol_options,
    attendance_options: settings.attendance_options?.length ? settings.attendance_options : DEFAULT_SURVEY_CONFIG.attendance_options,
  };
}

// Helper to get date blocks as array for form rendering
export function getDateBlocksArray(dateBlocks: Record<string, string>, warnings?: Record<string, string>): DateBlockOption[] {
  return Object.entries(dateBlocks).map(([key, label]) => ({
    key,
    label,
    warning: warnings?.[key],
  }));
}

/**
 * Date blocks with real ranges where available. Prefers settings.date_ranges;
 * reconciles against the legacy date_blocks record: entries whose key is
 * missing from date_blocks are dropped (a legacy editor deleted them), and
 * legacy-only keys are appended with empty start/end. Result is what editors
 * should hydrate from.
 */
export function getDateBlocks(config: Pick<SurveyConfig, 'date_blocks' | 'date_warnings' | 'date_ranges'>): DateRangeBlock[] {
  const legacyKeys = Object.keys(config.date_blocks || {});
  const ranges = (config.date_ranges || []).filter((r) => legacyKeys.includes(r.key));
  const rangeKeys = new Set(ranges.map((r) => r.key));
  const legacyOnly: DateRangeBlock[] = legacyKeys
    .filter((key) => !rangeKeys.has(key))
    .map((key) => ({
      key,
      start: '',
      end: '',
      label: config.date_blocks[key],
      warning: config.date_warnings?.[key],
    }));
  return [
    ...ranges.map((r) => ({
      ...r,
      label: r.label ?? config.date_blocks[r.key],
      warning: r.warning ?? config.date_warnings?.[r.key],
    })),
    ...legacyOnly,
  ];
}

/** Prefix for custom-question ids inside question_order. */
export const CUSTOM_ORDER_PREFIX = 'custom:';

/**
 * Effective question order for the guest form: config.question_order filtered
 * to known ids, with every missing known id appended in default order
 * (core keys first, then custom questions). Total function — old events
 * without question_order get exactly the legacy order.
 */
export function getEffectiveQuestionOrder(
  config: Pick<SurveyConfig, 'question_order' | 'custom_questions'>,
): string[] {
  const customIds = (config.custom_questions || []).map((q) => `${CUSTOM_ORDER_PREFIX}${q.id}`);
  const known = new Set<string>([...CORE_QUESTION_KEYS, ...customIds]);
  const stored = (config.question_order || []).filter((id) => known.has(id));
  const seen = new Set(stored);
  const missing = [...CORE_QUESTION_KEYS, ...customIds].filter((id) => !seen.has(id));
  return [...stored, ...missing];
}

/** Core questions whose option VALUES are locked by DB CHECK constraints on
 *  the responses table — add/remove/rename of values would make guest
 *  submissions fail. Labels and emojis remain freely editable. */
export const VALUE_LOCKED_QUESTIONS: (keyof QuestionConfigs)[] = [
  'attendance', 'travel', 'fitness', 'alcohol',
];

/** Questions whose multiSelect flag is actually honored by the guest renderer. */
export const MULTI_CAPABLE_QUESTIONS: (keyof QuestionConfigs)[] = [
  'duration', 'budget', 'destination',
];

/**
 * Guardrail pass before persisting settings (used by Form Studio autosave):
 * - clamps option values of CHECK-constrained questions to their default
 *   value sets (labels/emojis pass through)
 * - forces attendance enabled (dashboard evaluation depends on it)
 * - forces multiSelect=false where the renderer stores scalars
 * - drops unknown ids from question_order
 * - strips custom questions without a label
 */
export function sanitizeSettingsForSave(settings: EventSettings): EventSettings {
  const out: EventSettings = { ...settings };

  const clampOptions = (key: 'attendance_options' | 'travel_options' | 'fitness_options' | 'alcohol_options') => {
    const allowed = new Set(DEFAULT_SURVEY_CONFIG[key].map((o) => o.value));
    const byValue = new Map((out[key] || []).map((o) => [o.value, o]));
    // Keep exactly the default value set, in default order, but let edited
    // labels/emojis pass through.
    out[key] = DEFAULT_SURVEY_CONFIG[key].map((def) => {
      const edited = byValue.get(def.value);
      return edited ? { ...def, label: edited.label, emoji: edited.emoji } : def;
    });
    void allowed;
  };
  clampOptions('attendance_options');
  clampOptions('travel_options');
  clampOptions('fitness_options');
  clampOptions('alcohol_options');

  if (out.question_config) {
    out.question_config = { ...out.question_config };
    out.question_config.attendance = { ...out.question_config.attendance, enabled: true, multiSelect: false };
    for (const key of VALUE_LOCKED_QUESTIONS) {
      if (key === 'attendance') continue;
      out.question_config[key] = { ...out.question_config[key], multiSelect: false };
    }
  }

  if (out.question_order) {
    const customIds = (out.custom_questions || []).map((q) => `${CUSTOM_ORDER_PREFIX}${q.id}`);
    const known = new Set<string>([...CORE_QUESTION_KEYS, ...customIds]);
    out.question_order = out.question_order.filter((id) => known.has(id));
  }

  if (out.custom_questions) {
    out.custom_questions = out.custom_questions.filter((q) => q.label.trim().length > 0);
  }

  return out;
}
