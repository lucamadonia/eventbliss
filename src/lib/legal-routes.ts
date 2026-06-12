/**
 * Language-aware URLs for the static legal/support pages.
 *
 * Mirrors the architecture of `seo-routes.ts` for the SEO landing pages, but
 * with CONSTANT English path segments — only the language prefix varies:
 *
 *   unprefixed:  /legal/privacy        → follows the UI language (i18n state)
 *   prefixed:    /de/legal/privacy     → page language is derived from the URL
 *
 * The prefixed family exists so App Store Connect (which has per-locale
 * support/privacy URL fields), hreflang clusters and the sitemap can point to
 * a stable URL per language. The unprefixed family stays for backwards
 * compatibility and for the native app.
 */

import {
  SEO_LANGS,
  toSeoLang,
  type SeoLang,
  type Hreflang,
} from "./seo-routes";

export const SITE_URL = "https://event-bliss.com";

export type StaticPage =
  | "privacy"
  | "terms"
  | "disclaimer"
  | "imprint"
  | "agency-agreement"
  | "support";

export const STATIC_PAGES: readonly StaticPage[] = [
  "privacy",
  "terms",
  "disclaimer",
  "imprint",
  "agency-agreement",
  "support",
] as const;

/** Unprefixed base path per page (language-invariant segments). */
export const STATIC_BASE_PATH: Record<StaticPage, string> = {
  privacy: "/legal/privacy",
  terms: "/legal/terms",
  disclaimer: "/legal/disclaimer",
  imprint: "/legal/imprint",
  "agency-agreement": "/legal/agency-agreement",
  support: "/support",
};

/**
 * Path of a static page — `/de/legal/privacy` when a language is given,
 * `/legal/privacy` (UI-language driven) otherwise.
 */
export function staticPagePath(page: StaticPage, lang?: SeoLang | null): string {
  return lang ? `/${lang}${STATIC_BASE_PATH[page]}` : STATIC_BASE_PATH[page];
}

export interface ParsedStaticRoute {
  page: StaticPage;
  /** null → unprefixed route (UI language). */
  lang: SeoLang | null;
}

/** Identify page + language of a pathname, or null if not a static page. */
export function parseStaticRoute(pathname: string): ParsedStaticRoute | null {
  let lang: SeoLang | null = null;
  let rest = pathname;
  const m = /^\/([a-zA-Z]{2})(\/.+)$/.exec(pathname);
  if (m) {
    const candidate = toSeoLang(m[1]);
    if (candidate) {
      lang = candidate;
      rest = m[2];
    }
  }
  const clean = rest.length > 1 ? rest.replace(/\/+$/, "") : rest;
  for (const page of STATIC_PAGES) {
    if (clean === STATIC_BASE_PATH[page]) return { page, lang };
  }
  return null;
}

/**
 * Equivalent URL of the current static page in the target language — the
 * counterpart of `mapSeoRoute` for the LanguageSwitcher. Returns null when
 * the path is not a *prefixed* static page (unprefixed pages simply follow
 * the UI language, no navigation needed) or already in the target language.
 */
export function mapStaticRoute(pathname: string, targetCode: string): string | null {
  const parsed = parseStaticRoute(pathname);
  if (!parsed || !parsed.lang) return null;
  const target = toSeoLang(targetCode) ?? "en";
  if (target === parsed.lang) return null;
  return staticPagePath(parsed.page, target);
}

/** hreflang alternates for a static page: all 10 languages + x-default. */
export function staticHreflangs(page: StaticPage, siteUrl: string = SITE_URL): Hreflang[] {
  const out: Hreflang[] = SEO_LANGS.map((lang) => ({
    hreflang: lang,
    href: `${siteUrl}${staticPagePath(page, lang)}`,
  }));
  // x-default → the unprefixed URL, which renders in the visitor's UI language.
  out.push({ hreflang: "x-default", href: `${siteUrl}${staticPagePath(page)}` });
  return out;
}
