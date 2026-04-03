import { useState, useCallback, useMemo } from 'react';

interface GameResult { gameId: string; gameName: string; score: number; won: boolean; }

export interface PartyScore {
  playerId: string;
  playerName: string;
  playerColor: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  gameScores: GameResult[];
}

export function usePartySession() {
  const [scores, setScores] = useState<PartyScore[]>([]);
  const [isActive, setIsActive] = useState(false);

  const startSession = useCallback((players: { id: string; name: string; color: string }[]) => {
    setScores(players.map(p => ({
      playerId: p.id, playerName: p.name, playerColor: p.color,
      totalScore: 0, gamesPlayed: 0, gamesWon: 0, gameScores: [],
    })));
    setIsActive(true);
  }, []);

  const recordGameResult = useCallback((gameId: string, gameName: string, results: { playerId: string; score: number; won: boolean }[]) => {
    setScores(prev => prev.map(p => {
      const result = results.find(r => r.playerId === p.playerId);
      if (!result) return p;
      return {
        ...p,
        totalScore: p.totalScore + result.score,
        gamesPlayed: p.gamesPlayed + 1,
        gamesWon: p.gamesWon + (result.won ? 1 : 0),
        gameScores: [...p.gameScores, { gameId, gameName, score: result.score, won: result.won }],
      };
    }));
  }, []);

  const endSession = useCallback(() => setIsActive(false), []);
  const resetSession = useCallback(() => { setScores([]); setIsActive(false); }, []);

  const leaderboard = useMemo(() => [...scores].sort((a, b) => b.totalScore - a.totalScore), [scores]);
  const totalGames = scores.length > 0 ? scores[0].gamesPlayed : 0;

  return { scores, leaderboard, isActive, totalGames, startSession, recordGameResult, endSession, resetSession };
}
