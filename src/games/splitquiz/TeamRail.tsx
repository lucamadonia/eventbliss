import './quiz-arena.css';
export function TeamRail({teams,active,round,total}:{teams:{name:string;score:number;players:string[]}[];active:number;round:number;total:number}) {
  return <header className="arena-rail">{teams.map((team,i)=><section key={i} data-active={i===active} data-team={i}><span className="arena-team-index">{i===0?'A':'B'}</span><div className="arena-team-title"><strong>{team.name}</strong><span>{team.players.join(' / ')}</span></div><b>{team.score}</b></section>)}<div className="arena-round">{String(round).padStart(2,'0')}<span> / {total}</span></div></header>;
}
