/**
 * standings.ts — leitet aus der Party-Sitzung die Tabelle fuer den Fernseher ab.
 *
 * Der Fernseher soll jederzeit "wo stehe ich heute Abend?" beantworten. Dafuer
 * braucht er mehr als die reine Punktzahl: den Platz, den Platz VOR dem letzten
 * Spiel (fuer den Pfeil nach oben/unten) und die Siegesserie.
 *
 * Genau diese drei Werte sind die klassischen Ausrutscher — ein Off-by-one im
 * Rueckblick zeigt dem ganzen Raum den falschen Aufsteiger. Deshalb liegt die
 * Ableitung hier als reine Funktion und nicht in der Bruecke.
 *
 * Die Wertform stammt aus dem eingefrorenen Vertrag `@/games/tv/party-types`.
 */
import type {
  PartyGameResult,
  PartyNightState,
  PartyPlaylistItem,
  PartyStanding,
} from "@/games/tv/party-types";

import { rankScores } from "./scoring";
import type { GameHistoryEntry, PartyPlayer, PartySession } from "./session-schema";

/** Platz je Schluessel — Gleichstand teilt sich den Platz (1, 1, 3, …). */
function ranksFor(points: Record<string, number>): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const entry of rankScores(points)) ranks.set(entry.key, entry.rank);
  return ranks;
}

/**
 * Siegesserie eines Spielers: aufeinanderfolgende Siege, rueckwaerts gezaehlt.
 *
 * Pausenspiele (`scored: false`) haben keinen Sieger und werden uebersprungen —
 * sie verlaengern die Serie nicht, beenden sie aber auch nicht. Sonst wuerde
 * eine Runde HEADUP jede Serie im Raum ausloeschen.
 */
export function winStreakFor(playerId: string, gameHistory: GameHistoryEntry[]): number {
  let streak = 0;
  for (let i = gameHistory.length - 1; i >= 0; i--) {
    const entry = gameHistory[i];
    if (!entry.scored) continue;
    if (entry.winnerId !== playerId) break;
    streak++;
  }
  return streak;
}

/**
 * Tabelle fuer den Fernseher, sortiert nach Platz.
 *
 * `points` ist der kumulierte Platzierungspunktestand (`PartyPlayer.totalScore`).
 * `prevRank` ist der Platz VOR dem letzten Eintrag der Historie: dafuer werden
 * dessen Punkte vom Gesamtstand abgezogen und neu sortiert. Ohne Historie gibt
 * es keinen Vorher-Zustand — dann ist `prevRank` fuer alle `null`.
 */
export function derivePartyStandings(
  players: PartyPlayer[],
  gameHistory: GameHistoryEntry[]
): PartyStanding[] {
  const current: Record<string, number> = {};
  for (const player of players) current[player.id] = player.totalScore;
  const currentRanks = ranksFor(current);

  const lastEntry = gameHistory.length > 0 ? gameHistory[gameHistory.length - 1] : null;
  let previousRanks: Map<string, number> | null = null;
  if (lastEntry) {
    const before: Record<string, number> = {};
    for (const player of players) {
      before[player.id] = player.totalScore - (lastEntry.points[player.id] ?? 0);
    }
    previousRanks = ranksFor(before);
  }

  const standings: PartyStanding[] = players.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    avatar: player.avatar,
    points: player.totalScore,
    rank: currentRanks.get(player.id) ?? players.length,
    prevRank: previousRanks ? previousRanks.get(player.id) ?? null : null,
    gamesWon: player.gamesWon,
    streak: winStreakFor(player.id, gameHistory),
  }));

  standings.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return standings;
}

/**
 * Playlist fuer den Fernseher. `done` gilt fuer alles VOR dem laufenden Eintrag;
 * das Spiel an `playlistIndex` laeuft gerade und ist damit noch nicht erledigt.
 *
 * @param nameFor liefert den bereits uebersetzten Spielnamen — der Fernseher
 *                loest niemals selbst Kennungen in Anzeigenamen auf.
 */
export function derivePartyPlaylist(
  playlist: string[],
  playlistIndex: number,
  nameFor: (gameId: string) => string
): PartyPlaylistItem[] {
  return playlist.map((gameId, index) => ({
    gameId,
    name: nameFor(gameId),
    done: index < playlistIndex,
  }));
}

/**
 * Vollstaendiger `partyNight`-Block fuer die laufende `tv-state`-Uebertragung.
 *
 * Immer `phase: 'ingame'` — die Uebergaenge nach `'between'` und `'finale'`
 * gehoeren der Playlist-Steuerung, nicht der Spiel-Bruecke.
 */
export function buildPartyNightState(
  session: PartySession,
  nameFor: (gameId: string) => string
): PartyNightState {
  const lastEntry =
    session.gameHistory.length > 0
      ? session.gameHistory[session.gameHistory.length - 1]
      : null;

  return {
    active: session.isActive === true,
    playlist: derivePartyPlaylist(session.playlist, session.playlistIndex, nameFor),
    index: session.playlistIndex,
    standings: derivePartyStandings(session.players, session.gameHistory),
    // `GameHistoryEntry` enthaelt alle Felder von `PartyGameResult` — die
    // Historie geht ohne Umformung auf die Leitung.
    history: session.gameHistory as PartyGameResult[],
    phase: "ingame",
    ...(lastEntry ? { lastGameName: lastEntry.gameName } : {}),
  };
}
