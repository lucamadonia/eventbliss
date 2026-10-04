import type { PartyNightState } from '../party-types';
import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { translateReactionWord } from '../../wordpress/word-content';
import { partyMotion } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvType } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { riseIn, staggerChildren } from '../cinema/scene';
import { lu } from '../components/tv-lobby-scale';
import WordPressStage from './wordpress/WordPressStage';
import { WordPressGameOver, WordPressRanking, rankWordPress } from './wordpress/WordPressStandings';
import { WP, accuracyOf, emojiOnly, wpColor, wpPid, type WPPlayer } from './wordpress/wp-tv';

interface ViewState {
  partyNight?: PartyNightState;
  players?: WPPlayer[];
  contentLanguage?: string;
  currentWord?: string;
  displayColor?: string;
  forbiddenWord?: string;
  mode?: string;
  phase?: string;
  currentPlayerIndex?: number;
  liveCombo?: number;
  liveScore?: number;
  round?: number;
  totalRounds?: number;
  wordIndex?: number;
  wordsPerTurn?: number;
}

/**
 * TVWordPressView — Fernseher fuer „Drück das Wort“.
 *
 * Szenen je Phase (TVPhaseStage): laufender Zug (eine durchgehende Szene,
 * Spielerwechsel animieren im Panel), Zwischenstand, Siegerehrung.
 * Titelkarten: cinema/cues/wordpress.cue.ts („Lena ist dran“ je Zug).
 *
 * Oeffentlich: Regel, verbotenes Wort, Tintenfarbe (wie am Handy).
 * Privat bleibt, ob ein Wort ein Treffer ist (isTarget) — wird nie gesendet.
 */
const EMPTY: WPPlayer[] = [];

function modeLabel(mode: string, t: (k: string, d: string) => string): string {
  switch (mode) {
    case 'kategorie': return t('games.wordpress.modes.kategorie', 'Kategorie');
    case 'stroop': return t('games.wordpress.modes.stroop', 'Stroop');
    case 'verboten': return t('games.wordpress.modes.verboten', 'Verboten');
    case 'speed-rush': return t('games.wordpress.modes.speedRush', 'Speed Rush');
    default: return mode;
  }
}

