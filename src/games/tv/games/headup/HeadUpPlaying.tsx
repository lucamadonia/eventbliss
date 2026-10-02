import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import { useTVCue } from '../../cinema/tv-cue-context';
import { lu } from '../../components/tv-lobby-scale';
import { tvType } from '../../tv-tokens';
import { HU, type HeadUpSeat } from './headup-tv';

/**
 * Laufende HeadUp-Runde — eine durchgehende Szene. Der Begriff IST die
 * Mechanik (das Publikum liest und erklaert), deshalb steht er gross da,
 * solange die Bruecke ihn schickt (lokal). Online schickt sie keinen Begriff:
 * dann steht der Ratende im Rampenlicht.
 * Treffer/Skip werden aus den Zaehlern abgeleitet (die Bruecke sendet kein
 * lastAction): Treffer = gruener Puls + Ton, Skip = Wort fliegt zur Seite.
 */
export default function HeadUpPlaying({ guesser, word, correct, skipped }: {
  guesser: HeadUpSeat | undefined; word: string; correct: number; skipped: number;
}) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const cue = useTVCue();
  const prev = useRef({ correct, skipped });
  const [last, setLast] = useState<{ kind: 'correct' | 'skip' | ''; n: number }>({ kind: '', n: 0 });

  useEffect(() => {
    const p = prev.current;
    if (correct > p.correct) { setLast((l) => ({ kind: 'correct', n: l.n + 1 })); cue.play('correct'); }
    else if (skipped > p.skipped) setLast((l) => ({ kind: 'skip', n: l.n + 1 }));
    prev.current = { correct, skipped };
  }, [correct, skipped]); // eslint-disable-line react-hooks/exhaustive-deps

  const color = guesser?.color || HU.purple;
  const enter = reduced ? { opacity: 0 } : last.kind === 'skip' ? { opacity: 0, x: 160 } : last.kind === 'correct' ? { opacity: 0, y: 70, scale: 0.92 } : { opacity: 0, scale: 0.8 };
  const leave = reduced ? { opacity: 0 } : last.kind === 'skip' ? { opacity: 0, x: -220 } : { opacity: 0, y: -90, scale: 1.08 };

  return (
    <div className="relative flex w-full flex-col items-center" style={{ gap: lu(3) }}>
      {/* Wer raet */}
      <div className="flex items-center" style={{ gap: lu(2) }}>
        <TVPlayerAvatar id={guesser?.id} name={guesser?.name || '?'} avatar={guesser?.avatar} color={color} size={lu(8)} active />
        <div className="flex flex-col items-start">
          <span className="font-semibold" style={{ fontSize: tvType.label, color: HU.dim }}>{t('tvCinema.headup.guessing', 'rät gerade')}</span>
          <span className="font-black leading-none" style={{ fontSize: tvType.title, color: '#fff' }}>{guesser?.name || ''}</span>
        </div>
      </div>

      {/* Begriff (lokal) bzw. Hinweis (online) */}
      <div className="relative grid w-full place-items-center" style={{ minHeight: '30vh' }}>
        <AnimatePresence>
          {last.kind === 'correct' && (
            <motion.div key={`flash-${last.n}`} aria-hidden className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(ellipse 50% 60% at 50% 50%, ${HU.green}55 0%, transparent 70%)` }}
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }} />
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {word ? (
            <motion.h1 key={word} className="max-w-[16ch] px-[5vw] text-center font-black italic leading-none"
              style={{
                fontSize: tvType.hero, paddingInlineEnd: '0.12em',
                background: `linear-gradient(135deg, ${HU.purple} 0%, ${HU.cyan} 50%, ${HU.pink} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 0 40px ${HU.purple}55)`,
              }}
              initial={enter} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ ...leave, transition: { duration: 0.22, ease: partyEase.exit } }}
              transition={{ duration: 0.45, ease: partyEase.out }}>
              {word}
            </motion.h1>
          ) : (
            <motion.div key="hint" className="flex flex-col items-center text-center" style={{ gap: lu(1.6) }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.span aria-hidden style={{ fontSize: 'min(16vh, 12vw)' }}
                animate={ambient ? { rotate: [-6, 6, -6] } : { rotate: 0 }} transition={ambient ? { repeat: Infinity, duration: 3, ease: 'easeInOut' } : { duration: 0.3 }}>
                🤔
              </motion.span>
              <span className="font-black" style={{ fontSize: tvType.display, color: HU.text }}>{t('tvCinema.headup.explainNow', 'Erklärt den Begriff!')}</span>
              <span className="font-semibold" style={{ fontSize: tvType.body, color: HU.dim }}>
                {t('tvCinema.headup.lookAtPhone', 'Das Wort steht auf dem Handy – nur {{name}} sieht es nicht', { name: guesser?.name || '' })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zaehler */}
      <div className="flex" style={{ gap: lu(2.4) }}>
        <CountPill value={correct} label={t('tv.headup.correct', 'Richtig')} color={HU.green} reduced={reduced} />
        <CountPill value={skipped} label={t('tv.headup.skipped', 'Übersprungen')} color={HU.skip} reduced={reduced} />
      </div>
    </div>
  );
}

function CountPill({ value, label, color, reduced }: { value: number; label: string; color: string; reduced: boolean }) {
  return (
    <div className="flex items-center rounded-full" style={{ gap: lu(1.4), padding: `${lu(0.8)} ${lu(3)}`, background: `${color}1a`, boxShadow: `inset 0 0 0 1.5px ${color}55` }}>
      <motion.span key={value} className="font-black tabular-nums" style={{ fontSize: tvType.title, color: '#fff', textShadow: `0 0 24px ${color}` }}
        initial={reduced ? { opacity: 0.4 } : { scale: 1.5 }} animate={reduced ? { opacity: 1 } : { scale: 1 }} transition={{ duration: 0.35, ease: partyEase.out }}>
        {value}
      </motion.span>
      <span className="font-bold" style={{ fontSize: tvType.body, color: HU.text }}>{label}</span>
    </div>
  );
}
