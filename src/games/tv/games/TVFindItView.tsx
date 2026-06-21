import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { spring, ease } from '@/lib/motion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVFindItView — big-screen view for "Wo ist Was" (5 modes: memory/speed grid,
 * unterschiede, karte, streetview). The TV is the shared canvas; the heavy
 * interactive media (Leaflet map, street-view iframe, emoji grid + diff images)
 * stays on each player's phone. So the TV shows:
 *
 *   - rails everywhere: round/phase badge + the WHOLE party (TVScoreboard)
 *   - a mode-appropriate HERO:
 *       study   → big "Einprägen!" + study countdown ring
 *       question (memory/speed) → the question text + a question timer
 *       karte/streetview → a clean "Schau auf dein Gerät" focal card (+ location
 *                          name once revealed in roundEnd/answer)
 *       answer  → ✓/✗ reveal
 *
 * Secrets (the correct answer / option) stay hidden until the answer phase.
 */
const FI = { primary: '#22d3ee', secondary: '#a78bfa', accent: '#fbbf24', good: '#34d399', bad: '#fb7185', text: '#eef6f8', dim: '#9fb4bd', bg: '#08121a' };

interface TVPlayer { id: string; name: string; color: string; avatar: string; score: number; correct: number; wrong: number; streak: number; bestStreak: number; fastestMs: number }

function modeMeta(mode: string, t: (k: string, d: string) => string): { label: string; icon: string } {
  switch (mode) {
    case 'memory': return { label: t('woIstWas.modes.memory', 'Memory'), icon: '🧠' };
    case 'speed': return { label: t('woIstWas.modes.speed', 'Speed'), icon: '⚡' };
    case 'unterschiede': return { label: t('woIstWas.modes.unterschiede', 'Unterschiede'), icon: '🔍' };
    case 'karte': return { label: t('woIstWas.modes.karte', 'Karte'), icon: '🗺️' };
    case 'streetview': return { label: t('woIstWas.modes.streetview', 'Street View'), icon: '📍' };
    default: return { label: mode, icon: '🎯' };
  }
}

function phaseLabel(phase: string, t: (k: string, d: string) => string): string {
  switch (phase) {
    case 'study': return t('tv.findit.study', 'Einprägen');
    case 'question': return t('tv.findit.question', 'Frage');
    case 'answer': return t('tv.findit.answer', 'Auflösung');
    case 'streetviewPlay': return t('tv.findit.guess', 'Raten');
    case 'karteSetup': return t('tv.findit.setup', 'Vorbereitung');
    case 'roundEnd': return t('tv.findit.roundEnd', 'Rundenende');
    default: return phase;
  }
}

