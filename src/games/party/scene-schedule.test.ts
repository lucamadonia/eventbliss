/**
 * Szenen & Fristen — Masterplan 4.1 / T-1…T-4 / F10 / F12.
 *
 * Simuliert mehrere Geraete mit falsch gehenden Uhren und langsamen Netzen.
 * Was hier sichergestellt wird: Alle wechseln zur selben Serverzeit, Nachzuegler
 * springen in die laufende Szene, und niemand gewinnt Zeit durch Verzoegerung.
 */
import { describe, it, expect } from "vitest";

import { ServerClock } from "./scene-clock";
import {
  ackTracker,
  countdownState,
  SCENE_SKEW_BUDGET_MS,
  deadline,
  DEFAULT_SCENE_LEAD_MS,
  isPastDeadline,
  pauseDeadline,
  pausedRemainingMs,
  planScene,
  remainingMs,
  resumeDeadline,
  sceneLocalTime,
  sceneProgress,
  type SceneClock,
} from "./scene-schedule";

/** Gemeinsame "echte" Serverzeit des Tests. */
let server = 0;
const reset = () => { server = 1_790_000_000_000; };

/** Geraet mit Uhrversatz `skew` (lokal = Server - skew), abgeglichen per RPC mit `rtt`. */
function syncedDevice(skew: number, rtt = 60): ServerClock {
  const clock = new ServerClock(() => server - skew);
  const sent = server - skew;
  clock.sample(new Date(server + rtt / 2).toISOString(), sent, sent + rtt);
  return clock;
}

const fixed = (ms: number): SceneClock => ({ now: () => ms });

describe("planScene", () => {
  it("setzt startsAt = Serverzeit + 600 ms Vorlauf", () => {
    const s = planScene("round-end", { round: 3 }, { clock: fixed(10_000) });
    expect(s.startsAt).toBe(10_000 + DEFAULT_SCENE_LEAD_MS);
    expect(s.scene).toBe("round-end");
    expect(s.data).toEqual({ round: 3 });
    expect(typeof s.sceneId).toBe("string");
    expect(s.sceneId.length).toBeGreaterThan(0);
  });

  it("eigener Vorlauf, feste Kennung, kein data-Feld ohne Daten", () => {
    const s = planScene("intro", undefined, { clock: fixed(0), leadMs: 1500, sceneId: "x" });
    expect(s).toEqual({ sceneId: "x", scene: "intro", startsAt: 1500 });
    expect(planScene("a", undefined, { clock: fixed(0), leadMs: -5 }).startsAt).toBe(0);
  });

  it("vergibt verschiedene Kennungen", () => {
    const ids = new Set(Array.from({ length: 50 }, () => planScene("a", undefined, { clock: fixed(0) }).sceneId));
    expect(ids.size).toBe(50);
  });
});

describe("sceneProgress — alle Geraete wechseln gleichzeitig", () => {
  it("±5 min Uhrversatz: alle sehen den Start zur selben Serverzeit (T-3)", () => {
    reset();
    const host = syncedDevice(0);
    const fast = syncedDevice(-5 * 60_000);
    const slow = syncedDevice(5 * 60_000);
    const scene = planScene("countdown", undefined, { clock: host });

    for (const c of [host, fast, slow]) {
      expect(sceneProgress(scene, c)).toEqual({ phase: "pending", msUntilStart: 600, elapsedMs: 0 });
    }
    // Lokaler Zeitpunkt fuer setTimeout unterscheidet sich um genau den Versatz …
    expect(sceneLocalTime(scene.startsAt, fast) - sceneLocalTime(scene.startsAt, host)).toBe(5 * 60_000);
    expect(sceneLocalTime(scene.startsAt, slow) - sceneLocalTime(scene.startsAt, host)).toBe(-5 * 60_000);
    // … und zur Serverzeit startsAt laufen alle.
    server += 600;
    for (const c of [host, fast, slow]) expect(sceneProgress(scene, c).phase).toBe("running");
  });

  it("800 ms Latenz: Nachzuegler springt in die laufende Szene (T-2)", () => {
    reset();
    const host = syncedDevice(0);
    const laggy = syncedDevice(42_000, 800); // Abgleich ebenfalls ueber das langsame Netz
    const scene = planScene("reveal", undefined, { clock: host });
    server += 800; // Nachricht kommt 800 ms spaeter an — 200 ms nach Start
    const p = sceneProgress(scene, laggy);
    expect(p.phase).toBe("running");
    expect(p.msUntilStart).toBe(0);
    expect(p.elapsedMs).toBe(200);
  });

  it("Grenze: genau zu startsAt laeuft die Szene", () => {
    expect(sceneProgress({ startsAt: 500 }, fixed(499)).phase).toBe("pending");
    expect(sceneProgress({ startsAt: 500 }, fixed(500))).toEqual({ phase: "running", msUntilStart: 0, elapsedMs: 0 });
  });

  it("sceneLocalTime funktioniert auch ohne toLocal", () => {
    const now = Date.now();
    const plain: SceneClock = { now: () => now + 7000 };
    expect(Math.abs(sceneLocalTime(now + 8000, plain) - (now + 1000))).toBeLessThan(50);
  });
});

