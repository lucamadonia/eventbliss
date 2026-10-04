import { motion, useReducedMotion } from 'framer-motion';
import { partyEase, playerGlow } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { lu } from '../../components/tv-lobby-scale';
import { tvPanel, tvPanelRaised, tvType } from '../../tv-tokens';
import { TB, memberKey, type TabooMember } from './taboo-tv';

/**
 * Eine Team-Seite der Tabu-Buehne: Name, Punktestand, alle Mitglieder als
 * Avatare. Das aktive Team leuchtet in seiner Farbe, das andere tritt zurueck.
 * Der Erklaerer bekommt den Mikrofon-Marker am Avatar.
 */
export default function TabooTeamPanel({ name, score, color, members, active, explainerName, side }: {
  name: string; score: number; color: string; members: TabooMember[]; active: boolean; explainerName: string; side: 'left' | 'right';
}) {
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  return (
    <motion.div
      className={`relative flex min-w-0 flex-col items-center justify-center ${active ? tvPanelRaised : tvPanel}`}
      style={{ minHeight: '56vh', gap: lu(2), padding: `${lu(3)} ${lu(2.4)}`, boxShadow: active ? playerGlow(color, 'active') : undefined }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: side === 'left' ? -60 : 60 }}
      animate={{ opacity: active ? 1 : 0.55, x: 0, scale: active ? 1 : 0.96 }}
      transition={{ duration: 0.5, ease: partyEase.out }}>
      {active && ambient && (
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px]"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${color}26, transparent 70%)` }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }} />
      )}
      <div className="relative flex items-center gap-3">
        <span aria-hidden className="rounded-full" style={{ width: lu(1.6), height: lu(1.6), background: color, boxShadow: `0 0 14px ${color}` }} />
        <h2 className="font-black" style={{ fontSize: tvType.title, color: '#fff' }}>{name}</h2>
      </div>
      <motion.span key={score} className="relative font-black leading-none tabular-nums"
        style={{ fontSize: tvType.hero, color: '#fff', textShadow: active ? `0 0 50px ${color}aa` : 'none' }}
        initial={reduced ? { opacity: 0.5 } : { scale: 1.25 }} animate={reduced ? { opacity: 1 } : { scale: 1 }} transition={{ duration: 0.4, ease: partyEase.out }}>
        {score}
      </motion.span>
      <motion.div className="relative flex flex-wrap justify-center" style={{ gap: `${lu(1.6)} ${lu(2.2)}` }} variants={staggerChildren(60)} initial="initial" animate="animate">
        {members.map((m, i) => {
          const explains = active && !!explainerName && m.name === explainerName;
          return (
            <motion.div key={memberKey(m, i)} variants={riseIn(reduced)} className="flex flex-col items-center" style={{ gap: lu(0.8), maxWidth: lu(14) }}>
              <span className="relative">
                <TVPlayerAvatar id={m.id} name={m.name} avatar={m.avatar} color={m.color} size={members.length > 4 ? lu(5.6) : lu(7)} active={explains} />
                {explains && (
                  <span aria-hidden className="absolute -bottom-1 -right-1 grid place-items-center rounded-full"
                    style={{ width: lu(3.4), height: lu(3.4), fontSize: lu(1.9), background: '#16101f', boxShadow: playerGlow(color, 'active') }}>🎤</span>
                )}
              </span>
              <span className="max-w-full truncate font-bold" style={{ fontSize: tvType.body, color: explains ? '#fff' : TB.text }}>{m.name}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
