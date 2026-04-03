import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GameStat, LeaderboardEntry } from './types';

// The game_stats, achievements, user_achievements, and leaderboard tables
// are created by migration 20260401000000_game_social.sql.
// Until `supabase gen types` is re-run, we cast through `any` for these tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useGameStats() {
  const recordGamePlayed = useCallback(
    async (gameId: string, score: number, won: boolean, timePlayed?: number) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

      // Fetch current stats for this game
      const { data: existing } = await db
        .from('game_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .maybeSingle();

      const prev = existing as GameStat | null;
      const currentStreak = won ? (prev?.streak ?? 0) + 1 : 0;
      const bestStreak = Math.max(currentStreak, prev?.best_streak ?? 0);

      const stats = {
        user_id: user.id,
        game_id: gameId,
        games_played: (prev?.games_played ?? 0) + 1,
        games_won: (prev?.games_won ?? 0) + (won ? 1 : 0),
        total_score: (prev?.total_score ?? 0) + score,
        best_score: Math.max(score, prev?.best_score ?? 0),
        total_time_played: (prev?.total_time_played ?? 0) + (timePlayed ?? 0),
        streak: currentStreak,
        best_streak: bestStreak,
        last_played_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db
        .from('game_stats')
        .upsert(stats, { onConflict: 'user_id,game_id' });
      } catch (e) { console.warn('Failed to record game stats:', e); }
    },
    [],
  );

  const getMyStats = useCallback(
    async (gameId?: string): Promise<GameStat[]> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        let query = db.from('game_stats').select('*').eq('user_id', user.id);
        if (gameId) query = query.eq('game_id', gameId);
        const { data } = await query;
        return (data as GameStat[]) ?? [];
      } catch { return []; }
    },
    [],
  );

  const getLeaderboard = useCallback(
    async (gameId: string, limit = 50): Promise<LeaderboardEntry[]> => {
      const { data } = await db
        .from('leaderboard')
        .select('*')
        .eq('game_id', gameId)
        .order('rank', { ascending: true })
        .limit(limit);

      return (data as LeaderboardEntry[]) ?? [];
    },
    [],
  );

  return { recordGamePlayed, getMyStats, getLeaderboard };
}
