import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CUE_GAMES, PHASE_CARD_MS, phaseCueFor, remainingCardMs } from './tv-phase-cues';

describe('phaseCueFor', () => {
  it('maps the impostor phases to title cards with the round in the key', () => {
    expect(phaseCueFor('impostor', { phase: 'wordReveal', round: 2 })).toMatchObject({ key: 'impostor:2:roles', card: true, sound: 'reveal' });
    expect(phaseCueFor('impostor', { phase: 'discussion', round: 2 })).toMatchObject({ key: 'impostor:2:discussion', card: true });
    expect(phaseCueFor('impostor', { phase: 'voting', round: 2 })?.title?.fallback).toBe('Abstimmung');
    expect(phaseCueFor('impostor', { phase: 'revealCountdown', round: 2 })).toMatchObject({ card: false, sound: 'drumroll' });
    expect(phaseCueFor('impostor', { phase: 'reveal', round: 2 })).toBeNull();
  });

  it('never puts secrets on an impostor card', () => {
    const state = { phase: 'discussion', round: 1, players: [{ name: 'Tom', isImpostor: true }], word: 'Banane' };
    const json = JSON.stringify(phaseCueFor('impostor', state));
    expect(json).not.toContain('Tom');
    expect(json).not.toContain('Banane');
  });

  it('bottle: vote card names the public selected player, the card itself is sound-only', () => {
    expect(phaseCueFor('bottlespin', { phase: 'vote', currentRound: 3, selectedName: 'Sara' })?.subtitle?.params).toEqual({ name: 'Sara' });
    expect(phaseCueFor('bottlespin', { phase: 'card', currentRound: 3 })).toMatchObject({ card: false, sound: 'reveal' });
    expect(phaseCueFor('bottlespin', { phase: 'spinning' })).toBeNull();
  });

  it('this-or-that: a card per round, the reveal is sound-only', () => {
    const v = phaseCueFor('thisorthat', { phase: 'voting', round: 3, totalRounds: 8, optionA: 'Pizza', optionB: 'Sushi' });
    expect(v).toMatchObject({ key: 'tot:3:voting', card: true });
    expect(v?.eyebrow?.params).toEqual({ round: 3, total: 8 });
    expect(v?.subtitle?.params).toEqual({ a: 'Pizza', b: 'Sushi' });
    expect(phaseCueFor('thisorthat', { phase: 'reveal', round: 3 })).toMatchObject({ card: false, sound: 'reveal' });
  });

  it('ignores other games and empty states', () => {
    expect(phaseCueFor('bomb', { phase: 'voting' })).toBeNull();
    expect(phaseCueFor('impostor', null)).toBeNull();
    expect(phaseCueFor('impostor', { round: 1 })).toBeNull();
    expect(CUE_GAMES.has('impostor')).toBe(true);
  });
});

describe('remainingCardMs (scene clock)', () => {
  it('plays the full card without a start time or when the phase just began', () => {
    expect(remainingCardMs(null)).toBe(PHASE_CARD_MS);
    expect(remainingCardMs(-50)).toBe(PHASE_CARD_MS);
  });
  it('shortens for a late TV and skips once the moment is over', () => {
    expect(remainingCardMs(500)).toBe(PHASE_CARD_MS - 500);
    expect(remainingCardMs(PHASE_CARD_MS + 1)).toBe(0);
  });
});

describe('cue texts exist in every language', () => {
  const states: [string, Record<string, unknown>][] = [
    ['impostor', { phase: 'wordReveal' }], ['impostor', { phase: 'discussion' }], ['impostor', { phase: 'voting' }],
    ['bottlespin', { phase: 'vote', selectedName: 'Sara' }], ['bottlespin', { phase: 'vote' }],
    ['thisorthat', { phase: 'voting', totalRounds: 8, optionA: 'A', optionB: 'B' }], ['thisorthat', { phase: 'voting' }], ['thisorthat', { phase: 'debate' }],
  ];
  const keys = new Set<string>();
  for (const [game, state] of states) {
    const cue = phaseCueFor(game, state);
    for (const part of [cue?.eyebrow, cue?.title, cue?.subtitle]) if (part) keys.add(part.key);
  }
  it.each(['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'pl', 'tr', 'ar'])('%s.json has all cue keys', (code) => {
    const tree = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../i18n/locales/${code}.json`), 'utf8')) as Record<string, unknown>;
    const get = (k: string) => k.split('.').reduce<unknown>((n, p) => (n && typeof n === 'object' ? (n as Record<string, unknown>)[p] : undefined), tree);
    expect([...keys].filter((k) => typeof get(k) !== 'string')).toEqual([]);
  });
});
