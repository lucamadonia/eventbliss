import i18n from 'i18next';
import type { CategoryPrompt, GameCategory } from './categories-de';
import * as de from './categories-de';
import * as en from './categories-en';
import * as es from './categories-es';
import * as fr from './categories-fr';
import * as it from './categories-it';
import * as nl from './categories-nl';
import * as pl from './categories-pl';
import * as pt from './categories-pt';
import * as tr from './categories-tr';
import * as ar from './categories-ar';

export type { CategoryPrompt, GameCategory };

type LangModule = typeof de;

const modules: Record<string, LangModule> = { de, en, es, fr, it, nl, pl, pt, tr, ar };

function getModule(): LangModule {
  const lang = i18n.language?.split('-')[0] || 'de';
  return modules[lang] || modules.de;
}

export function generateCategoryPrompt(): CategoryPrompt {
  return getModule().generateCategoryPrompt();
}

export const GAME_CATEGORIES: GameCategory[] = de.GAME_CATEGORIES_DE;

export function getGameCategories(): GameCategory[] {
  const mod = getModule();
  const key = Object.keys(mod).find(k => k.startsWith('GAME_CATEGORIES_'));
  return key ? (mod as Record<string, unknown>)[key] as GameCategory[] : de.GAME_CATEGORIES_DE;
}

export function getCategories(): string[] {
  const mod = getModule();
  const key = Object.keys(mod).find(k => k.startsWith('CATEGORIES_') && !k.startsWith('CATEGORIES_D') || k === 'CATEGORIES_DE');
  // Each module exports CATEGORIES_XX = CATEGORY_NAMES (the string array)
  const catKey = Object.keys(mod).find(k => /^CATEGORIES_[A-Z]{2}$/.test(k));
  return catKey ? (mod as Record<string, unknown>)[catKey] as string[] : de.CATEGORIES_DE;
}
