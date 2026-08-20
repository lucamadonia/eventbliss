/**
 * OHNE WORTE — Begriffe je Sprache, plus die per Admin gepflegten.
 *
 * Aufbau wie `taboo-words.ts`, mit EINEM bewussten Unterschied: Dort ersetzt
 * Datenbank-Inhalt die Sprachdateien vollständig (`getTabooCards()` liefert
 * `_dbCards`, sobald welche da sind). Eine einzige gepflegte Karte würde damit
 * den gesamten Grundstock aller zehn Sprachen verdrängen — und niemand merkt
 * es, das Spiel läuft ja weiter, nur mit einer Karte.
 *
 * Hier wird stattdessen ZUSAMMENGEFÜHRT: Grundstock aus der Sprachdatei plus
 * das, was im Admin dazugekommen ist. Muster von `pixeljagd-extra.ts`.
 */
import i18n from 'i18next';
import type { PantomimeCategory, PantomimeCategoryId } from './pantomime-words-de';
import * as de from './pantomime-words-de';
import * as en from './pantomime-words-en';
import * as es from './pantomime-words-es';
import * as fr from './pantomime-words-fr';
import * as it from './pantomime-words-it';
import * as nl from './pantomime-words-nl';
import * as pl from './pantomime-words-pl';
import * as pt from './pantomime-words-pt';
import * as tr from './pantomime-words-tr';
import * as ar from './pantomime-words-ar';
import { loadFromDB, loadFromCacheSync } from './dynamicLoader';

export type { PantomimeCategory, PantomimeCategoryId };

const byLang: Record<string, PantomimeCategory[]> = {
  de: de.PANTOMIME_CATEGORIES_DE,
  en: en.PANTOMIME_CATEGORIES_EN,
  es: es.PANTOMIME_CATEGORIES_ES,
  fr: fr.PANTOMIME_CATEGORIES_FR,
  it: it.PANTOMIME_CATEGORIES_IT,
  nl: nl.PANTOMIME_CATEGORIES_NL,
  pl: pl.PANTOMIME_CATEGORIES_PL,
  pt: pt.PANTOMIME_CATEGORIES_PT,
  tr: tr.PANTOMIME_CATEGORIES_TR,
  ar: ar.PANTOMIME_CATEGORIES_AR,
};

/** Eine im Admin gepflegte Zeile: ein Begriff für eine Kategorie. */
interface ExtraWord {
  category: PantomimeCategoryId;
  word: string;
}

let _extra: ExtraWord[] | null = null;
let _loaded = false;

/** Zusatzbegriffe vorladen. Einmal beim Spielstart aufrufen. */
export async function preloadPantomimeWords(): Promise<void> {
  if (_loaded) return;
  _loaded = true;
  const cached = loadFromCacheSync<ExtraWord>('pantomime', 'pantomime_word');
  if (cached && cached.length > 0) {
    _extra = cached;
    return;
  }
  const db = await loadFromDB<ExtraWord>('pantomime', 'pantomime_word');
  if (db && db.length > 0) _extra = db;
}

/**
 * Die Kategorien der aktiven Sprache.
 *
 * @param includeAdult Nur `true`, wenn der 18+-Bereich freigeschaltet ist.
 *   Die Entscheidung fällt EINMAL hier, damit Auswahlliste und Kartenstapel
 *   nicht auseinanderlaufen können — sonst stünde die Kategorie zwar nicht in
 *   der Auswahl, ihre Begriffe kämen aber trotzdem in die Mischung.
 */
export function getPantomimeCategories(includeAdult = false): PantomimeCategory[] {
  const lang = i18n.language?.split('-')[0] || 'de';
  const base = byLang[lang] || byLang.de;

  const merged = base.map((c) => {
    const extras = (_extra ?? [])
      .filter((e) => e.category === c.id && !!e.word)
      .map((e) => e.word);
    // Dubletten fallen raus: Ein Begriff, der zweimal im Stapel liegt, kommt
    // im selben Spiel zweimal dran und sieht nach einem Fehler aus.
    return extras.length > 0
      ? { ...c, words: Array.from(new Set([...c.words, ...extras])) }
      : c;
  });

  return includeAdult ? merged : merged.filter((c) => !c.adult);
}

/** Alle Begriffe der gewählten Kategorien als flacher Stapel. */
export function getPantomimeWords(
  categoryIds: PantomimeCategoryId[],
  includeAdult = false,
): string[] {
  const cats = getPantomimeCategories(includeAdult);
  const chosen = categoryIds.length > 0 ? cats.filter((c) => categoryIds.includes(c.id)) : cats;
  return chosen.flatMap((c) => c.words);
}
