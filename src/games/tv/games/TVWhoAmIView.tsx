import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, X, Minus, HelpCircle } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { spring, blissBloom } from '@/lib/motion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVWhoAmIView — big-screen view for "Wer bin ich?" (Who am I?).
 *
 * The TV is the richer shared canvas: it shows the live question + aggregate
 * yes/no/maybe tally, the active asker, and the FULL party scoreboard.
 *
 * HARD SECRET: a player's assigned `character` is the whole game — it is NEVER
 * shown on the TV during play (assign / asking / guessResult). It is only
 * revealed once, at gameOver. Per-voter answers are never broadcast either —
 * only the aggregate tally.
 *
 * Data arrives via the host's `tv-state` broadcast (see WhoAmIGame).
 */
const WI = {
  primary: '#df8eff',
  text: '#f1f3fc',
  dim: '#a8abb3',
  bg: '#0a0e14',
  yes: '#10b981',
  no: '#ef4444',
  maybe: '#f59e0b',
};

interface TVPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  character: string;
  questionsAsked: number;
  guessedCorrectly: boolean;
  eliminated: boolean;
}

/**
 * Map the broadcast roster to the shared scoreboard. The character is NEVER
 * included — only score, a question count, and a done/out status. Solved and
 * eliminated players are marked 'out' so the strip greys them.
 */
function toRoster(players: TVPlayer[], t: (k: string, o?: any) => string): TVScorePlayer[] {
  return players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    score: p.score,
    avatar: p.avatar,
    status: p.guessedCorrectly ? 'done' : p.eliminated ? 'out' : undefined,
    subtitle: t('tv.whoami.questionsCount', { n: p.questionsAsked, defaultValue: '{{n}} Fragen' }),
  }));
}

