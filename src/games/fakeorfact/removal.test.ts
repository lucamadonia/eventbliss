import { describe, it, expect } from 'vitest';
import { dropQuizPlayers } from './removal';

const p = (id: string, score = 0, streak = 0) => ({ id, score, streak });
const roster = () => [p('a', 100, 1), p('b', 200, 2), p('c', 0), p('d', 300, 3)];

describe('fake-or-fact removal mid-match', () => {
  it('ignores ids that are not in the roster', () => {
    expect(dropQuizPlayers({ phase: 'statement', players: roster(), currentPlayerIdx: 1, votes: [] }, ['x'])).toBeNull();
  });

  it('keeps the turn on the same person when someone else leaves (F13b: kicked player never gets a turn)', () => {
    const r = dropQuizPlayers({ phase: 'statement', players: roster(), currentPlayerIdx: 1, votes: [{ playerId: 'a', correct: true }] }, ['c'])!;
    expect(r.players.map(x => x.id)).toEqual(['a', 'b', 'd']);
    expect(r.players[r.currentPlayerIdx].id).toBe('b');
    expect(r.restartTurn).toBe(false);
    expect(r.reveal).toBe(false);
  });

  it('shifts the index when an earlier player leaves and drops their vote', () => {
    const r = dropQuizPlayers({ phase: 'statement', players: roster(), currentPlayerIdx: 2, votes: [{ playerId: 'a', correct: true }, { playerId: 'b', correct: false }] }, ['a'])!;
    expect(r.players[r.currentPlayerIdx].id).toBe('c');
    expect(r.votes.map(v => v.playerId)).toEqual(['b']);
  });

  it('passes the turn to the next player when the answering player is removed (F14)', () => {
    const r = dropQuizPlayers({ phase: 'statement', players: roster(), currentPlayerIdx: 1, votes: [{ playerId: 'a', correct: true }] }, ['b'])!;
    expect(r.players[r.currentPlayerIdx].id).toBe('c');
    expect(r.restartTurn).toBe(true);
    expect(r.reveal).toBe(false);
    expect(r.players.find(x => x.id === 'd')!.score).toBe(300);
  });

  it('settles the round when the last one in line is removed', () => {
    const votes = [{ playerId: 'a', correct: true }, { playerId: 'b', correct: false }, { playerId: 'c', correct: true }];
    const r = dropQuizPlayers({ phase: 'statement', players: roster(), currentPlayerIdx: 3, votes }, ['d'])!;
    expect(r.reveal).toBe(true);
    expect(r.players).toEqual([p('a', 200, 2), p('b', 200, 0), p('c', 100, 1)]);
  });

  it('removing the active player together with everyone after them settles the round', () => {
    const r = dropQuizPlayers({ phase: 'statement', players: roster(), currentPlayerIdx: 2, votes: [] }, ['c', 'd'])!;
    expect(r.reveal).toBe(true);
    expect(r.players.map(x => x.id)).toEqual(['a', 'b']);
  });

  it('leaves scores untouched outside the answering phase', () => {
    const r = dropQuizPlayers({ phase: 'reveal', players: roster(), currentPlayerIdx: 3, votes: [{ playerId: 'd', correct: true }] }, ['d'])!;
    expect(r.players).toEqual([p('a', 100, 1), p('b', 200, 2), p('c', 0)]);
    expect(r.reveal).toBe(false);
    expect(r.restartTurn).toBe(false);
    expect(r.votes).toEqual([]);
    expect(r.currentPlayerIdx).toBeGreaterThanOrEqual(0);
  });
});
