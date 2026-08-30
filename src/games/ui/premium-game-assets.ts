/**
 * Text-free GPT-Image artwork shared by the premium game setup cards.
 * Labels, descriptions and state intentionally stay in native React UI.
 */
const ROOT = '/images/games/premium-themes';
const PANTOMIME = '/images/games/pantomime';

export const CLOSE_ENOUGH_THEME_ASSETS = {
  mix: `${ROOT}/closeenough-mix-gpt.webp`,
  laender: `${ROOT}/world-gpt.webp`,
  bauwerke: `${ROOT}/architecture-gpt.webp`,
  natur: `${ROOT}/nature-gpt.webp`,
  tierwelt: `${PANTOMIME}/theme-animals-gpt.webp`,
  sport: `${PANTOMIME}/theme-sports-gpt.webp`,
  technik: `${ROOT}/technology-gpt.webp`,
  alltag: `${PANTOMIME}/theme-everyday-gpt.webp`,
} as const;

export const PIXELJAGD_THEME_ASSETS = {
  mix: `${ROOT}/pixeljagd-mix-gpt.webp`,
  tiere: `${PANTOMIME}/theme-animals-gpt.webp`,
  stars: `${ROOT}/celebrities-gpt.webp`,
  filme: `${PANTOMIME}/theme-movies-gpt.webp`,
  essen: `${ROOT}/food-gpt.webp`,
  orte: `${ROOT}/places-gpt.webp`,
  marken: `${ROOT}/brands-gpt.webp`,
} as const;

export const HEADUP_THEME_ASSETS: Record<string, string> = {
  celebrities: `${ROOT}/celebrities-gpt.webp`,
  animals: `${PANTOMIME}/theme-animals-gpt.webp`,
  movies: `${PANTOMIME}/theme-movies-gpt.webp`,
  food: `${ROOT}/food-gpt.webp`,
  sports: `${PANTOMIME}/theme-sports-gpt.webp`,
  professions: `${PANTOMIME}/theme-professions-gpt.webp`,
  actions: `${PANTOMIME}/theme-everyday-gpt.webp`,
  places: `${ROOT}/places-gpt.webp`,
  fairytale: `${PANTOMIME}/theme-fairytales-gpt.webp`,
  superheroes: `${ROOT}/superheroes-gpt.webp`,
  music: `${ROOT}/music-gpt.webp`,
  emojis: `${ROOT}/emojis-gpt.webp`,
  science: `${ROOT}/science-gpt.webp`,
  history: `${ROOT}/history-gpt.webp`,
};
export const STORY_MODE_ASSETS: Record<string, string> = {
  classic: `${ROOT}/story-mix-gpt.webp`,
  vorgabe: `${ROOT}/story-prompt-gpt.webp`,
  reimzeit: `${ROOT}/music-gpt.webp`,
};

export const FINDIT_MODE_ASSETS: Record<string, string> = {
  memory: `${ROOT}/findit-memory-gpt.webp`,
  speed: `${ROOT}/findit-speed-gpt.webp`,
  unterschiede: `${ROOT}/findit-differences-gpt.webp`,
  karte: `${ROOT}/world-gpt.webp`,
  streetview: `${ROOT}/places-gpt.webp`,
};

export const WORLD_FINDER_REGION_ASSETS: Record<string, string> = {
  welt: `${ROOT}/world-gpt.webp`,
  europa: `${ROOT}/architecture-gpt.webp`,
  asien: `${ROOT}/places-gpt.webp`,
  deutschland: `${ROOT}/nature-gpt.webp`,
};

export const WORDPRESS_MODE_ASSETS: Record<string, string> = {
  kategorie: `${ROOT}/wordpress-category-gpt.webp`,
  stroop: `${ROOT}/wordpress-stroop-gpt.webp`,
  verboten: `${ROOT}/wordpress-forbidden-gpt.webp`,
  'speed-rush': `${ROOT}/wordpress-speed-gpt.webp`,
};

export const BOMB_MODE_ASSETS: Record<string, string> = {
  kategorie: `${ROOT}/bomb-category-gpt.webp`,
  quiz: `${ROOT}/bomb-quiz-gpt.webp`,
  speed: `${ROOT}/bomb-speed-gpt.webp`,
  alle: `${ROOT}/bomb-all-gpt.webp`,
};

export const OHRWURM_MODE_ASSETS = {
  solo: `${ROOT}/ohrwurm-mix-gpt.webp`,
  group: `${ROOT}/ohrwurm-group-gpt.webp`,
  preview: `${ROOT}/music-gpt.webp`,
  spotify: `${ROOT}/ohrwurm-mix-gpt.webp`,
} as const;

export const OHRWURM_GENRE_ASSETS: Record<string, string> = {
  Pop: `${ROOT}/ohrwurm-mix-gpt.webp`,
  Rock: `${ROOT}/music-gpt.webp`,
  'Hip-Hop': `${ROOT}/ohrwurm-group-gpt.webp`,
  Electronic: `${ROOT}/technology-gpt.webp`,
  'R&B': `${ROOT}/celebrities-gpt.webp`,
  Eurodance: `${ROOT}/ohrwurm-group-gpt.webp`,
  Indie: `${ROOT}/story-prompt-gpt.webp`,
  Reggaeton: `${ROOT}/ohrwurm-group-gpt.webp`,
  Schlager: `${ROOT}/ohrwurm-mix-gpt.webp`,
  Soul: `${ROOT}/celebrities-gpt.webp`,
  Chanson: `${ROOT}/story-mix-gpt.webp`,
  Folk: `${ROOT}/nature-gpt.webp`,
};
