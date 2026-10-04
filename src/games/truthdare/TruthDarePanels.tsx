import { SeatAvatar } from '@/components/native/party/PartySheet';
import type { ComponentProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Flame, Heart, RotateCcw, ThumbsDown, ThumbsUp, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playerGlow } from '@/lib/party-motion';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { hasShellBackButton } from '@/games/ui/shell-back';
import type { Player } from './game-model';
import { voteProgress } from './turns';
import { WatchHint } from './TurnHeader';

const enter = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] } } as const;

/** Wheel of avatars; only the host device spins. */
export function SpinPanel({ players, spinAngle, canSpin, onSpin }: {
  players: Player[]; spinAngle: number; canSpin: boolean; onSpin: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="spin" {...enter} className="flex-1 flex flex-col items-center justify-start gap-7 px-4 pt-[6dvh]">
      <h2 className="text-2xl font-extrabold text-white neon-glow">{t('games.truthdare.whosNext')}</h2>
      <div className="relative w-72 h-72">
        <motion.div className="w-full h-full rounded-full border-4 border-[#f09a8a]/30 relative bg-[#0d0915]"
          animate={{ rotate: spinAngle }} transition={{ duration: 2.5, ease: [0.2, 0.8, 0.3, 1] }}>
          {players.map((p, i) => {
            const angle = (360 / players.length) * i;
            return (
              <div key={p.id} className="absolute" style={{
                top: '50%', left: '50%',
                transform: `rotate(${angle}deg) translateY(-112px) rotate(-${angle}deg) translate(-50%, -50%)`,
              }}>
                <span className="block rounded-full" style={{ boxShadow: playerGlow(p.color) }}><SeatAvatar avatar={p.avatar} color={p.color} size={52} /></span>
              </div>
            );
          })}
        </motion.div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-[#f09a8a] rotate-45 shadow-[0_0_12px_rgba(150,160,165,0.5)]" />
      </div>
      {canSpin ? (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onSpin} data-testid="truthdare-spin"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#f09a8a] to-[#d779ff] text-[#0a0e14] px-10 rounded-2xl h-16 min-w-[14rem] font-extrabold text-lg">
          <Zap className="w-5 h-5" /> {t('games.truthdare.spin')}
        </motion.button>
      ) : (
        <p role="status" className="flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold text-white/80" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span aria-hidden className="h-2 w-2 rounded-full bg-[#f09a8a] animate-pulse" />{t('games.truthdare.hostSpins', 'Der Host dreht das Rad …')}</p>
      )}
    </motion.div>
  );
}