export default function TVFindItView({ gameState }: { gameState: any }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();

  const phase: string = gameState?.phase || 'study';
  const round: number = gameState?.round ?? 0;
  const totalRounds: number = gameState?.totalRounds ?? 0;
  const mode: string = gameState?.mode || 'memory';
  const players: TVPlayer[] = gameState?.players || [];
  const studyCountdown: number = gameState?.studyCountdown ?? 0;
  const questionCountdown: number = gameState?.questionCountdown ?? 0;
  const questionIdx: number = gameState?.questionIdx ?? 0;
  const totalQuestions: number = gameState?.totalQuestions ?? 0;
  const question: string = gameState?.question || '';
  const geoName: string = gameState?.geoName || '';
  const answerCorrect: boolean | null = gameState?.answerCorrect ?? null;

  const meta = modeMeta(mode, t);
  const isGeoMode = mode === 'karte' || mode === 'streetview';
  const showAnswer = phase === 'answer' || phase === 'roundEnd';

  // The whole party, always on screen — score + streak subtitle, best-streak crown.
  const roster: TVScorePlayer[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    avatar: p.avatar,
    score: p.score,
    subtitle: p.streak > 1 ? `🔥${p.streak}` : (p.bestStreak > 1 ? `⭐${p.bestStreak}` : undefined),
  }));

  if (phase === 'gameOver') {
    const winner = [...players].sort((a, b) => b.score - a.score)[0];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-10" style={{ background: FI.bg }}>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.bouncy} className="text-center">
          <div style={{ fontSize: tvType.display }}>🏆</div>
          <div className="font-black" style={{ fontSize: tvType.title, color: winner?.color || FI.primary }}>{winner?.name} {t('tv.wins', 'gewinnt!')}</div>
        </motion.div>
        <TVScoreboard players={roster} sort="score" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: FI.bg, color: FI.text }}>
      {/* soft brand wash (static, low blur) */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(34,211,238,0.10)' }} />
      <div className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(167,139,250,0.09)' }} />

      {/* Wordmark */}
      <div className="relative flex items-center justify-center gap-3 pt-[clamp(1rem,2vh,2rem)]">
        <span style={{ fontSize: tvType.label }}>🔎</span>
        <span className="font-black tracking-[0.35em]" style={{ fontSize: tvType.label, color: FI.primary }}>WO IST WAS</span>
      </div>

      {/* 3-zone broadcast grid */}
      <div className="relative flex-1 grid grid-cols-[minmax(260px,1fr)_2.2fr_minmax(280px,1fr)] gap-[clamp(1rem,2vw,2.5rem)] p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
        {/* LEFT — round + mode + phase */}
        <div className={`${tvPanel} flex flex-col items-center justify-center gap-8 p-[clamp(1rem,1.8vw,2rem)] text-center`}>
          <div>
            <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: FI.dim }}>{t('tv.round', 'Runde')}</span>
            <div className="font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color: FI.text }}>
              {round}{totalRounds ? <span style={{ fontSize: tvType.body, color: FI.dim }}>/{totalRounds}</span> : null}
            </div>
          </div>
          <span className="px-5 py-2 rounded-full font-black uppercase tracking-wider" style={{ fontSize: tvType.micro, color: FI.secondary, background: `${FI.secondary}1a`, border: `1.5px solid ${FI.secondary}55` }}>
            {meta.icon} {meta.label}
          </span>
          <AnimatePresence mode="wait">
            <motion.span key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={spring.snappy}
              className="px-4 py-1.5 rounded-full font-bold uppercase tracking-wider" style={{ fontSize: tvType.micro, color: FI.dim, border: `1px solid ${FI.dim}44` }}>
              {phaseLabel(phase, t)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* CENTER — mode/phase-appropriate HERO */}
        <div className="flex flex-col items-center justify-center gap-8 min-h-0 text-center">
          <AnimatePresence mode="wait">
            {phase === 'study' ? (
              <motion.div key="study" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring.soft} className="flex flex-col items-center gap-8">
                <span className="uppercase tracking-[0.3em] font-black" style={{ fontSize: tvType.label, color: FI.dim }}>{t('tv.findit.memorize', 'Einprägen!')}</span>
                <CountRing value={studyCountdown} color={studyCountdown <= 3 ? FI.bad : FI.primary} ambient={ambient} />
                <span style={{ fontSize: tvType.body, color: FI.dim }}>{t('tv.findit.lookAtDevice', 'Schau auf dein Gerät')}</span>
              </motion.div>
            ) : showAnswer ? (
              <motion.div key="answer" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={spring.bouncy} className="flex flex-col items-center gap-6">
                {answerCorrect !== null && (
                  <motion.div initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={spring.game} className="font-black leading-none"
                    style={{ fontSize: tvType.hero, color: answerCorrect ? FI.good : FI.bad }}>
                    {answerCorrect ? '✓' : '✗'}
                  </motion.div>
                )}
                {geoName && (
                  <>
                    <span className="uppercase tracking-[0.25em] font-black" style={{ fontSize: tvType.label, color: FI.dim }}>{t('tv.findit.location', 'Standort')}</span>
                    <h2 className="font-black text-white max-w-[18ch]" style={{ fontSize: tvType.title, color: FI.accent }}>{geoName}</h2>
                  </>
                )}
                {!geoName && question && (
                  <h2 className="font-black text-white max-w-[20ch]" style={{ fontSize: tvType.title }}>{question}</h2>
                )}
              </motion.div>
            ) : isGeoMode ? (
              <motion.div key="geo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring.soft} className="flex flex-col items-center gap-8">
                <motion.div style={{ fontSize: tvType.hero }} animate={ambient ? { y: [0, -14, 0] } : {}} transition={{ duration: 2.2, repeat: Infinity, ease: ease.inOut }}>
                  {meta.icon}
                </motion.div>
                <h2 className="font-black text-white max-w-[18ch]" style={{ fontSize: tvType.title }}>{t('tv.findit.lookAtDevice', 'Schau auf dein Gerät')}</h2>
                <span style={{ fontSize: tvType.body, color: FI.dim }}>{t('tv.findit.guessOnDevice', 'Rate den Standort auf deinem Gerät')}</span>
              </motion.div>
            ) : (
              <motion.div key="question" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring.soft} className="flex flex-col items-center gap-8 w-full">
                {totalQuestions > 0 && (
                  <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.label, color: FI.dim }}>
                    {t('tv.findit.questionN', 'Frage')} {questionIdx + 1}/{totalQuestions}
                  </span>
                )}
                <AnimatePresence mode="wait">
                  <motion.h2 key={question || questionIdx} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={spring.bouncy}
                    className="font-black text-white max-w-[22ch] leading-tight" style={{ fontSize: tvType.title, color: question ? FI.text : FI.dim }}>
                    {question || t('tv.findit.lookAtDevice', 'Schau auf dein Gerät')}
                  </motion.h2>
                </AnimatePresence>
                {questionCountdown > 0 && (
                  <div className="h-3 rounded-full overflow-hidden" style={{ width: 'min(40vw,500px)', background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div className="h-full w-full rounded-full origin-left"
                      style={{ background: questionCountdown <= 4 ? FI.bad : FI.primary }}
                      animate={{ scaleX: Math.max(0, Math.min(1, questionCountdown / 15)) }} transition={{ duration: 0.4, ease: ease.out }} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — top of the leaderboard (rail layout, whole party scrolls in strip) */}
        <div className={`${tvPanel} flex flex-col p-[clamp(1rem,1.8vw,2rem)] min-h-0`}>
          <span className="uppercase tracking-[0.25em] font-bold mb-4" style={{ fontSize: tvType.micro, color: FI.dim }}>{t('tv.leaderboard', 'Rangliste')}</span>
          <div className="flex flex-col gap-2.5 overflow-hidden">
            {[...players].sort((a, b) => b.score - a.score).slice(0, 6).map((p, idx) => (
              <motion.div key={p.id} layout transition={spring.soft} className="flex items-center gap-3 rounded-2xl px-4 py-2.5" style={{ background: '#0e1d28', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-black tabular-nums w-6 text-center" style={{ fontSize: tvType.body, color: idx === 0 ? FI.accent : FI.dim }}>{idx + 1}</span>
                <div className="rounded-full flex items-center justify-center font-black text-white shrink-0" style={{ width: 'clamp(2rem,2.4vw,2.6rem)', height: 'clamp(2rem,2.4vw,2.6rem)', fontSize: tvType.micro, background: p.color }}>
                  {p.avatar || p.name?.slice(0, 1).toUpperCase()}
                </div>
                <span className="font-bold text-white truncate flex-1" style={{ fontSize: tvType.micro }}>{p.name}</span>
                <motion.span key={p.score} initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={spring.bouncy} className="font-black tabular-nums" style={{ fontSize: tvType.body, color: FI.primary }}>{p.score}</motion.span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM — whole-party scoreboard strip (score + streak) */}
      <div className="relative px-[clamp(1.25rem,2.4vw,3rem)] pb-[clamp(1rem,2vh,2rem)]">
        <TVScoreboard players={roster} sort="score" />
      </div>
    </div>
  );
}

function CountRing({ value, color, ambient }: { value: number; color: string; ambient: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 'clamp(7rem,14vw,16rem)', height: 'clamp(7rem,14vw,16rem)' }}>
      <motion.div className="absolute inset-0 rounded-full" style={{ border: `4px solid ${color}`, ...tvActiveRing(color) }}
        animate={ambient ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 1, repeat: Infinity, ease: ease.inOut }} />
      <AnimatePresence mode="wait">
        <motion.span key={value} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.4, opacity: 0 }} transition={spring.game}
          className="font-black tabular-nums leading-none" style={{ fontSize: tvType.display, color }}>{value}</motion.span>
      </AnimatePresence>
    </div>
  );
}
