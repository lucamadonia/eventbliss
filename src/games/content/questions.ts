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
import { loadExtraRows } from './dynamicLoader';
import { mergeQuestionPool, questionsFromRows } from './db-extras';

export type { QuizQuestion };

type LangModule = Pick<typeof de, 'getRandomQuestion' | 'resetQuestions'>
  & Partial<Record<`QUIZ_QUESTIONS_${string}`, QuizQuestion[]>>;

const modules: Record<string, LangModule> = { de, en, es, fr, it, nl, pl, pt, tr, ar };

const currentLang = (): string => i18n.language?.split('-')[0] || 'de';

function getModule(): LangModule {
  return modules[currentLang()] || modules.de;
}

function staticPool(): QuizQuestion[] {
  const mod = getModule();
  const key = Object.keys(mod).find(k => k.startsWith('QUIZ_QUESTIONS_'));
  return key ? (mod as Record<string, unknown>)[key] as QuizQuestion[] : de.QUIZ_QUESTIONS_DE;
}

// Im Admin gepflegte Fragen. Sie ERGÄNZEN den Grundstock (siehe db-extras.ts)
// und gelten nur für die Sprache, in der sie geladen wurden.
let _extra: { lang: string; items: QuizQuestion[] } | null = null;
let _pool: { lang: string; extra: typeof _extra; list: QuizQuestion[] } | null = null;

/** Zusatzfragen vorladen. Beim Öffnen des Spiels aufrufen; offline bleibt es beim Grundstock. */
export async function preloadQuestions(): Promise<void> {
  const lang = currentLang();
  const rows = await loadExtraRows('bomb', 'question', lang);
  _extra = { lang, items: questionsFromRows(rows) };
}

function getPool(): QuizQuestion[] {
  const lang = currentLang();
  // Die Liste muss zwischen zwei Zügen dieselbe bleiben, sonst zeigen die
  // gemerkten Positionen in `_usedIndices` auf andere Fragen.
  if (_pool && _pool.lang === lang && _pool.extra === _extra) return _pool.list;
  const extras = _extra && _extra.lang === lang ? _extra.items : [];
  const list = extras.length > 0 ? mergeQuestionPool(staticPool(), extras) : staticPool();
  _pool = { lang, extra: _extra, list };
  return list;
}

const _usedIndices = new Set<number>();

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
