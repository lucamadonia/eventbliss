/**
 * Central SEO route mapping for the multilingual bachelor/hen-party landing
 * pages and the budget calculator.
 *
 * Each language lives on its OWN URL family (the page language is derived from
 * the path, not from i18n state). This module is the single source of truth
 * that lets the language switcher, footer links, hreflang tags and the sitemap
 * all compute the equivalent URL of a page in another language.
 *
 * Families:
 *   • "jga"  — stag/bachelor city pages   (JgaCity / StagDoCity / IntlCity)
 *   • "hen"  — hen-do city pages          (HenDoCity)
 *   • "calc" — budget calculator          (JgaCalculator)
 *
 * Languages with their own SEO pages: de, en, es, fr, it, pt, nl, pl, tr, ar
 * (same 10 the app UI supports). Anything else falls back to English.
 *
 * Slugs: DE routes use German slugs (muenchen, koeln); every non-DE route uses
 * the anglicised slug (munich, cologne). Conversion reuses the existing
 * enSlugFromDe/deSlugFromEn helpers from hen-do-overlay.ts.
 */

import { getCityBySlug } from "./jga-cities";
import { getAllIntlSlugs } from "./intl-cities";
import { enSlugFromDe, deSlugFromEn, getHenDoCity } from "./hen-do-overlay";
import { HEN_DO_INTL } from "./hen-do-overlay-intl";
import { getIntlAr } from "./intl-cities-ar";
import { getHenDoAr } from "./hen-do-overlay-ar";

export type SeoLang =
  | "de" | "en" | "es" | "fr" | "it" | "pt" | "nl" | "pl" | "tr" | "ar";

export const SEO_LANGS: readonly SeoLang[] = [
  "de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr", "ar",
] as const;

export type SeoFamily = "jga" | "hen" | "calc";

/** Path prefix per language — stag/bachelor city family. */
export const JGA_PATH: Record<SeoLang, string> = {
  de: "/jga/",
  en: "/stag-do/",
  es: "/despedida/",
  fr: "/evg/",
  it: "/addio/",
  pt: "/despedida-de-solteiro/",
  nl: "/vrijgezellenfeest/",
  pl: "/wieczor-kawalerski/",
  tr: "/bekarliga-veda/",
  ar: "/wadaa-azubiya/",
};

/** Path prefix per language — hen-do family. */
export const HEN_PATH: Record<SeoLang, string> = {
  de: "/jga-frauen/",
  en: "/hen-do/",
  es: "/despedida-soltera/",
  fr: "/evjf/",
  it: "/addio-nubilato/",
  pt: "/despedida-de-solteira/",
  nl: "/vrijgezellinnenfeest/",
  pl: "/wieczor-panienski/",
  tr: "/kadin-bekarliga-veda/",
  ar: "/wadaa-azubiya-banat/",
};

/** Full path per language — budget calculator. */
export const CALC_PATH: Record<SeoLang, string> = {
  de: "/jga/kalkulator",
  en: "/stag-do/calculator",
  es: "/despedida/calculadora",
  fr: "/evg/calculatrice",
  it: "/addio/calcolatore",
  pt: "/despedida-de-solteiro/calculadora",
  nl: "/vrijgezellenfeest/calculator",
  pl: "/wieczor-kawalerski/kalkulator",
  tr: "/bekarliga-veda/hesaplayici",
  ar: "/wadaa-azubiya/hasiba",
};

/** OG locale per SEO language (xx_XX form). */
export const LOCALE_BY_LANG: Record<SeoLang, string> = {
  de: "de_DE", en: "en_GB", es: "es_ES", fr: "fr_FR", it: "it_IT",
  pt: "pt_PT", nl: "nl_NL", pl: "pl_PL", tr: "tr_TR", ar: "ar_AR",
};

/** html lang / hreflang code per SEO language. */
export const HTML_LANG_BY_LANG: Record<SeoLang, string> = {
  de: "de-DE", en: "en-GB", es: "es-ES", fr: "fr-FR", it: "it-IT",
  pt: "pt-PT", nl: "nl-NL", pl: "pl-PL", tr: "tr-TR", ar: "ar",
};

/** Native language label (for visible language-switch links). */
export const LANG_LABEL: Record<SeoLang, string> = {
  de: "Deutsch", en: "English", es: "Español", fr: "Français", it: "Italiano",
  pt: "Português", nl: "Nederlands", pl: "Polski", tr: "Türkçe", ar: "العربية",
};

export const RTL_LANGS: readonly SeoLang[] = ["ar"] as const;
export function isRtl(lang: SeoLang): boolean {
  return (RTL_LANGS as readonly string[]).includes(lang);
}

function isSeoLang(l: string): l is SeoLang {
  return (SEO_LANGS as readonly string[]).includes(l);
}

/** Normalise an i18n code ("de-DE", "ar") to a base SEO language, else null. */
export function toSeoLang(code: string | null | undefined): SeoLang | null {
  if (!code) return null;
  const base = code.split("-")[0].toLowerCase();
  return isSeoLang(base) ? base : null;
}

