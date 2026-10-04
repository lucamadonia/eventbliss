import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Hand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { firePartyHaptic, partyCue, partyMotion, playerGlow, pressable } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { PartyBottomBar } from './PartyBottomBar';

interface Props {
  ready: boolean;
  /** The player's own colour: "Bereit ✓" is shown in it. */
  color: string;
  onToggle: (ready: boolean) => void;
}

/**
 * The one thing a player does in the lobby: the loud „Ich bin bereit“ action
 * turns into a calm, done „Bereit ✓“ with the own colour as ring (T04);
 * „Doch noch nicht“ quietly undoes it. Pinned to the
 * bottom above the safe area. The count lives on the stage.
 */
export function PartyReadyBar({ ready, color, onToggle }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const toggle = (next: boolean) => { firePartyHaptic(haptics, partyCue('T04', 'phone').haptic); onToggle(next); };
  return (
    <PartyBottomBar testId="ready-bar">
      <motion.button type="button" data-testid="lobby-ready-toggle" aria-pressed={ready} {...(reduced ? {} : pressable)}
        onClick={() => toggle(!ready)}
        className={cn('flex min-h-16 w-full items-center justify-center gap-3 rounded-full px-6 text-lg font-black transition-[background,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060810]',
          // Loud = the action; ready = calm and done (own colour only as the ring).
          ready ? 'bg-[#16101f] text-white' : 'bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white shadow-[0_16px_50px_rgba(223,142,255,.35)]')}
        style={ready ? { boxShadow: playerGlow(color, 'active') } : undefined}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={ready ? 'ready' : 'idle'} variants={partyMotion('checkPop', reduced)} initial="initial" animate="animate" exit="exit" className="flex items-center gap-2">
            {ready ? <><Check className="h-6 w-6 text-[#8ff5ff]" aria-hidden />{t('partyPlay.ready.done', 'Bereit')}</> : <><Hand className="h-5 w-5" aria-hidden />{t('partyPlay.ready.cta', 'Ich bin bereit')}</>}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      {ready && (
        <button type="button" data-testid="lobby-ready-undo" onClick={() => toggle(false)}
          className="mx-auto mt-1 block min-h-11 rounded-full px-4 text-sm font-semibold text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/5">
          {t('partyPlay.ready.undo', 'Doch noch nicht')}
        </button>
      )}
    </PartyBottomBar>
  );
}
