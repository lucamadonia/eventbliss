import { describe, expect, it } from 'vitest';
import type { Participant } from './ohrwurm-engine';
import type { SetupPlayer } from './ohrwurm-theme';
import { advanceOhrwurmTeamTurn, buildOhrwurmTeams, ohrwurmSeat } from './teams';

const players: SetupPlayer[] = Array.from({ length: 9 }, (_, index) => ({
  id: `p${index + 1}`, name: `Person ${index + 1}`, color: '#fff', avatar: 'P',
}));

describe('Ohrwurm teams', () => {
  it('assigns all nine people to two real teams and allows a manual move', () => {
    const teams = buildOhrwurmTeams(players, 2, { p1: 1 }, ['Team A', 'Team B']);
    expect(teams.map((team) => team.memberIds.length)).toEqual([4, 5]);
    expect(teams.flatMap((team) => team.memberIds).sort()).toEqual(players.map((p) => p.id).sort());
    expect(teams[1].memberNames).toContain('Person 1');
  });

  it('rotates the acting member while preserving a shared score and hooks', () => {
    const first: Participant = {
      ...buildOhrwurmTeams(players.slice(0, 3), 2, {}, ['A', 'B'])[0],
      type: 'group', timeline: [], hooks: 3, activeMemberId: 'p1', nextMemberIndex: 0,
    };
    const other: Participant = { ...first, id: 'other', memberIds: ['p2'], activeMemberId: 'p2' };
    const one = advanceOhrwurmTeamTurn([first, other], 0);
    const two = advanceOhrwurmTeamTurn(one, 0);
    expect(ohrwurmSeat(one[0])).toBe('p1');
    expect(ohrwurmSeat(two[0])).toBe('p3');
    expect(two[0].timeline).toBe(first.timeline);
    expect(two[0].hooks).toBe(3);
    expect(two[1]).toBe(other);
  });
});
