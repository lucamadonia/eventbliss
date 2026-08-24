import { describe, it, expect } from "vitest";
import { buildRoute } from "./party-map";

/**
 * Die Route traegt die Reise der Figuren auf dem Fernseher. Sie ist bewusst
 * reine Rechnung ohne DOM — genau damit diese Zusagen pruefbar sind statt nur
 * am Bildschirm zu "wirken".
 */
describe("buildRoute", () => {
  it("legt genau ein Feld je Spiel an", () => {
    for (const n of [1, 2, 3, 5, 6, 8, 12]) {
      expect(buildRoute(n).stations).toHaveLength(n);
    }
  });

  it("bleibt ohne Spiele leer und liefert trotzdem einen gueltigen Punkt", () => {
    const r = buildRoute(0);
    expect(r.stations).toEqual([]);
    expect(r.d).toBe("");
    expect(r.pointAt(0.5)).toEqual({ x: r.width / 2, y: r.height / 2 });
  });

  it("haelt jedes Feld mit Rand im Bild — Medaillons duerfen nicht abgeschnitten werden", () => {
    const r = buildRoute(12);
    for (const p of r.stations) {
      expect(p.x).toBeGreaterThanOrEqual(100);
      expect(p.x).toBeLessThanOrEqual(r.width - 100);
      expect(p.y).toBeGreaterThanOrEqual(150);
      expect(p.y).toBeLessThanOrEqual(r.height - 150);
    }
  });

  it("beginnt den Pfad auf dem ersten Feld", () => {
    const r = buildRoute(4);
    expect(r.d.startsWith(`M ${r.stations[0].x} ${r.stations[0].y}`)).toBe(true);
  });

  it("setzt je Uebergang ein Kurvensegment", () => {
    const r = buildRoute(6);
    expect(r.d.split(" C ").length - 1).toBe(5);
  });

  it("trifft mit tAt/pointAt jedes Feld genau", () => {
    const r = buildRoute(7);
    r.stations.forEach((s, i) => {
      const p = r.pointAt(r.tAt(i));
      expect(p.x).toBeCloseTo(s.x, 6);
      expect(p.y).toBeCloseTo(s.y, 6);
    });
  });

  it("laeuft zwischen zwei Feldern vorwaerts statt zu springen", () => {
    const r = buildRoute(5);
    const a = r.tAt(1);
    const b = r.tAt(2);
    let prev = -Infinity;
    // Die Reise darf nicht zurueckzucken: x waechst auf diesem Abschnitt monoton.
    for (let k = 0; k <= 10; k++) {
      const p = r.pointAt(a + ((b - a) * k) / 10);
      expect(p.x).toBeGreaterThan(prev);
      prev = p.x;
    }
  });

  it("begrenzt t auf [0,1] statt ins Leere zu laufen", () => {
    const r = buildRoute(4);
    expect(r.pointAt(-3)).toEqual(r.stations[0]);
    const last = r.pointAt(9);
    expect(last.x).toBeCloseTo(r.stations[3].x, 6);
    expect(last.y).toBeCloseTo(r.stations[3].y, 6);
  });

  it("stellt ein einzelnes Spiel in die Mitte", () => {
    const r = buildRoute(1);
    expect(r.stations[0]).toEqual({ x: r.width / 2, y: r.height / 2 });
    expect(r.tAt(0)).toBe(0);
  });

  it("bricht ab 6 Spielen in zwei Zeilen um, damit die Felder gross bleiben", () => {
    const five = new Set(buildRoute(5).stations.map((p) => p.y));
    const six = new Set(buildRoute(6).stations.map((p) => p.y));
    expect(five.size).toBe(1);
    expect(six.size).toBe(2);
  });

  it("laeuft die zweite Zeile rueckwaerts — Schlangenlinie statt Ruecksprung", () => {
    const r = buildRoute(6);
    // Zeile 1 laeuft nach rechts, Zeile 2 zurueck nach links.
    expect(r.stations[2].x).toBeGreaterThan(r.stations[0].x);
    expect(r.stations[5].x).toBeLessThan(r.stations[3].x);
    // Der Uebergang bleibt kurz: das vierte Feld liegt unter dem dritten.
    expect(Math.abs(r.stations[3].x - r.stations[2].x)).toBeLessThan(1);
  });
});
