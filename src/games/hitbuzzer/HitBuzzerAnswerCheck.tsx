import { Check, X } from 'lucide-react';
import { StageAction } from '../ui/GameStage';

interface AnswerCheckProps {
  playerName: string;
  secondsLeft: number;
  totalSeconds: number;
  canJudge: boolean;
  onCorrect: () => void;
  onWrong: () => void;
  labels: {
    answerNow: string;
    sayAnswer: string;
    markAnswer: string;
    waitForPlayer: string;
    correct: string;
    wrong: string;
  };
}

/** The current song is deliberately absent. Only the claimant can grade their spoken answer. */
export function HitBuzzerAnswerCheck({ playerName, secondsLeft, totalSeconds, canJudge, onCorrect, onWrong, labels }: AnswerCheckProps) {
  const progress = Math.max(0, Math.min(100, (secondsLeft / Math.max(1, totalSeconds)) * 100));

  return <section className="overflow-hidden rounded-[28px] border border-[#df8eff]/30 bg-[#140e20] text-left shadow-[0_20px_60px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.09)]" aria-label={labels.answerNow}>
    <div className="relative h-44 overflow-hidden sm:h-48">
      <img src="/images/games/hit-buzzer.webp" alt="" className="h-full w-full object-cover object-[center_64%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#140e20] via-[#140e20]/15 to-transparent" />
      <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#df8eff]">{labels.answerNow}</p><h3 className="mt-1 font-game text-2xl font-black text-white [text-wrap:balance]">{playerName}</h3></div>
        <span className="font-game text-5xl font-black tabular-nums text-[#8ff5ff]">{secondsLeft}</span>
      </div>
    </div>
    <div className="px-5 pb-5 sm:px-6 sm:pb-6">
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true"><div className="h-full rounded-full bg-[#8ff5ff] transition-[width] duration-200 ease-linear" style={{ width: `${progress}%` }} /></div>
      <p className="text-center text-sm font-semibold text-[#d8cce7] [text-wrap:pretty]">{canJudge ? labels.sayAnswer : labels.waitForPlayer}</p>
      {canJudge && <>
        <p className="mt-2 text-center text-xs text-[#a99cba]">{labels.markAnswer}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StageAction onClick={onCorrect} className="min-h-14 !px-2 text-sm"><Check className="h-5 w-5" />{labels.correct}</StageAction>
          <StageAction variant="danger" onClick={onWrong} className="min-h-14 !px-2 text-sm"><X className="h-5 w-5" />{labels.wrong}</StageAction>
        </div>
      </>}
    </div>
  </section>;
}
