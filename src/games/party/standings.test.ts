/**
 * Tabelle fuer den Fernseher — Platz, Vorplatz und Siegesserie.
 *
 * Warum es diesen Test gibt: `prevRank` und `streak` sind reine
 * Off-by-one-Fallen. `prevRank` ist der Stand VOR dem letzten Spiel, nicht der
 * vorletzte Platz und nicht der aktuelle; ein Fehler darum zeigt dem ganzen
 * Raum den falschen Aufsteiger. Und die Serie zaehlt rueckwaerts bis zum ersten
 * verlorenen Spiel — wer stattdessen alle Siege addiert, kroent jemanden mit
 * einer "Serie", der zuletzt Letzter war.
 */
import { describe, it, expect } from "vitest";

import {
  buildPartyNightState,
  finishedThroughFor,
  derivePartyPlaylist,
  derivePartyStandings,
  winStreakFor,
} from "./standings";
import { migratePartySession } from "./session-schema";
import type { GameHistoryEntry, PartyPlayer, PartySession } from "./session-schema";

function player(id: string, name: string, totalScore: number, gamesWon = 0): PartyPlayer {
  return { id, name, color: "#df8eff", avatar: "🎉", totalScore, gamesPlayed: 0, gamesWon };
}

function finished(
  gameId: string,
  winnerId: string,
  points: Record<string, number>,
  scored = true
): GameHistoryEntry {
  return {
    gameId,
    gameName: gameId,
    winnerId: scored ? winnerId : "",
    winnerName: "",
    scores: {},
    points: scored ? points : {},
    scored,
    playedAt: 0,
  };
}

describe("derivePartyStandings — Platz", () => {
  it("sortiert nach Punkten und vergibt 1-basierte Plaetze", () => {
    const standings = derivePartyStandings(
      [player("a", "Anna", 17), player("b", "Ben", 30), player("c", "Cem", 5)],
      []
    );
    expect(standings.map((s) => [s.name, s.rank])).toEqual([
      ["Ben", 1],
      ["Anna", 2],
      ["Cem", 3],
    ]);
  });

  it("laesst Gleichstand sich einen Platz teilen und ueberspringt den naechsten", () => {
    const standings = derivePartyStandings(
      [player("a", "Anna", 20), player("b", "Ben", 20), player("c", "Cem", 5)],
      []
    );
    expect(standings.map((s) => s.rank)).toEqual([1, 1, 3]);
  });

  it("gibt prevRank null, solange nichts gespielt wurde", () => {
    const standings = derivePartyStandings([player("a", "Anna", 0), player("b", "Ben", 0)], []);
    expect(standings.every((s) => s.prevRank === null)).toBe(true);
  });
});

describe("derivePartyStandings — prevRank ist der Stand VOR dem letzten Spiel", () => {
  it("zeigt den Aufstieg des Siegers des letzten Spiels", () => {
    // Vorher: Ben 20, Anna 15. Im letzten Spiel holt Anna 10, Ben 3.
    const players = [player("a", "Anna", 25), player("b", "Ben", 23)];
    const history = [finished("bomb", "a", { a: 10, b: 3 })];

    const standings = derivePartyStandings(players, history);
    const anna = standings.find((s) => s.id === "a")!;
    const ben = standings.find((s) => s.id === "b")!;

    expect(anna.rank).toBe(1);
    expect(anna.prevRank).toBe(2); // war vorher Zweite → Pfeil nach oben
    expect(ben.rank).toBe(2);
    expect(ben.prevRank).toBe(1);
  });

  it("meldet keine Bewegung, wenn das letzte Spiel die Reihenfolge nicht aendert", () => {
    const players = [player("a", "Anna", 40), player("b", "Ben", 12)];
    const history = [finished("taboo", "a", { a: 10, b: 7 })];

    for (const standing of derivePartyStandings(players, history)) {
      expect(standing.prevRank).toBe(standing.rank);
    }
  });

  it("beruecksichtigt NUR den letzten Eintrag, nicht die ganze Historie", () => {
    // Zwei Spiele. Vor dem LETZTEN stand es Anna 10, Ben 7 — also Anna vorn.
    const players = [player("a", "Anna", 11), player("b", "Ben", 17)];
    const history = [
      finished("bomb", "a", { a: 10, b: 7 }),
      finished("ohrwurm", "b", { a: 1, b: 10 }),
    ];

    const standings = derivePartyStandings(players, history);
    expect(standings.find((s) => s.id === "b")!.prevRank).toBe(2);
    expect(standings.find((s) => s.id === "a")!.prevRank).toBe(1);
  });

  it("laesst ein Pausenspiel als letzten Eintrag die Plaetze unveraendert", () => {
    const players = [player("a", "Anna", 25), player("b", "Ben", 10)];
    const history = [
      finished("bomb", "a", { a: 10, b: 3 }),
      finished("headup", "", {}, false),
    ];

    for (const standing of derivePartyStandings(players, history)) {
      expect(standing.prevRank).toBe(standing.rank);
    }
  });
});

