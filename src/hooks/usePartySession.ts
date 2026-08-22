/**
 * usePartySession — persistente Party-Sitzung ueber viele Spiele hinweg.
 *
 * Wichtigste Regel: In die Gesamttabelle fliessen PLATZIERUNGSPUNKTE, nie die
 * Rohpunkte der Spiele (Begruendung in `@/games/party/scoring`). Ein Spiel ohne
 * eigene Wertung ("Pausenspiel") kommt in die Historie und zaehlt als gespielte
 * Runde, laesst die Tabelle aber unangetastet.
 *
 * Der Zustand liegt bewusst in einem Modul-Store statt nur in `useState`:
 * Spiele melden ihr Ergebnis ueber {@link reportGameResult} aus einem Hook
 * heraus, der keinen Zugriff auf den React-Zustand dieser Datei hat. Ueber den
 * Store sehen alle eingehaengten Komponenten dieselbe Sitzung sofort.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";

import { placementPoints } from "@/games/party/scoring";
import { normalizePlayerName } from "@/games/party/extractResult";
import {
  createPartyPlayer,
  createPartySession,
  migratePartySession,
  MAX_PARTY_PLAYERS,
  PLAYER_AVATARS,
  PLAYER_COLORS,
  PARTY_SCHEMA_VERSION,
  type GameEndResult,
  type GameHistoryEntry,
  type PartyPlayer,
  type PartySession,
} from "@/games/party/session-schema";

export { PLAYER_COLORS, PLAYER_AVATARS, PARTY_SCHEMA_VERSION };
export type { GameEndResult, GameHistoryEntry, PartyPlayer, PartySession };

const uuidv4 = () => crypto.randomUUID();

const STORAGE_KEY = "eventbliss_party_session";

export interface PartySessionAPI {
  session: PartySession | null;
  isPartyActive: boolean;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, updates: Partial<Pick<PartyPlayer, "name" | "avatar">>) => void;
  startSession: () => void;
  startGame: (gameId: string) => void;
  endGame: (result: GameEndResult) => void;
  getOverallLeaderboard: () => PartyPlayer[];
  resetSession: () => void;
  tvCode: string | null;
  /** Setzt die geplante Spielreihenfolge und startet sie beim ersten Eintrag. */
  setPlaylist: (gameIds: string[]) => void;
  /** Rueckt einen Eintrag weiter; gibt das naechste Spiel oder `null` zurueck. */
  advancePlaylist: () => string | null;
  /** Aktuell faelliges Playlist-Spiel oder `null`. */
  getCurrentPlaylistGame: () => string | null;
  /** Beendet die Playlist, ohne die Sitzung zu beenden. */
  endPlaylist: () => void;
}

// ── Modul-Store ────────────────────────────────────────────────────
// `undefined` = noch nicht aus dem Speicher gelesen. Erst beim ersten Zugriff
// lesen, damit Prerender/SSR ohne localStorage nicht beim Import scheitert.

let cache: PartySession | null | undefined;
const listeners = new Set<() => void>();

