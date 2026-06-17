/**
 * geo-i18n — localized display names for agency countries and cities.
 *
 * Countries are localized at runtime via `Intl.DisplayNames` (works for all 10
 * app languages). Cities are stored as German exonyms in `agencies-data.ts`
 * (München, Köln, Mailand, Lissabon …) and have no runtime localization source,
 * so we keep an explicit per-language override map keyed on the canonical
 * (German) city string. Anything without an override falls back to the
 * canonical name (Berlin, Hamburg, Madrid … are identical across languages).
 *
 * IMPORTANT: filtering/grouping must keep using the canonical `city` value;
 * only the *displayed* label goes through `localizeCity`.
 */

export type Lang =
  | "de" | "en" | "es" | "fr" | "it" | "nl" | "pt" | "pl" | "tr" | "ar";

const SUPPORTED: Lang[] = ["de", "en", "es", "fr", "it", "nl", "pt", "pl", "tr", "ar"];

function normalizeLang(lang: string | undefined): Lang {
  const code = (lang || "de").slice(0, 2).toLowerCase() as Lang;
  return SUPPORTED.includes(code) ? code : "de";
}

// ─── City overrides (keyed on the canonical German name in the data) ────────
// Only languages whose name differs from the canonical key are listed; the rest
// fall back to the key. Arabic is provided for every city (different script).
export const CITY_I18N: Record<string, Partial<Record<Lang, string>>> = {
  // Deutschland
  Berlin: { ar: "برلين" },
  Hamburg: { ar: "هامبورغ" },
  "München": { en: "Munich", es: "Múnich", fr: "Munich", it: "Monaco di Baviera", pt: "Munique", pl: "Monachium", tr: "Münih", ar: "ميونخ" },
  "Köln": { en: "Cologne", es: "Colonia", fr: "Cologne", it: "Colonia", nl: "Keulen", pt: "Colônia", pl: "Kolonia", ar: "كولونيا" },
  Frankfurt: { ar: "فرانكفورت" },
  "Düsseldorf": { ar: "دوسلدورف" },
  Stuttgart: { ar: "شتوتغارت" },
  Dresden: { ar: "دريسدن" },
  Leipzig: { ar: "لايبزيغ" },
  Hannover: { en: "Hanover", ar: "هانوفر" },
  "Nürnberg": { en: "Nuremberg", es: "Núremberg", fr: "Nuremberg", it: "Norimberga", nl: "Neurenberg", pt: "Nuremberga", pl: "Norymberga", ar: "نورمبرغ" },
  Bremen: { ar: "بريمن" },
  Dortmund: { ar: "دورتموند" },
  Essen: { ar: "إيسن" },

  // Österreich
  Wien: { en: "Vienna", es: "Viena", fr: "Vienne", it: "Vienna", nl: "Wenen", pt: "Viena", pl: "Wiedeń", tr: "Viyana", ar: "فيينا" },
  Salzburg: { es: "Salzburgo", fr: "Salzbourg", it: "Salisburgo", pt: "Salzburgo", ar: "سالزبورغ" },
  Graz: { ar: "غراتس" },
  Innsbruck: { ar: "إنسبروك" },
  Linz: { ar: "لينتس" },

  // Schweiz
  "Zürich": { en: "Zurich", es: "Zúrich", it: "Zurigo", pt: "Zurique", pl: "Zurych", tr: "Zürih", ar: "زيورخ" },
  Genf: { en: "Geneva", es: "Ginebra", fr: "Genève", it: "Ginevra", nl: "Genève", pt: "Genebra", pl: "Genewa", tr: "Cenevre", ar: "جنيف" },
  Basel: { es: "Basilea", fr: "Bâle", it: "Basilea", nl: "Bazel", pt: "Basileia", pl: "Bazylea", ar: "بازل" },
  Bern: { es: "Berna", fr: "Berne", it: "Berna", pt: "Berna", pl: "Berno", ar: "برن" },
  Lausanne: { es: "Lausana", it: "Losanna", pt: "Lausana", pl: "Lozanna", tr: "Lozan", ar: "لوزان" },

  // Niederlande
  Amsterdam: { ar: "أمستردام" },
  Rotterdam: { ar: "روتردام" },
  "Den Haag": { en: "The Hague", es: "La Haya", fr: "La Haye", it: "L'Aia", pt: "Haia", pl: "Haga", tr: "Lahey", ar: "لاهاي" },
  Utrecht: { ar: "أوترخت" },
  Eindhoven: { ar: "آيندهوفن" },

  // Belgien
  "Brüssel": { en: "Brussels", es: "Bruselas", fr: "Bruxelles", it: "Bruxelles", nl: "Brussel", pt: "Bruxelas", pl: "Bruksela", tr: "Brüksel", ar: "بروكسل" },
  Antwerpen: { en: "Antwerp", es: "Amberes", fr: "Anvers", it: "Anversa", pt: "Antuérpia", pl: "Antwerpia", tr: "Anvers", ar: "أنتويرب" },
  "Brügge": { en: "Bruges", es: "Brujas", fr: "Bruges", it: "Bruges", nl: "Brugge", pt: "Bruges", pl: "Brugia", tr: "Bruges", ar: "بروج" },
  Gent: { en: "Ghent", es: "Gante", fr: "Gand", it: "Gand", pt: "Gante", pl: "Gandawa", ar: "غنت" },

  // Frankreich
  Paris: { ar: "باريس" },
  Lyon: { it: "Lione", ar: "ليون" },
  Marseille: { es: "Marsella", it: "Marsiglia", pt: "Marselha", pl: "Marsylia", tr: "Marsilya", ar: "مرسيليا" },
  Nizza: { en: "Nice", es: "Niza", fr: "Nice", nl: "Nice", pt: "Nice", pl: "Nicea", tr: "Nice", ar: "نيس" },
  Bordeaux: { es: "Burdeos", pt: "Bordéus", ar: "بوردو" },
  Toulouse: { ar: "تولوز" },
  "Straßburg": { en: "Strasbourg", es: "Estrasburgo", fr: "Strasbourg", it: "Strasburgo", nl: "Straatsburg", pt: "Estrasburgo", pl: "Strasburg", tr: "Strazburg", ar: "ستراسبورغ" },
  Lille: { it: "Lilla", ar: "ليل" },

  // Spanien
  Madrid: { ar: "مدريد" },
  Barcelona: { ar: "برشلونة" },
  Valencia: { it: "Valenza", ar: "فالنسيا" },
  Sevilla: { en: "Seville", fr: "Séville", it: "Siviglia", pt: "Sevilha", pl: "Sewilla", ar: "إشبيلية" },
  "Málaga": { en: "Malaga", fr: "Malaga", it: "Malaga", nl: "Malaga", pl: "Malaga", tr: "Malaga", ar: "مالقة" },
  Bilbao: { ar: "بلباو" },
  Zaragoza: { fr: "Saragosse", it: "Saragozza", pt: "Saragoça", pl: "Saragossa", ar: "سرقسطة" },
  Ibiza: { ar: "إيبيزا" },
  Mallorca: { fr: "Majorque", it: "Maiorca", pt: "Maiorca", pl: "Majorka", tr: "Mayorka", ar: "مايوركا" },
  Marbella: { ar: "ماربيا" },

  // Portugal
  Lissabon: { en: "Lisbon", es: "Lisboa", fr: "Lisbonne", it: "Lisbona", pt: "Lisboa", pl: "Lizbona", tr: "Lizbon", ar: "لشبونة" },
  Porto: { es: "Oporto", ar: "بورتو" },
  Faro: { ar: "فارو" },

  // Italien
  Rom: { en: "Rome", es: "Roma", fr: "Rome", it: "Roma", nl: "Rome", pt: "Roma", pl: "Rzym", tr: "Roma", ar: "روما" },
  Mailand: { en: "Milan", es: "Milán", fr: "Milan", it: "Milano", nl: "Milaan", pt: "Milão", pl: "Mediolan", tr: "Milano", ar: "ميلانو" },
  Venedig: { en: "Venice", es: "Venecia", fr: "Venise", it: "Venezia", nl: "Venetië", pt: "Veneza", pl: "Wenecja", tr: "Venedik", ar: "البندقية" },
};