describe("Fristen", () => {
  it("deadline / remainingMs / isPastDeadline — alle sperren zur selben Uhrzeit (T09)", () => {
    reset();
    const a = syncedDevice(5 * 60_000);
    const b = syncedDevice(-5 * 60_000, 800);
    const d = deadline(server, 30_000);
    server += 29_999;
    for (const c of [a, b]) {
      expect(isPastDeadline(d, c)).toBe(false);
      expect(remainingMs(d, c)).toBe(1);
    }
    server += 1;
    for (const c of [a, b]) {
      expect(isPastDeadline(d, c)).toBe(true);
      expect(remainingMs(d, c)).toBe(0);
    }
  });

  it("Eingabe nach Frist wird verworfen, Kulanz nur fuer den Host (F12)", () => {
    const d = deadline(1000, 500);
    expect(d).toBe(1500);
    expect(isPastDeadline(d, fixed(1600))).toBe(true);
    expect(isPastDeadline(d, fixed(1600), 250)).toBe(false);
    expect(isPastDeadline(d, fixed(1750), 250)).toBe(true);
    expect(remainingMs(d, fixed(9999))).toBe(0);
    expect(deadline(1000, -20)).toBe(1000);
  });

  it("Pause/Fortsetzen verschiebt die Frist um die Pausendauer (F10)", () => {
    const d = deadline(0, 10_000);
    const paused = pauseDeadline(d, fixed(4000));
    expect(pausedRemainingMs(paused)).toBe(6000);
    const resumed = resumeDeadline(paused, fixed(64_000)); // 60 s Weitergabe
    expect(resumed).toBe(70_000);
    expect(remainingMs(resumed, fixed(64_000))).toBe(6000);
  });

  it("mehrere Pausen addieren sich", () => {
    let d = deadline(0, 10_000);
    d = resumeDeadline(pauseDeadline(d, fixed(1000)), fixed(3000));
    d = resumeDeadline(pauseDeadline(d, fixed(5000)), fixed(8000));
    expect(d).toBe(15_000);
  });

  it("eine schon abgelaufene Frist lebt durch Pause nicht wieder auf", () => {
    const d = deadline(0, 1000);
    const paused = pauseDeadline(d, fixed(1500));
    expect(pausedRemainingMs(paused)).toBe(0);
    const resumed = resumeDeadline(paused, fixed(5000));
    expect(isPastDeadline(resumed, fixed(5000))).toBe(true);
  });

  it("Fortsetzen mit zurueckgesprungener Uhr verkuerzt die Frist nicht", () => {
    const paused = pauseDeadline(10_000, fixed(5000));
    expect(resumeDeadline(paused, fixed(4000))).toBe(10_000);
  });
});

describe("ackTracker — kritische Szenen warten max. 3 s", () => {
  const base = { expected: ["host", "lena", "tom"], startedAt: 1000 };

  it("wartet, solange jemand fehlt", () => {
    const s = ackTracker({ ...base, acks: ["host", "lena"], now: 2000 });
    expect(s).toEqual({ ready: false, timedOut: false, missing: ["tom"], waitMs: 2000 });
  });

  it("geht sofort weiter, wenn alle bestaetigt haben", () => {
    const s = ackTracker({ ...base, acks: new Set(["tom", "lena", "host", "fremd"]), now: 1001 });
    expect(s).toEqual({ ready: true, timedOut: false, missing: [], waitMs: 0 });
  });

  it("geht nach 3 s ohne die Langsamen weiter", () => {
    expect(ackTracker({ ...base, acks: ["host"], now: 3999 }).ready).toBe(false);
    const s = ackTracker({ ...base, acks: ["host"], now: 4000 });
    expect(s).toEqual({ ready: true, timedOut: true, missing: ["lena", "tom"], waitMs: 0 });
  });

  it("eigene Wartezeit, doppelte Erwartungen, niemand erwartet", () => {
    expect(ackTracker({ ...base, acks: [], now: 1500, timeoutMs: 500 }).timedOut).toBe(true);
    expect(ackTracker({ expected: ["a", "a"], acks: [], startedAt: 0, now: 0 }).missing).toEqual(["a"]);
    expect(ackTracker({ expected: [], acks: [], startedAt: 0, now: 0 }).ready).toBe(true);
  });

  it("vor dem Start gerechnet: Wartezeit reicht bis startedAt + 3 s", () => {
    expect(ackTracker({ ...base, acks: [], now: 400 }).waitMs).toBe(3600);
  });
});

describe("countdownState — alle zeigen dieselbe Ziffer (T-4)", () => {
  it("vor dem Start, 3-2-1, Los!", () => {
    expect(countdownState(1000, fixed(400))).toEqual({ phase: "pending", value: null, msUntilNext: 600 });
    expect(countdownState(1000, fixed(1000))).toEqual({ phase: "counting", value: 3, msUntilNext: 1000 });
    expect(countdownState(1000, fixed(1999)).value).toBe(3);
    expect(countdownState(1000, fixed(2000)).value).toBe(2);
    expect(countdownState(1000, fixed(3250))).toEqual({ phase: "counting", value: 1, msUntilNext: 750 });
    expect(countdownState(1000, fixed(4000))).toEqual({ phase: "go", value: 0, msUntilNext: 0 });
  });

  it("Geraete mit ±5 min Uhrversatz zeigen zu jeder Serverzeit dieselbe Zahl", () => {
    reset();
    const devices = [syncedDevice(0), syncedDevice(300_000), syncedDevice(-300_000, 800)];
    const startsAt = server + 600;
    for (let step = 0; step < 50; step++) {
      const values = devices.map((c) => countdownState(startsAt, c).value);
      expect(new Set(values).size).toBe(1);
      server += 97;
    }
  });

  it("eigene Ziffernzahl", () => {
    expect(countdownState(0, fixed(0), 5).value).toBe(5);
  });
});

describe("Konstanten aus party-motion", () => {
  it("Vorlauf 600 ms, Versatz-Budget 250 ms", () => {
    expect(DEFAULT_SCENE_LEAD_MS).toBe(600);
    expect(SCENE_SKEW_BUDGET_MS).toBe(250);
  });
});
