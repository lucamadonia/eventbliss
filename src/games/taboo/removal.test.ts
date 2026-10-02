import { describe, expect, it } from 'vitest';
import { dropTabooPlayers, teamIndexOf } from './removal';

const team = (score: number, ...ids: string[]) => ({ score, ids, players: ids.map(id => id.toUpperCase()) });
const teams = () => [team(3, 'a1', 'a2', 'a3'), team(5, 'b1', 'b2', 'b3')] as [ReturnType<typeof team>, ReturnType<typeof team>];

describe('taboo: removing a player mid-match', () => {
  it('is a no-op when nobody of the teams was removed', () => {
    expect(dropTabooPlayers(teams(), 0, [1, 0], 'playing', ['x'])).toBeNull();
  });
  it('is a no-op for local teams without ids', () => {
    expect(dropTabooPlayers([{ players: ['A', 'B'] }, { players: ['C', 'D'] }], 0, [0, 0], 'playing', ['A'])).toBeNull();
  });
  it('drops a teammate, keeps names/ids aligned, scores and the explainer', () => {
    const drop = dropTabooPlayers(teams(), 0, [2, 1], 'playing', ['a1', 'b3'])!;
    expect(drop.teams[0]).toEqual({ score: 3, ids: ['a2', 'a3'], players: ['A2', 'A3'] });
    expect(drop.teams[1]).toEqual({ score: 5, ids: ['b1', 'b2'], players: ['B1', 'B2'] });
    expect(drop.teams[0].ids![drop.explainerIdx[0]]).toBe('a3');
    expect(drop.teams[1].ids![drop.explainerIdx[1]]).toBe('b2');
    expect(drop.phase).toBe('playing');
  });
  it('ends the running turn when the explainer leaves; the next teammate explains next time', () => {
    const drop = dropTabooPlayers(teams(), 0, [1, 0], 'playing', ['a2'])!;
    expect(drop.phase).toBe('turnSummary');
    // endTurn advances the active team's pointer by one
    const next = (drop.explainerIdx[0] + 1) % drop.teams[0].players.length;
    expect(drop.teams[0].ids![next]).toBe('a3');
  });
  it('lets the next teammate take over before the turn has started', () => {
    const drop = dropTabooPlayers(teams(), 1, [0, 2], 'turnStart', ['b3'])!;
    expect(drop.phase).toBe('turnStart');
    expect(drop.teams[1].ids![drop.explainerIdx[1]]).toBe('b1');
  });
  it('re-points the other team when its upcoming explainer (the referee) leaves', () => {
    const drop = dropTabooPlayers(teams(), 0, [0, 1], 'playing', ['b2'])!;
    expect(drop.phase).toBe('playing');
    expect(drop.teams[1].ids![drop.explainerIdx[1]]).toBe('b3');
  });
  it('ends the match gracefully when a team becomes empty', () => {
    const drop = dropTabooPlayers(teams(), 0, [0, 0], 'turnStart', ['b1', 'b2', 'b3'])!;
    expect(drop.phase).toBe('gameOver');
    expect(drop.teams[1].players).toEqual([]);
    expect(drop.teams.map(t => t.score)).toEqual([3, 5]);
  });
});

describe('taboo: every team keeps an explainer and a guesser', () => {
  it('moves one player from the larger team when a team drops to 1', () => {
    const drop = dropTabooPlayers(teams(), 1, [2, 0], 'turnStart', ['a1', 'a2'])!;
    expect(drop.teams[0].ids).toEqual(['a3', 'b3']);
    expect(drop.teams[1].ids).toEqual(['b1', 'b2']);
    expect(drop.teams[0].players).toEqual(['A3', 'B3']);
    expect(drop.moved).toEqual(['B3']);
    expect(drop.teams[1].ids![drop.explainerIdx[1]]).toBe('b1'); // the larger team's next explainer stays
    expect(drop.teams.map(t => t.score)).toEqual([3, 5]);
    expect(drop.phase).toBe('turnStart');
  });
  it('never moves the next explainer of the donor team', () => {
    const drop = dropTabooPlayers([team(0, 'a1', 'a2'), team(0, 'b1', 'b2', 'b3', 'b4')], 0, [0, 3], 'turnStart', ['a2'])!;
    expect(drop.teams[0].ids).toEqual(['a1', 'b3']);
    expect(drop.teams[1].ids![drop.explainerIdx[1]]).toBe('b4');
  });
  it('refills a team that lost everyone when enough players remain', () => {
    const drop = dropTabooPlayers([team(1, 'a1', 'a2'), team(2, 'b1', 'b2', 'b3', 'b4')], 1, [0, 0], 'playing', ['a1', 'a2'])!;
    expect(drop.teams.map(t => t.ids!.length)).toEqual([2, 2]);
    expect(drop.phase).toBe('playing');
  });
  it('ends the match cleanly when fewer than 4 players remain', () => {
    const drop = dropTabooPlayers([team(1, 'a1', 'a2'), team(2, 'b1', 'b2')], 0, [0, 0], 'playing', ['b2'])!;
    expect(drop.phase).toBe('gameOver');
    expect(drop.moved).toEqual([]);
  });
});

describe('taboo: team of a room player', () => {
  it('uses ids when present, else the half split', () => {
    expect(teamIndexOf(teams(), 'b2', 0, 6)).toBe(1);
    expect(teamIndexOf([{ players: [] }, { players: [] }], 'x', 1, 4)).toBe(0);
    expect(teamIndexOf([{ players: [] }, { players: [] }], 'x', 2, 4)).toBe(1);
  });
});
