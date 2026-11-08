import type { TeamMap } from '../pantomime/pantomime-teams';

export interface QuickDrawTeam {
  id: string;
  name: string;
  color: string;
  score: number;
  members: { id: string; name: string }[];
  memberNames: string[];
  players: string[];
}

/** Team points are the sum of existing player points; turns and awards stay intact. */
export function quickDrawTeams(
  players: readonly { id: string; name: string; score: number }[],
  teamOf: TeamMap,
  names: readonly string[],
): QuickDrawTeam[] {
  return ([0, 1] as const).map((index) => {
    const members = players.filter((player) => teamOf[player.id] === index);
    return {
      id: `quickdraw-team-${index + 1}`,
      name: names[index]?.trim() || `Team ${index + 1}`,
      color: index === 0 ? '#77cbbb' : '#df8eff',
      score: members.reduce((total, player) => total + player.score, 0),
      members: members.map(({ id, name }) => ({ id, name })),
      memberNames: members.map(({ name }) => name),
      players: members.map(({ name }) => name),
    };
  });
}
