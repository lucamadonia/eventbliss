/**
 * WARUM ES DIESEN TEST GIBT: Die Kontrastzusage ist die Eigenschaft, um die
 * es bei `layerColor` ueberhaupt geht — zwei benachbarte Schichten muessen
 * auf drei Metern auseinanderzuhalten sein. Ohne Test faellt eine neue oder
 * geaenderte Zutat erst jemandem auf dem Fernseher auf, und dann weiss
 * niemand mehr, woran es liegt.
 */
import { describe, expect, it } from "vitest";
import { INGREDIENTS, INGREDIENT_IDS, RECIPES_BY_LENGTH, type Skin } from "./brew-content";
import { BREW_PALETTES, brewRadius, hueOf, layerColor, luminanceOf } from "./brew-palette";

const SKINS: Skin[] = ["bar", "brew"];
const ALLE_REZEPTE = [...RECIPES_BY_LENGTH[5], ...RECIPES_BY_LENGTH[6], ...RECIPES_BY_LENGTH[7]];
const HEX = /^#[0-9a-f]{6}$/i;

/** Kuerzester Abstand zweier Farbwinkel. */
function hueAbstand(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

describe("Paletten", () => {
  it("definieren in beiden Gewaendern jeden Schluessel", () => {
    for (const skin of SKINS) {
      const p = BREW_PALETTES[skin];
      for (const k of ["bg", "bgDeep", "surface", "surfaceRaised", "accent", "accent2",
        "accent3", "text", "dim", "bad", "plateBase", "wordmark"] as const) {
        expect(p[k], `${skin}.${k}`).toMatch(HEX);
      }
      expect(p.glowAlpha).toBeGreaterThan(0);
      expect(p.glowAlpha).toBeLessThanOrEqual(1);
      expect(p.key).toBe(skin);
    }
  });

  it("haben acht unterscheidbare Spielerfarben", () => {
    // Die Ringfarbe ist das einzige, was den aktiven Spieler ausweist.
    for (const skin of SKINS) {
      const f = BREW_PALETTES[skin].players;
      expect(f.length).toBeGreaterThanOrEqual(8);
      expect(new Set(f.map((c) => c.toLowerCase())).size).toBe(f.length);
      for (const c of f) expect(c).toMatch(HEX);
    }
  });

  it("sind wirklich zwei Welten — die Bar ist warm, das Labor kalt", () => {
    // Vorher liefen beide auf demselben Blauschwarz.
    expect(BREW_PALETTES.bar.bg).not.toBe(BREW_PALETTES.brew.bg);
    expect(hueOf(BREW_PALETTES.bar.accent)).toBeLessThan(70);        // Bernstein
    expect(hueOf(BREW_PALETTES.brew.accent)).toBeGreaterThan(180);   // Violett
  });

  it("hat eine einzige Radienskala", () => {
    const werte = Object.values(brewRadius);
    expect(new Set(werte).size).toBe(werte.length);
    for (let i = 1; i < werte.length; i++) expect(werte[i]).toBeGreaterThan(werte[i - 1]);
  });
});

describe("layerColor", () => {
  it("liefert fuer jede Zutat, jedes Gewand und jede Tiefe ein gueltiges Hex", () => {
    for (const skin of SKINS) {
      for (const id of INGREDIENT_IDS) {
        for (let total = 1; total <= 7; total++) {
          for (let depth = 0; depth < total; depth++) {
            expect(layerColor(INGREDIENTS[id].color, skin, depth, total)).toMatch(HEX);
          }
        }
      }
    }
  });

  it("macht den Stapel von unten nach oben heller", () => {
    // Das ist der Verlauf, der aus einer flachen Flaeche einen Drink macht.
    for (const skin of SKINS) {
      for (const r of ALLE_REZEPTE) {
        const n = r.needs.length;
        for (let i = 1; i < n; i++) {
          const unten = luminanceOf(layerColor(INGREDIENTS[r.needs[i - 1]].color, skin, i - 1, n));
          const oben = luminanceOf(layerColor(INGREDIENTS[r.needs[i]].color, skin, i, n));
          expect(oben, `${r.id} Schicht ${i}`).toBeGreaterThan(unten);
        }
      }
    }
  });

  it("haelt benachbarte Schichten auseinander — Helligkeit ODER Farbton", () => {
    // DIE eigentliche Zusage. Bricht eine neue Zutat sie, schlaegt hier ein
    // Test an, statt dass es jemandem auf dem Fernseher auffaellt.
    for (const skin of SKINS) {
      for (const r of ALLE_REZEPTE) {
        const n = r.needs.length;
        for (let i = 1; i < n; i++) {
          const a = layerColor(INGREDIENTS[r.needs[i - 1]].color, skin, i - 1, n);
          const b = layerColor(INGREDIENTS[r.needs[i]].color, skin, i, n);
          const dL = Math.abs(luminanceOf(a) - luminanceOf(b));
          const dH = hueAbstand(hueOf(a), hueOf(b));
          expect(dL >= 0.05 || dH >= 18,
            `${skin}/${r.id} Schicht ${i}: dL=${dL.toFixed(3)} dH=${dH.toFixed(0)}`).toBe(true);
        }
      }
    }
  });

  it("laesst die sieben fast weissen Zutaten nicht mehr weiss werden", () => {
    // Auf #0B0F1A bzw. #1A0F08 sah ein weisses Band aus wie ein Loch.
    const fastWeiss = ["sugar", "base4", "bitterHerb", "base3", "creamy", "fizz", "cold"] as const;
    for (const skin of SKINS) {
      for (const id of fastWeiss) {
        for (let depth = 0; depth < 5; depth++) {
          expect(luminanceOf(layerColor(INGREDIENTS[id].color, skin, depth, 5))).toBeLessThan(0.78);
        }
      }
    }
  });

  it("veraendert INGREDIENTS[].color nicht", () => {
    // Die semantische Farbe gehoert der Zutat und haengt an Karte, Flug und
    // Aufdeckung. layerColor ist reine Darstellung.
    const vorher = INGREDIENT_IDS.map((id) => INGREDIENTS[id].color);
    for (const skin of SKINS) for (const id of INGREDIENT_IDS) layerColor(INGREDIENTS[id].color, skin, 2, 5);
    expect(INGREDIENT_IDS.map((id) => INGREDIENTS[id].color)).toEqual(vorher);
  });
});