describe("winStreakFor", () => {
  it("zaehlt aufeinanderfolgende Siege rueckwaerts", () => {
    const history = [
      finished("g1", "b", { b: 10 }),
      finished("g2", "a", { a: 10 }),
      finished("g3", "a", { a: 10 }),
    ];
    expect(winStreakFor("a", history)).toBe(2);
    expect(winStreakFor("b", history)).toBe(0);
  });

  it("gibt 0, wenn das letzte Spiel nicht gewonnen wurde", () => {
    const history = [
      finished("g1", "a", { a: 10 }),
      finished("g2", "a", { a: 10 }),
      finished("g3", "b", { b: 10 }),
    ];
    // Zwei Siege in Folge, aber eben nicht bis jetzt.
    expect(winStreakFor("a", history)).toBe(0);
  });

  it("gibt 0 ohne jede Historie", () => {
    expect(winStreakFor("a", [])).toBe(0);
  });

  it("laesst ein Pausenspiel die Serie weder verlaengern noch beenden", () => {
    const history = [
      finished("g1", "a", { a: 10 }),
      finished("headup", "", {}, false),
      finished("g3", "a", { a: 10 }),
    ];
    expect(winStreakFor("a", history)).toBe(2);
  });

  it("beendet die Serie am ersten verlorenen Spiel, auch weit hinten", () => {
    const history = [
      finished("g1", "a", { a: 10 }),
      finished("g2", "b", { b: 10 }),
      finished("g3", "a", { a: 10 }),
      finished("g4", "a", { a: 10 }),
    ];
    expect(winStreakFor("a", history)).toBe(2);
  });
});

describe("derivePartyPlaylist", () => {
  const nameFor = (id: string) => `Name:${id}`;

  it("markiert nur die Spiele VOR dem laufenden als erledigt", () => {
    const items = derivePartyPlaylist(["bomb", "taboo", "ohrwurm"], 1, nameFor);
    expect(items.map((i) => i.done)).toEqual([true, false, false]);
  });

  it("liefert den bereits uebersetzten Namen mit", () => {
    expect(derivePartyPlaylist(["bomb"], 0, nameFor)[0]).toEqual({
      gameId: "bomb",
      name: "Name:bomb",
      done: false,
    });
  });

  it("markiert am Ende alles als erledigt", () => {
    const items = derivePartyPlaylist(["bomb", "taboo"], 2, nameFor);
    expect(items.every((i) => i.done)).toBe(true);
  });
});

