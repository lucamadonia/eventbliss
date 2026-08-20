import { describe, it, expect } from 'vitest';
import {
  PANTOMIME_PROPS,
  PANTOMIME_HANDICAPS,
  PANTOMIME_STYLES,
} from './pantomime-extras';

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
 * Bindet Code und Übersetzung aneinander.
 *
 * Der eigentliche Zweck: Wer in `pantomime-extras.ts` eine Herausforderung
 * ergänzt — einen neuen Gegenstand, ein neues Handicap — bekommt hier sofort
 * einen roten Test statt im Spiel den rohen Schlüssel
 * „games.pantomime.props.teekanne" mitten in der Aufgabe.
 */
const LOCALES: Record<string, Record<string, unknown>> = {
  de: deLoc, en: enLoc, es: esLoc, fr: frLoc, it: itLoc,
  nl: nlLoc, pl: plLoc, pt: ptLoc, tr: trLoc, ar: arLoc,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pm = (l: Record<string, unknown>) => (l as any).games.pantomime;

/** Diese Texte stehen im Spiel unmittelbar auf einem Knopf oder Bildschirm. */
const REQUIRED = [
  'title', 'tagline', 'backToGames', 'playerN', 'playersLabel', 'teamsHint',
  'teamA', 'teamB', 'mode', 'rounds', 'categoriesLabel', 'mix', 'available',
  'loading', 'start', 'needFour', 'adultHint', 'extrasLabel', 'extrasOn',
  'extrasOff', 'extrasDesc', 'roundOf', 'leave', 'leaveTitle', 'leaveBody',
  'leaveStay', 'leaveGo', 'actorIs', 'ready', 'extraTitle', 'extraDouble',
  'extraAccept', 'extraDecline', 'fetchTitle', 'fetchGo', 'guessed', 'skip',
  'watching', 'wordsSoFar', 'summaryTitle', 'summaryDoubled', 'summaryEmpty',
  'next', 'finish', 'winner', 'draw', 'playAgain',
];

describe('OHNE WORTE — Sprachbestand', () => {
  for (const [lang, bundle] of Object.entries(LOCALES)) {
    describe(lang, () => {
      it('hat alle Oberflächentexte', () => {
        const block = pm(bundle);
        for (const key of REQUIRED) {
          expect(block[key], `${lang}: ${key} fehlt`).toBeTruthy();
        }
      });

      it('hat für jeden Gegenstand aus dem Code einen Text', () => {
        const props = pm(bundle).props ?? {};
        for (const key of PANTOMIME_PROPS) {
          expect(props[key], `${lang}: Gegenstand ${key} fehlt`).toBeTruthy();
        }
      });

      it('hat für jede Herausforderung aus dem Code einen Text', () => {
        const extras = pm(bundle).extras ?? {};
        const keys = [
          'requisit', 'halfTime', 'duo',
          ...PANTOMIME_HANDICAPS,
          ...PANTOMIME_STYLES,
        ];
        for (const key of keys) {
          expect(extras[key], `${lang}: Herausforderung ${key} fehlt`).toBeTruthy();
        }
      });

      it('behält den Platzhalter für den Gegenstand', () => {
        // Ohne {{item}} stünde da „Stell alles mit dar" — der Kochlöffel
        // verschwände wortlos.
        expect(pm(bundle).extras.requisit).toContain('{{item}}');
      });

      it('hat die drei Spielmodi und die Spielregeln', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = bundle as any;
        for (const m of ['entspannt', 'klassisch', 'blitz']) {
          expect(b.gameModes.pantomime[m]?.name, `${lang}: Modus ${m}`).toBeTruthy();
          expect(b.gameModes.pantomime[m]?.desc, `${lang}: Modus ${m} Beschreibung`).toBeTruthy();
        }
        expect(b.gameRules.pantomime?.title, `${lang}: Regeln`).toBeTruthy();
        expect(b.gameRules.pantomime?.step4, `${lang}: Regelschritt 4`).toBeTruthy();
        expect(b.native.gameNames.pantomime, `${lang}: Spielname`).toBeTruthy();
        expect(b.native.gameDescs.pantomime, `${lang}: Spielbeschreibung`).toBeTruthy();
      });
    });
  }
});
