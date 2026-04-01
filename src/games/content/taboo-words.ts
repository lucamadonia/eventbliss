import i18n from 'i18next';
import type { TabooCard } from './taboo-words-de';
import * as de from './taboo-words-de';
import * as en from './taboo-words-en';
import * as es from './taboo-words-es';
import * as fr from './taboo-words-fr';
import * as it from './taboo-words-it';
import * as nl from './taboo-words-nl';
import * as pl from './taboo-words-pl';
import * as pt from './taboo-words-pt';
import * as tr from './taboo-words-tr';
import * as ar from './taboo-words-ar';

export type { TabooCard };

const cardsByLang: Record<string, TabooCard[]> = {
  de: de.TABOO_CARDS_DE,
  en: en.TABOO_CARDS_EN,
  es: es.TABOO_CARDS_ES,
  fr: fr.TABOO_CARDS_FR,
  it: it.TABOO_CARDS_IT,
  nl: nl.TABOO_CARDS_NL,
  pl: pl.TABOO_CARDS_PL,
  pt: pt.TABOO_CARDS_PT,
  tr: tr.TABOO_CARDS_TR,
  ar: ar.TABOO_CARDS_AR,
};

export function getTabooCards(): TabooCard[] {
  const lang = i18n.language?.split('-')[0] || 'de';
  return cardsByLang[lang] || cardsByLang.de;
}

/** Default export for backward compatibility */
export const TABOO_CARDS = de.TABOO_CARDS_DE;
