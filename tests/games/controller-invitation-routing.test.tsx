import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  effects: [] as Array<() => void>, navigate: vi.fn(), open: vi.fn(), stop: vi.fn(),
  pathname: '/party/join/BCDEFG', code: 'ABCDEF', playing: true, restored: true, serverPlaying: null as boolean | null,
}));
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: (effect: () => void) => { state.effects.push(effect); },
  useRef: <T,>(initial: T) => ({ current: initial }),
  // The coordinator renders outside React here: plain stand-ins for its local state.
  useState: <T,>(initial: T) => [initial, () => {}],
  useCallback: <T,>(fn: T) => fn,
}));
// The scene layer and undo toast pull in the TV/Supabase stack; routing is under test, not they.
vi.mock('@/components/native/party/PartySceneLayer', () => ({ PartySceneLayer: () => null }));
vi.mock('@/components/native/party/KickUndoSnackbar', () => ({ KickUndoSnackbar: () => null }));
vi.mock('@/games/party/party-scene', () => ({ usePartyScene: () => null, clearPartyScene: () => {} }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate, useLocation: () => ({ pathname: state.pathname, search: '' }) }));
vi.mock('@/components/auth/AuthProvider', () => ({ useAuthContext: () => ({ isLoading: false, user: { id: 'guest', user_metadata: {} } }) }));
vi.mock('@/games/party/controller-session', () => ({
  openControllerParty: state.open, stopControllerParty: state.stop, refreshControllerParty: async () => {},
  ownMember: (data: { members: { user_id: string }[] } | null, userId: string) => data?.members.find(m => m.user_id === userId) ?? null,
  useControllerParty: () => ({ data: state.restored ? { party: { code: state.code, host_user_id: 'host', status: (state.serverPlaying ?? state.playing) ? 'playing' : 'lobby', current_match_id: 'active-match', current_game_id: 'bomb' }, members: [{ user_id: 'guest' }] } : null }),
}));
vi.mock('@/games/multiplayer/useGameRoom', () => ({ useGameRoom: () => ({ myPlayerId: 'guest-player', room: state.restored ? { roomCode: state.code, gameId: 'bomb', sessionId: 'active-match', participantIds: ['guest-player'], status: state.playing ? 'playing' : 'lobby' } : null }) }));
import { ControllerPartyCoordinator } from '@/components/native/party/ControllerPartyCoordinator';

function renderAndRunEffects() {
  state.effects = [];
  // Execute the actual coordinator against controlled hooks, then flush its
  // effects. No renderer/React singleton mixing or simulated routing policy.
  ControllerPartyCoordinator();
  state.effects.forEach(effect => effect());
}
beforeEach(() => {
  vi.clearAllMocks(); state.pathname = '/party/join/BCDEFG'; state.code = 'ABCDEF'; state.playing = true; state.restored = true; state.serverPlaying = null;
});
describe('actual coordinator invitation routing effects', () => {
  it('does not redirect a warm B invitation into the active A game', () => {
    renderAndRunEffects();
    expect(state.navigate).not.toHaveBeenCalled();
    expect(state.stop).not.toHaveBeenCalled();
    expect(state.open).not.toHaveBeenCalled();
  });
  it('preserves the invitation before and after delayed cold restore completes', () => {
    state.restored = false; renderAndRunEffects();
    expect(state.open).not.toHaveBeenCalled();
    state.restored = true; renderAndRunEffects();
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it('keeps B on screen while A is in the lobby too', () => {
    state.playing = false; renderAndRunEffects();
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it('resumes the current game when the invitation targets that same party', () => {
    state.pathname = '/party/join/abcdef'; renderAndRunEffects();
    expect(state.navigate).toHaveBeenCalledWith('/games/bomb?room=ABCDEF&party=true', { replace: true });
  });
  it('returns to A when the user cancels the replacement invitation', () => {
    state.pathname = '/party/controllers'; renderAndRunEffects();
    expect(state.navigate).toHaveBeenCalledWith('/games/bomb?room=ABCDEF&party=true', { replace: true });
  });
  it('never jumps into a game the server has not started (stale room state)', () => {
    state.pathname = '/party/controllers'; state.serverPlaying = false; renderAndRunEffects();
    expect(state.navigate).not.toHaveBeenCalledWith('/games/bomb?room=ABCDEF&party=true', { replace: true });
  });
});