/** Localize a canonical city string for the active language (fallback = canonical). */
export function localizeCity(city: string, lang: string | undefined): string {
  if (!city) return city;
  const code = normalizeLang(lang);
  return CITY_I18N[city]?.[code] ?? city;
}

// ─── Country localization via Intl.DisplayNames (primary → English → fallback) ──
const _regionCache: Record<string, Intl.DisplayNames | null> = {};

function regionNames(locale: string): Intl.DisplayNames | null {
  if (locale in _regionCache) return _regionCache[locale];
  let dn: Intl.DisplayNames | null = null;
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
      dn = new Intl.DisplayNames([locale], { type: "region" });
    }
  } catch {
    dn = null;
  }
  _regionCache[locale] = dn;
  return dn;
}

/**
 * Localized country name for an ISO-2 code. Falls back to English, then to the
 * provided fallback (raw data value) for old WebViews without DisplayNames.
 */
export function localizeCountry(code: string, lang: string | undefined, fallback: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return fallback;
  const locale = normalizeLang(lang);
  try {
    const name = regionNames(locale)?.of(code);
    if (name && name !== code) return name;
  } catch { /* unsupported code */ }
  try {
    const name = regionNames("en")?.of(code);
    if (name && name !== code) return name;
  } catch { /* unsupported code */ }
  return fallback;
}
