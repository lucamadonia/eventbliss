export interface GameStat {
  id: string;
  user_id: string;
  game_id: string;
  games_played: number;
  games_won: number;
  total_score: number;
  best_score: number;
  total_time_played: number;
  streak: number;
  best_streak: number;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  game_id: string;
  total_score: number;
  games_won: number;
  best_score: number;
  best_streak: number;
  rank: number;
}

export const RARITY_COLORS: Record<string, string> = {
  common: '#8ff5ff',
  rare: '#df8eff',
  epic: '#ff6b98',
  legendary: '#ffd700',
};

export const RARITY_LABELS: Record<string, string> = {
  common: 'Gewoehnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendaer',
};

export const GAME_NAMES: Record<string, string> = {
  bomb: 'Tickende Bombe',
  headup: 'Stirnraten',
  taboo: 'Wortverbot',
  category: 'Zeit-Kategorie',
  hochstapler: 'Hochstapler',
  'drueck-das-wort': 'Drueck das Wort',
  'wo-ist-was': 'Wo ist was?',
  splitquiz: 'Blitz-Quiz',
  sharedquiz: 'Gemeinsames Quiz',
  quickdraw: 'Schnellzeichner',
  truthdare: 'Wahrheit oder Pflicht',
  thisorthat: 'Dies oder Das',
  whoami: 'Wer bin ich?',
  emojiguess: 'Emoji-Raten',
  fakeorfact: 'Fake oder Fakt',
  storybuilder: 'Geschichtenbauer',
  bottlespin: 'Flaschendrehen',
};
