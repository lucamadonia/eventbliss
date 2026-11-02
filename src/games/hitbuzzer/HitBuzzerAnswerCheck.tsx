import { Check, LockKeyhole, Mic2, X } from 'lucide-react';
import { StageAction } from '../ui/GameStage';
import type { HitAnswerMode } from './engine';
import type { roundFlowText } from './round-flow-copy';

type Labels = ReturnType<typeof roundFlowText> & { correct: string; wrong: string };

interface AnswerCheckProps {
  playerName: string;
  secondsLeft: number;
  totalSeconds: number;
  phase: 'answering' | 'reviewing';
  mode: HitAnswerMode;
  solution: { artist: string; title: string } | null;
  isClaimant: boolean;
  onSpoken: () => void;
  onCorrect: () => void;
  onWrong: () => void;
  labels: Labels;
}

/** The solution is supplied only through the host's encrypted private room message. */
export function HitBuzzerAnswerCheck({ playerName, secondsLeft, totalSeconds, phase, mode, solution, isClaimant,
  onSpoken, onCorrect, onWrong, labels }: AnswerCheckProps) {
  const answering = phase === 'answering';
  const progress = Math.max(0, Math.min(100, (secondsLeft / Math.max(1, totalSeconds)) * 100));
  const prompt = mode === 'title' ? labels.sayTitle : mode === 'artist' ? labels.sayArtist : labels.sayAnswer;

  return <section className="overflow-hidden rounded-[28px] border border-[#df8eff]/30 bg-[#140e20] text-left shadow-[0_20px_60px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.09)]" aria-label={labels.answerNow}>
    <div className="relative h-44 overflow-hidden sm:h-48">
      <img src="/images/games/hit-buzzer.webp" alt="" className="h-full w-full object-cover object-[center_64%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#140e20] via-[#140e20]/15 to-transparent" />
      <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#df8eff]">{answering ? labels.answerNow : labels.compareAnswer}</p><h3 className="mt-1 font-game text-2xl font-black text-white [text-wrap:balance]">{playerName}</h3></div>
        {answering && <span className={`font-game text-5xl font-black tabular-nums ${secondsLeft <= 3 ? 'text-[#ff8bad]' : 'text-[#8ff5ff]'}`}>{secondsLeft}</span>}
      </div>
    </div>
    <div className="px-5 pb-5 sm:px-6 sm:pb-6">
      {answering && <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true"><div className={`h-full rounded-full transition-[width] duration-200 ease-linear ${secondsLeft <= 3 ? 'bg-[#ff6b98]' : 'bg-[#8ff5ff]'}`} style={{ width: `${progress}%` }} /></div>}
      {answering ? <>
        <p className="text-center text-sm font-semibold text-[#d8cce7] [text-wrap:pretty]">{isClaimant ? prompt : labels.waitForPlayer}</p>
        {isClaimant && <StageAction onClick={onSpoken} disabled={secondsLeft < 1} className="mt-5 !min-h-16 w-full !rounded-2xl text-base"><Mic2 className="h-5 w-5" />{labels.spokenDone}</StageAction>}
      </> : isClaimant ? solution ? <>
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#8ff5ff]"><LockKeyhole className="h-4 w-4" />{labels.privateHint}</div>
        <div className="space-y-3">
          <SolutionField label={labels.fieldTitle} value={solution.title} required={mode !== 'artist'} requiredLabel={labels.required} />
          <SolutionField label={labels.fieldArtist} value={solution.artist} required={mode !== 'title'} requiredLabel={labels.required} />
        </div>
        <p className="mt-4 text-center text-sm text-[#d8cce7]">{labels.judgeHint}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StageAction onClick={onCorrect} className="min-h-14 !px-2 text-sm"><Check className="h-5 w-5" />{labels.correct}</StageAction>
          <StageAction variant="danger" onClick={onWrong} className="min-h-14 !px-2 text-sm"><X className="h-5 w-5" />{labels.wrong}</StageAction>
        </div>
      </> : <p className="py-4 text-center text-sm font-semibold text-[#d8cce7]">{labels.loadingSolution}</p>
        : <p className="py-4 text-center text-sm font-semibold text-[#d8cce7]">{labels.waitForCheck}</p>}
    </div>
  </section>;
}

function SolutionField({ label, value, required, requiredLabel }: { label: string; value: string; required: boolean; requiredLabel: string }) {
  return <div className={`min-w-0 rounded-2xl border px-4 py-3 ${required ? 'border-[#8ff5ff]/55 bg-[#8ff5ff]/10 shadow-[inset_3px_0_0_#8ff5ff]' : 'border-white/10 bg-white/[.04]'}`}>
    <div className="flex items-center justify-between gap-2"><span className={`text-[11px] font-bold uppercase tracking-[.15em] ${required ? 'text-[#8ff5ff]' : 'text-white/50'}`}>{label}</span>
      {required && <span className="rounded-full bg-[#8ff5ff]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#8ff5ff]">{requiredLabel}</span>}</div>
    <p className="mt-1 break-words font-game text-xl font-black text-white">{value}</p>
  </div>;
}
