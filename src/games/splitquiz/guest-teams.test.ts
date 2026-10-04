/**
 * SPLIT-QUIZ: Wer am Host-Handy welche Haelfte sehen darf (F03, G06).
 * Geht hier etwas schief, sieht ein Team die Antworten des anderen.
 */
import { describe, it, expect } from "vitest";

import { handoverReducer, initialHandoverState, type HandoverEvent, type HandoverState } from "../ui/handover-machine";
import { assignTeams, currentHolder, desiredHolder, handoverStep, privateViewTeam, teamOf, type HandoverStep } from "./guest-teams";

describe("assignTeams — Host-Handy moeglichst in einem Team", () => {
  it("ohne oder mit nur einem lokalen Platz: wie bisher halbiert", () => {
    expect(assignTeams(["a", "b", "c", "d"], [])).toEqual([["a", "b"], ["c", "d"]]);
    expect(assignTeams(["a", "b", "c", "d"], ["c"])).toEqual([["a", "b"], ["c", "d"]]);
  });

  it("Host + Gaeste zusammen, aufgefuellt bis zur Haelfte", () => {
    expect(assignTeams(["lena", "host", "tom", "max", "udo", "eva"], ["host", "max"]))
      .toEqual([["host", "max", "lena"], ["tom", "udo", "eva"]]);
  });

  it("genau eine Haelfte lokal: Host-Handy ist ein Team", () => {
    expect(assignTeams(["host", "max", "gerda", "lena", "tom"], ["host", "max", "gerda"]))
      .toEqual([["host", "max", "gerda"], ["lena", "tom"]]);
  });

  it("mehr lokale als eine Haelfte: zusammen, solange Abstand ≤ 2", () => {
    expect(assignTeams(["host", "max", "gerda", "ute", "lena", "tom"], ["host", "max", "gerda", "ute"]))
      .toEqual([["host", "max", "gerda", "ute"], ["lena", "tom"]]);
  });

  it("zu unfair → doch geteilt (Weitergabe noetig)", () => {
    const [a, b] = assignTeams(["host", "g1", "g2", "g3", "g4", "lena"], ["host", "g1", "g2", "g3", "g4"]);
    expect(a.length).toBe(3);
    expect(b.length).toBe(3);
  });

  it("alle am Host-Handy → geteilt", () => {
    expect(assignTeams(["host", "max", "gerda", "ute"], ["host", "max", "gerda", "ute"])).toEqual([["host", "max"], ["gerda", "ute"]]);
  });

  it("jede Kennung genau einmal", () => {
    const [a, b] = assignTeams(["a", "b", "a", "c", "d"], ["a", "c"]);
    expect([...a, ...b].sort()).toEqual(["a", "b", "c", "d"]);
  });
});