function readStorage(): PartySession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migratePartySession(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeStorage(session: PartySession | null): void {
  try {
    if (!session) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Speicher voll oder nicht verfuegbar — die Sitzung laeuft im RAM weiter.
  }
}

function readSession(): PartySession | null {
  if (cache === undefined) cache = readStorage();
  return cache;
}

function commit(next: PartySession | null): void {
  cache = next;
  writeStorage(next);
  for (const listener of listeners) listener();
}

/** Liest, veraendert und speichert die Sitzung in einem Schritt. */
function mutate(fn: (session: PartySession) => PartySession | null): PartySession | null {
  const current = readSession();
  if (!current) return null;
  const next = fn(current);
  if (next === current) return current;
  commit(next);
  return next;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Prerender/SSR hat keine Sitzung — und darf keine erfinden. */
const serverSnapshot = (): PartySession | null => null;

/**
 * Nur fuer Tests: verwirft den Cache, damit der naechste Zugriff wieder aus
 * dem (frisch gesetzten) localStorage liest.
 */
export function __resetPartySessionCache(): void {
  cache = undefined;
  for (const listener of listeners) listener();
}

// ── Wertung ────────────────────────────────────────────────────────

/**
 * Verrechnet ein Spielergebnis mit der Sitzung.
 *
 * Teilnehmer sind genau die Spieler, die in `result.scores` vorkommen. Wer
 * nicht mitgespielt hat, bekommt weder Punkte noch eine gezaehlte Runde —
 * sonst wuerde Danebenstehen mit dem letzten Platz belohnt.
 */
function applyGameEnd(session: PartySession, result: GameEndResult): PartySession {
  const scored = result.scored !== false;
  const participants = session.players.filter((p) => result.scores[p.id] !== undefined);

  const rawByPlayerId: Record<string, number> = {};
  for (const player of participants) rawByPlayerId[player.id] = result.scores[player.id] ?? 0;

  const points = scored && participants.length > 0 ? placementPoints(rawByPlayerId) : {};

  let winnerId = "";
  let winnerName = "";
  if (scored) {
    let best = -Infinity;
    for (const player of participants) {
      const raw = rawByPlayerId[player.id];
      if (raw > best) {
        best = raw;
        winnerId = player.id;
        winnerName = player.name;
      }
    }
  }

  const historyEntry: GameHistoryEntry = {
    gameId: result.gameId,
    gameName: result.gameName,
    winnerId,
    winnerName,
    scores: rawByPlayerId,
    points,
    scored,
    playedAt: Date.now(),
  };

  const players = session.players.map((player) => {
    if (rawByPlayerId[player.id] === undefined) return player;
    return {
      ...player,
      totalScore: player.totalScore + (points[player.id] ?? 0),
      gamesPlayed: player.gamesPlayed + 1,
      gamesWon: scored && player.id === winnerId ? player.gamesWon + 1 : player.gamesWon,
    };
  });

  return {
    ...session,
    players,
    currentGameId: null,
    gameHistory: [...session.gameHistory, historyEntry],
  };
}

// ── Playlist ───────────────────────────────────────────────────────

function currentPlaylistGame(session: PartySession | null): string | null {
  if (!session || !session.playlistActive) return null;
  return session.playlist[session.playlistIndex] ?? null;
}

function withPlaylist(session: PartySession, gameIds: string[]): PartySession {
  const playlist = gameIds.filter((id) => typeof id === "string" && id.length > 0);
  return { ...session, playlist, playlistIndex: 0, playlistActive: playlist.length > 0 };
}

function withNextPlaylistEntry(session: PartySession): PartySession {
  if (!session.playlistActive) return session;
  const playlistIndex = session.playlistIndex + 1;
  const playlistActive = playlistIndex < session.playlist.length;
  return { ...session, playlistIndex: Math.min(playlistIndex, session.playlist.length), playlistActive };
}

// ── Hook ───────────────────────────────────────────────────────────

export function usePartySession(): PartySessionAPI {
  const session = useSyncExternalStore(subscribe, readSession, serverSnapshot);

  const startSession = useCallback(() => {
    commit(createPartySession(uuidv4()));
  }, []);

  const addPlayer = useCallback((name: string) => {
    mutate((prev) => {
      if (prev.players.length >= MAX_PARTY_PLAYERS) return prev;
      const player = createPartyPlayer(uuidv4(), name, prev.players.length);
      return { ...prev, players: [...prev.players, player] };
    });
  }, []);

  const removePlayer = useCallback((id: string) => {
    mutate((prev) => {
      if (prev.players.length <= 2) return prev;
      return { ...prev, players: prev.players.filter((p) => p.id !== id) };
    });
  }, []);

  const updatePlayer = useCallback(
    (id: string, updates: Partial<Pick<PartyPlayer, "name" | "avatar">>) => {
      mutate((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    },
    []
  );

  const startGame = useCallback((gameId: string) => {
    mutate((prev) => ({ ...prev, currentGameId: gameId }));
  }, []);

  const endGame = useCallback((result: GameEndResult) => {
    mutate((prev) => applyGameEnd(prev, result));
  }, []);

  const getOverallLeaderboard = useCallback((): PartyPlayer[] => {
    if (!session) return [];
    return [...session.players].sort((a, b) => b.totalScore - a.totalScore);
  }, [session]);

  const resetSession = useCallback(() => {
    commit(null);
  }, []);

  const setPlaylist = useCallback((gameIds: string[]) => {
    mutate((prev) => withPlaylist(prev, gameIds));
  }, []);

  const advancePlaylist = useCallback((): string | null => {
    const next = mutate(withNextPlaylistEntry);
    return currentPlaylistGame(next);
  }, []);

  const getCurrentPlaylistGame = useCallback(
    (): string | null => currentPlaylistGame(session),
    [session]
  );

  const endPlaylist = useCallback(() => {
    mutate((prev) => ({ ...prev, playlist: [], playlistIndex: 0, playlistActive: false }));
  }, []);

  return useMemo(
    () => ({
      session,
      isPartyActive: session?.isActive ?? false,
      addPlayer,
      removePlayer,
      updatePlayer,
      startSession,
      startGame,
      endGame,
      getOverallLeaderboard,
      resetSession,
      tvCode: session?.tvCode ?? null,
      setPlaylist,
      advancePlaylist,
      getCurrentPlaylistGame,
      endPlaylist,
    }),
    [
      session, addPlayer, removePlayer, updatePlayer, startSession, startGame, endGame,
      getOverallLeaderboard, resetSession, setPlaylist, advancePlaylist,
      getCurrentPlaylistGame, endPlaylist,
    ]
  );
}

// ── Imperative Helfer (ausserhalb von React) ───────────────────────

export function getActivePartySession(): PartySession | null {
  return readSession();
}

export function isPartySessionActive(): boolean {
  return readSession() !== null;
}

/**
 * Abonniert Aenderungen der Sitzung — gedacht fuer `useSyncExternalStore` in
 * Hooks, die die Sitzung lesen, ohne die volle Hook-API zu brauchen (die
 * TV-Bruecke). Zusammen mit {@link getActivePartySession} als Snapshot: Die
 * zurueckgegebene Sitzung ist referenziell stabil, solange sich nichts aendert.
 */
export function subscribePartySession(listener: () => void): () => void {
  return subscribe(listener);
}

/** Was ein Spiel nach Spielende meldet — Spiele kennen nur Namen, keine IDs. */
export interface PartyGameReport {
  /** Registry-Kennung des Spiels (`playable-games.ts`). */
  gameId: string;
  /** Angezeigter Spielname fuer die Historie. */
  gameName: string;
  /** false = Pausenspiel ohne Wertung. */
  scored: boolean;
  /** Rohpunkte nach Spielername, hoeher ist besser. */
  scoresByName: Record<string, number>;
}

/**
 * Traegt ein Spielergebnis in die laufende Party ein.
 *
 * Namen werden normalisiert (Leerzeichen, Gross-/Kleinschreibung, Akzente) auf
 * die Party-Spieler abgebildet. Nicht zuordenbare Namen werden ignoriert.
 * Passt KEIN einziger Name, wird das Spiel als Pausenspiel verbucht statt
 * allen Party-Spielern 0 Rohpunkte — und damit allen denselben ersten Platz —
 * zu geben.
 *
 * @returns true, wenn eine Sitzung lief und der Eintrag geschrieben wurde.
 */
export function reportGameResult(report: PartyGameReport): boolean {
  const session = readSession();
  if (!session) return false;

  const idByName = new Map<string, string>();
  for (const player of session.players) idByName.set(normalizePlayerName(player.name), player.id);

  const scores: Record<string, number> = {};
  let matched = 0;
  for (const name of Object.keys(report.scoresByName)) {
    const id = idByName.get(normalizePlayerName(name));
    if (!id || scores[id] !== undefined) continue;
    scores[id] = report.scoresByName[name];
    matched++;
  }

  commit(
    applyGameEnd(session, {
      gameId: report.gameId,
      gameName: report.gameName,
      scores,
      scored: report.scored && matched > 0,
    })
  );
  return true;
}
