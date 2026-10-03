import { playableGames } from '@/lib/playable-games';
import type { GameRoom, RoomPlayer } from './room-types';
import type { PartyGuestSeat, PartyRoomAccess } from './party-access';
import { avatarOrFallback } from './seat-avatar';

/**
 * Party seats that live inside the host's signed room state (`room.settings`):
 * - `guests`: 🔁 seats announced by the host device (no presence of their own)
 * - `sittingOut`: guests excluded from the running match (guestPolicy 'sitout')
 * - `removedPlayerIds`: participants dropped mid-match after a server kick/leave
 */
const text = (value: unknown, max: number) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;

export function readGuests(settings: Record<string, unknown> | undefined): PartyGuestSeat[] {
  const raw = settings?.guests;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.slice(0, 12).flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const guest = value as Record<string, unknown>;
    const id = text(guest.id, 200), name = text(guest.name, 40), controlledBy = text(guest.controlledBy, 200);
    if (!id || !name || !controlledBy || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name, controlledBy, avatar: text(guest.avatar, 16) ?? name.slice(0, 1).toUpperCase(),
      color: typeof guest.color === 'string' && /^#[0-9a-f]{6}$/i.test(guest.color) ? guest.color : '#df8eff' }];
  });
}

export function readIds(settings: Record<string, unknown> | undefined, key: 'sittingOut' | 'removedPlayerIds'): string[] {
  const raw = settings?.[key];
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
}

/** Presence players first (stable sort), then guests the host device announces. */
export function withGuests(live: readonly RoomPlayer[], guests: readonly PartyGuestSeat[]): RoomPlayer[] {
  const known = new Set(live.map(player => player.id));
  return [...live, ...guests.filter(guest => !known.has(guest.id)).map(guest => ({
    id: guest.id, name: guest.name, color: guest.color, avatar: guest.avatar,
    isHost: false, isReady: true, isPremium: false, controlledBy: guest.controlledBy,
  }))];
}

/** A guest is connected exactly when its controlling device is. */
export function seatPresent(id: string, peers: { has(id: string): boolean }, guests: readonly PartyGuestSeat[]): boolean {
  return peers.has(id) || guests.some(guest => guest.id === id && peers.has(guest.controlledBy));
}

/**
 * Host-side reconciliation of the signed room with server party data. Returns the
 * next room when guests changed or a participant left the match, otherwise null.
 */
export function partyRoomUpdate(room: GameRoom, access: PartyRoomAccess): GameRoom | null {
  if (!room.settings.controllerParty || access.code !== room.roomCode) return null;
  const members = new Set(access.memberIds);
  const guests = readGuests({ guests: access.guests ?? [] }).filter(guest => members.has(guest.id));
  let settings = room.settings, participantIds = room.participantIds;
  if (JSON.stringify(readGuests(settings)) !== JSON.stringify(guests)) settings = { ...settings, guests };
  if (room.status === 'playing') {
    // Match-level removals only count for the match the server data describes.
    const server = access.matchId && access.matchId === room.sessionId && Array.isArray(access.matchParticipantIds)
      ? new Set(access.matchParticipantIds) : null;
    const removed = participantIds.filter(id => !members.has(id) || (server && !server.has(id)));
    if (removed.length) ({ settings, participantIds } = dropFromMatch({ ...room, settings }, removed));
  }
  return settings === room.settings ? null : { ...room, settings, participantIds };
}

/** Take players out of the running match and record them in `removedPlayerIds`. */
export function dropFromMatch(room: GameRoom, ids: readonly string[]): GameRoom {
  return { ...room, participantIds: room.participantIds.filter(id => !ids.includes(id)),
    settings: { ...room.settings, removedPlayerIds: [...new Set([...readIds(room.settings, 'removedPlayerIds'), ...ids])] } };
}

/** Own presence look: the party member's avatar/colour (same on lobby, game and TV), else a stable party emoji. */
export function ownLook(access: PartyRoomAccess | null, id: string, previousColor: string | undefined, randomColor: () => string): { avatar: string; color: string } {
  const look = access?.looks?.[id];
  const color = look?.color && /^#[0-9a-f]{6}$/i.test(look.color) ? look.color : previousColor || randomColor();
  return { avatar: avatarOrFallback(look?.avatar, id), color };
}

export type MatchGuard = 'ok' | 'host-decide' | 'wait';

/** No-hang guard: too few active participants left in a running party match. */
export function matchGuard(input: { status: GameRoom['status']; controllerParty: boolean; gameId: string; activeCount: number; isHost: boolean }): MatchGuard {
  if (input.status !== 'playing' || !input.controllerParty) return 'ok';
  const game = playableGames.find(candidate => candidate.id === input.gameId);
  if (!game || input.activeCount >= Math.max(2, game.minPlayers)) return 'ok';
  return input.isHost ? 'host-decide' : 'wait';
}

/** QA trace (`window.__partyPlayTrace`): one entry whenever the active participant list changes. */
export function traceParticipants(previous: GameRoom | null, next: GameRoom | null): void {
  if (typeof window === 'undefined' || !next || next.status !== 'playing') return;
  const before = previous?.sessionId === next.sessionId ? previous.participantIds : null;
  if (before && before.length === next.participantIds.length && before.every((id, i) => id === next.participantIds[i])) return;
  const trace = ((window as unknown as { __partyPlayTrace?: unknown[] }).__partyPlayTrace ??= []);
  const at = performance.timeOrigin + performance.now();
  if (before) { trace.push({ kind: 'participants', ids: [...next.participantIds], reason: 'kick', at }); return; }
  trace.push({ kind: 'participants', ids: [...next.participantIds], reason: 'start', at });
  const sittingOut = readIds(next.settings, 'sittingOut');
  if (sittingOut.length) trace.push({ kind: 'participants', ids: sittingOut, reason: 'sitout', at });
}
