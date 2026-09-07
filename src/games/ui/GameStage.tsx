import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MotionConfig } from 'framer-motion';
import './game-stage.css';

export interface GameTheme { background: string; surface: string; accent: string; secondary: string; }
const themes: Record<string, GameTheme> = {
  bomb: { background: '#101410', surface: '#1d261e', accent: '#dbf78c', secondary: '#ffab76' },
  headup: { background: '#101613', surface: '#1b2822', accent: '#d7ef87', secondary: '#94d5bb' },
  taboo: { background: '#191314', surface: '#2a1c20', accent: '#ff9b88', secondary: '#f5d3a8' },
  category: { background: '#151710', surface: '#25291b', accent: '#e6ce81', secondary: '#b9d8aa' },
  hochstapler: { background: '#151514', surface: '#282623', accent: '#edc57e', secondary: '#b2c6c1' },
  'drueck-das-wort': { background: '#121614', surface: '#202923', accent: '#d3f786', secondary: '#b2d8ce' },
  'wo-ist-was': { background: '#101919', surface: '#1c2c2a', accent: '#a8d9bd', secondary: '#edce91' },
  'split-quiz': { background: '#131922', surface: '#202d3c', accent: '#a3d6ee', secondary: '#f2b792' },
  'geteilt-gequizzt': { background: '#131b20', surface: '#203039', accent: '#a4dbe1', secondary: '#efc18c' },
  schnellzeichner: { background: '#181a1c', surface: '#282d31', accent: '#e5cea1', secondary: '#91cbbb' },
  'wahrheit-pflicht': { background: '#1c151c', surface: '#302331', accent: '#f3ac9a', secondary: '#a5d8d0' },
  'this-or-that': { background: '#151c20', surface: '#253037', accent: '#edb095', secondary: '#a4d5c0' },
  'wer-bin-ich': { background: '#1b1720', surface: '#2c2436', accent: '#f0b5a7', secondary: '#c1b7e0' },
  'emoji-raten': { background: '#1b1a15', surface: '#2c2a20', accent: '#f4d477', secondary: '#a9cfcd' },
  'fake-or-fact': { background: '#111c20', surface: '#1d2e36', accent: '#aedce4', secondary: '#edcfaa' },
  'story-builder': { background: '#181e1d', surface: '#26332f', accent: '#e8d6b5', secondary: '#a7cbbf' },
  flaschendrehen: { background: '#131c19', surface: '#24372e', accent: '#b5d7a8', secondary: '#e0c198' },
  ohrwurm: { background: '#171022', surface: '#281d35', accent: '#f2a3d2', secondary: '#a7dedd' },
  closeenough: { background: '#101322', surface: '#22283e', accent: '#c5b6f1', secondary: '#a2dee7' },
  pixeljagd: { background: '#101b23', surface: '#1c3040', accent: '#8ed5f2', secondary: '#f3d889' },
  pantomime: { background: '#1e151c', surface: '#332431', accent: '#edb1cf', secondary: '#e3cd9e' },
  brew: { background: '#171220', surface: '#2b2136', accent: '#dbb3ed', secondary: '#a7ddd8' },
};
const aliases: Record<string, string> = { impostor:'hochstapler', wordpress:'drueck-das-wort', findit:'wo-ist-was', splitquiz:'split-quiz', sharedquiz:'geteilt-gequizzt', quickdraw:'schnellzeichner', truthdare:'wahrheit-pflicht', thisorthat:'this-or-that', whoami:'wer-bin-ich', emojiguess:'emoji-raten', fakeorfact:'fake-or-fact', storybuilder:'story-builder', bottlespin:'flaschendrehen' };
export function getGameTheme(id: string): GameTheme { return themes[aliases[id] ?? id] ?? themes.closeenough; }
export function gameStageStyle(id: string): CSSProperties {
  const theme=getGameTheme(id);
  return { '--stage-bg':theme.background,'--stage-surface':theme.surface,'--stage-accent':theme.accent,'--stage-secondary':theme.secondary,'--stage-ink':'#f5f2e9','--stage-muted':'#b5bdbe' } as CSSProperties;
}

/** Presentation only. Game ownership, clocks and private state stay in each game. */
export function GameStage({gameId,children,className,style,...props}:HTMLAttributes<HTMLDivElement>&{gameId:string}) {
  return <MotionConfig reducedMotion="user"><div {...props} data-game-stage={aliases[gameId]??gameId} className={cn('game-stage',className)} style={{...gameStageStyle(gameId),...style}}>{children}</div></MotionConfig>;
}
export function StageHeader({title,eyebrow,subtitle,leading,trailing,progress,className}:{title:ReactNode;eyebrow?:ReactNode;subtitle?:ReactNode;leading?:ReactNode;trailing?:ReactNode;progress?:{value:number;total:number};className?:string}) {
  return <header className={cn('stage-header',className)}>
    {(leading||trailing)&&<div className="stage-header-tools"><div>{leading}</div><div>{trailing}</div></div>}
    {eyebrow&&<p className="stage-eyebrow">{eyebrow}</p>}
    <h1 className="stage-title">{title}</h1>
    {subtitle&&<div className="stage-subtitle">{subtitle}</div>}
    {progress&&<div className="stage-progress" role="progressbar" aria-valuemin={0} aria-valuemax={Math.max(1,progress.total)} aria-valuenow={Math.max(0,Math.min(progress.value,progress.total))}><span style={{width:`${Math.max(0,Math.min(100,progress.value/Math.max(1,progress.total)*100))}%`}} /></div>}
  </header>;
}
export function StagePanel({tone='solid',className,...props}:HTMLAttributes<HTMLDivElement>&{tone?:'solid'|'paper'|'quiet'|'accent'}) {
  return <div {...props} className={cn('stage-panel',`stage-panel--${tone}`,className)} />;
}
export function StageAction({variant='primary',className,type='button',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'danger'|'ghost'}) {
  return <button {...props} type={type} className={cn('stage-action',`stage-action--${variant}`,className)} />;
}
export function StageFooter({className,...props}:HTMLAttributes<HTMLDivElement>) { return <div {...props} className={cn('stage-footer',className)} />; }
