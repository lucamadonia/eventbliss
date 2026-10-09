import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useGameRoom } from '@/games/multiplayer/useGameRoom';
import { openControllerParty, ownMember, refreshControllerParty, stopControllerParty, useControllerParty } from '@/games/party/controller-session';
import { getActivePartySession, replaceControllerPartySession } from '@/hooks/usePartySession';
import { clearPartyScene, getPartyScene, sceneGoAt, usePartyScene, type PartyScene } from '@/games/party/party-scene';
import { sceneLocalTime } from '@/games/party/scene-schedule';
import { controllerInvitationCode, takeInvitation } from './controller-invitation';
import { KickUndoSnackbar } from './KickUndoSnackbar';
import { PartySceneLayer } from './PartySceneLayer';

/** One mounted coordinator owns routing across lobby, games and intermission. */
export function ControllerPartyCoordinator() {
  const auth = useAuthContext();
  const controller = useControllerParty();
  const room = useGameRoom();
  const scene = usePartyScene();
  const navigate = useNavigate();
  const location = useLocation();
  const resumed = useRef('');
  const routedPhase = useRef<string | null>(null);
  const retriedLobbyPhase = useRef<string | null>(null);
  const routedRemoval = useRef<object | null>(null);
  /** Match whose shared round-end moment has passed: route out even before the room says so. */
  const endedMatch = useRef<string | null>(null);
  const [goTick, setGoTick] = useState(0);
  useEffect(() => {
    const local = getActivePartySession();
    if (local?.playMode !== 'local' || !controller.data || controller.busy || location.pathname === '/party/controllers') return;
    // A previously opened controller room must not poll over a newly started
    // local evening. Disconnect it on this device and restore that evening.
    stopControllerParty();
    replaceControllerPartySession(local);
  }, [controller.data, controller.busy, location.pathname]);
  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.user) { if (controller.data) stopControllerParty(); return; }
    // Another account signed in on this device. Kicks are handled by the session itself.
    if (controller.data && !controller.seatless && !ownMember(controller.data, auth.user.id) && !controller.data.members.some(m => m.pending_claim_mine)) { stopControllerParty(); return; }
    if (controller.data || resumed.current === auth.user.id || location.pathname.startsWith('/party/join/')) return;
    // A remembered controller room must not replace an evening already running
    // on this phone. Explicit activation handles that evening instead.
    if (getActivePartySession()?.playMode === 'local') return;
    resumed.current = auth.user.id;
    // An invitation parked before a login detour wins over resuming an old party.
    const invite = takeInvitation();
    if (invite) { navigate(`/party/join/${invite}`, { replace: true }); return; }
    // Never bounce a removed player back into the party they were removed from.
    if (controller.removed) return;
    let code: string | null = null;
    try { code = localStorage.getItem(`controller_party:${auth.user.id}`); } catch { /* optional */ }
    if (code) void openControllerParty(auth.user.id, String(auth.user.user_metadata?.display_name ?? 'Player'), code, true, { resume: true }).catch(() => { /* lobby displays retry */ });
  }, [auth.isLoading, auth.user, controller.data, controller.seatless, controller.removed, location.pathname, navigate]);
  // A removed device leaves the game screen once and shows the notice in the lobby route.
  useEffect(() => {
    const removal = controller.removed;
    if (!removal || routedRemoval.current === removal) return;
    routedRemoval.current = removal;
    if (location.pathname !== '/party/controllers') navigate('/party/controllers', { replace: true });
  }, [controller.removed, location.pathname, navigate]);
  // The shared moment of a scene: everyone routes now, not when their next message arrives.
  const onSceneGo = useCallback((done: PartyScene) => {
    if (done.scene === 'round-end' && done.data?.matchKey) endedMatch.current = done.data.matchKey;
    clearPartyScene(done.sceneId);
    setGoTick(tick => tick + 1);
    void refreshControllerParty();
  }, []);
  // A backgrounded phone may miss the countdown's final render. The scene must
  // still release its routing gate once its shared "Go" moment has passed.
  useEffect(() => {
    if (!scene || scene.scene === 'finale') return;
    const wait = Math.max(0, sceneLocalTime(sceneGoAt(scene)) - Date.now() + 1500);
    const id = setTimeout(() => {
      if (getPartyScene()?.sceneId === scene.sceneId) onSceneGo(scene);
    }, wait);
    return () => clearTimeout(id);
  }, [scene, onSceneGo]);
  useEffect(() => {
    const data = controller.data;
    if (!data) { routedPhase.current = null; return; }
    if (getActivePartySession()?.playMode === 'local') return;
    if (auth.isLoading || !auth.user || room.room?.roomCode !== data.party.code) return;
    const invitation = controllerInvitationCode(location.pathname);
    if (invitation && invitation !== data.party.code.toUpperCase()) return;
    // "Wer bist du?" first; a joiner never gets pulled into a running game before it.
    if (controller.onboarding) return;
    // A planned scene decides the moment; routing waits for its "Los!".
    if (scene && scene.scene !== 'finale') return;
    const isHost = data.party.host_user_id === auth.user?.id;
    const active = room.room.participantIds.includes(room.myPlayerId);
    // The signed room state from the Host is immediate; the party poll is only the fallback.
    // The signed room state is fast, but only a match the SERVER started counts: a stale or
    // unsynced 'playing' room must never pull anyone into a game the Host did not start.
    const serverStarted = data.party.status === 'playing' && data.party.current_match_id === room.room.sessionId
      && data.party.current_game_id === room.room.gameId;
    const playing = room.room.status === 'playing' && serverStarted && room.room.sessionId !== endedMatch.current;
    const path = playing && (active || isHost)
      ? `/games/${room.room.gameId}?room=${data.party.code}&party=true`
      : '/party/controllers';
    // Route once per party phase. A location-only change (Back, tab, auth or
    // another redirect) must not start a replaceState tug-of-war on iOS.
    const phase = `${data.party.id}:${playing ? room.room.sessionId : 'lobby'}:${path}`;
    if (routedPhase.current === phase) {
      // A game screen can be replaced by an app transition after our first
      // navigation. Recover once, without a replaceState loop on WebKit.
      if (playing && (active || isHost) && location.pathname === '/party/controllers'
        && retriedLobbyPhase.current !== phase) {
        retriedLobbyPhase.current = phase;
        navigate(path, { replace: true });
      }
      return;
    }
    routedPhase.current = phase;
    retriedLobbyPhase.current = null;
    if (location.pathname + location.search !== path) navigate(path, { replace: true });
  }, [controller.data, controller.onboarding, scene, goTick, room.room, room.myPlayerId, auth.isLoading, auth.user, navigate, location.pathname, location.search]);
  const isHost = !!controller.data && controller.data.party.host_user_id === auth.user?.id;
  return <>
    {controller.data && <PartySceneLayer isHost={isHost} onGo={onSceneGo} />}
    <KickUndoSnackbar />
  </>;
}
