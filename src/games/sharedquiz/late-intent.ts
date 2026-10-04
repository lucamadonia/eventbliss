import { pushPartyTrace } from '../party/party-trace';

/** Event the host sends back to a device whose input arrived after its turn (F12). */
export const LATE_NOTICE_EVENT = 'party-late';

interface LateSource {
  players: readonly { id: string }[];
  broadcastTo?: (playerId: string, event: string, data: Record<string, unknown>) => void;
}

/**
 * An ANSWER (vote, guess, choice — marked `answer` by the game) from a room
 * member for a turn that already closed. Returns true when it was late: the
 * caller drops it, it is traced and the sender gets a calm „zu spät“ notice.
 * Other stale intents (state ticks like a spin start/stop racing a tap) are
 * dropped silently by the normal token check — no false alarm.
 */
export function reportLateIntent(online: LateSource, data: Record<string, unknown>, token: string, isAnswer: boolean,
  push: typeof pushPartyTrace = pushPartyTrace): boolean {
  if (!isAnswer) return false;
  const sender = data.__senderId;
  if (typeof sender !== 'string' || typeof data.token !== 'string' || data.token === token) return false;
  if (!online.players.some(player => player.id === sender)) return false;
  push({ kind: 'input-rejected', reason: 'late', playerId: sender, sceneId: data.token });
  online.broadcastTo?.(sender, LATE_NOTICE_EVENT, { token: data.token });
  return true;
}
