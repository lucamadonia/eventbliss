import type { PantomimeCategoryId } from '../content/pantomime-words';

const THEME_ROOT = '/images/games/pantomime';

/**
 * Textfreie GPT-Image-Buehnenmotive fuer die Themenwahl.
 *
 * Die Bezeichnungen bleiben absichtlich in der nativen UI: So funktioniert
 * dieselbe Bildserie in allen Sprachen und ein Bildfehler kann nie eine falsche
 * Uebersetzung ins Spiel schmuggeln.
 */
export const PANTOMIME_THEME_ASSETS: Record<PantomimeCategoryId, string> = {
  tiere: `${THEME_ROOT}/theme-animals-gpt.webp`,
  berufe: `${THEME_ROOT}/theme-professions-gpt.webp`,
  filme: `${THEME_ROOT}/theme-movies-gpt.webp`,
  alltag: `${THEME_ROOT}/theme-everyday-gpt.webp`,
  sport: `${THEME_ROOT}/theme-sports-gpt.webp`,
  gefuehle: `${THEME_ROOT}/theme-emotions-gpt.webp`,
  sprichwoerter: `${THEME_ROOT}/theme-proverbs-gpt.webp`,
  maerchen: `${THEME_ROOT}/theme-fairytales-gpt.webp`,
  ab18: `${THEME_ROOT}/theme-after-dark-gpt.webp`,
};

export const PANTOMIME_MIX_ASSET = `${THEME_ROOT}/theme-mix-gpt.webp`;
