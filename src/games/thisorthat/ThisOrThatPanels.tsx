import type { ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, RotateCcw, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { StageHeader, StageAction } from '../ui/GameStage';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { DuelBallot } from './DuelBallot';
import type { ThisOrThatPair } from './thisorthat-content';

type Choice = 'A' | 'B';
interface Seat {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
}
type Haptics = { light: () => unknown; medium: () => unknown };

/** Ballot. Online: own phone votes at once; 🔁 guests on this phone get a fresh ballot each (localVoter). */
export function TotVoting({
  online,
  localVoter,
  players,
  roundVotes,
  voterIdx,
  totalRounds,
  currentRound,
  mode,
  speedTimeLeft,
  currentPair,
  haptics,
  castVote,
}: {
  online?: OnlineGameProps;
  localVoter: string | null;
  players: Seat[];
  roundVotes: Record<string, Choice>;
  voterIdx: number;
  totalRounds: number;
  currentRound: number;
  mode: string;
  speedTimeLeft: number;
  currentPair: ThisOrThatPair;
  haptics: Haptics;
  castVote: (choice: Choice) => void;
}) {
  const { t } = useTranslation();
  const myId = online?.myPlayerId;
  const iAlreadyVoted = !!online && !localVoter;
  const guestVoter = online && localVoter && localVoter !== myId ? players.find((p) => p.id === localVoter) : undefined;
  const votedCount = Object.keys(roundVotes).length;
  const tap = (choice: 'A' | 'B') => {
    if (iAlreadyVoted) return;
    void haptics.medium();
    castVote(choice);
  };
  return (
    <motion.div
      key="voting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-4 sm:px-6 py-4"
    >
      {/* Title + progress strip */}
      <div className="mb-4 sm:mb-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter italic">
          THIS <span className="text-[#edb095] drop-shadow-[0_0_10px_#df8eff]">or</span> THAT?
        </h2>
        <div className="mt-3 flex justify-center gap-1">
          {Array.from({ length: totalRounds })
            .slice(0, 12)
            .map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i < currentRound - 1 && 'w-6 bg-[#df8eff]/70',
                  i === currentRound - 1 && 'w-8 bg-[#df8eff] shadow-[0_0_10px_#df8eff]',
                  i > currentRound - 1 && 'w-6 bg-[#20262f]'
                )}
              />
            ))}
        </div>
      </div>

      {/* Voter banner */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {online && !guestVoter ? (
          <span className="text-[#a8abb3] text-xs font-semibold">
            {iAlreadyVoted
              ? t('games.thisorthat.waitingForOthers', { voted: votedCount, total: players.length })
              : t('games.thisorthat.yourChoice')}
          </span>
        ) : (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: (guestVoter ?? players[voterIdx])?.color }}
            >
              {(guestVoter ?? players[voterIdx])?.avatar}
            </div>
            <span className="text-[#a8abb3] text-xs font-semibold">
              <span className="text-white font-bold">{(guestVoter ?? players[voterIdx])?.name}</span> {t('games.thisorthat.playerChooses')}
            </span>
          </>
        )}
        {mode === 'speed' && (
          <span
            className={cn(
              'ml-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-black',
              speedTimeLeft <= 2 ? 'bg-[#ff6e84]/15 text-[#ff6e84] animate-pulse' : 'bg-[#ff6b98]/15 text-[#ff6b98]'
            )}
          >
            {speedTimeLeft}s
          </span>
        )}
      </div>

      <DuelBallot
        a={currentPair.optionA}
        b={currentPair.optionB}
        choose={tap}
        locked={iAlreadyVoted}
        selected={online && !localVoter ? roundVotes[online.myPlayerId] : undefined}
        label={t('games.thisorthat.choose')}
      />

      {/* Voter progress dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {players.map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              online
                ? i < votedCount
                  ? 'bg-[#df8eff] scale-125'
                  : 'bg-white/10'
                : i < voterIdx
                ? 'bg-[#df8eff] scale-125'
                : i === voterIdx
                ? 'bg-white scale-150'
                : 'bg-white/10'
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function TotDebate({
  online,
  currentPair,
  debateTimeLeft,
  endDebate,
}: {
  online?: OnlineGameProps;
  currentPair: ThisOrThatPair;
  debateTimeLeft: number;
  endDebate: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      key="debate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-5 px-4"
    >
      <MessageSquare className="w-10 h-10 text-[#ff6b98]" />
      <h2 className="text-2xl font-extrabold">{t('games.thisorthat.debateTitle')}</h2>
      <p className="text-white/40 text-sm text-center">{t('games.thisorthat.debateHint')}</p>
      <div className="text-4xl font-mono font-black text-[#ff6b98]">{debateTimeLeft}s</div>
      <div className="flex gap-4 w-full max-w-sm">
        <div className="flex-1 rounded-2xl bg-[#df8eff]/10 border border-[#df8eff]/20 p-4 text-center">
          <span className="text-lg font-bold text-[#edb095]">{currentPair.optionA}</span>
        </div>
        <div className="text-white/20 self-center font-bold">vs</div>
        <div className="flex-1 rounded-2xl bg-[#8ff5ff]/10 border border-[#8ff5ff]/20 p-4 text-center">
          <span className="text-lg font-bold text-[#8ff5ff]">{currentPair.optionB}</span>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={!!online && !online.isHost}
        onClick={endDebate}
        className="mt-4 px-8 py-3 rounded-2xl bg-white/10 border border-white/10 text-white/60 font-bold text-sm"
      >
        {t('games.thisorthat.debateSkip')}
      </motion.button>
    </motion.div>
  );
}

export function TotReveal({
  online,
  currentPair,
  currentRound,
  totalRounds,
  players,
  roundVotes,
  voteStats,
  haptics,
  nextRound,
}: {
  online?: OnlineGameProps;
  currentPair: ThisOrThatPair;
  currentRound: number;
  totalRounds: number;
  players: Seat[];
  roundVotes: Record<string, Choice>;
  voteStats: { total: number; aCount: number; bCount: number; aPct: number; bPct: number };
  haptics: Haptics;
  nextRound: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="duel-verdict">
      <StageHeader
        title={t(voteStats.aCount === voteStats.bCount ? 'games.thisorthat.tie' : 'games.thisorthat.verdictTitle')}
        eyebrow={t('games.thisorthat.roundResult', { round: currentRound })}
        subtitle={t('games.thisorthat.voteCount', { count: voteStats.total })}
      />
      <div className="duel-results-grid">
        {(['A', 'B'] as const).map((side, i) => {
          const count = i === 0 ? voteStats.aCount : voteStats.bCount;
          const percent = i === 0 ? voteStats.aPct : voteStats.bPct;
          return (
            <section key={side} data-side={side} className="duel-result-column">
              <div className="duel-result-top">
                <span>{side}</span>
                <strong>
                  {percent}
                  <small>%</small>
                </strong>
              </div>
              <h2>{i === 0 ? currentPair.optionA : currentPair.optionB}</h2>
              <div className="duel-result-track">
                <span style={{ width: `${percent}%` }} />
              </div>
              <p>{t('games.thisorthat.votes', { count })}</p>
              <div className="duel-result-voters">
                {players
                  .filter((p) => roundVotes[p.id] === side)
                  .map((p) => (
                    <span key={p.id}>{p.name}</span>
                  ))}
              </div>
            </section>
          );
        })}
      </div>
      <StageAction
        className="w-full mt-7"
        disabled={!!online && !online.isHost}
        onClick={() => {
          void haptics.light();
          nextRound();
        }}
      >
        {t(currentRound >= totalRounds ? 'games.results.gameOver' : 'games.play.next')}
        <ArrowRight size={20} />
      </StageAction>
    </div>
  );
}

export function TotGameOver({
  online,
  players,
  winner,
  newAchievements,
  clearAchievements,
  playAgain,
  onOtherGame,
}: {
  online?: OnlineGameProps;
  players: Seat[];
  winner: Seat;
  newAchievements: ComponentProps<typeof GameEndOverlay>['achievements'];
  clearAchievements: () => void;
  playAgain: () => void;
  onOtherGame: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      key="over"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full"
    >
      <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>
      </motion.div>
      <h2 className="text-3xl font-extrabold text-[#edb095] neon-glow">{t('games.results.gameOver')}</h2>
      <div className="text-lg font-bold text-[#8ff5ff]">
        {t('games.thisorthat.playerWins', {
          name: players
            .filter((p) => p.score === winner.score)
            .map((p) => p.name)
            .join(', '),
        })}
      </div>
      <div className="w-full space-y-2 max-h-64 overflow-y-auto">
        {[...players]
          .sort((a, b) => b.score - a.score)
          .map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 bg-[#1b2028] border border-[#44484f]/20 rounded-2xl px-4 py-3">
              <span className="text-white/30 text-sm font-bold w-5">#{players.filter((other) => other.score > p.score).length + 1}</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.avatar}
              </div>
              <span className="flex-1 text-white/80 font-semibold truncate">{p.name}</span>
              <span className="text-[#8ff5ff] font-bold">{t('games.thisorthat.scorePoints', { score: p.score })}</span>
            </div>
          ))}
      </div>
      <div className="w-full space-y-3 mt-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!!online && !online.isHost}
          onClick={playAgain}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-[#0a0e14] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_25px_rgba(207,150,255,0.25)]"
        >
          <RotateCcw className="w-4 h-4" /> {t('games.results.playAgain')}
        </motion.button>
        {!hasShellBackButton() && (
          <button
            onClick={onOtherGame}
            className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
          >
            {t('games.results.otherGame')}
          </button>
        )}
      </div>
    </motion.div>
  );
}
