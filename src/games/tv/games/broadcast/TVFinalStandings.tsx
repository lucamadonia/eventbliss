import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import { tvPanel, tvType } from '../../tv-tokens';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import TVBurst from '../../cinema/TVBurst';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { lu } from '../../components/tv-lobby-scale';

export interface StandingPlayer { id?: string; name: string; avatar?: string; color?: string; score: number }

const GOLD = '#FFD23F';
const STEP = [{ h: 22, tone: GOLD }, { h: 16, tone: '#d7dde8' }, { h: 12, tone: '#e8a46a' }];

/**
 * Endstand als Podest: Platz 2 · 1 · 3 nebeneinander, Sieger mit Glow und
 * Funkenregen (hinter einem dunklen Hof, damit nie Konfetti ueber Schrift fliegt),
 * alle weiteren als ruhige Reihe darunter. Die Fanfare kommt vom Cue der Phase.
 */
export default function TVFinalStandings({ players, title, accent = '#df8eff', unit }: {
  players: StandingPlayer[]; title?: string; accent?: string; unit?: string;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ranked = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const podium = [ranked[1], ranked[0], ranked[2]];
  const rest = ranked.slice(3);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-[4vh] px-[5vw] pb-[5vh] pt-[14vh]">
      <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[GOLD, accent, '#8ff5ff', '#ffffff']} count={60} delay={0.9} /></div>
      <motion.h1 className="relative z-10 rounded-[50%] px-[6vw] py-[1.5vh] text-center font-black"
        style={{ fontSize: tvType.display, color: '#f1f3fc', background: 'radial-gradient(ellipse closest-side, #060810 60%, transparent 100%)' }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out }}>
        {title ?? t('tvCinema.finalStandings', 'Endstand')}
      </motion.h1>
      <div className="relative z-10 flex items-end justify-center gap-[2.5vw]">
        {podium.map((p, col) => {
          if (!p) return <div key={col} style={{ width: lu(26) }} />;
          const place = col === 1 ? 0 : col === 0 ? 1 : 2;
          const step = STEP[place];
          return (
            <motion.div key={p.id ?? p.name} className="flex flex-col items-center gap-3" style={{ width: lu(26) }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: partyEase.out, delay: 0.25 + (2 - place) * 0.22 }}>
              {place === 0 && <span aria-hidden style={{ fontSize: lu(5) }}>👑</span>}
              <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={place === 0 ? lu(13) : lu(10)} active={place === 0} />
              <span className="max-w-full truncate font-black" style={{ fontSize: tvType.body, color: '#f1f3fc' }}>{p.name}</span>
              <div className={`${tvPanel} flex w-full flex-col items-center justify-start pt-[1.6vh]`}
                style={{ height: `${step.h}vh`, borderColor: `${step.tone}55`, background: `linear-gradient(180deg, ${step.tone}26, #0d0915 70%)` }}>
                <span className="grid place-items-center rounded-full font-black tabular-nums leading-none" style={{ width: lu(5), height: lu(5), fontSize: lu(2.8), color: '#060810', background: step.tone }}>{place + 1}</span>
                <span className="mt-2 font-black tabular-nums" style={{ fontSize: tvType.title, color: '#f1f3fc' }}>
                  {p.score}{unit ? ` ${unit}` : ''}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <motion.div className="relative z-10 flex flex-wrap justify-center gap-3" variants={staggerChildren(70)} initial="initial" animate="animate">
          {rest.map((p, i) => (
            <motion.div key={p.id ?? p.name} variants={riseIn(reduced)} className={`${tvPanel} flex items-center gap-3 px-4 py-2`}>
              <span className="font-black tabular-nums" style={{ fontSize: tvType.label, color: '#a8abb3' }}>{i + 4}</span>
              <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(5)} />
              <span className="font-bold" style={{ fontSize: tvType.body, color: '#f1f3fc' }}>{p.name}</span>
              <span className="font-black tabular-nums" style={{ fontSize: tvType.body, color: '#f1f3fc' }}>{p.score}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
