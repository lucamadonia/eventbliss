/**
 * Weitergabe am Host-Handy — Masterplan 3.5 / T07 / T08 / F01–F03 / 6.6.
 *
 * Haengt diese Maschine, haelt ein Gast das Handy und niemand kommt weiter;
 * laeuft die Uhr waehrend der Weitergabe, verliert der Gast Zeit, die ein
 * Spieler mit eigenem Handy nicht verliert.
 */
import { describe, it, expect } from "vitest";

import {
  activeGuest,
  handoverRecipient,
  handoverReducer,
  initialHandoverState,
  isClockPaused,
  type HandoverEvent,
  type HandoverState,
} from "./handover-machine";

const run = (events: HandoverEvent[], from: HandoverState = initialHandoverState) =>
  events.reduce(handoverReducer, from);

describe("handoverReducer", () => {
  it("ein Gast: Host → Max → zurueck an den Host", () => {
    let s = run([{ type: "request", playerIds: ["max"] }]);
    expect(s).toEqual({ status: "handover", playerId: "max", queue: [] });
    expect(isClockPaused(s)).toBe(true);
    expect(activeGuest(s)).toBeNull();
    expect(handoverRecipient(s)).toBe("max");

    s = handoverReducer(s, { type: "confirm" });
    expect(s).toEqual({ status: "revealed", playerId: "max", queue: [] });
    expect(isClockPaused(s)).toBe(false);
    expect(activeGuest(s)).toBe("max");

    s = handoverReducer(s, { type: "done" });
    expect(s).toEqual({ status: "return", from: "max", to: null, queue: [] });
    expect(isClockPaused(s)).toBe(true);
    expect(handoverRecipient(s)).toBeNull();

    s = handoverReducer(s, { type: "confirm" });
    expect(s).toEqual(initialHandoverState);
    expect(isClockPaused(s)).toBe(false);
    expect(handoverRecipient(s)).toBeUndefined();
  });

  it("mehrere Gaeste: direkt „Weiter an Gerda“ ohne Umweg ueber den Host", () => {
    let s = run([{ type: "request", playerIds: ["max", "gerda", "max"] }, { type: "confirm" }, { type: "done" }]);
    expect(s).toEqual({ status: "return", from: "max", to: "gerda", queue: [] });
    s = handoverReducer(s, { type: "confirm" });
    expect(s).toEqual({ status: "revealed", playerId: "gerda", queue: [] });
    s = run([{ type: "done" }, { type: "confirm" }], s);
    expect(s.status).toBe("idle");
  });

  it("Anfrage waehrend das Handy zum Host zurueckgeht: direkt weiter", () => {
    const s = run([
      { type: "request", playerIds: ["max"] }, { type: "confirm" }, { type: "done" },
      { type: "request", playerIds: ["gerda", "ute"] },
    ]);
    expect(s).toEqual({ status: "return", from: "max", to: "gerda", queue: ["ute"] });
  });

  it("Anfrage waehrend einer Weitergabe haengt nur Neue an", () => {
    const s = run([
      { type: "request", playerIds: ["max", "gerda"] },
      { type: "request", playerIds: ["max", "gerda", "ute"] },
    ]);
    expect(s).toEqual({ status: "handover", playerId: "max", queue: ["gerda", "ute"] });
    const same = handoverReducer(s, { type: "request", playerIds: ["ute"] });
    expect(same).toBe(s);
  });

  it("ignoriert Ereignisse, die im Zustand keinen Sinn haben", () => {
    expect(handoverReducer(initialHandoverState, { type: "confirm" })).toBe(initialHandoverState);
    expect(handoverReducer(initialHandoverState, { type: "done" })).toBe(initialHandoverState);
    expect(handoverReducer(initialHandoverState, { type: "request", playerIds: [] })).toBe(initialHandoverState);
    expect(handoverReducer(initialHandoverState, { type: "request", playerIds: [""] })).toBe(initialHandoverState);
    const h = run([{ type: "request", playerIds: ["max"] }]);
    expect(handoverReducer(h, { type: "done" })).toBe(h); // erst bestaetigen
    const r = run([{ type: "confirm" }], h);
    expect(handoverReducer(r, { type: "confirm" })).toBe(r);
  });

  it("cancel fuehrt aus jedem Zustand zurueck zu idle", () => {
    const states = [
      run([{ type: "request", playerIds: ["a", "b"] }]),
      run([{ type: "request", playerIds: ["a"] }, { type: "confirm" }]),
      run([{ type: "request", playerIds: ["a"] }, { type: "confirm" }, { type: "done" }]),
    ];
    for (const s of states) expect(handoverReducer(s, { type: "cancel" })).toEqual(initialHandoverState);
    expect(handoverReducer(initialHandoverState, { type: "cancel" })).toBe(initialHandoverState);
  });

  describe("remove — Weitergaben an entfernte Gaeste entfallen sofort", () => {
    it("aus der Warteschlange", () => {
      const s = run([{ type: "request", playerIds: ["max", "gerda", "ute"] }, { type: "remove", playerId: "gerda" }]);
      expect(s).toEqual({ status: "handover", playerId: "max", queue: ["ute"] });
    });

    it("Empfaenger vor der Bestaetigung → naechster oder idle", () => {
      expect(run([{ type: "request", playerIds: ["max", "gerda"] }, { type: "remove", playerId: "max" }]))
        .toEqual({ status: "handover", playerId: "gerda", queue: [] });
      expect(run([{ type: "request", playerIds: ["max"] }, { type: "remove", playerId: "max" }]))
        .toEqual(initialHandoverState);
    });

    it("aktiver Gast → wie fertig, Handy geht weiter", () => {
      const s = run([{ type: "request", playerIds: ["max", "gerda"] }, { type: "confirm" }, { type: "remove", playerId: "max" }]);
      expect(s).toEqual({ status: "return", from: "max", to: "gerda", queue: [] });
    });

    it("Ziel einer Rueckgabe → naechster bzw. Host", () => {
      const s = run([
        { type: "request", playerIds: ["max", "gerda", "ute"] }, { type: "confirm" }, { type: "done" },
        { type: "remove", playerId: "gerda" },
      ]);
      expect(s).toEqual({ status: "return", from: "max", to: "ute", queue: [] });
      expect(handoverReducer(s, { type: "remove", playerId: "ute" }))
        .toEqual({ status: "return", from: "max", to: null, queue: [] });
    });

    it("Unbeteiligte aendern nichts", () => {
      const s = run([{ type: "request", playerIds: ["max"] }]);
      expect(handoverReducer(s, { type: "remove", playerId: "tom" })).toBe(s);
      expect(handoverReducer(initialHandoverState, { type: "remove", playerId: "tom" })).toBe(initialHandoverState);
    });
  });

  it("Uhr laeuft nie, solange das Handy unterwegs ist (Kette mit 3 Gaesten)", () => {
    const ids = ["a", "b", "c"];
    let s = run([{ type: "request", playerIds: ids }]);
    const seen: Array<[string, boolean]> = [[s.status, isClockPaused(s)]];
    for (let i = 0; i < ids.length; i++) {
      s = run([{ type: "confirm" }, { type: "done" }], s);
      seen.push([s.status, isClockPaused(s)]);
    }
    s = handoverReducer(s, { type: "confirm" });
    expect(seen.every(([, paused]) => paused)).toBe(true);
    expect(s.status).toBe("idle");
  });
});
