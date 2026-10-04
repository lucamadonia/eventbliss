import React,{Suspense,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,MemoryRouter,Routes,Route,useNavigate,useLocation,useParams} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import '@/index.css';
import i18n,{i18nInitPromise,loadLocale} from '@/i18n';
import {ControllerPartyCoordinator} from '@/components/native/party/ControllerPartyCoordinator';
import {ControllerGameControls} from '@/components/native/party/ControllerGameControls';
import {NativeShell} from '@/components/native/NativeShell';
import {PageTransition} from '@/components/native/PageTransition';
import PartyLobbyScreen from '@/pages/native/PartyLobbyScreen';
import ControllerPartyLobby from '@/components/native/party/ControllerPartyLobby';
import {gameRoomSession,useGameRoom} from '@/games/multiplayer/useGameRoom';
import OnlineGameWrapper from '@/games/multiplayer/OnlineGameWrapper';
import {TVBroadcastProvider,useTVContext} from '@/contexts/TVBroadcastContext';
import TVScreen from '@/games/tv/TVScreen';
import {AuthProvider} from '@/components/auth/AuthProvider';
import {supabase} from '@/integrations/supabase/client';
import * as controller from '@/games/party/controller-session';
const games={
 'fake-or-fact':React.lazy(()=>import('@/games/fakeorfact/FakeOrFactGame')),
 flaschendrehen:React.lazy(()=>import('@/games/bottlespin/BottleSpinGame')),
 'this-or-that':React.lazy(()=>import('@/games/thisorthat/ThisOrThatGame')),
};
function GameRoute(){const {gameId:id}=useParams();const room=useGameRoom();const tv=useTVContext();useEffect(()=>{tv?.setOnlineRoom(room.room?.roomCode??null);},[room.room?.roomCode,tv]);const Game=games[id as keyof typeof games];return Game&&room.room?<OnlineGameWrapper key={`${id}:${room.room.sessionId}`} gameId={id!} roomCode={room.room.roomCode} playerName={window.controllerIdentity.user_metadata.display_name}>{online=><><ControllerGameControls/><Game online={online}/></>}</OnlineGameWrapper>:<p>Missing game</p>;}
function RoutesUnderTest(){const room=useGameRoom();const navigate=useNavigate();const location=useLocation(); window.controllerQA={snapshot:gameRoomSession.getSnapshot,state:controller.getControllerState,navigate,ready:gameRoomSession.setReady,playlist:controller.setControllerPlaylist,start:controller.startControllerGame,retry:controller.retryControllerConnection,connection:()=>({online:navigator.onLine,socket:supabase.realtime?.connectionState(),disconnecting:supabase.realtime?.isDisconnecting(),channels:supabase.getChannels?.().map(channel=>({topic:channel.topic,state:channel.state,present:Object.keys(channel.presenceState())}))})};
 const content=<><output id="qa-route" className="sr-only">{location.pathname}</output><Suspense fallback={<p>Loading game</p>}><Routes><Route path="/party" element={<PartyLobbyScreen/>}/><Route path="/tv/:roomCode" element={<TVScreen/>}/><Route path="/party/controllers" element={<ControllerPartyLobby/>}/><Route path="/party/join/:code" element={<ControllerPartyLobby/>}/><Route path="/games/:gameId" element={<GameRoute/>}/><Route path="*" element={<ControllerPartyLobby/>}/></Routes></Suspense></>;return window.controllerNativeShell?<NativeShell><ControllerPartyCoordinator/><PageTransition>{content}</PageTransition></NativeShell>:<><ControllerPartyCoordinator/>{content}</>;}
window.controllerTVMessages=[];
if(window.controllerCredentials){
  const original=supabase.channel.bind(supabase);const observed=new WeakSet();
  supabase.channel=(...args)=>{const channel=original(...args);if(!observed.has(channel)){observed.add(channel);for(const event of ['tv-state','game-start','tv-state-sync'])channel.on('broadcast',{event},({payload})=>window.controllerTVMessages.push({event,game:payload.game,phase:payload.phase,correctAnswer:payload.correctAnswer,internalScoresPresent:'partyScoresById' in payload,partyPhase:payload.partyNight?.phase}));}return channel;};
}
window.controllerGameStates={};for(const event of ['game-state','bottlespin-state'])gameRoomSession.onBroadcast(event,data=>{window.controllerGameStates[event]=data;});
window.qaErrors=[];window.addEventListener('error',e=>window.qaErrors.push(e.error?.stack??e.message));window.addEventListener('unhandledrejection',e=>window.qaErrors.push(String(e.reason?.stack??e.reason)));
if(window.controllerCredentials){const result=await supabase.auth.signInWithPassword(window.controllerCredentials);if(result.error)throw result.error;const updated=await supabase.auth.updateUser({data:{display_name:window.controllerIdentity.user_metadata.display_name}});if(updated.error)throw updated.error;window.controllerIdentity=updated.data.user;}
await i18nInitPromise;await loadLocale('en');await i18n.changeLanguage('en');
for(const id of ['fakeorfact','bottlespin','thisorthat'])sessionStorage.setItem(`eb.rules-seen.${id}`,'1');
const app=<AuthProvider>{window.controllerCredentials?<TVBroadcastProvider showConnectButton={false}><RoutesUnderTest/></TVBroadcastProvider>:<RoutesUnderTest/>}</AuthProvider>;
if(window.controllerBrowserHistory)window.history.replaceState({},'',window.controllerInitialRoute??'/party/controllers');
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{window.controllerBrowserHistory?<BrowserRouter>{app}</BrowserRouter>:<MemoryRouter initialEntries={[window.controllerInitialRoute??'/party/controllers']}>{app}</MemoryRouter>}</QueryClientProvider>);
