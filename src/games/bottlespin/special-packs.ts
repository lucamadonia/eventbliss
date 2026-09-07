import { BOTTLE_CARDS as source } from './legacy-special-de';
import { TEXTS as en } from './special-en';
import { TEXTS as fr } from './special-fr';
import { TEXTS as it } from './special-it';
import { TEXTS as es } from './special-es';
import { TEXTS as pt } from './special-pt';
import { TEXTS as nl } from './special-nl';
import { TEXTS as pl } from './special-pl';
import { TEXTS as tr } from './special-tr';
import { TEXTS as ar } from './special-ar';
import type { EditorialLanguage } from './editorial-packs';
import type { BottleCard } from './bottlespin-content-de';

export const SPECIAL_TEXTS: Record<EditorialLanguage, readonly string[]> = { de: source.map(card => card.text), en, fr, it, es, pt, nl, pl, tr, ar };
export function createSpecialCards(language: EditorialLanguage): BottleCard[] {
  return source.map((card, index) => ({ ...card, id: `special:${index}`, text: SPECIAL_TEXTS[language][index] }));
}
