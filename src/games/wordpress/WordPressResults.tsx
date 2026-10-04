import { useTranslation } from 'react-i18next';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { StageHeader, StageAction, StageFooter } from '../ui/GameStage';
import type { PlayerState } from './wordpress-types';

// ---------------------------------------------------------------------------
// Round End Screen
// ---------------------------------------------------------------------------

interface RoundEndProps {
  players: PlayerState[];
  round: number;
  totalRounds: number;
  onNextRound: () => void;
}

export function RoundEndScreen({ players, round, totalRounds, onNextRound }: RoundEndProps) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return <div className="mx-auto w-full max-w-3xl space-y-7">
    <StageHeader title={t('games.wordpress.roundHeading', { round, total: totalRounds })} subtitle={t('games.wordpress.interimStandings')} />
    <ReactionStandings players={sorted} />
    <StageFooter><StageAction onClick={onNextRound}>{round < totalRounds ? t('games.wordpress.nextRound') : t('games.wordpress.showResults')}<ChevronRight className="h-5 w-5" /></StageAction></StageFooter>
  </div>;
}

// ---------------------------------------------------------------------------
// Game Over Screen
// ---------------------------------------------------------------------------

interface GameOverProps {
  players: PlayerState[];
  onRestart: () => void;
}

export function GameOverScreen({ players, onRestart }: GameOverProps) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return <div className="mx-auto w-full max-w-3xl space-y-7">
    <StageHeader title={t('games.wordpress.gameOver')} eyebrow={t('games.results.leaderboard')} />
    <ReactionStandings players={sorted} />
    <StageFooter><StageAction onClick={onRestart}><RotateCcw className="h-5 w-5" />{t('games.results.playAgain')}</StageAction></StageFooter>
  </div>;
}

function ReactionStandings({ players }: { players: PlayerState[] }) {
  const { t } = useTranslation();
  const best = Math.max(...players.map(player => player.score));
  return <ol className="divide-y divide-white/15 border-y border-white/15">{players.map((player, index) => {
    const attempts = player.correct + player.wrong + player.missed;
    const accuracy = attempts ? Math.round(player.correct / attempts * 100) : 0;
    return <li key={`${player.name}-${index}`} className="flex items-start gap-4 py-6">
      <span className="pt-1 text-sm tabular-nums text-[var(--stage-muted)]">{String(index + 1).padStart(2, '0')}</span>
      <div className="flex-1 min-w-0"><p className="text-xl font-semibold break-words">{player.name}</p><p className="mt-2 text-sm leading-relaxed text-[var(--stage-muted)]">{t('games.wordpress.accuracyCombo', { accuracy, maxCombo: player.maxCombo })}</p></div>
      <strong className={player.score === best ? 'text-4xl text-[#d5f46a] tabular-nums' : 'text-4xl tabular-nums'}>{player.score}</strong>
    </li>;
  })}</ol>;
}

