import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { partyEase } from '@/lib/party-motion';
import { tvType } from '../tv-tokens';
import type { PartyNightState } from '../party-types';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPhaseStage from '../cinema/TVPhaseStage';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import { lu } from '../components/tv-lobby-scale';
import TVRoundHud from './broadcast/TVRoundHud';
import TVFinalStandings from './broadcast/TVFinalStandings';
import { emojiAvatar, useDeadlineSeconds } from './broadcast/broadcast-utils';
import { ActiveSpot, CAT, CategoryTitle, RoundEndSpot, WordWall, type CatPlayer, type SaidWord } from './category/CategoryScenes';

interface ViewState {
  partyNight?: PartyNightState;
  players?: CatPlayer[];
  category?: string;
  currentCategory?: string;
  currentLetter?: string;
  loserId?: string | null;
  phase?: string;
  currentPlayerIndex?: number;
  currentRound?: number;
  round?: number;
  roundWords?: SaidWord[];
  timerSeconds?: number;
  turnDeadline?: number;
  clockPaused?: boolean;
}

const EMPTY_PLAYERS: CatPlayer[] = [];
const EMPTY_WORDS: SaidWord[] = [];

/**
 * TVCategoryView — Kategorie (Stadt-Land-Fluss-Kette) auf dem Fernseher.
 *
 * Szenen: Ansage der Kategorie (gross, mit Buchstabe) → Spiel (wer dran ist
 * gross mit Uhr, daneben die Wand der genannten Begriffe) → Rundenende (wer
 * zu langsam war) → Endstand. Alles oeffentlich: Kategorie, Buchstabe und
 * genannte Woerter sehen alle Spieler ohnehin. Titelkarten: cues/category.cue.ts.
 */
export default function TVCategoryView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const phase = gameState?.phase || 'playing';
  const round = gameState?.currentRound || gameState?.round || 1;
  const players = gameState?.players || EMPTY_PLAYERS;
  const words = gameState?.roundWords || EMPTY_WORDS;
  const category = gameState?.currentCategory || gameState?.category || '';
  const letter = gameState?.currentLetter || undefined;
  const current = players[gameState?.currentPlayerIndex ?? 0] ?? null;
  const loser = players.find((p) => p.id != null && p.id === gameState?.loserId) ?? null;
  const total = gameState?.timerSeconds || 0;
  const paused = !!gameState?.clockPaused;
  const seconds = useDeadlineSeconds(phase === 'playing' ? gameState?.turnDeadline : undefined, total, paused);

  const roster: TVScorePlayer[] = players.map((p) => ({
    id: p.id || p.name, name: p.name, color: p.color || CAT.primary, avatar: emojiAvatar(p.avatar), score: p.score ?? 0,
    subtitle: (p.losses ?? 0) > 0 ? `✗ ${p.losses}` : undefined,
    status: phase === 'roundEnd' && loser && (p.id === loser.id) ? 'out' : undefined,
  }));

  const phaseLabel = phase === 'categoryReveal' ? { text: t('tvCinema.category.newCategory', 'Neue Kategorie'), color: CAT.cyan }
    : phase === 'playing' ? { text: t('tvCinema.category.chain', 'Begriffe-Kette'), color: CAT.primary }
      : phase === 'roundEnd' ? { text: t('tvCinema.category.roundOver', 'Runde vorbei'), color: CAT.red } : null;

  let content: ReactNode;
  if (phase === 'gameOver') {
    content = <TVFinalStandings players={players.map((p) => ({ id: p.id, name: p.name, avatar: emojiAvatar(p.avatar), color: p.color, score: p.score ?? 0 }))} accent={CAT.primary} />;
  } else if (phase === 'categoryReveal') {
    content = (
      <div className="flex flex-col items-center gap-[5vh]">
        {category && <CategoryTitle category={category} letter={letter} big />}
        {current && (
          <motion.div className="flex items-center gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out, delay: 0.7 }}>
            <TVPlayerAvatar id={current.id} name={current.name} avatar={emojiAvatar(current.avatar)} color={current.color} size={lu(7)} active />
            <span className="font-bold" style={{ fontSize: tvType.title, color: CAT.text }}>
              {t('tvCinema.category.starts', '{{name}} beginnt', { name: current.name })}
            </span>
          </motion.div>
        )}
      </div>
    );
  } else if (phase === 'roundEnd') {
    content = <RoundEndSpot loser={loser} wordCount={words.length} />;
  } else if (phase === 'playing') {
    content = (
      <div className="flex h-full w-full flex-col items-center gap-[3vh]">
        {category ? <CategoryTitle category={category} letter={letter} big={false} /> : null}
        <div className="grid min-h-0 w-full flex-1 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-[2.4vw]">
          <ActiveSpot player={current} seconds={seconds} fraction={seconds !== null && total > 0 ? seconds / total : 1} paused={paused} />
          <WordWall words={words} players={players} />
        </div>
      </div>
    );
  } else {
    content = (
      <motion.span className="font-bold" style={{ fontSize: tvType.title, color: CAT.dim }}
        animate={ambient ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.8 }} transition={ambient ? { repeat: Infinity, duration: 2.2 } : { duration: 0.3 }}>
        {t('tvCinema.category.preparing', 'Die Kategorie wird gezogen …')}
      </motion.span>
    );
  }

  const glow = phase === 'roundEnd' ? CAT.red : current?.color || CAT.primary;
  return (
    <div className="relative h-screen overflow-hidden" style={{ background: CAT.bg }} data-testid="tv-category" data-phase={phase}>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 60% 55% at ${phase === 'playing' ? '28% 62%' : '50% 45%'}, ${glow}24 0%, transparent 70%)` }}
        animate={ambient ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.85 }}
        transition={ambient ? { repeat: Infinity, duration: 3.6, ease: 'easeInOut' } : { duration: 0.3 }} />
      {phase !== 'gameOver' && <TVRoundHud phase={phaseLabel} round={round} />}
      <TVPhaseStage phase={phase} className={`flex flex-col items-center justify-center px-[5vw] ${phase === 'gameOver' ? '' : 'pb-[17vh] pt-[15vh]'}`}>
        {content}
      </TVPhaseStage>
      {phase !== 'gameOver' && players.length > 0 && (
        <motion.div className="absolute bottom-[5vh] left-[5vw] right-[5vw] z-10"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out }}>
          <TVScoreboard party={gameState?.partyNight} players={roster} activeId={phase === 'playing' ? (current?.id || current?.name || null) : null} sort="score" />
        </motion.div>
      )}
    </div>
  );
}
