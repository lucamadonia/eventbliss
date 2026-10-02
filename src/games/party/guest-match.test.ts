import { describe, expect, it } from 'vitest';
import { findSimilarGuest, levenshtein, normalizeName } from './guest-match';

const guests = [{ name: 'Max' }, { name: 'Oma Gerda' }, { name: 'Jürgen' }, { name: 'Lea' }];

describe('normalizeName', () => {
  it('drops case, diacritics and punctuation', () => {
    expect(normalizeName('  Jürgen-K. ')).toBe('jurgen k');
    expect(normalizeName('ÉLODIE')).toBe('elodie');
  });
});

describe('levenshtein', () => {
  it('counts edits', () => {
    expect(levenshtein('max', 'max')).toBe(0);
    expect(levenshtein('max', 'mxa')).toBe(2);
    expect(levenshtein('gerda', 'greta')).toBe(3);
  });
});

describe('findSimilarGuest', () => {
  it.each([
    ['max', 'Max'],
    ['Maxi', 'Max'],
    ['Max K.', 'Max'],
    ['MAX', 'Max'],
    ['juergen', 'Jürgen'],
    ['Jurgen', 'Jürgen'],
    ['Gerda', 'Oma Gerda'],
    ['Oma', 'Oma Gerda'],
    ['Oma Gredа'.replace('а', 'a'), 'Oma Gerda'],
    ['Lae', null],
  ])('%s → %s', (typed, expected) => {
    expect(findSimilarGuest(typed, guests)?.name ?? null).toBe(expected);
  });

  it('does not match unrelated short names', () => {
    expect(findSimilarGuest('Ben', [{ name: 'Jan' }])).toBeNull();
    expect(findSimilarGuest('Tom', [{ name: 'Lena' }])).toBeNull();
    expect(findSimilarGuest('Al', [{ name: 'Bo' }])).toBeNull();
  });

  it('tolerates one typo in short and two in long names', () => {
    expect(findSimilarGuest('Mex', [{ name: 'Max' }])?.name).toBe('Max');
    expect(findSimilarGuest('Sabrnia', [{ name: 'Sabrina' }])?.name).toBe('Sabrina');
  });

  it('prefers the exact match over a prefix match', () => {
    expect(findSimilarGuest('Max', [{ name: 'Maximilian' }, { name: 'max' }])?.name).toBe('max');
  });

  it('returns null without guests or name', () => {
    expect(findSimilarGuest('Max', [])).toBeNull();
    expect(findSimilarGuest('   ', guests)).toBeNull();
  });
});