/** Pick truth or dare (or drink). */
export function ChoicePanel({ player, mode, canAct, isDrinkingMode, onChoose, onDrink, disclaimer, drinkCount }: {
  player: Player; mode: string; canAct: boolean; isDrinkingMode: boolean;
  onChoose: (type: 'truth' | 'dare') => void; onDrink: () => void;
  disclaimer: { message: string; emoji: string } | null; drinkCount: number;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="choice" {...enter} className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-4">
      <h2 className="text-2xl font-extrabold text-center">{t('games.truthdare.playersTurn', { name: player.name })}</h2>
      <p className="text-white/50 text-[0.9375rem] -mt-2">
        {isDrinkingMode ? t('games.truthdare.chooseOrDrink') : t('games.truthdare.choosePrompt')}
      </p>
      {canAct ? <>
        <div className="flex gap-4 w-full max-w-sm">
          {mode !== 'nur-pflicht' && <motion.button whileTap={{ scale: 0.95 }} onClick={() => onChoose('truth')} data-choice="truth"
            className="flex-1 py-5 rounded-2xl font-extrabold text-lg transition-all bg-gradient-to-br from-[#f09a8a] to-[#d779ff] text-white">
            <Heart className="w-6 h-6 mb-1" /> <span>{t('games.truthdare.truth')}</span>
          </motion.button>}
          {mode !== 'nur-wahrheit' && <motion.button whileTap={{ scale: 0.95 }} onClick={() => onChoose('dare')} data-choice="dare"
            className="flex-1 py-5 rounded-2xl font-extrabold text-lg transition-all bg-gradient-to-br from-[#ff6b98] to-[#ff6b98]/80 text-white">
            <Flame className="w-6 h-6 mb-1" /> <span>{t('games.truthdare.dare')}</span>
          </motion.button>}
        </div>
        {(mode === 'nur-wahrheit' || mode === 'nur-pflicht') && (
          <p className="text-sm text-white/70">{mode === 'nur-wahrheit' ? t('games.truthdare.onlyTruth', 'Heute nur Wahrheit') : t('games.truthdare.onlyDare', 'Heute nur Pflicht')}</p>
        )}
      </> : <WatchHint name={player.name} />}
      {isDrinkingMode && canAct && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.95 }} onClick={onDrink}
          className="w-full max-w-sm h-14 rounded-2xl font-extrabold text-lg bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-400/30 text-amber-300">
          {'🍺'} {t('games.truthdare.drinkInstead')}
        </motion.button>
      )}
      <AnimatePresence>
        {disclaimer && (
          <motion.div className="relative z-10 mt-2 mx-6 px-5 py-3 rounded-2xl bg-amber-900/40 border border-amber-500/30 text-center"
            initial={{ y: 30, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.3 }}>
            <span className="text-2xl">{disclaimer.emoji}</span>
            <p className="text-sm text-amber-200 font-semibold mt-1">{disclaimer.message}</p>
            <p className="text-[11px] text-amber-300/60 mt-1">
              {t('games.truthdare.drinkCount', { count: drinkCount })} · {t('games.truthdare.drinkResponsibly')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Everyone except the active player judges, one after another (guests get the phone in turn). */
export function VotePanel({ subject, voters, voterIdx, canVote, isDrinkingMode, onVote }: {
  subject: Player; voters: Player[]; voterIdx: number; canVote: boolean; isDrinkingMode: boolean; onVote: (yes: boolean) => void;
}) {
  const { t } = useTranslation();
  const voter = voters[voterIdx];
  if (!voter) return null;
  return (
    <motion.div key="vote" {...enter} className="split-arena flex-1 flex flex-col items-center justify-center gap-6 px-4">
      <h2 className="text-xl font-extrabold text-center">
        {isDrinkingMode ? t('games.truthdare.voteTitleDrinking', { name: subject.name }) : t('games.truthdare.voteTitle', { name: subject.name })}
      </h2>
      {canVote ? (
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => onVote(true)} data-testid="truthdare-vote-yes"
            className="h-28 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex flex-col items-center justify-center gap-2 text-emerald-300 font-extrabold">
            <ThumbsUp className="w-9 h-9" /> {t('games.truthdare.votePassed', 'Geschafft')}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => onVote(false)} data-testid="truthdare-vote-no"
            className="h-28 rounded-2xl bg-red-500/15 border border-red-500/35 flex flex-col items-center justify-center gap-2 text-red-300 font-extrabold">
            <ThumbsDown className="w-9 h-9" /> {t('games.truthdare.voteFailed', 'Nicht geschafft')}
          </motion.button>
        </div>
      ) : <WatchHint name={voter.name} />}
      <div className="flex items-center gap-2" aria-label={t('games.truthdare.voteProgress', { done: voterIdx, total: voters.length, defaultValue: '{{done}} von {{total}} haben abgestimmt' })}>
        {voteProgress(voters.length, voterIdx).map((state, i) => (
          <div key={voters[i].id} className={cn('rounded-full transition-all', state === 'open' && 'scale-90')}
            style={{ boxShadow: state === 'now' ? playerGlow(voters[i].color, 'active') : undefined }}>
            <SeatAvatar avatar={state === 'done' ? '✓' : voters[i].avatar} color={voters[i].color} size={32} dimmed={state === 'open'} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function GameOverPanel({ players, achievements, onDismissAchievements, canAgain, onAgain, onOtherGame }: {
  players: Player[]; achievements: ComponentProps<typeof GameEndOverlay>['achievements']; onDismissAchievements: () => void;
  canAgain: boolean; onAgain: () => void; onOtherGame: () => void;
}) {
  const { t } = useTranslation();
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score ?? 0;
  return (
    <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
      <GameEndOverlay achievements={achievements} onDismiss={onDismissAchievements} />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>
      </motion.div>
      <h2 className="text-3xl font-extrabold text-[#f09a8a] neon-glow">{t('games.truthdare.gameOver')}</h2>
      <div className="text-lg font-bold text-[#f09a8a]">{t('games.truthdare.wins', { name: ranked.filter(p => p.score === top).map(p => p.name).join(' & ') })}</div>
      <div className="w-full space-y-2 max-h-64 overflow-y-auto">
        {ranked.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 bg-[#0d0915] border border-white/[0.07] rounded-2xl px-4 py-3"
            style={i === 0 ? { boxShadow: playerGlow(p.color) } : undefined}>
            <span className="text-white/60 text-sm font-bold w-6 tabular-nums">#{i + 1}</span>
            <SeatAvatar avatar={p.avatar} color={p.color} size={36} />
            <span className="flex-1 text-white/85 font-semibold truncate">{p.name}</span>
            <span className="text-[#f09a8a] font-bold tabular-nums">{t('games.truthdare.points', { count: p.score })}</span>
          </div>
        ))}
      </div>
      <div className="w-full space-y-3 mt-2">
        <motion.button whileTap={{ scale: 0.97 }} disabled={!canAgain} onClick={onAgain}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f09a8a] to-[#d779ff] text-[#0a0e14] rounded-2xl h-14 font-extrabold">
          <RotateCcw className="w-4 h-4" /> {t('games.truthdare.playAgain')}
        </motion.button>
        {!hasShellBackButton() && (
          <button onClick={onOtherGame}
            className="w-full h-14 rounded-2xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
            {t('games.truthdare.otherGame')}
          </button>
        )}
      </div>
    </motion.div>
  );
}
