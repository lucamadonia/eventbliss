import React, { Suspense, useEffect, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/index.css';
import i18n, { i18nInitPromise, loadLocale } from '@/i18n';
import { ControllerPartyCoordinator } from '@/components/native/party/ControllerPartyCoordinator';
import { ControllerGameControls } from '@/components/native/party/ControllerGameControls';
import ControllerPartyLobby from '@/components/native/party/ControllerPartyLobby';
import PartyLobbyScreen from '@/pages/native/PartyLobbyScreen';
import { gameRoomSession, useGameRoom } from '@/games/multiplayer/useGameRoom';
import OnlineGameWrapper from '@/games/multiplayer/OnlineGameWrapper';
import GameLobby from '@/games/multiplayer/GameLobby';
import { TVBroadcastProvider, useTVContext } from '@/contexts/TVBroadcastContext';
import TVScreen from '@/games/tv/TVScreen';
import { AuthProvider, useAuthContext } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { playableGames } from '@/lib/playable-games';
import { normalizeGameId } from '@/games/ui/game-rules';
import * as controller from '@/games/party/controller-session';
import { controllerRequest } from '@/games/party/controller-api';
import { getActivePartySession, subscribePartySession } from '@/hooks/usePartySession';

// Party-Play QA page: one tab = one device (phone, host or TV). Mounted by
// party-play-harness.mjs; every screen is the real React component.
const lazy = (load: () => Promise<{ default: React.ComponentType<any> }>) => React.lazy(load);
const games: Record<string, React.ComponentType<any>> = {
  bomb: lazy(() => import('@/games/bomb/BombGame')), hochstapler: lazy(() => import('@/games/impostor/ImpostorGame')),
  'split-quiz': lazy(() => import('@/games/splitquiz/SplitQuizGame')), 'wo-ist-was': lazy(() => import('@/games/findit/FindItGame')),
  category: lazy(() => import('@/games/category/CategoryGame')), headup: lazy(() => import('@/games/headup/HeadUpGame')),
  taboo: lazy(() => import('@/games/taboo/TabooGame')), 'drueck-das-wort': lazy(() => import('@/games/wordpress/WordPressGame')),
  'geteilt-gequizzt': lazy(() => import('@/games/sharedquiz/SharedQuizGame')), schnellzeichner: lazy(() => import('@/games/quickdraw/QuickDrawGame')),
  'wahrheit-pflicht': lazy(() => import('@/games/truthdare/TruthDareGame')), 'this-or-that': lazy(() => import('@/games/thisorthat/ThisOrThatGame')),
  'wer-bin-ich': lazy(() => import('@/games/whoami/WhoAmIGame')), 'emoji-raten': lazy(() => import('@/games/emojiguess/EmojiGuessGame')),
  'fake-or-fact': lazy(() => import('@/games/fakeorfact/FakeOrFactGame')), 'story-builder': lazy(() => import('@/games/storybuilder/StoryBuilderGame')),
  flaschendrehen: lazy(() => import('@/games/bottlespin/BottleSpinGame')), ohrwurm: lazy(() => import('@/games/ohrwurm/OhrwurmGame')),
  pixeljagd: lazy(() => import('@/games/pixeljagd/PixeljagdGame')), closeenough: lazy(() => import('@/games/closeenough/CloseEnoughGame')),
  pantomime: lazy(() => import('@/games/pantomime/PantomimeGame')), brew: lazy(() => import('@/games/brew/BrewGame')),
};
const LocalGamesHub = lazy(() => import('@/pages/GamesHub'));

function GameRoute() {
  const { gameId: id } = useParams(); const room = useGameRoom(); const tv = useTVContext(); const navigate = useNavigate(); const loc = useLocation();
  useEffect(() => { tv?.setOnlineRoom(room.room?.roomCode ?? null); }, [room.room?.roomCode, tv]);
  const Game = games[id!];
  if (!Game) return <p data-testid="qa-missing-game">Missing game {id}</p>;
  // One-phone local party (/games/<id>?party=true, no room): the real GamesHub, as in NativeApp.
  if (!room.room && new URLSearchParams(loc.search).get('party') === 'true') return <Suspense fallback={null}><LocalGamesHub /></Suspense>;
  if (!room.room) return <p data-testid="qa-no-room">No room</p>;
  return <OnlineGameWrapper key={`${id}:${room.room.sessionId}`} gameId={id!} roomCode={room.room.roomCode} playerName={String(window.controllerIdentity?.user_metadata?.display_name ?? 'Player')}>
    {online => <><ControllerGameControls /><Game online={online} onClose={() => navigate('/party/controllers')} /></>}
  </OnlineGameWrapper>;
}

/** Online room ("Schnelle Runde"): the real GameLobby; start routes into the game like GamesHub. */
function LobbyRoute() {
  const { gameId } = useParams(); const navigate = useNavigate();
  return <GameLobby gameId={gameId!} gameName={gameId!} onBack={() => navigate('/party')} onStart={(_players: unknown, code: string, id: string) => navigate(`/games/${id}?room=${code}`)} />;
}

/** Mirrors NativeApp: party TV code, floating TV pill only on /games routes and never in a joystick party. */
function ShellTV({ children }: { children: React.ReactNode }) {
  const location = useLocation(); const party = useSyncExternalStore(subscribePartySession, getActivePartySession, () => null);
  const showTvPill = location.pathname.startsWith('/games') && party?.playMode !== 'controllers';
  return <TVBroadcastProvider sessionCode={party?.isActive ? party.tvCode : undefined} showConnectButton={showTvPill}>{children}</TVBroadcastProvider>;
}

/** Stand-in for /auth: after the harness signs in, continue to ?redirect= like the real page. */
function AuthStub() {
  const auth = useAuthContext(); const [params] = useSearchParams(); const navigate = useNavigate();
  useEffect(() => { if (auth.user) navigate(params.get('redirect') || '/party/controllers', { replace: true }); }, [auth.user, navigate, params]);
  return <main data-testid="qa-auth-page"><h1>Sign in</h1><p>{params.get('redirect')}</p></main>;
}

function RoutesUnderTest() {
  const navigate = useNavigate(); const location = useLocation(); const tvCtx = useTVContext();
  window.controllerQA = {
    tvCode: () => tvCtx?.displayCode ?? null, tvActive: () => !!tvCtx?.isActive, leaveRoom: gameRoomSession.leaveRoom,
    snapshot: gameRoomSession.getSnapshot, state: controller.getControllerState, navigate, ready: gameRoomSession.setReady,
    playlist: controller.setControllerPlaylist, start: controller.startControllerGame, abort: controller.abortControllerGame,
    retry: controller.retryControllerConnection, route: () => location.pathname + location.search,
    // Raw server action as this device's account (seeding guests, races, manipulated requests).
    request: (action: string, code: string | null, payload = {}) => controllerRequest(action as never, code, payload),
  };
  useEffect(() => { window.__qaRouteLog.push({ route: location.pathname + location.search, at: performance.timeOrigin + performance.now() }); }, [location.pathname, location.search]);
  const isTV = location.pathname.startsWith('/tv');
  const content = <><output id="qa-route" className="sr-only">{location.pathname}</output><Suspense fallback={<p>Loading</p>}><Routes>
    <Route path="/party" element={<PartyLobbyScreen />} />
    <Route path="/tv/:roomCode" element={<TVScreen />} />
    <Route path="/party/controllers" element={<ControllerPartyLobby />} />
    <Route path="/party/join/:code" element={<ControllerPartyLobby />} />
    <Route path="/games/:gameId" element={<GameRoute />} />
    <Route path="/auth" element={<AuthStub />} />
    <Route path="/lobby/:gameId" element={<LobbyRoute />} />
    <Route path="*" element={<ControllerPartyLobby />} />
  </Routes></Suspense></>;
  return isTV ? content : <><ControllerPartyCoordinator />{content}</>;
}

// Trace buffers: app hooks push into __partyPlayTrace; __qaSeen records when each data-testid first
// became visible (true wall time, independent of a mocked Date) so the harness can time UI updates.
const wall = () => performance.timeOrigin + performance.now();
window.__partyPlayTrace ??= [];
window.__qaSeen = {}; window.__qaSeenLog = []; window.__qaRouteLog = [];
let dirty = true;
new MutationObserver(() => { dirty = true; }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-testid', 'data-ready', 'data-seat', 'style', 'class'] });
const scan = () => {
  if (dirty) {
    dirty = false; const now = wall(); const visible = new Set<string>();
    for (const node of document.querySelectorAll('[data-testid]')) { const box = (node as HTMLElement).getBoundingClientRect(); if (box.width && box.height) visible.add(node.getAttribute('data-testid')!); }
    for (const id of visible) if (!(id in window.__qaSeen)) { window.__qaSeen[id] = now; window.__qaSeenLog.push({ id, at: now, shown: true }); }
    for (const id of Object.keys(window.__qaSeen)) if (!visible.has(id)) { delete window.__qaSeen[id]; window.__qaSeenLog.push({ id, at: now, shown: false }); }
    if (window.__qaSeenLog.length > 4000) window.__qaSeenLog.splice(0, 1000);
  }
  requestAnimationFrame(scan);
};
requestAnimationFrame(scan);
window.controllerTVMessages = [];
const original = supabase.channel.bind(supabase); const observed = new WeakSet();
supabase.channel = (...args: unknown[]) => { const channel = original(...args); if (!observed.has(channel)) { observed.add(channel); for (const event of ['tv-state', 'game-start', 'tv-state-sync']) channel.on('broadcast', { event }, ({ payload }: any) => window.controllerTVMessages.push({ event, at: wall(), game: payload?.game, phase: payload?.phase, correctAnswer: payload?.correctAnswer, lobby: payload?.lobby, scene: payload?.scene, keys: Object.keys(payload ?? {}), internalScoresPresent: !!payload && 'partyScoresById' in payload })); if (window.controllerTVMessages.length > 600) window.controllerTVMessages.splice(0, 200); } return channel; };
window.controllerGameStates = {}; window.controllerGameLog = [];
for (const event of ['game-state', 'bottlespin-state', 'bomb-state']) gameRoomSession.onBroadcast(event, data => { window.controllerGameStates[event] = data; });
window.qaErrors = []; window.addEventListener('error', e => window.qaErrors.push(e.error?.stack ?? e.message)); window.addEventListener('unhandledrejection', e => window.qaErrors.push(String(e.reason?.stack ?? e.reason)));
if (window.controllerCredentials) { const r = await supabase.auth.signInWithPassword(window.controllerCredentials); if (r.error) throw r.error; const u = await supabase.auth.updateUser({ data: { display_name: window.controllerIdentity.user_metadata.display_name } }); if (u.error) throw u.error; window.controllerIdentity = u.data.user; }
const lang = window.qaLanguage ?? 'en';
await i18nInitPromise; await loadLocale(lang); await i18n.changeLanguage(lang);
window.qaT = (key: string) => i18n.t(key); // translated labels for text-based harness steps
document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
for (const game of playableGames) for (const id of [game.id, normalizeGameId(game.id)]) sessionStorage.setItem(`eb.rules-seen.${id}`, '1');
// "App start" for A01: dev-server module loading (unbundled, several seconds) is excluded.
window.__qaAppStart = wall();
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
  <MemoryRouter initialEntries={[window.controllerInitialRoute ?? '/party/controllers']}>
    <AuthProvider><ShellTV><RoutesUnderTest /></ShellTV></AuthProvider>
  </MemoryRouter></QueryClientProvider>);
