import type { PlayableGame } from '@/lib/playable-games';
import type { PartyRoomAccess } from './party-access';
import type { RoomPlayer } from './room-types';
import { matchParticipants } from './participants';
import { roomGameAvailability } from './room-availability';

/**
 * Host-side start plan: who plays and which guests sit out, or null when this
 * roster must not start the game (someone not ready, a member not connected,
 * or the game unavailable for this roster — same rule as every picker).
 */
export function planMatch(players: readonly RoomPlayer[], hostId: string, access: PartyRoomAccess | null, game: PlayableGame):
  { participantIds: string[]; sittingOut: string[] } | null {
  const humans = players.filter(p => !p.controlledBy && (!access || access.hostPlays || p.id !== hostId));
  if (humans.some(p => !p.isReady)) return null;
  let plan = { participantIds: humans.map(p => p.id), sittingOut: [] as string[] };
  if (access) {
    const guests = new Map((access.guests ?? []).map(guest => [guest.id, guest.controlledBy]));
    // Every account seat must be connected; guests ride on the host device.
    if (humans.length !== access.memberIds.filter(id => !guests.has(id) && (access.hostPlays || id !== hostId)).length) return null;
    plan = matchParticipants(access.memberIds.map(id => ({ player_id: id, is_host: id === access.hostId, controlled_by: guests.get(id) ?? null })), game.id, access.hostPlays);
  }
  const count = plan.participantIds.length;
  if (count < Math.max(2, game.minPlayers) || count > game.maxPlayers) return null;
  const availability = roomGameAvailability(game.id, players, hostId, { controllerParty: !!access, hostPlays: access?.hostPlays,
    hostPremium: access ? access.premium : players.some(p => p.isPremium) });
  return availability.startable ? plan : null;
}
