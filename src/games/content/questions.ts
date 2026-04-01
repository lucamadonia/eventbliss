import i18n from 'i18next';
import type { QuizQuestion } from './questions-de';
import * as de from './questions-de';
import * as en from './questions-en';
import * as es from './questions-es';
import * as fr from './questions-fr';
import * as it from './questions-it';
import * as nl from './questions-nl';
import * as pl from './questions-pl';
import * as pt from './questions-pt';
import * as tr from './questions-tr';
import * as ar from './questions-ar';

export type { QuizQuestion };

type LangModule = typeof de;

const modules: Record<string, LangModule> = { de, en, es, fr, it, nl, pl, pt, tr, ar };

function getModule(): LangModule {
  const lang = i18n.language?.split('-')[0] || 'de';
  return modules[lang] || modules.de;
}

export function getRandomQuestion(): QuizQuestion {
  return getModule().getRandomQuestion();
}

export function resetQuestions(): void {
  // Reset all language modules to ensure clean state on restart
  Object.values(modules).forEach(mod => mod.resetQuestions());
}

export function getQuizQuestions(): QuizQuestion[] {
  const mod = getModule();
  const key = Object.keys(mod).find(k => k.startsWith('QUIZ_QUESTIONS_'));
  return key ? (mod as Record<string, unknown>)[key] as QuizQuestion[] : de.QUIZ_QUESTIONS_DE;
}
