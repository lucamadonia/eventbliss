import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Swords, Headphones, Mic } from 'lucide-react';
import { partyEase } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';

export const OW = { primary: '#FF2E88', secondary: '#26E0C4', accent: '#FFD23F', urgent: '#ff5d73', text: '#F7F2E9', dim: '#b3a8c9', bg: '#0d0915' };

export interface OhrwurmReveal { year: number; title: string; artist: string; flag?: string; genre?: string }

/**
 * Heldenzone von Ohrwurm: Uhr waehrend des Hoerens, Konter-Aufruf, Aufloesung.
 * Jede Stufe hat ihren eigenen Ein-/Austritt; die Szene drumherum bleibt stehen.
 * `reveal` ist nur in der Aufloesung gesetzt — vorher gibt es hier keinen Titel.
 */
export function OhrwurmHero({ phase, listening, timeLeft, totalTime, reveal, bonusPending, activeName }: {
  phase: string; listening: boolean; timeLeft: number; totalTime: number;
  reveal: OhrwurmReveal | null; bonusPending: boolean; activeName: string;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  const progress = Math.max(0, Math.min(1, totalTime > 0 ? timeLeft / totalTime : 0));
  const urgent = listening && timeLeft <= 10;
  const mode = reveal ? 'reveal' : phase === 'counter' || phase === 'counterPlace' ? 'counter' : listening ? 'listen' : 'ready';
  const enter = reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 };
  const exit = { opacity: 0, scale: 0.98, transition: { duration: 0.22, ease: partyEase.exit } };

  return (
    <div className="relative flex min-h-0 flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {mode === 'reveal' && reveal ? (
          <motion.div key="reveal" data-testid="tv-ohrwurm-reveal" className="relative flex flex-col items-center gap-[1.6vh] text-center"
            initial={enter} animate={{ opacity: 1, y: 0, scale: 1 }} exit={exit} transition={{ duration: 0.5, ease: partyEase.out }}>
            {/* Lichtkegel hinter dem Jahr — statisch, nur Deckkraft. */}
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: `radial-gradient(circle, ${OW.primary}2e 0%, transparent 65%)` }} />
            {bonusPending && (
              <motion.div className="flex items-center gap-[0.6vw] rounded-full px-[1.4vw] py-[0.9vh]"
                style={{ background: `${OW.accent}1f`, border: `2px solid ${OW.accent}`, boxShadow: `0 0 36px -6px ${OW.accent}` }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: partyEase.out }}>
                <Mic aria-hidden style={{ width: lu(2.6), height: lu(2.6), color: OW.accent }} />
                <span className="font-bold" style={{ fontSize: tvType.body, color: OW.text }}>
                  {t('tv.ohrwurm.bonusCheck', { name: activeName, defaultValue: 'Bonus: {{name}} — Titel + Interpret richtig?' })}
                </span>
              </motion.div>
            )}
            <span className="font-semibold" style={{ fontSize: tvType.label, color: OW.dim }}>{t('tv.ohrwurm.releaseYear', 'Erscheinungsjahr')}</span>
            <motion.span className="font-black tabular-nums leading-none" style={{ fontSize: tvType.hero, color: OW.primary, textShadow: `0 0 60px ${OW.primary}66` }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }}
              transition={reduced ? { duration: 0.2 } : { type: 'spring', duration: 0.7, bounce: 0.35, delay: 0.1 }}>
              {reveal.year}
            </motion.span>
            <motion.h2 className="max-w-[22ch] font-black leading-tight" style={{ fontSize: tvType.display, color: '#fff' }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out, delay: 0.35 }}>
              {reveal.title}
            </motion.h2>
            <motion.p className="font-semibold" style={{ fontSize: tvType.title, color: OW.text }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.55 }}>
              {reveal.artist} {reveal.flag || ''}
            </motion.p>
            {reveal.genre && (
              <motion.span className="rounded-full px-[1.2vw] py-[0.6vh] font-bold" style={{ fontSize: tvType.label, color: OW.accent, border: `1px solid ${OW.accent}66`, background: `${OW.accent}14` }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.7 }}>
                {reveal.genre}
              </motion.span>
            )}
          </motion.div>
        ) : mode === 'counter' ? (
          <motion.div key="counter" className="flex flex-col items-center gap-[2.4vh] text-center"
            initial={enter} animate={{ opacity: 1, y: 0, scale: 1 }} exit={exit} transition={{ duration: 0.5, ease: partyEase.out }}>
            <motion.div className="grid place-items-center rounded-full" style={{ width: lu(16), height: lu(16), background: `${OW.accent}1a`, border: `2px solid ${OW.accent}88`, boxShadow: `0 0 50px -10px ${OW.accent}` }}
              animate={ambient ? { scale: [1, 1.05, 1] } : { scale: 1 }} transition={ambient ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } : { duration: 0.3 }}>
              <Swords aria-hidden style={{ width: lu(8), height: lu(8), color: OW.accent }} />
            </motion.div>
            <h2 className="font-black" style={{ fontSize: tvType.display, color: OW.text }}>{t('tvCinema.ohrwurm.counter', 'Konter-Chance')}</h2>
            <p className="max-w-[30ch] font-semibold" style={{ fontSize: tvType.body, color: OW.dim }}>
              {activeName
                ? t('tvCinema.ohrwurm.counterHint', 'Liegt {{name}} falsch? Wer zweifelt, kontert jetzt am Handy.', { name: activeName })
                : t('tvCinema.ohrwurm.counterSubAnon', 'Liegt die Einordnung falsch? Jetzt kontern!')}
            </p>
          </motion.div>
        ) : mode === 'listen' ? (
          <motion.div key="listen" className="flex flex-col items-center gap-[3vh] text-center"
            initial={enter} animate={{ opacity: 1, y: 0, scale: 1 }} exit={exit} transition={{ duration: 0.5, ease: partyEase.out }}>
            <span className="flex items-center gap-[0.6vw] font-semibold" style={{ fontSize: tvType.body, color: OW.text }}>
              <motion.span aria-hidden className="rounded-full" style={{ width: '0.6em', height: '0.6em', background: OW.primary }}
                animate={ambient ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }} transition={ambient ? { repeat: Infinity, duration: 1.4 } : { duration: 0.2 }} />
              {t('tv.ohrwurm.mysteryRunning', 'Mystery-Song läuft')}
            </span>
            <motion.div key={urgent ? 'urgent' : 'calm'} className="font-black tabular-nums leading-none"
              style={{ fontSize: tvType.hero, color: urgent ? OW.urgent : OW.text, textShadow: urgent ? `0 0 50px ${OW.urgent}88` : 'none' }}
              animate={urgent && !reduced ? { scale: [1, 1.06, 1] } : { scale: 1 }} transition={urgent && !reduced ? { repeat: Infinity, duration: 1 } : { duration: 0.2 }}>
              {timeLeft}
            </motion.div>
            {/* Restzeit — scaleX (Compositor) */}
            <div className="overflow-hidden rounded-full" style={{ width: 'min(40vw, 640px)', height: lu(1.2), background: 'rgba(255,255,255,0.08)' }}>
              <motion.div className="h-full w-full origin-left rounded-full"
                style={{ background: progress > 0.5 ? OW.secondary : progress > 0.16 ? OW.accent : OW.urgent }}
                animate={{ scaleX: progress }} transition={{ duration: 0.3 }} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="ready" className="flex flex-col items-center gap-[2.4vh] text-center"
            initial={enter} animate={{ opacity: 1, y: 0, scale: 1 }} exit={exit} transition={{ duration: 0.5, ease: partyEase.out }}>
            <Headphones aria-hidden style={{ width: lu(14), height: lu(14), color: OW.secondary }} />
            <span className="font-black" style={{ fontSize: tvType.title, color: OW.text }}>{t('tvCinema.ohrwurm.ready', 'Gleich geht’s los')}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
