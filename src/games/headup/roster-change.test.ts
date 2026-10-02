/**
 * HEADUP mit wechselnder Runde (F13/F14): Niemand darf doppelt oder gar nicht
 * drankommen, und eine verlassene Runde darf das Spiel nicht festhalten.
 */
import { describe, it, expect } from "vitest";

import { removeFromHeadUp, type HeadUpRoster } from "./roster-change";

const base = (over: Partial<HeadUpRoster<string>> = {}): HeadUpRoster<string> => ({
  order: ["a", "b", "c", "d"],
  names: ["A", "B", "C", "D"],
  currentRound: 2,
  screen: "playing",
  allRounds: ["ra"],
  ...over,
});

describe("removeFromHeadUp", () => {
  it("Unbeteiligte, Setup und Spielende → unveraendert", () => {
    const s = base();
    expect(removeFromHeadUp(s, ["zz"]).state).toBe(s);
    expect(removeFromHeadUp(base({ screen: "setup" }), ["a"]).changed).toBe(false);
    expect(removeFromHeadUp(base({ screen: "gameOver" }), ["a"]).changed).toBe(false);
  });

  it("wer noch nicht dran war, faellt aus der Reihenfolge", () => {
    const r = removeFromHeadUp(base(), ["d"]);
    expect(r.state).toMatchObject({ order: ["a", "b", "c"], names: ["A", "B", "C"], currentRound: 2, screen: "playing" });
    expect(r.roundRestarted).toBe(false);
  });

  it("wer schon gespielt hat: Ergebnis weg, Zug bleibt bei derselben Person", () => {
    const r = removeFromHeadUp(base(), ["a"]);
    expect(r.state.order[r.state.currentRound - 1]).toBe("b");
    expect(r.state.allRounds).toEqual([]);
    expect(r.state.screen).toBe("playing");
    expect(r.roundRestarted).toBe(false);
  });

  it("wer gerade dran ist: Runde verfaellt, die naechste Person startet frisch", () => {
    for (const screen of ["ready", "playing", "roundResult"] as const) {
      const r = removeFromHeadUp(base({ screen }), ["b"]);
      expect(r.state.order[r.state.currentRound - 1], screen).toBe("c");
      expect(r.state.screen, screen).toBe("ready");
      expect(r.roundRestarted, screen).toBe(true);
      expect(r.state.allRounds).toEqual(["ra"]);
    }
  });

  it("letzte Person geht waehrend ihrer Runde → Spielende", () => {
    const r = removeFromHeadUp(base({ currentRound: 4, allRounds: ["ra", "rb", "rc"] }), ["d"]);
    expect(r.state.screen).toBe("gameOver");
    expect(r.roundRestarted).toBe(false);
    expect(r.state.allRounds).toEqual(["ra", "rb", "rc"]);
  });

  it("mehrere gleichzeitig: davor, aktiv und danach", () => {
    const r = removeFromHeadUp(base({ currentRound: 3, allRounds: ["ra", "rb"] }), ["a", "c", "d"]);
    expect(r.state.order).toEqual(["b"]);
    expect(r.state.allRounds).toEqual(["rb"]);
    expect(r.state.screen).toBe("gameOver");
  });

  it("alle weg → kein Absturz", () => {
    const r = removeFromHeadUp(base(), ["a", "b", "c", "d"]);
    expect(r.state.order).toEqual([]);
    expect(r.state.screen).toBe("gameOver");
    expect(r.state.currentRound).toBe(1);
  });
});
