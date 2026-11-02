import { createRoot } from 'react-dom/client';
import { HitBuzzerAnswerCheck } from '@/games/hitbuzzer/HitBuzzerAnswerCheck';
import { HitBuzzerRoundHistory } from '@/games/hitbuzzer/HitBuzzerRoundHistory';
import { GameStage } from '@/games/ui/GameStage';
import { roundFlowText } from '@/games/hitbuzzer/round-flow-copy';
import '@/index.css';

const view = new URLSearchParams(location.search).get('view');
const labels = { ...roundFlowText('de'), correct: 'Richtig', wrong: 'Falsch', round: 'Runde' };

createRoot(document.getElementById('root')!).render(<GameStage gameId="hitbuzzer"><main className="min-h-[100dvh] bg-[#060810] p-4 text-white">
  <div className="mx-auto max-w-xl space-y-4">
    <p className="font-game text-sm font-black uppercase tracking-[.2em] text-[#df8eff]">Hit-Buzzer · Runde 03 / 15</p>
    {view === 'history' ? <HitBuzzerRoundHistory expanded labels={labels} history={[
      { round: 1, title: 'Blinding Lights', artist: 'The Weeknd', attempts: [
        { playerId: 'a', playerName: 'Mia', outcome: 'timeout', delta: -20 },
      ] },
      { round: 2, title: 'Dancing Queen', artist: 'ABBA', attempts: [
        { playerId: 'a', playerName: 'Mia', outcome: 'wrong', delta: -20 },
        { playerId: 'b', playerName: 'Alex', outcome: 'correct', delta: 86 },
      ] },
    ]} /> : <HitBuzzerAnswerCheck playerName="Mia" secondsLeft={view === 'urgent' ? 2 : 6} totalSeconds={8}
      phase={view === 'check' || view === 'other' || view === 'artist' || view === 'title' ? 'reviewing' : 'answering'} mode={view === 'artist' ? 'artist' : view === 'title' ? 'title' : 'both'}
      solution={view === 'check' || view === 'title' || view === 'artist' ? { title: 'Dancing Queen', artist: 'ABBA' } : null}
      isClaimant={view !== 'other'} onSpoken={() => {}} onCorrect={() => {}} onWrong={() => {}} labels={labels} />}
  </div>
</main></GameStage>);
