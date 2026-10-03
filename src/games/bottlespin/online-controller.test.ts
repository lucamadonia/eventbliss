import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';

const hooks = vi.hoisted(() => ({ refs: new Map<string, { current: unknown }[]>(), key: '', index: 0, cleanups: new Map<string, (() => void)[]>() }));
vi.mock('react', () => ({
  useRef: (initial: unknown) => {
    const refs = hooks.refs.get(hooks.key) ?? []; hooks.refs.set(hooks.key, refs);
    const index = hooks.index++;
    refs[index] ??= { current: initial };
    return refs[index];
  },
  useCallback: (fn: unknown) => fn,
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    if (cleanup) { const list = hooks.cleanups.get(hooks.key) ?? []; list.push(cleanup); hooks.cleanups.set(hooks.key, list); }
  },
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
// The shared waiting stage reads the live room (supabase client → localStorage); it is not under test here.
vi.mock('../multiplayer/OnlineWaiting', () => ({ default: () => null }));
import { canAct, useOnlineActions, useOnlinePrivateSnapshot, useOnlineSnapshot } from './online-controller';

function render<T>(key: string, run: () => T): T {
  for (const cleanup of hooks.cleanups.get(key) ?? []) cleanup();
  hooks.cleanups.set(key, []); hooks.key = key; hooks.index = 0;
  return run();
}
function room() {
  type Listener = (data: Record<string, unknown>) => void;
  const listeners = new Map<string, Set<Listener>>();
  const deliveries: { sender: string; recipient?: string; event: string; data: Record<string, unknown> }[] = [];
  const members = ['host', 'alice', 'bob'].map(id => ({ id, name: id, color: '#fff', avatar: '', isHost: id === 'host', isReady: true, isPremium: false }));
  const device = (id: string): OnlineGameProps => ({
    isOnline: true, isHost: id === 'host', roomCode: 'ABC123', players: members, myPlayerId: id, roomHasPremium: false,
    broadcast: (event, data) => {
      deliveries.push({ sender: id, event, data });
      for (const member of members) if (member.id !== id) for (const fn of listeners.get(`${member.id}:${event}`) ?? []) fn({ ...data, __senderId: id });
    },
    broadcastTo: (recipient, event, data) => {
      deliveries.push({ sender: id, recipient, event, data });
      for (const fn of listeners.get(`${recipient}:${event}`) ?? []) fn({ ...data, __senderId: id });
    },
    onBroadcast: (event, fn) => { const key = `${id}:${event}`; const set = listeners.get(key) ?? new Set(); set.add(fn); listeners.set(key, set); return () => { set.delete(fn); }; },
  });
  return { host: device('host'), alice: device('alice'), bob: device('bob'), deliveries };
}
beforeEach(() => { hooks.refs.clear(); hooks.cleanups.clear(); });

describe('authoritative online actions', () => {
  it('routes the active guest input to the host exactly once and never runs the guest engine', () => {
    const r = room(); const hostRun = vi.fn(); const guestRun = vi.fn();
    render('host', () => useOnlineActions(r.host, 'storybuilder', 'writing:1:alice', { sentence: { allowed: 'alice', run: hostRun } }));
    const act = render('alice', () => useOnlineActions(r.alice, 'storybuilder', 'writing:1:alice', { sentence: { allowed: 'alice', run: guestRun } }));
    act('sentence', 'Ein neuer Satz.');
    expect(hostRun).toHaveBeenCalledOnce(); expect(hostRun).toHaveBeenCalledWith('Ein neuer Satz.'); expect(guestRun).not.toHaveBeenCalled();
  });
  it('rejects a wrong player even when the payload claims the active player ID', () => {
    const r = room(); const run = vi.fn();
    render('host', () => useOnlineActions(r.host, 'quickdraw', 'drawing:1', { finish: { allowed: 'alice', run } }));
    r.bob.broadcast('quickdraw-action', { action: 'finish', args: [], turn: 'drawing:1', playerId: 'alice', __senderId: 'alice' });
    expect(run).not.toHaveBeenCalled();
  });
  it('rejects late commands from a previous round, unknown commands and guest rematches', () => {
    const r = room(); const run = vi.fn();
    render('host', () => useOnlineActions(r.host, 'taboo', 'playing:1', { correct: { allowed: 'alice', run } }));
    render('host', () => useOnlineActions(r.host, 'taboo', 'playing:2', { correct: { allowed: 'alice', run }, again: { allowed: 'host', run } }));
    r.alice.broadcast('taboo-action', { action: 'correct', args: [], turn: 'playing:1' });
    r.alice.broadcast('taboo-action', { action: 'again', args: [], turn: 'playing:2' });
    r.alice.broadcast('taboo-action', { action: 'unknown', args: [], turn: 'playing:2' });
    expect(run).not.toHaveBeenCalled();
    r.alice.broadcast('taboo-action', { action: 'correct', args: [], turn: 'playing:2' });
    expect(run).toHaveBeenCalledOnce();
  });
  it('requires membership and permits the real host to start without self echo', () => {
    const r = room(); const run = vi.fn();
    expect(canAct(r.host, true, 'outsider')).toBe(false);
    const act = render('host', () => useOnlineActions(r.host, 'category', 'setup', { start: { allowed: 'host', run } }));
    act('start'); expect(run).toHaveBeenCalledOnce(); expect(r.deliveries).toHaveLength(0);
  });
  it('lets only the controlling device act for a 🔁 guest seat', () => {
    const r = room();
    const guest = { id: 'max', name: 'Max', color: '#fff', avatar: 'M', isHost: false, isReady: true, isPremium: false, controlledBy: 'host' };
    const online = { ...r.host, players: [...r.host.players, guest] };
    expect(canAct(online, 'max', 'host')).toBe(true);
    expect(canAct(online, 'max', 'alice')).toBe(false);
    expect(canAct(online, 'max', 'max')).toBe(true);
    expect(canAct(online, 'alice', 'host')).toBe(false);
  });
  it('blocks outgoing and incoming actions while the room is paused', () => {
    const r = room(); const run = vi.fn();
    r.host.isConnected = false; r.alice.isConnected = false;
    render('host', () => useOnlineActions(r.host, 'taboo', 'playing:1', { correct: { allowed: 'alice', run } }));
    const act = render('alice', () => useOnlineActions(r.alice, 'taboo', 'playing:1', { correct: { allowed: 'alice', run } }));
    expect(act.can('correct')).toBe(false);
    act('correct'); expect(r.deliveries).toHaveLength(0);
    r.alice.broadcast('taboo-action', { action: 'correct', args: [], turn: 'playing:1' });
    expect(run).not.toHaveBeenCalled();
  });
});

describe('snapshots', () => {
  it('hydrates an empty guest roster, complete settings and explicit null content', () => {
    const r = room(); let state = { players: [] as string[], phase: 'setup', rounds: 1, card: 'old' as string | null };
    render('alice', () => useOnlineSnapshot(r.alice, 'bottlespin', state, incoming => { state = incoming; }));
    render('host', () => useOnlineSnapshot(r.host, 'bottlespin', { players: ['host', 'alice', 'bob'], phase: 'spinning', rounds: 8, card: null }, () => {}));
    expect(state).toMatchObject({ players: ['host', 'alice', 'bob'], phase: 'spinning', rounds: 8, card: null });
  });
  it('sends secret words only through encrypted per-recipient transport and clears them for other players', () => {
    const r = room(); const receivedAlice = vi.fn(); const receivedBob = vi.fn();
    const state = { phase: 'drawing', word: 'Elefant' as string | null };
    const project = (snapshot: typeof state, id: string) => ({ ...snapshot, word: id === 'alice' ? snapshot.word : null });
    render('alice', () => useOnlinePrivateSnapshot(r.alice, 'quickdraw', state, project, receivedAlice));
    render('bob', () => useOnlinePrivateSnapshot(r.bob, 'quickdraw', state, project, receivedBob));
    render('host', () => useOnlinePrivateSnapshot(r.host, 'quickdraw', state, project, () => {}));
    expect(receivedAlice).toHaveBeenCalledWith(expect.objectContaining({ word: 'Elefant' }));
    expect(receivedBob).toHaveBeenCalledWith(expect.objectContaining({ word: null }));
    expect(r.deliveries.every(packet => packet.recipient !== undefined)).toBe(true);
  });
  it('never falls back to leaking secrets when private transport is unavailable', () => {
    const r = room(); r.host.broadcastTo = undefined;
    render('host', () => useOnlinePrivateSnapshot(r.host, 'taboo', { secret: 'Elefant' }, state => state, () => {}));
    expect(r.deliveries).toHaveLength(0);
  });
});


describe('non-playing moderator authority', () => {
  it('allows host controls without granting the moderator a player action', () => {
    const r = room();
    const moderator = { ...r.host, hostPlayerId: 'host', players: r.host.players.filter(p => !p.isHost) };
    expect(canAct(moderator, 'host', 'host')).toBe(true);
    expect(canAct(moderator, 'alice', 'host')).toBe(false);
    expect(canAct(moderator, true, 'host')).toBe(false);
    expect(canAct(moderator, 'host', 'alice')).toBe(false);
    const setup = vi.fn(), move = vi.fn();
    const act = render('moderator', () => useOnlineActions(moderator, 'test', 'setup', {
      start: { allowed: 'host', run: setup }, move: { allowed: 'alice', run: move },
    }));
    act('start'); act('move');
    expect(setup).toHaveBeenCalledOnce(); expect(move).not.toHaveBeenCalled();
  });
});

describe('„zu spät“ notice (F12)', () => {
  it('never fires for a flaschendrehen spin race, only for a late answer', () => {
    const r = room();
    const notices: string[] = [];
    const host = { ...r.host, broadcastTo: (recipient: string, event: string) => { if (event === 'party-late') notices.push(recipient); } };
    const run = vi.fn();
    // Turn moved from "spinning:1:-1:0:true" to "spinning:1:-1:0:false" (spin stopped) while Alice tapped spin.
    render('host', () => useOnlineActions(host, 'bottlespin', 'spinning:1:-1:0:false:false', { spin: { allowed: 'alice', run } }));
    r.alice.broadcast('bottlespin-action', { action: 'spin', args: [], turn: 'spinning:1:-1:0:true:false' });
    expect(notices).toEqual([]);
    expect(run).not.toHaveBeenCalled();
    // A vote for a voter turn that already closed is a late answer.
    render('host', () => useOnlineActions(host, 'bottlespin', 'vote:1:2:1:false:false', { vote: { allowed: 'alice', run, answer: true } }));
    r.alice.broadcast('bottlespin-action', { action: 'vote', args: [true], turn: 'vote:1:2:0:false:false' });
    expect(notices).toEqual(['alice']);
    expect(run).not.toHaveBeenCalled();
  });
});
