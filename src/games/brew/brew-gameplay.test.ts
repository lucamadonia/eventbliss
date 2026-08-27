import { describe, expect, it } from "vitest";
import { bonusForPour, cappedBrewBonus, chainLevelFor, riskTierFor } from "./brew-gameplay";

describe("Gebräu-Spielvertiefung", () => {
  it("stuft ausschließlich den gefährdeten Tablett-Einsatz ein", () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(riskTierFor)).toEqual([
      "calm", "simmering", "simmering", "unstable", "unstable", "critical", "critical",
    ]);
  });

  it("vergibt Mehrfach- und Perfektbonus nach den festgelegten Regeln", () => {
    expect(bonusForPour(["base1"], [])).toEqual({ multi: false, perfect: false, awarded: 0 });
    expect(bonusForPour(["base1", "sour"], ["cold"])).toEqual({ multi: true, perfect: false, awarded: 1 });
    expect(bonusForPour(["base1", "sour"], [])).toEqual({ multi: true, perfect: true, awarded: 2 });
  });

  it("deckt den Rundenzähler bei drei Punkten", () => {
    expect(cappedBrewBonus(0, 2)).toBe(2);
    expect(cappedBrewBonus(2, 2)).toBe(3);
  });

  it("begrenzt die visuelle Braukette auf drei Stufen", () => {
    expect([0, 1, 2, 3, 7].map(chainLevelFor)).toEqual([0, 1, 2, 3, 3]);
  });
});