export default function TVWhoAmIView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'assign';
  const players: TVPlayer[] = gameState?.players || [];
  const activeIdx: number = gameState?.activeIdx ?? 0;
  const currentRound: number = gameState?.currentRound ?? 1;
  const totalRounds: number = gameState?.totalRounds ?? 1;
  const currentQuestion: string = gameState?.currentQuestion || '';
  const maxQuestions: number = gameState?.maxQuestions ?? 20;
  const guessCorrect: boolean | null = gameState?.guessCorrect ?? null;
  const voteTally = (gameState?.voteTally as { yes: number; no: number; maybe: number }) || { yes: 0, no: 0, maybe: 0 };

  const active = players[activeIdx];

  // --- GAME OVER: now (and only now) characters are revealed ---
  if (phase === 'gameOver') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const leaderScore = sorted[0]?.score ?? 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-[clamp(1.5rem,3vw,3rem)]" style={{ background: WI.bg, color: WI.text }}>
        <motion.div variants={blissBloom} initial="initial" animate="animate" className="text-center">
          <div style={{ fontSize: tvType.display }}>🏆</div>
          <div className="font-black" style={{ fontSize: tvType.title, color: WI.primary }}>
            {sorted[0]?.name} {t('tv.wins', 'gewinnt!')}
          </div>
        </motion.div>
        <div className="flex flex-col gap-3 w-full max-w-[min(60vw,720px)]">
          {sorted.map((p, i) => (
            <motion.div key={p.id} className="flex items-center gap-4 px-6 py-4 rounded-2xl"
              style={{ background: '#11161e', border: `1.5px solid ${i === 0 ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`, ...(i === 0 ? { boxShadow: '0 0 24px -6px rgba(251,191,36,0.4)' } : {}) }}
              initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: Math.min(i * 0.08, 0.5), ...spring.soft }}>
              <span className="font-black" style={{ fontSize: tvType.body, color: i === 0 ? '#fbbf24' : WI.dim, minWidth: '1.6em' }}>
                {i === 0 ? '👑' : `#${i + 1}`}
              </span>
              <div className="rounded-full flex items-center justify-center font-black text-white" style={{ width: 'clamp(2.5rem,3vw,3.25rem)', height: 'clamp(2.5rem,3vw,3.25rem)', fontSize: tvType.label, background: p.color }}>
                {p.avatar || p.name?.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left leading-tight">
                <div className="font-bold text-white truncate" style={{ fontSize: tvType.label }}>{p.name}</div>
                {/* Reveal the secret character — allowed only at gameOver */}
                <div className="truncate" style={{ fontSize: tvType.micro, color: WI.dim }}>
                  {p.character}{p.guessedCorrectly ? ' ✓' : ''}
                </div>
              </div>
              <span className="font-black tabular-nums" style={{ fontSize: tvType.body, color: p.score === leaderScore && leaderScore > 0 ? '#fbbf24' : WI.primary }}>{p.score}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: WI.bg, color: WI.text }}>
      {/* soft brand wash */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(223,142,255,0.10)' }} />
      <div className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(143,245,255,0.08)' }} />

      {/* Wordmark */}
      <div className="relative flex items-center justify-center gap-3 pt-[clamp(1rem,2vh,2rem)]">
        <HelpCircle style={{ width: tvType.label, height: tvType.label, color: WI.primary }} />
        <span className="font-black tracking-[0.35em]" style={{ fontSize: tvType.label, color: WI.primary }}>
          {t('tv.whoami.title', 'WER BIN ICH?')}
        </span>
      </div>

      {/* ASSIGN — roles being handed out (NO characters shown) */}
      {phase === 'assign' && (
        <div className="relative flex-1 flex flex-col items-center justify-center gap-[clamp(1.5rem,4vh,3.5rem)] p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
          <motion.span className="font-black uppercase tracking-[0.2em] text-center max-w-[20ch] leading-tight" style={{ fontSize: tvType.title, color: WI.text }}
            animate={ambient ? { opacity: [0.6, 1, 0.6] } : {}} transition={ambient ? { duration: 2, repeat: Infinity } : {}}>
            {t('tv.whoami.assigning', 'Rollen werden verteilt…')}
          </motion.span>
          <div className="flex gap-4 flex-wrap justify-center max-w-[80vw]">
            {players.map((p, i) => (
              <motion.div key={p.id} className={`${tvPanel} flex flex-col items-center gap-3 px-6 py-5`}
                initial={{ opacity: 0, y: 14, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: Math.min(i * 0.08, 0.6), ...spring.soft }}>
                <div className="rounded-full flex items-center justify-center font-black text-white relative" style={{ width: 'clamp(3rem,4vw,4.5rem)', height: 'clamp(3rem,4vw,4.5rem)', fontSize: tvType.label, background: p.color }}>
                  {p.avatar || p.name?.slice(0, 1).toUpperCase()}
                </div>
                <span className="font-bold" style={{ fontSize: tvType.body, color: WI.text }}>{p.name}</span>
                {/* character is HIDDEN — once assigned, players are "ready" */}
                <span className="font-black" style={{ fontSize: tvType.label, color: WI.yes }}>✓</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ASKING / ANSWER-VOTE — question hero + aggregate tally */}
      {(phase === 'asking' || phase === 'answerVote' || phase === 'guessing') && (
        <div className="relative flex-1 grid grid-cols-[minmax(260px,1fr)_2fr_minmax(260px,1fr)] gap-[clamp(1rem,2vw,2.5rem)] p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
          {/* LEFT — active asker (the unmistakable focus) */}
          <div className={`${tvPanel} flex flex-col items-center justify-center gap-6 p-[clamp(1rem,1.8vw,2rem)] text-center`}>
            <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: WI.dim }}>
              {t('tv.whoami.asks', 'fragt')}
            </span>
            <AnimatePresence mode="wait">
              {active && (
                <motion.div key={active.id} variants={blissBloom} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-5">
                  <motion.div className="rounded-full flex items-center justify-center font-black text-white"
                    style={{ width: 'clamp(5rem,8vw,9rem)', height: 'clamp(5rem,8vw,9rem)', fontSize: tvType.title, background: active.color, ...tvActiveRing(active.color) }}
                    animate={ambient ? { scale: [1, 1.04, 1] } : {}}
                    transition={ambient ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}>
                    {active.avatar || active.name?.slice(0, 1).toUpperCase()}
                  </motion.div>
                  <div className="font-black leading-tight" style={{ fontSize: tvType.title, color: WI.text }}>{active.name}</div>
                  <span className="font-mono tabular-nums" style={{ fontSize: tvType.micro, color: WI.dim }}>
                    {t('tv.whoami.questionN', { x: active.questionsAsked, max: maxQuestions, defaultValue: 'Frage {{x}}/{{max}}' })}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CENTER — current question + tally */}
          <div className="flex flex-col items-center justify-center gap-[clamp(1.25rem,3vh,2.5rem)] min-h-0">
            <AnimatePresence mode="wait">
              {currentQuestion ? (
                <motion.div key={currentQuestion} variants={blissBloom} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.94 }} className="rounded-[28px] px-[clamp(1.5rem,3vw,3.5rem)] py-[clamp(1.5rem,3vh,3rem)] max-w-[24ch] text-center"
                  style={{ background: `${WI.primary}14`, border: `2px solid ${WI.primary}55`, boxShadow: `0 0 40px -10px ${WI.primary}66` }}>
                  <p className="font-black leading-tight" style={{ fontSize: tvType.title, color: WI.text }}>„{currentQuestion}"</p>
                </motion.div>
              ) : (
                <motion.span key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-black uppercase tracking-[0.2em] text-center max-w-[18ch] leading-tight" style={{ fontSize: tvType.title, color: WI.dim }}>
                  {t('tv.whoami.askPrompt', 'Stell eine Ja/Nein-Frage')}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Aggregate yes/no/maybe tally — never per-voter */}
            <div className="flex items-end justify-center gap-[clamp(1.5rem,3vw,3rem)] w-full">
              <TallyColumn icon={<Check />} label={t('games.whoami.answerVote.yes', 'Ja')} count={voteTally.yes} color={WI.yes} />
              <TallyColumn icon={<Minus />} label={t('games.whoami.answerVote.maybe', 'Vielleicht')} count={voteTally.maybe} color={WI.maybe} />
              <TallyColumn icon={<X />} label={t('games.whoami.answerVote.no', 'Nein')} count={voteTally.no} color={WI.no} />
            </div>
          </div>

          {/* RIGHT — round */}
          <div className={`${tvPanel} flex flex-col items-center justify-center gap-3 p-[clamp(1rem,1.8vw,2rem)] text-center`}>
            <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: WI.dim }}>
              {t('tv.round', 'Runde')}
            </span>
            <span className="font-black tabular-nums" style={{ fontSize: tvType.title, color: WI.text }}>
              {currentRound}<span style={{ color: WI.dim }}>/{totalRounds}</span>
            </span>
          </div>
        </div>
      )}

      {/* GUESS RESULT — correct/wrong banner (character stays hidden) */}
      {phase === 'guessResult' && (
        <div className="relative flex-1 flex flex-col items-center justify-center gap-8 p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
          <motion.div initial={{ scale: 0, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={spring.bouncy}
            className="rounded-[28px] flex flex-col items-center justify-center gap-5 px-[clamp(2rem,5vw,5rem)] py-[clamp(2rem,5vh,4rem)]"
            style={{ background: guessCorrect ? `${WI.yes}14` : `${WI.no}14`, border: `2px solid ${guessCorrect ? WI.yes : WI.no}66`, boxShadow: `0 0 50px -10px ${guessCorrect ? WI.yes : WI.no}88` }}>
            <div style={{ color: guessCorrect ? WI.yes : WI.no }}>
              {guessCorrect ? <Check style={{ width: tvType.display, height: tvType.display }} /> : <X style={{ width: tvType.display, height: tvType.display }} />}
            </div>
            <span className="font-black uppercase tracking-[0.2em]" style={{ fontSize: tvType.title, color: guessCorrect ? WI.yes : WI.no }}>
              {guessCorrect ? t('tv.whoami.correct', 'Richtig!') : t('tv.whoami.wrong', 'Falsch!')}
            </span>
            {active && (
              <span className="font-bold" style={{ fontSize: tvType.body, color: WI.text }}>{active.name}</span>
            )}
          </motion.div>
        </div>
      )}

      {/* BOTTOM — shared scoreboard strip (full party; solved/out greyed; NO characters) */}
      <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
        <TVScoreboard players={toRoster(players, t)} activeId={active?.id ?? null} sort="order" />
      </div>
    </div>
  );
}

function TallyColumn({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  // Bars grow with count via scaleY (compositor-friendly), capped for layout.
  const fill = Math.max(0.12, Math.min(1, count / 5));
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-black tabular-nums" style={{ fontSize: tvType.title, color }}>{count}</span>
      <div className="flex items-end rounded-full overflow-hidden" style={{ width: 'clamp(2.5rem,4vw,4rem)', height: 'clamp(4rem,9vh,7rem)', background: 'rgba(255,255,255,0.08)' }}>
        <motion.div className="w-full rounded-full origin-bottom" style={{ height: '100%', background: color }}
          animate={{ scaleY: fill }} transition={spring.soft} />
      </div>
      <div className="flex items-center gap-1.5" style={{ color }}>
        <span style={{ width: tvType.micro, height: tvType.micro, display: 'inline-flex' }}>{icon}</span>
        <span className="font-bold uppercase tracking-[0.12em]" style={{ fontSize: tvType.micro }}>{label}</span>
      </div>
    </div>
  );
}
