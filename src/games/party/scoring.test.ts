/**
 * Platzierungspunkte — die Rechenregel hinter der Party-Gesamttabelle.
 *
 * Warum es diesen Test gibt: Rohpunkte sind zwischen den Spielen nicht
 * vergleichbar (OHRWURM zaehlt 5–10 Karten, DRÜCK DAS WORT bis zu 200 Treffer).
 * Wenn hier etwas verrutscht, gewinnt die Party nicht mehr, wer am haeufigsten
 * vorne lag, sondern wer zufaellig das Spiel mit den groessten Zahlen gespielt
 * hat — und das faellt beim Spielen erst am Ende des Abends auf.
 */
import { describe, it, expect } from "vitest";

import { placementPoints, pointsForRank, rankScores, PLACEMENT_POINTS } from "./scoring";

describe("pointsForRank", () => {
  it("vergibt die vereinbarten Punkte fuer Platz 1 bis 6", () => {
    expect([1, 2, 3, 4, 5, 6].map(pointsForRank)).toEqual([...PLACEMENT_POINTS]);
    expect([...PLACEMENT_POINTS]).toEqual([10, 7, 5, 3, 2, 1]);
  });

  it("gibt ab Platz 6 immer einen Trostpunkt", () => {
    expect(pointsForRank(7)).toBe(1);
    expect(pointsForRank(12)).toBe(1);
    expect(pointsForRank(99)).toBe(1);
  });

  it("gibt fuer unmoegliche Plaetze 0 statt zu werfen", () => {
    expect(pointsForRank(0)).toBe(0);
    expect(pointsForRank(-3)).toBe(0);
    expect(pointsForRank(Number.NaN)).toBe(0);
  });
});

describe("placementPoints", () => {
  it("wertet einen einzelnen Spieler als Sieger", () => {
    expect(placementPoints({ Anna: 42 })).toEqual({ Anna: 10 });
  });

  it("wertet eine leere Runde ohne zu werfen", () => {
    expect(placementPoints({})).toEqual({});
  });

  it("verteilt Punkte nach Platz, nicht nach Rohpunktzahl", () => {
    // Riesiger Abstand oben, winziger unten — die Punkte bleiben 10/7/5.
    expect(placementPoints({ Anna: 5000, Ben: 12, Cem: 11 })).toEqual({
      Anna: 10,
      Ben: 7,
      Cem: 5,
    });
  });

  it("laesst Gleichstand den HOEHEREN Wert teilen und ueberspringt den Platz", () => {
    // Zwei Erste bekommen beide 10, der naechste ist Dritter (5), nicht Zweiter.
    expect(placementPoints({ Anna: 30, Ben: 30, Cem: 10 })).toEqual({
      Anna: 10,
      Ben: 10,
      Cem: 5,
    });
  });

  it("behandelt auch einen Dreier-Gleichstand mitten im Feld", () => {
    const points = placementPoints({ Anna: 20, Ben: 10, Cem: 10, Dora: 10, Eli: 1 });
    expect(points).toEqual({ Anna: 10, Ben: 7, Cem: 7, Dora: 7, Eli: 2 });
  });

  it("gibt bei komplettem Gleichstand allen den ersten Platz", () => {
    expect(placementPoints({ Anna: 0, Ben: 0, Cem: 0 })).toEqual({ Anna: 10, Ben: 10, Cem: 10 });
  });

  it("verkraftet die volle Party mit zwoelf Spielern", () => {
    const raw: Record<string, number> = {};
    for (let i = 0; i < 12; i++) raw[`P${i}`] = 120 - i * 10;

    const ranked = rankScores(raw);
    expect(ranked).toHaveLength(12);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(ranked.map((r) => r.points)).toEqual([10, 7, 5, 3, 2, 1, 1, 1, 1, 1, 1, 1]);
    // Niemand geht leer aus — Mitspielen bringt immer mindestens einen Punkt.
    expect(ranked.every((r) => r.points >= 1)).toBe(true);
  });

  it("wertet kaputte Zahlen als 0 statt die Tabelle zu vergiften", () => {
    const points = placementPoints({
      Anna: 10,
      Ben: Number.NaN,
      Cem: Number.POSITIVE_INFINITY as unknown as number,
    });
    expect(points.Anna).toBe(10);
    expect(points.Ben).toBe(7);
    expect(points.Cem).toBe(7);
  });
});

describe("rankScores", () => {
  it("sortiert absteigend und bleibt bei Gleichstand stabil", () => {
    const first = rankScores({ Zoe: 5, Anna: 5, Ben: 9 }).map((r) => r.key);
    const second = rankScores({ Ben: 9, Anna: 5, Zoe: 5 }).map((r) => r.key);
    expect(first).toEqual(["Ben", "Anna", "Zoe"]);
    expect(second).toEqual(first);
  });
});
