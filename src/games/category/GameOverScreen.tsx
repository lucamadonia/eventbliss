import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { StageHeader, StageAction, StageFooter } from '../ui/GameStage';

interface ScoredPlayer { id: string; name: string; score: number; losses: number }

export function GameOverScreen({ players, onPlayAgain, onRestart }: { players: ScoredPlayer[]; onPlayAgain: () => void; onRestart: () => void }) {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return <div className="space-y-7">
    <StageHeader title={t('games.category.finalResults')} eyebrow={t('games.category.scoreboard')} />
    <ol className="divide-y divide-white/15 border-y border-white/15">{sorted.map((player, index) => <li key={player.id} className="flex items-center gap-4 py-6">
      <span className="text-sm text-[var(--stage-muted)]">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-xl font-semibold break-words">{player.name}</p><p className="mt-1 text-sm text-[var(--stage-muted)]">{t('games.category.roundsLost', { count: player.losses })}</p></div><strong className="text-4xl tabular-nums text-[#f2bc66]">{player.score}</strong>
    </li>)}</ol>
    <StageFooter className="flex-wrap"><StageAction onClick={onPlayAgain}><RotateCcw className="h-5 w-5" />{t('games.category.playAgain')}</StageAction><StageAction variant="secondary" onClick={onRestart}>{t('games.category.otherGame')}</StageAction></StageFooter>
  </div>;
}
