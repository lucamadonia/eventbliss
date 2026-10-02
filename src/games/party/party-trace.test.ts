/**
 * Trace-Puffer fuer die Timing-Harness (qa-party). Bricht das Format, misst
 * die E2E-Pruefung von T-1…T-3/F12 still nichts mehr.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PARTY_TRACE_LIMIT, pushPartyTrace, setPartyTraceDevice, partyTraceDevice, wallClockNow, type PartyTraceEntry } from "./party-trace";
import { ServerClock } from "./scene-clock";
import { acceptInput, deadline } from "./scene-schedule";

type Win = { __partyPlayTrace?: PartyTraceEntry[] };
let win: Win;

beforeEach(() => {
  win = {};
  vi.stubGlobal("window", win);
});
afterEach(() => vi.unstubAllGlobals());

describe("party-trace", () => {
  it("legt den Puffer an und begrenzt ihn auf 500", () => {
    for (let i = 0; i < PARTY_TRACE_LIMIT + 20; i++) {
      pushPartyTrace({ kind: "input-rejected", reason: "late", playerId: String(i), sceneId: "s" });
    }
    expect(win.__partyPlayTrace).toHaveLength(500);
    expect((win.__partyPlayTrace![0] as { playerId: string }).playerId).toBe("20");
  });

  it("ohne window ein No-op", () => {
    vi.unstubAllGlobals();
    expect(() => pushPartyTrace({ kind: "clock-sync", offsetMs: 0, rttMs: 0, samples: 1 })).not.toThrow();
  });

  it("Geraet einstellbar, Standard Handy", () => {
    expect(partyTraceDevice()).toBe("phone");
    setPartyTraceDevice("tv");
    expect(partyTraceDevice()).toBe("tv");
    setPartyTraceDevice("phone");
  });

  it("wallClockNow ignoriert ein verstelltes Date.now()", () => {
    const real = wallClockNow();
    const spy = vi.spyOn(Date, "now").mockReturnValue(real + 5 * 60_000);
    expect(Math.abs(wallClockNow() - real)).toBeLessThan(1000);
    spy.mockRestore();
  });

  it("jeder Uhrabgleich schreibt clock-sync", () => {
    const c = new ServerClock(() => 1000);
    c.sample(new Date(61_020).toISOString(), 1000, 1040);
    expect(win.__partyPlayTrace).toEqual([{ kind: "clock-sync", offsetMs: 60_000, rttMs: 40, samples: 1 }]);
  });

  it("acceptInput: vor der Frist an, danach verworfen und protokolliert (F12)", () => {
    const d = deadline(0, 1000);
    expect(acceptInput({ deadline: d, playerId: "tom", sceneId: "s1", clock: { now: () => 999 } })).toBe(true);
    expect(win.__partyPlayTrace ?? []).toHaveLength(0);
    expect(acceptInput({ deadline: d, playerId: "tom", sceneId: "s1", clock: { now: () => 1100 }, graceMs: 200 })).toBe(true);
    expect(acceptInput({ deadline: d, playerId: "tom", sceneId: "s1", clock: { now: () => 1000 } })).toBe(false);
    expect(win.__partyPlayTrace).toEqual([{ kind: "input-rejected", reason: "late", playerId: "tom", sceneId: "s1" }]);
  });
});

describe("party-trace ui", () => {
  it("nimmt Bildschirm-Eintraege typisiert auf", () => {
    vi.stubGlobal("window", {});
    pushPartyTrace({ kind: "ui", screen: "who-are-you", device: "phone", at: wallClockNow() });
    const buf = (globalThis as unknown as { window: { __partyPlayTrace: PartyTraceEntry[] } }).window.__partyPlayTrace;
    expect(buf[0]).toMatchObject({ kind: "ui", screen: "who-are-you", device: "phone" });
    vi.unstubAllGlobals();
  });
});
