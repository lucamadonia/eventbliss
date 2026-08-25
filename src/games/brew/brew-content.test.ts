import { describe, expect, it } from "vitest";
import { INGREDIENTS, RECIPES_BY_LENGTH, type RecipeLength } from "./brew-content";

const LENGTHS: RecipeLength[] = [5, 6, 7];
const MIN_RECIPES_PER_LENGTH = 8;

describe("RECIPES_BY_LENGTH", () => {
  for (const length of LENGTHS) {
    describe(`Laenge ${length}`, () => {
      const recipes = RECIPES_BY_LENGTH[length];

      it(`mindestens ${MIN_RECIPES_PER_LENGTH} Rezepte (fuer bis zu 8 Spieler)`, () => {
        expect(recipes.length).toBeGreaterThanOrEqual(MIN_RECIPES_PER_LENGTH);
      });

      it("jedes Rezept hat genau die passende Zutatenzahl", () => {
        for (const recipe of recipes) {
          expect(recipe.needs).toHaveLength(length);
        }
      });

      it("keine doppelte Zutat innerhalb eines Rezepts", () => {
        for (const recipe of recipes) {
          expect(new Set(recipe.needs).size).toBe(recipe.needs.length);
        }
      });

      it("alle Rezept-Kennungen innerhalb der Laenge sind eindeutig (dealRecipes verlaesst sich darauf)", () => {
        const ids = recipes.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it("jede benutzte IngredientId existiert in INGREDIENTS", () => {
        for (const recipe of recipes) {
          for (const id of recipe.needs) {
            expect(INGREDIENTS[id]).toBeDefined();
          }
        }
      });
    });
  }
});

describe("INGREDIENTS", () => {
  it("jeder Eintrag hat eine Farbe sowie beide Gewand-Emojis", () => {
    for (const ingredient of Object.values(INGREDIENTS)) {
      expect(ingredient.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(ingredient.bar.length).toBeGreaterThan(0);
      expect(ingredient.brew.length).toBeGreaterThan(0);
    }
  });
});
