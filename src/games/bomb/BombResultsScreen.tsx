import { useTranslation } from 'react-i18next';
import { RotateCcw, ArrowRight, Share2, ShieldCheck } from 'lucide-react';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { hasShellBackButton } from '../ui/shell-back';
import type { GameState } from './BombGame';
import './bomb-console.css';
function Standings({state}:{state:GameState}) {
  const {t}=useTranslation();
  const sorted=[...state.players].sort((a,b)=>a.penalties-b.penalties);
  return <div className="bomb-ledger">{sorted.map((p,i)=><div key={i} className="bomb-ledger-row" data-winner={p.penalties===sorted[0]?.penalties}>
    <span>{String(sorted.findIndex(other=>other.penalties===p.penalties)+1).padStart(2,'0')}</span><strong>{p.name}</strong><span>{p.penalties===0?<ShieldCheck size={20}/>:p.penalties}<small>{t(p.penalties===0?'games.bomb.safe':'games.bomb.hits')}</small></span>
  </div>)}</div>;
}
export function BombRoundEndScreen({state,onNext}:{state:GameState;onNext:()=>void}) {
  const {t}=useTranslation();
  return <GameStage gameId="bomb" className="bomb-console"><StageHeader title={t('games.bomb.interimStandings')} eyebrow={t('games.bomb.name')} progress={{value:state.round,total:state.totalRounds}}/>
    <StagePanel className="bomb-report"><Standings state={state}/><StageFooter><StageAction onClick={onNext}>{t('games.bomb.startRound',{round:state.round+1})}<ArrowRight size={20}/></StageAction></StageFooter></StagePanel>
  </GameStage>;
}
export default function BombResultsScreen({state,onRestart,onExit}:{state:GameState;onRestart:()=>void;onExit:()=>void}) {
  const {t}=useTranslation();
  const sorted=[...state.players].sort((a,b)=>a.penalties-b.penalties);
  const winners=sorted.filter(p=>p.penalties===sorted[0]?.penalties).map(p=>p.name).join(' / ');
  const share=()=>{const title=t('games.bomb.name');const text=sorted.map(p=>`${p.name}: ${p.penalties} ${t('games.bomb.hits')}`).join('\n');if(navigator.share)void navigator.share({title,text});else void navigator.clipboard?.writeText(text);};
  return <GameStage gameId="bomb" className="bomb-console"><StageHeader title={t('games.bomb.congrats')} eyebrow={t('games.bomb.name')} subtitle={winners}/>
    <div className="bomb-report"><div className="bomb-report-facts"><div><strong>{state.totalRounds}</strong><span>{t('games.bomb.roundsPlayed')}</span></div><div><strong>{state.players.length}</strong><span>{t('games.bomb.players')}</span></div><div><ShieldCheck size={26}/><span>{t('games.bomb.fewestPenalties')}</span></div></div>
    <Standings state={state}/><StageFooter><StageAction onClick={onRestart}><RotateCcw size={19}/>{t('games.results.playAgain')}</StageAction>{!hasShellBackButton()&&<StageAction variant="secondary" onClick={onExit}>{t('games.results.otherGame')}</StageAction>}<StageAction variant="ghost" onClick={share} aria-label={t('common.share')}><Share2 size={20}/></StageAction></StageFooter></div>
  </GameStage>;
}
