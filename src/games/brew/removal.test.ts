import { describe, expect, it } from "vitest";
import { removeBrewPlayers, type BrewRemovalState } from "./removal";
import type { IngredientId } from "./deck";

type P = { id: string; glass: IngredientId[]; score: number };
const p = (id: string, glass: IngredientId[] = [], score = 0): P => ({ id, glass, score });

function state(over: Partial<BrewRemovalState<P>> = {}): BrewRemovalState<P> {
  return {
    players: [p("a"), p("b", ["base1"], 2), p("c"), p("d")],
    activeIdx: 2,
    tray: ["sour", "cold"] as IngredientId[],
    discardPile: [{ kind: "bust" }],
    winnerId: null,
    ...over,
  };
}

describe("GEBRÄU: Spieler mitten in der Partie entfernen", () => {
  it("lässt alles unverändert, wenn der Entfernte nicht mitspielt", () => {
    expect(removeBrewPlayers(state(), ["zz"])).toBeNull();
  });

  it("entfernt einen Wartenden: dieselbe Person bleibt dran, Tablett bleibt, Glas geht auf die Ablage", () => {
    const r = removeBrewPlayers(state(), ["b"])!;
    expect(r.players.map((x) => x.id)).toEqual(["a", "c", "d"]);
    expect(r.players[r.activeIdx].id).toBe("c");
    expect(r.activeRemoved).toBe(false);
    expect(r.tray).toEqual(["sour", "cold"]);
    expect(r.discardPile).toEqual([{ kind: "bust" }, { kind: "ingredient", id: "base1" }]);
  });

  it("gibt den Zug sofort weiter, wenn die aktive Person entfernt wird, und legt ihr Tablett ab", () => {
    const r = removeBrewPlayers(state(), ["c"])!;
    expect(r.activeRemoved).toBe(true);
    expect(r.players[r.activeIdx].id).toBe("d");
    expect(r.tray).toEqual([]);
    expect(r.discardPile).toEqual([
      { kind: "bust" }, { kind: "ingredient", id: "sour" }, { kind: "ingredient", id: "cold" },
    ]);
  });

  it("springt bei der letzten Person in der Reihe zurück an den Anfang", () => {
    const r = removeBrewPlayers(state({ activeIdx: 3 }), ["d"])!;
    expect(r.players[r.activeIdx].id).toBe("a");
  });

  it("überspringt Personen, die nicht mehr im Raum sind", () => {
    const r = removeBrewPlayers(state(), ["c"], ["a", "b"])!;
    expect(r.players[r.activeIdx].id).toBe("a");
  });

  it("verarbeitet mehrere Entfernte gleichzeitig inklusive der aktiven Person", () => {
    const r = removeBrewPlayers(state(), ["c", "d", "a"])!;
    expect(r.players.map((x) => x.id)).toEqual(["b"]);
    expect(r.activeIdx).toBe(0);
    expect(r.players[0].score).toBe(2);
  });

  it("rührt ein bereits entschiedenes Spiel nicht an", () => {
    expect(removeBrewPlayers(state({ winnerId: "a" }), ["c"])).toBeNull();
  });
});
