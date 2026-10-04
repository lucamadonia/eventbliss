import { useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { partyEase } from '@/lib/party-motion';
import { tvType } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';
import TVPhaseStage from '../cinema/TVPhaseStage';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';
import TVBurst from '../cinema/TVBurst';
import { lu } from '../components/tv-lobby-scale';
import TVRoundHud, { TVHudChip } from './broadcast/TVRoundHud';
import TVTimerRing from './broadcast/TVTimerRing';
import TVFinalStandings from './broadcast/TVFinalStandings';
import { INTERLUDE_PHASES, QZ, quizPhaseLabel, quizPlayers, quizScene, type QuizViewState } from './quiz/quiz-model';
import { AnswerGrid, QuestionHeadline, StatementList, TRUE_FALSE_TILES } from './quiz/QuizAnswers';
import { AvatarRow, FakeOrFactReveal, PointsFloat } from './quiz/QuizExtras';
import { SharedQuizRoles, SplitQuizTeams } from './quiz/QuizTeams';

/**
 * TVQuizView — gemeinsame Fernsehansicht der Quiz-Familie:
 *   quiz · splitquiz · fakeorfact · sharedquiz.
 *
 * Jede Frage ist eine eigene Szene (TVPhaseStage, Schluessel je Runde); die
 * Aufloesung passiert IN der Szene (Kacheln treten zurueck, die richtige
 * leuchtet). Zwischenphasen (Handy weitergeben, Rundenauftakt) und der
 * Endstand haben eigene Szenen. Titelkarten/Phasentoene: cinema/cues/quiz.cue.ts.
 *
 * GEHEIMNISSE: Die Bruecken liefern `correctAnswer` erst in der Aufloesung
 * (sonst -1); splitquiz online und sharedquiz schicken Frage/Antworten erst
 * dann. Die Ansicht wertet `correctAnswer` zusaetzlich nur in `reveal` aus.
 */
const EMPTY: never[] = [];

export default function TVQuizView({ gameState }: { gameState: QuizViewState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const reduced = !!useReducedMotion();
  const game = gameState?.game || 'quiz';
  const phase = gameState?.phase || 'question';
  const round = gameState?.round || gameState?.currentRound || 1;
  const total = gameState?.totalRounds;
  const revealed = phase === 'reveal';
  const correct = revealed ? (gameState?.correctAnswer ?? -1) : -1;
  const question = gameState?.question || gameState?.currentTask || gameState?.statement || '';
  const answers = gameState?.answers || EMPTY;
  const statements = gameState?.statements || EMPTY;
  const isThree = game === 'fakeorfact' && statements.length === 3;
  const players = useMemo(() => quizPlayers(gameState ?? {}), [gameState]);
  const teamA = game === 'splitquiz' ? gameState?.teamA : undefined;
  const teamB = game === 'splitquiz' ? gameState?.teamB : undefined;
  const isTeam = !!(teamA && teamB);
  const scene = quizScene(phase, round);
  const phaseLabel = quizPhaseLabel(game, phase, t);
  const timeLeft = typeof gameState?.timeLeft === 'number' ? gameState.timeLeft : null;
  const maxTime = gameState?.maxTime || 30;
  const accent = revealed ? QZ.green : phaseLabel?.color || QZ.purple;

  const roster: TVScorePlayer[] = useMemo(() => players.map((p) => ({
    id: String(p.id), name: p.name, color: p.color || QZ.purple, avatar: p.avatar,
    score: typeof p.score === 'number' ? p.score : undefined,
    subtitle: (p.streak ?? 0) > 1 ? `🔥${p.streak}` : undefined,
  })), [players]);
  const activeIdx = gameState?.currentPlayerIdx ?? -1;
  const activeId = game !== 'sharedquiz' && activeIdx >= 0 ? (players[activeIdx]?.id ?? null) : null;

  const hudRight = scene.startsWith('question') ? (
    <>
      {gameState?.category && <TVHudChip>{gameState.category}</TVHudChip>}
      {gameState?.currentPlayer && (
        <div className="flex items-center gap-3 rounded-full py-1 pe-5 ps-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <TVPlayerAvatar name={gameState.currentPlayer} color={gameState.playerColor} size={lu(5)} active />
          <span className="font-bold" style={{ fontSize: tvType.body, color: QZ.text }}>{gameState.currentPlayer}</span>
        </div>
      )}
      {timeLeft !== null && !revealed && <TVTimerRing seconds={timeLeft} fraction={timeLeft / maxTime} size={lu(8)} />}
    </>
  ) : null;

  let content: ReactNode;
  if (scene === 'gameOver') {
    content = isTeam ? <SplitFinal teamA={teamA!} teamB={teamB!} info={players} /> : (
      <TVFinalStandings players={players.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, color: p.color, score: p.score ?? 0 }))} accent={QZ.purple} />
    );
  } else if (scene === 'setup') {
    content = (
      <motion.span style={{ fontSize: tvType.title, color: QZ.dim }} className="font-bold"
        animate={ambient ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.8 }} transition={ambient ? { repeat: Infinity, duration: 2.2 } : { duration: 0.3 }}>
        {t('tvCinema.quiz.preparing', 'Das Quiz wird vorbereitet …')}
      </motion.span>
    );
  } else if (INTERLUDE_PHASES.has(phase)) {
    content = (
      <div className="flex flex-col items-center gap-[4vh] text-center">
        {phase === 'roundIntro'
          ? <h1 className="font-black" style={{ fontSize: tvType.display, color: QZ.text }}>{t('tvCinema.quiz.rolesTitle', 'Die Rollen dieser Runde')}</h1>
          : <PassPhone ambient={ambient} />}
        {game === 'sharedquiz' && <SharedQuizRoles players={players} roleIndices={gameState?.roleIndices || EMPTY} phase={phase} large />}
      </div>
    );
  } else {
    const fofTiles = game === 'fakeorfact' && !isThree && !answers.length && question
      ? [t('tv.fakeorfact.true', 'Wahr'), t('tv.fakeorfact.false', 'Falsch')] : null;
    const voters = gameState?.voters || EMPTY;
    content = (
      <div className="flex w-full flex-col items-center gap-[3vh]">
        {question ? <QuestionHeadline text={question} /> : isThree ? (
          <h1 className="font-black" style={{ fontSize: lu(5.6), color: QZ.text }}>{t('tvCinema.quiz.whichIsTrue', 'Welche Aussage stimmt?')}</h1>
        ) : <HiddenQuestion game={game} phase={phase} players={players} roleIndices={gameState?.roleIndices || EMPTY} ambient={ambient} />}
        {isThree ? <StatementList statements={statements} correct={correct} />
          : answers.length > 0 ? <AnswerGrid answers={answers} correct={correct} />
            : fofTiles ? <AnswerGrid answers={fofTiles} correct={correct} tiles={TRUE_FALSE_TILES} /> : null}
        {game === 'fakeorfact' && revealed && (
          <FakeOrFactReveal explanation={gameState?.explanation || ''} correctPct={gameState?.correctPct ?? -1} votesCount={gameState?.votesCount ?? 0} />
        )}
        {game === 'fakeorfact' && !revealed && voters.length > 0 && (
          <AvatarRow testId="tv-quiz-voters" tone={QZ.cyan} delay={0.6} players={voters}
            label={t('tvCinema.quiz.votedCount', '{{count}} von {{total}} haben getippt', { count: voters.length, total: players.length || voters.length })} />
        )}
        {revealed && (gameState?.correctPlayers?.length ?? 0) > 0 && (
          <AvatarRow testId="tv-quiz-correct" players={gameState!.correctPlayers!} label={t('tvCinema.quiz.correctPlayers', 'Richtig getippt')} />
        )}
        {revealed && (gameState?.points ?? 0) > 0 && <PointsFloat points={gameState!.points!} />}
      </div>
    );
  }

  const showBottom = scene !== 'gameOver';
  return (
    <div className="relative h-screen overflow-hidden" style={{ background: QZ.bg }} data-testid="tv-quiz" data-game={game} data-phase={phase}>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 75% 55% at 50% 38%, ${accent}1c 0%, transparent 70%)`, transition: 'background 600ms ease' }}
        animate={ambient ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.85 }}
        transition={ambient ? { repeat: Infinity, duration: 4, ease: 'easeInOut' } : { duration: 0.3 }} />
      {scene !== 'gameOver' && <TVRoundHud phase={phaseLabel} round={round} total={total} right={hudRight} />}
      <TVPhaseStage phase={scene}
        className={`flex flex-col items-center justify-center px-[5vw] ${scene === 'gameOver' ? '' : `pt-[15vh] ${isTeam ? 'pb-[30vh]' : 'pb-[17vh]'}`}`}>
        {content}
      </TVPhaseStage>
      {showBottom && (
        <motion.div className="absolute bottom-[5vh] left-[5vw] right-[5vw] z-10"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: partyEase.out }}>
          {isTeam ? <SplitQuizTeams teamA={teamA!} teamB={teamB!} info={players} />
            : roster.length > 0 && <TVScoreboard party={gameState?.partyNight} players={roster} activeId={activeId} sort="score" />}
        </motion.div>
      )}
    </div>
  );
}

function PassPhone({ ambient }: { ambient: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-[2vh]">
      <motion.span className="grid place-items-center rounded-full" style={{ width: lu(14), height: lu(14), background: `${QZ.amber}1f`, boxShadow: `0 0 60px -10px ${QZ.amber}` }}
        animate={ambient ? { rotate: [-8, 8, -8] } : { rotate: 0 }} transition={ambient ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : { duration: 0.3 }}>
        <Smartphone aria-hidden style={{ width: '50%', height: '50%', color: QZ.amber }} />
      </motion.span>
      <h1 className="font-black" style={{ fontSize: tvType.display, color: QZ.text }}>{t('tvCinema.quiz.passPhone', 'Handy weitergeben')}</h1>
      <p className="font-semibold" style={{ fontSize: tvType.body, color: QZ.dim }}>{t('tvCinema.quiz.passPhoneSub', 'Gleich geht es weiter')}</p>
    </div>
  );
}

/** Frage noch geheim (splitquiz online, sharedquiz): Buehne statt Ladezeichen. */
function HiddenQuestion({ game, phase, players, roleIndices, ambient }: {
  game: string; phase: string; players: ReturnType<typeof quizPlayers>; roleIndices: number[]; ambient: boolean;
}) {
  const { t } = useTranslation();
  if (game === 'sharedquiz') return <SharedQuizRoles players={players} roleIndices={roleIndices} phase={phase} large />;
  return (
    <div className="flex flex-col items-center gap-[2.4vh] text-center">
      <motion.span className="grid place-items-center rounded-full" style={{ width: lu(13), height: lu(13), background: `${QZ.purple}1f`, boxShadow: `0 0 60px -10px ${QZ.purple}` }}
        animate={ambient ? { scale: [1, 1.06, 1] } : { scale: 1 }} transition={ambient ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : { duration: 0.3 }}>
        <Smartphone aria-hidden style={{ width: '48%', height: '48%', color: QZ.purple }} />
      </motion.span>
      <h1 className="font-black" style={{ fontSize: lu(5.6), color: QZ.text }}>
        {game === 'splitquiz' ? t('tvCinema.quiz.teamAnswering', 'Das Team beantwortet die Frage') : t('tvCinema.quiz.onPhones', 'Die Frage ist auf den Handys')}
      </h1>
      <p className="font-semibold" style={{ fontSize: tvType.body, color: QZ.dim }}>
        {t('tvCinema.quiz.revealOnTv', 'Die Auflösung gibt es hier auf dem Fernseher')}
      </p>
    </div>
  );
}

function SplitFinal({ teamA, teamB, info }: { teamA: NonNullable<QuizViewState['teamA']>; teamB: NonNullable<QuizViewState['teamB']>; info: ReturnType<typeof quizPlayers> }) {
  const { t } = useTranslation();
  const winner = teamA.score === teamB.score ? null : teamA.score > teamB.score ? teamA : teamB;
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-[5vh] px-[5vw] py-[8vh]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <TVBurst colors={[winner?.color || QZ.amber, '#FFD23F', '#ffffff']} count={60} delay={0.4} />
      </div>
      <h1 className="relative z-10 rounded-[50%] px-[6vw] py-[2vh] text-center font-black"
        style={{ fontSize: tvType.display, color: QZ.text, background: 'radial-gradient(ellipse closest-side, #060810 60%, transparent 100%)', textShadow: `0 0 50px ${winner?.color || QZ.amber}` }}>
        {winner ? t('tvCinema.quiz.teamWins', '{{team}} gewinnt!', { team: winner.name }) : t('tvCinema.quiz.teamTie', 'Unentschieden!')}
      </h1>
      <div className="relative z-10 w-full"><SplitQuizTeams teamA={teamA} teamB={teamB} info={info} /></div>
    </div>
  );
}
