/**
 * WARUM ES DIESEN TEST GIBT: Kein bestehender Test rendert `Glass` oder
 * `TVBrewView`. Ein vertippter Koordinatenwert erzeugt deshalb kein rotes
 * Testergebnis, sondern ein unsichtbares Glas — und zwar erst auf dem
 * Fernseher, wo es niemand mehr zuordnet. Dieser Test ist das einzige Netz
 * unter der Geometrie.
 */
import { describe, expect, it } from "vitest";
import { RECIPES_BY_LENGTH, type Skin } from "./brew-content";
import {
  BAR_SHAPES, BREW_SHAPES, GLASS_SHAPES,
  bandBoundaries, glassMouthT, hwInnerAt, hwOuterAt,
  shapeForRecipe, unitHeight,
  type GlassShapeId,
} from "./glass-shapes";

const ALLE = Object.keys(GLASS_SHAPES) as GlassShapeId[];
const SKINS: Skin[] = ["bar", "brew"];
const ALLE_REZEPTE = [...RECIPES_BY_LENGTH[5], ...RECIPES_BY_LENGTH[6], ...RECIPES_BY_LENGTH[7]];

describe("shapeForRecipe", () => {
  it("liefert fuer jedes Rezept eine Form aus der richtigen Familie", () => {
    for (const r of ALLE_REZEPTE) {
      expect(BAR_SHAPES).toContain(shapeForRecipe(r.id, "bar"));
      expect(BREW_SHAPES).toContain(shapeForRecipe(r.id, "brew"));
    }
  });

  it("nutzt je Laenge JEDE Form mindestens einmal", () => {
    // Sonst stuenden bei acht Spielern lauter gleiche Glaeser nebeneinander —
    // genau der Effekt, den die Formen abschaffen sollen.
    for (const laenge of [5, 6, 7] as const) {
      for (const skin of SKINS) {
        const benutzt = new Set(RECIPES_BY_LENGTH[laenge].map((r) => shapeForRecipe(r.id, skin)));
        const familie = skin === "bar" ? BAR_SHAPES : BREW_SHAPES;
        expect(benutzt.size).toBe(familie.length);
      }
    }
  });

  it("ist total — fremde Kennungen liefern nie undefined", () => {
    // Ein Online-Schnappschuss kann eine Kennung mitbringen, die dieses
    // Buendel nicht kennt. Ein Absturz hier schwaerzt den ganzen Fernseher.
    for (const kennung of ["", "zzz", "s99", "m0", "l-1", "  ", "42", "s1x"]) {
      for (const skin of SKINS) {
        const form = shapeForRecipe(kennung, skin);
        expect(GLASS_SHAPES[form]).toBeDefined();
        expect(GLASS_SHAPES[form].skin).toBe(skin);
      }
    }
  });

  it("ist deterministisch — online sehen alle Geraete dieselbe Form", () => {
    for (const r of ALLE_REZEPTE) {
      expect(shapeForRecipe(r.id, "bar")).toBe(shapeForRecipe(r.id, "bar"));
    }
  });
});

