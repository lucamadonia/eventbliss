import * as playable from '@/lib/playable-games';
import type { PartyGuestSeat } from './party-access';

/** How a game handles 🔁 guests sharing the host's phone (masterplan §7). */
export type GuestPolicy = 'turns' | 'sequential' | 'secret' | 'team' | 'sitout';

/** Structural subset of ControllerMember so this stays pure and testable. */
export interface SeatMember {
  player_id: string;
  name?: string;
  is_host?: boolean;
  user_id?: string | null;
  avatar?: string | null;
  color?: string | null;
  /** Host player_id for 🔁 guests, null for 📱 seats. */
  controlled_by?: string | null;
  banned?: boolean;
}

const GUEST_COLORS = ['#df8eff', '#ff6b98', '#8ff5ff', '#f9ca24', '#00b894', '#6c5ce7', '#fd79a8', '#e17055'];

/** Uses `guestPolicy` from playable-games once it exists; unadapted games sit out. */
export function resolveGuestPolicy(gameId: string): GuestPolicy {
  // Dynamic key: the export lands in a parallel change; avoid a bundler missing-export warning.
  const key = 'guestPolicy';
  const lookup = (playable as unknown as Record<string, unknown>)[key] as ((id: string) => GuestPolicy) | undefined;
  return typeof lookup === 'function' ? lookup(gameId) : 'sitout';
}

export const isGuestSeat = (member: SeatMember): boolean => !!member.controlled_by;

/**
 * Splits the party's seats into match participants and guests who sit this game
 * out. Banned seats never play; a non-playing host moderates but its guests may.
 * Order follows the server member order so every device sees the same turns.
 */
export function matchParticipants(
  members: readonly SeatMember[], gameId: string, hostPlays: boolean,
  policy: (gameId: string) => GuestPolicy = resolveGuestPolicy,
): { participantIds: string[]; sittingOut: string[] } {
  const guestsPlay = policy(gameId) !== 'sitout';
  const participantIds: string[] = [], sittingOut: string[] = [];
  for (const member of members) {
    if (member.banned || (member.is_host && !hostPlays)) continue;
    if (isGuestSeat(member) && !guestsPlay) sittingOut.push(member.player_id);
    else participantIds.push(member.player_id);
  }
  return { participantIds, sittingOut };
}

/** Guest seats for PartyRoomAccess.guests (controller-session builds access from server data). */
export function guestSeats(members: readonly SeatMember[]): PartyGuestSeat[] {
  return members.filter(member => isGuestSeat(member) && !member.banned).map((member, index) => {
    const name = (member.name ?? '').trim().slice(0, 40) || 'Gast';
    return { id: member.player_id, name, controlledBy: member.controlled_by!,
      avatar: member.avatar || name.slice(0, 1).toUpperCase(),
      color: member.color || GUEST_COLORS[index % GUEST_COLORS.length] };
  });
}

/** This device's own id plus the guests it controls. */
export function localPlayerIdsFor(players: readonly { id: string; controlledBy?: string }[], myPlayerId: string): string[] {
  if (!myPlayerId) return [];
  return [myPlayerId, ...players.filter(p => p.controlledBy === myPlayerId && p.id !== myPlayerId).map(p => p.id)];
}
