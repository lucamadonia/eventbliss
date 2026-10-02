import { describe, expect, it } from 'vitest';
import type { ControllerPartyData } from '@/games/party/controller-api';
import { createPartyPlayer, createPartySession } from '@/games/party/session-schema';
import type { RoomPlayer } from '@/games/multiplayer/room-types';
import { availabilityChip } from '@/lib/playable-games';
import {
  controllerLobbyState,
  diffLobbyPlayers,
  legacyLobbyState,
  localLobbyState,
  nextGameAvailability,
  onlineRoomLobbyState,
  parseTVLobbyState,
  type TVLobbyPlayer,
  type TVLobbyState,
} from './tv-lobby-state';

const brew = { id: 'brew', name: 'GEBRÄU', minPlayers: 2, maxPlayers: 8 };

function controllerData(overrides: { host_plays?: boolean; members?: Record<string, unknown>[] } = {}): ControllerPartyData {
  return {
    party: {
      id: 'p1', code: 'K7QM4X', revision: 1, host_user_id: 'u-host', host_player_id: 'host',
      host_plays: overrides.host_plays ?? true, premium: false, status: 'lobby',
      playlist: ['brew'], current_match_id: null, current_game_id: null,
    },
    members: (overrides.members ?? [
      { user_id: 'u-host', player_id: 'host', name: 'Luca', is_host: true, avatar: '👑', color: '#df8eff', controlled_by: null, pending_claim: false },
      { user_id: 'u-lena', player_id: 'lena', name: 'Lena', is_host: false, avatar: '🦊', color: '#ff6b98', controlled_by: null, pending_claim: false },
      { user_id: 'u-tom', player_id: 'tom', name: 'Tom', is_host: false, avatar: '🐼', color: '#8ff5ff', controlled_by: null, pending_claim: false },
      { user_id: null, player_id: 'max', name: 'Max', is_host: false, avatar: '🐯', color: '#f9ca24', controlled_by: 'host', pending_claim: false },
    ]) as unknown as ControllerPartyData['members'],
    results: [],
  };
}

describe('controllerLobbyState', () => {
  it('maps seats, presence and the join link', () => {
    const state = controllerLobbyState({
      data: controllerData(),
      presence: [{ id: 'lena', isReady: true }],
      baseUrl: 'https://event-bliss.com/',
      nextGame: brew,
      gamesPlanned: 3,
    });
    expect(state.mode).toBe('controller-party');
    expect(state.code).toBe('K7QM4X');
    expect(state.joinUrl).toBe('https://event-bliss.com/party/join/K7QM4X');
    expect(state.gamesPlanned).toBe(3);
    const byId = Object.fromEntries(state.players.map((p) => [p.id, p]));
    expect(byId.host).toMatchObject({ isHost: true, hostPlays: true, connected: true, ready: true, seat: 'phone', avatar: '👑' });
    expect(byId.lena).toMatchObject({ seat: 'phone', connected: true, ready: true });
    expect(byId.tom).toMatchObject({ seat: 'phone', connected: false, ready: false });
    expect(byId.max).toMatchObject({ seat: 'host-device', connected: true, ready: true, color: '#f9ca24' });
    expect(state.readyMissing).toBe(1);
  });

  it('keeps a non-playing host visible but outside the active count', () => {
    const state = controllerLobbyState({
      data: controllerData({ host_plays: false }),
      presence: [{ id: 'lena', isReady: true }, { id: 'tom', isReady: true }],
      baseUrl: 'https://event-bliss.com',
      nextGame: { ...brew, minPlayers: 4 },
      gamesPlanned: 1,
    });
    expect(state.players.find((p) => p.isHost)?.hostPlays).toBe(false);
    expect(state.readyMissing).toBe(0);
    // Ohne `availability` (altes Telefon) rechnet der TV mit min/max der Leitung.
    expect(nextGameAvailability({ ...state, nextGame: { ...brew, minPlayers: 4 } })).toMatchObject({ reason: 'too_few', startable: false, plannable: true, activePlayers: 3, missingPlayers: 1 });
  });

  it('falls back to index avatars for members without a profile and hides banned ones', () => {
    const state = controllerLobbyState({
      data: controllerData({ members: [
        { user_id: 'u1', player_id: 'a', name: 'A', is_host: true },
        { user_id: 'u2', player_id: 'b', name: 'B', is_host: false, banned: true },
        { user_id: 'u3', player_id: 'c', name: 'C', is_host: false },
      ] }),
      presence: [{ id: 'u3', isReady: false }],
      baseUrl: 'https://event-bliss.com',
      nextGame: null,
      gamesPlanned: 0,
    });
    expect(state.players.map((p) => p.id)).toEqual(['a', 'c']);
    expect(state.players[0].avatar).toBe('🎉');
    expect(state.players[1]).toMatchObject({ avatar: '⭐', color: '#8ff5ff', connected: true, ready: false });
    expect(nextGameAvailability(state)).toBeNull();
  });
});

