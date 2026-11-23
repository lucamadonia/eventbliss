/**
 * OHNE WORTE — Begriffe je Sprache, plus die per Admin gepflegten.
 *
 * Wie bei Bombe, Tabu und Stirnraten wird ZUSAMMENGEFÜHRT: Grundstock aus der
 * Sprachdatei plus das, was im Admin dazugekommen ist. Datenbank-Inhalt
 * ersetzt nie etwas — sonst würde eine einzige gepflegte Zeile den gesamten
 * Grundstock verdrängen, und niemand merkt es.
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
import { loadExtraRows } from './dynamicLoader';

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

const currentLang = (): string => i18n.language?.split('-')[0] || 'de';

// Gilt nur für die Sprache, in der geladen wurde.
let _extra: { lang: string; words: ExtraWord[] } | null = null;

/** Zusatzbegriffe vorladen. Beim Öffnen des Spiels aufrufen; offline bleibt es beim Grundstock. */
export async function preloadPantomimeWords(): Promise<void> {
  const lang = currentLang();
  const rows = await loadExtraRows('pantomime', 'pantomime_word', lang);
  _extra = {
    lang,
    words: rows
      .map((r) => ({ category: (r.category ?? '') as PantomimeCategoryId, word: String(r.data.word ?? '').trim() }))
      .filter((e) => !!e.word),
  };
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
  const lang = currentLang();
  const base = byLang[lang] || byLang.de;
  const extraWords = _extra && _extra.lang === lang ? _extra.words : [];

  const merged = base.map((c) => {
    const extras = extraWords
      .filter((e) => e.category === c.id)
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