/** Whether a translated city page exists for this family + language. */
export function cityAvailable(
  family: "jga" | "hen",
  lang: SeoLang,
  deSlug: string,
): boolean {
  const de = deSlug.toLowerCase();
  if (family === "jga") {
    if (lang === "de" || lang === "en") return Boolean(getCityBySlug(de));
    if (lang === "ar") return Boolean(getIntlAr(enSlugFromDe(de)));
    return getAllIntlSlugs().includes(enSlugFromDe(de));
  }
  // hen
  if (lang === "de" || lang === "en") return Boolean(getHenDoCity(de));
  if (lang === "ar") return Boolean(getHenDoAr(de));
  return Boolean(getHenDoCity(de)) && Boolean(HEN_DO_INTL[de]);
}

interface ParsedRoute {
  family: SeoFamily;
  lang: SeoLang;
  /** German base slug (city families only). */
  deSlug?: string;
}

/** Identify the SEO family + language of a pathname, or null if not an SEO page. */
export function parseSeoRoute(pathname: string): ParsedRoute | null {
  // Calculator first — its paths are nested under city prefixes (e.g. /jga/kalkulator).
  for (const lang of SEO_LANGS) {
    if (pathname === CALC_PATH[lang] || pathname.startsWith(CALC_PATH[lang] + "/")) {
      return { family: "calc", lang };
    }
  }
  for (const lang of SEO_LANGS) {
    const p = JGA_PATH[lang];
    if (pathname.startsWith(p)) {
      const raw = pathname.slice(p.length).split("/")[0].toLowerCase();
      if (!raw) return null;
      const deSlug = lang === "de" ? raw : deSlugFromEn(raw);
      return { family: "jga", lang, deSlug };
    }
  }
  for (const lang of SEO_LANGS) {
    const p = HEN_PATH[lang];
    if (pathname.startsWith(p)) {
      const raw = pathname.slice(p.length).split("/")[0].toLowerCase();
      if (!raw) return null;
      const deSlug = lang === "de" ? raw : deSlugFromEn(raw);
      return { family: "hen", lang, deSlug };
    }
  }
  return null;
}

/**
 * Equivalent URL of the current SEO page in the target language.
 * Returns null when the current page is not an SEO page or no equivalent
 * exists (caller should then just switch the UI language without navigating).
 * Falls back to the English version of a city when the target has no page.
 */
export function mapSeoRoute(pathname: string, targetCode: string): string | null {
  const parsed = parseSeoRoute(pathname);
  if (!parsed) return null;
  const target = toSeoLang(targetCode) ?? "en";

  if (parsed.family === "calc") {
    return target === parsed.lang ? null : CALC_PATH[target];
  }

  const family = parsed.family; // "jga" | "hen"
  const deSlug = parsed.deSlug!;
  if (target === parsed.lang) return null;

  let tl: SeoLang = target;
  if (!cityAvailable(family, tl, deSlug)) {
    if (parsed.lang !== "en" && cityAvailable(family, "en", deSlug)) tl = "en";
    else return null; // nothing better than current → stay
  }
  const paths = family === "jga" ? JGA_PATH : HEN_PATH;
  const slug = tl === "de" ? deSlug : enSlugFromDe(deSlug);
  return `${paths[tl]}${slug}`;
}

/** Best stag/bachelor city path for a German slug in the given UI language. */
export function localizedJgaCityPath(deSlug: string, code: string): string {
  const de = deSlug.toLowerCase();
  const want = toSeoLang(code) ?? "en";
  const tl: SeoLang = cityAvailable("jga", want, de)
    ? want
    : cityAvailable("jga", "en", de)
      ? "en"
      : "de";
  const slug = tl === "de" ? de : enSlugFromDe(de);
  return `${JGA_PATH[tl]}${slug}`;
}

/** Budget-calculator path for the given UI language. */
export function localizedCalculatorPath(code: string): string {
  return CALC_PATH[toSeoLang(code) ?? "en"];
}

export interface Hreflang {
  hreflang: string;
  href: string;
}

function cityHreflangs(
  family: "jga" | "hen",
  deSlug: string,
  siteUrl: string,
): Hreflang[] {
  const de = deSlug.toLowerCase();
  const paths = family === "jga" ? JGA_PATH : HEN_PATH;
  const out: Hreflang[] = [];
  for (const lang of SEO_LANGS) {
    if (!cityAvailable(family, lang, de)) continue;
    const slug = lang === "de" ? de : enSlugFromDe(de);
    out.push({ hreflang: lang, href: `${siteUrl}${paths[lang]}${slug}` });
  }
  if (cityAvailable(family, "en", de)) {
    out.push({ hreflang: "x-default", href: `${siteUrl}${paths.en}${enSlugFromDe(de)}` });
  }
  return out;
}

/** hreflang alternates for a stag/bachelor city page (only languages that exist). */
export function jgaHreflangs(deSlug: string, siteUrl: string): Hreflang[] {
  return cityHreflangs("jga", deSlug, siteUrl);
}

/** hreflang alternates for a hen-do city page (only languages that exist). */
export function henHreflangs(deSlug: string, siteUrl: string): Hreflang[] {
  return cityHreflangs("hen", deSlug, siteUrl);
}

/** hreflang alternates for the budget calculator (all languages). */
export function calcHreflangs(siteUrl: string): Hreflang[] {
  const out: Hreflang[] = SEO_LANGS.map((l) => ({
    hreflang: l,
    href: `${siteUrl}${CALC_PATH[l]}`,
  }));
  out.push({ hreflang: "x-default", href: `${siteUrl}${CALC_PATH.en}` });
  return out;
}