describe("Geometrie", () => {
  it("hat bei jeder Form einen gueltigen Innenraum", () => {
    for (const id of ALLE) {
      const s = GLASS_SHAPES[id];
      expect(s.cavity.top).toBeGreaterThan(0);
      expect(s.cavity.top).toBeLessThan(s.cavity.bottom);
      expect(s.cavity.bottom).toBeLessThan(1);
      expect(s.aspect).toBeGreaterThan(0);
      expect(s.wall).toBeGreaterThan(0);
    }
  });

  it("hat streng steigende Profilstuetzen mit plausibler Halbbreite", () => {
    for (const id of ALLE) {
      const s = GLASS_SHAPES[id];
      expect(s.bowl.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < s.bowl.length; i++) {
        expect(s.bowl[i].hw).toBeGreaterThan(0);
        expect(s.bowl[i].hw).toBeLessThanOrEqual(50);
        if (i > 0) expect(s.bowl[i].y).toBeGreaterThan(s.bowl[i - 1].y);
      }
    }
  });

  it("hat ueberall Wandstaerke — die Fuellung kann nicht aus dem Glas laufen", () => {
    for (const id of ALLE) {
      const s = GLASS_SHAPES[id];
      for (let k = 0; k <= 40; k++) {
        const t = s.cavity.top + ((s.cavity.bottom - s.cavity.top) * k) / 40;
        expect(hwInnerAt(s, t)).toBeGreaterThan(0);
        expect(hwInnerAt(s, t)).toBeLessThan(hwOuterAt(s, t));
      }
    }
  });

  it("endet bei Stielformen VOR dem Stiel", () => {
    // Ein bis in den Fuss gefuelltes Martiniglas sieht aus wie ein Fehler.
    for (const id of ALLE) {
      const s = GLASS_SHAPES[id];
      if (!s.stem) continue;
      expect(s.cavity.bottom).toBeLessThanOrEqual(s.stem.top);
      expect(s.stem.bottom).toBeGreaterThan(s.stem.top);
      if (s.foot) expect(s.foot.cy).toBeGreaterThanOrEqual(s.stem.bottom - 0.05);
    }
  });

  it("meldet die Muendung als Flugziel", () => {
    for (const id of ALLE) {
      expect(glassMouthT(GLASS_SHAPES[id])).toBe(GLASS_SHAPES[id].cavity.top);
    }
  });
});

describe("bandBoundaries", () => {
  it("liefert monotone Grenzen innerhalb des Innenraums", () => {
    for (const id of ALLE) {
      const s = GLASS_SHAPES[id];
      const h = unitHeight(s);
      for (const n of [5, 6, 7]) {
        const g = bandBoundaries(s, n);
        expect(g).toHaveLength(n + 1);
        expect(g[0]).toBeCloseTo(s.cavity.bottom * h, 5);
        expect(g[n]).toBeCloseTo(s.cavity.top * h, 1);
        // y waechst nach unten: Boden hat den groessten Wert.
        for (let i = 1; i < g.length; i++) expect(g[i]).toBeLessThan(g[i - 1]);
      }
    }
  });

  it("gibt jeder Zutat dieselbe Flaeche — auch im Kegel", () => {
    // Das ist der eigentliche Zweck: Im Martini waere die unterste Schicht
    // bei gleicher HOEHE ein unsichtbarer Strich.
    for (const id of ALLE) {
      const s = GLASS_SHAPES[id];
      const h = unitHeight(s);
      for (const n of [5, 6, 7]) {
        const g = bandBoundaries(s, n);
        const flaechen = [];
        for (let i = 0; i < n; i++) {
          // Flaeche eines Bandes grob integrieren.
          let a = 0;
          const schritte = 24;
          for (let k = 0; k < schritte; k++) {
            const y0 = g[i] + ((g[i + 1] - g[i]) * k) / schritte;
            const y1 = g[i] + ((g[i + 1] - g[i]) * (k + 1)) / schritte;
            a += ((hwInnerAt(s, y0 / h) + hwInnerAt(s, y1 / h)) / 2) * Math.abs(y1 - y0);
          }
          flaechen.push(a);
        }
        const min = Math.min(...flaechen);
        const max = Math.max(...flaechen);
        expect((max - min) / max).toBeLessThan(0.02);
      }
    }
  });

  it("faengt eine Zutatenzahl von null ab", () => {
    // `total === 0` darf nicht durchschlagen — ein Absturz hier schwaerzt
    // den ganzen Fernseher.
    for (const id of ALLE) {
      const g = bandBoundaries(GLASS_SHAPES[id], 0);
      expect(g.length).toBeGreaterThanOrEqual(2);
      expect(g.every(Number.isFinite)).toBe(true);
    }
  });
});
