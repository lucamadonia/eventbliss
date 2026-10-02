import { useMemo, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import type { PartyNightState } from '../party-types';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVBurst from '../cinema/TVBurst';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { riseIn, staggerChildren } from '../cinema/scene';
import { lu } from '../components/tv-lobby-scale';
import { tvType } from '../tv-tokens';
import { ChoiceScene, RevealScene, SpinScene, TD, VoteScene, type TDPlayer } from './truthdare/TruthDareScenes';
import { TS, TVTopBar, Wash, alpha, emojiOnly, hexOr } from './turn-stage/kit';

interface ViewState {
  partyNight?: PartyNightState;
  players?: Partial<TDPlayer>[];
  phase?: string;
  task?: string;
  activeIdx?: number;
  currentRound?: number;
  maxTime?: number;
  timeLeft?: number;
  totalRounds?: number;
  choiceType?: 'truth' | 'dare' | null;
  voteTally?: { yes: number; no: number };
}

/**
 * TVTruthDareView — Wahrheit oder Pflicht auf dem Fernseher.
 *
 * Szenen: Drehen (alle im Kreis) → Zug (Person links im Rampenlicht, Mitte
 * wechselt Wahl → Aufgabe → Abstimmung) → Endstand. Die Aufgabe ist oeffentlich
 * (alle sollen sie hoeren); geheim bleiben die getippte Wahrheits-Antwort (wird
 * nie gesendet) und einzelne Stimmen — nur die Summe Ja/Nein erscheint.
 */
function toRoster(players: TDPlayer[], t: TFunction): TVScorePlayer[] {
  return players.map((p) => ({
    id: p.id, name: p.name, color: p.color, score: p.score, avatar: p.avatar,
    subtitle: t('tv.truthdare.wpCount', { w: p.truthCount, p: p.dareCount, defaultValue: '{{w}}× W · {{p}}× P' }),
  }));
}

export default function TVTruthDareView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();

  const phase: string = gameState?.phase || 'spin';
  const players = useMemo<TDPlayer[]>(() => (gameState?.players || []).map((p, i) => ({
    id: String(p.id ?? p.name ?? i), name: String(p.name ?? ''), color: hexOr(p.color, TS.accent), avatar: emojiOnly(p.avatar),
    score: Number(p.score ?? 0), truthCount: Number(p.truthCount ?? 0), dareCount: Number(p.dareCount ?? 0),
  })), [gameState?.players]);
  const activeIdx = gameState?.activeIdx ?? 0;
  const currentRound = gameState?.currentRound ?? 1;
  const totalRounds = gameState?.totalRounds ?? 0;
  const choiceType = gameState?.choiceType ?? null;
  const task = gameState?.task || '';
  const tally = gameState?.voteTally || { yes: 0, no: 0 };
  const active = players[activeIdx];
  const isTruth = choiceType === 'truth';
  const tone = choiceType ? (isTruth ? TD.truth : TD.dare) : active?.color ?? TS.accent;

  const layout = phase === 'spin' || phase === 'setup' ? 'spin' : phase === 'gameOver' ? 'gameOver' : 'turn';
  const phaseBadge = {
    spin: { label: t('tvCinema.truthdare.spin', 'Wer ist dran?'), color: TS.accent },
    choice: { label: t('tvCinema.truthdare.choice', 'Wahl'), color: active?.color ?? TS.accent },
    reveal: { label: isTruth ? t('games.truthdare.truth', 'Wahrheit') : t('games.truthdare.dare', 'Pflicht'), color: tone },
    vote: { label: t('tvCinema.truthdare.vote', 'Abstimmung'), color: TS.good },
    gameOver: { label: t('tvCinema.truthdare.final', 'Endstand'), color: TS.gold },
  }[phase] ?? null;

  let center: ReactNode = null;
  if (phase === 'choice') center = <ChoiceScene name={active?.name ?? ''} />;
  else if (phase === 'reveal') center = <RevealScene isTruth={isTruth} task={task} timeLeft={gameState?.timeLeft ?? 0} maxTime={gameState?.maxTime ?? 0} />;
  else if (phase === 'vote') center = <VoteScene task={task} yes={tally.yes} no={tally.no} />;

  let content: ReactNode;
  if (layout === 'spin') {
    content = <SpinScene players={players} />;
  } else if (layout === 'gameOver') {
    const winner = [...players].sort((a, b) => b.score - a.score)[0];
    content = (
      <>
        <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[TS.gold, TD.truth, TD.dare, '#ffffff']} count={60} delay={0.2} /></div>
        <motion.div className="relative z-10 flex w-full flex-col items-center gap-[4vh]" variants={staggerChildren(120)} initial="initial" animate="animate">
          {winner && (
            <motion.div variants={riseIn(reduced)} className="flex flex-col items-center gap-[2vh] rounded-[50%] px-[8vw] py-[3vh]"
              style={{ background: 'radial-gradient(ellipse closest-side, #060810 62%, rgba(6,8,16,0.85) 80%, transparent 100%)' }}>
              <TVPlayerAvatar id={winner.id} name={winner.name} avatar={winner.avatar} color={winner.color} size={lu(16)} active />
              <span className="font-black" style={{ fontSize: tvType.display }}>{t('tvCinema.truthdare.winner', '{{name}} gewinnt!', { name: winner.name })}</span>
            </motion.div>
          )}
          <motion.div variants={riseIn(reduced)} className="w-full max-w-[80vw]">
            <TVScoreboard party={gameState?.partyNight} players={toRoster(players, t)} sort="score" />
          </motion.div>
        </motion.div>
      </>
    );
  } else {
    content = (
      <div className="grid h-full w-full grid-cols-[minmax(0,24vw)_1fr] items-center gap-[4vw]">
        <AnimatePresence mode="wait">
          {active && (
            <motion.div key={active.id} data-testid="tv-truthdare-active"
              className="flex flex-col items-center gap-[2vh] rounded-[28px] px-[2vw] py-[5vh] text-center"
              style={{ background: `linear-gradient(170deg, ${active.color}${alpha(0.18)}, ${TS.raised} 60%)`, boxShadow: `0 0 0 2px ${active.color}, 0 0 60px -10px ${active.color}aa` }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: partyEase.out }}>
              <TVPlayerAvatar id={active.id} name={active.name} avatar={active.avatar} color={active.color} size={lu(20)} active />
              <span className="font-black leading-tight" style={{ fontSize: tvType.display }}>{active.name}</span>
              <span className="font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{t('tv.truthdare.isUp', 'ist dran')}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative h-full">
          <TVPhaseStage phase={phase} className="flex items-center justify-center">{center}</TVPhaseStage>
        </div>
      </div>
    );
  }

  const showStrip = layout !== 'gameOver' && players.length > 0;
  return (
    <div className="relative h-screen overflow-hidden" style={{ background: TS.bg, color: TS.text }}>
      <Wash color={layout === 'gameOver' ? TS.gold : tone} strength={0.11} at={layout === 'turn' ? '62% 50%' : '50% 50%'} />
      <TVTopBar phase={phaseBadge} round={totalRounds > 0
        ? t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round: currentRound, total: totalRounds })
        : t('tvCinema.round', 'Runde {{round}}', { round: currentRound })} />
      <div className={`absolute left-[5vw] right-[5vw] top-[16vh] ${showStrip ? 'bottom-[19vh]' : 'bottom-[6vh]'}`}>
        <TVPhaseStage phase={layout} className="flex items-center justify-center">{content}</TVPhaseStage>
      </div>
      {showStrip && (
        <div className="absolute bottom-[5vh] left-[5vw] right-[5vw]">
          <TVScoreboard party={gameState?.partyNight} players={toRoster(players, t)} activeId={layout === 'turn' ? active?.id ?? null : null} sort="order" />
        </div>
      )}
    </div>
  );
}
