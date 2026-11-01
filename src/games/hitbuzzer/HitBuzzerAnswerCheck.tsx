import { Check, Eye, X } from 'lucide-react';
import { StageAction } from '../ui/GameStage';

interface AnswerCheckProps {
  artist: string;
  title: string;
  open: boolean;
  sharedDevice: boolean;
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
    privateHint: string;
    correct: string;
    wrong: string;
    void: string;
  };
}

/** Local host view only. The answer must never be included in room or TV state before the result. */
export function HitBuzzerAnswerCheck({ artist, title, open, sharedDevice, onOpen, onCorrect, onWrong, onVoid, labels }: AnswerCheckProps) {
  const answer = <>
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
    <StageAction variant="ghost" onClick={onVoid} className="mt-2 w-full text-sm">{labels.void}</StageAction>
  </>;

  if (open && sharedDevice) return <div role="dialog" aria-modal="true" aria-label={labels.heading}
    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#060810] px-5 py-[max(24px,env(safe-area-inset-top))] text-left">
    <div className="w-full max-w-lg rounded-[30px] border border-[#df8eff]/35 bg-[#140f20] p-5 shadow-[0_24px_80px_rgba(0,0,0,.6)] sm:p-7">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#8ff5ff]">{labels.privateHint}</p>
      <h3 className="mb-5 font-game text-2xl font-black text-white">{labels.heading}</h3>
      {answer}
    </div>
  </div>;

  return <section className="mt-5 border-t border-white/10 pt-5 text-left" aria-label={labels.heading}>
    <div className="mb-4 flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#df8eff]/30 bg-[#df8eff]/10 text-[#df8eff]"><Eye className="h-5 w-5" /></span>
      <div><h3 className="font-game text-lg font-black text-white">{labels.heading}</h3><p className="mt-1 text-sm leading-relaxed text-[#b3a8c9]">{labels.prompt}</p></div>
    </div>
    {sharedDevice && !open && <p className="mb-3 rounded-xl border border-[#8ff5ff]/20 bg-[#8ff5ff]/5 p-3 text-xs leading-relaxed text-[#8ff5ff]">{labels.privateHint}</p>}
    {!open ? <><StageAction variant="secondary" onClick={onOpen} className="w-full">{labels.open}</StageAction><StageAction variant="ghost" onClick={onVoid} className="mt-2 w-full text-sm">{labels.void}</StageAction></> : answer}
  </section>;
}
