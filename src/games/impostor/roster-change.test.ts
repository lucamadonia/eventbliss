/**
 * HOCHSTAPLER mit wechselnder Runde (F13–F15, F19) und Gaesten am Host-Handy (F03).
 * Haengt hier etwas, wartet die Abstimmung ewig auf jemanden, der nicht mehr da ist.
 */
import { describe, it, expect } from "vitest";

import { IMPOSTOR_MIN_PLAYERS, pendingLocalReveals, removeFromRound, type RosterPlayer, type RosterState } from "./roster-change";

const p = (id: string, over: Partial<RosterPlayer> = {}): RosterPlayer => ({ id, isImpostor: false, hasSpoken: false, votedFor: null, ...over });

const base = (over: Partial<RosterState> = {}): RosterState => ({
  players: [p("a"), p("b", { isImpostor: true }), p("c"), p("d"), p("e")],
  order: [],
  phase: "discussion",
  currentSpeaker: 0,
  votingPlayer: 0,
  roleReady: [],
  ...over,
});

describe("removeFromRound", () => {
  it("niemand betroffen → unveraendert", () => {
    const s = base();
    const r = removeFromRound(s, ["zz"]);
    expect(r.changed).toBe(false);
    expect(r.state).toBe(s);
  });

  it("Sprecher wird entfernt → der Naechste ist dran", () => {
    const r = removeFromRound(base({ currentSpeaker: 2 }), ["c"]);
    expect(r.state.players.map((x) => x.id)).toEqual(["a", "b", "d", "e"]);
    expect(r.state.currentSpeaker).toBe(2); // jetzt "d"
    expect(r.restart).toBe(false);
    expect(r.tooFew).toBe(false);
  });

  it("jemand VOR dem Sprecher geht → Position rutscht mit", () => {
    const r = removeFromRound(base({ currentSpeaker: 3 }), ["a"]);
    expect(r.state.players[r.state.currentSpeaker].id).toBe("d");
  });

  it("gemischte Abfolge wird umgerechnet", () => {
    // Abfolge: e, c, a, d, b  (Indizes 4,2,0,3,1); Sprecher an Position 1 = c
    const s = base({ order: [4, 2, 0, 3, 1], currentSpeaker: 1, phase: "discussion" });
    const r = removeFromRound(s, ["a"]);
    // neue Indizes: b0 c1 d2 e3 → Abfolge e,c,d,b = 3,1,2,0
    expect(r.state.order).toEqual([3, 1, 2, 0]);
    expect(r.state.players[r.state.order[r.state.currentSpeaker]].id).toBe("c");
  });

  it("Abstimmung: Waehler weg → naechster; Stimmen fuer Entfernte verfallen", () => {
    const s = base({
      phase: "voting",
      votingPlayer: 2,
      players: [p("a", { votedFor: "c" }), p("b", { isImpostor: true, votedFor: "a" }), p("c"), p("d"), p("e")],
    });
    const r = removeFromRound(s, ["c"]);
    expect(r.state.phase).toBe("voting");
    expect(r.state.players[r.state.votingPlayer].id).toBe("d");
    expect(r.state.players.find((x) => x.id === "a")!.votedFor).toBeNull();
    expect(r.state.players.find((x) => x.id === "b")!.votedFor).toBe("a");
  });

  it("letzter Waehler geht → Aufloesung statt Warten", () => {
    const r = removeFromRound(base({ phase: "voting", votingPlayer: 4 }), ["e"]);
    expect(r.state.phase).toBe("revealCountdown");
  });

  it("Rollen-Aufdecken: Bereit-Liste ohne Entfernte; alle uebrigen bereit → Diskussion", () => {
    const s = base({ phase: "wordReveal", roleReady: ["a", "b", "c", "d"] });
    const r = removeFromRound(s, ["e"]);
    expect(r.state.phase).toBe("discussion");
    expect(r.state.currentSpeaker).toBe(0);
    const r2 = removeFromRound(base({ phase: "wordReveal", roleReady: ["a", "e"] }), ["e"]);
    expect(r2.state.phase).toBe("wordReveal");
    expect(r2.state.roleReady).toEqual(["a"]);
  });

  it("einziger Hochstapler geht → Runde mit neuen Rollen (F19)", () => {
    for (const phase of ["wordReveal", "discussion", "voting", "revealCountdown"]) {
      expect(removeFromRound(base({ phase }), ["b"]).restart, phase).toBe(true);
    }
    // nach der Aufloesung zaehlt das Ergebnis — kein Neustart
    expect(removeFromRound(base({ phase: "reveal" }), ["b"]).restart).toBe(false);
    expect(removeFromRound(base({ phase: "results" }), ["b"]).restart).toBe(false);
  });

  it("zweiter Hochstapler bleibt → kein Neustart", () => {
    const s = base({ players: [p("a"), p("b", { isImpostor: true }), p("c", { isImpostor: true }), p("d"), p("e")] });
    expect(removeFromRound(s, ["b"]).restart).toBe(false);
  });

  it(`unter ${IMPOSTOR_MIN_PLAYERS} Mitspielenden → tooFew`, () => {
    expect(removeFromRound(base(), ["a", "c"]).tooFew).toBe(true);
    expect(removeFromRound(base(), ["a"]).tooFew).toBe(false);
  });
});

describe("pendingLocalReveals — wer am Host-Handy noch aufdecken muss", () => {
  const players = [{ id: "lena" }, { id: "max" }, { id: "host" }, { id: "gerda" }];

  it("eigener Platz zuerst, dann die Gaeste; Entfernte und Fertige nicht", () => {
    expect(pendingLocalReveals(players, ["host", "max", "gerda"], [])).toEqual(["host", "max", "gerda"]);
    expect(pendingLocalReveals(players, ["host", "max", "gerda"], ["host", "max"])).toEqual(["gerda"]);
    expect(pendingLocalReveals(players, ["host", "max", "ute"], [])).toEqual(["host", "max"]);
  });

  it("Host spielt nicht mit → nur seine Gaeste", () => {
    expect(pendingLocalReveals(players.filter((x) => x.id !== "host"), ["host", "max", "gerda"], [])).toEqual(["max", "gerda"]);
  });
});
