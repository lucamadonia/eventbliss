import { describe, expect, it } from 'vitest';
import { BOTTLE_CARDS, EDITORIAL_CATEGORIES } from './bottlespin-content-de';
import { createBottleDeck, filterBottleCards } from './deck';
import { QUESTIONS, TASKS } from './editorial-de';

describe('German editorial collection', () => {
  it('contains 500 distinct authored questions and 100 distinct challenges across ten categories', () => {
    expect(EDITORIAL_CATEGORIES).toHaveLength(10);
    expect(BOTTLE_CARDS.filter(card => card.type === 'frage')).toHaveLength(500);
    expect(BOTTLE_CARDS.filter(card => card.type === 'aufgabe')).toHaveLength(100);
    expect(new Set(BOTTLE_CARDS.map(card => card.text.normalize('NFC').trim().toLocaleLowerCase('de'))).size).toBe(600);
    for (const category of EDITORIAL_CATEGORIES) {
      expect(QUESTIONS[category]).toHaveLength(50);
      expect(TASKS[category]).toHaveLength(10);
      expect(QUESTIONS[category].every(text => text.endsWith('?'))).toBe(true);
    }
  });
  it.each(EDITORIAL_CATEGORIES)('filters exactly the chosen theme and card type: %s', category => {
    const questions = filterBottleCards(BOTTLE_CARDS, [category], 'frage');
    const tasks = filterBottleCards(BOTTLE_CARDS, [category], 'aufgabe');
    expect(questions).toHaveLength(50);
    expect(tasks).toHaveLength(10);
    expect(questions.every(card => card.category === category && card.type === 'frage')).toBe(true);
    expect(tasks.every(card => card.category === category && card.type === 'aufgabe')).toBe(true);
    expect(filterBottleCards(BOTTLE_CARDS, [category], 'mixed')).toHaveLength(60);
  });
  it('combines selected categories without admitting unselected or legacy content', () => {
    const selected = filterBottleCards(BOTTLE_CARDS, ['liebe', 'reisen'], 'mixed');
    expect(selected).toHaveLength(120);
    expect(selected.every(card => ['liebe', 'reisen'].includes(card.category))).toBe(true);
    expect(filterBottleCards(BOTTLE_CARDS, [], 'mixed')).toEqual([]);
    expect(filterBottleCards(BOTTLE_CARDS, ['erwachsene'], 'mixed')).toEqual([]);
  });
});

describe('host deck lifecycle', () => {
  it('exhausts each selected card once and avoids the last card at the next cycle boundary', () => {
    const cards = filterBottleCards(BOTTLE_CARDS, ['kreativ'], 'aufgabe');
    const deck = createBottleDeck(cards, () => 0.42);
    let previous: unknown;
    for (let cycle = 0; cycle < 6; cycle++) {
      const drawn = Array.from({ length: cards.length }, () => deck.draw());
      expect(new Set(drawn).size).toBe(cards.length);
      expect(drawn.every(card => cards.includes(card!))).toBe(true);
      expect(drawn[0]).not.toBe(previous);
      previous = drawn.at(-1);
    }
  });
  it('preserves input content and handles single-card and empty decks safely', () => {
    expect(createBottleDeck([]).draw()).toBeUndefined();
    const card = BOTTLE_CARDS[0];
    const one = createBottleDeck([card]);
    expect(one.draw()).toBe(card);
    expect(one.draw()).toBe(card);
    const cards = Object.freeze(BOTTLE_CARDS.slice(0, 4));
    const deck = createBottleDeck(cards);
    Array.from({ length: 12 }, () => deck.draw());
    expect(cards).toEqual(BOTTLE_CARDS.slice(0, 4));
  });
  it('starts a complete independent deck on replay', () => {
    const cards = filterBottleCards(BOTTLE_CARDS, ['spass'], 'frage');
    const first = createBottleDeck(cards);
    Array.from({ length: 17 }, () => first.draw());
    const replay = createBottleDeck(cards);
    expect(new Set(Array.from({ length: cards.length }, () => replay.draw())).size).toBe(50);
  });
});
