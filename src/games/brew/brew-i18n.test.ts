import { describe, it, expect } from 'vitest';
import { INGREDIENTS, RECIPES_BY_LENGTH, ingredientKey, recipeKey, type Skin } from './brew-content';

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
 * Bindet Code und Uebersetzung aneinander.
 *
 * WARUM ES DIESEN TEST GIBT: WHO AM I war in neun von zehn Sprachen
 * unspielbar, und keine einzige Pruefung schlug an — die Sprachtests
 * verglichen nur Sprachdateien untereinander, nie gegen den Code. Wer hier
 * eine Zutat oder ein Rezept in `brew-content.ts` ergaenzt, bekommt sofort
 * einen roten Test statt im Spiel den rohen Schluessel
 * "games.brew.ing.brew.foo" auf der Karte.
 *
 * Geprueft wird gegen die Schluessel, die `ingredientKey`/`recipeKey`
 * TATSAECHLICH erzeugen — nicht gegen eine zweite, von Hand gepflegte Liste.
 * Eine solche Liste waere die naechste Stelle, die auseinanderlaeuft.
 */
const LOCALES: Record<string, Record<string, unknown>> = {
  de: deLoc, en: enLoc, es: esLoc, fr: frLoc, it: itLoc,
  nl: nlLoc, pl: plLoc, pt: ptLoc, tr: trLoc, ar: arLoc,
};

const SKINS: Skin[] = ['brew', 'bar'];

/** Loest einen punktgetrennten Pfad im Uebersetzungsbaum auf. */
function resolve(tree: unknown, key: string): unknown {
  let cur: unknown = tree;
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/** Texte, die im Spiel unmittelbar auf einem Knopf oder Bildschirm stehen. */
const REQUIRED = [
  'titleBrew', 'titleBar', 'taglineBrew', 'taglineBar', 'backToGames', 'leave',
  'leaveTitle', 'leaveBody', 'leaveStay', 'leaveGo', 'playersLabel',
  'ingredientCountLabel', 'ingredientCountOption', 'start', 'yourRecipe',
  'counterLabel', 'trayLabel', 'deckCount', 'deckEmpty', 'counterUsed',
  'counterEmpty', 'trayEmpty', 'drawFromDeck', 'reshuffled', 'pourIn', 'turnOf',
  'missingCount', 'bustTitleBrew', 'bustTitleBar', 'bustBodyBrew', 'bustBodyBar',
  'bustContinue', 'penaltyIntro', 'sipPenalty',
];

describe('GEBRAEU — Sprachbestand', () => {
  for (const [lang, bundle] of Object.entries(LOCALES)) {
    describe(lang, () => {
      it('hat alle Oberflaechentexte', () => {
        for (const key of REQUIRED) {
          expect(resolve(bundle, `games.brew.${key}`), `${lang}: games.brew.${key} fehlt`).toBeTruthy();
        }
      });

      it('hat fuer jede Zutat aus dem Code einen Namen — in beiden Gewaendern', () => {
        for (const skin of SKINS) {
          for (const id of Object.keys(INGREDIENTS)) {
            const key = ingredientKey(id as keyof typeof INGREDIENTS, skin);
            expect(resolve(bundle, key), `${lang}: ${key} fehlt`).toBeTruthy();
          }
        }
      });

      it('hat fuer jedes Rezept aus dem Code einen Namen — in beiden Gewaendern', () => {
        const all = Object.values(RECIPES_BY_LENGTH).flat();
        expect(all.length, 'Rezeptbestand unerwartet leer').toBeGreaterThan(0);
        for (const skin of SKINS) {
          for (const r of all) {
            const key = recipeKey(r.id, skin);
            expect(resolve(bundle, key), `${lang}: ${key} fehlt`).toBeTruthy();
          }
        }
      });

      it('hat genau acht Strafaufgaben', () => {
        const tasks = resolve(bundle, 'games.brew.penaltyTasks');
        expect(Array.isArray(tasks), `${lang}: penaltyTasks ist keine Liste`).toBe(true);
        // Die Zahl steht fest, weil BrewGame.tsx per Zufallsindex zugreift:
        // eine kuerzere Liste in EINER Sprache liefert dort still einen leeren
        // Text, und der Bust-Dialog haette eine leere Zeile.
        expect((tasks as unknown[]).length, `${lang}: penaltyTasks hat nicht 8 Eintraege`).toBe(8);
      });

      it('hat den Regeltext fuer Modal und Fernseher', () => {
        for (const key of ['title', 'tagline', 'step1', 'step2', 'step3', 'tip']) {
          expect(resolve(bundle, `gameRules.brew.${key}`), `${lang}: gameRules.brew.${key} fehlt`).toBeTruthy();
        }
      });

      it('hat Name und Beschreibung fuer die Kachel im Hub', () => {
        expect(resolve(bundle, 'native.gameNames.brew'), `${lang}: native.gameNames.brew fehlt`).toBeTruthy();
        expect(resolve(bundle, 'native.gameDescs.brew'), `${lang}: native.gameDescs.brew fehlt`).toBeTruthy();
      });
    });
  }
});
