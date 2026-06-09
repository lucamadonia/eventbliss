// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './story-prompts-de';
import * as en from './story-prompts-en';
import * as es from './story-prompts-es';
import * as fr from './story-prompts-fr';
import * as it from './story-prompts-it';
import * as nl from './story-prompts-nl';
import * as pl from './story-prompts-pl';
import * as pt from './story-prompts-pt';
import * as tr from './story-prompts-tr';
import * as ar from './story-prompts-ar';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getSTORY_STARTERS = () => pack().STORY_STARTERS;
export const getSTORY_PROMPTS = () => pack().STORY_PROMPTS;
