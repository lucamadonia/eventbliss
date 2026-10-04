import type { PartyNightState } from '../party-types';
import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { partyEase, partyMotion } from '@/lib/party-motion';
import { tvPanel, tvType } from '../tv-tokens';
import { lu } from '../components/tv-lobby-scale';
import TVScoreboard from '../components/TVScoreboard';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import { useTVCue } from '../cinema/tv-cue-context';
import { OW, OhrwurmHero, type OhrwurmReveal } from './ohrwurm/OhrwurmHero';
import OhrwurmTimeline from './ohrwurm/OhrwurmTimeline';

interface TVPlayer { id: string; name: string; color: string; avatar?: string; score: number; hooks: number }
interface ViewState {
  partyNight?: PartyNightState;
  players?: TVPlayer[];
  activeName?: string;
  activeId?: string;
  phase?: string;
  previewUrl?: string;
  winnerName?: string;
  timeLeft?: number;
  totalTime?: number;
  winTarget?: number;
  timeline?: { id: string; year: number }[];
  listening?: boolean;
  bonusPending?: boolean;
  reveal?: OhrwurmReveal | null;
}

/**
 * TVOhrwurmView — big-screen view for the Ohrwurm music-timeline game.
 *
 *   ┌ Phase ───────────── (frei fuer die Uebergabe) ────────────── Ziel ┐
 *   │ JETZT DRAN  │  HERO: Countdown / Konter / Aufloesung │  TIMELINE   │
 *   └──────────── Punktestand (alle Spieler) ───────────────────────────┘
 *
 * Eine durchgehende Szene (die Uhr laeuft weiter) — deshalb keine
 * TVPhaseStage; nur die Heldenzone wechselt mit eigenem Ein-/Austritt.
 *
 * GEHEIM bis zur Aufloesung: Titel, Interpret, Jahr. Die Bruecke sendet
 * `reveal` erst in der Phase 'reveal'; vorher zeigt die Heldenzone nur die Uhr.
 * Der Fernseher ist der Lautsprecher: Er spielt die verdeckte Vorschau.
 */
