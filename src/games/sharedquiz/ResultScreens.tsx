/**
 * Aufloesung und Endstand von GETEILT GEQUIZZT — aus SharedQuizGame.tsx
 * ausgelagert (Dateigroesse), Darstellung unveraendert.
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Lightbulb, RotateCcw, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { getPlayerInitial } from '../ui/PlayerAvatars';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { sharedRoundPoints } from './rules';
import type { SharedQuizQuestion } from './sharedquiz-content';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
interface Player { id: string; name: string; color: string; score: number }

export function RevealPanel({ currentQ, isCorrect, mode, teamAnswers, players, roleIndices, selectedAnswer, canAdvance, onNext, lastRound }: {
  currentQ: SharedQuizQuestion; isCorrect: boolean; mode: 'trio' | 'chain' | 'allornothing'; teamAnswers: number[]; players: Player[];
  roleIndices: number[]; selectedAnswer: number | null; canAdvance: boolean; onNext: () => void; lastRound: boolean;
}) {
  const { t } = useTranslation();
  return (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-3xl mx-auto w-full">
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
      <div className={cn('w-16 h-16 rounded-full flex items-center justify-center',
        isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
        {isCorrect ? <Check className="w-8 h-8 text-emerald-400" /> : <X className="w-8 h-8 text-red-400" />}
      </div>
    </motion.div>
    <h2 className={cn('text-2xl font-extrabold font-sans',
      isCorrect ? 'text-emerald-400' : 'text-red-400')}>
      {isCorrect ? t('games.play.correct') : t('games.play.wrong')}
    </h2>

    {mode !== 'trio' && <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
      <p className="text-xl font-black text-cyan-200">{t('games.results.winnerPoints', { n: sharedRoundPoints(mode, teamAnswers, currentQ.correctIndex) })}</p>
      {teamAnswers.map((answer, index) => <div key={index} className="flex justify-between gap-3 text-sm">
        <span>{players[roleIndices[index]]?.name}</span>
        <span className={answer === currentQ.correctIndex ? 'text-emerald-300' : 'text-red-300'}>{t(answer === currentQ.correctIndex ? 'games.play.correct' : 'games.play.wrong')}</span>
      </div>)}
    </div>}

    <div className="w-full rounded-[1rem] bg-[#151a21]/80 border border-[#44484f]/20 p-5 space-y-4">
      <div><div className="text-xs text-white/40 uppercase tracking-widest mb-1">{t('games.sharedquiz.roleQuestion')}</div>
        <div className="text-white font-bold">{currentQ.question}</div></div>
      <div className="space-y-1.5">
        {currentQ.answers.map((a, i) => (
          <div key={i} className={cn('flex items-center gap-3 rounded-[1rem] px-4 py-2.5 border',
            i === currentQ.correctIndex ? 'bg-emerald-500/10 border-emerald-500/30' :
            i === selectedAnswer ? 'bg-red-500/10 border-red-500/30' : 'bg-white/[0.02] border-white/[0.04]')}>
            <span className={cn('w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs',
              i === currentQ.correctIndex ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40')}>{ANSWER_LABELS[i]}</span>
            <span className={cn('font-semibold text-sm', i === currentQ.correctIndex ? 'text-emerald-300' : 'text-white/60')}>{a}</span>
            {i === currentQ.correctIndex && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-[1rem] px-4 py-3">
        <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <span className="text-amber-200/80 text-sm">{currentQ.hint}</span>
      </div>
    </div>

    <motion.button whileTap={{ scale: 0.97 }} disabled={!canAdvance} onClick={onNext}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] px-8 py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(143,245,255,0.25)]">
      {lastRound ? t('games.sharedquiz.resultBtn') : t('games.play.next')} <ArrowRight className="w-5 h-5" />
    </motion.button>
  </motion.div>
  );
}

export function GameOverPanel({ sorted, achievements, onDismiss, canRestart, onPlayAgain, onOtherGame }: {
  sorted: Player[]; achievements: Parameters<typeof GameEndOverlay>[0]['achievements']; onDismiss: () => void;
  canRestart: boolean; onPlayAgain: () => void; onOtherGame: () => void;
}) {
  const { t } = useTranslation();
  return (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 max-w-3xl mx-auto w-full">
    <GameEndOverlay achievements={achievements} onDismiss={onDismiss} />
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
        <Trophy className="w-8 h-8 text-amber-400" />
      </div>
    </motion.div>
    <h2 className="text-3xl font-extrabold font-sans text-[#8ff5ff] neon-glow-cyan">
      {t('games.results.gameOver')}
    </h2>
    <div className="w-full space-y-2">
      {sorted.map((p, i) => (
        <div key={p.id} className={cn('flex items-center gap-3 rounded-[1rem] px-4 py-3 border',
          p.score === sorted[0]?.score ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#1b2028] border-[#44484f]/20')}>
          <span className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
            p.score === sorted[0]?.score ? 'bg-amber-500 text-[#0a0e14]' : 'bg-white/10 text-white/40')}>{sorted.findIndex(other => other.score === p.score) + 1}</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: p.color }}>{getPlayerInitial(p.name)}</div>
          <span className="flex-1 font-semibold text-white truncate">{p.name}</span>
          <span className={cn('font-bold text-lg', p.score === sorted[0]?.score ? 'text-amber-400' : 'text-white/60')}>{p.score}</span>
        </div>
      ))}
    </div>
    <div className="w-full space-y-3 mt-2">
      <motion.button whileTap={{ scale: 0.97 }} disabled={!canRestart} onClick={onPlayAgain}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8ff5ff] to-[#00deec] text-[#0a0e14] py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(143,245,255,0.25)]">
        <RotateCcw className="w-4 h-4" /> {t('games.results.playAgain')}
      </motion.button>
      {!hasShellBackButton() && (
        <button onClick={onOtherGame}
          className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
          {t('games.results.otherGame')}
        </button>
      )}
    </div>
  </motion.div>
  );
}
