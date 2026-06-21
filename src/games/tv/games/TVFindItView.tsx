import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { spring, ease } from '@/lib/motion';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';
import TVScoreboard, { type TVScorePlayer } from '../components/TVScoreboard';

/**
 * TVFindItView — big-screen view for "Wo ist Was" (5 modes: memory/speed grid,
 * unterschiede, karte, streetview). FindIt has NO per-player secrets — everyone
 * plays along — so the TV mirrors the phone's actual content and becomes the
 * shared screen the room watches:
 *
 *   memory/speed:  the EMOJI GRID large & central (study), then the QUESTION +
 *                  Kahoot-style answer tiles so the room guesses along; the reveal
 *                  highlights the correct tile.
 *   unterschiede:  both grids side by side; reveal rings the differing cells.
 *   karte/street:  a clean location focal card — "tap on your device" is only a
 *                  small hint; the target city is revealed at round end. (No live
 *                  Leaflet/StreetView embed — too heavy for the TV.)
 *
 * The ONLY thing hidden before the answer phase is the answer itself (the correct
 * option index / diff targets) — the grid, question and options are all shown.
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

/** Split the newline-emoji grid string into rows of grapheme cells. */
function parseGrid(grid: string): string[][] {
  if (!grid) return [];
  const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;
  return grid.split('\n').map((row) => (seg ? Array.from(seg.segment(row), (s) => s.segment) : Array.from(row)));
}

// Tile colors for the 2x2 (or N) answer board — Kahoot-style cue shapes.
const TILE = [
  { bg: '#e0506b', glyph: '▲' },
  { bg: '#3b82f6', glyph: '◆' },
  { bg: '#eab308', glyph: '●' },
  { bg: '#22a06b', glyph: '■' },
  { bg: '#a855f7', glyph: '★' },
  { bg: '#f97316', glyph: '⬢' },
];

