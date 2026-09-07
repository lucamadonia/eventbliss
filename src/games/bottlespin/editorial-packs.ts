import * as de from './editorial-de';
import * as en from './editorial-en';
import * as fr from './editorial-fr';
import * as it from './editorial-it';
import * as es from './editorial-es';
import * as pt from './editorial-pt';
import * as nl from './editorial-nl';
import * as pl from './editorial-pl';
import * as tr from './editorial-tr';
import * as ar from './editorial-ar';
import type { BottleCard, EditorialCategory } from './bottlespin-content-de';

export const EDITORIAL_LANGUAGES = ['de', 'en', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'tr', 'ar'] as const;
export type EditorialLanguage = typeof EDITORIAL_LANGUAGES[number];
export interface EditorialPack { QUESTIONS: Record<EditorialCategory, readonly string[]>; TASKS: Record<EditorialCategory, readonly string[]> }
export const EDITORIAL_PACKS: Record<EditorialLanguage, EditorialPack> = { de, en, fr, it, es, pt, nl, pl, tr, ar };
export function editorialLanguage(language?: string): EditorialLanguage {
  const base = language?.toLowerCase().split(/[-_]/)[0];
  return EDITORIAL_LANGUAGES.includes(base as EditorialLanguage) ? base as EditorialLanguage : 'de';
}
export function createEditorialCards(pack: EditorialPack): BottleCard[] {
  return (Object.keys(de.QUESTIONS) as EditorialCategory[]).flatMap(category => [
    ...pack.QUESTIONS[category].map((text, index) => ({ id: `${category}:frage:${index}`, category, type: 'frage' as const, text })),
    ...pack.TASKS[category].map((text, index) => ({ id: `${category}:aufgabe:${index}`, category, type: 'aufgabe' as const, text })),
  ]);
}
