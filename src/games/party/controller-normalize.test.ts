import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('@/games/multiplayer/useGameRoom', () => ({ gameRoomSession: {} }));
vi.mock('@/hooks/usePartySession', () => ({ replaceControllerPartySession: vi.fn() }));

import { normalizePartyData } from './controller-normalize';
import { controllerPartySession, ownMember } from './controller-session';
import { controllerGameAvailability } from './party-availability';
import { PLAYER_AVATARS, PLAYER_COLORS } from './session-schema';
import { whoAreYouSeats } from '@/components/native/party/WhoAreYou';
import { controllerLobbyState } from '@/games/tv/tv-lobby-state';

/** Exactly what the pre-migration RPC returns: no avatar/color/guest fields, no server_now/min_client. */
const OLD = {
  party: { id: 'p', code: 'ABCDEF', revision: 3, host_user_id: 'h', host_player_id: 'hp', host_plays: true, premium: false,
    status: 'lobby', playlist: ['bomb'], current_match_id: null, current_game_id: null, created_at: '2026-10-01T10:00:00Z' },
  members: [
    { user_id: 'h', player_id: 'hp', name: 'Luca', is_host: true },
    { user_id: 'l', player_id: 'lp', name: 'Lena', is_host: false },
  ],
  past_members: [{ user_id: 'x', player_id: 'xp', name: 'Tom', is_host: false }],
  results: [{ match_id: 'm1', game_id: 'bomb', scores: { hp: 3, lp: 1, xp: 2 }, scored: true, created_at: '2026-10-01T10:10:00Z' }],
};

describe('normalizePartyData (old schema)', () => {
  const data = normalizePartyData(OLD)!;

  it('fills every new field with a safe default', () => {
    expect(data.members[0]).toEqual({ user_id: 'h', player_id: 'hp', name: 'Luca', is_host: true, avatar: PLAYER_AVATARS[0], color: PLAYER_COLORS[0],
      controlled_by: null, pending_claim: false, pending_claim_mine: false, banned: false });
    expect(data.members[1]).toMatchObject({ avatar: PLAYER_AVATARS[1], color: PLAYER_COLORS[1], controlled_by: null });
    expect(data.server_now).toBeUndefined();
    expect(data.party.min_client).toBeUndefined();
  });

  it('flows through the session, "Wer bist du?", availability and the TV builder without crashing', () => {
    const session = controllerPartySession(data);
    expect(session.players.map(p => p.avatar)).toEqual([PLAYER_AVATARS[0], PLAYER_AVATARS[1]]);
    expect(session.archivedPlayers?.[0].id).toBe('xp');
    expect(whoAreYouSeats(data.members, 'lp')).toMatchObject({ guests: [], phones: [{ player_id: 'hp' }] });
    expect(ownMember(data, 'l')?.player_id).toBe('lp');
    expect(controllerGameAvailability('bomb', data).selectable).toBe(true);
    const tv = controllerLobbyState({ data, presence: [{ id: 'lp', isReady: true }], baseUrl: 'https://event-bliss.com', nextGame: null, gamesPlanned: 1 });
    expect(tv.players.map(p => [p.avatar, p.seat])).toEqual([[PLAYER_AVATARS[0], 'phone'], [PLAYER_AVATARS[1], 'phone']]);
  });

  it('treats a missing `seated` as seated and keeps seated:false (B13)', () => {
    expect(data.seated).toBe(true);
    expect(normalizePartyData({ ...OLD, seated: false })!.seated).toBe(false);
  });

  it('rejects garbage and drops broken rows', () => {
    expect(normalizePartyData(null)).toBeNull();
    expect(normalizePartyData({ party: {}, members: [], results: [] })).toBeNull();
    const partial = normalizePartyData({ ...OLD, members: [...OLD.members, { name: 'no id' }, 7], results: [...OLD.results, { match_id: 1 }] })!;
    expect(partial.members).toHaveLength(2);
    expect(partial.results).toHaveLength(1);
  });

  it('keeps new fields when present and lowercases colours', () => {
    const fresh = normalizePartyData({ ...OLD, server_now: '2026-10-01T10:00:00Z', party: { ...OLD.party, min_client: 2,
      tv_code: 'TVX247', local_started_at: '2026-09-30T20:00:00Z' },
      members: [{ ...OLD.members[0], avatar: '👑', color: '#FF6B98' }, { user_id: null, player_id: 'g', name: 'Max', is_host: false, controlled_by: 'hp', pending_claim: true, avatar: 'nope' }] })!;
    expect(fresh.members[0]).toMatchObject({ avatar: '👑', color: '#ff6b98' });
    expect(fresh.members[1]).toMatchObject({ user_id: null, controlled_by: 'hp', pending_claim: true, avatar: PLAYER_AVATARS[1] });
    expect(fresh.server_now).toBe('2026-10-01T10:00:00Z');
    expect(fresh.party.min_client).toBe(2);
    expect(controllerPartySession(fresh).tvCode).toBe('TVX247');
    expect(controllerPartySession(fresh).createdAt).toBe(Date.parse('2026-09-30T20:00:00Z'));
  });
});
