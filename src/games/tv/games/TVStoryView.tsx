import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import type { PartyNightState } from '../party-types';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVBurst from '../cinema/TVBurst';
import { lu } from '../components/tv-lobby-scale';
import { tvType } from '../tv-tokens';
import { TS, TVTopBar, Wash, emojiOnly, hexOr } from './turn-stage/kit';

interface ViewState {
  partyNight?: PartyNightState;
  players?: Player[];
  mode?: string;
  phase?: string;
  prompt?: string;
  title?: string;
  currentPlayerIdx?: number;
  currentRound?: number;
  round?: number;
  total?: number;
  totalRounds?: number;
  sentences?: Sentence[];
}
interface Player { id?: string; name: string; color?: string; avatar?: string }
interface Sentence { text: string; player?: string; playerColor?: string }

/**
 * TVStoryView — Geschichten-Erzähler auf dem Fernseher.
 *
 * Die Seite ist eine durchgehende Szene: fertige Sätze laufen wie Abspann
 * nach oben, Phasen (Schreiben → Weitergeben → Auflösung) ändern nur Kopf,
 * Autor-Zeile und Abschluss. Die gerade getippte Eingabe wird NIE gesendet —
 * der Fernseher zeigt Sätze erst, wenn sie feststehen (Brücke `storybuilder`).
 */
const GOLD = '#fbbf24';

