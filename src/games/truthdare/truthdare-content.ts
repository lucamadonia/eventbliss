// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './truthdare-content-de';
import * as en from './truthdare-content-en';
import * as es from './truthdare-content-es';
import * as fr from './truthdare-content-fr';
import * as it from './truthdare-content-it';
import * as nl from './truthdare-content-nl';
import * as pl from './truthdare-content-pl';
import * as pt from './truthdare-content-pt';
import * as tr from './truthdare-content-tr';
import * as ar from './truthdare-content-ar';
export type { TruthQuestion, DareChallenge } from './truthdare-content-de';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getTRUTH_QUESTIONS = () => pack().TRUTH_QUESTIONS;
export const getDARE_CHALLENGES = () => pack().DARE_CHALLENGES;
