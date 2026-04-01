import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Achievement, GameStat, UserAchievement } from './types';

// See useGameStats.ts for the rationale behind this cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useAchievements() {
  const getAllAchievements = useCallback(async (): Promise<Achievement[]> => {
    const { data } = await db
      .from('achievements')
      .select('*')
      .order('points', { ascending: true });
    return (data as Achievement[]) ?? [];
  }, []);

  const getMyAchievements = useCallback(async (): Promise<UserAchievement[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await db
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', user.id);

    return (data as UserAchievement[]) ?? [];
  }, []);

  const checkAndUnlock = useCallback(
    async (gameId: string, stats: GameStat): Promise<Achievement[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch all achievements and user's unlocked ones
      const [allRes, unlockedRes] = await Promise.all([
        db.from('achievements').select('*'),
        db
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id),
      ]);

      const all = (allRes.data as Achievement[]) ?? [];
      const unlockedIds = new Set(
        ((unlockedRes.data ?? []) as Array<{ achievement_id: string }>).map(
          (u) => u.achievement_id,
        ),
      );

      // Filter to achievements that apply and haven't been unlocked
      const eligible = all.filter((a) => {
        if (unlockedIds.has(a.id)) return false;
        // Must match category: general achievements or game-specific
        if (a.category !== 'general' && a.category !== gameId) return false;
        return meetsRequirement(a, stats);
      });

      if (eligible.length === 0) return [];

      // Insert new unlocks
      const inserts = eligible.map((a) => ({
        user_id: user.id,
        achievement_id: a.id,
      }));

      await db.from('user_achievements').insert(inserts);

      return eligible;
    },
    [],
  );

  return { checkAndUnlock, getMyAchievements, getAllAchievements };
}

function meetsRequirement(achievement: Achievement, stats: GameStat): boolean {
  switch (achievement.requirement_type) {
    case 'games_played':
      return stats.games_played >= achievement.requirement_value;
    case 'games_won':
      return stats.games_won >= achievement.requirement_value;
    case 'score':
      return stats.total_score >= achievement.requirement_value;
    case 'streak':
      return stats.best_streak >= achievement.requirement_value;
    default:
      return false;
  }
}
