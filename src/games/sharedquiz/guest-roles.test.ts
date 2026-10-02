/**
 * Wer darf am geteilten Host-Handy was sehen? (F03, G06)
 * Faellt hier etwas um, sieht ein Gast die Info einer fremden Rolle — oder
 * kommt nie an seine eigene.
 */
import { describe, it, expect } from "vitest";

import { currentAnswerer, localRoleSeats, pendingTrioViews, roleOf, roleViewFor, sharesRoles } from "./guest-roles";

const q = { question: "Hauptstadt von Peru?", answers: ["Lima", "Quito", "Bogota", "La Paz"], hint: "Am Pazifik" };
const players = [{ id: "host" }, { id: "lena" }, { id: "max" }, { id: "gerda" }];
// Rollen: Frage → host (0), Antworten → max (2), Tipp → gerda (3)
const roles: [number, number, number] = [0, 2, 3];

describe("roleOf", () => {
  it("findet die Rolle eines Platzes", () => {
    expect(roleOf(players, roles, "host")).toBe(0);
    expect(roleOf(players, roles, "max")).toBe(1);
    expect(roleOf(players, roles, "gerda")).toBe(2);
    expect(roleOf(players, roles, "lena")).toBe(-1);
    expect(roleOf(players, roles, "weg")).toBe(-1);
    expect(roleOf([], roles, "host")).toBe(-1);
  });
});

describe("roleViewFor — Trio: jede Rolle sieht NUR ihren Teil", () => {
  it("Frage / Antworten / Tipp sind getrennt", () => {
    expect(roleViewFor("trio", q, players, roles, 0, "host")).toEqual({ role: 0, question: q.question, answers: [], hint: "", canAnswer: false });
    expect(roleViewFor("trio", q, players, roles, 0, "max")).toEqual({ role: 1, question: "", answers: q.answers, hint: "", canAnswer: false });
    expect(roleViewFor("trio", q, players, roles, 0, "gerda")).toEqual({ role: 2, question: "", answers: [], hint: q.hint, canAnswer: true });
  });

  it("ohne Rolle: nichts", () => {
    expect(roleViewFor("trio", q, players, roles, 0, "lena")).toEqual({ role: -1, question: "", answers: [], hint: "", canAnswer: false });
  });

  it("die Ansicht ist eine Kopie — kein Durchgriff auf die Antwortliste", () => {
    const view = roleViewFor("trio", q, players, roles, 0, "max");
    view.answers.push("x");
    expect(q.answers).toHaveLength(4);
  });
});

describe("roleViewFor — Kette / Alles-oder-nichts: nur wer dran ist", () => {
  it("der aktuelle Antworter sieht Frage + Antworten, alle anderen nichts", () => {
    for (const mode of ["chain", "allornothing"] as const) {
      expect(roleViewFor(mode, q, players, roles, 0, "host")).toMatchObject({ question: q.question, canAnswer: true });
      expect(roleViewFor(mode, q, players, roles, 0, "max")).toMatchObject({ question: "", answers: [], canAnswer: false });
      expect(roleViewFor(mode, q, players, roles, 1, "max")).toMatchObject({ question: q.question, canAnswer: true });
      expect(roleViewFor(mode, q, players, roles, 1, "host")).toMatchObject({ question: "", canAnswer: false });
      // nie der Tipp (der gehoert nur zum Trio)
      expect(roleViewFor(mode, q, players, roles, 2, "gerda").hint).toBe("");
    }
  });

  it("alle haben geantwortet → niemand mehr", () => {
    expect(currentAnswerer(players, roles, 3)).toBeNull();
    expect(roleViewFor("chain", q, players, roles, 3, "gerda").canAnswer).toBe(false);
  });
});

describe("lokale Rollen am Host-Handy", () => {
  it("eigener Platz zuerst, nur mit Rolle, keine Doppelten", () => {
    expect(localRoleSeats(players, roles, ["host", "max", "gerda", "max"])).toEqual(["host", "max", "gerda"]);
    expect(localRoleSeats(players, roles, ["lena"])).toEqual([]);
  });

  it("noch nicht angesehen, in Reihenfolge", () => {
    expect(pendingTrioViews(["host", "max", "gerda"], [])).toEqual(["host", "max", "gerda"]);
    expect(pendingTrioViews(["host", "max", "gerda"], ["host"])).toEqual(["max", "gerda"]);
    expect(pendingTrioViews(["host", "max", "gerda"], ["host", "max", "gerda"])).toEqual([]);
  });

  it("geteilt erst ab zwei Rollen an einem Handy", () => {
    expect(sharesRoles(["host"])).toBe(false);
    expect(sharesRoles(["host", "max"])).toBe(true);
  });

  it("weniger als drei Leute: doppelte Rolle zaehlt als erste", () => {
    const two = [{ id: "a" }, { id: "b" }];
    expect(roleOf(two, [0, 1, 2], "a")).toBe(0); // Index 2 % 2 = 0 → auch Tipp, aber Frage zuerst
    expect(roleViewFor("trio", q, two, [0, 1, 2], 0, "a").question).toBe(q.question);
  });
});
