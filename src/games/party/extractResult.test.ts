/**
 * Ergebnis-Extraktion — jedes der 21 Spiele reicht seinen Zustand anders durch.
 *
 * Warum es diesen Test gibt: Die Formen sind am jeweiligen Spielcode abgelesen,
 * nicht vereinbart. BOMBE liefert Strafpunkte statt Punkte (wer die wenigsten
 * hat, gewinnt) — wer das uebersieht, kroent in der Party den Verlierer.
 * TABU und PANTOMIME werten Teams, SPLIT-QUIZ reicht seine beiden Teams sogar
 * einzeln als `teamA`/`teamB` durch. HEADUP und STORY-BUILDER kennen gar keine
 * Punkte und duerfen die Gesamttabelle deshalb nicht anfassen.
 */
import { describe, it, expect } from "vitest";

import { extractGameResult, normalizePlayerName, resolvePartyGameId } from "./extractResult";

describe("extractGameResult — Spieler mit eigener Punktzahl", () => {
  it("uebernimmt {name, score}[] direkt (Mehrheit der Spiele)", () => {
    const result = extractGameResult("emoji-raten", {
      phase: "gameOver",
      players: [
        { id: "1", name: "Anna", color: "#fff", score: 12 },
        { id: "2", name: "Ben", color: "#000", score: 7 },
      ],
    });
    expect(result).toEqual({ scored: true, scores: { Anna: 12, Ben: 7 } });
  });

  it("uebernimmt die von OHRWURM vorberechnete Timeline-Laenge", () => {
    const result = extractGameResult("ohrwurm", {
      phase: "gameOver",
      players: [
        { id: "1", name: "Anna", color: "#fff", score: 8, hooks: 2 },
        { id: "2", name: "Ben", color: "#000", score: 5, hooks: 0 },
      ],
    });
    expect(result.scored).toBe(true);
    expect(result.scores).toEqual({ Anna: 8, Ben: 5 });
  });

  it("wertet eine 0 als echte Punktzahl, nicht als fehlend", () => {
    const result = extractGameResult("wer-bin-ich", {
      phase: "gameOver",
      players: [
        { id: "1", name: "Anna", score: 0 },
        { id: "2", name: "Ben", score: 3 },
      ],
    });
    expect(result).toEqual({ scored: true, scores: { Anna: 0, Ben: 3 } });
  });
});

describe("extractGameResult — BOMBE zaehlt Strafen, nicht Punkte", () => {
  it("dreht Strafpunkte um: wenigste Strafen fuehrt", () => {
    const result = extractGameResult("bomb", {
      phase: "gameOver",
      players: [
        { name: "Anna", penalties: 3 },
        { name: "Ben", penalties: 0 },
        { name: "Cem", penalties: 1 },
      ],
    });
    expect(result.scored).toBe(true);
    expect(result.scores).toEqual({ Anna: 0, Ben: 3, Cem: 2 });
    // Ben hat die wenigsten Strafen und muss damit vorne liegen.
    expect(result.scores.Ben).toBeGreaterThan(result.scores.Cem);
    expect(result.scores.Cem).toBeGreaterThan(result.scores.Anna);
  });

  it("laesst gleich viele Strafen als echten Gleichstand stehen", () => {
    const result = extractGameResult("bomb", {
      phase: "gameOver",
      players: [
        { name: "Anna", penalties: 2 },
        { name: "Ben", penalties: 2 },
      ],
    });
    expect(result.scores).toEqual({ Anna: 0, Ben: 0 });
  });

  it("gibt nie negative Werte aus", () => {
    const result = extractGameResult("bomb", {
      phase: "gameOver",
      players: [{ name: "Anna", penalties: 9 }],
    });
    expect(result.scores.Anna).toBe(0);
  });
});

