import { useEffect, useMemo, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import type { PartyNightState } from '../party-types';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVBurst from '../cinema/TVBurst';
import TVPhaseStage from '../cinema/TVPhaseStage';
import { useTVCue } from '../cinema/tv-cue-context';
import { riseIn, staggerChildren } from '../cinema/scene';
import { lu } from '../components/tv-lobby-scale';
import { tvPanel, tvType } from '../tv-tokens';
import WhoAmIRound, { type WhoAmIPlayer } from './whoami/WhoAmIRound';
import { TS, TVTopBar, Wash, emojiOnly, hexOr } from './turn-stage/kit';

interface ViewState {
  partyNight?: PartyNightState;
  players?: Partial<WhoAmIPlayer>[];
  currentQuestion?: string;
  phase?: string;
  activeIdx?: number;
  currentRound?: number;
  maxQuestions?: number;
  totalRounds?: number;
  guessCorrect?: boolean | null;
  voteTally?: { yes: number; no: number; maybe: number };
}

/**
 * TVWhoAmIView — „Wer bin ich?“ auf dem Fernseher.
 *
 * HARTES GEHEIMNIS: Die Figur einer Person ist das ganze Spiel. Die Bruecke
 * (`whoamiTVPlayers`) schickt sie erst im Endstand; diese Ansicht liest sie
 * zusaetzlich NUR in `gameOver`. Einzelne Antworten erscheinen nie — nur die
 * Summe Ja/Vielleicht/Nein.
 *
 * Szenen: Verteilen → Fragerunde (asking/answerVote/guessing teilen eine
 * Buehne) → Urteil → Endstand, jeweils mit TVPhaseStage.
 */
function toRoster(players: WhoAmIPlayer[], t: TFunction): TVScorePlayer[] {
  return players.map((p) => ({
    id: p.id, name: p.name, color: p.color, score: p.score, avatar: p.avatar,
    status: p.guessedCorrectly ? 'done' : p.eliminated ? 'out' : undefined,
    subtitle: t('tv.whoami.questionsCount', { n: p.questionsAsked, defaultValue: '{{n}} Fragen' }),
  }));
}

const ROUND_PHASES = new Set(['asking', 'answerVote', 'guessing']);

export default function TVWhoAmIView({ gameState }: { gameState: ViewState }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ambient = useAmbientMotion();
  const cue = useTVCue();

  const phase: string = gameState?.phase || 'assign';
  const isOver = phase === 'gameOver';
  const players = useMemo<WhoAmIPlayer[]>(() => (gameState?.players || []).map((p, i) => ({
    id: String(p.id ?? p.name ?? i),
    name: String(p.name ?? ''),
    color: hexOr(p.color, TS.accent),
    avatar: emojiOnly(p.avatar),
    score: Number(p.score ?? 0),
    // Geheimnis: die Figur wird nur im Endstand ueberhaupt gelesen.
    character: isOver ? String(p.character ?? '') : '',
    questionsAsked: Number(p.questionsAsked ?? 0),
    guessedCorrectly: !!p.guessedCorrectly,
    eliminated: !!p.eliminated,
  })), [gameState?.players, isOver]);
  const activeIdx = gameState?.activeIdx ?? 0;
  const currentRound = gameState?.currentRound ?? 1;
  const totalRounds = gameState?.totalRounds ?? 1;
  const guessCorrect = gameState?.guessCorrect ?? null;
  const tally = gameState?.voteTally || { yes: 0, no: 0, maybe: 0 };
  const active = players[activeIdx];

  useEffect(() => {
    if (phase !== 'guessResult' || guessCorrect === null) return;
    cue.play(guessCorrect ? 'correct' : 'wrong');
  }, [phase, guessCorrect]); // eslint-disable-line react-hooks/exhaustive-deps

  const layout = ROUND_PHASES.has(phase) ? 'round' : phase;
  const phaseBadge = {
    assign: { label: t('tvCinema.whoami.assign', 'Figuren verteilen'), color: TS.accent },
    asking: { label: t('tvCinema.whoami.asking', 'Fragen'), color: active?.color ?? TS.accent },
    answerVote: { label: t('tvCinema.whoami.answering', 'Antworten'), color: TS.cyan },
    guessing: { label: t('tvCinema.whoami.guessing', 'Raten'), color: TS.gold },
    guessResult: { label: t('tvCinema.whoami.verdict', 'Urteil'), color: guessCorrect ? TS.good : TS.bad },
    gameOver: { label: t('tvCinema.whoami.final', 'Endstand'), color: TS.gold },
  }[phase] ?? null;

  let content: ReactNode;
  if (layout === 'assign') {
    content = (
      <motion.div className="flex flex-col items-center gap-[5vh]" variants={staggerChildren(90)} initial="initial" animate="animate">
        <motion.h1 variants={riseIn(reduced)} className="max-w-[24ch] text-center font-black leading-tight" style={{ fontSize: tvType.display }}>
          {t('tvCinema.whoami.assignHeadline', 'Jeder bekommt eine geheime Figur')}
        </motion.h1>
        <motion.div className="flex max-w-[86vw] flex-wrap justify-center gap-[1.6vw]" variants={staggerChildren(80)}>
          {players.map((p) => (
            <motion.div key={p.id} variants={riseIn(reduced)} className={`${tvPanel} flex flex-col items-center gap-3 px-[1.8vw] py-[2.6vh]`} style={{ minWidth: lu(18) }}>
              <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(9)} />
              <span className="font-bold" style={{ fontSize: tvType.body }}>{p.name}</span>
              <motion.span aria-hidden style={{ fontSize: lu(3.6) }}
                animate={ambient ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }} transition={ambient ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : { duration: 0.2 }}>🎭</motion.span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  } else if (layout === 'round') {
    content = <WhoAmIRound phase={phase} active={active} question={gameState?.currentQuestion || ''} tally={tally} maxQuestions={gameState?.maxQuestions ?? 20} />;
  } else if (layout === 'guessResult') {
    const tone = guessCorrect ? TS.good : TS.bad;
    content = (
      <>
        {guessCorrect && <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[TS.good, TS.gold, active?.color ?? TS.accent, '#ffffff']} count={56} delay={0.2} /></div>}
        <motion.div data-testid="tv-whoami-verdict" data-correct={String(!!guessCorrect)}
          className="relative z-10 flex flex-col items-center gap-[2.4vh] rounded-[50%] px-[8vw] py-[6vh] text-center"
          style={{ background: 'radial-gradient(ellipse closest-side, #060810 62%, rgba(6,8,16,0.85) 80%, transparent 100%)' }}
          variants={staggerChildren(120)} initial="initial" animate="animate">
          {active && <motion.div variants={riseIn(reduced)}><TVPlayerAvatar id={active.id} name={active.name} avatar={active.avatar} color={active.color} size={lu(16)} active /></motion.div>}
          {active && <motion.span variants={riseIn(reduced)} className="font-black" style={{ fontSize: tvType.title }}>{active.name}</motion.span>}
          <motion.div className="flex items-center gap-4"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: 0.35 }}>
            <span className="grid place-items-center rounded-full" style={{ width: lu(9), height: lu(9), background: tone, boxShadow: `0 0 40px ${tone}aa` }}>
              {guessCorrect ? <Check style={{ width: lu(6), height: lu(6), color: '#fff' }} strokeWidth={3} /> : <X style={{ width: lu(6), height: lu(6), color: '#fff' }} strokeWidth={3} />}
            </span>
            <span className="font-black" style={{ fontSize: tvType.hero, lineHeight: 1, textShadow: `0 0 50px ${tone}aa` }}>
              {guessCorrect ? t('tvCinema.whoami.correct', 'Richtig!') : t('tvCinema.whoami.wrong', 'Daneben!')}
            </span>
          </motion.div>
        </motion.div>
      </>
    );
  } else if (layout === 'gameOver') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    // Grosse Runden: zwei Spalten, damit nichts unter den Rand rutscht.
    const wide = sorted.length > 6;
    content = (
      <motion.div className={`flex w-full flex-col items-center gap-[2.4vh] ${wide ? "max-w-[88vw]" : "max-w-[60vw]"}`} variants={staggerChildren(90)} initial="initial" animate="animate">
        {winner && (
          <motion.div variants={riseIn(reduced)} className="flex items-center gap-5">
            <TVPlayerAvatar id={winner.id} name={winner.name} avatar={winner.avatar} color={winner.color} size={lu(11)} active />
            <span className="font-black" style={{ fontSize: tvType.display }}>{t('tvCinema.whoami.winner', '{{name}} gewinnt!', { name: winner.name })}</span>
          </motion.div>
        )}
        <div className={`grid w-full gap-[1.6vh] ${wide ? "grid-cols-2 gap-x-[2vw]" : "grid-cols-1"}`}>
        {sorted.map((p, i) => (
          <motion.div key={p.id} variants={riseIn(reduced)} className={`${tvPanel} flex w-full items-center gap-4 px-6 py-[1.4vh]`}
            style={i === 0 ? { boxShadow: `0 0 0 2px ${TS.gold}, 0 0 36px -6px ${TS.gold}` } : undefined}>
            <span className="font-black tabular-nums" style={{ fontSize: tvType.body, color: TS.dim, minWidth: '2.2em' }}>{i === 0 ? '👑' : `#${i + 1}`}</span>
            <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(6)} />
            <span className="min-w-0 flex-1 truncate font-bold" style={{ fontSize: tvType.body }}>{p.name}</span>
            {/* Endstand: jetzt (und nur jetzt) wird die Figur gezeigt */}
            <span className="truncate font-bold" style={{ fontSize: tvType.body, color: TS.dim }}>{p.character}{p.guessedCorrectly ? ' ✓' : ''}</span>
            <span className="font-black tabular-nums" style={{ fontSize: tvType.title, minWidth: '2ch', textAlign: 'right' }}>{p.score}</span>
          </motion.div>
        ))}
        </div>
      </motion.div>
    );
  } else {
    content = <span className="font-bold" style={{ fontSize: tvType.title, color: TS.dim }}>{t('tvCinema.whoami.preparing', 'Gleich geht’s los …')}</span>;
  }

  const showStrip = layout === 'round' || layout === 'guessResult';
  return (
    <div className="relative h-screen overflow-hidden" style={{ background: TS.bg, color: TS.text }}>
      <Wash color={layout === 'guessResult' ? (guessCorrect ? TS.good : TS.bad) : active?.color ?? TS.accent} strength={0.1} at="30% 50%" />
      <TVTopBar phase={phaseBadge} round={t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round: currentRound, total: totalRounds })} />
      <div className={`absolute left-[5vw] right-[5vw] top-[16vh] ${showStrip ? 'bottom-[19vh]' : 'bottom-[6vh]'}`}>
        <TVPhaseStage phase={layout} className="flex items-center justify-center">{content}</TVPhaseStage>
      </div>
      {showStrip && players.length > 0 && (
        <div className="absolute bottom-[5vh] left-[5vw] right-[5vw]">
          <TVScoreboard party={gameState?.partyNight} players={toRoster(players, t)} activeId={active?.id ?? null} sort="order" />
        </div>
      )}
    </div>
  );
}
