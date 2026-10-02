import type { ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Trophy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { hasShellBackButton } from '@/games/ui/shell-back';

interface Seat { id: string; name: string; color: string; avatar: string; score: number }

/** Everyone except the chosen player votes, one after another. */
export function BottleVote({ players, selectedIdx, voterIdx, selectedName, canVote, onVote }: {
  players: Seat[]; selectedIdx: number; voterIdx: number; selectedName: string; canVote: boolean; onVote: (yes: boolean) => void;
}) {
  const { t } = useTranslation();
  const otherPlayers = players.filter((_, i) => i !== selectedIdx);
  const voter = otherPlayers[voterIdx];
  if (!voter) return null;
  return (
    <motion.div key="vote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-4">
      <h2 className="text-xl font-extrabold neon-text-purple text-[#e6b880]">
        {t('games.bottlespin.voteQuestion', { name: selectedName })}
      </h2>
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
        className="relative">
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#e6b880]/20 to-[#ff6b98]/20 blur-lg" />
        <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-2 ring-[#e6b880]/30"
          style={{ backgroundColor: voter.color, boxShadow: `0 0 20px ${voter.color}44` }}>
          {voter.avatar}
        </div>
      </motion.div>
      <p className="text-white/50 font-semibold">{t('games.bottlespin.voting', { name: voter.name })}</p>
      <div className="flex gap-5">
        <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} disabled={!canVote} onClick={() => onVote(true)}
          className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center border-emerald-500/20 hover:border-emerald-500/40 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <ThumbsUp className="w-8 h-8 text-emerald-400" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} disabled={!canVote} onClick={() => onVote(false)}
          className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center border-[#ff6e84]/20 hover:border-[#ff6e84]/40 transition-all hover:shadow-[0_0_20px_rgba(255,110,132,0.2)]">
          <ThumbsDown className="w-8 h-8 text-[#ff6e84]" />
        </motion.button>
      </div>
      <div className="flex gap-1.5">
        {otherPlayers.map((_, i) => (
          <div key={i} className={cn('w-2.5 h-2.5 rounded-full transition-all duration-300',
            i < voterIdx ? 'bg-[#e6b880]' : i === voterIdx ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-white/[0.08]')} />
        ))}
      </div>
    </motion.div>
  );
}

export function BottleGameOver({ players, winner, mode, totalRounds, achievements, onDismissAchievements, canAgain, onAgain, onOtherGame }: {
  players: Seat[]; winner: Seat | undefined; mode: string; totalRounds: number;
  achievements: ComponentProps<typeof GameEndOverlay>['achievements']; onDismissAchievements: () => void;
  canAgain: boolean; onAgain: () => void; onOtherGame: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="table-results relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
      <GameEndOverlay achievements={achievements} onDismiss={onDismissAchievements} />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-amber-500/10 blur-xl" />
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 trophy-glow">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>
      </motion.div>
      <h2 className="text-3xl font-black neon-text bg-gradient-to-r from-amber-400 via-[#ff6b98] to-[#e6b880] bg-clip-text text-transparent">
        {t('games.bottlespin.gameOver')}
      </h2>
      {mode === 'fragen' && winner && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold text-[#e6b880] neon-text-purple">{t('games.bottlespin.wins', { name: players.filter(p => p.score === winner.score).map(p => p.name).join(' & ') })}</motion.div>
      )}
      {mode === 'fragen' && (
        <div className="w-full space-y-2.5 max-h-64 overflow-y-auto">
          {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 glass-panel-elevated',
                i === 0 && 'border-amber-500/20 card-glow')}>
              <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/[0.08]"
                style={{ backgroundColor: p.color }}>{p.avatar}</div>
              <span className="flex-1 text-white/80 font-semibold truncate">{p.name}</span>
              <span className="text-[#e6b880] font-bold">{t('games.bottlespin.scorePoints', { score: p.score })}</span>
            </motion.div>
          ))}
        </div>
      )}
      {mode === 'nur-flasche' && (
        <p className="text-white/30 text-center text-sm">{t('games.bottlespin.roundsPlayed', { rounds: totalRounds })}</p>
      )}
      <div className="w-full space-y-3 mt-3">
        <motion.button whileTap={{ scale: 0.97 }} disabled={!canAgain} onClick={onAgain}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#e6b880] to-[#d779ff] text-white py-4 rounded-2xl h-14 font-extrabold btn-glow">
          <RotateCcw className="w-4 h-4" /> {t('games.bottlespin.playAgain')}
        </motion.button>
        {!hasShellBackButton() && (
          <button onClick={onOtherGame}
            className="w-full py-3.5 rounded-2xl border border-[#e6b880]/10 text-white/40 text-sm font-semibold hover:bg-white/[0.02] hover:border-[#e6b880]/20 transition-all">
            {t('games.bottlespin.otherGame')}
          </button>
        )}
      </div>
    </motion.div>
  );
}
