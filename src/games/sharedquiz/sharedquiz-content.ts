// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './sharedquiz-content-de';
import * as en from './sharedquiz-content-en';
import * as es from './sharedquiz-content-es';
import * as fr from './sharedquiz-content-fr';
import * as it from './sharedquiz-content-it';
import * as nl from './sharedquiz-content-nl';
import * as pl from './sharedquiz-content-pl';
import * as pt from './sharedquiz-content-pt';
import * as tr from './sharedquiz-content-tr';
import * as ar from './sharedquiz-content-ar';
export type { SharedQuizQuestion } from './sharedquiz-content-de';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getSHARED_QUIZ_QUESTIONS = () => pack().SHARED_QUIZ_QUESTIONS;
