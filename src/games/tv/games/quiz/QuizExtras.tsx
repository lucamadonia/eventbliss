import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';
import { partyEase } from '@/lib/party-motion';
import { tvPanel, tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { QZ, type QuizPlayer } from './quiz-model';

/** Fakt oder Fake: Erklaerung + Anteil „richtig getippt“ (nur in der Aufloesung). */
export function FakeOrFactReveal({ explanation, correctPct, votesCount }: { explanation: string; correctPct: number; votesCount: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const pct = Math.max(0, Math.min(100, Math.round(correctPct)));
  return (
    <motion.div className="flex w-full max-w-[70vw] flex-col items-center gap-[2vh]"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out, delay: 0.6 }}>
      {explanation && (
        <div className={`${tvPanel} flex items-start gap-4 px-[2vw] py-[2vh]`}>
          <Lightbulb aria-hidden className="shrink-0" style={{ width: lu(4), height: lu(4), color: QZ.amber }} />
          <span className="font-semibold leading-snug" style={{ fontSize: tvType.body, color: QZ.text }}>{explanation}</span>
        </div>
      )}
      {correctPct >= 0 && votesCount > 0 && (
        <div className="w-full max-w-[48vw]" data-testid="tv-fof-split">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold" style={{ fontSize: tvType.label, color: QZ.text }}>
              {t('tvCinema.quiz.gotItRight', '{{pct}} % richtig', { pct })}
            </span>
            <span className="font-bold" style={{ fontSize: tvType.label, color: QZ.dim }}>
              {t('tvCinema.quiz.gotItWrong', '{{pct}} % daneben', { pct: 100 - pct })}
            </span>
          </div>
          <div className="flex h-[1.6vh] overflow-hidden rounded-full" style={{ background: `${QZ.red}40` }}>
            <motion.div className="h-full w-full origin-left rounded-full" style={{ background: `linear-gradient(90deg, ${QZ.green}, #5eead4)` }}
              initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 0.9, ease: partyEase.out, delay: 0.8 }} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/** Avatar-Reihe mit Text davor: „Richtig: …“ bzw. „Schon getippt: …“. */
export function AvatarRow({ label, players, tone = QZ.green, testId, delay = 0.5 }: {
  label: string; players: QuizPlayer[]; tone?: string; testId?: string; delay?: number;
}) {
  const reduced = !!useReducedMotion();
  if (!players.length) return null;
  return (
    <motion.div data-testid={testId} className="flex items-center gap-4"
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: partyEase.out, delay }}>
      <span className="font-bold" style={{ fontSize: tvType.label, color: QZ.text }}>{label}</span>
      <div className="flex items-center gap-3">
        {players.map((p, i) => (
          <motion.div key={p.id ?? `${p.name}-${i}`} className="relative" title={p.name}
            initial={reduced ? { opacity: 0 } : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.4, delay: delay + 0.1 + i * 0.07 }}>
            <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(6)} active />
            <span className="absolute -bottom-1 -right-1 grid place-items-center rounded-full font-black"
              style={{ width: lu(2.6), height: lu(2.6), fontSize: lu(1.6), background: tone, color: '#060810' }}>✓</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/** Punkte-Einblendung bei der Aufloesung (allgemeines Quiz). */
export function PointsFloat({ points }: { points: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  return (
    <motion.span className="pointer-events-none font-black" style={{ fontSize: tvType.title, color: QZ.amber, textShadow: `0 0 30px ${QZ.amber}88` }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 0.6, bounce: 0.45, delay: 0.4 }}>
      +{points} {t('tv.points', 'Punkte')}
    </motion.span>
  );
}
