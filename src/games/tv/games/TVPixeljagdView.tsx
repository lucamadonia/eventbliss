/**
 * PIXELJAGD auf dem Fernseher.
 *
 * Der TV ist die gemeinsame Bildfläche: Er zeigt das Motiv groß und in der
 * aktuellen Enthüllungsstufe, die Handys sind nur noch Buzzer. Deshalb bekommt
 * das Bild die Mittelzone und so viel Platz wie möglich; darunter liegt eine
 * feste Zone fuer Buzzer-Moment und Aufloesung — sie kann das Bild nie
 * ueberdecken.
 *
 * Spoiler-Schutz: `reveal` (Antwort und Bildnachweis) kommt erst ab der
 * Auflösungsphase im Zustand an — vorher gibt es hier nichts anzuzeigen, selbst
 * wenn jemand den Datenstrom mitliest. Zusaetzlich zeigt die Ansicht die
 * Antwort nur in 'roundEnd'.
 *
 * Eine durchgehende Szene (das Bild wird schaerfer, die Uhr laeuft) — deshalb
 * keine TVPhaseStage, die Aufloesung animiert innerhalb.
 *
 * Defensiv destrukturiert: Ein Fernseher kann sich jederzeit verbinden und
 * bekommt dann einen unvollständigen Zustand.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PixelCanvas } from '@/games/pixeljagd/PixelCanvas';
import { partyMotion } from '@/lib/party-motion';
import TVScoreboard from '../components/TVScoreboard';
import TVTimer from '../components/TVTimer';
import { tvPanel, tvType } from '../tv-tokens';
import { lu } from '../components/tv-lobby-scale';
import type { PartyNightState } from '../party-types';
import { PJ, PixelBuzz, PixelReveal, type PixelPlayer } from './pixeljagd/PixelMoments';

interface Props {
  gameState: Record<string, unknown>;
}

export default function TVPixeljagdView({ gameState }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const s = (gameState ?? {}) as Record<string, unknown>;

  const phase = String(s.phase ?? 'playing');
  const image = String(s.image ?? '');
  const step = Number(s.step ?? 8);
  const round = Number(s.round ?? 1);
  const totalRounds = Number(s.totalRounds ?? 1);
  const timeLeft = Number(s.timeLeft ?? 0);
  const totalTime = Number(s.totalTime ?? 30);
  const points = Number(s.points ?? 100);
  const buzzedName = s.buzzedName ? String(s.buzzedName) : null;
  const revealing = phase === 'roundEnd';
  // Nur in der Aufloesung lesen — doppelte Sicherung zur Bruecke.
  const reveal = revealing ? (s.reveal ?? null) as { answer?: string; credit?: string; winner?: string | null } | null : null;

  const players = useMemo<PixelPlayer[]>(() => {
    const raw = Array.isArray(s.players) ? s.players : [];
    return raw.map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      return {
        id: String(q.id ?? ''),
        name: String(q.name ?? ''),
        color: String(q.color ?? PJ.primary),
        score: Number(q.score ?? 0),
        ...(typeof q.avatar === 'string' && q.avatar ? { avatar: q.avatar } : {}),
      };
    });
  }, [s.players]);

  const byName = (name: string | null | undefined) => (name ? players.find((p) => p.name === name) ?? null : null);
  const phaseLabel = revealing
    ? { text: t('tvCinema.pixeljagd.revealPill', 'Auflösung'), color: PJ.accent }
    : { text: t('tvCinema.pixeljagd.playing', 'Was ist das?'), color: PJ.primary };

  return (
    <div className="relative flex h-screen w-full flex-col gap-[2.4vh] overflow-hidden px-[5vw] pb-[5vh] pt-[5vh]" style={{ color: PJ.text, background: '#060810' }}>
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 60% 55% at 38% 45%, ${revealing ? PJ.accent : PJ.primary}14 0%, transparent 70%)`, transition: 'background 600ms ease' }} />

      {/* Kopfzeile: Phase links, Runde rechts — die Mitte bleibt fuer die Uebergabe frei. */}
      <div className="relative z-10 flex shrink-0 items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.div key={phaseLabel.text} className="rounded-full px-[1.4vw] py-[0.8vh]"
            style={{ background: `${phaseLabel.color}1a`, border: `1px solid ${phaseLabel.color}4d` }}
            variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate" exit="exit">
            <span className="font-bold" style={{ fontSize: lu(2.4), color: phaseLabel.color }}>{phaseLabel.text}</span>
          </motion.div>
        </AnimatePresence>
        <div className={`${tvPanel} px-[1.4vw] py-[0.8vh]`}>
          <span className="font-bold" style={{ fontSize: lu(2.4), color: PJ.dim }}>
            {t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total: totalRounds })}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 gap-[2vw]">
        {/* Bildflaeche + feste Zone darunter */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-[2vh]">
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            {image ? (
              <motion.div className={`${tvPanel} relative h-full max-w-full overflow-hidden`} style={{ aspectRatio: '4 / 3', padding: '1vh' }}
                animate={{ boxShadow: revealing ? `0 0 0 2px ${PJ.accent}, 0 0 60px -10px ${PJ.accent}` : `0 0 0 1px rgba(255,255,255,0.06)` }}
                transition={{ duration: 0.6 }}>
                <PixelCanvas
                  src={image}
                  // In der Auflösung scharf zeigen.
                  step={revealing ? 320 : step}
                  width={1280}
                  height={960}
                  className="block h-full w-full rounded-[1vh]"
                />
              </motion.div>
            ) : (
              <p style={{ fontSize: tvType.body, color: PJ.dim }}>{t('tv.waitingForImage', 'Warten auf das nächste Motiv …')}</p>
            )}
          </div>

          <div className="flex w-full shrink-0 items-center justify-center" style={{ height: '20vh' }}>
            <AnimatePresence mode="wait">
              {revealing && reveal?.answer ? (
                <PixelReveal key="reveal" answer={reveal.answer} credit={reveal.credit} winner={byName(reveal.winner)} winnerName={reveal.winner ?? null} />
              ) : buzzedName && phase === 'playing' ? (
                <PixelBuzz key={`buzz-${buzzedName}`} name={buzzedName} player={byName(buzzedName)} />
              ) : phase === 'playing' ? (
                <motion.p key="hint" className="font-semibold" style={{ fontSize: tvType.body, color: PJ.dim }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {t('tvCinema.pixeljagd.playingSub', 'Buzzert, sobald ihr es erkennt')}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Seitenschiene: Uhr, Punkte, Punktestand */}
        <div className="flex w-[22vw] shrink-0 flex-col gap-[2vh]">
          <div className={`${tvPanel} flex items-center justify-between gap-[1vw] px-[1.2vw] py-[1.4vh]`}>
            <TVTimer timeLeft={timeLeft} totalTime={totalTime} size={120} />
            <div className="flex flex-col items-end">
              <span className="font-semibold" style={{ fontSize: tvType.label, color: PJ.dim }}>{t('tvCinema.pixeljagd.pointsNow', 'Gerade wert')}</span>
              <motion.span key={points} className="font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color: PJ.accent }}
                initial={reduced ? false : { scale: 1.2, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                {points}
              </motion.span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <TVScoreboard party={gameState?.partyNight as PartyNightState | undefined} players={players} layout="rail" sort="score" />
          </div>
        </div>
      </div>
    </div>
  );
}