describe("desiredHolder / handoverStep — nie die fremde Haelfte", () => {
  // Host + Max in Team A, Gerda in Team B, Lena (eigenes Handy) in Team B
  const teams: [string[], string[]] = [["host", "max"], ["gerda", "lena"]];
  const local = ["host", "max", "gerda"];
  const want = (activeTeam: number, phase: string, holder: string) =>
    desiredHolder({ teams, activeTeam, phase, localSeats: local, myPlayerId: "host", holder });

  it("Team A dran: Host behaelt das Handy (keine unnoetige Weitergabe)", () => {
    expect(want(0, "question", "host")).toBe("host");
    expect(want(0, "question", "max")).toBe("max");
  });

  it("Team B dran: Handy an Gerda", () => {
    expect(want(1, "handoff", "host")).toBe("gerda");
  });

  it("oeffentliche Phasen: zurueck an den Host", () => {
    expect(want(1, "reveal", "gerda")).toBe("host");
    expect(want(0, "gameOver", "max")).toBe("host");
  });

  it("Host-Handy hat niemanden im aktiven Team → Host (Warte-Bildschirm)", () => {
    expect(desiredHolder({ teams, activeTeam: 1, phase: "question", localSeats: ["host", "max"], myPlayerId: "host", holder: "host" })).toBe("host");
  });

  it("Moderator-Host ohne Team: Gast seines Teams bekommt das Handy", () => {
    expect(desiredHolder({ teams: [["max"], ["lena"]], activeTeam: 0, phase: "question", localSeats: ["host", "max"], myPlayerId: "host", holder: "host" })).toBe("max");
  });

  const run = (events: HandoverEvent[]) => events.reduce(handoverReducer, initialHandoverState);
  const step = (s: HandoverState, desired: string): HandoverStep => handoverStep(s, desired, "host");

  it("Schritte der Weitergabe", () => {
    expect(step(initialHandoverState, "host")).toBe("none");
    expect(step(initialHandoverState, "gerda")).toBe("request");
    const gerda = run([{ type: "request", playerIds: ["gerda"] }, { type: "confirm" }]);
    expect(step(gerda, "gerda")).toBe("none");
    expect(step(gerda, "host")).toBe("done");
    expect(step(gerda, "max")).toBe("done+request");
    // unterwegs: nichts umplanen …
    expect(step(run([{ type: "request", playerIds: ["gerda"] }]), "host")).toBe("none");
    // … ausser die Rueckgabe an den Host soll direkt an einen Gast
    const back = run([{ type: "request", playerIds: ["gerda"] }, { type: "confirm" }, { type: "done" }]);
    expect(step(back, "max")).toBe("request");
    expect(step(back, "host")).toBe("none");
  });

  it("currentHolder", () => {
    expect(currentHolder(initialHandoverState, "host")).toBe("host");
    expect(currentHolder(run([{ type: "request", playerIds: ["max"] }]), "host")).toBeNull();
    expect(currentHolder(run([{ type: "request", playerIds: ["max"] }, { type: "confirm" }]), "host")).toBe("max");
  });

  it("privateViewTeam: nur die Haelfte des aktiven Teams, nur beim richtigen Halter", () => {
    expect(privateViewTeam({ teams, activeTeam: 0, phase: "question", holder: "host" })).toBe(0);
    expect(privateViewTeam({ teams, activeTeam: 1, phase: "question", holder: "host" })).toBe(-1);
    expect(privateViewTeam({ teams, activeTeam: 1, phase: "betting", holder: "gerda" })).toBe(1);
    expect(privateViewTeam({ teams, activeTeam: 1, phase: "question", holder: null })).toBe(-1);
    expect(privateViewTeam({ teams, activeTeam: 0, phase: "handoff", holder: "host" })).toBe(-1);
    expect(teamOf(teams, "nobody")).toBe(-1);
  });

  it("ganzer Ablauf: Host+Max (A) und Gerda (B) teilen sich ein Handy", () => {
    let s: HandoverState = initialHandoverState;
    const apply = (st: HandoverStep, desired: string) => {
      if (st === "done" || st === "done+request") s = handoverReducer(s, { type: "done" });
      if (st === "request" || st === "done+request") s = handoverReducer(s, { type: "request", playerIds: [desired] });
    };
    const seen: number[] = [];
    for (const [activeTeam, phase] of [[0, "handoff"], [0, "question"], [1, "handoff"], [1, "question"], [1, "reveal"]] as const) {
      const holder = currentHolder(s, "host") ?? "";
      const d = desiredHolder({ teams, activeTeam, phase, localSeats: local, myPlayerId: "host", holder });
      apply(handoverStep(s, d, "host"), d);
      if (s.status === "handover" || s.status === "return") s = handoverReducer(s, { type: "confirm" });
      seen.push(privateViewTeam({ teams, activeTeam, phase, holder: currentHolder(s, "host") }));
    }
    // Team A sah nur seine Haelfte, Team B nur seine — nie eine fremde.
    expect(seen).toEqual([-1, 0, -1, 1, -1]);
    expect(s.status).toBe("idle");
  });
});
