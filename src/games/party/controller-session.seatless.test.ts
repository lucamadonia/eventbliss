import { afterEach, describe, expect, it, vi } from 'vitest';

const { rpc, room } = vi.hoisted(() => ({
  rpc: vi.fn(),
  room: {
    prepareAccountIdentity: vi.fn(async () => 'me-id'),
    joinRoom: vi.fn(async () => {}), createPartyRoom: vi.fn(async () => {}),
    configureParty: vi.fn(), leaveRoom: vi.fn(), broadcast: vi.fn(), kickPlayer: vi.fn(), dropParticipant: vi.fn(),
    onBroadcast: vi.fn(() => () => {}), getSnapshot: vi.fn(() => ({ room: null })), finishPartyGame: vi.fn(),
  },
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }));
vi.mock('@/hooks/usePartySession', () => ({ replaceControllerPartySession: vi.fn() }));
vi.mock('@/games/multiplayer/useGameRoom', () => ({ gameRoomSession: room }));

import { claimControllerSeat, closeControllerParty, controllerSeatStatus, refreshAtLeast, endControllerParty, getControllerState, openControllerParty, stopControllerParty } from './controller-session';

const party = { id: 'p', code: 'ABCDEF', revision: 5, host_user_id: 'host', host_player_id: 'hp', host_plays: true, premium: false,
  status: 'lobby', playlist: [], current_match_id: null, current_game_id: null };
const host = { user_id: 'host', player_id: 'hp', name: 'Luca', is_host: true, avatar: '👑', color: '#df8eff', controlled_by: null, pending_claim: false };
const max = { user_id: null, player_id: 'g-max', name: 'Max', is_host: false, avatar: '🦊', color: '#ff6b98', controlled_by: 'hp', pending_claim: false };

afterEach(() => { stopControllerParty(); rpc.mockReset(); });

describe('B13: join a full party without a seat', () => {
  it('shows "Wer bist du?" seatless, claims with controller_id and then connects', async () => {
    rpc.mockResolvedValueOnce({ data: { party, members: [host, max], results: [], seated: false }, error: null });
    await openControllerParty('me', 'Max', 'ABCDEF');
    expect(getControllerState()).toMatchObject({ seatless: true, onboarding: true });
    expect(room.joinRoom).not.toHaveBeenCalled();

    rpc.mockResolvedValueOnce({ data: { party: { ...party, revision: 6 }, members: [host, { ...max, user_id: 'me', player_id: 'me-id', controlled_by: null }], results: [] }, error: null });
    await claimControllerSeat('g-max');
    expect(rpc).toHaveBeenLastCalledWith('controller_party_request', { action: 'claim', code: 'ABCDEF', payload: { player_id: 'g-max', controller_id: 'me-id' } });
    expect(getControllerState().seatless).toBe(false);
    expect(room.joinRoom).toHaveBeenCalledWith('ABCDEF', 'Max');
    expect(room.broadcast).toHaveBeenCalledWith('party-changed', { revision: 6 });
  });

  it('refuses anything but a claim while seatless', async () => {
    rpc.mockResolvedValueOnce({ data: { party, members: [host, max], results: [], seated: false }, error: null });
    await openControllerParty('me', 'Max', 'ABCDEF');
    const { updateControllerProfile } = await import('./controller-session');
    await expect(updateControllerProfile('x', { name: 'Max', avatar: '🦊', color: '#ff6b98' })).rejects.toThrow('party_full');
  });
});

describe('D04: the Host ends the party', () => {
  it('keeps the finished party (closing screen + TV finale) and tells every phone', async () => {
    const me = { ...host, user_id: 'me', player_id: 'me-id' };
    rpc.mockResolvedValueOnce({ data: { party: { ...party, host_user_id: 'me', host_player_id: 'me-id' }, members: [me], results: [] }, error: null });
    await openControllerParty('me', 'Luca');
    rpc.mockResolvedValueOnce({ data: { party: { ...party, host_user_id: 'me', host_player_id: 'me-id', status: 'finished', revision: 9 }, members: [me], results: [] }, error: null });
    await endControllerParty();
    expect(getControllerState().data?.party.status).toBe('finished');
    expect(room.broadcast).toHaveBeenCalledWith('party-changed', { revision: 9 });
    closeControllerParty();
    expect(getControllerState().data).toBeNull();
  });
});

describe('C01: party-changed refreshes past a stale in-flight poll', () => {
  it('reads again until the announced revision has arrived', async () => {
    const me = { ...host, user_id: 'me', player_id: 'me-id' };
    const snapshot = (revision: number) => ({ data: { party: { ...party, host_user_id: 'me', host_player_id: 'me-id', revision }, members: [me], results: [] }, error: null });
    rpc.mockResolvedValueOnce(snapshot(5));
    await openControllerParty('me', 'Luca');
    rpc.mockResolvedValueOnce(snapshot(6)).mockResolvedValueOnce(snapshot(7));
    await refreshAtLeast(7);
    expect(getControllerState().data?.party.revision).toBe(7);
    expect(rpc.mock.calls.filter(call => (call[1] as { action: string }).action === 'read')).toHaveLength(2);
  });
});

describe('B06/B07: seat status before joining by invitation', () => {
  const snapshot = (member: object) => ({ data: { party, members: [host, member], results: [] }, error: null });
  it('resumes a seat on this phone, asks to switch for another phone, joins fresh otherwise', async () => {
    rpc.mockResolvedValueOnce(snapshot({ ...max, user_id: 'me', player_id: 'me-id', controlled_by: null }));
    expect(await controllerSeatStatus('me', 'ABCDEF')).toBe('here');
    rpc.mockResolvedValueOnce(snapshot({ ...max, user_id: 'me', player_id: 'other-phone', controlled_by: null }));
    expect(await controllerSeatStatus('me', 'ABCDEF')).toBe('elsewhere');
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'Party membership required' } });
    expect(await controllerSeatStatus('me', 'ABCDEF')).toBe('none');
  });
});

describe('D04 mid-game: round-end, then the chained finale', () => {
  it('announces round-end now and the finale right after its moment', async () => {
    vi.useFakeTimers();
    const me = { ...host, user_id: 'me', player_id: 'me-id' };
    const snap = (status: string, revision: number) => ({ data: { party: { ...party, host_user_id: 'me', host_player_id: 'me-id', status, revision }, members: [me], results: [] }, error: null });
    rpc.mockResolvedValueOnce(snap('playing', 5));
    await openControllerParty('me', 'Luca');
    room.getSnapshot.mockReturnValue({ room: { status: 'playing', sessionId: 'm1' } } as never);
    room.broadcast.mockClear();
    rpc.mockResolvedValueOnce(snap('finished', 6));
    await endControllerParty();
    const scenes = () => room.broadcast.mock.calls.filter(c => c[0] === 'party-scene').map(c => (c[1] as { scene: { scene: string; startsAt: number } }).scene);
    expect(scenes().map(s => s.scene)).toEqual(['round-end']);
    await vi.advanceTimersByTimeAsync(2000);
    const [roundEnd, finale] = scenes();
    expect(finale?.scene).toBe('finale');
    expect(finale.startsAt).toBe(roundEnd.startsAt + 600);
    room.getSnapshot.mockReturnValue({ room: null } as never);
    vi.useRealTimers();
  });
});
