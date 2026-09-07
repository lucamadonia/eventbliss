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
import type { BottleCard, CategoryMeta } from './bottlespin-content-de';
import { EDITORIAL_LANGUAGES, EDITORIAL_PACKS, createEditorialCards, editorialLanguage } from './editorial-packs';
import { createSpecialCards } from './special-packs';
export type { BottleCard, BottleCategory, CardType } from './bottlespin-content-de';

const LEGACY: Record<string, { BOTTLE_CARDS: BottleCard[]; CATEGORY_META: Record<string, CategoryMeta> }> = { de, en, es, fr, it, nl, pl, pt, tr, ar };
const BY_LANG = Object.fromEntries(EDITORIAL_LANGUAGES.map(language => [language, {
  // The same 600 editorial and 122 separately labelled special cards exist in every language.
  BOTTLE_CARDS: [
    ...createEditorialCards(EDITORIAL_PACKS[language]),
    ...createSpecialCards(language),
  ],
  CATEGORY_META: { ...de.CATEGORY_META, ...LEGACY[language].CATEGORY_META },
}]));
function pack() {
  return BY_LANG[editorialLanguage(i18n.language)];
}

export const getBOTTLE_CARDS = () => pack().BOTTLE_CARDS;
export const getBottleCardById = (id?: string): BottleCard | undefined => id ? pack().BOTTLE_CARDS.find(card => card.id === id) : undefined;
// Stable semantic IDs let every room member read the same question in their own language.
export const localizeBottleCard = (card: BottleCard): BottleCard => getBottleCardById(card.id) ?? card;
// Also resolve a host's new category on guests using a different UI language.
export const getCATEGORY_META = () => Object.fromEntries(Object.entries({
  jga: { name: 'Junggesellenabschied', emoji: '', color: '#ec4899' },
  erwachsene: { name: 'Erwachsene 18+', emoji: '', color: '#f97316' },
  ...de.CATEGORY_META, ...pack().CATEGORY_META,
}).map(([id, meta]) => [id, {
  ...meta, name: i18n.t(`games.bottlespin.categories.${id}`, { defaultValue: meta.name }),
}]));
