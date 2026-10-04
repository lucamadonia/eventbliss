/**
 * SCHNELLZEICHNER am Host-Handy — wer ist dran, was sieht der Fernseher.
 * Faellt hier etwas um, bekommt der falsche Gast das Handy (und sieht das Wort)
 * oder das Wort steht vor der Aufloesung auf dem TV.
 */
import { describe, it, expect } from "vitest";

import { quickDrawActiveSeat, quickDrawInputDelay, quickDrawTvPlayers, quickDrawTvWord } from "./guest-flow";

const players = [{ id: "host" }, { id: "max" }, { id: "lena" }, { id: "gerda" }];

describe("quickDrawActiveSeat", () => {
  it("Zeichner beim Ansehen und Zeichnen", () => {
    expect(quickDrawActiveSeat("drawerReveal", players, 1, 0)).toBe("max");
    expect(quickDrawActiveSeat("drawing", players, 1, 0)).toBe("max");
  });

  it("Ratende in Spielerreihenfolge ohne den Zeichner", () => {
    expect(quickDrawActiveSeat("guessing", players, 1, 0)).toBe("host");
    expect(quickDrawActiveSeat("guessing", players, 1, 1)).toBe("lena");
    expect(quickDrawActiveSeat("guessing", players, 1, 2)).toBe("gerda");
    expect(quickDrawActiveSeat("guessing", players, 1, 3)).toBeNull();
  });

  it("Zeichner-Index modulo Spielerzahl (auch negativ)", () => {
    expect(quickDrawActiveSeat("drawing", players, 5, 0)).toBe("max");
    expect(quickDrawActiveSeat("drawing", players, -1, 0)).toBe("gerda");
  });

  it("keine Einzelzuege in Setup/Aufloesung/Ende, leere Runde", () => {
    for (const phase of ["setup", "roundResult", "gameOver"]) expect(quickDrawActiveSeat(phase, players, 0, 0)).toBeNull();
    expect(quickDrawActiveSeat("drawing", [], 0, 0)).toBeNull();
  });
});

describe("quickDrawInputDelay", () => {
  it("Zeichnen sofort frei, sonst Standard-Takt", () => {
    expect(quickDrawInputDelay("drawing")).toBe(0);
    expect(quickDrawInputDelay("guessing")).toBeUndefined();
    expect(quickDrawInputDelay("drawerReveal")).toBeUndefined();
  });
});

describe("TV", () => {
  it("volle Spieler-Identitaet mit Symbol aus dem Raum, sonst Initiale", () => {
    expect(quickDrawTvPlayers(
      [{ id: "max", name: "Max", color: "#f00", score: 3 }, { id: "p2", name: "lena", color: "#0f0", score: 0 }],
      [{ id: "max", avatar: "🎸" }],
    )).toEqual([
      { id: "max", name: "Max", color: "#f00", score: 3, avatar: "🎸" },
      { id: "p2", name: "lena", color: "#0f0", score: 0, avatar: "L" },
    ]);
  });

  it("Wort erst ab der Aufloesung", () => {
    for (const phase of ["setup", "drawerReveal", "drawing", "guessing"]) expect(quickDrawTvWord(phase, "Katze")).toBeUndefined();
    expect(quickDrawTvWord("roundResult", "Katze")).toBe("Katze");
    expect(quickDrawTvWord("gameOver", "Katze")).toBe("Katze");
  });
});
