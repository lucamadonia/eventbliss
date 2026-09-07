import { QUESTIONS, TASKS } from './editorial-de';
export type EditorialCategory = keyof typeof QUESTIONS;
// Legacy categories remain separate, age-labelled categories in translated packs.
export type BottleCategory = EditorialCategory | 'jga' | 'erwachsene';
export type CardType = 'frage' | 'aufgabe';
export interface BottleCard { id?: string; text: string; type: CardType; category: BottleCategory }
export interface CategoryMeta { name: string; emoji: string; color: string }
export const EDITORIAL_CATEGORIES = Object.keys(QUESTIONS) as EditorialCategory[];
const labels: Record<EditorialCategory, string> = {
  eisbrecher: 'Eisbrecher', spass: 'Humor & Eigenheiten', party: 'Feiern & Musik',
  freundschaft: 'Freundschaft', liebe: 'Nähe & Beziehungen', erinnerungen: 'Erinnerungen',
  reisen: 'Reisen & Entdecken', traeume: 'Wünsche & Zukunft',
  entscheidungen: 'Entscheidungen & Werte', kreativ: 'Fantasie & Kreativität',
};
export const CATEGORY_META: Record<string, CategoryMeta> = Object.fromEntries(
  EDITORIAL_CATEGORIES.map(category => [category, { name: labels[category], emoji: '', color: '#e6b880' }]),
);
export const BOTTLE_CARDS: BottleCard[] = EDITORIAL_CATEGORIES.flatMap(category => [
  ...QUESTIONS[category].map((text, index) => ({ id: `${category}:frage:${index}`, text, category, type: 'frage' as const })),
  ...TASKS[category].map((text, index) => ({ id: `${category}:aufgabe:${index}`, text, category, type: 'aufgabe' as const })),
]);
