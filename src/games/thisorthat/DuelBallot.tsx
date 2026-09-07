import { Check, ArrowUpRight } from 'lucide-react';
import './duel-ballot.css';
export function DuelBallot({a,b,choose,locked,selected,label}: {a:string;b:string;choose:(choice:'A'|'B')=>void;locked:boolean;selected?:'A'|'B';label:string}) {
  return <div className="duel-ballot">{(['A','B'] as const).map((side,i)=><button key={side} className="duel-option" data-side={side} data-selected={selected===side} disabled={locked} onClick={()=>choose(side)} aria-label={`${label}: ${i===0?a:b}`}>
    <span className="duel-index">{side}</span><h3>{i===0?a:b}</h3><span className="duel-confirm">{selected===side ? <Check size={22}/> : <ArrowUpRight size={22}/>}<span>{label}</span></span>
  </button>)}<span className="duel-divider" aria-hidden="true">/</span></div>;
}