const OPT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

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
  const sceneName: string = gameState?.sceneName || '';
  const grid: string = gameState?.grid || '';
  const gridA: string = gameState?.gridA || '';
  const gridB: string = gameState?.gridB || '';
  const diffs: number[] = gameState?.diffs || [];
  const foundDiffs: number[] = gameState?.foundDiffs || [];
  const diffCount: number = gameState?.diffCount ?? 0;
  const question: string = gameState?.question || '';
  const options: string[] = gameState?.options || [];
  const correctOption: number | null = gameState?.correctOption ?? null;
  const geoName: string = gameState?.geoName || '';
  const answerCorrect: boolean | null = gameState?.answerCorrect ?? null;

  const meta = modeMeta(mode, t);
  const isGeoMode = mode === 'karte' || mode === 'streetview';
  const isDiff = mode === 'unterschiede';
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
        {sceneName && <span className="font-bold" style={{ fontSize: tvType.label, color: FI.dim }}>· {sceneName}</span>}
      </div>

      {/* 3-zone broadcast grid */}
      <div className="relative flex-1 grid grid-cols-[minmax(240px,1fr)_2.6fr_minmax(240px,1fr)] gap-[clamp(1rem,2vw,2.5rem)] p-[clamp(1.25rem,2.4vw,3rem)] min-h-0">
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
        <div className="flex flex-col items-center justify-center gap-6 min-h-0 text-center w-full">
          <AnimatePresence mode="wait">
            {isGeoMode ? (
              <GeoHero key="geo" mode={mode} meta={meta} geoName={geoName} showAnswer={showAnswer} ambient={ambient} t={t} />
            ) : isDiff ? (
              <DiffHero key="diff" gridA={gridA} gridB={gridB} diffs={showAnswer ? diffs : []} found={foundDiffs} diffCount={diffCount} t={t} />
            ) : phase === 'study' ? (
              <motion.div key="study" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={spring.soft} className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center gap-4">
                  <span className="uppercase tracking-[0.3em] font-black" style={{ fontSize: tvType.label, color: FI.dim }}>{t('tv.findit.memorize', 'Einprägen!')}</span>
                  <span className="font-black tabular-nums px-4 py-1 rounded-full" style={{ fontSize: tvType.title, color: studyCountdown <= 3 ? FI.bad : FI.primary, background: '#0e1d28' }}>{studyCountdown}</span>
                </div>
                <EmojiGrid grid={grid} ambient={ambient} />
              </motion.div>
            ) : (
              <motion.div key="question" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring.soft} className="flex flex-col items-center gap-6 w-full">
                {totalQuestions > 0 && (
                  <span className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: tvType.micro, color: FI.dim }}>
                    {t('tv.findit.questionN', 'Frage')} {questionIdx + 1}/{totalQuestions}
                  </span>
                )}
                <AnimatePresence mode="wait">
                  <motion.h2 key={question || questionIdx} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={spring.bouncy}
                    className="font-black text-white max-w-[24ch] leading-tight" style={{ fontSize: tvType.title }}>
                    {question || t('tv.findit.lookAtDevice', 'Schau auf dein Gerät')}
                  </motion.h2>
                </AnimatePresence>

                {/* Kahoot-style answer board — the room plays along */}
                {options.length > 0 && (
                  <div className="grid gap-3 w-full max-w-[52vw]" style={{ gridTemplateColumns: options.length <= 2 ? '1fr' : 'repeat(2, 1fr)' }}>
                    {options.map((opt, i) => {
                      const tile = TILE[i % TILE.length];
                      const isCorrect = showAnswer && correctOption === i;
                      const isWrongReveal = showAnswer && correctOption !== null && correctOption !== i;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: isWrongReveal ? 0.4 : 1, scale: isCorrect ? 1.04 : 1 }} transition={spring.bouncy}
                          className="flex items-center gap-3 rounded-2xl px-5 py-4 text-left"
                          style={{ background: tile.bg, ...(isCorrect ? tvActiveRing(FI.good) : {}) }}>
                          <span className="font-black opacity-80" style={{ fontSize: tvType.body, color: 'white' }}>{tile.glyph}</span>
                          <span className="font-black text-white flex-1" style={{ fontSize: tvType.body }}>{opt}</span>
                          <span className="font-black text-white/70" style={{ fontSize: tvType.micro }}>{OPT_LABELS[i]}</span>
                          {isCorrect && <span style={{ fontSize: tvType.body }}>✓</span>}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* question timer — hidden once the answer is revealed */}
                {!showAnswer && questionCountdown > 0 && (
                  <div className="h-3 rounded-full overflow-hidden" style={{ width: 'min(40vw,500px)', background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div className="h-full w-full rounded-full origin-left"
                      style={{ background: questionCountdown <= 4 ? FI.bad : FI.primary }}
                      animate={{ scaleX: Math.max(0, Math.min(1, questionCountdown / 15)) }} transition={{ duration: 0.4, ease: ease.out }} />
                  </div>
                )}
                {showAnswer && answerCorrect !== null && (
                  <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={spring.game} className="font-black" style={{ fontSize: tvType.title, color: answerCorrect ? FI.good : FI.bad }}>
                    {answerCorrect ? '✓ ' + t('tv.findit.correct', 'Richtig!') : '✗ ' + t('tv.findit.wrong', 'Daneben')}
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — live leaderboard (top 6) */}
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

/** The shared emoji scene — rendered as a real grid of large cells. */
function EmojiGrid({ grid, ambient }: { grid: string; ambient: boolean }) {
  const rows = parseGrid(grid);
  if (rows.length === 0) return null;
  const cols = Math.max(...rows.map((r) => r.length));
  return (
    <div className={`${tvPanel} p-[clamp(0.75rem,1.6vw,1.75rem)]`}>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {rows.flatMap((row, r) =>
          row.map((cell, c) => (
            <motion.div key={`${r}-${c}`}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring.bouncy, delay: ambient ? Math.min((r * cols + c) * 0.025, 0.5) : 0 }}
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 'clamp(2.6rem,5.2vw,6rem)', height: 'clamp(2.6rem,5.2vw,6rem)', fontSize: 'clamp(1.6rem,3.4vw,4rem)', background: '#0e1d28', border: '1px solid rgba(255,255,255,0.06)' }}>
              {cell}
            </motion.div>
          )),
        )}
      </div>
    </div>
  );
}

/** Two emoji grids side by side; on reveal, the differing cells get a ring. */
function DiffHero({ gridA, gridB, diffs, found, diffCount, t }: { gridA: string; gridB: string; diffs: number[]; found: number[]; diffCount: number; t: (k: string, d?: string) => string }) {
  const rowsA = parseGrid(gridA);
  const rowsB = parseGrid(gridB);
  const colsB = Math.max(1, ...rowsB.map((r) => r.length));
  const flatIndex = (r: number, c: number) => r * colsB + c;

  const Grid = ({ rows, ringDiffs, label }: { rows: string[][]; ringDiffs: boolean; label: string }) => {
    const cols = Math.max(1, ...rows.map((r) => r.length));
    return (
      <div className={`${tvPanel} p-[clamp(0.6rem,1.2vw,1.25rem)]`}>
        <div className="uppercase tracking-[0.2em] font-bold mb-2 text-center" style={{ fontSize: tvType.micro, color: FI.dim }}>{label}</div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {rows.flatMap((row, r) =>
            row.map((cell, c) => {
              const idx = flatIndex(r, c);
              const isDiff = ringDiffs && diffs.includes(idx);
              const isFound = found.includes(idx);
              return (
                <motion.div key={`${r}-${c}`} animate={isDiff ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={isDiff ? { duration: 0.6, repeat: Infinity } : {}}
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 'clamp(1.9rem,3.4vw,3.6rem)', height: 'clamp(1.9rem,3.4vw,3.6rem)', fontSize: 'clamp(1.1rem,2.2vw,2.4rem)', background: '#0e1d28', border: `1px solid rgba(255,255,255,0.06)`, ...(isDiff || isFound ? tvActiveRing(isFound ? FI.good : FI.accent) : {}) }}>
                  {cell}
                </motion.div>
              );
            }),
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring.soft} className="flex flex-col items-center gap-4">
      <span className="font-black" style={{ fontSize: tvType.body, color: FI.dim }}>
        {t('tv.findit.spotDiff', 'Finde die Unterschiede')} · {found.length}/{diffCount}
      </span>
      <div className="flex items-start gap-[clamp(1rem,2vw,2.5rem)]">
        <Grid rows={rowsA} ringDiffs={false} label="A" />
        <Grid rows={rowsB} ringDiffs label="B" />
      </div>
    </motion.div>
  );
}

/** Karte / Street View focal card — location reveal, not a live map embed. */
function GeoHero({ mode, meta, geoName, showAnswer, ambient, t }: { mode: string; meta: { icon: string; label: string }; geoName: string; showAnswer: boolean; ambient: boolean; t: (k: string, d?: string) => string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={spring.soft}
      className={`${tvPanel} flex flex-col items-center gap-6 px-[clamp(2rem,5vw,5rem)] py-[clamp(1.5rem,3.5vw,3.5rem)] text-center`}>
      <motion.div style={{ fontSize: tvType.hero }} animate={ambient ? { y: [0, -14, 0] } : {}} transition={{ duration: 2.2, repeat: Infinity, ease: ease.inOut }}>
        {meta.icon}
      </motion.div>
      {showAnswer && geoName ? (
        <AnimatePresence mode="wait">
          <motion.div key={geoName} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring.bouncy} className="flex flex-col items-center gap-2">
            <span className="uppercase tracking-[0.25em] font-black" style={{ fontSize: tvType.label, color: FI.dim }}>{t('tv.findit.location', 'Standort')}</span>
            <h2 className="font-black max-w-[18ch]" style={{ fontSize: tvType.display, color: FI.accent }}>{geoName}</h2>
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          <h2 className="font-black text-white max-w-[16ch]" style={{ fontSize: tvType.title }}>
            {mode === 'streetview' ? t('tv.findit.guessCity', 'Welche Stadt ist das?') : t('tv.findit.guessLocation', 'Wo ist das?')}
          </h2>
          <span className="px-5 py-2 rounded-full font-bold" style={{ fontSize: tvType.micro, color: FI.dim, border: `1px solid ${FI.dim}44` }}>
            {t('tv.findit.tapOnDevice', 'Tippe auf deinem Gerät zum Raten')}
          </span>
        </>
      )}
    </motion.div>
  );
}
