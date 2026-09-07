import { describe, expect, it } from 'vitest';
import { WORD_LANGUAGES, getWordPack, COLOR_HEX, generateWord, forbiddenWords, translateReactionWord, wordLanguage } from './word-content';

describe('localized reaction rules', () => {
  it.each(WORD_LANGUAGES)('%s has complete, unambiguous vocabulary', language => {
    const p = getWordPack(language);
    expect(p.animals).toHaveLength(20); expect(p.food).toHaveLength(20); expect(p.objects).toHaveLength(20); expect(p.colors).toHaveLength(10);
    const distractions = [...p.food, ...p.objects, ...p.colors];
    expect(p.animals.every(word => !distractions.includes(word))).toBe(true);
    for (const list of Object.values(p)) expect(new Set(list).size).toBe(list.length);
    expect(forbiddenWords(p).every(word => [...p.animals, ...distractions].includes(word))).toBe(true);
    expect(generateWord('kategorie', '', p, () => 0)).toEqual({ text: p.animals[0], isTarget: true });
    expect(generateWord('speed-rush', '', p, () => .99).isTarget).toBe(false);
    expect(generateWord('verboten', p.animals[0], p, () => 0).isTarget).toBe(false);
  });
  it.each(WORD_LANGUAGES)('%s keeps every Stroop label aligned with its color and preserves mismatches', language => {
    const p = getWordPack(language);
    for (let i = 0; i < p.colors.length; i++) {
      for (const match of [true, false]) {
        const values = [(i + .01) / 10, match ? 0 : .99, 0];
        const word = generateWord('stroop', '', p, () => values.shift()!);
        expect(word.text).toBe(p.colors[i]); expect(word.isTarget).toBe(match);
        expect(word.displayColor === COLOR_HEX[i]).toBe(match);
        for (const target of WORD_LANGUAGES) expect(translateReactionWord(word.text, language, target)).toBe(getWordPack(target).colors[i]);
      }
    }
  });
  it('handles regional locales and preserves unknown legacy words', () => {
    expect(wordLanguage('PT_br')).toBe('pt'); expect(wordLanguage('AR-sa')).toBe('ar');
    expect(translateReactionWord('Hund', 'de-CH', 'fr-CA')).toBe('Chien');
    expect(translateReactionWord('unlisted', 'de', 'ar')).toBe('unlisted');
  });
});
