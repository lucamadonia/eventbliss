import { useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { partyEase } from '@/lib/party-motion';
import type { PartyNightState } from '../party-types';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { lu } from '../components/tv-lobby-scale';
import TVRoundHud, { TVHudChip } from './broadcast/TVRoundHud';
import TVTimerRing from './broadcast/TVTimerRing';
import TVFinalStandings from './broadcast/TVFinalStandings';
import { emojiAvatar } from './broadcast/broadcast-utils';
import { EG, EmojiPuzzle, ReadySpot, type EmojiPlayer } from './emojiguess/EmojiStage';

interface ViewState {
  partyNight?: PartyNightState;
  players?: EmojiPlayer[];
  /** Nur in `reveal` gefuellt (emojiTvPuzzle). */
  answer?: string;
  category?: string;
  emojis?: string;
  phase?: string;
  currentPlayerIdx?: number;
  currentRound?: number;
  maxTime?: number;
  timeLeft?: number;
  totalRounds?: number;
}

const EMPTY: EmojiPlayer[] = [];

/**
 * TVEmojiGuessView — Emoji-Raten auf dem Fernseher.
 *
 * Szenen: Bereit (Spotlight auf den Ratenden, Raetsel verdeckt) → Raetsel
 * (Emojis gross, Uhr als Ring) mit Aufloesung in derselben Szene → Endstand.
 * Die Loesung schickt die Bruecke nur in `reveal`; die Ansicht zeigt sie auch
 * nur dort. Titelkarten/Toene: cues/emojiguess.cue.ts.
 */
export default function TVEmojiGuessView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const phase = gameState?.phase || 'playing';
  const players = gameState?.players || EMPTY;
  const round = gameState?.currentRound ?? 1;
  const total = gameState?.totalRounds;
  const raw = players[gameState?.currentPlayerIdx ?? 0] ?? null;
  const active = raw ? { ...raw, avatar: emojiAvatar(raw.avatar) } : null;
  const revealed = phase === 'reveal' || phase === 'roundEnd';
  const answer = phase === 'reveal' ? gameState?.answer || '' : '';
  const timeLeft = typeof gameState?.timeLeft === 'number' ? gameState.timeLeft : null;
  const maxTime = gameState?.maxTime || 30;
  const scene = phase === 'gameOver' ? 'gameOver' : phase === 'ready' || phase === 'setup' ? `ready-${round}` : `round-${round}`;

  const roster: TVScorePlayer[] = useMemo(() => players.map((p) => ({
    id: p.id, name: p.name, color: p.color || EG.primary, score: p.score, avatar: emojiAvatar(p.avatar),
    subtitle: (p.streak ?? 0) > 1 ? `🔥${p.streak}` : undefined,
  })), [players]);

  const phaseLabel = phase === 'ready' ? { text: t('tvCinema.emojiGuess.getSet', 'Gleich geht’s los'), color: EG.amber }
    : phase === 'playing' ? { text: t('tvCinema.emojiGuess.guessingNow', 'Raten läuft'), color: EG.primary }
      : revealed ? { text: t('tvCinema.emojiGuess.reveal', 'Auflösung'), color: EG.cyan } : null;

  let content: ReactNode;
  if (scene === 'gameOver') {
    content = <TVFinalStandings players={players.map((p) => ({ id: p.id, name: p.name, avatar: emojiAvatar(p.avatar), color: p.color, score: p.score ?? 0 }))} accent={EG.primary} />;
  } else if (scene.startsWith('ready')) {
    content = <ReadySpot player={active} />;
  } else {
    content = <EmojiPuzzle emojis={gameState?.emojis || ''} answer={answer} revealed={revealed && !!answer} ambient={ambient} player={active} />;
  }

  const hudRight = scene.startsWith('round') ? (
    <>
      {gameState?.category && <TVHudChip>{gameState.category}</TVHudChip>}
      {phase === 'playing' && timeLeft !== null && <TVTimerRing seconds={Math.ceil(timeLeft)} fraction={timeLeft / maxTime} size={lu(8)} />}
    </>
  ) : null;

  const glow = revealed ? EG.cyan : active?.color || EG.primary;
  return (
    <div className="relative h-screen overflow-hidden" style={{ background: EG.bg }} data-testid="tv-emojiguess" data-phase={phase}>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 65% 55% at 50% 42%, ${glow}22 0%, transparent 70%)`, transition: 'background 600ms ease' }}
        animate={ambient ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.85 }}
        transition={ambient ? { repeat: Infinity, duration: 4, ease: 'easeInOut' } : { duration: 0.3 }} />
      {scene !== 'gameOver' && <TVRoundHud phase={phaseLabel} round={round} total={total} right={hudRight} />}
      <TVPhaseStage phase={scene} className={`flex flex-col items-center justify-center px-[5vw] ${scene === 'gameOver' ? '' : 'pb-[17vh] pt-[14vh]'}`}>
        {content}
      </TVPhaseStage>
      {scene !== 'gameOver' && roster.length > 0 && (
        <motion.div className="absolute bottom-[5vh] left-[5vw] right-[5vw] z-10"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out }}>
          <TVScoreboard party={gameState?.partyNight} players={roster} activeId={active?.id ?? null} sort="score" />
        </motion.div>
      )}
    </div>
  );
}
