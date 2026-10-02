/**
 * Gemeinsame Uhr — Masterplan T-3: Ein Handy, dessen Uhr 5 Minuten falsch
 * geht, muss trotzdem im selben Moment wechseln wie alle anderen. Faellt hier
 * etwas um, hinkt ein Geraet um Minuten hinterher oder springt vor.
 */
import { describe, it, expect, vi } from "vitest";

import { ServerClock, serverClock, MAX_SAMPLE_RTT_MS, parseServerTime } from "./scene-clock";

const SERVER_T0 = Date.parse("2026-10-01T20:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

/** Ein Geraet mit falsch gehender Uhr: lokal = Server - skew. */
function device(skewMs: number) {
  let serverNow = SERVER_T0;
  const clock = new ServerClock(() => serverNow - skewMs);
  return {
    clock,
    advance: (ms: number) => { serverNow += ms; },
    get serverNow() { return serverNow; },
    /** RPC mit Hin-/Rueckweg (symmetrisch, wenn nicht anders angegeben). */
    roundTrip(upMs: number, downMs = upMs) {
      const sent = serverNow - skewMs;
      serverNow += upMs;
      const stamp = serverNow;
      serverNow += downMs;
      clock.sample(iso(stamp), sent, serverNow - skewMs);
    },
  };
}

describe("ServerClock", () => {
  it("ohne Abgleich gilt die lokale Uhr", () => {
    const c = new ServerClock(() => 1234);
    expect(c.hasSync()).toBe(false);
    expect(c.offset()).toBe(0);
    expect(c.now()).toBe(1234);
    expect(c.toLocal(5000)).toBe(5000);
  });

  it.each([5 * 60_000, -5 * 60_000, 0])("gleicht eine um %i ms falsche Uhr aus", (skew) => {
    const d = device(skew);
    d.roundTrip(40);
    expect(d.clock.hasSync()).toBe(true);
    expect(d.clock.offset()).toBe(skew);
    expect(d.clock.now()).toBe(d.serverNow);
    // Serverzeit → lokal und zurueck
    expect(d.clock.toLocal(d.serverNow)).toBe(d.serverNow - skew);
  });

  it("asymmetrischer Weg: Fehler hoechstens rtt/2", () => {
    const d = device(90_000);
    d.roundTrip(700, 100); // 800 ms Laufzeit, ungleich verteilt
    expect(Math.abs(d.clock.now() - d.serverNow)).toBeLessThanOrEqual(400);
  });

  it("nimmt die Messung mit der kuerzesten Laufzeit, nicht die letzte", () => {
    const d = device(10_000);
    d.roundTrip(20);          // gut
    d.roundTrip(1500, 100);   // Ausreisser, stark asymmetrisch
    d.roundTrip(900, 50);
    expect(d.clock.offset()).toBe(10_000);
  });

  it("vergisst Messungen nach 5 neueren", () => {
    const d = device(0);
    d.roundTrip(10); // beste, aber bald zu alt
    for (let i = 0; i < 5; i++) d.roundTrip(300, 100);
    // Alle verbleibenden haben 400 ms Laufzeit mit 100 ms Asymmetrie
    expect(d.clock.offset()).toBe(100);
  });

  it("verwirft unbrauchbare Messungen", () => {
    const c = new ServerClock(() => 0);
    c.sample("kein Datum", 0, 10);
    c.sample(iso(SERVER_T0), 100, 50); // negative Laufzeit
    c.sample(iso(SERVER_T0), 0, MAX_SAMPLE_RTT_MS + 1);
    c.sample(iso(SERVER_T0), Number.NaN, 10);
    expect(c.hasSync()).toBe(false);
    expect(c.offset()).toBe(0);
    c.sample(iso(SERVER_T0), 0, MAX_SAMPLE_RTT_MS); // Grenze gilt noch
    expect(c.hasSync()).toBe(true);
  });

  it("meldet Aenderungen des Versatzes und laesst sich abmelden", () => {
    const d = device(2000);
    const fn = vi.fn();
    const off = d.clock.subscribe(fn);
    d.roundTrip(30);
    expect(fn).toHaveBeenCalledTimes(1);
    d.roundTrip(30); // gleicher Versatz → keine Meldung
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    d.clock.reset();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(d.clock.hasSync()).toBe(false);
    expect(d.clock.offset()).toBe(0);
  });

  it("die App-Uhr ist eine ServerClock", () => {
    expect(serverClock).toBeInstanceOf(ServerClock);
  });
});

describe("parseServerTime — Postgres-Zeitformate", () => {
  it("Mikrosekunden, Offset, Leerzeichen", () => {
    const ms = Date.parse("2026-10-01T13:23:29.470Z");
    expect(parseServerTime("2026-10-01T13:23:29.470694+00:00")).toBe(ms);
    expect(parseServerTime("2026-10-01 13:23:29.470694+00")).toBe(ms);
    expect(parseServerTime("2026-10-01T15:23:29.470694+02:00")).toBe(ms);
    expect(parseServerTime("2026-10-01T13:23:29.470Z")).toBe(ms);
    expect(parseServerTime("2026-10-01T19:23:29.470694+0600")).toBe(ms);
    expect(parseServerTime("2026-10-01")).toBe(Date.parse("2026-10-01"));
    expect(Number.isNaN(parseServerTime("quatsch"))).toBe(true);
  });
});
