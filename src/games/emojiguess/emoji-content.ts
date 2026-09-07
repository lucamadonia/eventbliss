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
import { curateEmojiPuzzles } from './curated-puzzles';
export type EmojiPuzzle = de.EmojiPuzzle & { aliases?: string[] };

const EMOJI_PUZZLES_BY_LANG: Record<string, typeof de.EMOJI_PUZZLES> = {
  de: de.EMOJI_PUZZLES,
  en: en.EMOJI_PUZZLES,
  es: es.EMOJI_PUZZLES,
  fr: fr.EMOJI_PUZZLES,
  it: it.EMOJI_PUZZLES_IT,
  nl: nl.EMOJI_PUZZLES_NL,
  pl: pl.EMOJI_PUZZLES_PL,
  pt: pt.EMOJI_PUZZLES_PT,
  tr: tr.EMOJI_PUZZLES_TR,
  ar: ar.EMOJI_PUZZLES_AR,
};
export const getEMOJI_PUZZLES = (language = i18n.language ?? 'de') => curateEmojiPuzzles(EMOJI_PUZZLES_BY_LANG[language.split('-')[0]] ?? de.EMOJI_PUZZLES, Object.values(EMOJI_PUZZLES_BY_LANG));
