import { AchievementToast } from './AchievementToast';
import type { Achievement } from './types';

interface GameEndOverlayProps {
  achievements: Achievement[];
  onDismiss?: () => void;
}

/**
 * Renders achievement toasts on top of the game-over screen.
 * Mount this inside any game's result/gameOver phase when
 * `newAchievements.length > 0`.
 */
export function GameEndOverlay({ achievements, onDismiss }: GameEndOverlayProps) {
  if (achievements.length === 0) return null;

  return <AchievementToast achievements={achievements} onDismiss={onDismiss} />;
}
