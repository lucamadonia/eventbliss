/**
 * PANTOMIME am Host-Handy: Der Begriff erscheint nur beim Darsteller und bei
 * einem Gast erst nach der Weitergabe; die Uhr laeuft nie, waehrend das Handy
 * wandert oder die Phase noch nicht fuer alle sichtbar ist.
 */
import { describe, it, expect } from "vitest";

import { pantomimeHandoverSeat, pantomimeTvRoster, showsActorView, turnClockShouldRun } from "./pantomime-guests";

const guests = new Set(["max", "gerda"]);
const isGuest = (id: string) => guests.has(id);

describe("pantomimeHandoverSeat", () => {
  it("Gast-Darsteller braucht das Handy vom Zugbeginn bis zum Spielende", () => {
    for (const phase of ["turnStart", "extra", "fetch", "playing"]) expect(pantomimeHandoverSeat(phase, "max", isGuest), phase).toBe("max");
  });
  it("nach dem Zug zurueck an den Host", () => {
    for (const phase of ["turnSummary", "gameOver", "setup"]) expect(pantomimeHandoverSeat(phase, "max", isGuest), phase).toBeNull();
  });
  it("Host oder Handy-Spieler als Darsteller → keine Weitergabe", () => {
    expect(pantomimeHandoverSeat("playing", "host", isGuest)).toBeNull();
    expect(pantomimeHandoverSeat("playing", "lena", isGuest)).toBeNull();
    expect(pantomimeHandoverSeat("playing", null, isGuest)).toBeNull();
  });
});

describe("showsActorView — der Begriff nie ohne Geste", () => {
  const base = { isOnline: true, myId: "host", actorId: "max", activeGuest: null as string | null, handoverPaused: false };
  it("lokal immer (ein Handy wird herumgereicht)", () => {
    expect(showsActorView({ ...base, isOnline: false })).toBe(true);
  });
  it("Gast erst nach Bestaetigung, nie waehrend der Weitergabe", () => {
    expect(showsActorView(base)).toBe(false);
    expect(showsActorView({ ...base, handoverPaused: true })).toBe(false);
    expect(showsActorView({ ...base, activeGuest: "max" })).toBe(true);
    expect(showsActorView({ ...base, activeGuest: "max", handoverPaused: true })).toBe(false);
  });
  it("eigener Platz ja, fremder nein", () => {
    expect(showsActorView({ ...base, actorId: "host" })).toBe(true);
    expect(showsActorView({ ...base, actorId: "lena" })).toBe(false);
    expect(showsActorView({ ...base, actorId: null })).toBe(false);
  });
});

describe("turnClockShouldRun", () => {
  const base = { isOnline: true, isHost: true, phase: "playing", inputOpen: true, handoverPaused: false, timeLeft: 60 };
  it("laeuft, sobald alle die Phase sehen und niemand das Handy traegt", () => {
    expect(turnClockShouldRun(base)).toBe(true);
    expect(turnClockShouldRun({ ...base, inputOpen: false })).toBe(false);
    expect(turnClockShouldRun({ ...base, handoverPaused: true })).toBe(false);
  });
  it("lokal, Handy-Spieler, andere Phasen, abgelaufen → nicht anfassen", () => {
    expect(turnClockShouldRun({ ...base, isOnline: false })).toBeNull();
    expect(turnClockShouldRun({ ...base, isHost: false })).toBeNull();
    expect(turnClockShouldRun({ ...base, phase: "turnSummary" })).toBeNull();
    expect(turnClockShouldRun({ ...base, timeLeft: 0 })).toBeNull();
  });
});

describe("pantomimeTvRoster — Identitaet ohne Begriff", () => {
  const teams = [
    { color: "#F472B6", players: [{ id: "host", name: "Luca" }, { id: "max", name: "Max" }] },
    { color: "#22D3EE", players: [{ id: "lena", name: "Lena" }] },
  ];
  it("Symbol/Farbe aus dem Raum, sonst Initiale und Teamfarbe", () => {
    const roster = pantomimeTvRoster(teams, [{ id: "max", name: "Max", avatar: "🎸", color: "#0000ff" }]);
    expect(roster).toEqual([
      { id: "host", name: "Luca", avatar: "L", color: "#F472B6", team: 0 },
      { id: "max", name: "Max", avatar: "🎸", color: "#0000ff", team: 0 },
      { id: "lena", name: "Lena", avatar: "L", color: "#22D3EE", team: 1 },
    ]);
    expect(Object.keys(roster[0]).sort()).toEqual(["avatar", "color", "id", "name", "team"]);
  });
});
