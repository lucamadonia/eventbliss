import type { PlayerSetupPlayer } from '../ui/PlayerSetup';
import { getPlayerColor } from '../ui/PlayerAvatars';

export const HIT_TEAM_IDS = ['A', 'B', 'C', 'D'] as const;

export function teamForPlayer(playerId: string, index: number, assignments: Record<string, string>, teamCount: number): string {
  const available = HIT_TEAM_IDS.slice(0, teamCount);
  return available.includes(assignments[playerId] as typeof HIT_TEAM_IDS[number])
    ? assignments[playerId] : available[index % available.length];
}

/** Import chosen event guests while retaining names the host entered by hand. */
export function mergeEventPlayers(previous: PlayerSetupPlayer[], names: string[], makeId: () => string): PlayerSetupPlayer[] {
  const kept = previous.filter(player => player.name.trim() && !/^(Spieler|Gruppe|Player|Group) \d+$/i.test(player.name.trim())
    && !['Du', 'You'].includes(player.name.trim()));
  const next = [...kept];
  const existing = new Set(kept.map(player => player.name.trim().toLocaleLowerCase()));
  for (const rawName of names) {
    const name = rawName.trim().slice(0, 16);
    if (next.length >= 20) break;
    if (!name || existing.has(name.toLocaleLowerCase())) continue;
    next.push({ id: makeId(), name, color: getPlayerColor(next.length), avatar: name.charAt(0) });
    existing.add(name.toLocaleLowerCase());
  }
  while (next.length < 2) next.push({ id: makeId(), name: '' });
  return next;
}
