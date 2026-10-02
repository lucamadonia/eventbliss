import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { lu } from '../../components/tv-lobby-scale';
import { tvType } from '../../tv-tokens';
import { TS, alpha } from '../turn-stage/kit';

export interface WhoAmIPlayer { id: string; name: string; color: string; avatar?: string; score: number; character: string; questionsAsked: number; guessedCorrectly: boolean; eliminated: boolean }
export const WI_ANSWER = { yes: TS.good, maybe: TS.warn, no: TS.bad } as const;

/**
 * Fragerunde (asking / answerVote / guessing): eine Szene — links die Person
 * am Zug im Rampenlicht, in der Mitte Frage und Stimmen-Summe. Nur die Mitte
 * wechselt mit der Phase, die Person bleibt stehen.
 *
 * GEHEIMNIS: Die Figur steht hier nie — nur Frage, Summe und Fragenzahl.
 */
export default function WhoAmIRound({ phase, active, question, tally, maxQuestions }: {
  phase: string; active?: WhoAmIPlayer; question: string; tally: { yes: number; no: number; maybe: number }; maxQuestions: number;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  const color = active?.color ?? TS.accent;
  const asked = active?.questionsAsked ?? 0;
  const ratio = maxQuestions > 0 ? Math.min(1, asked / maxQuestions) : 0;
  const total = tally.yes + tally.no + tally.maybe;

  return (
    <div className="grid h-full w-full grid-cols-[minmax(0,26vw)_1fr] items-center gap-[4vw]">
      {/* Rampenlicht: wer gerade fragt */}
      <AnimatePresence mode="wait">
        {active && (
          <motion.div key={active.id} data-testid="tv-whoami-active"
            className="relative flex flex-col items-center gap-[2vh] rounded-[28px] px-[2vw] py-[4vh] text-center"
            style={{ background: `linear-gradient(170deg, ${color}${alpha(0.18)}, ${TS.raised} 60%)`, boxShadow: `0 0 0 2px ${color}, 0 0 60px -10px ${color}aa` }}
            variants={{ initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } }}
            initial="initial" animate="animate" exit="exit" transition={{ duration: reduced ? 0.15 : 0.5, ease: partyEase.out }}>
            <motion.div animate={ambient ? { scale: [1, 1.04, 1] } : { scale: 1 }} transition={ambient ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : { duration: 0.2 }}>
              <TVPlayerAvatar id={active.id} name={active.name} avatar={active.avatar} color={color} size={lu(20)} active />
            </motion.div>
            <span className="font-black leading-tight" style={{ fontSize: tvType.display }}>{active.name}</span>
            <span className="font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>
              {phase === 'guessing' ? t('tvCinema.whoami.guessingSub', 'nennt jetzt die Figur') : t('tvCinema.whoami.askingSub', 'stellt Ja/Nein-Fragen')}
            </span>
            <div className="mt-[1vh] w-full">
              <div className="h-[1.2vh] w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div className="h-full w-full origin-left rounded-full" style={{ background: color }} animate={{ scaleX: ratio }} transition={{ duration: 0.6, ease: partyEase.out }} />
              </div>
              <span className="mt-[1vh] block font-bold tabular-nums" style={{ fontSize: tvType.label, color: TS.dim }}>
                {t('tv.whoami.questionN', { x: asked, max: maxQuestions, defaultValue: 'Frage {{x}}/{{max}}' })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mitte: Frage, Stimmen, Raten */}
      <div className="flex min-h-0 flex-col items-center justify-center gap-[4vh]">
        <AnimatePresence mode="wait">
          {phase === 'guessing' ? (
            <motion.div key="guess" className="flex flex-col items-center gap-[2vh] text-center"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: partyEase.out }}>
              <motion.span style={{ fontSize: lu(16) }} aria-hidden
                animate={ambient ? { rotate: [-8, 8, -8] } : { rotate: 0 }} transition={ambient ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } : { duration: 0.2 }}>🤔</motion.span>
              <span className="max-w-[20ch] font-black leading-tight" style={{ fontSize: tvType.display }}>{t('tvCinema.whoami.guessHeadline', 'Wer bin ich?')}</span>
              <span className="font-bold" style={{ fontSize: tvType.title, color: TS.dim }}>{t('tvCinema.whoami.guessHint', 'Die Antwort kommt gleich …')}</span>
            </motion.div>
          ) : question ? (
            <motion.div key={question} data-testid="tv-whoami-question"
              className="max-w-[44vw] rounded-[28px] px-[3vw] py-[4vh] text-center"
              style={{ background: TS.raised, boxShadow: `0 0 0 1px ${TS.accent}55, 0 0 50px -14px ${TS.accent}88` }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: partyEase.out }}>
              <p className="font-black leading-tight" style={{ fontSize: question.length > 48 ? tvType.title : tvType.display }}>„{question}“</p>
            </motion.div>
          ) : (
            <motion.div key="prompt" className="flex flex-col items-center gap-[2vh] text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span style={{ fontSize: lu(12) }} aria-hidden>❓</span>
              <span className="max-w-[20ch] font-black leading-tight" style={{ fontSize: tvType.display, color: TS.text }}>{t('tv.whoami.askPrompt', 'Stell eine Ja/Nein-Frage')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {phase !== 'guessing' && (
          <div className="flex w-full max-w-[44vw] items-end justify-center gap-[3vw]" data-testid="tv-whoami-tally">
            {(['yes', 'maybe', 'no'] as const).map((k) => (
              <TallyColumn key={k} label={t(`games.whoami.answerVote.${k}`, k === 'yes' ? 'Ja' : k === 'no' ? 'Nein' : 'Vielleicht')} count={tally[k]} share={total > 0 ? tally[k] / total : 0} color={WI_ANSWER[k]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TallyColumn({ label, count, share, color }: { label: string; count: number; share: number; color: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-[1.2vh]">
      <motion.span key={count} className="font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color: TS.text }}
        initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.45, bounce: 0.4 }}>{count}</motion.span>
      <div className="flex w-full items-end overflow-hidden rounded-[18px]" style={{ height: '14vh', background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="w-full origin-bottom rounded-[18px]" style={{ height: '100%', background: `linear-gradient(to top, ${color}, ${color}99)`, boxShadow: `0 0 30px -6px ${color}` }}
          animate={{ scaleY: Math.max(0.06, share) }} transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }} />
      </div>
      <span className="font-bold" style={{ fontSize: tvType.body, color: TS.text }}>{label}</span>
    </div>
  );
}
