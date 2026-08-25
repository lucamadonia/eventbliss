import { describe, expect, it } from "vitest";
import type { DealtRecipe } from "./deck";
import { scoreAll, scoreFor } from "./scoring";

const recipe: DealtRecipe = { id: "test", needs: ["base1", "sour", "cold", "sugar", "topping"] };

describe("scoreFor", () => {
  it("zaehlt verschiedene Zutaten im Glas", () => {
    expect(scoreFor({ name: "Ada", recipe, glass: ["base1", "sour"] })).toEqual({
      name: "Ada",
      score: 2,
    });
  });

  it("Dubletten im Glas zaehlen nur einmal", () => {
    expect(scoreFor({ name: "Ada", recipe, glass: ["base1", "base1", "sour"] })).toEqual({
      name: "Ada",
      score: 2,
    });
  });

  it("Bonus nur bei Fertigstellung", () => {
    const finished = scoreFor({
      name: "Ada",
      recipe,
      glass: ["base1", "sour", "cold", "sugar", "topping"],
    });
    expect(finished.score).toBe(recipe.needs.length + 5);
  });

  it("Fertig schlaegt immer 'fast fertig' — auch bei der kuerzesten Rezeptlaenge", () => {
    const shortRecipe: DealtRecipe = { id: "s", needs: ["base1", "sour", "cold", "sugar", "topping"] };
    const almostDone = scoreFor({
      name: "Bo",
      recipe: shortRecipe,
      glass: shortRecipe.needs.slice(0, -1), // eine Zutat fehlt noch
    });
    const done = scoreFor({ name: "Ada", recipe: shortRecipe, glass: shortRecipe.needs });
    expect(done.score).toBeGreaterThan(almostDone.score);
  });

  it("leeres Glas ergibt 0 Punkte", () => {
    expect(scoreFor({ name: "Ada", recipe, glass: [] })).toEqual({ name: "Ada", score: 0 });
  });
});

describe("scoreAll", () => {
  it("erhaelt die Reihenfolge und liefert eine Liste im {name, score}-Format", () => {
    const result = scoreAll([
      { name: "Ada", recipe, glass: ["base1"] },
      { name: "Bo", recipe, glass: ["base1", "sour", "cold", "sugar", "topping"] },
    ]);
    expect(result).toEqual([
      { name: "Ada", score: 1 },
      { name: "Bo", score: 10 },
    ]);
  });
});
