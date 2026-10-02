import { GameStage, StageHeader, StagePanel, StageAction } from '../ui/GameStage';
import './bomb-console.css';
import './bomb-presentation.css';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bomb, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import type { GameState } from './BombGame';
import { PartyTurnRibbon, type TurnRibbonKind, type TurnRibbonPlayer } from '../ui/PartyTurnRibbon';

interface PlayingScreenProps {
  canPlay?: boolean;
  state: GameState;
  progress: number;
  timeLeft?: number;
  onWeiter: () => void;
  onQuizAnswer: (idx: number) => void;
  onAlleAnswer?: (knows: boolean) => void;
  /** Party: who holds the bomb as seen from this phone (pass = a 🔁 guest on this phone). */
  holder?: { player: TurnRibbonPlayer; kind: TurnRibbonKind };
}

function triggerVibration(intensity: number) {
  if (!navigator.vibrate) return;
  if (intensity < 0.3) return;
  const on = Math.round(30 + intensity * 70);
  const off = Math.round(100 - intensity * 60);
  navigator.vibrate([on, off, on]);
}

export default function BombPlayingScreen({ state, progress, timeLeft, onWeiter, onQuizAnswer, onAlleAnswer, canPlay = true, holder }: PlayingScreenProps) {
  const { t } = useTranslation();
  const player = state.players[state.currentPlayerIndex];
  const isRandom = state.randomTimer;
  const timerSeconds = timeLeft ?? Math.max(0, Math.round((1 - progress) * ((state.timerMin + state.timerMax) / 2)));

  useEffect(() => {
    triggerVibration(progress);
  }, [Math.round(progress * 20)]);

  return <GameStage gameId="bomb" className="bomb-console bomb-playing" data-critical={progress > .75}>
    <StageHeader title={player.name} eyebrow={t('games.bomb.name')} subtitle={t('games.bomb.roundLabel', { round: state.round, total: state.totalRounds })}
      trailing={<span className="bomb-mode">{t(`gameModes.bomb.${state.mode}.name`)}</span>} progress={{value:state.round,total:state.totalRounds}} />
    {holder && <PartyTurnRibbon className="mb-3" player={holder.player} kind={holder.kind}
      line={holder.kind === 'other' ? t('games.bomb.partyHolderWait', 'Gleich könnte sie bei dir landen.') : holder.kind === 'pass' ? t('games.bomb.partyHolderPass', 'Die Zündschnur brennt weiter!') : undefined} />}
    <div className="bomb-workspace">
      <section className="bomb-instrument" aria-label={t('games.bomb.seconds')}>
        <div className="bomb-dial" style={{'--fuse':`${(isRandom ? 0 : progress)*360}deg`} as React.CSSProperties}>
          <div className="bomb-dial-face"><Bomb strokeWidth={1.2} className="bomb-object"/><strong className="bomb-digits">{isRandom ? '?' : timerSeconds}</strong><span>{t(isRandom ? 'games.bomb.random' : 'games.bomb.seconds')}</span></div>
        </div>
        <div className="bomb-meter" aria-hidden="true">{Array.from({length:20},(_,i)=><span key={i} data-on={!isRandom && progress >= i/20}/>)}</div>
        <div className="bomb-roster">{state.players.map((p,i)=><span key={i} data-active={i === state.currentPlayerIndex}>{p.name}<small>{p.penalties}</small></span>)}</div>
      </section>
      <fieldset className="bomb-controls min-w-0 border-0 p-0 m-0 disabled:opacity-60" disabled={!canPlay}>
        <StagePanel tone="paper" className="bomb-task"><span className="bomb-task-label">{t('games.bomb.theChallenge')}</span><h2>{state.currentTask}</h2></StagePanel>
        {state.mode === 'quiz' && state.currentQuiz ? <><div className="bomb-answers">{state.currentQuiz.answers.map((ans,idx)=><button key={idx} onClick={()=>onQuizAnswer(idx)}><span>{String.fromCharCode(65+idx)}</span><strong>{ans}</strong></button>)}</div><p className="bomb-note">{t('games.bomb.wrongAnswerHint')}</p></> :
        state.mode === 'alle' && onAlleAnswer ? <><p className="bomb-note">{t('games.bomb.noRepeat')}</p><div className="bomb-action-pair"><StageAction onClick={()=>onAlleAnswer(true)}><CheckCircle2 size={20}/>{t('games.bomb.btnDone')}</StageAction><StageAction variant="danger" onClick={()=>onAlleAnswer(false)}><XCircle size={20}/>{t('games.bomb.btnDontKnow')}</StageAction></div></> : <StageAction className="bomb-pass" onClick={onWeiter}>{t('games.bomb.btnSolved')}<ArrowRight size={24}/></StageAction>}
      </fieldset>
    </div>
  </GameStage>;
}
