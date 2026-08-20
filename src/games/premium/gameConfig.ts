export interface GameTier {
  gameId: string;
  tier: 'free' | 'premium';
  freeRoundsLimit?: number;
  premiumFeatures?: string[];
}

export const GAME_TIERS: GameTier[] = [
  // FREE GAMES (always playable)
  { gameId: 'bomb', tier: 'free' },
  { gameId: 'category', tier: 'free' },
  { gameId: 'headup', tier: 'free' },
  { gameId: 'taboo', tier: 'free' },
  { gameId: 'this-or-that', tier: 'free' },
  { gameId: 'ohrwurm', tier: 'free' },
  // Bewusst frei: ohne selbst gepflegte Bilder ist ohnehin nichts spielbar,
  // eine Paywall auf einem leeren Spiel wäre sinnlos.
  { gameId: 'pixeljagd', tier: 'free' },
  { gameId: 'closeenough', tier: 'free' },

  // PREMIUM GAMES (locked for free users after 2 rounds per day)
  { gameId: 'hochstapler', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'split-quiz', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'geteilt-gequizzt', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'schnellzeichner', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'wo-ist-was', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'flaschendrehen', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'wahrheit-pflicht', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'wer-bin-ich', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'emoji-raten', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'fake-or-fact', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'story-builder', tier: 'premium', freeRoundsLimit: 2 },
  { gameId: 'drueck-das-wort', tier: 'premium', freeRoundsLimit: 2 },
];

export const PREMIUM_FEATURES = [
  'Alle 17+ Spiele unbegrenzt',
  'Online-Multiplayer (bis 30 Spieler)',
  'Eigene Fragen & Kategorien erstellen',
  'Keine Werbung',
  'Erweiterte Fragenpools (5000+)',
  'Exklusive Themen-Packs',
  'Statistiken & Achievements',
];

export function getGameTier(gameId: string): GameTier | undefined {
  return GAME_TIERS.find((g) => g.gameId === gameId);
}

export function isGamePremium(gameId: string): boolean {
  const tier = getGameTier(gameId);
  return tier?.tier === 'premium';
}

// ---- Daily free-round counter (localStorage, date-scoped key) ----
// Single source of truth used by usePremiumGate AND GamesHub.

function freePlaysKey(gameId: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `free_plays_${gameId}_${date}`;
}

/** Free plays already used today for this game. 0 if unavailable. */
export function getFreePlaysUsed(gameId: string): number {
  try {
    return Number(localStorage.getItem(freePlaysKey(gameId)) || '0');
  } catch {
    return 0;
  }
}

/** Free plays remaining today for this game (limit only applies to premium games). */
export function getFreePlaysLeft(gameId: string): number {
  const limit = getGameTier(gameId)?.freeRoundsLimit ?? 2;
  return Math.max(0, limit - getFreePlaysUsed(gameId));
}

/**
 * Record one free play for today. No-ops for non-premium games and for
 * users with (effective) premium access — those never consume free rounds.
 */
export function recordFreePlay(gameId: string, effectivePremium = false): void {
  if (effectivePremium) return;
  if (getGameTier(gameId)?.tier !== 'premium') return;
  try {
    const key = freePlaysKey(gameId);
    const current = Number(localStorage.getItem(key) || '0');
    localStorage.setItem(key, String(current + 1));
  } catch {
    // localStorage unavailable — silently ignore
  }
}