describe("buildPartyNightState", () => {
  function session(overrides: Partial<PartySession> = {}): PartySession {
    return migratePartySession({
      id: "s1",
      isActive: true,
      tvCode: "ABC123",
      createdAt: 1,
      players: [player("a", "Anna", 25, 2), player("b", "Ben", 10, 0)],
      gameHistory: [finished("bomb", "a", { a: 10, b: 3 })],
      ...overrides,
    })!;
  }

  it("meldet immer die Phase 'ingame' — Uebergaenge gehoeren nicht hierher", () => {
    expect(buildPartyNightState(session(), (id) => id).phase).toBe("ingame");
  });

  it("reicht die Historie ohne Umformung durch", () => {
    const state = buildPartyNightState(session(), (id) => id);
    const raw = session().gameHistory;
    expect(state.history).toHaveLength(1);
    expect(state.history[0].gameId).toBe(raw[0].gameId);
    expect(state.history[0].winnerId).toBe(raw[0].winnerId);
    expect(state.history[0].scores).toEqual(raw[0].scores);
  });

  it("nennt das zuletzt beendete Spiel", () => {
    expect(buildPartyNightState(session(), (id) => id).lastGameName).toBe("bomb");
  });

  it("laesst lastGameName weg, solange nichts gespielt wurde", () => {
    const state = buildPartyNightState(session({ gameHistory: [] }), (id) => id);
    expect(state.lastGameName).toBeUndefined();
    expect(state.history).toEqual([]);
  });

  it("gibt Playlist und Index aus der Sitzung weiter", () => {
    const state = buildPartyNightState(
      session({ playlist: ["bomb", "taboo"], playlistIndex: 1, playlistActive: true }),
      (id) => `Name:${id}`
    );
    expect(state.index).toBe(1);
    expect(state.playlist).toEqual([
      { gameId: "bomb", name: "Name:bomb", done: true },
      { gameId: "taboo", name: "Name:taboo", done: false },
    ]);
  });

  it("bleibt ohne Playlist gueltig — der Fernseher prueft auf standings", () => {
    const state = buildPartyNightState(session(), (id) => id);
    expect(state.active).toBe(true);
    expect(state.playlist).toEqual([]);
    expect(state.index).toBe(0);
    expect(state.standings).toHaveLength(2);
  });

  it("liefert die Tabelle sortiert und vollstaendig", () => {
    const state = buildPartyNightState(session(), (id) => id);
    expect(state.standings[0]).toEqual({
      id: "a",
      name: "Anna",
      color: "#df8eff",
      avatar: "🎉",
      points: 25,
      rank: 1,
      // Anna lag mit 15 zu 7 auch vor dem letzten Spiel vorn — keine Bewegung.
      prevRank: 1,
      gamesWon: 2,
      streak: 1,
    });
  });
});

/**
 * Der Sprung auf der Nacht-Route hinkte eine Runde hinterher.
 *
 * Grund: `playlistIndex` zeigt auf das Spiel, das laeuft oder als naechstes
 * kommt, und rueckt erst mit "Weiter" weiter. Der Zwischenstand geht aber
 * schon beim Verlassen des Spiels auf die Leitung. Nach dem ersten Spiel
 * sprang deshalb gar nichts, danach sprang die Gruppe in das Feld, das sie
 * gerade verlassen hatte.
 */
describe("finishedThroughFor", () => {
  it("waehrend eines Spiels ist das laufende NICHT fertig", () => {
    expect(finishedThroughFor(0, 4, "ingame")).toBe(0);
    expect(finishedThroughFor(2, 4, "ingame")).toBe(2);
  });

  it("zwischen zwei Spielen zaehlt das eben beendete mit", () => {
    // Genau der Fall, der vorher keinen Sprung erzeugte.
    expect(finishedThroughFor(0, 4, "between")).toBe(1);
    expect(finishedThroughFor(1, 4, "between")).toBe(2);
  });

  it("laeuft am Ende des Abends nicht ins Leere", () => {
    expect(finishedThroughFor(3, 4, "between")).toBe(4);
    // Auch wenn der Zeiger schon am Ende steht, gibt es kein fuenftes Feld.
    expect(finishedThroughFor(4, 4, "between")).toBe(4);
  });

  it("kommt mit einer Set-Liste aus einem Eintrag zurecht", () => {
    expect(finishedThroughFor(0, 1, "ingame")).toBe(0);
    expect(finishedThroughFor(0, 1, "between")).toBe(1);
  });

  it("die Siegerehrung zaehlt wie das laufende Spiel", () => {
    // 'finale' kommt erst, wenn ohnehin alles durch ist — nicht zusaetzlich
    // hochzaehlen, sonst zeigte die Karte ein Feld zu weit.
    expect(finishedThroughFor(4, 4, "finale")).toBe(4);
  });
});
