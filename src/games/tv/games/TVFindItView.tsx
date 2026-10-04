import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { partyEase, playerGlow } from '@/lib/party-motion';
import { tvType } from '../tv-tokens';
import type { PartyNightState } from '../party-types';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPhaseStage from '../cinema/TVPhaseStage';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import { lu } from '../components/tv-lobby-scale';
import TVRoundHud, { TVHudChip } from './broadcast/TVRoundHud';
import TVTimerRing from './broadcast/TVTimerRing';
import TVFinalStandings from './broadcast/TVFinalStandings';
import { emojiAvatar } from './broadcast/broadcast-utils';
import { Board, DiffBoards, FI, GeoScene, OptionTiles } from './findit/FindItScenes';

interface TVPlayer { id: string; name: string; color?: string; avatar?: string; score: number; streak?: number; bestStreak?: number }
interface ViewState {
  partyNight?: PartyNightState;
  players?: TVPlayer[];
  geoName?: string; grid?: string; gridA?: string; gridB?: string; mode?: string; phase?: string; question?: string; sceneName?: string;
  correctOption?: number | null; diffCount?: number; questionCountdown?: number; questionIdx?: number; round?: number;
  studyCountdown?: number; totalQuestions?: number; totalRounds?: number; currentPlayerIdx?: number;
  answerCorrect?: boolean | null; diffs?: number[]; foundDiffs?: number[]; imagesAvailable?: boolean; optionObjects?: string[]; options?: string[];
}

const MODE_ICON: Record<string, string> = { memory: '🧠', speed: '⚡', unterschiede: '🔍', karte: '🗺️', streetview: '📍' };
const EMPTY: never[] = [];

/** Groesster bisher gesehener Wert je Szene — als 100 % fuer den Uhr-Ring. */
function useMaxPerScene(value: number, scene: string): number {
  const ref = useRef({ scene, max: value });
  if (ref.current.scene !== scene) ref.current = { scene, max: value };
  else if (value > ref.current.max) ref.current.max = value;
  return Math.max(1, ref.current.max);
}

/**
 * TVFindItView — „Wo ist was?“ auf dem Fernseher (memory · speed ·
 * unterschiede · karte · streetview). Alle spielen mit, also zeigt der TV
 * dieselben Bretter und Antworten wie die Handys.
 *
 * Szenen: Einpraegen → je Frage eine Szene (Frage + Kacheln, Aufloesung in
 * derselben Szene) → Rundenende → Endstand. Geheim bis zur Aufloesung:
 * `correctOption`, `diffs` (Zielfelder) und der Ort bei Karte/Street View —
 * die Bruecke liefert sie erst dann; die Ansicht wertet sie nur dort aus.
 */
