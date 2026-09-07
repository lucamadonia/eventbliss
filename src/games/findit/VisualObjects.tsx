import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OBJECT_ATLAS, OBJECT_IDS } from './visual-content';
import './visual-objects.css';
export function ObjectPicture({id,className='',label}:{id:string;className?:string;label?:string}) {
  const index=OBJECT_IDS.indexOf(id as typeof OBJECT_IDS[number]);
  if(index<0)return null;
  const style={backgroundImage:`url(${OBJECT_ATLAS})`,backgroundPosition:`${(index%4)*100/3}% ${Math.floor(index/4)*100/3}%`} as CSSProperties;
  return <span role="img" aria-label={label??id} className={`findit-object-picture ${className}`} style={style}/>;
}
export function ObjectBoard({grid,label,found=[],targets=[],onTap,disabled=false,compact=false}:{grid:string[][];label?:string;found?:number[];targets?:number[];onTap?:(index:number)=>void;disabled?:boolean;compact?:boolean}) {
  const {t}=useTranslation();
  return <section className={`findit-object-board ${compact?'findit-object-board--compact':''}`} aria-label={label??t('games.findit.visual.boardTitle')}>
    {label&&<h3>{label}</h3>}<div className="findit-object-grid">{grid.flat().map((id,index)=>{
      const name=t(`games.findit.objects.${id}`),caption=t('games.findit.visual.card',{position:index+1,object:name});
      const content=<><ObjectPicture id={id} label={name}/><span className="findit-card-index">{index+1}</span>{found.includes(index)&&<Check className="findit-card-check" size={20}/>}</>;
      const className='findit-object-card';
      return onTap?<button key={index} type="button" className={className} aria-label={caption} aria-pressed={found.includes(index)} disabled={disabled||found.includes(index)} onClick={()=>onTap(index)} data-found={found.includes(index)} data-target={targets.includes(index)}>{content}</button>:<div key={index} className={className} aria-label={caption} data-found={found.includes(index)} data-target={targets.includes(index)}>{content}</div>;
    })}</div>
  </section>;
}
