import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GAME_CUES } from './index';

/**
 * Kein Cue darf ein Geheimnis auf den Fernseher bringen — egal welches Spiel.
 * Jeder registrierte Cue bekommt einen Zustand voller „geheimer“ Felder mit
 * Spuerwerten und wird fuer viele typische Phasen abgefragt.
 */
const SECRET = 'SECRET_SENTINEL_42';
const SECRET_FIELDS = [
  'word', 'secretWord', 'solution', 'answer', 'correctAnswer', 'term', 'target', 'role', 'roles', 'secret',
  'isImpostor', 'impostorId', 'votedFor', 'votes', 'myRole', 'hint', 'card', 'cardText', 'song', 'songTitle',
  'artist', 'image', 'imageUrl', 'emoji', 'emojis', 'whoAmI', 'identity', 'forbidden', 'taboo', 'guess', 'guesses',
];
const PHASES = [
  'setup', 'lobby', 'intro', 'wordReveal', 'roleReveal', 'reveal', 'discussion', 'voting', 'vote', 'revealCountdown',
  'playing', 'turn', 'guessing', 'drawing', 'question', 'answer', 'answering', 'results', 'result', 'roundEnd',
  'spinning', 'card', 'debate', 'countdown', 'explaining', 'acting', 'writing', 'gameOver', 'leaderboard',
];

function secretState(phase: string) {
  const state: Record<string, unknown> = { phase, round: 2, totalRounds: 5, currentRound: 2 };
  for (const f of SECRET_FIELDS) state[f] = SECRET;
  state.players = [{ id: 'p', name: 'Lena', isImpostor: true, role: SECRET, word: SECRET, votedFor: SECRET }];
  return state;
}

describe('cue secrets', () => {
  it('has registered cues', () => {
    expect(GAME_CUES.size).toBeGreaterThan(0);
  });
  it.each([...GAME_CUES.keys()])('%s never puts a secret on the TV', (game) => {
    const fn = GAME_CUES.get(game)!;
    for (const phase of PHASES) {
      expect(JSON.stringify(fn(phase, secretState(phase)) ?? null), `${game}/${phase}`).not.toContain(SECRET);
    }
  });
});

describe('cue texts exist in every language', () => {
  const keys = new Set<string>();
  for (const fn of GAME_CUES.values()) {
    for (const phase of PHASES) {
      const cue = fn(phase, { phase, round: 2, totalRounds: 5, currentRound: 2, selectedName: 'Sara', optionA: 'A', optionB: 'B', name: 'Lena' });
      for (const part of [cue?.eyebrow, cue?.title, cue?.subtitle]) if (part) keys.add(part.key);
    }
  }
  it.each(['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'pl', 'tr', 'ar'])('%s.json has every cue key', (code) => {
    const tree = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../../i18n/locales/${code}.json`), 'utf8')) as Record<string, unknown>;
    const get = (k: string) => k.split('.').reduce<unknown>((n, p) => (n && typeof n === 'object' ? (n as Record<string, unknown>)[p] : undefined), tree);
    expect([...keys].filter((k) => typeof get(k) !== 'string')).toEqual([]);
  });
});
