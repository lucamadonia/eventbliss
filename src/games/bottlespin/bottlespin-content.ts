// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './bottlespin-content-de';
import * as en from './bottlespin-content-en';
import * as es from './bottlespin-content-es';
import * as fr from './bottlespin-content-fr';
import * as it from './bottlespin-content-it';
import * as nl from './bottlespin-content-nl';
import * as pl from './bottlespin-content-pl';
import * as pt from './bottlespin-content-pt';
import * as tr from './bottlespin-content-tr';
import * as ar from './bottlespin-content-ar';
export type { BottleCard, BottleCategory } from './bottlespin-content-de';

const BY_LANG: Record<string, typeof de> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
function pack(): typeof de {
  const l = i18n.language?.split('-')[0] || 'de';
  return BY_LANG[l] || de;
}

export const getBOTTLE_CARDS = () => pack().BOTTLE_CARDS;
export const getCATEGORY_META = () => pack().CATEGORY_META;
