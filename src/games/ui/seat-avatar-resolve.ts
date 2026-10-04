import { avatarOrFallback } from "../multiplayer/seat-avatar";

/** A bare letter/number is a stand-in, not a chosen symbol (TV and lobby show emoji). */
const isStandIn = (avatar: string | undefined) => !avatar?.trim() || /^[\p{L}\p{N}]{1,2}$/u.test(avatar.trim());

/**
 * The seat's real symbol: its own if set, else the party roster's (by id), else
 * a stable party emoji — never an initial.
 */
export function resolveSeatAvatar(avatar: string | undefined, id: string, members: readonly { player_id: string; avatar?: string }[] = []): string {
  if (!isStandIn(avatar)) return avatar!.trim();
  const member = members.find((m) => m.player_id === id)?.avatar;
  return !isStandIn(member) ? member!.trim() : avatarOrFallback(undefined, id);
}
