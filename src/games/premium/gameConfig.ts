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
