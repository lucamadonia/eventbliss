/**
 * Maps an expense category name to a stable key so the UI can pick a matching
 * line icon (see CategoryIcon). Mapping is by normalized NAME, not DB id, since
 * the 7 system rows keep stable names while their ids differ per database.
 */

export type CategoryAssetKey =
  | "transport" | "accommodation" | "activities"
  | "food" | "drinks" | "gifts" | "other";

const CATEGORY_KEYS: CategoryAssetKey[] = [
  "transport", "accommodation", "activities", "food", "drinks", "gifts", "other",
];

// Normalized category name/label -> key. Covers the English system names plus
// the German UI labels so a localized display name still resolves.
const NAME_ALIASES: Record<string, CategoryAssetKey> = {
  transport: "transport", transportation: "transport", reise: "transport", fahrt: "transport", travel: "transport",
  accommodation: "accommodation", unterkunft: "accommodation", hotel: "accommodation", lodging: "accommodation", übernachtung: "accommodation", uebernachtung: "accommodation",
  activities: "activities", activity: "activities", aktivitäten: "activities", aktivitaeten: "activities", aktivität: "activities", events: "activities",
  food: "food", essen: "food", meals: "food", meal: "food", restaurant: "food", verpflegung: "food",
  drinks: "drinks", drink: "drinks", getränke: "drinks", getraenke: "drinks", bar: "drinks", party: "drinks",
  gifts: "gifts", gift: "gifts", geschenke: "gifts", geschenk: "gifts", präsent: "gifts",
  other: "other", sonstiges: "other", misc: "other", miscellaneous: "other", andere: "other", sonstige: "other",
};

export function categoryKeyFromName(name: string | null | undefined): CategoryAssetKey | null {
  if (!name) return null;
  const norm = name.trim().toLowerCase();
  if ((CATEGORY_KEYS as string[]).includes(norm)) return norm as CategoryAssetKey;
  return NAME_ALIASES[norm] ?? null;
}
