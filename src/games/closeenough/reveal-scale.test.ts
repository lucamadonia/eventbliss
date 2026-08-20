import { describe, it, expect } from 'vitest';
import { chooseScale, makeScale, packLanes, toleranceBand } from './reveal-scale';

/**
 * Die Auflösung ist der emotionale Höhepunkt der Runde — und der Teil, dessen
 * Fehler man nicht als Fehler erkennt: Eine NaN-Position ergibt keinen Absturz,
 * sondern eine leere Fläche, die aussieht, als wäre das Spiel noch am Laden.
 */
describe('chooseScale', () => {
  it('nimmt bei Jahreszahlen immer die lineare Achse', () => {
    // Der teuerste Fall: log10 einer negativen Jahreszahl ist NaN, und v. Chr.
    // kommt in den Baujahr-Fragen tatsächlich vor.
    expect(chooseScale('year', [-3000, 1889, 2020])).toBe('linear');
    expect(chooseScale('year', [1900, 2000])).toBe('linear');
  });

  it('nimmt die lineare Achse, sobald ein Wert nicht positiv ist', () => {
    expect(chooseScale('m', [0, 100, 5000])).toBe('linear');
    expect(chooseScale('percent', [-2, 40])).toBe('linear');
  });

  it('nimmt die Log-Achse erst ab einer Zehnerpotenz Spannweite', () => {
    expect(chooseScale('people', [300_000, 2_500_000])).toBe('log');
    expect(chooseScale('m', [100, 300])).toBe('linear');
  });

  it('kommt mit einer leeren Runde zurecht', () => {
    expect(chooseScale('m', [])).toBe('linear');
  });
});

describe('makeScale', () => {
  it('ordnet größere Werte weiter rechts an', () => {
    const s = makeScale('log', [1000, 10_000, 1_000_000]);
    expect(s.pos(1000)).toBeLessThan(s.pos(10_000));
    expect(s.pos(10_000)).toBeLessThan(s.pos(1_000_000));
  });

  it('liefert nie etwas außerhalb von 0 bis 1', () => {
    const s = makeScale('linear', [1900, 2000]);
    expect(s.pos(1000)).toBe(0);
    expect(s.pos(5000)).toBe(1);
  });

  it('liefert für Jahreszahlen vor Christus eine echte Zahl', () => {
    const s = makeScale('linear', [-3000, 1889]);
    expect(Number.isFinite(s.pos(-3000))).toBe(true);
    expect(Number.isFinite(s.pos(1889))).toBe(true);
    expect(s.pos(-3000)).toBeLessThan(s.pos(1889));
  });

  it('bricht nicht, wenn alle Tipps gleich sind', () => {
    // Ohne Sonderbehandlung wäre das eine Division durch null.
    const s = makeScale('linear', [500, 500, 500]);
    expect(s.pos(500)).toBeCloseTo(0.5, 5);
  });

  it('bricht auch bei einer erzwungenen Log-Achse mit gleichen Werten nicht', () => {
    const s = makeScale('log', [2_500_000, 2_500_000]);
    expect(Number.isFinite(s.pos(2_500_000))).toBe(true);
  });

  it('liefert bei einer leeren Runde die Mitte', () => {
    const s = makeScale('log', []);
    expect(s.pos(123)).toBe(0.5);
  });
});

describe('packLanes', () => {
  it('lässt weit auseinanderliegende Marken in einer Zeile', () => {
    expect(packLanes([0, 0.5, 1])).toEqual([0, 0, 0]);
  });

  it('schiebt dicht beieinanderliegende Marken nach unten', () => {
    // Der Normalfall beim Schätzen: mehrere raten fast dasselbe.
    const lanes = packLanes([0.5, 0.51, 0.52]);
    expect(new Set(lanes).size).toBe(3);
  });

  it('behält die Reihenfolge der Eingabe bei', () => {
    // Die Zeilennummern gehören zu den Spielern in der übergebenen Reihenfolge
    // — verrutscht das, bekommt jemand den Tipp eines anderen zugeordnet.
    const lanes = packLanes([0.9, 0.1, 0.91]);
    expect(lanes).toHaveLength(3);
    expect(lanes[1]).toBe(0);
    expect(lanes[0]).not.toBe(lanes[2]);
  });

  it('ist stabil — gleiche Eingabe, gleiche Verteilung', () => {
    const a = packLanes([0.2, 0.22, 0.24, 0.8]);
    const b = packLanes([0.2, 0.22, 0.24, 0.8]);
    expect(a).toEqual(b);
  });
});

describe('toleranceBand', () => {
  it('legt das Band um die Wahrheit', () => {
    const s = makeScale('linear', [0, 200]);
    const band = toleranceBand(100, 10, s);
    expect(band.from).toBeLessThan(s.pos(100));
    expect(band.to).toBeGreaterThan(s.pos(100));
  });

  it('ist auf der Log-Achse asymmetrisch — und genau das ist die Aussage', () => {
    const s = makeScale('log', [1000, 10_000_000]);
    const band = toleranceBand(1_000_000, 20, s);
    const mid = s.pos(1_000_000);
    // Nach oben sind 20 % absolut mehr als nach unten; auf der Log-Achse ist
    // die rechte Hälfte des Bandes deshalb schmaler als die linke.
    expect(mid - band.from).toBeGreaterThan(band.to - mid);
  });

  it('dreht die Grenzen nicht um, wenn die Wahrheit negativ ist', () => {
    const s = makeScale('linear', [-3000, 0]);
    const band = toleranceBand(-2000, 10, s);
    expect(band.from).toBeLessThanOrEqual(band.to);
  });
});
