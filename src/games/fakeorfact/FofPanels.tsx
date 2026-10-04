import { motion } from 'framer-motion';
import { ArrowRight, Check, RotateCcw, Trophy, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { SeatAvatar } from '@/components/native/party/PartySheet';
import { GameEndOverlay } from '../social/GameEndOverlay';
import type { Fact, ThreeStatements } from './fakeorfact-content';
import type { Mode, Player } from './game-model';
import type { localSeatResults } from './turn-order';
import { WaitingStrip } from './TurnStage';

const panel = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

/** Statement + ballot. `canAnswer` false → the calm waiting strip replaces the buttons (phones waiting their turn). */
export function StatementPanel({ mode, fact, three, turnKey, canAnswer, waitingFor, answered, onClassic, onThree }: {
  mode: Mode;
  fact: Fact | null;
  three: ThreeStatements | null;
  turnKey: string;
  canAnswer: boolean;
  waitingFor: Player | null;
  answered: boolean;
  onClassic: (isTrue: boolean) => void;
  onThree: (idx: number) => void;
}) {
  const { t } = useTranslation();
  if (mode === 'classic' && fact) {
    return (
      // Keyed per turn: every seat (each 🔁 guest too) gets a fresh, untouched ballot.
      <motion.div key={`classic-${turnKey}`} {...panel} className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="fact-sheet">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold mb-4">{fact.category}</span>
            <p className="fact-headline">{fact.statement}</p>
          </motion.div>
        </div>
        <div className="px-4 pb-6 pt-3">
          {canAnswer ? (
            <div className="fact-ballot flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => onClassic(true)}
                className="flex-1 flex items-center justify-center gap-2 py-4 font-bold text-lg">
                <Check className="w-6 h-6" /> {t('games.fakeorfact.btnTrue')}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => onClassic(false)}
                className="flex-1 flex items-center justify-center gap-2 py-4 font-bold text-lg">
                <X className="w-6 h-6" /> {t('games.fakeorfact.btnFalse')}
              </motion.button>
            </div>
          ) : <WaitingStrip player={waitingFor} answered={answered} />}
        </div>
      </motion.div>
    );
  }
  if (mode === 'three' && three) {
    return (
      <motion.div key={`three-${turnKey}`} {...panel} className="flex-1 flex flex-col">
        <div className="text-center px-4 mb-2 mt-2">
          <span className="text-[0.8125rem] font-semibold text-[#ff6b98]">{t('games.fakeorfact.whichIsTrue')}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          {three.statements.map((stmt, idx) => (
            <motion.button key={idx} whileTap={canAnswer ? { scale: 0.97 } : undefined} disabled={!canAnswer}
              onClick={() => onThree(idx)} className="fact-option">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 tabular-nums">{idx + 1}</span>
                <p className="text-sm font-medium leading-relaxed">{stmt}</p>
              </div>
            </motion.button>
          ))}
        </div>
        <div className="px-4 pb-6 pt-3">{!canAnswer && <WaitingStrip player={waitingFor} answered={answered} />}</div>
      </motion.div>
    );
  }
  return null;
}

type SeatRow = ReturnType<typeof localSeatResults<Player>>[number];

/** Shared phone: every seat this device played gets its own line after the reveal. */
function SeatResults({ rows, mode }: { rows: SeatRow[]; mode: Mode }) {
  const { t } = useTranslation();
  const label = (row: SeatRow) => !row.answered ? t('games.fakeorfact.noAnswer')
    : mode === 'three' ? `#${Number(row.answer) + 1}` : row.answer ? t('games.fakeorfact.btnTrue') : t('games.fakeorfact.btnFalse');
  return (
    <div className="w-full space-y-2" data-testid="fof-seat-results">
      <p className="text-[0.8125rem] font-semibold text-white/55">{t('games.fakeorfact.seatResults', 'Ergebnisse an diesem Handy')}</p>
      {rows.map(row => (
        <div key={row.player.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0915] px-3 py-2.5">
          <SeatAvatar avatar={row.player.avatar} color={row.player.color} size={36} />
          <span className="flex-1 truncate text-base font-semibold text-white">{row.player.name}</span>
          <span className="text-[0.8125rem] font-semibold text-white/60">{label(row)}</span>
          {row.correct ? <Check className="h-5 w-5 text-emerald-400" aria-label={t('games.fakeorfact.correct')} />
            : <X className="h-5 w-5 text-red-400" aria-label={t('games.fakeorfact.wrong')} />}
        </div>
      ))}
    </div>
  );
}

