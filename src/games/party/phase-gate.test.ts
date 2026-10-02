/**
 * Phasenwechsel im Gleichschritt (Design §9, T-1/T-2): alle Geraete zeigen bis
 * zum geplanten Start die alte Phase, danach die neue; Eingaben erst nach 1200 ms.
 */
import { describe, it, expect } from "vitest";

import { ServerClock } from "./scene-clock";
import { phaseGate, planPhaseStart, PHASE_INPUT_DELAY_MS } from "./phase-gate";

const fixed = (ms: number) => ({ now: () => ms });

describe("planPhaseStart", () => {
  it("jetzt + 600 ms Vorlauf, eigener Vorlauf, nie negativ", () => {
    expect(planPhaseStart(fixed(1000))).toBe(1600);
    expect(planPhaseStart(fixed(1000), 0)).toBe(1000);
    expect(planPhaseStart(fixed(1000), -50)).toBe(1000);
  });
});

describe("phaseGate", () => {
  const at = (now: number, startsAt: number | null = 1600) =>
    phaseGate({ previous: "discussion", next: "voting", startsAt, now });

  it("vor dem Start: alte Phase, gesperrt", () => {
    expect(at(1000)).toEqual({ shown: "discussion", pending: true, inputOpen: false, elapsedMs: 0, msUntilChange: 600 });
  });

  it("ab dem Start: neue Phase, Eingabe erst nach dem Einblend-Takt", () => {
    expect(at(1600)).toEqual({ shown: "voting", pending: false, inputOpen: false, elapsedMs: 0, msUntilChange: PHASE_INPUT_DELAY_MS });
    expect(at(2799).inputOpen).toBe(false);
    expect(at(2800)).toEqual({ shown: "voting", pending: false, inputOpen: true, elapsedMs: 1200, msUntilChange: 0 });
  });

  it("Nachzuegler springt in die laufende Phase (vorgespult)", () => {
    const late = at(2400);
    expect(late.shown).toBe("voting");
    expect(late.elapsedMs).toBe(800);
    expect(late.msUntilChange).toBe(400);
  });

  it("ohne Startzeit (lokal): sofort, ohne Sperre", () => {
    expect(at(1000, null)).toEqual({ shown: "voting", pending: false, inputOpen: true, elapsedMs: 0, msUntilChange: 0 });
    expect(phaseGate({ previous: "a", next: "b", startsAt: Number.NaN, now: 0 }).shown).toBe("b");
  });

  it("eigener Einblend-Takt", () => {
    expect(phaseGate({ previous: "a", next: "b", startsAt: 0, now: 100, inputDelayMs: 0 }).inputOpen).toBe(true);
  });

  it("Geraete mit ±5 min Uhrversatz wechseln zur selben Serverzeit", () => {
    let server = 1_790_000_000_000;
    const device = (skew: number) => {
      const c = new ServerClock(() => server - skew);
      c.sample(new Date(server + 30).toISOString(), server - skew, server - skew + 60);
      return c;
    };
    const host = device(0), fast = device(-300_000), slow = device(300_000);
    const startsAt = planPhaseStart(host);
    const shownAll = () => [host, fast, slow].map((c) => phaseGate({ previous: "a", next: "b", startsAt, now: c.now() }).shown);
    server += 599;
    expect(new Set(shownAll())).toEqual(new Set(["a"]));
    server += 1;
    expect(new Set(shownAll())).toEqual(new Set(["b"]));
  });
});
