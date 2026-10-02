import { motion, useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { firePartyHaptic, partyCue, pressable } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import type { NextGame } from './useNextGame';
import { PartyBottomBar } from './PartyBottomBar';

interface Props {
  next: NextGame;
  busy: boolean;
}

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060810]';

/**
 * The Host's primary action, always in the thumb zone: „Nächstes Spiel
 * starten: GEBRÄU“ — premium even while blocked, with the exact blocker below.
 */
export function HostStartBar({ next, busy }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const blocked = !!next.blocker || busy;
  return (
    <PartyBottomBar testId="host-start-bar">
      <motion.button type="button" data-testid="lobby-start" data-disabled-reason={next.blocker ?? undefined} disabled={blocked}
        aria-describedby={next.blocker ? 'lobby-start-reason' : undefined} {...(reduced || blocked ? {} : pressable)}
        onClick={() => { firePartyHaptic(haptics, partyCue('T05', 'host').haptic); next.start(); }}
        className={cn('flex min-h-16 w-full items-center justify-center gap-2 rounded-full px-6 text-lg font-black transition-[background,box-shadow] duration-300', focus,
          blocked ? 'cursor-not-allowed border border-[#df8eff]/40 bg-[#17102b] text-white/85 shadow-[0_12px_40px_rgba(0,0,0,.45)]' : 'bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-[#060810] shadow-[0_16px_50px_rgba(223,142,255,.35)]')}>
        <Play className="h-5 w-5 shrink-0" aria-hidden />
        <span className="truncate">{next.game ? t('partyPlay.start.with', 'Starten: {{game}}', { game: t(next.game.nameKey) }) : t('partyControllers.startNext')}</span>
      </motion.button>
      <div className="mt-1 flex min-h-11 items-center justify-center gap-3">
        {next.blocker && <p id="lobby-start-reason" role="status" className="text-center text-sm font-semibold text-[#f3d9ff]/80">{next.blocker}</p>}
      </div>
    </PartyBottomBar>
  );
}
