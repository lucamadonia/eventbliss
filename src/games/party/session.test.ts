/**
 * Party-Sitzung — Migration alter Speicherstaende und Verrechnung der Punkte.
 *
 * Warum es diesen Test gibt: Die Sitzung liegt in localStorage und ueberlebt
 * App-Updates. Ein strenger Parser haette bei jedem Update mitten in der Party
 * alle Mitspieler und alle Punkte geloescht — deshalb muss ein alter Blob
 * ergaenzt statt verworfen werden. Und in die Tabelle duerfen ausschliesslich
 * Platzierungspunkte fliessen; ein Pausenspiel darf sie nicht anfassen.
 */
import { describe, it, expect, beforeEach } from "vitest";

import { migratePartySession, PARTY_SCHEMA_VERSION } from "./session-schema";
import {
  __resetPartySessionCache,
  getActivePartySession,
  reportGameResult,
} from "@/hooks/usePartySession";

const STORAGE_KEY = "eventbliss_party_session";

// Die Unit-Tests laufen in der Node-Umgebung (vitest.config.ts) — dort gibt es
// keinen localStorage. Ein Speicher im Arbeitsspeicher reicht vollstaendig aus.
class MemoryStorage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

(globalThis as unknown as { localStorage: Storage }).localStorage =
  new MemoryStorage() as unknown as Storage;

/** Speicherstand aus der Zeit VOR Playlist, Platzierungspunkten und Schema. */
function legacyBlob() {
  return {
    id: "session-1",
    tvCode: "ABC123",
    currentGameId: null,
    isActive: true,
    createdAt: 1_700_000_000_000,
    players: [
      { id: "p1", name: "Anna", color: "#df8eff", avatar: "🎉", totalScore: 40, gamesPlayed: 4, gamesWon: 2 },
      { id: "p2", name: "Ben", color: "#ff6b98", avatar: "🔥", totalScore: 21, gamesPlayed: 4, gamesWon: 1 },
      { id: "p3", name: "José", color: "#8ff5ff", avatar: "⭐", totalScore: 12, gamesPlayed: 4, gamesWon: 1 },
    ],
    gameHistory: [
      { gameId: "bomb", gameName: "Bombe", winnerId: "p1", winnerName: "Anna", scores: { p1: 3 }, playedAt: 1 },
    ],
  };
}

function seed(blob: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
  __resetPartySessionCache();
}

beforeEach(() => {
  localStorage.clear();
  __resetPartySessionCache();
});

describe("migratePartySession", () => {
  it("ergaenzt fehlende Felder eines alten Blobs statt ihn wegzuwerfen", () => {
    const session = migratePartySession(legacyBlob());
    expect(session).not.toBeNull();
    expect(session!.players.map((p) => p.name)).toEqual(["Anna", "Ben", "José"]);
    // Punktestand und Statistik der laufenden Party bleiben unangetastet.
    expect(session!.players[0].totalScore).toBe(40);
    expect(session!.players[0].gamesWon).toBe(2);
    // Die neuen Felder bekommen sichere Standardwerte.
    expect(session!.playlist).toEqual([]);
    expect(session!.playlistIndex).toBe(0);
    expect(session!.playlistActive).toBe(false);
    expect(session!.schemaVersion).toBe(PARTY_SCHEMA_VERSION);
  });

  it("ergaenzt auch alte Historieneintraege um Punkte und Wertungsflagge", () => {
    const session = migratePartySession(legacyBlob())!;
    const entry = session.gameHistory[0];
    expect(entry.points).toEqual({});
    // Vor der Umstellung gab es keine Pausenspiele — alles Alte war gewertet.
    expect(entry.scored).toBe(true);
  });

  it("liest eine Sitzung aus dem Speicher statt sie zu verlieren", () => {
    seed(legacyBlob());
    const session = getActivePartySession();
    expect(session?.players).toHaveLength(3);
    expect(session?.playlistActive).toBe(false);
  });

  it("gibt null fuer beendete Sitzungen und fuer Muell", () => {
    expect(migratePartySession({ ...legacyBlob(), isActive: false })).toBeNull();
    expect(migratePartySession(null)).toBeNull();
    expect(migratePartySession("kaputt")).toBeNull();
    expect(migratePartySession({ isActive: true })).toBeNull();
  });

  it("uebernimmt eine bereits laufende Playlist unveraendert", () => {
    const session = migratePartySession({
      ...legacyBlob(),
      playlist: ["bomb", "taboo", "ohrwurm"],
      playlistIndex: 1,
      playlistActive: true,
    })!;
    expect(session.playlist).toEqual(["bomb", "taboo", "ohrwurm"]);
    expect(session.playlistIndex).toBe(1);
    expect(session.playlistActive).toBe(true);
  });

  it("beendet eine Playlist, deren Index hinter das Ende gerutscht ist", () => {
    const session = migratePartySession({
      ...legacyBlob(),
      playlist: ["bomb"],
      playlistIndex: 9,
      playlistActive: true,
    })!;
    expect(session.playlistIndex).toBe(1);
    expect(session.playlistActive).toBe(false);
  });
});

