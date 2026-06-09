// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './fakeorfact-content-de';
import * as en from './fakeorfact-content-en';
import * as es from './fakeorfact-content-es';
import * as fr from './fakeorfact-content-fr';
import * as it from './fakeorfact-content-it';
import * as nl from './fakeorfact-content-nl';
import * as pl from './fakeorfact-content-pl';
import * as pt from './fakeorfact-content-pt';
import * as tr from './fakeorfact-content-tr';
import * as ar from './fakeorfact-content-ar';
export type { Fact, ThreeStatements } from './fakeorfact-content-de';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getFACTS = () => pack().FACTS;
export const getTHREE_STATEMENTS = () => pack().THREE_STATEMENTS;
