import { useMemo, useCallback } from 'react';
import { usePremium } from '@/hooks/usePremium';
import { GAME_TIERS, type GameTier } from './gameConfig';

function getTodayKey(gameId: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `free_plays_${gameId}_${date}`;
}

function getFreePlays(gameId: string): number {
  try {
    return Number(localStorage.getItem(getTodayKey(gameId)) || '0');
  } catch {
    return 0;
  }
}

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
  const freePlaysUsed = getFreePlays(gameId);
  const freePlaysLeft = Math.max(0, freeRoundsLimit - freePlaysUsed);

  const isLocked =
    config?.tier === 'premium' && !effectivePremium && freePlaysLeft <= 0;

  const recordPlay = useCallback(() => {
    if (config?.tier !== 'premium' || effectivePremium) return;
    try {
      const key = getTodayKey(gameId);
      const current = Number(localStorage.getItem(key) || '0');
      localStorage.setItem(key, String(current + 1));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [gameId, config?.tier, effectivePremium]);

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
