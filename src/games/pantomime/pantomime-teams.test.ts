import { describe, it, expect } from 'vitest';
import {
  assignTeams,
  shuffleTeams,
  flipTeam,
  canPlay,
  teamSizes,
  splitByTeam,
} from './pantomime-teams';

/**
 * Die Aufstellung ist das, was der Nutzer VOR dem Start sehen will — und der
 * Fehler, den man dabei macht, faellt erst am Spieltisch auf: ein Team mit
 * einer Person kann nicht spielen.
 */
describe('assignTeams', () => {
  it('verteilt neue Spieler gleichmäßig', () => {
    const map = assignTeams(['a', 'b', 'c', 'd']);
    expect(teamSizes(map)).toEqual([2, 2]);
  });

  it('lässt bestehende Zuordnungen unangetastet', () => {
    // Sonst wuerfelt sich beim Tippen des naechsten Namens die ganze
    // Aufstellung neu, und niemand kann sich absprechen.
    const before = assignTeams(['a', 'b', 'c', 'd']);
    const after = assignTeams(['a', 'b', 'c', 'd', 'e'], before);
    for (const id of ['a', 'b', 'c', 'd']) {
      expect(after[id], id).toBe(before[id]);
    }
  });

  it('steckt einen Neuen ins kleinere Team', () => {
    const map = assignTeams(['a', 'b', 'c'], { a: 0, b: 0 });
    expect(map.c).toBe(1);
  });

  it('wirft ausgeschiedene Spieler heraus', () => {
    const map = assignTeams(['a', 'c'], { a: 0, b: 1, c: 1 });
    expect(Object.keys(map).sort()).toEqual(['a', 'c']);
  });

  it('bleibt bei ungerader Anzahl höchstens um eins auseinander', () => {
    for (const n of [3, 5, 7, 9]) {
      const ids = Array.from({ length: n }, (_, i) => 'p' + i);
      const [a, b] = teamSizes(assignTeams(ids));
      expect(Math.abs(a - b), 'bei ' + n).toBeLessThanOrEqual(1);
    }
  });
});

describe('shuffleTeams', () => {
  it('teilt gleichmäßig auf', () => {
    for (const n of [4, 5, 8, 11]) {
      const ids = Array.from({ length: n }, (_, i) => 'p' + i);
      const [a, b] = teamSizes(shuffleTeams(ids));
      expect(a + b).toBe(n);
      expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
    }
  });

  it('lässt niemanden aus', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const map = shuffleTeams(ids);
    expect(Object.keys(map).sort()).toEqual(ids);
  });
});

describe('flipTeam', () => {
  it('schiebt einen Spieler ins andere Team', () => {
    const map = { a: 0, b: 1 } as const;
    expect(flipTeam(map, 'a').a).toBe(1);
  });

  it('lässt eine unbekannte Kennung in Ruhe', () => {
    const map = { a: 0 } as const;
    expect(flipTeam(map, 'x')).toBe(map);
  });
});

describe('canPlay', () => {
  it('verlangt mindestens zwei je Team', () => {
    // Einer stellt dar, mindestens einer muss raten.
    expect(canPlay({ a: 0, b: 0, c: 1, d: 1 })).toBe(true);
    expect(canPlay({ a: 0, b: 0, c: 0, d: 1 })).toBe(false);
    expect(canPlay({ a: 0, b: 1 })).toBe(false);
  });
});

describe('splitByTeam', () => {
  it('behält die Reihenfolge der Liste bei', () => {
    const [a, b] = splitByTeam(['a', 'b', 'c', 'd'], { a: 0, b: 1, c: 0, d: 1 });
    expect(a).toEqual(['a', 'c']);
    expect(b).toEqual(['b', 'd']);
  });
});