export default function TVFindItView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const phase = gameState?.phase || 'study';
  const mode = gameState?.mode || 'memory';
  const round = gameState?.round ?? 0;
  const players = gameState?.players || EMPTY;
  const qIdx = gameState?.questionIdx ?? 0;
  const showAnswer = phase === 'answer' || phase === 'roundEnd';
  const isGeo = mode === 'karte' || mode === 'streetview';
  const isDiff = mode === 'unterschiede';
  const raw = players[gameState?.currentPlayerIdx ?? -1];
  const active = raw ? { ...raw, avatar: emojiAvatar(raw.avatar) } : null;

  const scene = phase === 'gameOver' ? 'gameOver'
    : isGeo ? `geo-${round}-${showAnswer ? 'end' : 'play'}`
      : isDiff ? `diff-${round}`
        : phase === 'study' ? `study-${round}`
          : phase === 'roundEnd' ? `end-${round}` : `q-${round}-${qIdx}`;

  const countdown = phase === 'study' ? gameState?.studyCountdown ?? 0 : phase === 'question' ? gameState?.questionCountdown ?? 0 : 0;
  const countMax = useMaxPerScene(countdown, scene);
  const modeLabel = t(`woIstWas.modes.${mode}`, mode);

  const roster: TVScorePlayer[] = players.map((p) => ({
    id: p.id, name: p.name, color: p.color || FI.primary, avatar: emojiAvatar(p.avatar), score: p.score,
    subtitle: (p.streak ?? 0) > 1 ? `🔥${p.streak}` : undefined,
  }));

  const phaseLabel = phase === 'study' ? { text: t('tvCinema.findIt.memorize', 'Einprägen'), color: FI.primary }
    : phase === 'question' || phase === 'streetviewPlay' ? { text: t('tvCinema.findIt.guessAlong', 'Mitraten'), color: FI.secondary }
      : phase === 'answer' ? { text: t('tvCinema.findIt.reveal', 'Auflösung'), color: FI.good }
        : phase === 'roundEnd' ? { text: t('tvCinema.findIt.roundOver', 'Runde vorbei'), color: FI.amber }
          : phase === 'karteSetup' ? { text: t('tvCinema.findIt.setup', 'Vorbereitung'), color: FI.dim } : null;

  let content: ReactNode;
  if (scene === 'gameOver') {
    content = <TVFinalStandings players={players.map((p) => ({ id: p.id, name: p.name, avatar: emojiAvatar(p.avatar), color: p.color, score: p.score }))} accent={FI.primary} />;
  } else if (!isGeo && gameState?.imagesAvailable === false) {
    content = <p role="status" className="font-semibold" style={{ fontSize: tvType.body, color: FI.dim }}>{t('games.findit.visual.loading')}</p>;
  } else if (isGeo) {
    content = <GeoScene mode={mode} geoName={showAnswer ? gameState?.geoName || '' : ''} showAnswer={showAnswer} ambient={ambient} />;
  } else if (isDiff) {
    content = <DiffBoards gridA={gameState?.gridA || ''} gridB={gameState?.gridB || ''} diffs={showAnswer ? gameState?.diffs || EMPTY : EMPTY}
      found={gameState?.foundDiffs || EMPTY} count={gameState?.diffCount ?? 0} />;
  } else if (phase === 'study') {
    content = (
      <div className="flex flex-col items-center gap-[2.4vh]">
        <h1 className="font-black" style={{ fontSize: lu(5.2), color: FI.text }}>{t('tvCinema.findIt.memorizeBoard', 'Prägt euch das Brett ein!')}</h1>
        {gameState?.grid && <Board grid={gameState.grid} maxH="56vh" />}
      </div>
    );
  } else if (phase === 'roundEnd') {
    content = (
      <div className="flex flex-col items-center gap-[2.4vh]">
        <h1 className="font-black" style={{ fontSize: lu(5.2), color: FI.text }}>{t('tvCinema.findIt.roundOver', 'Runde vorbei')}</h1>
        {gameState?.grid && <Board grid={gameState.grid} maxH="50vh" />}
      </div>
    );
  } else {
    const correct = phase === 'answer' ? gameState?.correctOption ?? null : null;
    const total = gameState?.totalQuestions ?? 0;
    content = (
      <div className="flex w-full flex-col items-center gap-[2.6vh]">
        {(mode === 'speed' || showAnswer) && gameState?.grid && <Board grid={gameState.grid} maxH="20vh" />}
        {total > 0 && (
          <span className="font-bold tabular-nums" style={{ fontSize: tvType.label, color: FI.dim }}>
            {t('tvCinema.findIt.questionOf', 'Frage {{n}} von {{total}}', { n: qIdx + 1, total })}
          </span>
        )}
        <motion.h1 key={gameState?.question || qIdx} className="max-w-[80vw] text-balance text-center font-black leading-tight" style={{ fontSize: lu(5.2), color: FI.text }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out }}>
          {gameState?.question || t('tvCinema.findIt.lookAtPhone', 'Schaut auf eure Handys')}
        </motion.h1>
        {(gameState?.options?.length ?? 0) > 0 && <OptionTiles options={gameState!.options!} objects={gameState?.optionObjects || EMPTY} correct={correct} />}
        {phase === 'answer' && gameState?.answerCorrect != null && active && (
          <motion.div className="flex items-center gap-4 rounded-full py-1.5 pe-6 ps-1.5" style={{ background: '#16101f', boxShadow: playerGlow(gameState.answerCorrect ? FI.good : FI.bad, 'active') }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.45, delay: 0.4 }}>
            <TVPlayerAvatar id={active.id} name={active.name} avatar={active.avatar} color={active.color} size={lu(6)} />
            <span className="font-black" style={{ fontSize: tvType.body, color: FI.text }}>
              {gameState.answerCorrect ? t('tvCinema.findIt.playerRight', '{{name}} liegt richtig!', { name: active.name }) : t('tvCinema.findIt.playerWrong', '{{name}} liegt daneben', { name: active.name })}
            </span>
          </motion.div>
        )}
      </div>
    );
  }

  const hudRight = scene !== 'gameOver' ? (
    <>
      <TVHudChip color={FI.secondary}>{MODE_ICON[mode] ?? '🎯'} {modeLabel}</TVHudChip>
      {countdown > 0 && <TVTimerRing seconds={countdown} fraction={countdown / countMax} size={lu(8)} />}
    </>
  ) : null;

  const glow = showAnswer ? FI.good : phase === 'study' ? FI.primary : FI.secondary;
  return (
    <div className="relative h-screen overflow-hidden" style={{ background: FI.bg }} data-testid="tv-findit" data-phase={phase} data-mode={mode}>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 70% 55% at 50% 45%, ${glow}1f 0%, transparent 70%)`, transition: 'background 600ms ease' }}
        animate={ambient ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.85 }}
        transition={ambient ? { repeat: Infinity, duration: 4, ease: 'easeInOut' } : { duration: 0.3 }} />
      {scene !== 'gameOver' && <TVRoundHud phase={phaseLabel} round={round} total={gameState?.totalRounds} right={hudRight} />}
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
