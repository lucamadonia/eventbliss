import { useState, useCallback } from "react";
import type { Player } from "./GameState";

export interface ScoreEntry {
  playerId: string;
  playerName: string;
  points: number;
  streak: number;
  roundScores: number[];
}

export function useScoreTracker(players: Player[]) {
  const [scores, setScores] = useState<Map<string, ScoreEntry>>(() => {
    const map = new Map<string, ScoreEntry>();
    players.forEach((p) => {
      map.set(p.id, {
        playerId: p.id,
        playerName: p.name,
        points: 0,
        streak: 0,
        roundScores: [],
      });
    });
    return map;
  });

  const addPoints = useCallback((playerId: string, points: number) => {
    setScores((prev) => {
      const next = new Map(prev);
      const entry = next.get(playerId);
      if (!entry) return prev;
      next.set(playerId, {
        ...entry,
        points: entry.points + points,
        streak: points > 0 ? entry.streak + 1 : 0,
        roundScores: [...entry.roundScores, points],
      });
      return next;
    });
  }, []);

  const getLeaderboard = useCallback((): ScoreEntry[] => {
    return Array.from(scores.values()).sort((a, b) => b.points - a.points);
  }, [scores]);

  const resetScores = useCallback(() => {
    setScores((prev) => {
      const next = new Map<string, ScoreEntry>();
      prev.forEach((entry, id) => {
        next.set(id, { ...entry, points: 0, streak: 0, roundScores: [] });
      });
      return next;
    });
  }, []);

  return { scores, addPoints, getLeaderboard, resetScores };
}
