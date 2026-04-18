// Client-side intelligence layer for the Expenses v2 add-flow.
//
// * inferCategory — keyword heuristics that map a description to one of
//   the event's categories. Covers ~80 % of day-to-day events without
//   a server round-trip. Falls back to null on ambiguity.
// * recallRecentSplit / rememberRecentSplit — per-event localStorage
//   memory of the last split configuration (mode + excluded participant
//   ids) so reopening the sheet prefills "exclude Anna again" without
//   another manual tap.

import type { ExpenseCategory, SplitType } from "./types";

// -- Category heuristics -----------------------------------------------

// Order matters: first matching pattern wins. Use lowercase keywords;
// we match against the normalized lowercase description.
const CATEGORY_KEYWORDS: Array<{ match: RegExp; hint: string[] }> = [
  // Essen & Trinken
  {
    match: /\b(pizza|burger|sushi|restau?rant|imbiss|essen|dinner|lunch|brunch|kebab|döner|doener|pasta|steak|bistro|café|cafe|coffee|kaffee|bar|cocktail|bier|wein|drinks?|getränke|getraenke|snack|frühstück|fruehstueck|mensa)\b/i,
    hint: ["essen", "food", "drinks", "getränke"],
  },
  // Supermarkt / Lebensmittel
  {
    match: /\b(rewe|edeka|aldi|lidl|netto|kaufland|penny|supermarkt|billa|spar|migros|coop|tesco|walmart|einkauf|lebensmittel|groceries|obst|gemüse|gemuese)\b/i,
    hint: ["lebensmittel", "groceries", "supermarkt", "einkauf"],
  },
  // Transport / Fahrt / Benzin
  {
    match: /\b(tanke|tankstelle|benzin|diesel|sprit|shell|aral|esso|jet|bp|uber|taxi|bolt|freenow|bahn|db|zug|flug|flight|airline|lufthansa|ryanair|easyjet|bus|tram|u-?bahn|s-?bahn|parking|parkhaus|parkticket|maut|toll|autobahn)\b/i,
    hint: ["transport", "reise", "travel", "fahrt"],
  },
  // Unterkunft
  {
    match: /\b(airbnb|hotel|hostel|pension|unterkunft|booking|expedia|apartment|übernachtung|uebernachtung|accommodation|zimmer|suite|motel|lodge|cabin|chalet)\b/i,
    hint: ["unterkunft", "hotel", "übernachtung"],
  },
  // Aktivitäten / Unterhaltung
  {
    match: /\b(kino|cinema|konzert|festival|ticket|eintritt|museum|park|zoo|escape|karaoke|bowling|disco|club|party|show|theater|oper|musical|spielplatz|spa|wellness|sauna|massage)\b/i,
    hint: ["aktivität", "aktivitaet", "entertainment", "unterhaltung"],
  },
  // Shopping / Geschenke
  {
    match: /\b(amazon|zalando|otto|ikea|mediamarkt|saturn|dm|rossmann|shop|shopping|geschenk|present|gift|deko|blumen|flowers|kleid|schuhe|kleidung)\b/i,
    hint: ["shopping", "geschenk", "gift", "einkauf"],
  },
  // Sonstiges (keine spezifischen Keywords, nur fallback)
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Best-guess category for a free-form description. Returns null when
 * no keyword matches or when no matching category exists in the
 * caller's category list.
 */
export function inferCategory(
  description: string,
  categories: ExpenseCategory[],
): ExpenseCategory | null {
  if (!description || description.length < 3) return null;
  if (categories.length === 0) return null;
  const text = normalize(description);

  for (const rule of CATEGORY_KEYWORDS) {
    if (!rule.match.test(text)) continue;
    // Find a category whose normalized name contains any of the hints
    for (const hint of rule.hint) {
      const match = categories.find((c) =>
        normalize(c.name).includes(hint) || hint.includes(normalize(c.name)),
      );
      if (match) return match;
    }
  }
  return null;
}

// -- Smart-split memory -------------------------------------------------

interface RecentSplit {
  mode: SplitType;
  excludeParticipantIds: string[];
  savedAt: string;
}

const STORAGE_KEY_PREFIX = "eb:expenses:v2:recentSplit:";

export function rememberRecentSplit(
  eventId: string,
  value: { mode: SplitType; excludeParticipantIds: string[] },
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: RecentSplit = {
      mode: value.mode,
      excludeParticipantIds: value.excludeParticipantIds,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY_PREFIX + eventId, JSON.stringify(payload));
  } catch {
    // quota / private mode — just skip
  }
}

export function recallRecentSplit(eventId: string): RecentSplit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + eventId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecentSplit;
    // TTL: 7 days — after that the memory is more likely stale than helpful
    const savedMs = Date.parse(parsed.savedAt);
    if (Number.isFinite(savedMs) && Date.now() - savedMs > 7 * 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(STORAGE_KEY_PREFIX + eventId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
