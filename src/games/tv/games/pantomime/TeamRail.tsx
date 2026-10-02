import { motion, useReducedMotion } from 'framer-motion';
import { playerGlow } from '@/lib/party-motion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { lu } from '../../components/tv-lobby-scale';
import { tvType } from '../../tv-tokens';
import { TS } from '../turn-stage/kit';

export interface PantomimeMember { id?: string; name: string; avatar?: string; color?: string }
export interface PantomimeTeam { name: string; color: string; score: number; members: PantomimeMember[] }

/**
 * Seitenleiste eines Teams: Name, Punktestand, Mitglieder mit Spieler-Symbol.
 * Das Team am Zug leuchtet in seiner Farbe, der Darsteller bekommt den Ring.
 */
export default function TeamRail({ team, active, actorName, side }: { team: PantomimeTeam; active: boolean; actorName: string; side: 'left' | 'right' }) {
  const reduced = !!useReducedMotion();
  return (
    <motion.div data-testid={`tv-pantomime-team-${side}`}
      className="flex w-full flex-col gap-[2vh] rounded-[28px] px-[1.6vw] py-[3vh]"
      style={{
        background: active ? `linear-gradient(170deg, ${team.color}2e, ${TS.raised} 60%)` : TS.panel,
        boxShadow: active ? playerGlow(team.color, 'active') : 'inset 0 1px 0 rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'background 500ms ease, box-shadow 500ms ease',
      }}
      animate={{ opacity: active ? 1 : 0.78, scale: active ? 1 : 0.96 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3 font-black leading-tight" style={{ fontSize: tvType.body, color: TS.text }}>
          <span aria-hidden className="inline-block rounded-full" style={{ width: lu(1.6), height: lu(1.6), background: team.color, boxShadow: `0 0 12px ${team.color}` }} />
          {team.name}
        </span>
        <motion.span key={team.score} className="font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color: TS.text }}
          initial={reduced ? { opacity: 0 } : { scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}>
          {team.score}
        </motion.span>
      </div>
      <motion.div className="flex flex-col gap-[1.2vh]" variants={staggerChildren(70)} initial="initial" animate="animate">
        {team.members.map((m) => {
          const acting = active && m.name === actorName;
          return (
            <motion.div key={m.id || m.name} variants={riseIn(reduced)} className="flex items-center gap-3">
              <TVPlayerAvatar id={m.id} name={m.name} avatar={m.avatar} color={m.color || team.color} size={lu(5.5)} active={acting} />
              <span className="truncate font-bold" style={{ fontSize: tvType.body, color: acting ? '#fff' : TS.dim }}>{m.name}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
