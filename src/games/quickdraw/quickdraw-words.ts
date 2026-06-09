// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './quickdraw-words-de';
import * as en from './quickdraw-words-en';
import * as es from './quickdraw-words-es';
import * as fr from './quickdraw-words-fr';
import * as it from './quickdraw-words-it';
import * as nl from './quickdraw-words-nl';
import * as pl from './quickdraw-words-pl';
import * as pt from './quickdraw-words-pt';
import * as tr from './quickdraw-words-tr';
import * as ar from './quickdraw-words-ar';
export type { DrawWord } from './quickdraw-words-de';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getDRAW_WORDS = () => pack().DRAW_WORDS;
