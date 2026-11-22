/**
 * seedGameContent — Standardinhalte der App als `game_content`-Zeilen.
 *
 * Nur für Paare, für die die App einen Lade-Pfad auf `game_content` besitzt,
 * und nur unter den ECHTEN Spiel-Kennungen der App: bomb/question,
 * taboo/taboo_card, headup/headup_word. Die früheren Seeds für Spiele, die
 * ihre Inhalte gar nicht aus der Datenbank lesen (und unter erfundenen
 * Kennungen wie `truthdare`), sind entfallen.
 *
 * Pantomime fehlt mit Absicht: Dort FÜHRT die App Grundstock (im Code) und
 * Datenbank ZUSAMMEN — den Grundstock zusätzlich in die Datenbank zu kopieren
 * wäre reine Dublette.
 *
 * Diese Datei schreibt nichts. Sie baut die Zeilen und sagt, welche fehlen;
 * geschrieben wird erst nach der Bestätigung im Dialog (nur Fehlendes).
 */
import type { QuizQuestion } from '@/games/content/questions-de';
import type { TabooCard } from '@/games/content/taboo-words-de';
import type { HeadUpCategory } from '@/games/content/headup-words-de';
import { primaryKey } from '@/components/admin/games/import-rows';
import type { LangCode } from '@/components/admin/games/field-configs';

export interface SeedItem {
  content: Record<string, Record<string, string>>;
  difficulty: string;
  category: string;
}

type Loaders<T> = Record<LangCode, () => Promise<T[]>>;

const QUESTIONS: Loaders<QuizQuestion> = {
  de: () => import('@/games/content/questions-de').then((m) => m.QUIZ_QUESTIONS_DE),
  en: () => import('@/games/content/questions-en').then((m) => m.QUIZ_QUESTIONS_EN),
  es: () => import('@/games/content/questions-es').then((m) => m.QUIZ_QUESTIONS_ES),
  fr: () => import('@/games/content/questions-fr').then((m) => m.QUIZ_QUESTIONS_FR),
  it: () => import('@/games/content/questions-it').then((m) => m.QUIZ_QUESTIONS_IT),
  nl: () => import('@/games/content/questions-nl').then((m) => m.QUIZ_QUESTIONS_NL),
  pl: () => import('@/games/content/questions-pl').then((m) => m.QUIZ_QUESTIONS_PL),
  pt: () => import('@/games/content/questions-pt').then((m) => m.QUIZ_QUESTIONS_PT),
  tr: () => import('@/games/content/questions-tr').then((m) => m.QUIZ_QUESTIONS_TR),
  ar: () => import('@/games/content/questions-ar').then((m) => m.QUIZ_QUESTIONS_AR),
};

const TABOO: Loaders<TabooCard> = {
  de: () => import('@/games/content/taboo-words-de').then((m) => m.TABOO_CARDS_DE),
  en: () => import('@/games/content/taboo-words-en').then((m) => m.TABOO_CARDS_EN),
  es: () => import('@/games/content/taboo-words-es').then((m) => m.TABOO_CARDS_ES),
  fr: () => import('@/games/content/taboo-words-fr').then((m) => m.TABOO_CARDS_FR),
  it: () => import('@/games/content/taboo-words-it').then((m) => m.TABOO_CARDS_IT),
  nl: () => import('@/games/content/taboo-words-nl').then((m) => m.TABOO_CARDS_NL),
  pl: () => import('@/games/content/taboo-words-pl').then((m) => m.TABOO_CARDS_PL),
  pt: () => import('@/games/content/taboo-words-pt').then((m) => m.TABOO_CARDS_PT),
  tr: () => import('@/games/content/taboo-words-tr').then((m) => m.TABOO_CARDS_TR),
  ar: () => import('@/games/content/taboo-words-ar').then((m) => m.TABOO_CARDS_AR),
};

const HEADUP: Loaders<HeadUpCategory> = {
  de: () => import('@/games/content/headup-words-de').then((m) => m.HEADUP_CATEGORIES_DE),
  en: () => import('@/games/content/headup-words-en').then((m) => m.HEADUP_CATEGORIES_EN),
  es: () => import('@/games/content/headup-words-es').then((m) => m.HEADUP_CATEGORIES_ES),
  fr: () => import('@/games/content/headup-words-fr').then((m) => m.HEADUP_CATEGORIES_FR),
  it: () => import('@/games/content/headup-words-it').then((m) => m.HEADUP_CATEGORIES_IT),
  nl: () => import('@/games/content/headup-words-nl').then((m) => m.HEADUP_CATEGORIES_NL),
  pl: () => import('@/games/content/headup-words-pl').then((m) => m.HEADUP_CATEGORIES_PL),
  pt: () => import('@/games/content/headup-words-pt').then((m) => m.HEADUP_CATEGORIES_PT),
  tr: () => import('@/games/content/headup-words-tr').then((m) => m.HEADUP_CATEGORIES_TR),
  ar: () => import('@/games/content/headup-words-ar').then((m) => m.HEADUP_CATEGORIES_AR),
};

