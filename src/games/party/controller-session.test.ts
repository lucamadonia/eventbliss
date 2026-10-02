import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('@/games/multiplayer/useGameRoom', () => ({ gameRoomSession: {} }));
vi.mock('@/hooks/usePartySession', () => ({ replaceControllerPartySession: vi.fn() }));

import { bannedMembers, controllerPartySession, ownMember } from './controller-session';
import type { ControllerMember, ControllerPartyData } from './controller-api';
import { PLAYER_AVATARS, PLAYER_COLORS, suggestPlayerLook, playerName, playerColor, isPlayerAvatar } from './session-schema';

const member = (over: Partial<ControllerMember>): ControllerMember => ({
  user_id: 'u', player_id: 'p', name: 'N', is_host: false, avatar: '🦊', color: '#ff6b98', controlled_by: null, pending_claim: false, ...over,
});
const data = (members: ControllerMember[], over: Partial<ControllerPartyData> = {}): ControllerPartyData => ({
  party: { id: 'party', code: 'ABCDEF', revision: 1, host_user_id: 'host', host_player_id: 'h', host_plays: true, premium: false,
    status: 'lobby', playlist: [], current_match_id: null, current_game_id: null },
  members, results: [], ...over,
});

describe('controllerPartySession', () => {
  it('uses the server avatar and colour', () => {
    const session = controllerPartySession(data([
      member({ user_id: 'host', player_id: 'h', is_host: true, avatar: '👑', color: '#F9CA24' }),
      member({ user_id: null, player_id: 'g', controlled_by: 'h', avatar: '🐙', color: '#55efc4' }),
    ]));
    expect(session.players.map(p => [p.id, p.avatar, p.color])).toEqual([['h', '👑', '#f9ca24'], ['g', '🐙', '#55efc4']]);
  });

  it('falls back to the index for old servers or invalid values', () => {
    const legacy = { user_id: 'a', player_id: 'a', name: 'A', is_host: false } as unknown as ControllerMember;
    const session = controllerPartySession(data([legacy, member({ player_id: 'b', avatar: '💩', color: 'red' })]));
    expect(session.players[0]).toMatchObject({ avatar: PLAYER_AVATARS[0], color: PLAYER_COLORS[0] });
    expect(session.players[1]).toMatchObject({ avatar: PLAYER_AVATARS[1], color: PLAYER_COLORS[1] });
  });

  it('keeps banned members out of the roster but in the standings archive', () => {
    const session = controllerPartySession(data([member({ player_id: 'a' }), member({ player_id: 'b', user_id: 'x', banned: true })]));
    expect(session.players.map(p => p.id)).toEqual(['a']);
    expect(session.archivedPlayers?.map(p => p.id)).toEqual(['b']);
  });

  it('hides a non-playing Host', () => {
    const session = controllerPartySession(data([member({ player_id: 'h', is_host: true }), member({ player_id: 'a' })], {
      party: { ...data([]).party, host_plays: false },
    }));
    expect(session.players.map(p => p.id)).toEqual(['a']);
  });
});

describe('bannedMembers (F16)', () => {
  it('reads banned seats from past_members, where the server puts them', () => {
    const d = { ...data([member({ player_id: 'a' })]), past_members: [member({ player_id: 'b', banned: true }), member({ player_id: 'c' })] };
    expect(bannedMembers(d).map(m => m.player_id)).toEqual(['b']);
  });
  it('also finds a banned row in members without duplicates', () => {
    const banned = member({ player_id: 'b', banned: true });
    expect(bannedMembers({ ...data([banned]), past_members: [banned] }).map(m => m.player_id)).toEqual(['b']);
  });
});

describe('ownMember', () => {
  it('finds the account seat, never a guest or a banned seat', () => {
    const d = data([member({ user_id: null, player_id: 'g', controlled_by: 'h' }), member({ user_id: 'me', player_id: 'm' })]);
    expect(ownMember(d, 'me')?.player_id).toBe('m');
    expect(ownMember(data([member({ user_id: 'me', banned: true })]), 'me')).toBeNull();
    expect(ownMember(null, 'me')).toBeNull();
  });
});

describe('profile validation', () => {
  it('has exactly the 24 allowed symbols, first 12 unchanged', () => {
    expect(PLAYER_AVATARS).toHaveLength(24);
    expect(new Set(PLAYER_AVATARS).size).toBe(24);
    expect(PLAYER_AVATARS.slice(0, 12)).toEqual(['🎉', '🔥', '⭐', '🎯', '🚀', '💎', '🌟', '🎪', '🎲', '🎸', '🎨', '🦄']);
    expect(isPlayerAvatar('👑')).toBe(true);
    expect(isPlayerAvatar('💩')).toBe(false);
  });

  it('trims names to 1–24 characters', () => {
    expect(playerName('  Max   K. ')).toBe('Max K.');
    expect(playerName('   ')).toBeNull();
    expect(playerName('x'.repeat(25))).toBeNull();
    expect(playerName('🎉'.repeat(24))).toBe('🎉'.repeat(24));
    expect(playerName('مريم')).toBe('مريم');
  });

  it('accepts palette colours case-insensitively', () => {
    expect(playerColor('#DF8EFF')).toBe('#df8eff');
    expect(playerColor('#123456')).toBeNull();
  });

  it('suggests unused symbols and colours first', () => {
    expect(suggestPlayerLook([{ avatar: '🎉', color: '#df8eff' }])).toEqual({ avatar: '🔥', color: '#ff6b98' });
    const all = PLAYER_COLORS.map((color, i) => ({ avatar: PLAYER_AVATARS[i], color }));
    expect(PLAYER_COLORS).toContain(suggestPlayerLook(all).color);
  });
});
