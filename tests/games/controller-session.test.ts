import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ControllerPartyData } from '@/games/party/controller-api';
import type { PartyRoomAccess } from '@/games/multiplayer/party-access';

const fixture = vi.hoisted(() => ({ request: vi.fn(), access: null as PartyRoomAccess | null,
  snapshot: { room: { roomCode: 'ABCDEF', status: 'playing', sessionId: 'm1', participantIds: ['p1', 'p2'] }, myPlayerId: 'p1' }, finish: vi.fn() }));
vi.mock('@/games/party/controller-api', () => ({ controllerRequest: fixture.request }));
vi.mock('@/games/multiplayer/useGameRoom', () => ({ gameRoomSession: {
  configureParty: (access: PartyRoomAccess | null) => { fixture.access = access; },
  prepareAccountIdentity: async () => 'p1', createPartyRoom: async () => {}, joinRoom: async () => {}, leaveRoom: () => {},
  getSnapshot: () => fixture.snapshot, finishPartyGame: fixture.finish,
  startGame: async (game: string) => { await fixture.access!.start(game, ['p1', 'p2']); return true; },
  // Party-play realtime API (party-changed / party-scene, kicks, reconnect) — not under test here.
  onBroadcast: () => () => {}, broadcast: () => {}, kickPlayer: () => {}, dropParticipant: () => {}, reconnect: async () => {},
} }));
vi.mock('@/hooks/usePartySession', () => ({ replaceControllerPartySession: vi.fn() }));
import { abortControllerGame, controllerPartySession, getControllerState, openControllerParty, recordControllerResult, startControllerGame, stopControllerParty } from '@/games/party/controller-session';
import { readControllerResults, writeControllerResults } from '@/games/party/controller-outbox';
import { controllerScores } from '@/games/party/controller-result';
import { personalResult } from '@/games/social/result';
import { SCENE_LEAD_MS } from '@/lib/party-motion';
/** Match end is a shared 'round-end' scene: the room closes at its start, SCENE_LEAD_MS later. */
const roundEndScene = () => vi.advanceTimersByTimeAsync(SCENE_LEAD_MS);

