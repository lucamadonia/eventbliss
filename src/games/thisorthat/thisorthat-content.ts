// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './thisorthat-content-de';
import * as en from './thisorthat-content-en';
import * as es from './thisorthat-content-es';
import * as fr from './thisorthat-content-fr';
import * as it from './thisorthat-content-it';
import * as nl from './thisorthat-content-nl';
import * as pl from './thisorthat-content-pl';
import * as pt from './thisorthat-content-pt';
import * as tr from './thisorthat-content-tr';
import * as ar from './thisorthat-content-ar';
export type { ThisOrThatPair } from './thisorthat-content-de';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getTHISORTHAT_PAIRS = () => pack().THISORTHAT_PAIRS;
