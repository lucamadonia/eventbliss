import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import { tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import TVBurst from '../../cinema/TVBurst';
import { useTVCue } from '../../cinema/tv-cue-context';

export const PJ = { primary: '#38BDF8', accent: '#FDE047', dim: '#94A3B8', text: '#F1F5F9', miss: '#ff6b98' };

export interface PixelPlayer { id: string; name: string; color: string; score: number; avatar?: string }

/** Buzzer-Moment: wer gedrueckt hat, gross mit Symbol — ein kurzer Ton dazu. */
export function PixelBuzz({ name, player }: { name: string; player: PixelPlayer | null }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const cue = useTVCue();
  useEffect(() => { cue.play('tick'); }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  const color = player?.color || PJ.primary;
  return (
    <motion.div data-testid="tv-pixeljagd-buzz" className="flex items-center gap-[1.4vw] rounded-full py-[1vh] pl-[1vh] pr-[2vw]"
      style={{ background: `linear-gradient(90deg, ${color}2e, rgba(13,9,21,0.9) 70%)`, border: `1.5px solid ${color}88`, boxShadow: `0 0 50px -12px ${color}` }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2, ease: partyEase.exit } }}
      transition={reduced ? { duration: 0.2 } : { type: 'spring', duration: 0.5, bounce: 0.4 }}>
      <TVPlayerAvatar id={player?.id} name={name} avatar={player?.avatar} color={color} size={lu(8)} active />
      <span className="font-black" style={{ fontSize: tvType.title, color: '#fff' }}>
        {t('tvCinema.pixeljagd.buzzed', '{{name}} hat gebuzzert!', { name })}
      </span>
    </motion.div>
  );
}

/**
 * Aufloesung: Antwort als Held, darunter wer sie hatte. Konfetti nur bei einem
 * Treffer und hinter einer dunklen Freiflaeche — es kreuzt nie die Schrift.
 */
export function PixelReveal({ answer, credit, winner, winnerName }: {
  answer: string; credit?: string; winner: PixelPlayer | null; winnerName: string | null;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const cue = useTVCue();
  useEffect(() => {
    const id = window.setTimeout(() => cue.play(winnerName ? 'correct' : 'wrong'), 650);
    return () => window.clearTimeout(id);
  }, [answer, winnerName]); // eslint-disable-line react-hooks/exhaustive-deps
  const color = winner?.color || PJ.primary;
  return (
    <motion.div data-testid="tv-pixeljagd-reveal" className="relative flex flex-col items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      {winnerName && (
        <div className="pointer-events-none fixed inset-0 z-0"><TVBurst colors={[PJ.accent, color, PJ.primary, '#ffffff']} count={48} delay={0.5} /></div>
      )}
      <div className="relative z-10 flex flex-col items-center gap-[0.8vh] rounded-[50%] px-[5vw] py-[1vh] text-center"
        style={{ background: 'radial-gradient(ellipse closest-side, #060810 60%, rgba(6,8,16,0.85) 80%, transparent 100%)' }}>
        <motion.p className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff', textShadow: `0 0 40px ${PJ.accent}55` }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={reduced ? { duration: 0.2 } : { duration: 0.5, ease: partyEase.out }}>
          {answer}
        </motion.p>
        <motion.div className="flex items-center gap-[0.8vw]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}>
          {winnerName && <TVPlayerAvatar id={winner?.id} name={winnerName} avatar={winner?.avatar} color={color} size={lu(5)} active />}
          <span className="font-bold" style={{ fontSize: tvType.body, color: winnerName ? '#fff' : PJ.dim }}>
            {winnerName
              ? t('tvCinema.pixeljagd.solvedBy', '{{name}} hat es erraten', { name: winnerName })
              : t('tvCinema.pixeljagd.unsolved', 'Niemand hat es erraten')}
          </span>
        </motion.div>
        {/* Bildnachweis — im Spiel Pflicht, also auch hier. */}
        {credit && (
          <span style={{ fontSize: tvType.label, color: PJ.dim }}>
            {t('tvCinema.pixeljagd.credit', 'Bild: {{credit}}', { credit })}
          </span>
        )}
      </div>
    </motion.div>
  );
}
