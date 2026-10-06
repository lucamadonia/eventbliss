import { describe, it, expect } from 'vitest';
import { dropOhrwurmPlayers, type RemovalState } from './removal';
import type { Participant, Song } from './ohrwurm-engine';

const card = (id: string, year: number) => ({ id, year } as unknown as Song);
const p = (id: string, cards = 1, hooks = 3): Participant => ({
  id, name: id, type: 'player', color: '#000', avatar: id,
  timeline: Array.from({ length: cards }, (_, i) => card(`${id}-${i}`, 1980 + i)), hooks,
});
const group = (id: string, members: string[], activeMemberId = members[0]): Participant => ({
  ...p(id), type: 'group', memberIds: members, memberNames: members,
  activeMemberId, nextMemberIndex: 1,
});
const state = (over: Partial<RemovalState> = {}): RemovalState => ({
  participants: [p('a'), p('b'), p('c'), p('d')], turn: 1, phase: 'place', counteringId: null, winTarget: 10, ...over,
});

describe('dropOhrwurmPlayers', () => {
  it('ignores ids that are not part of the match', () => {
    expect(dropOhrwurmPlayers(state(), ['zz'])).toBeNull();
  });

  it('drops a normal player and keeps the active player on turn', () => {
    const r = dropOhrwurmPlayers(state({ turn: 2 }), ['a'])!;
    expect(r.kind).toBe('keep');
    expect(r.participants.map((x) => x.id)).toEqual(['b', 'c', 'd']);
    expect(r.participants[r.turn].id).toBe('c');
  });

  it('hands the turn to the next present player and returns the drawn song when the active player leaves mid-round', () => {
    for (const phase of ['draw', 'place', 'counter', 'counterPlace'] as const) {
      const r = dropOhrwurmPlayers(state({ phase, counteringId: 'c' }), ['b'])!;
      expect(r).toMatchObject({ kind: 'restartTurn', returnSong: true });
      expect(r.participants[r.turn].id).toBe('c');
    }
  });

  it('skips over several removed players and wraps around', () => {
    const r = dropOhrwurmPlayers(state({ turn: 3, phase: 'draw' }), ['d', 'a'])!;
    expect(r.kind).toBe('restartTurn');
    expect(r.participants[r.turn].id).toBe('b');
  });

  it('moves on without returning the already scored card when the active player leaves during reveal', () => {
    const r = dropOhrwurmPlayers(state({ phase: 'reveal' }), ['b'])!;
    expect(r).toMatchObject({ kind: 'restartTurn', returnSong: false });
    expect(r.participants[r.turn].id).toBe('c');
  });

  it('ends the match when a remaining player already reached the target during reveal', () => {
    const r = dropOhrwurmPlayers(state({ phase: 'reveal', participants: [p('a'), p('b'), p('c', 10)] }), ['b'])!;
    expect(r).toMatchObject({ kind: 'gameOver', winnerId: 'c' });
  });

  it('reopens the counter window when the countering player leaves', () => {
    const r = dropOhrwurmPlayers(state({ phase: 'counterPlace', counteringId: 'c' }), ['c'])!;
    expect(r.kind).toBe('reopenCounter');
    expect(r.participants[r.turn].id).toBe('b');
  });

  it('resolves without counter when nobody left can counter', () => {
    const participants = [p('a', 1, 0), p('b'), p('c', 1, 2)];
    expect(dropOhrwurmPlayers(state({ participants, phase: 'counterPlace', counteringId: 'c' }), ['c'])!.kind).toBe('resolveNoCounter');
    expect(dropOhrwurmPlayers(state({ participants, phase: 'counter' }), ['c'])!.kind).toBe('resolveNoCounter');
  });

  it('only shortens the roster outside a running round', () => {
    const r = dropOhrwurmPlayers(state({ phase: 'gameOver' }), ['b'])!;
    expect(r.kind).toBe('keep');
    expect(r.participants.map((x) => x.id)).toEqual(['a', 'c', 'd']);
  });

  it('keeps a team and its timeline when a non-acting member leaves', () => {
    const teams = [group('team-a', ['a1', 'a2']), group('team-b', ['b1', 'b2'])];
    const result = dropOhrwurmPlayers(state({ participants: teams, turn: 0 }), ['a2'])!;
    expect(result.kind).toBe('keep');
    expect(result.participants[0].memberIds).toEqual(['a1']);
    expect(result.participants[0].timeline).toBe(teams[0].timeline);
  });

  it('restarts the same team when its acting member leaves mid-turn', () => {
    const result = dropOhrwurmPlayers(state({ participants: [group('team-a', ['a1', 'a2']), group('team-b', ['b1'])], turn: 0 }), ['a1'])!;
    expect(result).toMatchObject({ kind: 'restartTurn', returnSong: true, turn: 0 });
    expect(result.participants[0].activeMemberId).toBe('a2');
  });

  it('removes an empty team and reopens a counter held by a departed member', () => {
    const teams = [group('team-a', ['a1']), group('team-b', ['b1', 'b2'])];
    expect(dropOhrwurmPlayers(state({ participants: teams, turn: 0 }), ['a1'])!.participants.map((x) => x.id)).toEqual(['team-b']);
    const counter = dropOhrwurmPlayers(state({ participants: teams, turn: 0, phase: 'counterPlace', counteringId: 'team-b' }), ['b1'])!;
    expect(counter.kind).toBe('reopenCounter');
    expect(counter.participants[1].memberIds).toEqual(['b2']);
  });
});
