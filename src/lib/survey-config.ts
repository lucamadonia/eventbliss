// TypeScript interfaces for dynamic survey configuration

export interface DateBlockOption {
  key: string;
  label: string;
  warning?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  emoji?: string;
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
  background_style: 'gradient' | 'solid' | 'image';
  logo_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
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
}

export interface CustomQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  required: boolean;
  options?: SelectOption[];
  placeholder?: string;
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
