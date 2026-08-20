import { describe, it, expect } from 'vitest';
import { PANTOMIME_CATEGORIES_DE, type PantomimeCategory } from './pantomime-words-de';
import { PANTOMIME_CATEGORIES_EN } from './pantomime-words-en';
import { PANTOMIME_CATEGORIES_ES } from './pantomime-words-es';
import { PANTOMIME_CATEGORIES_FR } from './pantomime-words-fr';
import { PANTOMIME_CATEGORIES_IT } from './pantomime-words-it';
import { PANTOMIME_CATEGORIES_NL } from './pantomime-words-nl';
import { PANTOMIME_CATEGORIES_PL } from './pantomime-words-pl';
import { PANTOMIME_CATEGORIES_PT } from './pantomime-words-pt';
import { PANTOMIME_CATEGORIES_TR } from './pantomime-words-tr';
import { PANTOMIME_CATEGORIES_AR } from './pantomime-words-ar';

/**
 * Die Sprachdateien entstehen zu zehnt und werden nie zusammen gelesen. Fehlt
 * in einer davon eine Kategorie oder rutschen Begriffe weg, stürzt nichts ab —
 * das Spiel zeigt in genau dieser Sprache still weniger Karten, und das merkt
 * erst der Kunde. Deshalb wird der Bestand hier hart geprüft.
 *
 * Bewusst werden die EINZELNEN Sprachdateien importiert, nicht der Wrapper
 * `pantomime-words.ts`: Der zieht über `dynamicLoader` den Supabase-Client
 * mit, und der greift beim Laden auf `localStorage` zu — das gibt es in der
 * Node-Testumgebung nicht.
 */
const LANGS: Record<string, PantomimeCategory[]> = {
  de: PANTOMIME_CATEGORIES_DE,
  en: PANTOMIME_CATEGORIES_EN,
  es: PANTOMIME_CATEGORIES_ES,
  fr: PANTOMIME_CATEGORIES_FR,
  it: PANTOMIME_CATEGORIES_IT,
  nl: PANTOMIME_CATEGORIES_NL,
  pl: PANTOMIME_CATEGORIES_PL,
  pt: PANTOMIME_CATEGORIES_PT,
  tr: PANTOMIME_CATEGORIES_TR,
  ar: PANTOMIME_CATEGORIES_AR,
};

const WORDS_PER_CATEGORY = 50;

describe('OHNE WORTE — Begriffsbestand', () => {
  for (const [lang, cats] of Object.entries(LANGS)) {
    describe(lang, () => {
      it('hat dieselben neun Kategorien in derselben Reihenfolge', () => {
        // Die Reihenfolge zählt: Die Auswahl im Spiel rendert sie so, wie sie
        // hier stehen, und sie soll in jeder Sprache gleich aussehen.
        expect(cats.map((c) => c.id)).toEqual(PANTOMIME_CATEGORIES_DE.map((c) => c.id));
      });

      it(`hat in jeder Kategorie genau ${WORDS_PER_CATEGORY} Begriffe`, () => {
        for (const c of cats) {
          expect(c.words.length, `${lang}/${c.id}`).toBe(WORDS_PER_CATEGORY);
        }
      });

      it('hat keinen Begriff doppelt', () => {
        // Ein doppelter Begriff kommt im selben Spiel zweimal dran und sieht
        // nach einem Fehler aus.
        const all = cats.flatMap((c) => c.words);
        expect(new Set(all).size, `${lang}: Dubletten`).toBe(all.length);
      });

      it('hat überall einen Namen und ein Emoji', () => {
        for (const c of cats) {
          expect(c.name?.trim(), `${lang}/${c.id}: Name`).toBeTruthy();
          expect(c.emoji?.trim(), `${lang}/${c.id}: Emoji`).toBeTruthy();
        }
      });

      it('hat keine leeren Begriffe', () => {
        for (const c of cats) {
          for (const w of c.words) expect(w.trim(), `${lang}/${c.id}`).toBeTruthy();
        }
      });

      it('markiert genau die Kategorie „ab18" als erwachsen', () => {
        // Rutscht das Kennzeichen weg, landen die 18+-Begriffe ungefiltert im
        // Stapel — ohne dass irgendwo eine Warnung erschiene.
        const adult = cats.filter((c) => c.adult).map((c) => c.id);
        expect(adult).toEqual(['ab18']);
      });

      it('hat dieselben Emojis wie die deutsche Vorlage', () => {
        for (const c of cats) {
          const ref = PANTOMIME_CATEGORIES_DE.find((x) => x.id === c.id);
          expect(c.emoji, `${lang}/${c.id}`).toBe(ref?.emoji);
        }
      });
    });
  }

  it('liefert insgesamt 4500 Begriffe über zehn Sprachen', () => {
    const total = Object.values(LANGS).reduce(
      (sum, cats) => sum + cats.reduce((s, c) => s + c.words.length, 0),
      0,
    );
    expect(total).toBe(10 * 9 * WORDS_PER_CATEGORY);
  });
});
