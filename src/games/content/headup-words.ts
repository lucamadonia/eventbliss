import i18n from 'i18next';
import type { HeadUpCategory } from './headup-words-de';
import * as de from './headup-words-de';
import * as en from './headup-words-en';
import * as es from './headup-words-es';
import * as fr from './headup-words-fr';
import * as it from './headup-words-it';
import * as nl from './headup-words-nl';
import * as pl from './headup-words-pl';
import * as pt from './headup-words-pt';
import * as tr from './headup-words-tr';
import * as ar from './headup-words-ar';
import { loadExtraRows, type ExtraRow } from './dynamicLoader';
import { mergeHeadupCategories } from './db-extras';

export type { HeadUpCategory };

const categoriesByLang: Record<string, HeadUpCategory[]> = {
  de: de.HEADUP_CATEGORIES_DE,
  en: en.HEADUP_CATEGORIES_EN,
  es: es.HEADUP_CATEGORIES_ES,
  fr: fr.HEADUP_CATEGORIES_FR,
  it: it.HEADUP_CATEGORIES_IT,
  nl: nl.HEADUP_CATEGORIES_NL,
  pl: pl.HEADUP_CATEGORIES_PL,
  pt: pt.HEADUP_CATEGORIES_PT,
  tr: tr.HEADUP_CATEGORIES_TR,
  ar: ar.HEADUP_CATEGORIES_AR,
};

const currentLang = (): string => i18n.language?.split('-')[0] || 'de';

// Im Admin gepflegte Kategorien/Wörter. Sie ERGÄNZEN den Grundstock (siehe
// db-extras.ts) und gelten nur für die Sprache, in der sie geladen wurden.
let _extra: { lang: string; rows: ExtraRow[] } | null = null;
let _merged: { lang: string; extra: typeof _extra; list: HeadUpCategory[] } | null = null;

/** Zusatzinhalte vorladen. Beim Öffnen des Spiels aufrufen; offline bleibt es beim Grundstock. */
export async function preloadHeadUpCategories(): Promise<void> {
  const lang = currentLang();
  _extra = { lang, rows: await loadExtraRows('headup', 'headup_word', lang) };
}

export function getHeadUpCategories(): HeadUpCategory[] {
  const lang = currentLang();
  // Wird bei jedem Rendern aufgerufen — die Zusammenführung nur einmal rechnen.
  if (_merged && _merged.lang === lang && _merged.extra === _extra) return _merged.list;
  const base = categoriesByLang[lang] || categoriesByLang.de;
  const rows = _extra && _extra.lang === lang ? _extra.rows : [];
  const list = rows.length > 0 ? mergeHeadupCategories(base, rows) : base;
  _merged = { lang, extra: _extra, list };
  return list;
}

/** Default export for backward compatibility */
export const HEADUP_CATEGORIES = de.HEADUP_CATEGORIES_DE;
