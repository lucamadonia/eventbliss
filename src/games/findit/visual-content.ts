export const OBJECT_ATLAS = '/images/games/findit/objects-atlas-v1.png';
export const OBJECT_IDS = ['apple','banana','pear','orange','strawberry','lemon','mug','book','key','camera','teddy','car','shoe','ball','plant','umbrella'] as const;
export type ObjectId = typeof OBJECT_IDS[number];
export interface VisualQuestion { q: string; options: string[]; correct: number; position?: number }
export interface VisualScene { name: string; grid: string; questions: VisualQuestion[] }
export interface VisualDiffScene { name: string; gridA: string; gridB: string; diffs: number[]; count: number }
function shuffled<T>(values: readonly T[], rng:()=>number): T[] {
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function objectGrid(ids:readonly string[]):string { return Array.from({length:Math.ceil(ids.length/3)},(_,i)=>ids.slice(i*3,i*3+3).join(' ')).join('\n'); }
export function parseObjectGrid(grid:string):string[][] { return grid.trim() ? grid.trim().split('\n').map(row=>row.trim().split(/\s+/)) : []; }
function question(q:string, answer:string, distractors:string[], rng:()=>number, position?:number):VisualQuestion {
  const options=shuffled([answer,...distractors.slice(0,3)],rng);
  return {q,options,correct:options.indexOf(answer),...(position!==undefined?{position}: {})};
}
/** Every question is derived from this exact board, never from imagined scene details. */
export function createVisualScene(rng:()=>number=Math.random):VisualScene {
  const pool=shuffled(OBJECT_IDS,rng), board=pool.slice(0,9), absent=pool.slice(9);
  const position=Math.floor(rng()*board.length);
  const present=board[Math.floor(rng()*board.length)];
  return {name:'games.findit.visual.boardTitle',grid:objectGrid(board),questions:shuffled([
    question('games.findit.visual.whichPresent',present,shuffled(absent,rng),rng),
    question('games.findit.visual.whichMissing',absent[0],shuffled(board,rng),rng),
    question('games.findit.visual.whichPosition',board[position],shuffled(board.filter(id=>id!==board[position]),rng),rng,position+1),
  ],rng)};
}
/** Six readable cards per comparison board, exactly three unique replacements. */
export function createVisualDifference(rng:()=>number=Math.random):VisualDiffScene {
  const pool=shuffled(OBJECT_IDS,rng), a=pool.slice(0,6), b=[...a];
  const diffs=shuffled([0,1,2,3,4,5],rng).slice(0,3).sort((x,y)=>x-y);
  diffs.forEach((index,i)=>{b[index]=pool[6+i];});
  return {name:'games.findit.visual.boardTitle',gridA:objectGrid(a),gridB:objectGrid(b),diffs,count:3};
}
export function projectVisualState<T extends {mode:string;phase:string;questionIdx:number;currentScene:VisualScene|null;currentDiff:VisualDiffScene|null}>(state:T):T {
  const reveal=state.phase==='answer'||state.phase==='roundEnd'||state.phase==='gameOver';
  return {...state,currentScene:state.currentScene?{...state.currentScene,
    grid:state.mode==='memory'&&state.phase!=='study'&&state.phase!=='roundEnd'&&state.phase!=='gameOver'?'':state.currentScene.grid,
    questions:state.currentScene.questions.map((q,i)=>({...q,correct:reveal&&i===state.questionIdx?q.correct:-1})),
  }:null,currentDiff:state.currentDiff?{...state.currentDiff,diffs:reveal?state.currentDiff.diffs:[]}:null};
}