describe('localLobbyState', () => {
  it('has no join link and everyone sits at the host device', () => {
    const session = { ...createPartySession('s1'), playlist: ['brew', 'bomb'] };
    session.players = [createPartyPlayer('a', 'Anna', 0), createPartyPlayer('b', 'Ben', 1)];
    const state = localLobbyState({ session, code: 'ABC234', nextGame: brew });
    expect(state).toMatchObject({ mode: 'local-party', code: 'ABC234', joinUrl: null, readyMissing: 0, gamesPlanned: 2 });
    expect(state.players.every((p) => p.seat === 'host-device' && p.ready && p.connected && !p.isHost)).toBe(true);
    expect(nextGameAvailability(state)).toMatchObject({ startable: true, activePlayers: 2, sittingOutNames: [] });
  });
});

describe('onlineRoomLobbyState', () => {
  const players: RoomPlayer[] = [
    { id: 'h', name: 'Host', color: '#df8eff', avatar: '🎉', isHost: true, isReady: true, isPremium: false },
    { id: 'g', name: 'Gast', color: '#ff6b98', avatar: '🔥', isHost: false, isReady: false, isPremium: false },
  ];
  it('links to the room and counts unready players', () => {
    const state = onlineRoomLobbyState({ roomCode: 'ROOM22', players, hostId: 'h', baseUrl: 'https://event-bliss.com', nextGame: brew });
    expect(state.joinUrl).toBe('https://event-bliss.com/games?room=ROOM22');
    expect(state.players[0]).toMatchObject({ isHost: true, hostPlays: true, seat: 'phone' });
    expect(state.readyMissing).toBe(1);
    expect(state.gamesPlanned).toBe(1);
  });
  it('flags too many players for the next game', () => {
    const state = onlineRoomLobbyState({ roomCode: 'ROOM22', players, hostId: 'h', baseUrl: 'https://x.test', nextGame: brew });
    expect(nextGameAvailability({ ...state, nextGame: { ...brew, maxPlayers: 1 } })).toMatchObject({ reason: 'too_many', plannable: false, startable: false, reasonParams: { max: 1, count: 2 } });
  });
});

describe('legacyLobbyState', () => {
  const base = { code: 'TVCODE', baseUrl: 'https://event-bliss.com' };
  it('prefers the joystick code', () => {
    expect(legacyLobbyState({ ...base, presence: [], controllerJoinCode: 'K7QM4X' }).joinUrl).toBe('https://event-bliss.com/party/join/K7QM4X');
  });
  it('treats presence as an online room', () => {
    const s = legacyLobbyState({ ...base, presence: [{ id: '1', name: 'A', avatar: '', color: '', isReady: false }], controllerJoinCode: null });
    expect(s.joinUrl).toBe('https://event-bliss.com/games?room=TVCODE');
    expect(s.players[0].avatar).toBe('🎉');
  });
  it('never invents a link for an offline TV code', () => {
    expect(legacyLobbyState({ ...base, presence: [], controllerJoinCode: null })).toMatchObject({ mode: 'local-party', joinUrl: null });
  });
});

