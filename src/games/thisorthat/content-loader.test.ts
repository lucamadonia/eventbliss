import { it, expect, vi } from 'vitest';
vi.mock('i18next', () => ({ default: { language: 'de' } }));
import i18n from 'i18next';
import { getTHISORTHAT_PAIRS } from './thisorthat-content';
it('loads a playable deck for all ten languages', () => {
  for (const lang of ['de','en','es','fr','it','nl','pl','pt','tr','ar']) {
    i18n.language = lang;
    const deck = getTHISORTHAT_PAIRS();
    expect(deck.length).toBeGreaterThan(10);
    expect(deck.every(pair => pair.optionA && pair.optionB)).toBe(true);
  }
});
