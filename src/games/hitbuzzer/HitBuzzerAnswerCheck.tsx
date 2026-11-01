import { Check, Eye, X } from 'lucide-react';
import { StageAction } from '../ui/GameStage';

interface AnswerCheckProps {
  artist: string;
  title: string;
  open: boolean;
  onOpen: () => void;
  onCorrect: () => void;
  onWrong: () => void;
  onVoid: () => void;
  labels: {
    heading: string;
    prompt: string;
    open: string;
    artist: string;
    title: string;
    compare: string;
    correct: string;
    wrong: string;
    void: string;
  };
}

/** Local host view only. The answer must never be included in room or TV state before the result. */
export function HitBuzzerAnswerCheck({ artist, title, open, onOpen, onCorrect, onWrong, onVoid, labels }: AnswerCheckProps) {
  return <section className="mt-5 border-t border-white/10 pt-5 text-left" aria-label={labels.heading}>
    <div className="mb-4 flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#df8eff]/30 bg-[#df8eff]/10 text-[#df8eff]"><Eye className="h-5 w-5" /></span>
      <div><h3 className="font-game text-lg font-black text-white">{labels.heading}</h3><p className="mt-1 text-sm leading-relaxed text-[#b3a8c9]">{labels.prompt}</p></div>
    </div>
    {!open ? <StageAction variant="secondary" onClick={onOpen} className="w-full">{labels.open}</StageAction> : <>
      <div className="rounded-[22px] border border-[#df8eff]/35 bg-[linear-gradient(145deg,rgba(223,142,255,.16),rgba(143,245,255,.06))] p-5 shadow-[inset_0_1px_rgba(255,255,255,.1)]">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#df8eff]">{labels.compare}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className="text-xs font-bold uppercase tracking-wider text-[#b3a8c9]">{labels.artist}</span><p className="mt-1 font-game text-xl font-black leading-tight text-white">{artist}</p></div>
          <div><span className="text-xs font-bold uppercase tracking-wider text-[#b3a8c9]">{labels.title}</span><p className="mt-1 font-game text-xl font-black leading-tight text-white">{title}</p></div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <StageAction onClick={onCorrect} className="min-h-14 !px-2 text-sm"><Check className="h-4 w-4" />{labels.correct}</StageAction>
        <StageAction variant="danger" onClick={onWrong} className="min-h-14 !px-2 text-sm"><X className="h-4 w-4" />{labels.wrong}</StageAction>
      </div>
    </>}
    <StageAction variant="ghost" onClick={onVoid} className="mt-2 w-full text-sm">{labels.void}</StageAction>
  </section>;
}
