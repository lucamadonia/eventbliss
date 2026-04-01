import { useCallback, useState } from 'react';
import { useGameStats } from './useGameStats';
import { useAchievements } from './useAchievements';
import type { Achievement } from './types';

export function useGameEnd() {
  const { recordGamePlayed, getMyStats } = useGameStats();
  const { checkAndUnlock } = useAchievements();
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const recordEnd = useCallback(
    async (gameId: string, score: number, won: boolean) => {
      try {
        await recordGamePlayed(gameId, score, won);
        const stats = await getMyStats(gameId);
        if (stats.length > 0) {
          const unlocked = await checkAndUnlock(gameId, stats[0]);
          if (unlocked.length > 0) {
            setNewAchievements(unlocked);
          }
        }
      } catch (e) {
        // Silently fail — don't break game if stats can't be recorded
        console.warn('Failed to record game stats:', e);
      }
    },
    [recordGamePlayed, getMyStats, checkAndUnlock],
  );

  const clearAchievements = useCallback(() => setNewAchievements([]), []);

  return { recordEnd, newAchievements, clearAchievements };
}
