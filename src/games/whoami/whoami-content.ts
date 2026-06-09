// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './whoami-content-de';
import * as en from './whoami-content-en';
import * as es from './whoami-content-es';
import * as fr from './whoami-content-fr';
import * as it from './whoami-content-it';
import * as nl from './whoami-content-nl';
import * as pl from './whoami-content-pl';
import * as pt from './whoami-content-pt';
import * as tr from './whoami-content-tr';
import * as ar from './whoami-content-ar';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getWHOAMI_CHARACTERS = () => pack().WHOAMI_CHARACTERS;
