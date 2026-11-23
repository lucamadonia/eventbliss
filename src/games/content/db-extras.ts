/**
 * db-extras — macht aus Admin-Zeilen (`game_content`) spielbare Inhalte und
 * führt sie mit dem Grundstock der App zusammen.
 *
 * Zwei Regeln, die für alle drei Spiele gelten:
 *  1. Der Grundstock bleibt IMMER erhalten. Datenbank-Inhalte kommen dazu,
 *     sie ersetzen nichts. (In der Datenbank liegen Kopien des Grundstocks aus
 *     dem früheren Admin — die dürfen weder etwas verdrängen noch doppelt
 *     auftauchen.)
 *  2. Eine Zeile, die das Spiel nicht sauber darstellen könnte, fällt weg,
 *     statt das Spiel zu beschädigen (Frage ohne vier Antworten, Karte ohne
 *     Tabu-Wörter ...).
 *
 * Bewusst ohne Supabase-Import: rein und in Node testbar.
 */
import type { QuizQuestion } from './questions-de';
import type { TabooCard } from './taboo-words-de';
import type { HeadUpCategory } from './headup-words-de';

/** Wie `ExtraRow` aus dem dynamicLoader — hier wiederholt, damit diese Datei rein bleibt. */
export interface ExtraRowLike {
  data: Record<string, unknown>;
  difficulty?: string | null;
  category?: string | null;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const text = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());

/**
 * Vergleichsschlüssel: Groß/Klein, Leerraum und die Art der Anführungs- und
 * Auslassungszeichen spielen keine Rolle (`Emoji's` = `Emoji"s` = `Emoji’s`).
 */
export const normKey = (s: string): string =>
  s.toLowerCase().replace(/['"`´’‘“”\\]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Ein früherer Import hat Texte am Apostroph abgeschnitten und einen
 * Rückstrich hinterlassen ("How many sets does a men\"). Solche Zeilen liegen
 * noch in der Datenbank; im Spiel dürfen sie nie auftauchen. Ein echter
 * Eintrag endet nicht auf einen Rückstrich.
 */
export const isDamaged = (s: string): boolean => /\\\s*$/.test(s);

const difficultyOf = (v: unknown): Difficulty => {
  const d = text(v);
  return d === 'easy' || d === 'hard' ? d : 'medium';
};

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Kommagetrennte (oder zeilenweise) Liste aus dem Admin-Textfeld. */
export function parseWordList(raw: unknown): string[] {
  return text(raw).split(/[,\n;]/).map((w) => w.trim()).filter((w) => w && !isDamaged(w));
}

function uniqueBy<T>(items: readonly T[], keyOf: (item: T) => string, taken: Set<string>): T[] {
  const out: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (!key || taken.has(key)) continue;
    taken.add(key);
    out.push(item);
  }
  return out;
}

// ─── Bombe: Quizfragen ───────────────────────────────────────────

export function questionsFromRows(rows: readonly ExtraRowLike[]): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  for (const row of rows) {
    const question = text(row.data.question);
    const answers = [1, 2, 3, 4].map((n) => text(row.data[`answer${n}`]));
    const correctIndex = Number(text(row.data.correctIndex) || '0');
    // Das Spiel zeigt vier Antwortfelder; eine Lücke wäre ein leerer Knopf.
    if (!question || answers.some((a) => !a)) continue;
    if ([question, ...answers].some(isDamaged)) continue;
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) continue;
    out.push({
      id: `db-${hash(normKey(question))}`,
      question,
      answers,
      correctIndex,
      category: text(row.category) || 'general',
      difficulty: difficultyOf(row.difficulty),
    });
  }
  return out;
}

export function mergeQuestionPool(base: readonly QuizQuestion[], extras: readonly QuizQuestion[]): QuizQuestion[] {
  const taken = new Set(base.map((q) => normKey(q.question)));
  return [...base, ...uniqueBy(extras, (q) => normKey(q.question), taken)];
}

// ─── Tabu: Karten ────────────────────────────────────────────────

export function tabooCardsFromRows(rows: readonly ExtraRowLike[]): TabooCard[] {
  const out: TabooCard[] = [];
  for (const row of rows) {
    const term = text(row.data.term);
    const forbidden = [1, 2, 3, 4, 5].map((n) => text(row.data[`forbidden${n}`])).filter(Boolean);
    // Eine Tabu-Karte ohne verbotene Wörter ist keine.
    if (!term || forbidden.length < 2) continue;
    if ([term, ...forbidden].some(isDamaged)) continue;
    out.push({ term, forbidden, category: text(row.category) || 'general', difficulty: difficultyOf(row.difficulty) });
  }
  return out;
}

export function mergeTabooDeck(base: readonly TabooCard[], extras: readonly TabooCard[]): TabooCard[] {
  const taken = new Set(base.map((c) => normKey(c.term)));
  return [...base, ...uniqueBy(extras, (c) => normKey(c.term), taken)];
}

// ─── Stirnraten: Kategorien ──────────────────────────────────────

const NEW_CATEGORY_LOOK = { emoji: '✨', gradient: 'from-violet-500 to-fuchsia-600' };
/** Darunter lohnt eine eigene Kategorie nicht — die Runde wäre nach Sekunden leer. */
export const MIN_WORDS_NEW_CATEGORY = 10;

/**
 * Eine Zeile ist eine Kategorie mit Wortliste. Trägt sie den Namen einer
 * eingebauten Kategorie, kommen ihre Wörter dort dazu; sonst entsteht eine
 * neue Kategorie am Ende der Auswahl.
 */
export function mergeHeadupCategories(
  base: readonly HeadUpCategory[],
  rows: readonly ExtraRowLike[],
): HeadUpCategory[] {
  const merged = base.map((c) => ({ ...c, words: [...c.words] }));
  const byName = new Map(merged.map((c) => [normKey(c.name), c]));
  const added = new Map<string, HeadUpCategory>();

  const addWords = (target: HeadUpCategory, words: string[]) => {
    const taken = new Set(target.words.map(normKey));
    target.words.push(...uniqueBy(words, normKey, taken));
  };

  for (const row of rows) {
    const name = text(row.data.word);
    const words = parseWordList(row.data.words);
    if (!name || isDamaged(name) || words.length === 0) continue;
    const key = normKey(name);
    const existing = byName.get(key) ?? added.get(key);
    if (existing) { addWords(existing, words); continue; }
    const fresh: HeadUpCategory = { id: `db-${hash(key)}`, name, ...NEW_CATEGORY_LOOK, words: [] };
    addWords(fresh, words);
    added.set(key, fresh);
  }

  const extraCategories = [...added.values()].filter((c) => c.words.length >= MIN_WORDS_NEW_CATEGORY);
  return [...merged, ...extraCategories];
}