describe('parseTVLobbyState', () => {
  const valid: TVLobbyState = {
    mode: 'controller-party', code: 'K7QM4X', joinUrl: 'https://event-bliss.com/party/join/K7QM4X',
    players: [{ id: 'a', name: 'Lena', avatar: '🦊', color: '#ff6b98', seat: 'phone', ready: true, connected: true, isHost: false }],
    nextGame: brew, readyMissing: 0, gamesPlanned: 3,
  };
  it('round-trips a valid state', () => {
    expect(parseTVLobbyState(JSON.parse(JSON.stringify(valid)))).toEqual(valid);
  });
  it('keeps a trimmed unavailable reason and drops empty ones', () => {
    expect(parseTVLobbyState({ ...valid, nextGame: { ...brew, unavailableReason: '  Max & Gerda setzen aus ' } })?.nextGame?.unavailableReason).toBe('Max & Gerda setzen aus');
    expect(parseTVLobbyState({ ...valid, nextGame: { ...brew, unavailableReason: ' ' } })?.nextGame).toEqual(brew);
  });
  it('rejects garbage and unsafe links', () => {
    expect(parseTVLobbyState(null)).toBeNull();
    expect(parseTVLobbyState({ mode: 'evil' })).toBeNull();
    expect(parseTVLobbyState({ ...valid, joinUrl: 'javascript:alert(1)' })?.joinUrl).toBeNull();
    expect(parseTVLobbyState({ ...valid, mode: 'local-party' })?.joinUrl).toBeNull();
  });
  it('drops malformed players and sanitises colors', () => {
    const parsed = parseTVLobbyState({ ...valid, players: [{ id: 'x' }, { id: 'b', name: 'Ben', color: 'red;background:url(x)' }] });
    expect(parsed?.players).toHaveLength(1);
    expect(parsed?.players[0].color).toMatch(/^#/);
  });
});

describe('diffLobbyPlayers', () => {
  const p = (id: string, extra: Partial<TVLobbyPlayer> = {}): TVLobbyPlayer => ({
    id, name: id, avatar: '🎉', color: '#df8eff', seat: 'phone', ready: false, connected: true, isHost: false, ...extra,
  });
  it('detects joins, leaves, seat claims and profile changes', () => {
    const diff = diffLobbyPlayers(
      [p('a'), p('b', { seat: 'host-device' }), p('c')],
      [p('a', { name: 'Anna', ready: true }), p('b'), p('d')],
    );
    expect(diff.joined.map((x) => x.id)).toEqual(['d']);
    expect(diff.left.map((x) => x.id)).toEqual(['c']);
    expect(diff.seatClaimed.map((x) => x.id)).toEqual(['b']);
    expect(diff.profileChanged.map((x) => x.id)).toEqual(['a']);
    expect(diff.becameReady.map((x) => x.id)).toEqual(['a']);
  });
});

describe('readyMissing', () => {
  const six = () => controllerData({ members: [
    { user_id: 'u-host', player_id: 'host', name: 'Luca', is_host: true, controlled_by: null },
    { user_id: 'u1', player_id: 'lena', name: 'Lena', is_host: false, controlled_by: null },
    { user_id: 'u2', player_id: 'tom', name: 'Tom', is_host: false, controlled_by: null },
    { user_id: 'u3', player_id: 'sara', name: 'Sara', is_host: false, controlled_by: null },
    { user_id: null, player_id: 'max', name: 'Max', is_host: false, controlled_by: 'host' },
    { user_id: null, player_id: 'gerda', name: 'Gerda', is_host: false, controlled_by: 'host' },
  ] });
  it('counts only phone players who are not ready (host plays, 2 guests, 3 phones, 1 not ready)', () => {
    const state = controllerLobbyState({
      data: six(),
      presence: [{ id: 'lena', isReady: true }, { id: 'tom', isReady: false }, { id: 'sara', isReady: true }],
      baseUrl: 'https://event-bliss.com', nextGame: null, gamesPlanned: 1,
    });
    expect(state.readyMissing).toBe(1);
  });
  it('is recomputed from the cards on the TV, never trusted from the wire', () => {
    const wire = {
      mode: 'controller-party', code: 'K7QM4X', joinUrl: 'https://event-bliss.com/party/join/K7QM4X', readyMissing: 5, gamesPlanned: 1, nextGame: null,
      players: [
        { id: 'h', name: 'Host', seat: 'phone', ready: false, isHost: true, hostPlays: true },
        { id: 'g', name: 'Gast', seat: 'host-device', ready: false },
        { id: 'a', name: 'A', seat: 'phone', ready: true },
        { id: 'b', name: 'B', seat: 'phone', ready: false },
      ],
    };
    expect(parseTVLobbyState(wire)?.readyMissing).toBe(1);
  });
});

describe('nextGame availability (gameAvailability)', () => {
  const guestsOnly = (premium = false) => {
    const data = controllerData({ members: [
      { user_id: 'u-host', player_id: 'host', name: 'Luca', is_host: true, controlled_by: null },
      { user_id: null, player_id: 'max', name: 'Max', is_host: false, controlled_by: 'host' },
      { user_id: null, player_id: 'gerda', name: 'Gerda', is_host: false, controlled_by: 'host' },
    ] });
    data.party.premium = premium;
    return data;
  };
  const pixel = { id: 'pixeljagd', name: 'PIXELJAGD', minPlayers: 2, maxPlayers: 8 };

  it('names sitting-out guests and says when that leaves too few', () => {
    const state = controllerLobbyState({ data: guestsOnly(), presence: [], baseUrl: 'https://x.test', nextGame: pixel, gamesPlanned: 1 });
    expect(state.nextGame?.availability).toMatchObject({ startable: false, plannable: true, reason: 'guests_sit_out_too_few', sittingOut: 2, missingPlayers: 1, sittingOutNames: ['Max', 'Gerda'] });
    expect(availabilityChip(nextGameAvailability(state)!)).toMatchObject({ kind: 'waiting', key: 'partyPlay.availability.guestsSitOut', params: { count: 1 } });
  });

  it('fits with a phone player, but still announces who sits out', () => {
    const data = guestsOnly();
    data.members.push({ user_id: 'u1', player_id: 'lena', name: 'Lena', is_host: false, controlled_by: null } as unknown as ControllerPartyData['members'][number]);
    const state = controllerLobbyState({ data, presence: [{ id: 'lena', isReady: true }], baseUrl: 'https://x.test', nextGame: pixel, gamesPlanned: 1 });
    expect(nextGameAvailability(state)).toMatchObject({ startable: true, activePlayers: 2, sittingOutNames: ['Max', 'Gerda'] });
    expect(availabilityChip(nextGameAvailability(state)!).kind).toBe('ok');
  });

  it('blocks premium games without premium', () => {
    const game = { id: 'flaschendrehen', name: 'Flaschendrehen', minPlayers: 2, maxPlayers: 12 };
    expect(nextGameAvailability(controllerLobbyState({ data: guestsOnly(false), presence: [], baseUrl: 'https://x.test', nextGame: game, gamesPlanned: 1 }))?.reason).toBe('premium');
    const online = onlineRoomLobbyState({
      roomCode: 'ROOM22', hostId: 'h', baseUrl: 'https://x.test', nextGame: game, hostPremium: false,
      players: [
        { id: 'h', name: 'Host', color: '#df8eff', avatar: '🎉', isHost: true, isReady: true, isPremium: false },
        { id: 'g', name: 'Gast', color: '#ff6b98', avatar: '🔥', isHost: false, isReady: false, isPremium: false },
      ],
    });
    expect(nextGameAvailability(online)?.reason).toBe('premium');
  });

  it('local party: nobody sits out', () => {
    const session = { ...createPartySession('s1') };
    session.players = [createPartyPlayer('a', 'Anna', 0), createPartyPlayer('b', 'Ben', 1)];
    const state = localLobbyState({ session, code: 'ABC234', nextGame: pixel });
    expect(state.nextGame?.availability).toMatchObject({ startable: true, sittingOut: 0 });
  });

  it('marks room guests as host-device seats', () => {
    const state = onlineRoomLobbyState({
      roomCode: 'ROOM22', hostId: 'h', baseUrl: 'https://x.test', nextGame: null,
      players: [
        { id: 'h', name: 'Host', color: '#df8eff', avatar: '🎉', isHost: true, isReady: true, isPremium: false },
        { id: 'm', name: 'Max', color: '#f9ca24', avatar: '🐯', isHost: false, isReady: false, isPremium: false, controlledBy: 'h' },
      ],
    });
    expect(state.players[1]).toMatchObject({ seat: 'host-device', ready: true });
    expect(state.readyMissing).toBe(0);
  });

  it('survives the wire and drops unknown reasons', () => {
    const state = controllerLobbyState({ data: guestsOnly(), presence: [], baseUrl: 'https://x.test', nextGame: pixel, gamesPlanned: 1 });
    expect(parseTVLobbyState(JSON.parse(JSON.stringify(state)))?.nextGame?.availability).toEqual(state.nextGame?.availability);
    const forged = { ...state, nextGame: { ...pixel, availability: { startable: false, reason: '<script>', activePlayers: 1, sittingOut: 0, sittingOutNames: [42], reasonParams: { min: 3, evil: 'x' } } } };
    expect(parseTVLobbyState(forged)?.nextGame?.availability).toEqual({ startable: false, plannable: false, reason: 'unknown_game', activePlayers: 1, sittingOut: 0, missingPlayers: 0, reasonParams: { min: 3 }, sittingOutNames: [] });
  });
});
