/**
 * Gaeste am Host-Handy — was der Weitergabe-Bildschirm und der Fernseher zeigen.
 */
import { describe, it, expect } from "vitest";

import { handoverReducer, initialHandoverState, type HandoverEvent } from "./handover-machine";
import { handoverScreenProps, localActiveSeats, localGuestIds, nextDoneIds, seatLookup, tvHandover, TV_HANDOVER_MAX_IDS } from "./guest-handover";

const players = [
  { id: "host", name: "Luca", avatar: "👑", color: "#ff0000" },
  { id: "lena", name: "Lena", avatar: "🦊", color: "#00ff00" },
  { id: "max", name: "Max", avatar: "🎸", color: "#0000ff", controlledBy: "host" },
  { id: "gerda", name: "Gerda", avatar: "", color: "", controlledBy: "host" },
];
const online = { myPlayerId: "host", localPlayerIds: ["host", "max", "gerda", "weg"], players: players as never };
const seatOf = seatLookup(players);
const hostSeat = seatOf("host");
const run = (events: HandoverEvent[]) => events.reduce(handoverReducer, initialHandoverState);

describe("lokale Plaetze", () => {
  it("Gaeste ohne eigenen Platz und ohne Abwesende", () => {
    expect(localGuestIds(online)).toEqual(["max", "gerda"]);
    expect(localActiveSeats(online)).toEqual(["host", "max", "gerda"]);
    expect(localGuestIds(undefined)).toEqual([]);
  });

  it("Handy ohne Gaeste", () => {
    expect(localGuestIds({ myPlayerId: "lena", players: players as never })).toEqual([]);
    expect(localActiveSeats({ myPlayerId: "lena", players: players as never })).toEqual(["lena"]);
  });

  it("seatLookup ergaenzt fehlendes Symbol und Farbe", () => {
    expect(seatOf("gerda")).toEqual({ id: "gerda", name: "Gerda", avatar: "G", color: "#df8eff" });
    expect(seatOf("nobody")).toBeUndefined();
  });
});

describe("handoverScreenProps", () => {
  it("idle / revealed → nichts", () => {
    expect(handoverScreenProps(initialHandoverState, seatOf, hostSeat)).toBeNull();
    expect(handoverScreenProps(run([{ type: "request", playerIds: ["max"] }, { type: "confirm" }]), seatOf, hostSeat)).toBeNull();
  });

  it("an Max weitergeben", () => {
    expect(handoverScreenProps(run([{ type: "request", playerIds: ["max"] }]), seatOf, hostSeat))
      .toEqual({ player: seatOf("max"), kind: "handover" });
  });

  it("weiter an Gerda / zurueck an den Host", () => {
    const toGerda = run([{ type: "request", playerIds: ["max", "gerda"] }, { type: "confirm" }, { type: "done" }]);
    expect(handoverScreenProps(toGerda, seatOf, hostSeat)).toEqual({ player: seatOf("max"), kind: "return", returnTo: seatOf("gerda") });
    const toHost = run([{ type: "request", playerIds: ["max"] }, { type: "confirm" }, { type: "done" }]);
    expect(handoverScreenProps(toHost, seatOf, hostSeat)).toEqual({ player: seatOf("max"), kind: "return", returnTo: { ...hostSeat, isHost: true } });
  });

  it("unbekannter Empfaenger → kein leerer Bildschirm", () => {
    expect(handoverScreenProps(run([{ type: "request", playerIds: ["unbekannt"] }]), seatOf, hostSeat)).toBeNull();
  });
});

describe("tvHandover — nur Name/Symbol/Farbe + Fortschritt, nie Geheimes", () => {
  const req = (ids: string[]): HandoverEvent => ({ type: "request", playerIds: ids });
  const C: HandoverEvent = { type: "confirm" }, D: HandoverEvent = { type: "done" };

  it("idle → nichts", () => {
    expect(tvHandover(initialHandoverState, seatOf)).toBeNull();
  });

  it("Kette Max → Gerda → Host mit Fortschritt", () => {
    const passing = run([req(["max", "gerda"])]);
    expect(tvHandover(passing, seatOf)).toEqual({
      playerId: "max", name: "Max", avatar: "🎸", color: "#0000ff",
      progress: { doneIds: [], currentId: "max", queueIds: ["gerda"], phase: "passing" },
      next: { name: "Gerda", avatar: "G", color: "#df8eff" },
    });
    const viewing = handoverReducer(passing, C);
    expect(tvHandover(viewing, seatOf)?.progress).toEqual({ doneIds: [], currentId: "max", queueIds: ["gerda"], phase: "viewing" });
    const toGerda = handoverReducer(viewing, D);
    const done1 = nextDoneIds(viewing, toGerda, []);
    expect(done1).toEqual(["max"]);
    expect(tvHandover(toGerda, seatOf, done1)?.progress).toEqual({ doneIds: ["max"], currentId: "gerda", queueIds: [], phase: "passing" });
    expect(tvHandover(toGerda, seatOf, done1)?.next).toBeUndefined();
    const gerdaViewing = handoverReducer(toGerda, C);
    const toHost = handoverReducer(gerdaViewing, D);
    const done2 = nextDoneIds(gerdaViewing, toHost, nextDoneIds(toGerda, gerdaViewing, done1));
    expect(done2).toEqual(["max", "gerda"]);
    expect(tvHandover(toHost, seatOf, done2)).toMatchObject({
      playerId: "gerda", progress: { doneIds: ["max", "gerda"], currentId: "gerda", queueIds: [], phase: "covered" },
    });
    const idle = handoverReducer(toHost, C);
    expect(nextDoneIds(toHost, idle, done2)).toEqual([]);
    expect(tvHandover(idle, seatOf, [])).toBeNull();
  });

  it("nur oeffentliche Felder", () => {
    const tv = tvHandover(run([req(["max"])]), seatOf)!; // ohne Nachfolger: kein `next`
    expect(Object.keys(tv).sort()).toEqual(["avatar", "color", "name", "playerId", "progress"]);
    expect(Object.keys(tv.progress!).sort()).toEqual(["currentId", "doneIds", "phase", "queueIds"]);
  });

  it("Grenzen: hoechstens 12 Kennungen, keine ueberlangen, keine Unbekannten", () => {
    const many = Array.from({ length: 20 }, (_, i) => `g${i}`);
    const lookup = seatLookup(many.map((id) => ({ id, name: id })).concat([{ id: "x".repeat(200), name: "lang" }]));
    const s = run([req([...many, "x".repeat(200)])]);
    const p = tvHandover(s, lookup, ["weg", "x".repeat(200)])!.progress!;
    expect(p.queueIds.length).toBe(TV_HANDOVER_MAX_IDS);
    expect(p.queueIds.every((id) => id.length <= 128)).toBe(true);
    expect(p.doneIds).toEqual([]);
  });
});
