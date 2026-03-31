import i18n from 'i18next';

import type { GameCategory, CategoryPrompt } from './categories-de';
import type { TabooCard } from './taboo-words-de';
import type { HeadUpCategory } from './headup-words-de';
import type { QuizQuestion } from './questions-de';

// Re-export types
export type { GameCategory, CategoryPrompt, TabooCard, HeadUpCategory, QuizQuestion };

type SupportedLang = 'de' | 'en' | 'es' | 'fr' | 'it' | 'nl' | 'pl' | 'pt' | 'tr' | 'ar';

// Lazy imports for code splitting — categories
const categoryModules: Record<SupportedLang, () => Promise<{ GAME_CATEGORIES_DE?: GameCategory[]; GAME_CATEGORIES_EN?: GameCategory[]; GAME_CATEGORIES_ES?: GameCategory[]; GAME_CATEGORIES_FR?: GameCategory[]; GAME_CATEGORIES_IT?: GameCategory[]; GAME_CATEGORIES_NL?: GameCategory[]; GAME_CATEGORIES_PL?: GameCategory[]; GAME_CATEGORIES_PT?: GameCategory[]; GAME_CATEGORIES_TR?: GameCategory[]; GAME_CATEGORIES_AR?: GameCategory[]; generateCategoryPrompt: () => CategoryPrompt }>> = {
  de: () => import('./categories-de'),
  en: () => import('./categories-en'),
  es: () => import('./categories-es'),
  fr: () => import('./categories-fr'),
  it: () => import('./categories-it'),
  nl: () => import('./categories-nl'),
  pl: () => import('./categories-pl'),
  pt: () => import('./categories-pt'),
  tr: () => import('./categories-tr'),
  ar: () => import('./categories-ar'),
};

// Lazy imports for code splitting — taboo words
const tabooModules: Record<SupportedLang, () => Promise<{ [key: string]: TabooCard[] }>> = {
  de: () => import('./taboo-words-de'),
  en: () => import('./taboo-words-en'),
  es: () => import('./taboo-words-es'),
  fr: () => import('./taboo-words-fr'),
  it: () => import('./taboo-words-it'),
  nl: () => import('./taboo-words-nl'),
  pl: () => import('./taboo-words-pl'),
  pt: () => import('./taboo-words-pt'),
  tr: () => import('./taboo-words-tr'),
  ar: () => import('./taboo-words-ar'),
};

// Lazy imports for code splitting — headup words
const headupModules: Record<SupportedLang, () => Promise<{ [key: string]: HeadUpCategory[] }>> = {
  de: () => import('./headup-words-de'),
  en: () => import('./headup-words-en'),
  es: () => import('./headup-words-es'),
  fr: () => import('./headup-words-fr'),
  it: () => import('./headup-words-it'),
  nl: () => import('./headup-words-nl'),
  pl: () => import('./headup-words-pl'),
  pt: () => import('./headup-words-pt'),
  tr: () => import('./headup-words-tr'),
  ar: () => import('./headup-words-ar'),
};

// Lazy imports for code splitting — questions
const questionModules: Record<SupportedLang, () => Promise<{ [key: string]: QuizQuestion[] }>> = {
  de: () => import('./questions-de'),
  en: () => import('./questions-en'),
  es: () => import('./questions-es'),
  fr: () => import('./questions-fr'),
  it: () => import('./questions-it'),
  nl: () => import('./questions-nl'),
  pl: () => import('./questions-pl'),
  pt: () => import('./questions-pt'),
  tr: () => import('./questions-tr'),
  ar: () => import('./questions-ar'),
};

function getCurrentLang(): SupportedLang {
  const lang = (i18n.language?.split('-')[0] || 'de') as SupportedLang;
  return lang in categoryModules ? lang : 'de';
}

export async function getCategories(): Promise<{ categories: GameCategory[]; generateCategoryPrompt: () => CategoryPrompt }> {
  const lang = getCurrentLang();
  const loader = categoryModules[lang] || categoryModules.de;
  const mod = await loader();

  // Find the exported categories array (named GAME_CATEGORIES_{LANG})
  const categoriesKey = Object.keys(mod).find(k => k.startsWith('GAME_CATEGORIES_'));
  const categories = categoriesKey ? (mod as Record<string, unknown>)[categoriesKey] as GameCategory[] : [];

  return {
    categories,
    generateCategoryPrompt: mod.generateCategoryPrompt,
  };
}

export async function getTabooCards(): Promise<TabooCard[]> {
  const lang = getCurrentLang();
  const loader = tabooModules[lang] || tabooModules.de;
  const mod = await loader();

  // Find the exported taboo cards array (named TABOO_CARDS_{LANG})
  const cardsKey = Object.keys(mod).find(k => k.startsWith('TABOO_CARDS_'));
  return cardsKey ? (mod as Record<string, unknown>)[cardsKey] as TabooCard[] : [];
}

export async function getHeadUpWords(): Promise<HeadUpCategory[]> {
  const lang = getCurrentLang();
  const loader = headupModules[lang] || headupModules.de;
  const mod = await loader();

  // Find the exported headup categories array (named HEADUP_CATEGORIES_{LANG})
  const categoriesKey = Object.keys(mod).find(k => k.startsWith('HEADUP_CATEGORIES_'));
  return categoriesKey ? (mod as Record<string, unknown>)[categoriesKey] as HeadUpCategory[] : [];
}

export async function getQuestions(): Promise<QuizQuestion[]> {
  const lang = getCurrentLang();
  const loader = questionModules[lang] || questionModules.de;
  const mod = await loader();

  // Find the exported questions array (named QUIZ_QUESTIONS_{LANG})
  const questionsKey = Object.keys(mod).find(k => k.startsWith('QUIZ_QUESTIONS_'));
  return questionsKey ? (mod as Record<string, unknown>)[questionsKey] as QuizQuestion[] : [];
}
