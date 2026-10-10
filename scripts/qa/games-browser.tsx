import React, { Component, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n, { loadLocale, i18nInitPromise } from '@/i18n';
import '@/index.css';
import { runBackGuards } from '@/lib/back-guard';
import { normalizeGameId } from '@/games/ui/game-rules';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { createPartySession, createPartyPlayer } from '@/games/party/session-schema';
import { __resetPartySessionCache } from '@/hooks/usePartySession';
import type { PartyNightState } from '@/games/tv/party-types';

// Isolated local-only fixture. No room creation, transport or cloud writes.
const registry = {
  bomb: () => import('@/games/bomb/BombGame'),
  headup: () => import('@/games/headup/HeadUpGame'),
  taboo: () => import('@/games/taboo/TabooGame'),
  category: () => import('@/games/category/CategoryGame'),
  hochstapler: () => import('@/games/impostor/ImpostorGame'),
  'drueck-das-wort': () => import('@/games/wordpress/WordPressGame'),
  'wo-ist-was': () => import('@/games/findit/FindItGame'),
  'split-quiz': () => import('@/games/splitquiz/SplitQuizGame'),
  'geteilt-gequizzt': () => import('@/games/sharedquiz/SharedQuizGame'),
  schnellzeichner: () => import('@/games/quickdraw/QuickDrawGame'),
  'wahrheit-pflicht': () => import('@/games/truthdare/TruthDareGame'),
  'this-or-that': () => import('@/games/thisorthat/ThisOrThatGame'),
  'wer-bin-ich': () => import('@/games/whoami/WhoAmIGame'),
  'emoji-raten': () => import('@/games/emojiguess/EmojiGuessGame'),
  'fake-or-fact': () => import('@/games/fakeorfact/FakeOrFactGame'),
  'story-builder': () => import('@/games/storybuilder/StoryBuilderGame'),
  flaschendrehen: () => import('@/games/bottlespin/BottleSpinGame'),
  ohrwurm: () => import('@/games/ohrwurm/OhrwurmGame'),
  pixeljagd: () => import('@/games/pixeljagd/PixeljagdGame'),
  closeenough: () => import('@/games/closeenough/CloseEnoughGame'),
  pantomime: () => import('@/games/pantomime/PantomimeGame'),
  brew: () => import('@/games/brew/BrewGame'),
};

window.qaErrors = [];
window.addEventListener('error', event => window.qaErrors.push(event.error?.stack ?? event.message));
window.addEventListener('unhandledrejection', event => window.qaErrors.push(String(event.reason?.stack ?? event.reason)));
class Boundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: unknown) { return { error: String(error) }; }
  componentDidCatch(error: Error) { window.qaErrors.push(error.stack ?? error.message); }
  render() { return this.state.error ? <pre role="alert">{this.state.error}</pre> : this.props.children; }
}
const root = createRoot(document.getElementById('root')!);
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
let mountId = 0;
async function render(content: ReactNode, path = '/qa') {
  flushSync(() => root.render(<Boundary key={++mountId}><QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[path]}><AuthProvider>
      <Routes><Route path="/games/:gameId" element={content} /><Route path="*" element={content} /></Routes>
    </AuthProvider></MemoryRouter>
  </QueryClientProvider></Boundary>));
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}
async function mountLocal(gameId: string, options: { players?: string[] } = {}) {
  await i18nInitPromise;
  const session = createPartySession('qa-local-games');
  session.players = (options.players ?? ['Anna', 'Ben', 'Clara', 'David']).map((name, index) => createPartyPlayer(`qa-${index}`, name, index));
  session.currentGameId = gameId;
  localStorage.setItem('eventbliss_party_session', JSON.stringify(session));
  __resetPartySessionCache();
  sessionStorage.setItem(`eb.rules-seen.${normalizeGameId(gameId)}`, '1');
  if (gameId === 'flaschendrehen') sessionStorage.setItem('eb.rules-seen.bottlespin', '1');
  const load = registry[gameId as keyof typeof registry];
  if (!load) throw new Error(`Unknown game: ${gameId}`);
  const Game = (await load()).default as React.ComponentType<any>;
  await render(<><button id="qa-back" className="fixed bottom-1 right-1 z-[100] rounded bg-black/80 p-2 text-xs text-white" onClick={() => runBackGuards()}>QA Back</button><Game onClose={() => void render(<p>Game closed</p>)} /></>, `/games/${gameId}`);
}
let updateTV: (state: Record<string, unknown>) => void = () => {};
function TVFixture({ View, initial }: { View: React.ComponentType<any>; initial: Record<string, unknown> }) {
  const [gameState, setGameState] = useState(initial);
  updateTV = setGameState;
  return <View gameState={gameState} />;
}
async function mountTV(game: 'findit' | 'wordpress' | 'draw' | 'impostor' | 'category' | 'brew' | 'closeenough' | 'ohrwurm', gameState: Record<string, unknown>) {
  const View = (game === 'ohrwurm' ? await import('@/games/tv/games/TVOhrwurmView') : game === 'closeenough' ? await import('@/games/tv/games/TVCloseEnoughView') : game === 'brew' ? await import('@/games/tv/games/TVBrewView') : game === 'impostor' ? await import('@/games/tv/games/TVImpostorView') : game === 'category' ? await import('@/games/tv/games/TVCategoryView') : game === 'findit' ? await import('@/games/tv/games/TVFindItView') : game === 'draw' ? await import('@/games/tv/games/TVDrawView') : await import('@/games/tv/games/TVWordPressView')).default;
  await render(<TVFixture View={View} initial={gameState} />, '/qa/tv');
}
async function mountFinale() {
  const {PartyFinaleOverlay} = await import('@/components/native/party/PartyFinaleOverlay');
  const standings = ['Anna', 'Ben', 'Clara', 'David'].map((name, index) => ({id:name,name,color:'#df8eff',points:40,rank:1,prevRank:1,gamesWon:4,streak:4}));
  await render(<PartyFinaleOverlay open standings={standings} history={[]} gamesPlayed={4} playerCount={4} onDone={() => {}} />);
}
async function mountTVFinale(elapsedMs = 5500) {
  const TVPartyFinale = (await import('@/games/tv/TVPartyFinale')).default;
  const party: PartyNightState = {
    active: true,
    phase: 'finale',
    playlist: ['bomb', 'ohrwurm', 'brew'].map((gameId) => ({ gameId, name: gameId, done: true })),
    index: 3,
    finishedThrough: 3,
    standings: [
      { id: 'anna', name: 'Anna', color: '#df8eff', avatar: '👑', points: 47, rank: 1, prevRank: 2, gamesWon: 2, streak: 2 },
      { id: 'ben', name: 'Ben', color: '#8ff5ff', avatar: '🦊', points: 39, rank: 2, prevRank: 1, gamesWon: 1, streak: 0 },
      { id: 'clara', name: 'Clara', color: '#ff6b98', avatar: '⭐', points: 31, rank: 3, prevRank: 3, gamesWon: 0, streak: 0 },
      { id: 'david', name: 'David', color: '#f9ca24', avatar: '🎉', points: 22, rank: 4, prevRank: 4, gamesWon: 0, streak: 0 },
    ],
    history: [
      { gameId: 'bomb', gameName: 'Bomb', winnerId: 'ben', scores: { anna: 7, ben: 10, clara: 5, david: 4 } },
      { gameId: 'ohrwurm', gameName: 'Ohrwurm', winnerId: 'anna', scores: { anna: 10, ben: 9, clara: 5, david: 4 } },
      { gameId: 'brew', gameName: 'Gebräu', winnerId: 'anna', scores: { anna: 10, ben: 7, clara: 4, david: 3 } },
    ],
  };
  await render(<TVPartyFinale party={party} startsAt={Date.now() - elapsedMs} />, '/qa/tv');
}
window.qa = { mountFinale, mountTVFinale,
  mountLocal, mountTV, requestBack: runBackGuards, updateTV: (state: Record<string, unknown>) => updateTV(state),
  async setLanguage(language: string) { await i18nInitPromise; await loadLocale(language); await i18n.changeLanguage(language); document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; },
  translate: (key: string) => i18n.t(key), games: Object.keys(registry),
};
void render(<main className="p-6"><h1>Local game QA</h1><p>Use window.qa.mountLocal(gameId).</p></main>);