export default function TVOhrwurmView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const cue = useTVCue();
  const phase: string = gameState?.phase || 'draw';
  const players: TVPlayer[] = useMemo(() => gameState?.players || [], [gameState?.players]);
  const activeName: string = gameState?.activeName || '';
  const activeId: string | null = gameState?.activeId ?? null;
  const timeline = gameState?.timeline || [];
  const listening = !!gameState?.listening;
  const timeLeft: number = gameState?.timeLeft ?? 0;
  const totalTime: number = gameState?.totalTime ?? 60;
  const winTarget: number = gameState?.winTarget ?? 10;
  const previewUrl: string | null = gameState?.previewUrl ?? null;
  const reveal = phase === 'reveal' ? gameState?.reveal ?? null : null;
  const bonusPending = !!gameState?.bonusPending && !!reveal;
  const winnerName: string | null = gameState?.winnerName ?? null;

  const active = players.find((p) => p.id === activeId);
  const activeColor = active?.color || OW.primary;

  // TV is the speaker — play the hidden preview while a round runs.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlay = listening && !!previewUrl && phase !== 'reveal' && phase !== 'gameOver';
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (shouldPlay) a.play().catch(() => {});
    else a.pause();
  }, [shouldPlay, previewUrl]);

  // Autoplay-Freigabe. Früher standen die Listener auf { once: true } — ein Tipp,
  // der ankam während gerade nichts zu spielen war, verbrauchte die Freigabe
  // wirkungslos. Auf einem Fernseher folgt danach keine weitere Interaktion
  // mehr, also blieb der Ton für den Rest des Abends weg (und .catch(()=>{})
  // verbarg es). Jetzt bleiben die Listener, bis ein play() wirklich geklappt hat.
  useEffect(() => {
    let done = false;
    const unlock = () => {
      const a = audioRef.current;
      if (done || !a || !shouldPlay) return;
      a.play().then(() => {
        done = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      }).catch(() => {});
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, [shouldPlay]);

  // Bonus-Pruefung: ein heller Hinweiston, wenn die Gruppe entscheiden soll.
  useEffect(() => {
    if (bonusPending) cue.play('chime');
  }, [bonusPending]); // eslint-disable-line react-hooks/exhaustive-deps

  const scorePlayers = useMemo(() => players.map((p) => ({
    id: p.id, name: p.name, color: p.color, avatar: p.avatar, score: p.score, subtitle: `${p.hooks} 🎣`,
  })), [players]);

  if (phase === 'gameOver') {
    const winner = players.find((p) => p.name === winnerName);
    return (
      <div className="relative flex h-screen flex-col items-center justify-center gap-[5vh] overflow-hidden px-[5vw] pb-[5vh] pt-[5vh]" style={{ background: OW.bg }}>
        <motion.div className="flex flex-col items-center gap-[2vh] text-center" variants={partyMotion('spotlight', reduced)} initial="initial" animate="animate">
          {winner && <TVPlayerAvatar id={winner.id} name={winner.name} avatar={winner.avatar} color={winner.color} size={lu(16)} active />}
          <div className="font-black" style={{ fontSize: tvType.display, color: OW.text }}>
            {t('tvCinema.ohrwurm.winner', '{{name}} gewinnt!', { name: winnerName ?? '' })}
          </div>
        </motion.div>
        <TVScoreboard party={gameState?.partyNight} players={scorePlayers} target={winTarget} activeId={null} />
      </div>
    );
  }

  const phaseLabel = phase === 'reveal'
    ? { text: t('tvCinema.ohrwurm.revealPill', 'Auflösung'), color: OW.accent }
    : phase === 'counter' || phase === 'counterPlace'
      ? { text: t('tvCinema.ohrwurm.counter', 'Konter-Chance'), color: OW.accent }
      : phase === 'place'
        ? { text: t('tvCinema.ohrwurm.placing', 'Einordnen'), color: OW.secondary }
        : { text: t('tvCinema.ohrwurm.listenPill', 'Hören'), color: OW.primary };

  return (
    <div className="relative flex h-screen flex-col gap-[2.4vh] overflow-hidden px-[5vw] pb-[5vh] pt-[5vh]" style={{ background: OW.bg, color: OW.text }}>
      <audio ref={audioRef} src={previewUrl ?? undefined} preload="none" loop className="hidden" aria-hidden />
      {/* Markenschleier — statisch, keine Unschaerfe-Schleife. */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[34rem] w-[34rem] rounded-full blur-[90px]" style={{ background: 'rgba(255,46,136,0.10)' }} />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[34rem] w-[34rem] rounded-full blur-[90px]" style={{ background: 'rgba(38,224,196,0.09)' }} />

      {/* Kopfzeile: Phase links, Ziel rechts — die Mitte bleibt fuer die Uebergabe frei. */}
      <div className="relative z-10 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-[1vw]">
          <span aria-hidden style={{ fontSize: lu(3) }}>🎵</span>
          <AnimatePresence mode="wait">
            <motion.div key={phaseLabel.text} className="flex items-center gap-[0.6vw] rounded-full px-[1.4vw] py-[0.8vh]"
              style={{ background: `${phaseLabel.color}1a`, border: `1px solid ${phaseLabel.color}4d` }}
              variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate" exit="exit">
              <span className="font-bold" style={{ fontSize: lu(2.4), color: phaseLabel.color }}>{phaseLabel.text}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className={`${tvPanel} px-[1.4vw] py-[0.8vh]`}>
          <span className="font-bold" style={{ fontSize: lu(2.4), color: OW.dim }}>
            {t('tvCinema.ohrwurm.target', 'Ziel: {{count}} Karten', { count: winTarget })}
          </span>
        </div>
      </div>

      <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-[2vw]">
        {/* LINKS — wer ist dran */}
        <div className={`${tvPanel} flex flex-col items-center justify-center gap-[2.4vh] p-[1.6vw] text-center`}>
          <span className="font-semibold" style={{ fontSize: tvType.label, color: OW.dim }}>{t('tv.nowPlaying', 'Jetzt dran')}</span>
          <AnimatePresence mode="wait">
            <motion.div key={activeId ?? activeName} className="flex flex-col items-center gap-[1.6vh]"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: partyEase.exit } }}
              transition={reduced ? { duration: 0.2 } : { type: 'spring', duration: 0.6, bounce: 0.35 }}>
              <TVPlayerAvatar id={activeId ?? undefined} name={activeName} avatar={active?.avatar} color={activeColor} size={lu(14)} active />
              <div className="font-black leading-tight" style={{ fontSize: tvType.title, color: OW.text }}>{activeName}</div>
            </motion.div>
          </AnimatePresence>
          <span style={{ fontSize: tvType.label, color: OW.dim }}>{t('tv.ohrwurm.playingMystery', 'spielt den Mystery-Track')}</span>
          {/* Equalizer — scaleY (Compositor), nur bei Bewegungsfreigabe animiert */}
          <div className="flex items-end gap-[0.5vw]" style={{ height: lu(7) }} aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div key={i} className="h-full origin-bottom rounded-full" style={{ width: lu(1.2), background: `linear-gradient(${OW.secondary}, ${OW.primary})` }}
                animate={listening && ambient ? { scaleY: [0.25, 1, 0.4, 0.9, 0.3] } : { scaleY: listening ? 0.6 : 0.2 }}
                transition={listening && ambient ? { duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' } : { duration: 0.3 }} />
            ))}
          </div>
        </div>

        {/* MITTE — Held */}
        <OhrwurmHero phase={phase} listening={listening} timeLeft={timeLeft} totalTime={totalTime}
          reveal={reveal} bonusPending={bonusPending} activeName={activeName} />

        {/* RECHTS — Timeline der aktiven Person */}
        <OhrwurmTimeline timeline={timeline} activeName={activeName} />
      </div>

      <div className="relative shrink-0">
        <TVScoreboard party={gameState?.partyNight} players={scorePlayers} target={winTarget} activeId={activeId} />
      </div>
    </div>
  );
}
