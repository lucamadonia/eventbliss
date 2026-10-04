import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase, readableOn } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { lu } from '../../components/tv-lobby-scale';
import { tvType } from '../../tv-tokens';
import { BB, emojiOnly, type BombPlayer } from './bomb-tv';

/**
 * Laufende Bombe — EINE durchgehende Szene: Halter, Zuendschnur-Ring und
 * Aufgabe wechseln innerhalb der Szene (kein Neu-Einhaengen pro Sekunde).
 * Hitze = Deckkraft/Skalierung, nie Unschaerfe-Schleifen.
 */
export default function BombFuseScene({ holder, holderId, holderColor, task, progress, timeLeft, randomTimer }: {
  holder: BombPlayer | undefined;
  holderId: string;
  holderColor: string;
  task: string;
  progress: number;
  timeLeft: number;
  randomTimer: boolean;
}) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const pulse = Math.max(0.18, 1.2 - progress * 1.05);
  const hot = progress > 0.7;
  const ringColor = hot ? BB.danger : progress > 0.4 ? BB.warn : BB.primary;
  const R = 130;
  const C = 2 * Math.PI * R;
  const ringSize = 'min(38vh, 30vw)';
  const showTime = !randomTimer && timeLeft >= 0;

  return (
    <div className="relative flex w-full flex-col items-center" style={{ gap: lu(2.4) }}>
      {/* Wer haelt die Bombe — Avatar mit Schein, Name in Weiss */}
      <AnimatePresence mode="wait">
        <motion.div key={holderId} className="flex items-center" style={{ gap: lu(2.4) }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 60, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: -60, scale: 0.9, transition: { duration: 0.22, ease: partyEase.exit } }}
          transition={{ duration: 0.45, ease: partyEase.out }}>
          <TVPlayerAvatar id={holder?.id} name={holder?.name || '?'} avatar={emojiOnly(holder?.avatar)} color={holderColor} size={lu(10)} active />
          <div className="flex flex-col items-start">
            <span className="font-semibold" style={{ fontSize: tvType.label, color: BB.dim }}>{t('tvCinema.bomb.holds', 'hat die Bombe')}</span>
            <span className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff', textShadow: `0 0 40px ${holderColor}66` }}>{holder?.name || ''}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bombe + Zuendschnur-Ring */}
      <div className="relative grid place-items-center rounded-full" style={{ width: ringSize, height: ringSize, boxShadow: `0 0 60px -18px ${ringColor}, inset 0 0 50px -20px ${ringColor}` }}>
        {ambient && [0, 1].map((i) => (
          <motion.span key={i} aria-hidden className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${ringColor}`, opacity: 0 }}
            animate={{ scale: [1, 1.22 + i * 0.12], opacity: [0.35 + progress * 0.3, 0] }}
            transition={{ repeat: Infinity, duration: pulse * 1.4, delay: i * pulse * 0.5, ease: 'easeOut' }} />
        ))}
        <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          <motion.circle cx="150" cy="150" r={R} fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={C} animate={{ strokeDashoffset: randomTimer ? 0 : C * (1 - progress) }}
            transition={{ duration: 0.4, ease: partyEase.out }}
            style={{ opacity: randomTimer ? 0.35 : 1 }} />
        </svg>
        <motion.div className="relative grid place-items-center"
          animate={ambient ? { scale: [1, 1 + 0.03 + progress * 0.06, 1] } : { scale: 1 }}
          transition={ambient ? { repeat: Infinity, duration: pulse, ease: 'easeInOut' } : { duration: 0.3 }}>
          {/* Hitze-Schein: feste Schattenweite, nur die Deckkraft steigt */}
          <span aria-hidden className="absolute rounded-full" style={{ width: '120%', height: '120%', background: `radial-gradient(circle, ${BB.primary}55 0%, transparent 65%)`, opacity: 0.25 + progress * 0.75 }} />
          <span className="relative select-none leading-none" style={{ fontSize: 'min(17vh, 13vw)' }} aria-hidden>💣</span>
          <motion.span aria-hidden className="absolute rounded-full"
            style={{ width: lu(1.6), height: lu(1.6), top: '2%', right: '12%', background: BB.spark, boxShadow: `0 0 14px ${BB.spark}, 0 0 28px ${BB.spark}99` }}
            animate={ambient ? { opacity: [1, 0.35, 1], scale: [1, 1.6, 1] } : { opacity: 1 }}
            transition={ambient ? { repeat: Infinity, duration: pulse * 0.5 } : { duration: 0.3 }} />
        </motion.div>
        {/* Restzeit unten im Ring (oder „?“ beim Zufallstimer) */}
        <AnimatePresence mode="popLayout">
          <motion.span key={showTime ? timeLeft : 'hidden'}
            className="absolute rounded-full px-5 font-black tabular-nums leading-tight"
            style={{ bottom: '-2%', fontSize: tvType.title, color: readableOn(ringColor), background: ringColor, boxShadow: `0 0 30px ${ringColor}88` }}
            initial={reduced ? { opacity: 0 } : { scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.25, ease: partyEase.out }}>
            {showTime ? timeLeft : '?'}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Aufgabe — oeffentlich, alle sollen mitraten */}
      <div className="flex min-h-[1.3em] items-center justify-center px-[5vw]" style={{ fontSize: tvType.title }}>
        <AnimatePresence mode="wait">
          {task ? (
            <motion.p key={task} className="max-w-[28ch] text-center font-bold leading-tight" style={{ color: BB.text }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.18 } }} transition={{ duration: 0.4, ease: partyEase.out }}>
              {task}
            </motion.p>
          ) : (
            <motion.span key="waiting" className="font-semibold" style={{ fontSize: tvType.body, color: BB.dim }}
              animate={ambient ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.8 }} transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
              {t('tv.bomb.waiting', 'Warte auf Aufgabe...')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