export function RevealPanel({ mode, fact, three, wasCorrect, displayVote, threeStatus, correctPct, seatRows, canContinue, onContinue }: {
  mode: Mode;
  fact: Fact | null;
  three: ThreeStatements | null;
  wasCorrect: boolean;
  displayVote: boolean | null;
  /** Online three-mode: own result line (null offline). */
  threeStatus: string | null;
  correctPct: number;
  /** Shown only when this phone played more than one seat. */
  seatRows: SeatRow[];
  canContinue: boolean;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div key="reveal" {...panel} className="fact-reveal flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
      {mode === 'classic' && fact && (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
            className={cn('w-20 h-20 rounded-full flex items-center justify-center', wasCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
            {wasCorrect ? <Check className="w-10 h-10 text-emerald-400" /> : <X className="w-10 h-10 text-red-400" />}
          </motion.div>
          <h2 className={cn('text-3xl font-extrabold', wasCorrect ? 'text-emerald-400' : 'text-red-400')}>
            {wasCorrect ? t('games.fakeorfact.correct') : t('games.fakeorfact.wrong')}
          </h2>
          <div className="w-full flex gap-3">
            <div className="flex-1 rounded-xl bg-[#1b2028] border border-[#44484f]/20 p-3 text-center">
              <p className="text-[0.8125rem] font-semibold text-[#a8abb3] mb-1">{t('games.fakeorfact.yourAnswer')}</p>
              <p className={cn('text-lg font-bold', displayVote ? 'text-emerald-400' : 'text-red-400')}>
                {displayVote === null ? t('games.fakeorfact.noAnswer') : displayVote ? t('games.fakeorfact.btnTrue') : t('games.fakeorfact.btnFalse')}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-[#1b2028] border border-[#44484f]/20 p-3 text-center">
              <p className="text-[0.8125rem] font-semibold text-[#a8abb3] mb-1">{t('games.fakeorfact.actualAnswer')}</p>
              <p className={cn('text-lg font-bold', fact.isTrue ? 'text-emerald-400' : 'text-red-400')}>
                {fact.isTrue ? t('games.fakeorfact.btnTrue') : t('games.fakeorfact.btnFalse')}
              </p>
            </div>
          </div>
          <div className="w-full rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-5">
            <p className="text-sm text-white/70 leading-relaxed">{fact.explanation}</p>
          </div>
        </>
      )}

      {mode === 'three' && three && (
        <>
          <h2 className="text-2xl font-extrabold font-sans text-[#ede9dc]">{t('games.fakeorfact.theTruthIs')}</h2>
          <div className="w-full space-y-2">
            {three.statements.map((stmt, idx) => (
              <div key={idx} className={cn('w-full rounded-[1rem] border p-4 flex items-start gap-3',
                idx === three.trueIndex ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#1b2028] border-[#44484f]/20 opacity-60')}>
                {idx === three.trueIndex
                  ? <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  : <X className="w-5 h-5 text-red-400/50 shrink-0 mt-0.5" />}
                <p className="text-sm text-white/80 leading-relaxed">{stmt}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {threeStatus !== null && <p role="status">{threeStatus}</p>}
      {seatRows.length > 1 && <SeatResults rows={seatRows} mode={mode} />}
      <div className="w-full">
        <div className="flex justify-between text-xs text-white/40 mb-1.5 tabular-nums">
          <span>{t('games.fakeorfact.correctPct', { pct: correctPct })}</span>
          <span>{t('games.fakeorfact.incorrectPct', { pct: 100 - correctPct })}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#1b2028] overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-[#ede9dc] rounded-full"
            initial={{ width: 0 }} animate={{ width: `${correctPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} disabled={!canContinue} onClick={onContinue}
        className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#78d9db] to-[#d779ff] text-[#0a0e14] px-8 py-4 min-h-[3.5rem] rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(150,160,165,0.3)]">
        {t('games.fakeorfact.continue')} <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

export function GameOverPanel({ players, achievements, onDismiss, canAgain, onAgain, onOtherGame }: {
  players: Player[];
  achievements: Parameters<typeof GameEndOverlay>[0]['achievements'];
  onDismiss: () => void;
  canAgain: boolean;
  onAgain: () => void;
  onOtherGame: () => void;
}) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <motion.div key="gameOver" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 max-w-lg mx-auto w-full">
      <GameEndOverlay achievements={achievements} onDismiss={onDismiss} />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>
      </motion.div>
      <h2 className="text-3xl font-extrabold font-sans text-[#78d9db] neon-glow">{t('games.results.gameOver')}</h2>
      <div className="w-full space-y-2">
        {sorted.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className={cn('flex items-center gap-3 px-4 py-3 rounded-[1rem] border',
              i === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#1b2028] border-[#44484f]/20')}>
            <span className="text-sm font-bold text-white/40 w-6 text-center tabular-nums">{i + 1}</span>
            <SeatAvatar avatar={p.avatar} color={p.color} size={36} />
            <span className="flex-1 text-white font-medium text-base truncate">{p.name}</span>
            <span className="text-base font-bold text-white/70 tabular-nums">{p.score}</span>
          </motion.div>
        ))}
      </div>
      <div className="w-full space-y-3 mt-2">
        <motion.button whileTap={{ scale: 0.97 }} disabled={!canAgain} onClick={onAgain}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#78d9db] to-[#d779ff] text-[#0a0e14] py-4 min-h-[3.5rem] rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(150,160,165,0.3)]">
          <RotateCcw className="w-4 h-4" /> {t('games.results.playAgain')}
        </motion.button>
        {/* Nur im Web. In der App macht das der FloatingBackButton. */}
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