export default function TVStoryView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();

  const sentences: Sentence[] = useMemo(() => gameState?.sentences || [], [gameState?.sentences]);
  const players: Player[] = useMemo(() => gameState?.players || [], [gameState?.players]);
  const currentPlayer = players[gameState?.currentPlayerIdx ?? 0] || null;
  const round = gameState?.currentRound || gameState?.round || 1;
  const total = gameState?.totalRounds || gameState?.total || 0;
  const phase: string = gameState?.phase || 'writing';
  const mode: string = gameState?.mode || 'classic';
  const prompt: string = gameState?.prompt || '';
  const title = gameState?.title || '';
  const isWriting = phase === 'writing';
  const isPassing = phase === 'passing';
  const isComplete = phase === 'complete' || phase === 'storyReveal' || phase === 'gameOver';

  const modeLabel = mode === 'vorgabe' ? t('tv.story.modeVorgabe', 'Vorgabe') : mode === 'reimzeit' ? t('tv.story.modeReim', 'Reimzeit') : t('tv.story.modeClassic', 'Klassisch');
  const byName = (name?: string) => players.find((p) => p.name === name);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [sentences.length, phase, reduced]);

  const contributions: Record<string, number> = {};
  sentences.forEach((s) => { if (s.player) contributions[s.player] = (contributions[s.player] || 0) + 1; });
  const roster: TVScorePlayer[] = players.map((p) => {
    const n = contributions[p.name] || 0;
    return {
      id: p.id || p.name, name: p.name, color: hexOr(p.color, TS.accent), avatar: emojiOnly(p.avatar),
      subtitle: `${n} ${n === 1 ? t('tv.story.sentence', 'Satz') : t('tv.story.sentences', 'Sätze')}`,
    };
  });
  const activeId = (isWriting || isPassing) && currentPlayer ? (currentPlayer.id || currentPlayer.name) : null;
  const curColor = hexOr(currentPlayer?.color, TS.accent);

  const phaseBadge = isWriting ? { label: t('tvCinema.story.writing', 'Schreiben'), color: curColor }
    : isPassing ? { label: t('tvCinema.story.passing', 'Weitergeben'), color: TS.cyan }
      : isComplete ? { label: t('tvCinema.story.reveal', 'Die Geschichte'), color: GOLD } : null;
  const roundText = `${total ? t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total }) : t('tvCinema.round', 'Runde {{round}}', { round })} · ${sentences.length} ${sentences.length === 1 ? t('tv.story.sentence', 'Satz') : t('tv.story.sentences', 'Sätze')}`;

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: TS.bg, color: TS.text }}>
      <Wash color={isComplete ? GOLD : curColor} strength={0.09} at="50% 40%" />
      {isComplete && sentences.length > 0 && <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[GOLD, TS.accent, TS.cyan, '#ffffff']} count={44} delay={0.3} /></div>}
      <TVTopBar phase={phaseBadge} round={roundText} />

      {/* Die Seite: Titel/Modus, Vorgabe, Saetze — bleibt eingehaengt */}
      <div className="absolute left-1/2 top-[16vh] bottom-[19vh] z-10 flex w-[min(78vw,1400px)] -translate-x-1/2 flex-col rounded-[32px] px-[3vw] py-[3vh]"
        style={{ background: 'linear-gradient(180deg, #100b19, #0b0812)', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.05), 0 0 80px -30px ${isComplete ? GOLD : curColor}`, transition: 'box-shadow 600ms ease' }}>
        <div className="flex flex-wrap items-center gap-4">
          <span aria-hidden style={{ fontSize: lu(4) }}>📖</span>
          <span className="font-black" style={{ fontSize: tvType.title }}>{title || modeLabel}</span>
          <AnimatePresence>
            {isWriting && prompt && (
              <motion.span key={prompt} data-testid="tv-story-prompt" className="rounded-full px-5 py-2 font-bold"
                style={{ fontSize: tvType.body, background: `${GOLD}1a`, boxShadow: `0 0 0 1px ${GOLD}66` }}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                ✨ {prompt}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div ref={scrollRef} className="mt-[2vh] min-h-0 flex-1 overflow-y-auto"
          style={{ maskImage: 'linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)', scrollbarWidth: 'none' }}>
          <div className="flex flex-col gap-[3vh] py-[3vh]">
            {sentences.map((s, i) => {
              const isLast = i === sentences.length - 1;
              const author = byName(s.player);
              return (
                <motion.div key={i} className="flex flex-col gap-[1vh]"
                  initial={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: partyEase.out }}>
                  {s.player && (
                    <span className="flex items-center gap-3">
                      <TVPlayerAvatar id={author?.id} name={s.player} avatar={emojiOnly(author?.avatar)} color={hexOr(author?.color ?? s.playerColor, TS.accent)} size={lu(4.5)} />
                      <span className="font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{s.player}</span>
                    </span>
                  )}
                  <span className="font-bold leading-snug" style={{ fontSize: tvType.title, color: isLast || isComplete ? TS.text : 'rgba(241,243,252,0.55)', transition: 'color 600ms ease' }}>
                    {s.text}
                  </span>
                </motion.div>
              );
            })}

            {/* Wer gerade schreibt / das Handy bekommt — nie der getippte Text */}
            <AnimatePresence mode="wait">
              {(isWriting || isPassing) && currentPlayer && (
                <motion.div key={`${phase}:${currentPlayer.name}`} data-testid="tv-story-author" className="flex items-center gap-4 self-start rounded-full py-2 pl-2 pr-6"
                  style={{ background: TS.raised, boxShadow: `0 0 0 2px ${curColor}, 0 0 40px -10px ${curColor}` }}
                  initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.5, ease: partyEase.out }}>
                  <TVPlayerAvatar id={currentPlayer.id} name={currentPlayer.name} avatar={emojiOnly(currentPlayer.avatar)} color={curColor} size={lu(6.5)} active />
                  <span className="font-bold" style={{ fontSize: tvType.title }}>
                    {isWriting ? t('tvCinema.story.isWriting', '{{name}} schreibt', { name: currentPlayer.name }) : t('tvCinema.story.nextUp', 'Handy an {{name}}', { name: currentPlayer.name })}
                  </span>
                  {isWriting && (
                    <span className="flex gap-1.5" aria-hidden>
                      {[0, 1, 2].map((d) => (
                        <motion.span key={d} className="inline-block rounded-full" style={{ width: lu(1.2), height: lu(1.2), background: TS.text }}
                          animate={ambient ? { opacity: [0.25, 1, 0.25], y: [0, -4, 0] } : { opacity: 0.7 }}
                          transition={ambient ? { repeat: Infinity, duration: 1.2, delay: d * 0.2, ease: 'easeInOut' } : { duration: 0.2 }} />
                      ))}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {isComplete && (
              <motion.div className="pt-[2vh] text-center" initial={reduced ? { opacity: 0 } : { scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: partyEase.out, delay: 0.3 }}>
                <span className="font-black" style={{ fontSize: sentences.length === 0 ? tvType.hero : tvType.display, textShadow: `0 0 40px ${GOLD}88` }}>
                  {t('tv.story.theEnd', 'Ende')}
                </span>
                {sentences.length === 0 && <p className="mt-4 font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{t('tv.story.storyDone', 'Geschichte beendet!')}</p>}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {players.length > 0 && (
        <div className="absolute bottom-[5vh] left-[5vw] right-[5vw] z-10">
          <TVScoreboard party={gameState?.partyNight} players={roster} activeId={activeId} sort="order" />
        </div>
      )}
    </div>
  );
}
