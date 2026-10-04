/**
 * GETEILT GEQUIZZT mit wechselnder Runde (F13–F15, F19). Bleibt eine Rolle bei
 * einer entfernten Person haengen, kann niemand mehr antworten.
 */
import { describe, it, expect } from "vitest";

import { removeFromSharedQuiz, type SharedRosterState } from "./roster-change";

const players = (...ids: string[]) => ids.map((id) => ({ id }));
const base = (over: Partial<SharedRosterState> = {}): SharedRosterState => ({
  players: players("a", "b", "c", "d", "e"),
  roleIndices: [1, 2, 3],
  phase: "playerC",
  mode: "trio",
  teamAnswers: [],
  ...over,
});
const holders = (s: SharedRosterState) => s.roleIndices.map((i) => s.players[i]?.id);

describe("removeFromSharedQuiz", () => {
  it("niemand betroffen → unveraendert", () => {
    const s = base();
    expect(removeFromSharedQuiz(s, ["zz"])).toEqual({ state: s, changed: false, roleReassigned: false });
  });

  it("Unbeteiligte gehen → Rollen bleiben bei denselben Menschen", () => {
    const r = removeFromSharedQuiz(base(), ["a"]);
    expect(holders(r.state)).toEqual(["b", "c", "d"]);
    expect(r.roleReassigned).toBe(false);
  });

  it("Antwortende Person (Rolle C) geht → naechste ohne Rolle uebernimmt", () => {
    const r = removeFromSharedQuiz(base(), ["d"]);
    expect(holders(r.state)).toEqual(["b", "c", "e"]);
    expect(r.roleReassigned).toBe(true);
    expect(new Set(r.state.roleIndices).size).toBe(3);
  });

  it("Ersatz sucht ringsum, wenn hinten niemand mehr frei ist", () => {
    const r = removeFromSharedQuiz(base({ roleIndices: [2, 3, 4] }), ["e"]);
    expect(holders(r.state)).toEqual(["c", "d", "a"]);
  });

  it("Kette: faellt eine Antwortposition weg, startet die Frage ohne fremde Antworten neu", () => {
    const r = removeFromSharedQuiz(base({ mode: "chain", teamAnswers: [2] }), ["b"]);
    expect(r.state.teamAnswers).toEqual([]);
    expect(r.roleReassigned).toBe(true);
    // Unbeteiligte gehen → Antworten bleiben
    expect(removeFromSharedQuiz(base({ mode: "chain", teamAnswers: [2] }), ["a"]).state.teamAnswers).toEqual([2]);
  });

  it("in der Aufloesung bleiben die Antworten stehen", () => {
    const r = removeFromSharedQuiz(base({ mode: "chain", phase: "reveal", teamAnswers: [1, 2, 3] }), ["b"]);
    expect(r.state.teamAnswers).toEqual([1, 2, 3]);
  });

  it("nur noch zwei Leute → kein Absturz, Rollen duerfen doppelt liegen", () => {
    const r = removeFromSharedQuiz(base({ players: players("a", "b", "c"), roleIndices: [0, 1, 2] }), ["c"]);
    expect(r.state.players).toHaveLength(2);
    expect(r.state.roleIndices.every((i) => i >= 0 && i < 2)).toBe(true);
  });

  it("alle weg → Rollen auf 0, kein Absturz", () => {
    const r = removeFromSharedQuiz(base({ players: players("a", "b", "c"), roleIndices: [0, 1, 2] }), ["a", "b", "c"]);
    expect(r.state.players).toEqual([]);
    expect(r.state.roleIndices).toEqual([0, 0, 0]);
  });
});
