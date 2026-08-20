import { describe, it, expect } from 'vitest';
import { CE_CATEGORIES, CE_FRAMES, CE_UNITS } from './closeenough-content';

import deLoc from '@/i18n/locales/de.json';
import enLoc from '@/i18n/locales/en.json';
import esLoc from '@/i18n/locales/es.json';
import frLoc from '@/i18n/locales/fr.json';
import itLoc from '@/i18n/locales/it.json';
import nlLoc from '@/i18n/locales/nl.json';
import plLoc from '@/i18n/locales/pl.json';
import ptLoc from '@/i18n/locales/pt.json';
import trLoc from '@/i18n/locales/tr.json';
import arLoc from '@/i18n/locales/ar.json';

/**
 * Eine fehlende Übersetzung stürzt nicht ab — i18next zeigt dann den rohen
 * Schlüssel an, und im Spiel steht „games.closeenough.units.people.other"
 * mitten in der Frage. Das fällt nur auf, wenn jemand genau diese Sprache
 * spielt, also praktisch nie vor dem Kundeneinsatz.
 *
 * Deshalb wird der Bestand hier hart geprüft statt in zehn Handproben.
 */
const LOCALES: Record<string, Record<string, unknown>> = {
  de: deLoc, en: enLoc, es: esLoc, fr: frLoc, it: itLoc,
  nl: nlLoc, pl: plLoc, pt: ptLoc, tr: trLoc, ar: arLoc,
};

/** Pluralformen, die `Intl.PluralRules` in dieser Sprache erzeugen kann. */
function pluralCategories(lang: string): string[] {
  return [...new Intl.PluralRules(lang).resolvedOptions().pluralCategories];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ce = (l: Record<string, unknown>) => (l as any).games.closeenough;

describe('CLOSE ENOUGH — Sprachbestand', () => {
  for (const [lang, bundle] of Object.entries(LOCALES)) {
    describe(lang, () => {
      it('hat für jeden der 42 Rahmen einen Fragesatz mit {{name}}', () => {
        const frames = ce(bundle).frames ?? {};
        for (const key of Object.keys(CE_FRAMES)) {
          const sentence = frames[key];
          expect(sentence, `${lang}: Rahmen ${key} fehlt`).toBeTruthy();
          // Ohne den Platzhalter stünde die Frage ohne ihren Gegenstand da:
          // „Wie hoch ist ?"
          expect(String(sentence), `${lang}: {{name}} fehlt in ${key}`).toContain('{{name}}');
        }
      });

      it('hat für jeden der 42 Rahmen einen Vergleichsanker', () => {
        const anchors = ce(bundle).anchors ?? {};
        for (const key of Object.keys(CE_FRAMES)) {
          expect(anchors[key], `${lang}: Anker ${key} fehlt`).toBeTruthy();
        }
      });

      it('hat jede Einheit in der passenden Form', () => {
        const units = ce(bundle).units ?? {};
        const cats = pluralCategories(lang);
        for (const [key, display] of Object.entries(CE_UNITS)) {
          // Jahreszahlen bekommen bewusst keine Einheit angehängt: „1889 Jahre"
          // wäre falsch, gemeint ist das Jahr 1889.
          if (display === 'none') continue;
          const entry = units[key];
          expect(entry, `${lang}: Einheit ${key} fehlt`).toBeTruthy();
          if (display === 'symbol') {
            expect(entry.symbol, `${lang}: Symbol für ${key} fehlt`).toBeTruthy();
          } else {
            // `other` ist die Rückfallebene von unitWord() und deshalb Pflicht.
            expect(entry.other, `${lang}: Pluralform other für ${key} fehlt`).toBeTruthy();
            for (const c of cats) {
              expect(
                entry[c] ?? entry.other,
                `${lang}: Form ${c} für ${key} fehlt`,
              ).toBeTruthy();
            }
          }
        }
      });

      it('hat alle sieben Kategorien plus die Mischung', () => {
        const cats = ce(bundle).categories ?? {};
        expect(cats.mix, `${lang}: mix fehlt`).toBeTruthy();
        for (const c of CE_CATEGORIES) {
          expect(cats[c], `${lang}: Kategorie ${c} fehlt`).toBeTruthy();
        }
      });

      it('hat die Oberflächentexte, die im Spiel unmittelbar sichtbar sind', () => {
        const block = ce(bundle);
        const REQUIRED = [
          'title', 'tagline', 'start', 'submit', 'submitWith', 'submitted',
          'waitingOthers', 'roundOf', 'yourGuess', 'exactHit', 'offBy',
          'noGuess', 'points', 'roundWinner', 'nobody', 'next', 'finish',
          'source', 'asOf', 'showHint', 'passTo', 'passReady', 'roundIntro',
          'getReady', 'teamMode', 'teamModeSolo', 'teamModeGroups',
          'playersLabel', 'groupsLabel', 'playerN', 'teamN',
        ];
        for (const key of REQUIRED) {
          expect(block[key], `${lang}: ${key} fehlt`).toBeTruthy();
        }
      });

      it('hat die drei Spielmodi und die Spielregeln', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = bundle as any;
        for (const m of ['entspannt', 'klassisch', 'blitz']) {
          expect(b.gameModes.closeenough[m]?.name, `${lang}: Modus ${m}`).toBeTruthy();
          expect(b.gameModes.closeenough[m]?.desc, `${lang}: Modus ${m} Beschreibung`).toBeTruthy();
        }
        expect(b.gameRules.closeenough?.title, `${lang}: Regeln`).toBeTruthy();
        expect(b.native.gameNames.closeenough, `${lang}: Spielname`).toBeTruthy();
        expect(b.native.gameDescs.closeenough, `${lang}: Spielbeschreibung`).toBeTruthy();
      });
    });
  }
});
