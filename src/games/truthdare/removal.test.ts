import { describe, it, expect } from 'vitest';
import { dropTruthDarePlayers, scoreVote } from './removal';

const p = (id: string, score = 0) => ({ id, score, truthCount: 0, dareCount: 0 });
const roster = () => [p('a', 3), p('b', 5), p('c', 1), p('d', 2)];
const state = (over: Partial<Parameters<typeof dropTruthDarePlayers>[0]> = {}) => ({
  phase: 'reveal', players: roster(), activeIdx: 1, spinTarget: 1, turnQueue: [3, 0, 2],
  votes: {}, voterIdx: 0, choiceType: 'dare' as const, ...over,
});

describe('scoreVote', () => {
  it('awards a passed dare 2 points and counts it', () => {
    expect(scoreVote(roster(), 1, { a: true, c: true, d: false }, 'dare')[1]).toEqual({ id: 'b', score: 7, truthCount: 0, dareCount: 1 });
  });
  it('a tie fails', () => {
    expect(scoreVote(roster(), 1, { a: true, c: false }, 'dare')[1].score).toBe(5);
  });
});

describe('truth-or-dare removal mid-match', () => {
  it('ignores ids that are not in the roster', () => {
    expect(dropTruthDarePlayers(state(), ['x'])).toBeNull();
  });

  it('keeps active player, wheel target and turn queue on the same people', () => {
    const r = dropTruthDarePlayers(state(), ['a'])!;
    expect(r.players.map(x => x.id)).toEqual(['b', 'c', 'd']);
    expect(r.players[r.activeIdx].id).toBe('b');
    expect(r.players[r.spinTarget].id).toBe('b');
    expect(r.turnQueue.map(i => r.players[i].id)).toEqual(['d', 'c']);
    expect(r.endTurn).toBe(false);
  });

  it('ends the turn without points when the active player is removed', () => {
    const r = dropTruthDarePlayers(state(), ['b'])!;
    expect(r.endTurn).toBe(true);
    expect(r.players).toEqual([p('a', 3), p('c', 1), p('d', 2)]);
  });

  it('does not end anything while the wheel is idle', () => {
    const r = dropTruthDarePlayers(state({ phase: 'spin' }), ['b'])!;
    expect(r.endTurn).toBe(false);
  });

  it('re-targets a running spin to the next remaining player', () => {
    const r = dropTruthDarePlayers(state({ phase: 'spin', spinTarget: 2 }), ['c'])!;
    expect(r.players[r.spinTarget].id).toBe('d');
  });

  it('skips a removed voter who has not voted yet', () => {
    // others of b: a, c, d — a voted, c is up and gets removed → d votes next.
    const r = dropTruthDarePlayers(state({ phase: 'vote', votes: { a: true }, voterIdx: 1 }), ['c'])!;
    expect(r.endTurn).toBe(false);
    const others = r.players.filter((_, i) => i !== r.activeIdx);
    expect(others[r.voterIdx].id).toBe('d');
  });

  it('drops the vote of a removed voter and keeps the pointer on the current voter', () => {
    const r = dropTruthDarePlayers(state({ phase: 'vote', votes: { a: true }, voterIdx: 1 }), ['a'])!;
    expect(r.votes).toEqual({});
    const others = r.players.filter((_, i) => i !== r.activeIdx);
    expect(others[r.voterIdx].id).toBe('c');
  });

  it('closes the vote when the last pending voter is removed and scores the rest', () => {
    const r = dropTruthDarePlayers(state({ phase: 'vote', votes: { a: true, c: true }, voterIdx: 2 }), ['d'])!;
    expect(r.endTurn).toBe(true);
    expect(r.players.find(x => x.id === 'b')).toEqual({ id: 'b', score: 7, truthCount: 0, dareCount: 1 });
    expect(r.players.find(x => x.id === 'a')!.score).toBe(3);
  });
});
