import { useEffect, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Pencil, Smartphone, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import type { Stroke } from '../drawing';
import type { PartyNightState } from '../party-types';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVBurst from '../cinema/TVBurst';
import { useTVCue } from '../cinema/tv-cue-context';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import { lu } from '../components/tv-lobby-scale';
import { tvPanel, tvType } from '../tv-tokens';
import DrawCanvas from './draw/DrawCanvas';
import { TS, TVTimerRing, TVTopBar, Wash, emojiOnly, hexOr } from './turn-stage/kit';

interface Player { id?: string; name: string; color?: string; avatar?: string; score?: number }
interface ViewState {
  partyNight?: PartyNightState;
  phase?: string;
  round?: number;
  totalRounds?: number;
  drawerId?: string;
  drawer?: string;
  currentPlayer?: string;
  drawerColor?: string;
  timeLeft?: number | '';
  maxTime?: number;
  drawingDataURL?: string;
  currentWord?: string;
  word?: string;
  guessedBy?: string;
  players?: Player[];
}

/**
 * TVDrawView — Schnellzeichner auf dem Fernseher.
 *
 * GEHEIMNIS: Der Begriff kommt erst mit der Aufloesung (`quickDrawTvWord`
 * schickt ihn nur in roundResult/gameOver). Die Ansicht zeigt ihn zusaetzlich
 * nur in diesen Phasen — alle im Raum raten auf dieses Bild.
 *
 * Die Zeichenflaeche ist eine durchgehende Szene und wird nie neu
 * eingehaengt; Phasen wechseln nur Rahmen, Seitenleisten und Ueberlagerungen.
 */
const EMPTY: Player[] = [];

export default function TVDrawView({ gameState, drawing }: { gameState: ViewState; drawing?: Stroke[] }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  const cue = useTVCue();

  const phase = gameState?.phase || 'drawing';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || 0;
  const players = gameState?.players || EMPTY;
  const drawerName = gameState?.drawer || gameState?.currentPlayer || '';
  const drawerPlayer = players.find((p) => (gameState?.drawerId && p.id === gameState.drawerId) || p.name === drawerName);
  const drawerColor = hexOr(drawerPlayer?.color ?? gameState?.drawerColor, TS.pink);
  const timeLeft = typeof gameState?.timeLeft === 'number' ? gameState.timeLeft : null;
  const maxTime = gameState?.maxTime ?? 60;
  const revealed = phase === 'roundResult' || phase === 'gameOver';
  const word = revealed ? (gameState?.currentWord || gameState?.word || '') : '';
  const guessedBy = gameState?.guessedBy || '';
  const strokes = drawing ?? EMPTY_STROKES;

  // Die Aufloesung klingt aus dem Cue; der richtige Tipp bekommt den Treffer-Ton.
  useEffect(() => { if (guessedBy) cue.play('correct'); }, [guessedBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const phaseBadge = {
    drawerReveal: { label: t('tvCinema.draw.drawerReveal', 'Begriff ansehen'), color: TS.accent },
    drawing: { label: t('tvCinema.draw.drawing', 'Zeichnen'), color: drawerColor },
    guessing: { label: t('tvCinema.draw.guessing', 'Raten'), color: TS.cyan },
    roundResult: { label: t('tvCinema.draw.result', 'Auflösung'), color: TS.gold },
    gameOver: { label: t('tvCinema.draw.result', 'Auflösung'), color: TS.gold },
  }[phase] ?? null;

  const roster: TVScorePlayer[] = useMemo(() => players.map((p) => ({
    id: p.id || p.name, name: p.name, color: hexOr(p.color, TS.accent), score: p.score, avatar: emojiOnly(p.avatar),
  })), [players]);
  const drawerId = drawerPlayer ? (drawerPlayer.id || drawerPlayer.name) : null;

  const drawerStatus = phase === 'drawerReveal' ? t('tvCinema.draw.statusReveal', 'schaut sich den Begriff an')
    : phase === 'drawing' ? t('tvCinema.draw.statusDrawing', 'zeichnet')
      : t('tvCinema.draw.statusDone', 'hat gezeichnet');

  let rail: ReactNode = null;
  if (phase === 'drawing' && timeLeft !== null) {
    rail = (
      <>
        <TVTimerRing timeLeft={timeLeft} total={maxTime} size={18} />
        <span className="font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{t('tvCinema.draw.timeLeft', 'Sekunden')}</span>
      </>
    );
  } else if (phase === 'guessing') {
    rail = (
      <>
        <motion.span className="grid place-items-center rounded-full" style={{ width: lu(12), height: lu(12), background: `${TS.cyan}1a`, boxShadow: `0 0 0 2px ${TS.cyan}66` }}
          animate={ambient ? { scale: [1, 1.05, 1] } : { scale: 1 }} transition={ambient ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : { duration: 0.2 }}>
          <Smartphone style={{ width: lu(5.5), height: lu(5.5), color: TS.cyan }} />
        </motion.span>
        <span className="text-center font-black leading-tight" style={{ fontSize: tvType.title, color: TS.text }}>{t('tvCinema.draw.guessHeadline', 'Was ist das?')}</span>
        <span className="text-center font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{t('tvCinema.draw.guessHint', 'Ratet der Reihe nach am Handy')}</span>
      </>
    );
  } else if (revealed && word) {
    // Aufloesung: der Begriff als Held neben dem Bild — die Zeichnung bleibt ganz sichtbar.
    rail = (
      <motion.div data-testid="tv-draw-word" className="flex flex-col items-center gap-2 rounded-[28px] px-[2.4vw] py-[3vh] text-center"
        style={{ background: TS.raised, boxShadow: `0 0 0 2px ${TS.gold}, 0 0 60px -10px ${TS.gold}aa` }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0.2 } : { type: 'spring', duration: 0.6, bounce: 0.4, delay: 0.15 }}>
        <span className="font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{t('tvCinema.draw.wordWas', 'Gesucht war')}</span>
        <span className="break-words font-black leading-none" style={{ fontSize: word.length > 10 ? tvType.title : tvType.display, color: '#fff', textShadow: `0 0 40px ${TS.gold}88` }}>{word}</span>
      </motion.div>
    );
  } else if (phase === 'drawerReveal') {
    rail = (
      <span className="text-center font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{t('tvCinema.draw.getReady', 'Gleich geht’s los …')}</span>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: TS.bg, color: TS.text }}>
      <Wash color={revealed ? TS.gold : phase === 'guessing' ? TS.cyan : drawerColor} strength={0.12} />
      {revealed && word && (
        <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[TS.gold, TS.cyan, TS.accent, '#ffffff']} count={48} delay={0.25} /></div>
      )}

      <TVTopBar phase={phaseBadge} round={total ? t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total }) : t('tvCinema.round', 'Runde {{round}}', { round })} />

      <div className="absolute left-[5vw] right-[5vw] top-[16vh] bottom-[21vh] z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-[3vw]">
        {/* Links: der Zeichner */}
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {drawerName && (
            <motion.div key={drawerName} className="flex flex-col items-center gap-4"
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: partyEase.out }}>
              <div className="relative">
                <TVPlayerAvatar id={drawerPlayer?.id} name={drawerName} avatar={emojiOnly(drawerPlayer?.avatar)} color={drawerColor} size={lu(15)} active={phase === 'drawing' || phase === 'drawerReveal'} />
                <span className="absolute -bottom-1 -right-1 grid place-items-center rounded-full" style={{ width: lu(5.5), height: lu(5.5), background: TS.raised, boxShadow: `0 0 0 2px ${drawerColor}` }}>
                  {phase === 'drawerReveal' ? <Eye style={{ width: lu(2.8), height: lu(2.8), color: TS.text }} /> : <Pencil style={{ width: lu(2.8), height: lu(2.8), color: TS.text }} />}
                </span>
              </div>
              <span className="font-black leading-tight" style={{ fontSize: tvType.title }}>{drawerName}</span>
              <span className="font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{drawerStatus}</span>
            </motion.div>
          )}
        </div>

        {/* Mitte: die Zeichenflaeche — bleibt eingehaengt */}
        <motion.div className="relative" style={{ width: 'min(60vh, 40vw)', height: 'min(60vh, 40vw)' }}
          animate={{ scale: revealed ? 0.94 : 1 }} transition={{ duration: 0.6, ease: partyEase.out }}>
          <div className="absolute inset-0 overflow-hidden rounded-[28px]"
            style={{ boxShadow: `0 0 0 3px ${revealed ? TS.gold : drawerColor}88, 0 0 70px -12px ${revealed ? TS.gold : drawerColor}88, 0 30px 80px rgba(0,0,0,0.55)`, transition: 'box-shadow 600ms ease' }}>
            <DrawCanvas strokes={strokes} dataURL={gameState?.drawingDataURL} />
            <AnimatePresence>
              {phase === 'drawerReveal' && (
                <motion.div key="cover" className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                  style={{ background: `radial-gradient(circle at 50% 45%, ${drawerColor}40, rgba(13,9,21,0.96) 70%)` }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
                  <motion.span style={{ fontSize: lu(10) }} aria-hidden
                    animate={ambient ? { rotate: [-6, 6, -6] } : { rotate: 0 }} transition={ambient ? { repeat: Infinity, duration: 2.6, ease: 'easeInOut' } : { duration: 0.2 }}>🎨</motion.span>
                  <span className="px-8 text-center font-black leading-tight" style={{ fontSize: tvType.title, color: TS.text }}>
                    {t('tvCinema.draw.coverTitle', 'Gleich wird gezeichnet')}
                  </span>
                </motion.div>
              )}
              {guessedBy && !revealed && (
                <motion.div key="hit" className="absolute inset-0" style={{ background: `${TS.good}33` }}
                  initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.4] }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} />
              )}
            </AnimatePresence>
          </div>

        </motion.div>

        {/* Rechts: Uhr bzw. Hinweis der Phase */}
        <div className="flex flex-col items-center justify-center gap-4">
          <AnimatePresence mode="wait">
            {rail && (
              <motion.div key={phase} className={`${phase === 'guessing' ? `${tvPanel} px-[2vw] py-[3vh]` : ''} flex max-w-[22vw] flex-col items-center gap-4`}
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, transition: { duration: 0.25 } }}
                transition={{ duration: 0.5, ease: partyEase.out }}>
                {rail}
              </motion.div>
            )}
          </AnimatePresence>
          {revealed && guessedBy && (
            <span className="font-bold" style={{ fontSize: tvType.body, color: TS.text }}>{t('tvCinema.draw.guessedBy', 'Erraten von {{name}}', { name: guessedBy })}</span>
          )}
        </div>
      </div>

      {roster.length > 0 && (
        <div className="absolute bottom-[5vh] left-[5vw] right-[5vw] z-10">
          <TVScoreboard party={gameState?.partyNight} players={roster} activeId={phase === 'drawing' || phase === 'drawerReveal' ? drawerId : null} sort="order" />
        </div>
      )}
    </div>
  );
}

const EMPTY_STROKES: Stroke[] = [];
