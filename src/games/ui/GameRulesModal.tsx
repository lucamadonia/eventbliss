import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Lightbulb, X, Check } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useBackGuard } from '@/lib/back-guard';
import { normalizeGameId } from './game-rules';
import { gameStageStyle, StageAction } from './GameStage';

interface GameRulesModalProps { gameId:string; open:boolean; onClose:()=>void; }
export function GameRulesModal({gameId,open,onClose}:GameRulesModalProps) {
  const {t}=useTranslation();
  const nid=normalizeGameId(gameId);
  const title=t(`gameRules.${nid}.title`,'');
  const tagline=t(`gameRules.${nid}.tagline`,'');
  const tip=t(`gameRules.${nid}.tip`,'');
  const steps=Array.from({length:5},(_,index)=>t(`gameRules.${nid}.step${index+1}`,'')).filter(Boolean);
  const renderable=!!title||steps.length>0;
  useBackGuard(()=>{onClose();return true;},open&&renderable);
  if(!renderable)return null;
  return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose();}}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[180] bg-black/75 backdrop-blur-sm" />
      <Dialog.Content style={gameStageStyle(gameId)} className="fixed left-1/2 top-1/2 z-[181] flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/15 bg-[var(--stage-bg)] text-[var(--stage-ink)] shadow-2xl font-sans">
        <div className="shrink-0 border-b border-white/10 px-6 pb-5 pt-7 pr-16">
          <p className="stage-eyebrow">{t('gameRules.howToPlay')}</p>
          <Dialog.Title className="text-3xl font-extrabold tracking-tight leading-tight">{title}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-[var(--stage-muted)]">{tagline}</Dialog.Description>
        </div>
        <Dialog.Close className="absolute top-5 right-4 grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--stage-accent)]" aria-label={t('common.close')}><X className="h-5 w-5" /></Dialog.Close>
        <div className="min-h-0 overflow-y-auto px-6 py-6">
          <ol className="space-y-5">{steps.map((step,index)=><li key={index} className="flex items-start gap-4"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--stage-accent)]/40 text-xs font-bold text-[var(--stage-accent)]">{index+1}</span><p className="text-sm leading-relaxed">{step}</p></li>)}</ol>
          {tip&&<div className="mt-7 flex gap-3 border-t border-white/10 pt-5 text-sm leading-relaxed text-[var(--stage-secondary)]"><Lightbulb className="mt-0.5 h-5 w-5 shrink-0"/><p>{tip}</p></div>}
        </div>
        <div className="shrink-0 border-t border-white/10 p-4"><StageAction className="w-full" onClick={onClose}><Check className="h-5 w-5"/>{t('gameRules.understood')}</StageAction></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

/**
 * Hook: auto-show rules on first play of each game.
 * sessionStorage is only set when the modal is CLOSED (not on open).
 */
export function useAutoShowRules(gameId: string) {
  const nid = normalizeGameId(gameId);
  const key = `eb.rules-seen.${nid}`;

  // Check synchronously if we should auto-show
  const shouldAutoShow = (() => {
    if (!nid) return false;
    try { return !sessionStorage.getItem(key); } catch { return false; }
  })();

  const [show, setShow] = useState(shouldAutoShow);

  return {
    showRules: show,
    openRules: () => setShow(true),
    closeRules: () => {
      setShow(false);
      try { sessionStorage.setItem(key, "1"); } catch { /* private mode */ }
    },
  };
}

/**
 * Compact help button for game headers — shows rules on tap.
 */
export function RulesHelpButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/10 active:bg-white/15 transition-colors"
      title={t('gameRules.howToPlay')} aria-label={t('gameRules.howToPlay')}
    >
      <HelpCircle className="w-[18px] h-[18px] text-white/40" />
    </motion.button>
  );
}
