/**
 * HEAD UP mit 🔁-Gaesten am Host-Handy (F01) und gemeinsamem Phasenwechsel.
 * Kippt hier etwas, steuert das falsche Geraet den Ratenden oder der Gast
 * verliert Sekunden seiner Runde.
 */
import { describe, it, expect } from "vitest";

import { PHASE_INPUT_DELAY_MS } from "../party/phase-gate";
import { ServerClock } from "../party/scene-clock";
import { actorControls, headUpActiveSeat, headUpCountdown, headUpInputDelayMs, headUpPhaseLeadMs, headUpTvSeats, isLocalActor } from "./party-play";

describe("isLocalActor", () => {
  it("lokales Spiel: immer", () => {
    expect(isLocalActor(null, false)).toBe(true);
  });
  it("online: eigener Platz oder eigener Gast", () => {
    expect(isLocalActor(["host", "max"], "host")).toBe(true);
    expect(isLocalActor(["host", "max"], "max")).toBe(true);
    expect(isLocalActor(["host", "max"], "lena")).toBe(false);
    expect(isLocalActor(["host"], false)).toBe(false);
  });
});

describe("headUpActiveSeat — wann das Handy an den Ratenden geht", () => {
  it("nur in Bereit/Spielen und nur online", () => {
    expect(headUpActiveSeat(true, "ready", "max")).toBe("max");
    expect(headUpActiveSeat(true, "playing", "max")).toBe("max");
    for (const screen of ["setup", "roundResult", "gameOver"] as const) expect(headUpActiveSeat(true, screen, "max")).toBeNull();
    expect(headUpActiveSeat(false, "ready", "max")).toBeNull();
    expect(headUpActiveSeat(true, "ready", false)).toBeNull();
  });
});

describe("actorControls — wer Bereit/Kippen/Knoepfe bedient", () => {
  const base = { online: true, myPlayerId: "host", localActor: true, handoverIdle: true, activeGuest: null as string | null };
  it("lokal immer", () => {
    expect(actorControls({ ...base, online: false, actorId: false, localActor: true })).toBe(true);
  });
  it("eigener Platz: nur ohne laufende Weitergabe", () => {
    expect(actorControls({ ...base, actorId: "host" })).toBe(true);
    expect(actorControls({ ...base, actorId: "host", handoverIdle: false })).toBe(false);
  });
  it("Gast: erst nach „Ich bin Max“", () => {
    expect(actorControls({ ...base, actorId: "max", handoverIdle: false, activeGuest: null })).toBe(false);
    expect(actorControls({ ...base, actorId: "max", handoverIdle: false, activeGuest: "max" })).toBe(true);
    expect(actorControls({ ...base, actorId: "max", handoverIdle: false, activeGuest: "gerda" })).toBe(false);
  });
  it("fremdes Handy nie", () => {
    expect(actorControls({ ...base, actorId: "lena", localActor: false })).toBe(false);
  });
});

describe("Phasentakt", () => {
  it("Wechsel zu Spielen: kein Vorlauf, keine Sperre (Countdown ist der Takt)", () => {
    expect(headUpPhaseLeadMs("playing")).toBe(0);
    expect(headUpInputDelayMs("playing")).toBe(0);
  });
  it("sonst Vorlauf und Einblend-Takt", () => {
    for (const screen of ["ready", "roundResult", "gameOver"] as const) {
      expect(headUpPhaseLeadMs(screen)).toBe(600);
      expect(headUpInputDelayMs(screen)).toBe(PHASE_INPUT_DELAY_MS);
    }
  });
});

describe("headUpTvSeats — volle Identitaet, Reihenfolge des Spiels, nie Woerter", () => {
  it("folgt der eingefrorenen Reihenfolge, ergaenzt Symbol/Farbe, laesst Entfernte weg", () => {
    const players = [
      { id: "a", name: "Anna", avatar: "🦊", color: "#ff0000" },
      { id: "b", name: "Ben" },
    ];
    expect(headUpTvSeats(["b", "weg", "a"], players)).toEqual([
      { id: "b", name: "Ben", avatar: "B", color: "#df8eff" },
      { id: "a", name: "Anna", avatar: "🦊", color: "#ff0000" },
    ]);
  });
});

describe("headUpCountdown — 3-2-1 aus der gemeinsamen Uhr (T-4)", () => {
  const at = (ms: number) => ({ now: () => ms });
  it("kein Countdown ohne Startzeit", () => {
    expect(headUpCountdown(null, at(0))).toEqual({ value: null, msUntilNext: 0 });
    expect(headUpCountdown(Number.NaN, at(0)).value).toBeNull();
  });
  it("3 → 2 → 1 → Los! je Sekunde, vor dem Start schon die 3", () => {
    expect(headUpCountdown(1000, at(900))).toEqual({ value: 3, msUntilNext: 100 });
    expect(headUpCountdown(1000, at(1000)).value).toBe(3);
    expect(headUpCountdown(1000, at(2000)).value).toBe(2);
    expect(headUpCountdown(1000, at(3500))).toEqual({ value: 1, msUntilNext: 500 });
    expect(headUpCountdown(1000, at(4000))).toEqual({ value: 0, msUntilNext: 0 });
  });
  it("Geraete mit ±5 min Uhrversatz zeigen zur selben Serverzeit dieselbe Ziffer", () => {
    let server = 1_790_000_000_000;
    const device = (skew: number) => {
      const c = new ServerClock(() => server - skew);
      c.sample(new Date(server + 40).toISOString(), server - skew, server - skew + 80);
      return c;
    };
    const devices = [device(0), device(300_000), device(-300_000)];
    const startsAt = server + 200;
    for (let step = 0; step < 40; step++) {
      expect(new Set(devices.map((c) => headUpCountdown(startsAt, c).value)).size).toBe(1);
      server += 97;
    }
  });
});
