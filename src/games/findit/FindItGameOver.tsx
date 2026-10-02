import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { GameStage, StageHeader, StageAction, StageFooter } from '../ui/GameStage';
import { hasShellBackButton } from '@/games/ui/shell-back';
import type { Player } from './findit-config';

export function FindItGameOver({ players, onRestart, onBack, totalRounds }: {
  players: Player[]; onRestart: () => void; onBack: () => void; totalRounds: number;
}) {
  const { t } = useTranslation();
  const winner = players[0];
  const totalCorrect = players.reduce((s, p) => s + p.correct, 0);
  const bestStreak = Math.max(...players.map(p => p.bestStreak), 0);

  return <GameStage gameId="wo-ist-was" className="expedition"><div className="expedition-results">
    <StageHeader title={players.filter(p=>p.score===winner?.score).map(p=>p.name).join(' / ')} eyebrow={t('games.findit.gameOverTitle')} subtitle={t('games.findit.points',{score:winner?.score})}/>
    <div className="expedition-facts">{[{label:t('games.findit.statsRounds'),value:totalRounds},{label:t('games.findit.statsCorrect'),value:totalCorrect},{label:t('games.findit.statsBestStreak'),value:bestStreak}].map(stat=><div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
    <div className="expedition-ranking">{players.map(player=><div key={player.id}><span>{String(players.filter(p=>p.score>player.score).length+1).padStart(2,'0')}</span><div><strong>{player.name}</strong><small>{t('games.findit.correctOf',{correct:player.correct,wrong:player.wrong})}</small></div><b>{player.score}</b></div>)}</div>
    <StageFooter><StageAction onClick={onRestart}><RotateCcw size={19}/>{t('games.findit.btnPlayAgain')}</StageAction>{!hasShellBackButton()&&<StageAction variant="secondary" onClick={onBack}>{t('games.findit.btnOtherGame')}</StageAction>}</StageFooter>
  </div></GameStage>;
}
