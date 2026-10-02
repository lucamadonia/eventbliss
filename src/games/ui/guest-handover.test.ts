/**
 * Gaeste am Host-Handy — was der Weitergabe-Bildschirm und der Fernseher zeigen.
 */
import { describe, it, expect } from "vitest";

import { handoverReducer, initialHandoverState, type HandoverEvent } from "./handover-machine";
import { handoverScreenProps, localActiveSeats, localGuestIds, seatLookup, tvHandover } from "./guest-handover";

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

describe("tvHandover — nur Name/Symbol/Farbe, nie Geheimes", () => {
  it("zeigt, wer am Host-Handy spielt oder es gleich bekommt", () => {
    expect(tvHandover(initialHandoverState, seatOf)).toBeNull();
    expect(tvHandover(run([{ type: "request", playerIds: ["max"] }]), seatOf)).toEqual({ playerId: "max", name: "Max", avatar: "🎸", color: "#0000ff" });
    expect(tvHandover(run([{ type: "request", playerIds: ["max"] }, { type: "confirm" }]), seatOf)?.playerId).toBe("max");
    expect(tvHandover(run([{ type: "request", playerIds: ["max", "gerda"] }, { type: "confirm" }, { type: "done" }]), seatOf)?.playerId).toBe("gerda");
    expect(tvHandover(run([{ type: "request", playerIds: ["max"] }, { type: "confirm" }, { type: "done" }]), seatOf)).toBeNull();
    const keys = Object.keys(tvHandover(run([{ type: "request", playerIds: ["max"] }]), seatOf)!);
    expect(keys.sort()).toEqual(["avatar", "color", "name", "playerId"]);
  });
});
