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
import { loadFromDB, loadFromCacheSync } from './dynamicLoader';

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

let _dbCards: TabooCard[] | null = null;
let _dbLoaded = false;

/** Pre-load DB taboo cards. Call once at game start. */
export async function preloadTabooCards(): Promise<void> {
  if (_dbLoaded) return;
  _dbLoaded = true;
  const cached = loadFromCacheSync<TabooCard>('taboo', 'taboo_card');
  if (cached && cached.length > 0) { _dbCards = cached; return; }
  const db = await loadFromDB<TabooCard>('taboo', 'taboo_card');
  if (db && db.length > 0) _dbCards = db;
}

export function getTabooCards(): TabooCard[] {
  if (_dbCards && _dbCards.length > 0) return _dbCards;
  const lang = i18n.language?.split('-')[0] || 'de';
  return cardsByLang[lang] || cardsByLang.de;
}

/** Default export for backward compatibility */
export const TABOO_CARDS = de.TABOO_CARDS_DE;
