/**
 * SPLIT-QUIZ mit wechselnder Runde (F13–F15, F19). Ein leeres Team darf das
 * Spiel nicht festhalten, und niemand darf beide Antwort-Haelften sehen.
 */
import { describe, it, expect } from "vitest";

import { removeFromSplitQuiz, type SplitRosterState } from "./roster-change";

const base = (over: Partial<SplitRosterState> = {}): SplitRosterState => ({
  phase: "question",
  rosterIds: ["a", "b", "c", "d", "e"],
  playerNames: ["Anna", "Ben", "Cem", "Dora", "Emil"],
  teamA: { players: ["a", "b", "c"] },
  teamB: { players: ["d", "e"] },
  activeTeamIdx: 0,
  teamAnswered: [false, false],
  ...over,
});

describe("removeFromSplitQuiz", () => {
  it("niemand betroffen → unveraendert", () => {
    const s = base();
    expect(removeFromSplitQuiz(s, ["zz"]).changed).toBe(false);
    expect(removeFromSplitQuiz(s, ["zz"]).state).toBe(s);
  });

  it("Teammitglied geht → Team spielt weiter, Namen bleiben passend", () => {
    const r = removeFromSplitQuiz(base(), ["b"]);
    expect(r.state.teamA.players).toEqual(["a", "c"]);
    expect(r.state.rosterIds).toEqual(["a", "c", "d", "e"]);
    expect(r.state.playerNames).toEqual(["Anna", "Cem", "Dora", "Emil"]);
    expect(r.state.phase).toBe("question");
    expect(r).toMatchObject({ rebalanced: false, restartQuestion: false, skipActive: false });
  });

  it("Team wird mitten in der Frage leer → Wechsel + neue Frage (F19)", () => {
    const r = removeFromSplitQuiz(base({ activeTeamIdx: 1, teamAnswered: [true, false] }), ["d", "e"]);
    expect(r.rebalanced).toBe(true);
    expect(r.restartQuestion).toBe(true);
    expect(r.state.teamB.players).toEqual(["c"]);
    expect(r.state.teamA.players).toEqual(["a", "b"]);
    expect(r.state).toMatchObject({ phase: "handoff", activeTeamIdx: 0, teamAnswered: [false, false] });
  });

  it("in der Aufloesung genuegt der Wechsel", () => {
    const r = removeFromSplitQuiz(base({ phase: "reveal", teamAnswered: [true, true] }), ["d", "e"]);
    expect(r).toMatchObject({ rebalanced: true, restartQuestion: false });
    expect(r.state.phase).toBe("reveal");
  });

  it("kein Wechsel moeglich und das leere Team ist dran → ohne Antwort abschliessen", () => {
    const s = base({ rosterIds: ["a", "d"], playerNames: ["Anna", "Dora"], teamA: { players: ["a"] }, teamB: { players: ["d"] }, activeTeamIdx: 1 });
    const r = removeFromSplitQuiz(s, ["d"]);
    expect(r).toMatchObject({ rebalanced: false, restartQuestion: false, skipActive: true });
    expect(r.state.teamB.players).toEqual([]);
    // leeres Team ist NICHT dran → nichts abschliessen
    expect(removeFromSplitQuiz({ ...s, activeTeamIdx: 0 }, ["d"]).skipActive).toBe(false);
    // schon geantwortet → nichts abschliessen
    expect(removeFromSplitQuiz({ ...s, teamAnswered: [false, true] }, ["d"]).skipActive).toBe(false);
  });

  it("Setup / Spielende: nur aufraeumen", () => {
    const r = removeFromSplitQuiz(base({ phase: "gameOver" }), ["a"]);
    expect(r).toMatchObject({ changed: true, restartQuestion: false, skipActive: false });
    expect(r.state.teamA.players).toEqual(["b", "c"]);
  });
});