export default function TVWordPressView({ gameState }: { gameState: ViewState }) {
  const { t, i18n } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'playing';
  const round: number = gameState?.round ?? 1;
  const totalRounds: number = gameState?.totalRounds ?? 5;
  const mode: string = gameState?.mode || 'kategorie';
  const players: WPPlayer[] = gameState?.players || EMPTY;
  const idx: number = gameState?.currentPlayerIndex ?? 0;
  const word = translateReactionWord(gameState?.currentWord || '', gameState?.contentLanguage, i18n.language);
  const wordIndex: number = gameState?.wordIndex ?? 0;
  const wordsPerTurn: number = gameState?.wordsPerTurn ?? 12;
  const combo: number = gameState?.liveCombo ?? 0;
  const liveScore: number | null = typeof gameState?.liveScore === 'number' && Number.isFinite(gameState.liveScore) ? gameState.liveScore : null;

  const active = players[idx];
  // Live-Punkte des laufenden Zuges schlagen den (erst am Zugende aktualisierten) Spielerstand.
  const activeScore = phase === 'playing' && liveScore !== null ? liveScore : active?.score ?? 0;
  // Die Host-Farbe traegt die Stroop-Regel — eine eigene Farbe wuerde ein anderes Raetsel zeigen.
  const wordColor = typeof gameState?.displayColor === 'string' && gameState.displayColor ? gameState.displayColor : '#d5f46a';
  const forbiddenWord = translateReactionWord(typeof gameState?.forbiddenWord === 'string' ? gameState.forbiddenWord : '—', gameState?.contentLanguage, i18n.language);
  const rule = mode === 'stroop' ? t('games.wordpress.promptStroop')
    : mode === 'verboten' ? t('games.wordpress.promptVerboten', { word: forbiddenWord })
      : mode === 'speed-rush' ? t('games.wordpress.promptSpeedRush')
        : t('games.wordpress.promptKategorie');

  const roster: TVScorePlayer[] = players.map((p, i) => {
    const isActive = i === idx && phase === 'playing';
    const acc = accuracyOf(p);
    return {
      id: wpPid(p, i), name: p.name, color: wpColor(p, i), avatar: emojiOnly(p.avatar),
      score: isActive ? activeScore : p.score,
      subtitle: isActive ? (combo > 0 ? `🔥 ${combo}` : (acc !== null ? `${acc} %` : undefined)) : (p.maxCombo > 0 ? `${p.maxCombo}× 🔥` : undefined),
      status: isActive ? 'active' : 'waiting',
    };
  });

  const topBar = (label: string, color: string, showRound = true) => (
    <div className="absolute left-[5vw] right-[5vw] top-[5vh] z-10 flex items-center justify-between">
      <motion.div className="flex items-center gap-3 rounded-full px-6 py-2" style={{ background: `${color}1f`, border: `1px solid ${color}4d` }}
        variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate">
        <span aria-hidden style={{ fontSize: lu(2.4) }}>👆</span>
        <span className="font-bold" style={{ fontSize: lu(2.4), color: '#fff' }}>{label}</span>
      </motion.div>
      {showRound && (
        <div className={`${tvPanel} px-5 py-2`}>
          <span className="font-bold tabular-nums" style={{ fontSize: lu(2.4), color: WP.dim }}>{t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total: totalRounds })}</span>
        </div>
      )}
    </div>
  );
  const strip = () => (players.length > 0 ? (
    <div className="absolute bottom-[5vh] left-[5vw] right-[5vw] z-10">
      <TVScoreboard party={gameState?.partyNight} players={roster} activeId={wpPid(active, idx)} sort="score" />
    </div>
  ) : null);

  let content: ReactNode;
  if (phase === 'playing') {
    content = (
      <>
        {topBar(`${t('games.wordpress.title', 'Drück das Wort')} · ${modeLabel(mode, t)}`, WP.primary)}
        <div className="absolute inset-x-[5vw] bottom-[16vh] top-[14vh]">
          <WordPressStage player={active} playerKey={wpPid(active, idx)} color={wpColor(active, idx)} score={activeScore} combo={combo}
            word={word} wordKey={`${idx}-${wordIndex}-${word}`} wordColor={wordColor} stroop={mode === 'stroop'} rule={rule}
            wordIndex={wordIndex} wordsPerTurn={wordsPerTurn} />
        </div>
        {strip()}
      </>
    );
  } else if (phase === 'roundEnd') {
    content = (
      <>
        {topBar(t('games.wordpress.interimStandings', 'Zwischenstand'), WP.secondary)}
        <motion.div className="flex w-full max-w-[min(64vw,1100px)] flex-col items-center" style={{ gap: lu(3) }} variants={staggerChildren(120)} initial="initial" animate="animate">
          <motion.h1 variants={riseIn(reduced)} className="text-center font-black leading-tight" style={{ fontSize: tvType.display, color: WP.text }}>
            {t('tvCinema.wordpress.roundDone', 'Runde {{round}} geschafft', { round })}
          </motion.h1>
          <WordPressRanking ranked={rankWordPress(players)} compact={players.length > 5} />
        </motion.div>
      </>
    );
  } else if (phase === 'gameOver') {
    content = (
      <>
        {topBar(t('tvCinema.wordpress.gameOver', 'Spielende'), WP.gold, false)}
        <WordPressGameOver players={players} />
      </>
    );
  } else {
    content = (
      <motion.div className="flex items-center gap-4" animate={ambient ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.8 }}
        transition={ambient ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}>
        <span aria-hidden style={{ fontSize: tvType.title }}>👆</span>
        <span className="font-semibold" style={{ fontSize: tvType.body, color: WP.dim }}>{t('tvCinema.wordpress.preparing', 'Gleich geht’s los …')}</span>
      </motion.div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: WP.bg, color: WP.text }}>
      <TVPhaseStage phase={phase} className="flex flex-col items-center justify-center">
        {content}
      </TVPhaseStage>
    </div>
  );
}
