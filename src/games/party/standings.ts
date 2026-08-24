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
 * Wie viele Eintraege der Set-Liste sind FERTIG?
 *
 * Der Unterschied ist der Grund, warum der Sprung auf der Nacht-Route eine
 * Runde hinterherhinkte. `playlistIndex` zeigt auf das Spiel, das laeuft oder
 * als naechstes kommt — und er rueckt erst weiter, wenn im Zwischenspiel
 * "Weiter" gedrueckt wird. Der Zwischenstand geht aber VORHER auf die Leitung,
 * beim Verlassen des Spiels.
 *
 * Ergebnis vorher: Nach dem ersten Spiel sprang gar nichts (Start = Ziel),
 * danach sprang die Gruppe immer in das Feld, das sie gerade verlassen hatte.
 * Dieselbe Verschiebung fehlte auch dem Haken auf dem gespielten Feld, dem
 * Fortschrittsstreifen und der Roadmap — drei Anzeigen, ein Ursprung.
 */
export function finishedThroughFor(
  playlistIndex: number,
  playlistLength: number,
  phase: PartyNightState["phase"]
): number {
  // Zwischen zwei Spielen zaehlt das eben beendete mit. Nach dem letzten
  // Eintrag nicht weiter hochzaehlen: Die Gruppe bleibt am Ziel stehen,
  // statt ins Leere zu laufen.
  const finished = phase === "between" ? playlistIndex + 1 : playlistIndex;
  return Math.max(0, Math.min(finished, playlistLength));
}

/**
 * Vollstaendiger `partyNight`-Block fuer die laufende `tv-state`-Uebertragung.
 *
 * `phase` steuert die Szene auf dem Fernseher und wird vom AUFRUFER gesetzt:
 * die Spiel-Bruecke sendet `'ingame'`, der Uebergang zwischen zwei Spielen
 * `'between'`, die Schluss-Zeremonie `'finale'`. Frueher stand hier fest
 * `'ingame'` mit dem Hinweis, die Uebergaenge gehoerten "der Playlist-
 * Steuerung" — die gab es nie, und damit waren TVPartyStandings und
 * TVPartyFinale unerreichbar. Der Vorgabewert haelt die Spiel-Bruecke
 * unveraendert, ohne dass sie den Parameter kennen muss.
 */
export function buildPartyNightState(
  session: PartySession,
  nameFor: (gameId: string) => string,
  phase: PartyNightState["phase"] = "ingame"
): PartyNightState {
  const lastEntry =
    session.gameHistory.length > 0
      ? session.gameHistory[session.gameHistory.length - 1]
      : null;

  const finishedThrough = finishedThroughFor(
    session.playlistIndex,
    session.playlist.length,
    phase
  );

  return {
    active: session.isActive === true,
    // Die Haken folgen dem, was FERTIG ist — nicht dem Zeiger. Sonst traegt
    // das eben gespielte Feld zwischen zwei Spielen keinen Haken.
    playlist: derivePartyPlaylist(session.playlist, finishedThrough, nameFor),
    index: session.playlistIndex,
    finishedThrough,
    standings: derivePartyStandings(session.players, session.gameHistory),
    // `GameHistoryEntry` enthaelt alle Felder von `PartyGameResult` — die
    // Historie geht ohne Umformung auf die Leitung.
    history: session.gameHistory as PartyGameResult[],
    phase,
    ...(lastEntry ? { lastGameName: lastEntry.gameName } : {}),
  };
}
