/**
 * controller-normalize.ts — the RPC answer is a system boundary.
 *
 * App builds ship before and after the party-play migration, so every newer
 * field (avatar, color, controlled_by, pending_claim(_mine), banned,
 * server_now, min_client, participant_ids) may be missing. One place fills
 * safe defaults; nothing downstream has to guard again. Pure, no React.
 */
import type { ControllerMember, ControllerPartyData } from './controller-api';
import { isPlayerAvatar, playerColor, PLAYER_AVATARS, PLAYER_COLORS } from './session-schema';

type Raw = Record<string, unknown>;
const record = (value: unknown): Raw | null => (value && typeof value === 'object' && !Array.isArray(value) ? value as Raw : null);
const text = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

function member(value: unknown, index: number): ControllerMember | null {
  const raw = record(value);
  if (!raw || typeof raw.player_id !== 'string' || !raw.player_id) return null;
  return {
    user_id: typeof raw.user_id === 'string' ? raw.user_id : null,
    player_id: raw.player_id,
    name: text(raw.name, '?') || '?',
    is_host: raw.is_host === true,
    avatar: isPlayerAvatar(raw.avatar) ? raw.avatar : PLAYER_AVATARS[index % PLAYER_AVATARS.length],
    color: playerColor(raw.color) ?? PLAYER_COLORS[index % PLAYER_COLORS.length],
    controlled_by: typeof raw.controlled_by === 'string' && raw.controlled_by ? raw.controlled_by : null,
    pending_claim: raw.pending_claim === true,
    pending_claim_mine: raw.pending_claim_mine === true,
    banned: raw.banned === true,
  };
}

/** Returns a complete snapshot or null when the answer is not a party at all. */
export function normalizePartyData(value: unknown): ControllerPartyData | null {
  const raw = record(value);
  const party = record(raw?.party);
  if (!raw || !party || typeof party.id !== 'string' || typeof party.code !== 'string' || !Array.isArray(raw.members) || !Array.isArray(raw.results)) return null;
  const members = raw.members.map(member).filter((m): m is ControllerMember => !!m);
  const pastMembers = Array.isArray(raw.past_members) ? raw.past_members.map((m, i) => member(m, i + members.length)).filter((m): m is ControllerMember => !!m) : [];
  const status = party.status === 'playing' || party.status === 'finished' ? party.status : 'lobby';
  return {
    party: {
      id: party.id, code: party.code,
      ...(typeof party.created_at === 'string' ? { created_at: party.created_at } : {}),
      revision: typeof party.revision === 'number' ? party.revision : 0,
      host_user_id: text(party.host_user_id), host_player_id: text(party.host_player_id),
      host_plays: party.host_plays !== false, premium: party.premium === true, status,
      playlist: Array.isArray(party.playlist) ? party.playlist.filter((id): id is string => typeof id === 'string') : [],
      current_match_id: typeof party.current_match_id === 'string' ? party.current_match_id : null,
      current_game_id: typeof party.current_game_id === 'string' ? party.current_game_id : null,
      ...(typeof party.min_client === 'number' ? { min_client: party.min_client } : {}),
      ...(Array.isArray(party.participant_ids) ? { participant_ids: party.participant_ids.filter((id): id is string => typeof id === 'string') } : {}),
    },
    members,
    past_members: pastMembers,
    results: (raw.results as unknown[]).map(record).filter((r): r is Raw => !!r && typeof r.match_id === 'string' && !!record(r.scores)).map(r => ({
      match_id: r.match_id as string, game_id: text(r.game_id), scores: r.scores as Record<string, number>,
      scored: r.scored !== false, created_at: text(r.created_at),
    })),
    ...(typeof raw.server_now === 'string' ? { server_now: raw.server_now } : {}),
    // Old servers never send it: absent means the join created a seat.
    seated: raw.seated !== false,
  };
}
