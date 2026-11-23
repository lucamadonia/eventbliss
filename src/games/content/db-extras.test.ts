import { describe, it, expect } from 'vitest';
import {
  MIN_WORDS_NEW_CATEGORY, isDamaged, mergeHeadupCategories, mergeQuestionPool, mergeTabooDeck, normKey, parseWordList,
  questionsFromRows, tabooCardsFromRows, type ExtraRowLike,
} from './db-extras';
import { QUIZ_QUESTIONS_DE } from './questions-de';
import { TABOO_CARDS_DE } from './taboo-words-de';
import { HEADUP_CATEGORIES_DE } from './headup-words-de';
import { mergeHeadup, mergeQuestions, mergeTaboo } from '@/pages/admin/seedGameContent';

/**
 * Die drei Spiele lesen Admin-Zeilen ZUSÄTZLICH zum Grundstock. Zwei Dinge
 * dürfen nie passieren: dass der Grundstock schrumpft (dann wäre das Spiel
 * offline oder bei einer einzigen gepflegten Zeile leer), und dass eine
 * kaputte Zeile im Spiel landet.
 */
const row = (data: Record<string, unknown>, extra: Partial<ExtraRowLike> = {}): ExtraRowLike => ({ data, ...extra });

const question = (text: string, over: Record<string, unknown> = {}) =>
  row({ question: text, answer1: 'a', answer2: 'b', answer3: 'c', answer4: 'd', correctIndex: '2', ...over });

describe('Altlasten aus dem früheren Import', () => {
  it('am Apostroph abgeschnittene Texte kommen in keinem Spiel an', () => {
    expect(isDamaged('How many sets does a men\\')).toBe(true);
    expect(isDamaged("How many sets does a men's match have?")).toBe(false);
    expect(questionsFromRows([question('Quelle est la capitale de l\\'), question('Ok?', { answer2: 'l\\' })])).toEqual([]);
    expect(tabooCardsFromRows([row({ term: 'New Year\\', forbidden1: 'a', forbidden2: 'b' })])).toEqual([]);
    expect(parseWordList('Löwe, Rock\\, Tiger')).toEqual(['Löwe', 'Tiger']);
  });

  it('die Art des Apostrophs macht keinen neuen Eintrag', () => {
    expect(normKey('Emoji"s  beschrijven')).toBe(normKey("emoji's beschrijven"));
    expect(normKey('L’été')).toBe(normKey("l'été"));
  });
});

describe('Bombe — Zusatzfragen', () => {
  it('macht aus einer flachen Admin-Zeile eine spielbare Frage', () => {
    const [q] = questionsFromRows([{ ...question('Wie viele?'), category: 'Mathe', difficulty: 'hard' }]);
    expect(q).toMatchObject({ question: 'Wie viele?', answers: ['a', 'b', 'c', 'd'], correctIndex: 2, category: 'Mathe', difficulty: 'hard' });
    expect(q.id).toMatch(/^db-/);
  });

  it('verwirft Fragen, die das Spiel nicht darstellen könnte', () => {
    expect(questionsFromRows([
      question(''),
      question('Lücke?', { answer3: ' ' }),
      question('Index?', { correctIndex: '4' }),
      question('Index?', { correctIndex: 'x' }),
    ])).toEqual([]);
  });

  it('fehlende Schwierigkeit/Kategorie und fehlender Index bekommen Vorgaben', () => {
    const [q] = questionsFromRows([question('Ohne?', { correctIndex: undefined })]);
    expect(q).toMatchObject({ correctIndex: 0, category: 'general', difficulty: 'medium' });
  });

  it('der Grundstock bleibt vollständig; Neues kommt ans Ende, Dubletten fallen weg', () => {
    const base = QUIZ_QUESTIONS_DE;
    const extras = questionsFromRows([
      question(`  ${base[0].question.toUpperCase()} `),
      question('Ganz neue Frage?'),
      question('ganz  neue frage?'),
    ]);
    const pool = mergeQuestionPool(base, extras);
    expect(pool.slice(0, base.length)).toEqual(base);
    expect(pool.slice(base.length).map((q) => q.question)).toEqual(['Ganz neue Frage?']);
  });

  it('die Kopie des Grundstocks, wie sie in der Datenbank liegt, verändert den Pool nicht', () => {
    const copies = mergeQuestions({ de: QUIZ_QUESTIONS_DE }).map((s) => row(s.content.de, s));
    expect(mergeQuestionPool(QUIZ_QUESTIONS_DE, questionsFromRows(copies))).toEqual(QUIZ_QUESTIONS_DE);
  });
});

