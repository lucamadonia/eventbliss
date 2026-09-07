import type { ReactNode } from 'react';
import { Check, Eye, MessageCircle, Lightbulb } from 'lucide-react';
import { GameStage, StageHeader, StagePanel } from '../ui/GameStage';
import './knowledge-stage.css';
const ROLE_ICONS = [Eye, MessageCircle, Lightbulb];
export function KnowledgeStage({title, mode, round, total, players, labels, active, completed = 0, children}: {title: string; mode: string; round:number; total:number; players:string[]; labels:string[]; active:number; completed?:number; children:ReactNode}) {
  return <GameStage gameId="geteilt-gequizzt" className="knowledge-stage">
    <StageHeader title={title} eyebrow={mode} progress={{value:round,total}} trailing={<span className="knowledge-round">{String(round).padStart(2,'0')}<small> / {total}</small></span>} />
    <div className="knowledge-layout"><nav className="knowledge-roster" aria-label={title}>
      {players.map((name,i) => { const Icon = ROLE_ICONS[i]; return <div key={i} className="knowledge-role" data-active={i === active} data-complete={i < completed}>
        <span className="knowledge-role-index">{i < completed ? <Check size={18}/> : <Icon size={18}/>}</span>
        <div><span className="knowledge-role-label">{labels[i]}</span><strong>{name}</strong></div><span className="knowledge-role-number">0{i+1}</span>
      </div>; })}
    </nav><main className="knowledge-document"><StagePanel tone="paper" className="knowledge-paper">{children}</StagePanel></main></div>
  </GameStage>;
}
