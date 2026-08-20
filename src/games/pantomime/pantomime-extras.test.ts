import { describe, it, expect } from 'vitest';
import {
  drawExtra,
  scoreTurn,
  EXTRA_MULTIPLIER,
  PANTOMIME_PROPS,
  PANTOMIME_HANDICAPS,
  PANTOMIME_STYLES,
  type ExtraKind,
} from './pantomime-extras';

/**
 * Die Ziehung ist der Teil, dessen Fehler man nicht als Fehler erkennt: Eine
 * Herausforderung, die einen zweiten Spieler verlangt, den es im Team nicht
 * gibt, sieht aus wie eine Regel, die man nicht verstanden hat.
 */

/** Zählt der Reihe nach vorgegebene Zufallswerte ab — macht die Ziehung prüfbar. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

describe('drawExtra', () => {
  it('wiederholt die Sorte der Vorrunde nie', () => {
    // Über viele Ziehungen mit echtem Zufall darf 'requisit' nie erneut kommen.
    for (let i = 0; i < 200; i++) {
      const e = drawExtra({ previousKind: 'requisit', teamSize: 4 });
      expect(e.kind).not.toBe('requisit');
    }
  });

  it('bietet kein Duo an, wenn niemand mitspielen kann', () => {
    // Ein Team aus einer Person kann keinen stummen Partner stellen.
    for (let i = 0; i < 200; i++) {
      const e = drawExtra({ teamSize: 1 });
      expect(e.kind).not.toBe('duo');
      expect(e.needsPartner).toBe(false);
    }
  });

  it('liefert auch dann etwas, wenn beide Ausschlüsse greifen', () => {
    // Einzelteam UND 'duo' war zuletzt dran — der Ausweichpfad darf keine
    // kaputte Herausforderung liefern.
    const e = drawExtra({ previousKind: 'duo', teamSize: 1 });
    expect(['requisit', 'handicap', 'stil', 'tempo']).toContain(e.kind);
    expect(e.key).toBeTruthy();
  });

  it('gibt einem Requisit immer einen Gegenstand und die Holzeit', () => {
    // Erster Wert zieht die Sorte (0 = das erste Gewicht, 'requisit'),
    // zweiter den Gegenstand.
    const e = drawExtra({ teamSize: 4, rng: seq(0, 0) });
    expect(e.kind).toBe('requisit');
    expect(e.propKey).toBeTruthy();
    expect(PANTOMIME_PROPS).toContain(e.propKey);
    expect(e.needsFetch).toBe(true);
  });

  it('verlangt nur beim Requisit eine Holzeit', () => {
    for (let i = 0; i < 300; i++) {
      const e = drawExtra({ teamSize: 4 });
      if (e.kind !== 'requisit') expect(e.needsFetch).toBe(false);
    }
  });

  it('halbiert die Zeit ausschließlich bei der Tempo-Sorte', () => {
    for (let i = 0; i < 300; i++) {
      const e = drawExtra({ teamSize: 4 });
      expect(e.halfTime).toBe(e.kind === 'tempo');
    }
  });

  it('zieht jeden Schlüssel aus der Liste seiner Sorte', () => {
    const known: Record<ExtraKind, readonly string[]> = {
      requisit: ['requisit'],
      handicap: PANTOMIME_HANDICAPS,
      stil: PANTOMIME_STYLES,
      tempo: ['halfTime'],
      duo: ['duo'],
    };
    for (let i = 0; i < 300; i++) {
      const e = drawExtra({ teamSize: 4 });
      expect(known[e.kind]).toContain(e.key);
    }
  });

  it('erreicht über viele Ziehungen alle fünf Sorten', () => {
    // Ein Gewicht auf null würde eine Sorte still verschwinden lassen.
    const seen = new Set<ExtraKind>();
    for (let i = 0; i < 2000; i++) seen.add(drawExtra({ teamSize: 4 }).kind);
    expect(seen.size).toBe(5);
  });
});

describe('scoreTurn', () => {
  it('zählt ohne Herausforderung einfach', () => {
    expect(scoreTurn(5, false)).toBe(5);
  });

  it('verdoppelt mit angenommener Herausforderung', () => {
    expect(scoreTurn(5, true)).toBe(5 * EXTRA_MULTIPLIER);
  });

  it('macht aus null Treffern auch mit Herausforderung keine Punkte', () => {
    // Kein Abzug, aber eben auch kein Trostpreis.
    expect(scoreTurn(0, true)).toBe(0);
  });
});
