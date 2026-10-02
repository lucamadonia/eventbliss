import { describe, expect, it } from 'vitest';
import { dropCategoryPlayers } from './removal';

const players = ['host', 'lena', 'max', 'gerda'].map((id, i) => ({ id, score: i }));

describe('category: removing a player mid-match', () => {
  it('is a no-op when nobody of the circle was removed', () => {
    expect(dropCategoryPlayers(players, 1, 'playing', ['someone-else'])).toBeNull();
  });
  it('keeps the current answerer when someone else leaves, scores intact', () => {
    const drop = dropCategoryPlayers(players, 2, 'playing', ['lena'])!;
    expect(drop.players).toEqual([{ id: 'host', score: 0 }, { id: 'max', score: 2 }, { id: 'gerda', score: 3 }]);
    expect(drop.players[drop.currentPlayerIndex].id).toBe('max');
    expect(drop.restartTurn).toBe(false);
  });
  it('hands the turn to the next player with a fresh timer when the answerer leaves', () => {
    const drop = dropCategoryPlayers(players, 2, 'playing', ['max'])!;
    expect(drop.players[drop.currentPlayerIndex].id).toBe('gerda');
    expect(drop.restartTurn).toBe(true);
  });
  it('wraps around when the last player in the order was answering', () => {
    const drop = dropCategoryPlayers(players, 3, 'playing', ['gerda'])!;
    expect(drop.players[drop.currentPlayerIndex].id).toBe('host');
  });
  it('only re-points the seat outside of a running turn', () => {
    const drop = dropCategoryPlayers(players, 1, 'roundEnd', ['lena', 'max'])!;
    expect(drop.players.map(p => p.id)).toEqual(['host', 'gerda']);
    expect(drop.players[drop.currentPlayerIndex].id).toBe('gerda');
    expect(drop.restartTurn).toBe(false);
  });
  it('never returns a negative index when everybody left', () => {
    expect(dropCategoryPlayers(players, 0, 'playing', ['host', 'lena', 'max', 'gerda'])).toMatchObject({ players: [], currentPlayerIndex: 0, restartTurn: false });
  });
});
