// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './emoji-content-de';
import * as en from './emoji-content-en';
import * as es from './emoji-content-es';
import * as fr from './emoji-content-fr';
import * as it from './emoji-content-it';
import * as nl from './emoji-content-nl';
import * as pl from './emoji-content-pl';
import * as pt from './emoji-content-pt';
import * as tr from './emoji-content-tr';
import * as ar from './emoji-content-ar';
export type { EmojiPuzzle } from './emoji-content-de';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getEMOJI_PUZZLES = () => pack().EMOJI_PUZZLES;
