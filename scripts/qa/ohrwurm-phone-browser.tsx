import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Music2 } from 'lucide-react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { PartyTurnRibbon } from '@/games/ui/PartyTurnRibbon';
import { DrawPanel } from '@/games/ohrwurm/OhrwurmTurnPanels';
import { OhrwurmWaitStage } from '@/games/ohrwurm/OhrwurmWaitStage';
import { RevealCard, ResolutionSummary, Scoreboard } from '@/games/ohrwurm/OhrwurmParts';
import { getAllSongs } from '@/games/ohrwurm/ohrwurm-content';
import { OW, OW_STYLE } from '@/games/ohrwurm/ohrwurm-theme';
import type { Participant } from '@/games/ohrwurm/ohrwurm-engine';
import i18n, { i18nInitPromise, loadLocale } from '@/i18n';
import '@/index.css';

const active: Participant = {
  id: 'hitparade', name: 'Hitparade', type: 'group', color: '#ff2e88', avatar: 'H',
  timeline: [{ id: '1984', year: 1984 }, { id: '1995', year: 1995 }] as Participant['timeline'],
  hooks: 3, memberNames: ['Anna', 'Ben'],
};
const other: Participant = {
  id: 'team2', name: 'Team 2', type: 'group', color: '#26e0c4', avatar: 'T',
  timeline: [{ id: '2008', year: 2008 }] as Participant['timeline'],
  hooks: 2, memberNames: ['Clara', 'David'],
};
const noop = () => {};
const requestedView = new URLSearchParams(location.search).get('view');
const view = requestedView === 'waiting' || requestedView === 'reveal' ? requestedView : 'active';
const revealSong = getAllSongs().find((song) => song.artist === 'ABBA' && song.title === 'Dancing Queen')!;
const revealedActive = { ...active, timeline: [revealSong, ...active.timeline] };
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

await i18nInitPromise;
await loadLocale('de');
await i18n.changeLanguage('de');
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter><AuthProvider>
      <div className="relative flex min-h-[100dvh] flex-col overflow-hidden font-game" style={{ background: OW.bg, color: OW.text }}>
        <style>{OW_STYLE}</style>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-xl" style={{ color: OW.dim }}>‹</span>
          <span className="flex items-center gap-2 text-sm font-black tracking-[0.2em]" style={{ color: OW.primary }}>
            <Music2 className="h-4 w-4" /> OHRWURM
          </span>
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: OW.surface, color: OW.accent }}>10 Karten</span>
        </div>
        <Scoreboard participants={[view === 'reveal' ? revealedActive : active, other]} activeId={active.id} winTarget={10} />
        <div className="relative flex flex-1 flex-col px-4 pb-6">
          {view === 'reveal' ? <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <RevealCard song={revealSong} flipped />
            <ResolutionSummary resolution={{ activeCorrect: true, counterCorrect: null, winnerId: active.id, winnerSlotIndex: 0, bonusEligible: false }}
              active={revealedActive} counter={null} participants={[revealedActive, other]} />
          </div> : view === 'active' ? <>
            <PartyTurnRibbon className="mt-2" player={active} kind="me" line="Hör rein und ordne den Song ein." />
            <DrawPanel active={active} previewLoading={false} previewUrl="local-visual-fixture" isAudioPlaying
              listening timeLeft={38} bonusClaimed={false} swapUsed={false} onPlay={noop} onStartSilent={noop}
              onReplay={noop} onToggleBonus={noop} onSwap={noop} onToPlace={noop} />
          </> : <OhrwurmWaitStage acting={active} mine={other} line="Schau auf den Fernseher" />}
        </div>
      </div>
    </AuthProvider></MemoryRouter>
  </QueryClientProvider>,
);
