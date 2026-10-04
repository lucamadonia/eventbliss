import { Wifi, WifiOff, Users, Loader2, ChevronDown, Tv } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { partyMotion } from '@/lib/party-motion';
import { useTranslation } from 'react-i18next';

interface ConnectionStatusProps {
  connected:boolean; roomCode:string; playerCount:number; reconnecting?:boolean;
  onPlayersClick?:()=>void; expanded?:boolean;
  /** Tiny TV status (no code). onOpen only for the host: opens the TV connection sheet. */
  tv?:{ linked:boolean; onOpen?:()=>void };
}

/** 20px TV glyph with a status dot: linked = emerald, not linked = muted. */
function TvStatus({ linked, onOpen }: { linked: boolean; onOpen?: () => void }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const label = linked ? t('partyPlay.tvLinked', 'Fernseher verbunden') : t('partyPlay.tvNotLinked', 'Kein Fernseher verbunden');
  const glyph = <span className="relative inline-grid h-5 w-5 place-items-center">
    <Tv className={`h-4 w-4 ${linked ? 'text-white/80' : 'text-white/35'}`} aria-hidden />
    <motion.span key={String(linked)} variants={partyMotion('checkPop', reduced)} initial="initial" animate="animate" aria-hidden
      className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${linked ? 'bg-emerald-400' : 'bg-white/25'}`} />
  </span>;
  return onOpen
    ? <button type="button" onClick={onOpen} aria-label={label} data-testid="tv-status" data-linked={linked} className="grid min-h-11 min-w-11 place-items-center rounded-lg">{glyph}</button>
    : <span role="img" aria-label={label} data-testid="tv-status" data-linked={linked}>{glyph}</span>;
}
export default function ConnectionStatus({connected,roomCode,playerCount,reconnecting=false,onPlayersClick,expanded=false,tv}:ConnectionStatusProps) {
  const {t}=useTranslation();
  return <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-[var(--stage-bg,#111820)] px-4 text-white font-sans" style={{paddingTop:'env(safe-area-inset-top)'}}>
    <div className="flex min-w-0 items-center gap-2.5">
      {reconnecting?<Loader2 className="h-4 w-4 animate-spin text-amber-200"/>:connected?<Wifi className="h-4 w-4 text-emerald-300"/>:<WifiOff className="h-4 w-4 text-amber-200"/>}
      <span className="text-[10px] font-semibold tracking-wide text-white/60">{connected?t('tv.connected'):reconnecting?t('tv.connecting'):t('games.connectionPaused')}</span>
      <span className="font-mono text-xs font-bold tracking-widest text-[var(--stage-accent,#aad8ce)]">{roomCode}</span>
      {tv && <TvStatus linked={tv.linked} onOpen={tv.onOpen} />}
    </div>
    <button type="button" disabled={!connected} onClick={onPlayersClick} aria-expanded={expanded} aria-controls="online-game-roster" aria-label={t('tv.playersCount',{count:playerCount})} className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-200">
      <Users className="h-4 w-4"/><span>{playerCount}</span><ChevronDown className="h-3 w-3" style={{transform:expanded?'rotate(180deg)':undefined}}/>
    </button>
  </div>;
}
