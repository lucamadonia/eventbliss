/**
 * Derives the page language from the `:lang` URL param of the prefixed
 * legal/support routes (`/de/legal/privacy`, `/fr/support`) and switches
 * i18next accordingly.
 *
 * Deliberately does NOT set `eb.langManual` — visiting a language URL is not
 * an explicit user preference, so the app keeps following the device language
 * elsewhere. The lazy locale load runs via the existing `languageChanged`
 * handler in `src/i18n/index.ts`.
 */
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toSeoLang, type SeoLang } from "@/lib/seo-routes";

export interface UrlLanguage {
  /** Validated language from the URL, or null on unprefixed routes. */
  lang: SeoLang | null;
  /** true when a `:lang` param exists but is not a supported language → 404. */
  invalid: boolean;
}

export function useUrlLanguage(): UrlLanguage {
  const { lang: param } = useParams<{ lang?: string }>();
  const { i18n } = useTranslation();
  const lang = toSeoLang(param);

  useEffect(() => {
    if (lang && toSeoLang(i18n.language) !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [lang, i18n, i18n.language]);

  return { lang, invalid: Boolean(param) && !lang };
}
