import { describe, it, expect } from 'vitest';
import { scoreRound, roundWinners } from './closeenough-scoring';

/**
 * Die Wertung ist die Stelle, an der ein Fehler niemandem auffällt: Ein falsch
 * gerechneter Punktestand stürzt nicht ab, er ärgert nur — und erst dann, wenn
 * jemand nachrechnet. Deshalb steht hier jeder Grenzfall unter Test.
 */
const g = (id: string, value: number | null) => ({ playerId: id, value });

describe('scoreRound — Rangfolge', () => {
  it('vergibt 10 / 6 / 3 nach Nähe zur Wahrheit', () => {
    // Bewusst drei UNTERSCHIEDLICHE Abweichungen: 20 %, 60 %, 100 %.
    // (1 Mio und 4 Mio waeren beide genau 60 % daneben — das ist Gleichstand
    //  und wird weiter unten eigens geprueft.)
    const r = scoreRound([g('a', 2_000_000), g('b', 1_000_000), g('c', 5_000_000)], 2_500_000, 5);
    expect(r.map((x) => x.playerId)).toEqual(['a', 'b', 'c']);
    expect(r.map((x) => x.points)).toEqual([10, 6, 3]);
  });

  it('gibt allen ab dem vierten Platz einen Punkt', () => {
    const r = scoreRound(
      [g('a', 100), g('b', 200), g('c', 300), g('d', 400), g('e', 500)],
      100,
      1,
    );
    expect(r.map((x) => x.points)).toEqual([10 + 5, 6, 3, 1, 1]);
  });

  it('zählt die Abweichung relativ, nicht absolut', () => {
    // b ist absolut weiter weg, relativ aber deutlich näher dran.
    const r = scoreRound([g('a', 5), g('b', 2_600_000)], 2_500_000, 1);
    expect(r[0].playerId).toBe('b');
  });
});

describe('scoreRound — Gleichstand', () => {
  it('teilt Rang und Punkte bei gleich guten Tipps', () => {
    // 2.000.000 und 3.000.000 sind beide genau 500.000 daneben.
    const r = scoreRound([g('a', 2_000_000), g('b', 3_000_000), g('c', 1_000_000)], 2_500_000, 1);
    expect(r[0].rank).toBe(1);
    expect(r[1].rank).toBe(1);
    expect(r[0].points).toBe(r[1].points);
    // Der Dritte rückt auf Rang 3, nicht auf Rang 2 — wie im Sport.
    expect(r[2].rank).toBe(3);
    expect(r[2].points).toBe(3);
  });
});

describe('scoreRound — Bonus', () => {
  it('gibt fünf Zusatzpunkte innerhalb der Toleranz', () => {
    const r = scoreRound([g('a', 2_450_000)], 2_500_000, 10);
    expect(r[0].bonus).toBe(true);
    expect(r[0].points).toBe(15);
  });

  it('zählt die Toleranzgrenze selbst noch als Treffer', () => {
    // Genau 10 % daneben — die Grenze gehört dazu, sonst ist sie willkürlich.
    const r = scoreRound([g('a', 2_250_000)], 2_500_000, 10);
    expect(r[0].bonus).toBe(true);
  });

  it('gibt keinen Bonus knapp außerhalb', () => {
    const r = scoreRound([g('a', 2_240_000)], 2_500_000, 10);
    expect(r[0].bonus).toBe(false);
    expect(r[0].points).toBe(10);
  });

  it('gibt den Bonus auch, wer nicht Erster ist', () => {
    const r = scoreRound([g('a', 2_500_000), g('b', 2_480_000)], 2_500_000, 10);
    expect(r[1].bonus).toBe(true);
    expect(r[1].points).toBe(6 + 5);
  });
});

describe('scoreRound — kein Tipp', () => {
  it('gibt null Punkte und sortiert ans Ende', () => {
    const r = scoreRound([g('a', null), g('b', 999_999_999)], 100, 5);
    expect(r[0].playerId).toBe('b');
    expect(r[1].playerId).toBe('a');
    expect(r[1].points).toBe(0);
    expect(r[1].bonus).toBe(false);
  });

  it('landet hinter einem wilden Tipp — Mitraten muss sich lohnen', () => {
    const r = scoreRound([g('a', null), g('b', 1)], 2_500_000, 5);
    expect(r[0].points).toBeGreaterThan(r[1].points);
  });

  it('kommt damit klar, dass niemand getippt hat', () => {
    const r = scoreRound([g('a', null), g('b', null)], 100, 5);
    expect(r.every((x) => x.points === 0)).toBe(true);
    expect(roundWinners(r)).toEqual([]);
  });
});

describe('scoreRound — Grenzfälle', () => {
  it('läuft bei einer Antwort von null nicht ins Unendliche', () => {
    const r = scoreRound([g('a', 5)], 0, 10);
    expect(Number.isFinite(r[0].relErr)).toBe(true);
    expect(r[0].points).toBe(10);
  });

  it('verträgt negative Jahreszahlen vor Christus', () => {
    const r = scoreRound([g('a', -2500), g('b', -2000)], -2560, 1);
    expect(r[0].playerId).toBe('a');
  });

  it('gibt bei einem einzigen Spieler den vollen Rang', () => {
    const r = scoreRound([g('a', 42)], 100, 5);
    expect(r).toHaveLength(1);
    expect(r[0].rank).toBe(1);
    expect(r[0].points).toBe(10);
  });

  it('liefert eine leere Liste für eine leere Runde', () => {
    expect(scoreRound([], 100, 5)).toEqual([]);
  });
});

describe('roundWinners', () => {
  it('nennt den Nächsten', () => {
    const r = scoreRound([g('a', 90), g('b', 50)], 100, 5);
    expect(roundWinners(r)).toEqual(['a']);
  });

  it('nennt bei Gleichstand alle Beteiligten', () => {
    const r = scoreRound([g('a', 90), g('b', 110), g('c', 10)], 100, 1);
    expect(roundWinners(r).sort()).toEqual(['a', 'b']);
  });
});
