import { SeatAvatar } from '@/components/native/party/PartySheet';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, Flame, Heart, RefreshCw, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/hooks/useHaptics';
import type { TruthQuestion, DareChallenge } from './truthdare-content';
import type { Player } from './game-model';
import { formatClock } from './turns';
import { WatchHint } from './TurnHeader';

const TONE = {
  truth: { main: '#f09a8a', dim: '#d779ff', onChip: '#3d0055', glow: 'rgba(150,160,165,0.3)' },
  dare: { main: '#ff6b98', dim: '#e4006c', onChip: '#47001d', glow: 'rgba(255,107,152,0.3)' },
};

/** The drawn truth / dare card with the dare clock and the active player's actions. */
export function RevealPanel({ item, choiceType, player, others, timeLeft, canAct, onDone, onReroll }: {
  item: TruthQuestion | DareChallenge; choiceType: 'truth' | 'dare' | null; player: Player; others: Player[];
  timeLeft: number; canAct: boolean; onDone: () => void; onReroll: () => void;
}) {
  const { t } = useTranslation();
  const isTruth = choiceType === 'truth';
  const tone = isTruth ? TONE.truth : TONE.dare;
  const urgent = !isTruth && timeLeft <= 10;
  return (
    <motion.div key="reveal" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="split-challenge flex-1 flex flex-col items-center px-5 py-5 max-w-xl mx-auto w-full" data-kind={isTruth ? 'truth' : 'dare'}>
      {!isTruth && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex flex-col items-center">
          <motion.div animate={urgent ? { scale: [1, 1.04, 1] } : {}} transition={urgent ? { duration: 0.6, repeat: Infinity } : {}}
            className={cn('inline-flex items-center gap-2 px-6 py-2 rounded-full border',
              urgent ? 'bg-[#ff6e84]/15 border-[#ff6e84]/40' : 'bg-[#20262f] border-[#ff6b98]/30')}
            role="timer" aria-live="off">
            <Timer className={cn('w-5 h-5', urgent ? 'text-[#ff6e84]' : 'text-[#ff6b98]')} />
            <span className={cn('font-black text-2xl tracking-tighter tabular-nums', urgent ? 'text-[#ff6e84]' : 'text-white')}>
              {formatClock(timeLeft)}
            </span>
          </motion.div>
          <span className={cn('text-[0.8125rem] font-semibold mt-2', urgent ? 'text-[#ff6e84]' : 'text-[#ff6b98]')}>
            {urgent ? t('games.truthdare.lastSeconds') : t('games.truthdare.hurryUp')}
          </span>
        </motion.div>
      )}

      <div className="relative w-full">
        <motion.div initial={{ rotateY: 80, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="split-prompt relative p-6 sm:p-8 flex flex-col items-center text-center border border-white/5 overflow-hidden"
          style={{ background: 'rgba(27, 32, 40, 0.85)' }}>
          <div className="absolute top-0 right-0">
            <div className="font-black px-5 py-1.5 rounded-bl-2xl text-sm" style={{ background: tone.main, color: tone.onChip }}>
              {isTruth ? t('games.truthdare.truth') : t('games.truthdare.dare')}
            </div>
          </div>
          <div className="absolute top-5 left-5"><SeatAvatar avatar={player.avatar} color={player.color} size={36} /></div>

          <div className="mt-10 mb-5">
            <motion.div animate={{ scale: [1, 1.08, 1], y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex justify-center mb-3">
              {isTruth ? <Heart className="w-14 h-14" style={{ color: tone.main }} /> : <Flame className="w-14 h-14" style={{ color: tone.main }} />}
            </motion.div>
            <span className="text-[#8dd4d6] text-[0.8125rem] font-semibold">
              {canAct ? t('games.truthdare.yourTask') : t('games.truthdare.taskOf', { name: player.name, defaultValue: 'Aufgabe für {{name}}' })}
            </span>
          </div>

          <p dir="auto" className="font-black text-2xl sm:text-3xl leading-tight text-white tracking-tight px-2 mb-5">{item.text}</p>

          <div className="flex items-center gap-1.5 mb-6 w-full justify-center">
            <span className="text-[0.75rem] text-[#a8abb3] font-semibold mr-1">{t('games.truthdare.level', 'Stufe')}</span>
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-5 h-1.5 rounded-full" style={{ background: i <= item.intensity ? tone.main : 'rgba(255,255,255,0.1)' }} />
            ))}
            <span className="ml-3 text-[0.75rem] text-[#a8abb3]/70">{item.category}</span>
          </div>

          {others.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-black/40 rounded-full mb-6 border border-[#44484f]/30">
              <div className="flex -space-x-2">
                {others.slice(0, 3).map((p) => (
                  <SeatAvatar key={p.id} avatar={p.avatar} color={p.color} size={32} />
                ))}
              </div>
              <span className="text-[#a8abb3] text-[0.8125rem] font-medium">
                {others.length > 3 ? t('games.truthdare.waitingForYouExtra', { extra: others.length - 3 }) : t('games.truthdare.waitingForYou')}
              </span>
            </div>
          )}

          {canAct ? (
            <div className="w-full flex flex-col gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { haptics.celebrate(); onDone(); }} data-testid="truthdare-done"
                className="w-full h-16 rounded-full font-black text-base flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(90deg, ${tone.main}, ${tone.dim})`, color: isTruth ? tone.onChip : '#fff' }}>
                <Check className="w-5 h-5" />
                {isTruth ? t('games.truthdare.done') : t('games.truthdare.doneDare', 'Erledigt — abstimmen')}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { haptics.light(); onReroll(); }}
                className="w-full h-14 rounded-full flex items-center justify-center gap-2 bg-[#20262f]/50 border border-[#44484f]/30 text-[#a8abb3] font-bold text-[0.9375rem] hover:bg-[#262c36] transition-colors">
                <RefreshCw className="w-4 h-4" /> {t('games.truthdare.reroll')}
              </motion.button>
            </div>
          ) : <WatchHint name={player.name} />}
        </motion.div>
      </div>
    </motion.div>
  );
}
