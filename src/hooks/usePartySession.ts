/**
 * usePartySession — persistent party session state manager.
 * Wraps multiple games in a single evening, tracks players + scores,
 * and persists to localStorage so sessions survive page reloads.
 */
import { useState, useCallback, useMemo } from "react";
const uuidv4 = () => crypto.randomUUID();

// ── Types ──────────────────────────────────────────────────────────

export interface PartyPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
}

export interface GameHistoryEntry {
  gameId: string;
  gameName: string;
  winnerId: string;
  winnerName: string;
  scores: Record<string, number>;
  playedAt: number;
}

export interface PartySession {
  id: string;
  players: PartyPlayer[];
  tvCode: string;
  currentGameId: string | null;
  gameHistory: GameHistoryEntry[];
  isActive: boolean;
  createdAt: number;
}

export interface GameEndResult {
  gameId: string;
  gameName: string;
  /** Map of player id -> score earned this game */
  scores: Record<string, number>;
}

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
}

// ── Constants ──────────────────────────────────────────────────────

const STORAGE_KEY = "eventbliss_party_session";

export const PLAYER_COLORS = [
  "#df8eff", "#ff6b98", "#8ff5ff", "#f9ca24", "#00b894",
  "#6c5ce7", "#fd79a8", "#e17055", "#0984e3", "#a29bfe",
  "#ff7675", "#55efc4",
] as const;

const PLAYER_AVATARS = [
  "🎉", "🔥", "⭐", "🎯", "🚀", "💎", "🌟", "🎪",
  "🎲", "🎸", "🎨", "🦄",
];

function generateTvCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Persistence ────────────────────────────────────────────────────

function loadSession(): PartySession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as PartySession;
    if (!session.isActive) return null;
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: PartySession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// ── Hook ───────────────────────────────────────────────────────────

export function usePartySession(): PartySessionAPI {
  const [session, setSession] = useState<PartySession | null>(loadSession);

  const persist = useCallback((next: PartySession | null) => {
    setSession(next);
    saveSession(next);
  }, []);

  const startSession = useCallback(() => {
    const newSession: PartySession = {
      id: uuidv4(),
      players: [],
      tvCode: generateTvCode(),
      currentGameId: null,
      gameHistory: [],
      isActive: true,
      createdAt: Date.now(),
    };
    persist(newSession);
  }, [persist]);

  const addPlayer = useCallback((name: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.players.length >= 12) return prev;
      const index = prev.players.length;
      const newPlayer: PartyPlayer = {
        id: uuidv4(),
        name,
        color: PLAYER_COLORS[index % PLAYER_COLORS.length],
        avatar: PLAYER_AVATARS[index % PLAYER_AVATARS.length],
        totalScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
      };
      const next = { ...prev, players: [...prev.players, newPlayer] };
      saveSession(next);
      return next;
    });
  }, []);

  const removePlayer = useCallback((id: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.players.length <= 2) return prev;
      const next = { ...prev, players: prev.players.filter((p) => p.id !== id) };
      saveSession(next);
      return next;
    });
  }, []);

  const updatePlayer = useCallback(
    (id: string, updates: Partial<Pick<PartyPlayer, "name" | "avatar">>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          players: prev.players.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        };
        saveSession(next);
        return next;
      });
    },
    []
  );

  const startGame = useCallback((gameId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, currentGameId: gameId };
      saveSession(next);
      return next;
    });
  }, []);

  const endGame = useCallback((result: GameEndResult) => {
    setSession((prev) => {
      if (!prev) return prev;

      // Determine winner (highest score)
      let winnerId = "";
      let winnerName = "";
      let highScore = -Infinity;
      for (const player of prev.players) {
        const score = result.scores[player.id] ?? 0;
        if (score > highScore) {
          highScore = score;
          winnerId = player.id;
          winnerName = player.name;
        }
      }

      const historyEntry: GameHistoryEntry = {
        gameId: result.gameId,
        gameName: result.gameName,
        winnerId,
        winnerName,
        scores: result.scores,
        playedAt: Date.now(),
      };

      const updatedPlayers = prev.players.map((p) => {
        const gameScore = result.scores[p.id] ?? 0;
        return {
          ...p,
          totalScore: p.totalScore + gameScore,
          gamesPlayed: p.gamesPlayed + 1,
          gamesWon: p.id === winnerId ? p.gamesWon + 1 : p.gamesWon,
        };
      });

      const next: PartySession = {
        ...prev,
        players: updatedPlayers,
        currentGameId: null,
        gameHistory: [...prev.gameHistory, historyEntry],
      };
      saveSession(next);
      return next;
    });
  }, []);

  const getOverallLeaderboard = useCallback((): PartyPlayer[] => {
    if (!session) return [];
    return [...session.players].sort((a, b) => b.totalScore - a.totalScore);
  }, [session]);

  const resetSession = useCallback(() => {
    persist(null);
  }, [persist]);

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
    }),
    [session, addPlayer, removePlayer, updatePlayer, startSession, startGame, endGame, getOverallLeaderboard, resetSession]
  );
}

// ── Imperative helpers (for use outside React components) ──────────

export function getActivePartySession(): PartySession | null {
  return loadSession();
}

export function isPartySessionActive(): boolean {
  return loadSession() !== null;
}
