// JGA Dominik - Konstanten

export const SITE_NAME = "JGA Dominik";

export const WEDDING_DATE = "25.04.2026";

export const ORGANIZER = "Luca Madonia";

// Feste Teilnehmerliste
export const PARTICIPANTS = [
  "Luca Madonia",
  "Daniel Streng",
  "Erwin Huhn",
  "Marc Ehrlich",
  "Marc Dirnberger",
  "Marcus",
  "Mario Buchfelner",
  "Adrian Bayerlein",
  "Dominik",
] as const;

export type Participant = (typeof PARTICIPANTS)[number];

// Terminoptionen
export const DATE_BLOCKS = {
  A: "Fr 27.02.–So 01.03.2026",
  B: "Sa 07.03.–So 08.03.2026",
  C: "Fr 03.04.–So 05.04.2026 (Ostern)",
  D: "Fr 10.04.–So 12.04.2026",
  E: "Fr 17.04.–So 19.04.2026",
} as const;

export type DateBlockKey = keyof typeof DATE_BLOCKS;

// Warnhinweise für bestimmte Blöcke
export const DATE_WARNINGS: Partial<Record<DateBlockKey, string>> = {
  C: "Ostern – Risiko (Familie/teurer/ausgebucht)",
};

// MWC Warnung für Barcelona + Block A
export const MWC_WARNING = "MWC Barcelona 02.–05.03.2026 → Unterkünfte/Preise kritisch rund um Block A";

// Teilnahme-Optionen
export const ATTENDANCE_OPTIONS = [
  { value: "yes", label: "Ja, bin dabei! 🎉" },
  { value: "maybe", label: "Vielleicht / unter Vorbehalt" },
  { value: "no", label: "Leider nein 😔" },
] as const;

// Dauer-Optionen
export const DURATION_OPTIONS = [
  { value: "day", label: "Tages-JGA (nur Samstag)" },
  { value: "weekend", label: "Wochenende (2–3 Tage)" },
  { value: "either", label: "Egal – beides ok" },
] as const;

// Budget-Optionen
export const BUDGET_OPTIONS = [
  { value: "80-150", label: "80–150 €" },
  { value: "150-250", label: "150–250 €" },
  { value: "250-400", label: "250–400 €" },
  { value: "400+", label: "400 €+" },
] as const;

// Destination-Optionen
export const DESTINATION_OPTIONS = [
  { value: "de_city", label: "Großstadt in Deutschland" },
  { value: "barcelona", label: "Barcelona 🇪🇸" },
  { value: "lisbon", label: "Lissabon 🇵🇹" },
  { value: "either", label: "Egal – Hauptsache cool" },
] as const;

// Reisebereitschaft-Optionen
export const TRAVEL_OPTIONS = [
  { value: "daytrip", label: "Tagestrip ohne Übernachtung" },
  { value: "one_night", label: "1 Nacht ist ok" },
  { value: "two_nights", label: "2 Nächte sind ok" },
  { value: "either", label: "Egal – flexibel" },
] as const;

// Aktivitäten / Präferenzen
export const ACTIVITY_OPTIONS = [
  { value: "karting", label: "Karting" },
  { value: "escape_room", label: "Escape Room" },
  { value: "lasertag", label: "Lasertag" },
  { value: "axe_throwing", label: "Axtwerfen" },
  { value: "vr_simracing", label: "VR Arena / Sim-Racing" },
  { value: "climbing", label: "Kletterhalle / Bouldern" },
  { value: "bubble_soccer", label: "Bubble Soccer" },
  { value: "outdoor", label: "Outdoor Challenge (nur wenn Wetter)" },
  { value: "wellness", label: "Wellness / Sauna (optional)" },
  { value: "food", label: "Food / Dinner Experience" },
  { value: "mixed", label: "Gemischt – alles ein bisschen" },
] as const;

// Fitness-Level
export const FITNESS_OPTIONS = [
  { value: "chill", label: "Entspannt 🛋️" },
  { value: "normal", label: "Normal 🚶" },
  { value: "sporty", label: "Sportlich 💪" },
] as const;

// Alkohol-Optionen
export const ALCOHOL_OPTIONS = [
  { value: "yes", label: "Mit Alkohol ok 🍻" },
  { value: "no", label: "Lieber alkoholfrei" },
  { value: "either", label: "Egal" },
] as const;

// DEPRECATED: No-Go Liste - now uses translations from i18n
// Kept for backward compatibility, but InfoCard now uses translations
export const NO_GOS = [
  "Keine Stripper",
  "Kein Bauchladen / Straßenverkauf",
  "Keine Sauf-/Kneipen-/Bartouren",
] as const;

// DEPRECATED: Fokus/Wünsche - now uses translations from i18n  
// Kept for backward compatibility, but InfoCard now uses translations
export const FOCUS_POINTS = [
  "Action, Spaß, Aktivitäten",
  "Gemeinsame Erlebnisse",
  "Cool statt peinlich",
  "Niemand wird zu etwas gezwungen",
] as const;
