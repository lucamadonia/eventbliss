import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { scoreChipShadow } from '../components/TVScoreboard';

describe('TVScoreboard ring', () => {
  it('drops the active ring explicitly once nobody is active', () => {
    expect(scoreChipShadow(true, false, '#ff6b98')).toContain('#ff6b98');
    expect(scoreChipShadow(false, false, '#ff6b98')).toBe('none');
    expect(scoreChipShadow(false, true, '#ff6b98')).toContain('28px');
  });
});

describe('TVPhaseCard timing', () => {
  // Timer-Spiele schicken jede Sekunde einen neuen Zustand → neues Cue-Objekt.
  // Haengt der Effekt am Objekt, bricht jeder Takt den Ausblend-Timer ab und
  // die Karte bleibt stehen. Der Effekt darf nur am Schluessel haengen.
  it('runs its effect on the cue key, not on the cue object', () => {
    const src = fs.readFileSync(path.resolve(__dirname, 'TVPhaseCard.tsx'), 'utf8');
    expect(src).toContain('}, [cueKey, phaseStartsAt]);');
    expect(src).not.toContain('}, [cue, phaseStartsAt]);');
  });
});

describe('TV scene container', () => {
  // Ohne Hoehe am Szenen-Container fielen Ansichten mit h-full/flex-1 auf
  // Inhaltshoehe zusammen (Batch D musste h-screen in jede Ansicht schreiben).
  it('gives every scene the full screen height', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../TVScreen.tsx'), 'utf8');
    const scene = src.slice(src.indexOf('data-tv-scene'), src.indexOf('data-tv-scene') + 200);
    expect(scene).toMatch(/className="[^"]*\bh-screen\b[^"]*"/);
  });
});

describe('TV sentence case', () => {
  // Design-Regel: Satzschreibung, kein Sperrsatz ueber 0.04em. Ausnahme nur echte
  // Wortmarken (Brew-Titel, markiert mit „Wortmarke“).
  const SHARED = ['TVGameOver.tsx', 'TVPartyReady.tsx', 'TVPartyStandings.tsx', 'TVRules.tsx', 'TVLeaderboard.tsx',
    'components/TVPartyMap.tsx', 'components/TVPartyRoadmap.tsx', 'components/TVPartyProgressStrip.tsx',
    'games/TVBottleView.tsx', 'games/TVThisOrThatView.tsx', 'TVPartyFinale.tsx'];
  it.each(SHARED)('%s has no tracked caps', (file) => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
    expect(src).not.toMatch(/(?<![-:])\buppercase\b/);
    expect(src).not.toMatch(/tracking-\[0?\.(0[5-9]|[1-9])/);
  });

  it('keeps every TV/bomb headline value out of all caps in every language', () => {
    const KEYS = ['tv.impostor.whoIsImpostor', 'tv.impostor.checkPhones', 'tv.impostor.results', 'tv.whoami.title',
      'tv.truthdare.title', 'games.bomb.btnSolved', 'games.bomb.roundLabel', 'tv.headup.gameOver'];
    for (const code of ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'pl', 'tr', 'ar']) {
      const tree = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../i18n/locales/${code}.json`), 'utf8'));
      for (const key of KEYS) {
        const value = String(key.split('.').reduce((n: Record<string, unknown>, p) => n?.[p] as Record<string, unknown>, tree));
        const letters = value.replace(/\{\{\w+\}\}/g, '').replace(/[^\p{L}]/gu, '');
        expect(letters === letters.toUpperCase() && letters !== letters.toLowerCase(), `${code} ${key}: ${value}`).toBe(false);
      }
    }
  });
});