describe("extractGameResult — Teams", () => {
  it("gibt jedem Mitglied die Teampunktzahl (TABU/PANTOMIME)", () => {
    const result = extractGameResult("taboo", {
      phase: "gameOver",
      teams: [
        { name: "Team A", color: "#f00", score: 9, players: ["Anna", "Ben"] },
        { name: "Team B", color: "#00f", score: 4, players: ["Cem", "Dora"] },
      ],
    });
    expect(result.scored).toBe(true);
    expect(result.scores).toEqual({ Anna: 9, Ben: 9, Cem: 4, Dora: 4 });
  });

  it("erkennt auch die Einzelfelder teamA/teamB von SPLIT-QUIZ", () => {
    const result = extractGameResult("split-quiz", {
      phase: "gameOver",
      // SPLIT-QUIZ reicht `players` nur als Namensliste durch — die Wertung
      // steckt ausschliesslich in den beiden Teams.
      players: ["Anna", "Ben", "Cem"],
      teamA: { name: "A", color: "#f00", score: 6, players: ["Anna", "Ben"], correctCount: 3 },
      teamB: { name: "B", color: "#00f", score: 11, players: ["Cem"], correctCount: 5 },
    });
    expect(result.scored).toBe(true);
    expect(result.scores).toEqual({ Anna: 6, Ben: 6, Cem: 11 });
  });

  it("ignoriert Teams ohne Mitglieder oder ohne Punktzahl", () => {
    const result = extractGameResult("pantomime", {
      phase: "gameOver",
      teams: [
        { name: "A", score: 5, players: ["Anna"] },
        { name: "B", score: 3, players: [] },
        { name: "C", players: ["Cem"] },
      ],
    });
    expect(result.scores).toEqual({ Anna: 5 });
  });
});

describe("extractGameResult — Pausenspiele ohne eigene Wertung", () => {
  it("meldet HEADUPs reine Namensliste als ungewertet", () => {
    const result = extractGameResult("headup", {
      phase: "gameOver",
      players: ["Anna", "Ben"],
      correctCount: 7,
    });
    expect(result.scored).toBe(false);
    // Die Namen bleiben erhalten, damit die Runde als gespielt zaehlt.
    expect(result.scores).toEqual({ Anna: 0, Ben: 0 });
  });

  it("meldet STORY-BUILDERs Spieler ohne Punktfeld als ungewertet", () => {
    const result = extractGameResult("story-builder", {
      phase: "gameOver",
      players: [
        { id: "1", name: "Anna", color: "#fff", avatar: "A" },
        { id: "2", name: "Ben", color: "#000", avatar: "B" },
      ],
    });
    expect(result.scored).toBe(false);
    expect(result.scores).toEqual({ Anna: 0, Ben: 0 });
  });

  it("liefert ein leeres, ungewertetes Ergebnis wenn gar nichts brauchbar ist", () => {
    expect(extractGameResult("bottlespin", { phase: "gameOver" })).toEqual({
      scored: false,
      scores: {},
    });
    expect(extractGameResult("bottlespin", null)).toEqual({ scored: false, scores: {} });
  });
});

describe("resolvePartyGameId", () => {
  it("nimmt den Routen-Parameter, wenn er in der Registry steht", () => {
    // Die Bruecke sagt 'impostor', die Route sagt 'hochstapler' — die Route gilt.
    expect(resolvePartyGameId("hochstapler", "impostor")).toBe("hochstapler");
  });

  it("uebersetzt sonst die abweichende Bruecken-Kennung", () => {
    expect(resolvePartyGameId(undefined, "impostor")).toBe("hochstapler");
    expect(resolvePartyGameId(undefined, "bottlespin")).toBe("flaschendrehen");
    expect(resolvePartyGameId(undefined, "wordpress")).toBe("drueck-das-wort");
    expect(resolvePartyGameId(undefined, "thisorthat")).toBe("this-or-that");
  });

  it("ignoriert einen Routen-Parameter, der kein Spiel ist", () => {
    expect(resolvePartyGameId("irgendwas", "impostor")).toBe("hochstapler");
  });

  it("laesst uebereinstimmende Kennungen unveraendert", () => {
    expect(resolvePartyGameId("bomb", "bomb")).toBe("bomb");
    expect(resolvePartyGameId(undefined, "ohrwurm")).toBe("ohrwurm");
  });
});

describe("normalizePlayerName", () => {
  it("gleicht Leerzeichen, Gross-/Kleinschreibung und Akzente an", () => {
    expect(normalizePlayerName("  José  ")).toBe("jose");
    expect(normalizePlayerName("ANNA")).toBe("anna");
    expect(normalizePlayerName("Jean  Luc")).toBe("jean luc");
    expect(normalizePlayerName("Zoë")).toBe(normalizePlayerName("zoe"));
  });
});