describe('Tabu — Zusatzkarten', () => {
  it('sammelt die Tabu-Wörter und verlangt mindestens zwei', () => {
    const cards = tabooCardsFromRows([
      row({ term: 'Lebkuchen', forbidden1: 'Weihnachten', forbidden2: '', forbidden3: 'backen' }, { category: 'Essen', difficulty: 'easy' }),
      row({ term: 'Einsam', forbidden1: 'allein' }),
      row({ term: '', forbidden1: 'x', forbidden2: 'y' }),
    ]);
    expect(cards).toEqual([{ term: 'Lebkuchen', forbidden: ['Weihnachten', 'backen'], category: 'Essen', difficulty: 'easy' }]);
  });

  it('der Grundstock bleibt vollständig; die Kopie aus der Datenbank fällt weg', () => {
    const copies = mergeTaboo({ de: TABOO_CARDS_DE }).map((s) => row(s.content.de, s));
    const extras = tabooCardsFromRows([...copies, row({ term: 'Wolpertinger', forbidden1: 'Bayern', forbidden2: 'Fabelwesen' })]);
    const deck = mergeTabooDeck(TABOO_CARDS_DE, extras);
    expect(deck.slice(0, TABOO_CARDS_DE.length)).toEqual(TABOO_CARDS_DE);
    expect(deck.slice(TABOO_CARDS_DE.length).map((c) => c.term)).toEqual(['Wolpertinger']);
  });
});

describe('Stirnraten — Zusatzkategorien', () => {
  const base = HEADUP_CATEGORIES_DE;

  it('liest kommagetrennte und zeilenweise Listen', () => {
    expect(parseWordList(' Eins, Zwei\nDrei ;; ,')).toEqual(['Eins', 'Zwei', 'Drei']);
  });

  it('Wörter zu einer eingebauten Kategorie kommen dort dazu, ohne Dubletten', () => {
    const target = base[1];
    const merged = mergeHeadupCategories(base, [
      row({ word: target.name.toUpperCase(), words: `${target.words[0]}, Wolpertinger, wolpertinger` }),
    ]);
    expect(merged).toHaveLength(base.length);
    expect(merged[1].id).toBe(target.id);
    expect(merged[1].words).toEqual([...target.words, 'Wolpertinger']);
    // Der Grundstock selbst wird nicht verändert.
    expect(base[1].words).not.toContain('Wolpertinger');
  });

  it('eine neue Kategorie erscheint am Ende — aber erst mit genug Wörtern', () => {
    const words = Array.from({ length: MIN_WORDS_NEW_CATEGORY }, (_, i) => `Wort ${i}`);
    const merged = mergeHeadupCategories(base, [
      row({ word: 'Weihnachten', words: words.slice(0, 4).join(', ') }),
      row({ word: 'weihnachten', words: words.slice(4).join(', ') }),
      row({ word: 'Zu klein', words: 'eins, zwei' }),
    ]);
    expect(merged).toHaveLength(base.length + 1);
    const fresh = merged[merged.length - 1];
    expect(fresh).toMatchObject({ name: 'Weihnachten', words });
    expect(fresh.id).toMatch(/^db-/);
    expect(fresh.emoji).toBeTruthy();
  });

  it('die Kopie des Grundstocks, wie sie in der Datenbank liegt, verändert nichts', () => {
    const copies = mergeHeadup({ de: base }).map((s) => row(s.content.de, s));
    const merged = mergeHeadupCategories(base, copies);
    expect(merged.map((c) => [c.id, c.words.length])).toEqual(base.map((c) => [c.id, c.words.length]));
  });

  it('leere oder namenlose Zeilen werden übergangen', () => {
    expect(mergeHeadupCategories(base, [row({ word: '', words: 'a, b' }), row({ word: 'Leer', words: ' , ' })])).toHaveLength(base.length);
  });
});
