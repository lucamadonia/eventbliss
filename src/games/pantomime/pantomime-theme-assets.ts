import type { PantomimeCategoryId } from '../content/pantomime-words';

const THEME_ROOT = '/images/games/editorial-themes';

/**
 * Textfreie GPT-Image-Editorialmotive fuer die Themenwahl.
 *
 * Die Bezeichnungen bleiben absichtlich in der nativen UI: So funktioniert
 * dieselbe Bildserie in allen Sprachen und ein Bildfehler kann nie eine falsche
 * Uebersetzung ins Spiel schmuggeln.
 */
export const PANTOMIME_THEME_ASSETS: Record<PantomimeCategoryId, string> = {
  tiere: `${THEME_ROOT}/pantomime-animals-gpt.webp`,
  berufe: `${THEME_ROOT}/pantomime-professions-gpt.webp`,
  filme: `${THEME_ROOT}/pantomime-movies-gpt.webp`,
  alltag: `${THEME_ROOT}/pantomime-everyday-gpt.webp`,
  sport: `${THEME_ROOT}/pantomime-sports-gpt.webp`,
  gefuehle: `${THEME_ROOT}/pantomime-emotions-gpt.webp`,
  sprichwoerter: `${THEME_ROOT}/pantomime-proverbs-gpt.webp`,
  maerchen: `${THEME_ROOT}/pantomime-fairytales-gpt.webp`,
  ab18: `${THEME_ROOT}/pantomime-after-dark-gpt.webp`,
};

export const PANTOMIME_MIX_ASSET = `${THEME_ROOT}/pantomime-mix-gpt.webp`;