const data = (revision = 1): ControllerPartyData => ({ party: { id: 'party', code: 'ABCDEF', revision, host_user_id: 'u1', host_player_id: 'p1', host_plays: true,
  premium: false, status: 'lobby', playlist: ['bomb'], current_match_id: null, current_game_id: null },
  members: [{ user_id: 'u1', player_id: 'p1', name: 'Alex', is_host: true }, { user_id: 'u2', player_id: 'p2', name: 'Alex', is_host: false }], results: [] });
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; };
beforeEach(() => {
  vi.useFakeTimers(); fixture.request.mockReset(); fixture.finish.mockReset();
  fixture.snapshot.room.sessionId = 'm1';
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key) });
});
afterEach(() => { stopControllerParty(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const playing = (): ControllerPartyData => ({ ...data(), party: { ...data().party, status: 'playing', current_match_id: 'm1', current_game_id: 'bomb' } });
const resultPayload = { match_id: 'm1', game_id: 'bomb', scores: { p1: 1, p2: 0 }, scored: true };

describe('controller party consistency', () => {
  it('keeps departed standings separate from active game slots and stable across polling', () => {
    const snapshot = data();
    snapshot.party.created_at = '2026-09-23T07:00:00Z';
    snapshot.past_members = [{ user_id: 'old', player_id: 'p3', name: 'Former player', is_host: false }];
    snapshot.results = [{ match_id: 'old-match', game_id: 'bomb', scores: { p1: 2, p3: 5 }, scored: true, created_at: '2026-09-23T07:01:00Z' }];
    const session = controllerPartySession(snapshot);
    expect(session.players.map(player => player.id)).toEqual(['p1', 'p2']);
    expect(session.archivedPlayers?.[0]).toMatchObject({ id: 'p3', gamesWon: 1, gamesPlayed: 1 });
    expect(session.gameHistory[0].winnerName).toBe('Former player');
    vi.advanceTimersByTime(4000);
    expect(controllerPartySession(snapshot)).toEqual(session);
  });
  it('uses stable IDs even when names are identical, and deduplicates completed matches', () => {
    const snapshot = data();
    const result = { match_id: 'm1', game_id: 'bomb', scores: { p1: 8, p2: 3 }, scored: true, created_at: '2026-09-22T12:00:00Z' };
    snapshot.results = [result, result];
    const session = controllerPartySession(snapshot);
    expect(session.gameHistory).toHaveLength(1);
    expect(session.players[0].gamesWon).toBe(1);
    expect(session.players[1].gamesWon).toBe(0);
    expect(session.players.map(p => p.gamesPlayed)).toEqual([1, 1]);
  });
  it('counts tied winners independently and preserves pause-game statistics', () => {
    const snapshot = data();
    snapshot.results = [{ match_id: 'm1', game_id: 'category', scores: { p1: 3, p2: 3 }, scored: true, created_at: '2026-09-22T12:00:00Z' },
      { match_id: 'm2', game_id: 'story-builder', scores: { p1: 0, p2: 0 }, scored: false, created_at: '2026-09-22T12:01:00Z' }];
    expect(controllerPartySession(snapshot).players.map(p => [p.gamesPlayed, p.gamesWon])).toEqual([[2, 1], [2, 1]]);
  });
  it('never installs an old read after a newer match start', async () => {
    const read = deferred<ControllerPartyData>();
    fixture.request.mockImplementation((action: string) => action === 'read' ? read.promise : action === 'start'
      ? Promise.resolve({ ...data(3), party: { ...data(3).party, status: 'playing', current_match_id: 'm1', current_game_id: 'bomb' } }) : Promise.resolve(data()));
    await openControllerParty('u1', 'Alex');
    await vi.advanceTimersByTimeAsync(4000);
    await startControllerGame('bomb');
    read.resolve(data(2));
    await vi.advanceTimersByTimeAsync(0);
    expect(getControllerState().data?.party.revision).toBe(3);
    expect(getControllerState().data?.party.status).toBe('playing');
  });
  it('cannot resurrect a stopped party from an in-flight result write', async () => {
    const finish = deferred<ControllerPartyData>();
    fixture.request.mockImplementation((action: string) => action === 'finish' ? finish.promise : Promise.resolve(playing()));
    await openControllerParty('u1', 'Alex');
    expect(recordControllerResult('bomb', { p1: 1, p2: 0 }, true)).toBe(true);
    stopControllerParty();
    finish.resolve(data(2));
    await vi.advanceTimersByTimeAsync(0);
    expect(getControllerState().data).toBeNull();
    expect(fixture.finish).not.toHaveBeenCalled();
  });
  it('a pending create cannot reconnect after sign-out', async () => {
    const create = deferred<ControllerPartyData>(); fixture.request.mockReturnValue(create.promise);
    const opening = openControllerParty('u1', 'Alex');
    await Promise.resolve(); stopControllerParty(); create.resolve(data()); await opening;
    expect(getControllerState().data).toBeNull();
  });
  it('persists before sending and resumes an interrupted result after reopening', async () => {
    fixture.request.mockImplementation((action: string) => action === 'finish' ? Promise.reject(new Error('offline')) : Promise.resolve(playing()));
    await openControllerParty('u1', 'Alex');
    expect(recordControllerResult('bomb', { p1: 1, p2: 0 }, true)).toBe(true);
    expect(readControllerResults('u1', 'party')).toEqual([resultPayload]);
    await vi.advanceTimersByTimeAsync(0);
    expect(getControllerState().pendingResults).toBe(1);
    stopControllerParty();
    fixture.request.mockImplementation((action: string) => Promise.resolve(action === 'finish' ? data(2) : playing()));
    await openControllerParty('u1', 'Alex', 'ABCDEF');
    await vi.advanceTimersByTimeAsync(0);
    expect(fixture.request).toHaveBeenLastCalledWith('finish', 'ABCDEF', resultPayload);
    expect(readControllerResults('u1', 'party')).toEqual([]);
    expect(getControllerState().pendingResults).toBe(0);
    await roundEndScene();
    expect(fixture.finish).toHaveBeenCalledTimes(1);
  });
  it('does not replay an acknowledged or aborted match from persistent storage', async () => {
    writeControllerResults('u1', 'party', [resultPayload]);
    fixture.request.mockResolvedValue(data(3));
    await openControllerParty('u1', 'Alex', 'ABCDEF');
    await vi.advanceTimersByTimeAsync(0);
    expect(fixture.request.mock.calls.some(([action]) => action === 'finish')).toBe(false);
    expect(readControllerResults('u1', 'party')).toEqual([]);
  });
  it('recovers the lobby when the server committed a result but its response was lost', async () => {
    const completed = { ...data(2), results: [{ ...resultPayload, created_at: '2026-09-23T07:01:00Z' }] };
    fixture.request.mockImplementation((action: string) => action === 'finish' ? Promise.reject(new Error('connection lost after commit')) : Promise.resolve(action === 'read' ? completed : playing()));
    await openControllerParty('u1', 'Alex');
    recordControllerResult('bomb', { p1: 1, p2: 0 }, true);
    await vi.advanceTimersByTimeAsync(4000);
    expect(getControllerState().data?.party.status).toBe('lobby');
    expect(getControllerState().pendingResults).toBe(0);
    await roundEndScene();
    expect(fixture.finish).toHaveBeenCalledOnce();
    expect(fixture.request.mock.calls.filter(([action]) => action === 'finish')).toHaveLength(1);
  });
  it('never sends another account or party outbox and rejects foreign scores', async () => {
    writeControllerResults('u2', 'party', [resultPayload]);
    writeControllerResults('u1', 'other-party', [resultPayload]);
    fixture.request.mockResolvedValue(playing());
    await openControllerParty('u1', 'Alex');
    expect(fixture.request.mock.calls.some(([action]) => action === 'finish')).toBe(false);
    expect(recordControllerResult('bomb', { p1: 1, intruder: 9 }, true)).toBe(false);
    expect(recordControllerResult('category', { p1: 1, p2: 0 }, true)).toBe(false);
    expect(getControllerState().pendingResults).toBe(0);
  });
  it('abort discards pending result retries', async () => {
    fixture.request.mockImplementation((action: string) => action === 'finish' ? Promise.reject(new Error('offline')) : Promise.resolve(action === 'abort' ? data(2) : playing()));
    await openControllerParty('u1', 'Alex');
    recordControllerResult('bomb', { p1: 1, p2: 0 }, true);
    await vi.advanceTimersByTimeAsync(0);
    await abortControllerGame();
    expect(readControllerResults('u1', 'party')).toEqual([]);
    expect(getControllerState().pendingResults).toBe(0);
  });
  it('a late finish acknowledgement cannot close the next match after an abort', async () => {
    const finish = deferred<ControllerPartyData>();
    fixture.request.mockImplementation((action: string) => action === 'finish' ? finish.promise : Promise.resolve(action === 'abort' ? data(3) : playing()));
    await openControllerParty('u1', 'Alex');
    recordControllerResult('bomb', { p1: 1, p2: 0 }, true);
    await abortControllerGame();
    await roundEndScene();
    expect(fixture.finish).toHaveBeenCalledTimes(1);
    fixture.snapshot.room.sessionId = 'm2';
    finish.resolve(data(2)); await vi.advanceTimersByTimeAsync(0);
    await roundEndScene();
    expect(fixture.finish).toHaveBeenCalledTimes(1);
    expect(getControllerState().data?.party.revision).toBe(3);
  });
});
describe('participant result projection', () => {
  it('drops foreign identities and invalid scores without name fallback', () => {
    expect(controllerScores('category', { partyScoresById: { p1: 2, intruder: 99, p2: NaN } }, ['p1', 'p2'])).toEqual({ p1: 2 });
    expect(controllerScores('category', { players: [{ name: 'Alex', score: 9 }] }, ['p1'])).toEqual({});
  });
  it('inverts penalties for bomb without merging duplicate names', () => {
    expect(controllerScores('bomb', { players: [{ id: 'p1', name: 'Alex', penalties: 1 }, { id: 'p2', name: 'Alex', penalties: 4 }] }, ['p1', 'p2'])).toEqual({ p1: 3, p2: 0 });
  });
  it('records a losing participant and shared winners correctly', () => {
    const players = [{ id: 'a', score: 5 }, { id: 'b', score: 5 }, { id: 'c', score: 2 }];
    expect(personalResult(players, 'c')).toEqual({ score: 2, won: false });
    expect(personalResult(players, 'b')).toEqual({ score: 5, won: true });
    expect(personalResult(players, 'missing')).toEqual({ score: 0, won: false });
  });
});