describe("reportGameResult", () => {
  it("addiert Platzierungspunkte, nicht die Rohpunkte des Spiels", () => {
    seed(legacyBlob());
    const written = reportGameResult({
      gameId: "drueck-das-wort",
      gameName: "Drueck das Wort",
      scored: true,
      // Absichtlich riesige Rohpunkte — sie duerfen nicht in die Tabelle.
      scoresByName: { Anna: 180, Ben: 90, José: 5 },
    });
    expect(written).toBe(true);

    const players = getActivePartySession()!.players;
    expect(players[0].totalScore).toBe(40 + 10);
    expect(players[1].totalScore).toBe(21 + 7);
    expect(players[2].totalScore).toBe(12 + 5);
    expect(players.map((p) => p.gamesPlayed)).toEqual([5, 5, 5]);
    expect(players[0].gamesWon).toBe(3);
  });

  it("findet Spieler ueber Akzente und Gross-/Kleinschreibung hinweg", () => {
    seed(legacyBlob());
    reportGameResult({
      gameId: "ohrwurm",
      gameName: "Ohrwurm",
      scored: true,
      scoresByName: { "  jose ": 9, ANNA: 1, Ben: 5 },
    });
    const players = getActivePartySession()!.players;
    expect(players[2].totalScore).toBe(12 + 10); // José vorne
    expect(players[1].totalScore).toBe(21 + 7);
    expect(players[0].totalScore).toBe(40 + 5);
  });

  it("laesst ein Pausenspiel die Tabelle unangetastet", () => {
    seed(legacyBlob());
    const before = getActivePartySession()!.players.map((p) => p.totalScore);

    reportGameResult({
      gameId: "headup",
      gameName: "Head Up",
      scored: false,
      scoresByName: { Anna: 0, Ben: 0, José: 0 },
    });

    const session = getActivePartySession()!;
    expect(session.players.map((p) => p.totalScore)).toEqual(before);
    expect(session.players.map((p) => p.gamesWon)).toEqual([2, 1, 1]);
    // Gespielt wurde trotzdem — die Runde zaehlt.
    expect(session.players.map((p) => p.gamesPlayed)).toEqual([5, 5, 5]);

    const entry = session.gameHistory[session.gameHistory.length - 1];
    expect(entry.scored).toBe(false);
    expect(entry.points).toEqual({});
    expect(entry.winnerId).toBe("");
  });

  it("laesst Nichtteilnehmer voellig unberuehrt", () => {
    seed(legacyBlob());
    reportGameResult({
      gameId: "taboo",
      gameName: "Tabu",
      scored: true,
      scoresByName: { Anna: 5, Ben: 2 },
    });
    const jose = getActivePartySession()!.players[2];
    expect(jose.totalScore).toBe(12);
    expect(jose.gamesPlayed).toBe(4);
  });

  it("verbucht ein Spiel mit lauter fremden Namen als Pausenspiel", () => {
    seed(legacyBlob());
    reportGameResult({
      gameId: "bomb",
      gameName: "Bombe",
      scored: true,
      scoresByName: { Gast1: 3, Gast2: 0 },
    });
    const session = getActivePartySession()!;
    // Sonst haetten alle drei Party-Spieler 0 Rohpunkte, denselben ersten Platz
    // und je 10 Punkte geschenkt bekommen.
    expect(session.players.map((p) => p.totalScore)).toEqual([40, 21, 12]);
    expect(session.gameHistory[session.gameHistory.length - 1].scored).toBe(false);
  });

  it("teilt bei Gleichstand den hoeheren Wert", () => {
    seed(legacyBlob());
    reportGameResult({
      gameId: "split-quiz",
      gameName: "Split Quiz",
      scored: true,
      scoresByName: { Anna: 8, Ben: 8, José: 3 },
    });
    const players = getActivePartySession()!.players;
    expect(players[0].totalScore).toBe(40 + 10);
    expect(players[1].totalScore).toBe(21 + 10);
    expect(players[2].totalScore).toBe(12 + 5); // dritter Platz, nicht zweiter
  });

  it("meldet false, wenn gar keine Party laeuft", () => {
    expect(
      reportGameResult({ gameId: "bomb", gameName: "Bombe", scored: true, scoresByName: { Anna: 1 } })
    ).toBe(false);
  });

  it("schreibt das Ergebnis in den Speicher, nicht nur in den Cache", () => {
    seed(legacyBlob());
    reportGameResult({
      gameId: "ohrwurm",
      gameName: "Ohrwurm",
      scored: true,
      scoresByName: { Anna: 9, Ben: 3, José: 1 },
    });
    __resetPartySessionCache();
    const reloaded = getActivePartySession()!;
    expect(reloaded.players[0].totalScore).toBe(50);
    expect(reloaded.gameHistory).toHaveLength(2);
  });
});
