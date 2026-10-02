/**
 * STORYBUILDER mit wechselnder Runde (F13/F14): Die Geschichte darf nie auf
 * jemanden warten, der nicht mehr da ist.
 */
import { describe, it, expect } from "vitest";

import { removeFromStory, type StoryRoster } from "./roster-change";

const p = (id: string) => ({ id });
const base = (over: Partial<StoryRoster<{ id: string }>> = {}): StoryRoster<{ id: string }> => ({
  players: [p("a"), p("b"), p("c"), p("d")],
  phase: "writing",
  currentRound: 1,
  totalRounds: 2,
  currentPlayerIdx: 1,
  currentSentenceNum: 2,
  ...over,
});
const writer = (s: StoryRoster<{ id: string }>) => s.players[s.currentPlayerIdx]?.id;

describe("removeFromStory", () => {
  it("Unbeteiligte, Setup und Auflösung → unveraendert", () => {
    const s = base();
    expect(removeFromStory(s, ["zz"]).state).toBe(s);
    expect(removeFromStory(base({ phase: "setup" }), ["a"]).changed).toBe(false);
    expect(removeFromStory(base({ phase: "storyReveal" }), ["a"]).changed).toBe(false);
  });

  it("wer vorher dran war: dieselbe Person schreibt weiter, Satz bleibt", () => {
    const r = removeFromStory(base(), ["a"]);
    expect(writer(r.state)).toBe("b");
    expect(r.state.currentSentenceNum).toBe(2);
    expect(r.turnRestarted).toBe(false);
  });

  it("wer spaeter dran waere: faellt nur aus der Reihe", () => {
    const r = removeFromStory(base(), ["d"]);
    expect(writer(r.state)).toBe("b");
    expect(r.state.players.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("die schreibende Person geht → naechste beginnt mit Satz 1", () => {
    const r = removeFromStory(base(), ["b"]);
    expect(writer(r.state)).toBe("c");
    expect(r.state.currentSentenceNum).toBe(1);
    expect(r.turnRestarted).toBe(true);
    expect(r.state.phase).toBe("writing");
  });

  it("letzte der Runde geht → naechste Runde beginnt vorn", () => {
    const r = removeFromStory(base({ currentPlayerIdx: 3 }), ["d"]);
    expect(r.state.currentRound).toBe(2);
    expect(writer(r.state)).toBe("a");
    expect(r.state.phase).toBe("writing");
  });

  it("letzte der letzten Runde geht → Auflösung statt Warten", () => {
    const r = removeFromStory(base({ currentPlayerIdx: 3, currentRound: 2 }), ["d"]);
    expect(r.state.phase).toBe("storyReveal");
  });

  it("Weiterreichen (lokal) an jemanden, der geht → direkt schreiben", () => {
    const r = removeFromStory(base({ phase: "passing" }), ["b"]);
    expect(r.state.phase).toBe("writing");
    expect(writer(r.state)).toBe("c");
  });

  it("alle weg → Auflösung, kein Absturz", () => {
    const r = removeFromStory(base(), ["a", "b", "c", "d"]);
    expect(r.state.players).toEqual([]);
    expect(r.state.phase).toBe("storyReveal");
  });
});
