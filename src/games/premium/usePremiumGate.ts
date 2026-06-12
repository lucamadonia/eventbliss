import { useMemo, useCallback } from 'react';
import { usePremium } from '@/hooks/usePremium';
import { GAME_TIERS, getFreePlaysUsed, recordFreePlay, type GameTier } from './gameConfig';

export interface PremiumGateResult {
  isPremium: boolean;
  loading: boolean;
  isLocked: boolean;
  freePlaysLeft: number;
  freePlaysUsed: number;
  freeRoundsLimit: number;
  recordPlay: () => void;
  config: GameTier | undefined;
}

export function usePremiumGate(gameId: string, roomHasPremium?: boolean): PremiumGateResult {
  const { isPremium, loading } = usePremium();

  const config = useMemo(
    () => GAME_TIERS.find((g) => g.gameId === gameId),
    [gameId],
  );

  // If anyone in the room has Premium, treat as premium for all players
  const effectivePremium = isPremium || roomHasPremium === true;

  const freeRoundsLimit = config?.freeRoundsLimit ?? 2;
  const freePlaysUsed = getFreePlaysUsed(gameId);
  const freePlaysLeft = Math.max(0, freeRoundsLimit - freePlaysUsed);

  const isLocked =
    config?.tier === 'premium' && !effectivePremium && freePlaysLeft <= 0;

  const recordPlay = useCallback(() => {
    // recordFreePlay no-ops for non-premium games and effective-premium users
    recordFreePlay(gameId, effectivePremium);
  }, [gameId, effectivePremium]);

  return {
    isPremium,
    loading,
    isLocked,
    freePlaysLeft,
    freePlaysUsed,
    freeRoundsLimit,
    recordPlay,
    config,
  };
}
