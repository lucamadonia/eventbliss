import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVQuizView — shared big-screen view for the quiz family:
 *   quiz · splitquiz · fakeorfact · sharedquiz.
 *
 * The core is a Kahoot-style question + 2×2 answer grid with a top timer bar;
 * answers stay neutral until phase==='reveal', then the correct tile glows.
 * Each game layers on extra broadcast canvas by reading `gameState.game`:
 *   - splitquiz  → tug-of-war team score bar + both team cards (bottom)
 *   - fakeorfact → classic (True/False) or "three" (3 statements) layout,
 *                  explanation + correct/incorrect vote bar on reveal
 *   - sharedquiz → role rail (reads Q / reads options / guesses)
 * The generic `quiz` path is unchanged.
 */

const TILE_COLORS = ['#e63946', '#3b82f6', '#10b981', '#f59e0b'];
const TILE_SHAPES = ['▲', '◆', '●', '■'];
const TILE_LABELS = ['A', 'B', 'C', 'D'];

interface TeamState { name: string; color: string; players: string[]; score: number; correctCount: number }

export default function TVQuizView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const game: string = gameState?.game || 'quiz';

  const phase = gameState?.phase || 'playing';
  const question = gameState?.question || gameState?.currentTask || gameState?.statement || '';
  const answers: string[] = gameState?.answers || [];
  const category = gameState?.category || '';
  const timeLeft = gameState?.timeLeft ?? '';
  const maxTime = gameState?.maxTime ?? 30;
  const round = gameState?.round || gameState?.currentRound || 1;
  const total = gameState?.totalRounds || '?';
  const correctAnswer = gameState?.correctAnswer ?? -1;
  const points = gameState?.points ?? 0;
  const correctPlayers = gameState?.correctPlayers || [];
  const player = gameState?.currentPlayer || '';
  const playerColor = gameState?.playerColor || '#df8eff';

  // Fake-or-Fact three-mode: a `statements` array means "pick the true one".
  const fofStatements: string[] = gameState?.statements || [];
  const isThreeMode = game === 'fakeorfact' && fofStatements.length === 3;

  // Whole-party roster for PLAYER-based variants (fakeorfact / sharedquiz /
  // generic quiz). splitquiz is TEAM-based, so it renders teams instead.
  const isTeamGame = game === 'splitquiz';
  const rawPlayers: any[] = gameState?.players || [];
  const hasRoster = !isTeamGame && rawPlayers.length > 0 && typeof rawPlayers[0] === 'object';
  const currentPlayerIdx: number = gameState?.currentPlayerIdx ?? -1;
  const activePlayerId: string | null = hasRoster && currentPlayerIdx >= 0
    ? (rawPlayers[currentPlayerIdx]?.id ?? null)
    : null;
  const roster: TVScorePlayer[] = useMemo(
    () => (hasRoster ? rawPlayers.map((p: any) => ({
      id: String(p.id),
      name: p.name,
      color: p.color || '#df8eff',
      score: typeof p.score === 'number' ? p.score : undefined,
      avatar: p.avatar,
      subtitle: p.streak > 1 ? `🔥${p.streak}` : undefined,
    })) : []),
    [hasRoster, rawPlayers],
  );

  const timerPercent = useMemo(() => {
    if (timeLeft === '' || maxTime <= 0) return 100;
    return Math.max(0, Math.min(100, (Number(timeLeft) / maxTime) * 100));
  }, [timeLeft, maxTime]);

  const timerColor = useMemo(() => {
    if (timerPercent > 60) return '#10b981';
    if (timerPercent > 30) return '#f59e0b';
    return '#ef4444';
  }, [timerPercent]);

  const roundProgress = useMemo(() => {
    const tt = typeof total === 'number' ? total : parseInt(total, 10);
    if (!tt || isNaN(tt)) return 0;
    return (round / tt) * 100;
  }, [round, total]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Ambient bg glow (static) */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(223,142,255,0.06) 0%, transparent 70%)',
      }} />

      {/* Timer bar at very top */}
      <div className="relative w-full h-2 bg-[#151a21]">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-r-full"
          style={{ backgroundColor: timerColor }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.4, ease: 'linear' }}
        />
        {timerPercent <= 30 && (
          <motion.div
            className="absolute left-0 top-0 h-full rounded-r-full"
            style={{ backgroundColor: timerColor, width: `${timerPercent}%` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
        )}
      </div>

      {/* Top HUD */}
      <div className="flex items-center justify-between px-10 pt-6 pb-2 relative z-10">
        {/* Round counter + progress */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-[#a8abb3] tracking-widest uppercase">{t('tv.round')}</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-[#f1f3fc]">{round}<span className="text-[#a8abb3]">/{total}</span></span>
              <div className="w-32 h-2 rounded-full bg-[#1b2028] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#df8eff] to-[#8ff5ff]"
                  animate={{ width: `${roundProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {category && (
            <div className="px-5 py-2 rounded-full border border-[#df8eff]/30"
              style={{ background: 'rgba(223,142,255,0.08)', boxShadow: '0 0 20px rgba(223,142,255,0.1)' }}>
              <span className="text-lg font-bold text-[#df8eff]">{category}</span>
            </div>
          )}
          {player && (
            <div className="px-5 py-2 rounded-full"
              style={{ background: `${playerColor}15`, border: `2px solid ${playerColor}44`, boxShadow: `0 0 15px ${playerColor}22` }}>
              <span className="text-xl font-bold" style={{ color: playerColor }}>{player}</span>
            </div>
          )}
          {timeLeft !== '' && (
            <div className="px-5 py-2 rounded-full bg-[#151a21] border border-white/5">
              <motion.span
                className="text-3xl font-mono font-black"
                style={{ color: timerColor }}
                animate={Number(timeLeft) <= 5 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                {timeLeft}s
              </motion.span>
            </div>
          )}
        </div>
      </div>

      {/* SharedQuiz role rail (only when role data exists) */}
      {game === 'sharedquiz' && <SharedQuizRoleRail gameState={gameState} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 pb-8">
        {/* Question */}
        <AnimatePresence mode="wait">
          {question ? (
            <motion.h1
              key={question}
              className="font-black text-center max-w-5xl leading-tight mb-12"
              style={{
                fontSize: tvType.title,
                color: '#f1f3fc',
                textShadow: '0 0 40px rgba(223,142,255,0.18), 0 2px 10px rgba(0,0,0,0.5)',
              }}
              initial={{ y: 28, opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ y: -18, opacity: 0, filter: 'blur(4px)' }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            >
              {question}
            </motion.h1>
          ) : (
            <motion.div
              key="loading"
              className="flex items-center gap-4 mb-12"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-3 h-3 rounded-full bg-[#df8eff]" />
              <span className="text-3xl text-[#a8abb3]">{t('tv.quiz.loadingQuestion', 'Frage wird geladen...')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fake-or-Fact "three" mode: 3 numbered statement boxes */}
        {isThreeMode ? (
          <div className="flex flex-col gap-4 w-full max-w-4xl">
            {fofStatements.map((s, i) => {
              const isCorrect = phase === 'reveal' && i === correctAnswer;
              const isWrong = phase === 'reveal' && i !== correctAnswer;
              return (
                <motion.div
                  key={i}
                  className="relative rounded-2xl flex items-center gap-5 p-6 min-h-[88px]"
                  style={{
                    background: isCorrect ? 'rgba(16,185,129,0.14)' : '#151a21',
                    border: `2px solid ${isCorrect ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isCorrect ? '0 0 40px rgba(16,185,129,0.4)' : 'none',
                  }}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: isWrong ? 0.45 : 1 }}
                  transition={{ delay: phase === 'reveal' ? 0 : i * 0.12, type: 'spring', damping: 16 }}
                >
                  <span className="rounded-full flex items-center justify-center font-black text-white shrink-0"
                    style={{ width: '3rem', height: '3rem', fontSize: tvType.body, background: isCorrect ? '#10b981' : '#df8eff' }}>
                    {i + 1}
                  </span>
                  <span className="font-bold leading-snug" style={{ fontSize: tvType.body, color: isWrong ? '#a8abb3' : '#f1f3fc' }}>
                    {s}
                  </span>
                  {isCorrect && <span className="ml-auto text-4xl">✅</span>}
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Fake-or-Fact classic shows True/False if no answers were sent */
          answers.length > 0 ? (
            <AnswerGrid answers={answers} phase={phase} correctAnswer={correctAnswer} />
          ) : game === 'fakeorfact' ? (
            <AnswerGrid
              answers={[t('tv.fakeorfact.true', 'Wahr'), t('tv.fakeorfact.false', 'Falsch')]}
              phase={phase}
              correctAnswer={correctAnswer}
            />
          ) : null
        )}

        {/* Fake-or-Fact explanation + vote distribution on reveal */}
        {game === 'fakeorfact' && phase === 'reveal' && (
          <FakeOrFactReveal gameState={gameState} />
        )}

        {/* Floating points text on reveal */}
        <AnimatePresence>
          {phase === 'reveal' && points > 0 && (
            <motion.div
              className="mt-6 text-center"
              initial={{ y: 0, opacity: 1, scale: 0.8 }}
              animate={{ y: -40, opacity: 0, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              <span className="text-5xl font-black text-[#fbbf24]"
                style={{ textShadow: '0 0 30px rgba(251,191,36,0.6)' }}>
                +{points} {t('tv.points')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Correct players avatars */}
        <AnimatePresence>
          {phase === 'reveal' && correctPlayers.length > 0 && (
            <motion.div
              className="flex items-center gap-3 mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-lg text-[#a8abb3] mr-2">{t('tv.correct', 'Richtig')}:</span>
              {correctPlayers.map((p: any, i: number) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-[#10b981]"
                  style={{
                    backgroundColor: p.color || '#10b981',
                    boxShadow: '0 0 12px rgba(16,185,129,0.5)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                >
                  {(p.name || '?').charAt(0).toUpperCase()}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SplitQuiz tug-of-war + team cards (TEAM-based, lists every member) */}
      {game === 'splitquiz' && <SplitQuizTeams gameState={gameState} />}

      {/* PLAYER-based variants: whole-party roster on the shared canvas */}
      {hasRoster && (
        <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
          <TVScoreboard players={roster} activeId={activePlayerId} sort="score" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared Kahoot 2×2 answer grid                                       */
/* ------------------------------------------------------------------ */
function AnswerGrid({ answers, phase, correctAnswer }: { answers: string[]; phase: string; correctAnswer: number }) {
  return (
    <div className="grid grid-cols-2 gap-5 w-full max-w-5xl">
      {answers.map((a, i) => {
        const isCorrect = phase === 'reveal' && i === correctAnswer;
        const isWrong = phase === 'reveal' && i !== correctAnswer;
        const tileColor = TILE_COLORS[i % TILE_COLORS.length];

        return (
          <motion.div
            key={i}
            className="relative rounded-2xl overflow-hidden cursor-default"
            style={{
              background: isWrong ? `${tileColor}22` : tileColor,
              boxShadow: isCorrect
                ? `0 0 40px ${tileColor}88, 0 0 80px ${tileColor}44, inset 0 0 30px rgba(255,255,255,0.15)`
                : isWrong
                  ? 'none'
                  : `0 8px 30px ${tileColor}33, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
            initial={{ x: i % 2 === 0 ? -60 : 60, opacity: 0, scale: 0.9 }}
            animate={{
              x: 0,
              opacity: isWrong ? 0.4 : 1,
              scale: isCorrect ? [1, 1.05, 1.02] : isWrong ? 0.95 : 1,
            }}
            transition={{
              delay: phase === 'reveal' ? 0 : i * 0.12,
              duration: phase === 'reveal' ? 0.5 : 0.4,
              type: 'spring',
              damping: 15,
            }}
          >
            <div className="flex items-center gap-5 p-6 min-h-[100px]">
              <span className="text-5xl font-black opacity-80 select-none"
                style={{ color: isWrong ? `${tileColor}66` : 'rgba(255,255,255,0.7)' }}>
                {TILE_SHAPES[i % TILE_SHAPES.length]}
              </span>
              <span className={`text-2xl md:text-3xl font-bold leading-snug ${isWrong ? 'text-[#a8abb3]/40' : 'text-white'}`}>
                {a}
              </span>
              <span className="absolute top-3 right-4 text-lg font-black opacity-40" style={{ color: isWrong ? tileColor : '#fff' }}>
                {TILE_LABELS[i % TILE_LABELS.length]}
              </span>
            </div>

            {isCorrect && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fake-or-Fact: explanation + correct/incorrect vote distribution bar */
/* ------------------------------------------------------------------ */
function FakeOrFactReveal({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const explanation: string = gameState?.explanation || '';
  const correctPct: number = typeof gameState?.correctPct === 'number' ? gameState.correctPct : -1;
  const votesCount: number = gameState?.votesCount ?? 0;

  return (
    <motion.div
      className="mt-8 w-full max-w-4xl flex flex-col items-center gap-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {explanation && (
        <div className="rounded-2xl px-7 py-5 text-center" style={{ background: '#0d0915', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="font-semibold leading-snug" style={{ fontSize: tvType.body, color: '#c9c2d8' }}>
            💡 {explanation}
          </span>
        </div>
      )}

      {correctPct >= 0 && votesCount > 0 && (
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold uppercase tracking-widest" style={{ fontSize: tvType.micro, color: '#10b981' }}>
              {t('tv.fakeorfact.gotItRight', 'Richtig getippt')} {correctPct}%
            </span>
            <span className="font-bold uppercase tracking-widest" style={{ fontSize: tvType.micro, color: '#ef4444' }}>
              {100 - correctPct}% {t('tv.fakeorfact.wrong', 'Daneben')}
            </span>
          </div>
          <div className="h-4 rounded-full overflow-hidden flex" style={{ background: 'rgba(239,68,68,0.25)' }}>
            <motion.div
              className="h-full origin-left"
              style={{ background: '#10b981', width: '100%' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: correctPct / 100 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* SplitQuiz: tug-of-war score bar + both team cards                   */
/* ------------------------------------------------------------------ */
function SplitQuizTeams({ gameState }: { gameState: any }) {
  const ambient = useAmbientMotion();
  const teamA: TeamState | null = gameState?.teamA || null;
  const teamB: TeamState | null = gameState?.teamB || null;
  if (!teamA || !teamB) return null;

  const total = teamA.score + teamB.score;
  // Tug-of-war: fraction of the bar Team A holds (50/50 when both at 0).
  const aFraction = total > 0 ? teamA.score / total : 0.5;

  return (
    <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)] flex flex-col gap-4">
      {/* Tug-of-war bar */}
      <div className="relative h-7 rounded-full overflow-hidden flex" style={{ background: '#151a21', border: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full origin-left"
          style={{ background: teamA.color, width: '100%' }}
          animate={{ scaleX: aFraction }}
          transition={{ type: 'spring', damping: 18, stiffness: 120 }}
        />
        <motion.div
          className="h-full origin-right flex-1"
          style={{ background: teamB.color }}
          animate={ambient ? { opacity: [0.85, 1, 0.85] } : { opacity: 1 }}
          transition={ambient ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />
        {/* center marker */}
        <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2" style={{ background: 'rgba(255,255,255,0.25)' }} />
      </div>

      {/* Both team cards — header + EVERY member listed underneath */}
      <div className="grid grid-cols-2 gap-4">
        {[teamA, teamB].map((team, i) => {
          const leading = team.score > (i === 0 ? teamB.score : teamA.score);
          return (
            <motion.div
              key={i}
              className="rounded-2xl px-6 py-4 flex flex-col gap-3"
              style={{ background: '#0d0915', border: `2px solid ${team.color}`, ...(leading ? tvActiveRing(team.color) : {}) }}
              animate={{ scale: leading ? 1 : 0.985, opacity: leading ? 1 : 0.92 }}
              transition={{ type: 'spring', damping: 20, stiffness: 160 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="rounded-full flex items-center justify-center font-black text-white shrink-0"
                    style={{ width: 'clamp(2.5rem,3.2vw,3.5rem)', height: 'clamp(2.5rem,3.2vw,3.5rem)', fontSize: tvType.body, background: team.color }}>
                    {leading ? '👑' : team.name?.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="leading-tight min-w-0">
                    <div className="font-black text-white truncate" style={{ fontSize: tvType.body }}>{team.name}</div>
                    <div className="font-mono tabular-nums" style={{ fontSize: tvType.micro, color: '#a8abb3' }}>
                      {team.correctCount}✓ · {team.players.length}👥
                    </div>
                  </div>
                </div>
                <motion.span
                  key={team.score}
                  className="font-black tabular-nums shrink-0"
                  style={{ fontSize: tvType.title, color: team.color }}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 240 }}
                >
                  {team.score}
                </motion.span>
              </div>

              {/* every team member as a chip — accounts for ALL players */}
              <div className="flex flex-wrap gap-1.5">
                {team.players.map((name, pi) => (
                  <span key={pi} className="rounded-full px-2.5 py-1 font-semibold truncate max-w-[12ch]"
                    style={{ fontSize: tvType.micro, color: '#d7d0e6', background: `${team.color}1f`, border: `1px solid ${team.color}40` }}>
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SharedQuiz: role rail (reads Q · reads options · guesses)           */
/* ------------------------------------------------------------------ */
function SharedQuizRoleRail({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const players: { id: string; name: string; color: string }[] = gameState?.players || [];
  const roleIndices: number[] | undefined = gameState?.roleIndices;
  if (!roleIndices || roleIndices.length < 3 || players.length === 0) return null;

  const roles = [
    { icon: '❓', label: t('tv.sharedquiz.reads', 'Liest Frage'), idx: roleIndices[0] },
    { icon: '💬', label: t('tv.sharedquiz.options', 'Liest Optionen'), idx: roleIndices[1] },
    { icon: '🎯', label: t('tv.sharedquiz.guesses', 'Raet'), idx: roleIndices[2] },
  ];

  return (
    <div className="relative z-10 flex items-center justify-center gap-4 px-10 pb-3">
      {roles.map((r, i) => {
        const p = players[r.idx % players.length];
        if (!p) return null;
        return (
          <div key={i} className="flex items-center gap-3 rounded-2xl px-5 py-2.5"
            style={{ background: '#0d0915', border: `1.5px solid ${p.color}`, ...tvActiveRing(p.color) }}>
            <span className="text-2xl">{r.icon}</span>
            <div className="rounded-full flex items-center justify-center font-black text-white"
              style={{ width: 'clamp(2rem,2.4vw,2.5rem)', height: 'clamp(2rem,2.4vw,2.5rem)', fontSize: tvType.micro, background: p.color }}>
              {p.name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-white" style={{ fontSize: tvType.label }}>{p.name}</div>
              <div className="uppercase tracking-widest font-bold" style={{ fontSize: tvType.micro, color: '#a8abb3' }}>{r.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
