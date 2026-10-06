import { PLAYER_COLORS, type OhrwurmTeam, type SetupPlayer } from './ohrwurm-theme';
import type { Participant } from './ohrwurm-engine';

export const MIN_OHRWURM_TEAMS = 2;
export const MAX_OHRWURM_TEAMS = 4;
export const MAX_OHRWURM_PEOPLE = 20;

export function buildOhrwurmTeams(
  players: readonly SetupPlayer[],
  count: number,
  assignments: Readonly<Record<string, number>>,
  names: readonly string[],
): OhrwurmTeam[] {
  return Array.from({ length: count }, (_, index) => {
    const members = players.filter((player, playerIndex) =>
      (assignments[player.id] ?? playerIndex % count) === index,
    );
    return {
      id: `ohrwurm-team-${index + 1}`,
      name: (names[index] ?? '').trim(),
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      avatar: String.fromCharCode(65 + index),
      memberIds: members.map((member) => member.id),
      memberNames: members.map((member) => member.name.trim()),
    };
  });
}

export function ohrwurmSeat(participant: Pick<Participant, 'id' | 'activeMemberId'> | null | undefined): string | null {
  return participant?.activeMemberId ?? participant?.id ?? null;
}

/** Every team turn goes to its next member, including after a rematch. */
export function advanceOhrwurmTeamTurn(participants: readonly Participant[], index: number): Participant[] {
  return participants.map((participant, i) => {
    if (i !== index || !participant.memberIds?.length) return participant;
    const cursor = participant.nextMemberIndex ?? 0;
    return {
      ...participant,
      activeMemberId: participant.memberIds[cursor % participant.memberIds.length],
      nextMemberIndex: (cursor + 1) % participant.memberIds.length,
    };
  });
}
