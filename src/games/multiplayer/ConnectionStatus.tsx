import { Wifi, WifiOff, Users, Loader2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConnectionStatusProps {
  connected:boolean; roomCode:string; playerCount:number; reconnecting?:boolean;
  onPlayersClick?:()=>void; expanded?:boolean;
}
export default function ConnectionStatus({connected,roomCode,playerCount,reconnecting=false,onPlayersClick,expanded=false}:ConnectionStatusProps) {
  const {t}=useTranslation();
  return <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-[var(--stage-bg,#111820)] px-4 text-white font-sans" style={{paddingTop:'env(safe-area-inset-top)'}}>
    <div className="flex min-w-0 items-center gap-2.5">
      {reconnecting?<Loader2 className="h-4 w-4 animate-spin text-amber-200"/>:connected?<Wifi className="h-4 w-4 text-emerald-300"/>:<WifiOff className="h-4 w-4 text-amber-200"/>}
      <span className="text-[10px] font-semibold tracking-wide text-white/60">{connected?t('tv.connected'):reconnecting?t('tv.connecting'):t('games.connectionPaused')}</span>
      <span className="font-mono text-xs font-bold tracking-widest text-[var(--stage-accent,#aad8ce)]">{roomCode}</span>
    </div>
    <button type="button" disabled={!connected} onClick={onPlayersClick} aria-expanded={expanded} aria-controls="online-game-roster" aria-label={t('tv.playersCount',{count:playerCount})} className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-200">
      <Users className="h-4 w-4"/><span>{playerCount}</span><ChevronDown className="h-3 w-3" style={{transform:expanded?'rotate(180deg)':undefined}}/>
    </button>
  </div>;
}
