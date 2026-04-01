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

export function getHeadUpCategories(): HeadUpCategory[] {
  const lang = i18n.language?.split('-')[0] || 'de';
  return categoriesByLang[lang] || categoriesByLang.de;
}

/** Default export for backward compatibility */
export const HEADUP_CATEGORIES = de.HEADUP_CATEGORIES_DE;