async function loadAll<T>(loaders: Loaders<T>): Promise<Record<string, T[]>> {
  const entries = await Promise.all(
    Object.entries(loaders).map(async ([lang, load]) => [lang, await load()] as const),
  );
  return Object.fromEntries(entries);
}

// ─── Reine Zusammenführung (testbar) ─────────────────────────────

const flatQuestion = (q: QuizQuestion): Record<string, string> => ({
  question: q.question,
  answer1: q.answers[0] ?? '',
  answer2: q.answers[1] ?? '',
  answer3: q.answers[2] ?? '',
  answer4: q.answers[3] ?? '',
  correctIndex: String(q.correctIndex),
});

/** Fragen tragen in allen Sprachen dieselbe `id` — darüber wird zusammengeführt. */
export function mergeQuestions(byLang: Record<string, QuizQuestion[]>): SeedItem[] {
  const base = byLang.de ?? [];
  return base.map((de) => {
    const content: SeedItem['content'] = { de: flatQuestion(de) };
    for (const [lang, list] of Object.entries(byLang)) {
      if (lang === 'de') continue;
      const match = list.find((q) => q.id === de.id);
      if (match) content[lang] = flatQuestion(match);
    }
    return { content, difficulty: de.difficulty || 'medium', category: de.category || 'general' };
  });
}

const flatTaboo = (c: TabooCard): Record<string, string> => {
  const out: Record<string, string> = { term: c.term };
  c.forbidden.slice(0, 5).forEach((w, i) => { if (w) out[`forbidden${i + 1}`] = w; });
  return out;
};

/**
 * Tabu-Karten haben keine Kennung; Übersetzungen gehören nur über die
 * POSITION zusammen. Deshalb zählt eine Sprache nur mit, wenn ihre Liste genau
 * so lang ist wie die deutsche — sonst wäre ab der ersten Abweichung jede
 * Karte der falschen Übersetzung zugeordnet (aktuell betrifft das Türkisch).
 */
export function mergeTaboo(byLang: Record<string, TabooCard[]>): SeedItem[] {
  const base = byLang.de ?? [];
  const aligned = Object.entries(byLang).filter(([lang, list]) => lang !== 'de' && list.length === base.length);
  return base.map((de, idx) => {
    const content: SeedItem['content'] = { de: flatTaboo(de) };
    for (const [lang, list] of aligned) content[lang] = flatTaboo(list[idx]);
    return { content, difficulty: de.difficulty || 'medium', category: de.category || 'general' };
  });
}

const flatHeadup = (c: HeadUpCategory): Record<string, string> => ({
  word: c.name,
  words: c.words.join(', '),
});

export function mergeHeadup(byLang: Record<string, HeadUpCategory[]>): SeedItem[] {
  const base = byLang.de ?? [];
  return base.map((de) => {
    const content: SeedItem['content'] = { de: flatHeadup(de) };
    for (const [lang, list] of Object.entries(byLang)) {
      if (lang === 'de') continue;
      const match = list.find((c) => c.id === de.id);
      if (match) content[lang] = flatHeadup(match);
    }
    return { content, difficulty: 'medium', category: de.name || 'general' };
  });
}

// ─── Öffentliche Schnittstelle ───────────────────────────────────

const BUILDERS: Record<string, Record<string, () => Promise<SeedItem[]>>> = {
  bomb: { question: async () => mergeQuestions(await loadAll(QUESTIONS)) },
  taboo: { taboo_card: async () => mergeTaboo(await loadAll(TABOO)) },
  headup: { headup_word: async () => mergeHeadup(await loadAll(HEADUP)) },
};

export function hasDefaultContent(appId: string, contentType: string): boolean {
  return Boolean(BUILDERS[appId]?.[contentType]);
}

/** Der Grundstock der App für dieses Paar, als flache Admin-Zeilen. */
export async function buildDefaultItems(appId: string, contentType: string): Promise<SeedItem[]> {
  const build = BUILDERS[appId]?.[contentType];
  return build ? build() : [];
}

/** Nur was in der Datenbank noch fehlt (Abgleich über den deutschen Haupttext). */
export function selectMissing(
  items: readonly SeedItem[],
  existingKeys: ReadonlySet<string>,
  contentType: string,
): SeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = primaryKey(contentType, item.content);
    if (!key || existingKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
