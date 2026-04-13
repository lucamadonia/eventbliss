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
import { loadFromDB, loadFromCacheSync } from './dynamicLoader';

export type { QuizQuestion };

type LangModule = typeof de;

const modules: Record<string, LangModule> = { de, en, es, fr, it, nl, pl, pt, tr, ar };

function getModule(): LangModule {
  const lang = i18n.language?.split('-')[0] || 'de';
  return modules[lang] || modules.de;
}

// Dynamic DB content (populated async, used sync after first load)
let _dbQuestions: QuizQuestion[] | null = null;
let _dbLoaded = false;

/** Pre-load DB questions. Call once at game start. */
export async function preloadQuestions(): Promise<void> {
  if (_dbLoaded) return;
  _dbLoaded = true;
  const cached = loadFromCacheSync<QuizQuestion>('bomb', 'question');
  if (cached && cached.length > 0) { _dbQuestions = cached; return; }
  const db = await loadFromDB<QuizQuestion>('bomb', 'question');
  if (db && db.length > 0) _dbQuestions = db;
}

function getPool(): QuizQuestion[] {
  if (_dbQuestions && _dbQuestions.length > 0) return _dbQuestions;
  const mod = getModule();
  const key = Object.keys(mod).find(k => k.startsWith('QUIZ_QUESTIONS_'));
  return key ? (mod as Record<string, unknown>)[key] as QuizQuestion[] : de.QUIZ_QUESTIONS_DE;
}

let _usedIndices = new Set<number>();

export function getRandomQuestion(): QuizQuestion {
  const pool = getPool();
  if (_usedIndices.size >= pool.length) _usedIndices.clear();
  let idx: number;
  do { idx = Math.floor(Math.random() * pool.length); } while (_usedIndices.has(idx));
  _usedIndices.add(idx);
  return pool[idx];
}

export function resetQuestions(): void {
  _usedIndices.clear();
  // Also reset all static modules
  Object.values(modules).forEach(mod => mod.resetQuestions());
}

export function getQuizQuestions(): QuizQuestion[] {
  return getPool();
}
