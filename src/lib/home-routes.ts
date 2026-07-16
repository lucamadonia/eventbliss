/**
 * Language-aware URLs for the marketing homepage.
 *
 * Mirrors the architecture of `legal-routes.ts`: the unprefixed `/` follows the
 * UI language (i18n state), while `/de`, `/en` … `/ar` are stable per-language
 * URLs whose page language is derived from the path. Exists so the homepage —
 * the site's highest-authority page — can rank in all 10 languages instead of
 * only one (it was a single client-language URL before).
 *
 *   unprefixed:  /       → follows the UI language, x-default
 *   prefixed:    /de, /en → page language from the URL
 */

import {
  SEO_LANGS,
  toSeoLang,
  type SeoLang,
  type Hreflang,
} from "./seo-routes";

export const SITE_URL = "https://event-bliss.com";

/** Path of the homepage — `/de` when a language is given, `/` (UI-language) otherwise. */
export function homePath(lang?: SeoLang | null): string {
  return lang ? `/${lang}` : "/";
}

/** Identify the language of a homepage pathname, or null if not a homepage route. */
export function parseHomeRoute(pathname: string): { lang: SeoLang | null } | null {
  if (pathname === "/") return { lang: null };
  const m = /^\/([a-zA-Z]{2})\/?$/.exec(pathname);
  if (!m) return null;
  const lang = toSeoLang(m[1]);
  return lang ? { lang } : null;
}

/**
 * Equivalent homepage URL in the target language — counterpart of
 * `mapSeoRoute`/`mapStaticRoute` for the LanguageSwitcher. Returns null when the
 * path is not a *prefixed* homepage (unprefixed `/` just follows the UI language,
 * no navigation needed) or is already in the target language.
 */
export function mapHomeRoute(pathname: string, targetCode: string): string | null {
  const parsed = parseHomeRoute(pathname);
  if (!parsed || !parsed.lang) return null;
  const target = toSeoLang(targetCode) ?? "en";
  if (target === parsed.lang) return null;
  return homePath(target);
}

/** hreflang alternates for the homepage: all 10 languages + x-default → `/`. */
export function homeHreflangs(siteUrl: string = SITE_URL): Hreflang[] {
  const out: Hreflang[] = SEO_LANGS.map((lang) => ({
    hreflang: lang,
    href: `${siteUrl}${homePath(lang)}`,
  }));
  // x-default → the unprefixed URL, which renders in the visitor's UI language.
  out.push({ hreflang: "x-default", href: `${siteUrl}${homePath()}` });
  return out;
}
