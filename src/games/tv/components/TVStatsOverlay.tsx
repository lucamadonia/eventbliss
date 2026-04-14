/**
 * TVStatsOverlay — live statistics dashboard overlay for TV Mode.
 * Shows animated bar charts, streaks, accuracy rings, and player rankings.
 * Auto-detects available stats from gameState.players and renders
 * appropriate visualizations per game type.
 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TVStatsOverlayProps {
  gameState: {
    game: string;
    phase: string;
    players?: any[];
    [key: string]: unknown;
  } | null;
  visible?: boolean;
}

const HIDDEN_PHASES = new Set(['setup', 'lobby', 'gameOver']);
const DEFAULT_COLOR = '#df8eff';

const panelVariants = {
  hidden: { x: 300, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 160, damping: 22 } },
  exit: { x: 300, opacity: 0, transition: { duration: 0.3 } },
};

const barTransition = { type: 'spring' as const, stiffness: 200, damping: 25 };

// --- Score Ranking Section ---
function ScoreRanking({ players }: { players: any[] }) {
  const maxScore = Math.max(1, ...players.map((p) => p.score || 0));
  const sorted = useMemo(
    () => [...players].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [players],
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-[#8ff5ff] mb-1">Ranking</p>
      {sorted.map((p, i) => {
        const pct = ((p.score || 0) / maxScore) * 100;
        const color = p.color || DEFAULT_COLOR;
        const isLeader = i === 0 && (p.score || 0) > 0;
        return (
          <motion.div
            key={p.id ?? p.name ?? i}
            layout
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <span
              className="text-sm font-medium truncate w-16 text-right"
              style={{ color: isLeader ? '#ffd700' : '#f1f3fc' }}
            >
              {isLeader && '👑 '}
              {p.name}
            </span>
            <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                animate={{ width: `${pct}%` }}
                transition={barTransition}
              />
            </div>
            <motion.span
              key={p.score}
              className="text-sm font-bold tabular-nums min-w-[36px] text-right"
              style={{ color }}
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {p.score ?? 0}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}

// --- Streak Section ---
function StreakSection({ players }: { players: any[] }) {
  const withStreak = players.filter((p) => (p.streak || 0) > 0);
  if (withStreak.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs uppercase tracking-widest text-[#8ff5ff]">🔥 Streak</p>
      {withStreak.map((p, i) => (
        <motion.div
          key={p.id ?? p.name ?? i}
          layout
          className="flex items-center gap-2"
        >
          <span className="text-sm text-[#f1f3fc] truncate w-20">{p.name}</span>
          <motion.span
            key={p.streak}
            className="text-base font-bold"
            style={{ color: p.color || '#ff9f43' }}
            initial={{ scale: 1.35 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 12 }}
          >
            {'🔥'.repeat(Math.min(p.streak, 5))} {p.streak}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}

// --- Accuracy Ring ---
function AccuracyRing({ player }: { player: any }) {
  const correct = player.correct || 0;
  const wrong = player.wrong || 0;
  const total = correct + wrong;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;
  const color = player.color || DEFAULT_COLOR;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <motion.circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 100 }}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
        <text
          x="24"
          y="24"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#f1f3fc"
          fontSize="11"
          fontWeight="bold"
        >
          {Math.round(accuracy)}%
        </text>
      </svg>
      <span className="text-xs text-[#a8abb3] truncate max-w-[56px] text-center">
        {player.name}
      </span>
    </div>
  );
}

function AccuracySection({ players }: { players: any[] }) {
  const withAccuracy = players.filter((p) => typeof p.correct === 'number');
  if (withAccuracy.length === 0) return null;

  const sorted = [...withAccuracy].sort((a, b) => {
    const accA = a.correct / Math.max(1, a.correct + (a.wrong || 0));
    const accB = b.correct / Math.max(1, b.correct + (b.wrong || 0));
    return accB - accA;
  });
  const displayed = sorted.length > 5 ? sorted.slice(0, 3) : sorted;
  const hasMore = sorted.length > 5;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs uppercase tracking-widest text-[#8ff5ff]">Genauigkeit</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {displayed.map((p, i) => (
          <AccuracyRing key={p.id ?? p.name ?? i} player={p} />
        ))}
        {hasMore && (
          <span className="text-xs text-[#a8abb3] self-center">+{sorted.length - 3}</span>
        )}
      </div>
    </div>
  );
}

// --- Activity Stats (game-specific) ---
function ActivityStats({ players, gameState }: { players: any[]; gameState: any }) {
  const hasTruthDare = players.some((p) => typeof p.truthCount === 'number');
  const hasWhoAmI = players.some((p) => typeof p.questionsAsked === 'number');
  const hasBomb = players.some((p) => typeof p.penalties === 'number');
  const hasFastest = players.some((p) => typeof p.fastestMs === 'number' && p.fastestMs > 0);

  if (!hasTruthDare && !hasWhoAmI && !hasBomb && !hasFastest) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs uppercase tracking-widest text-[#8ff5ff]">Aktivität</p>

      {hasTruthDare &&
        players
          .filter((p) => typeof p.truthCount === 'number')
          .map((p, i) => (
            <div key={p.id ?? i} className="flex items-center gap-2 text-sm">
              <span className="text-[#f1f3fc] truncate w-16">{p.name}</span>
              <span className="text-[#a8abb3]">
                Wahrheit: {p.truthCount} | Pflicht: {p.dareCount ?? 0}
              </span>
            </div>
          ))}

      {hasWhoAmI &&
        players
          .filter((p) => typeof p.questionsAsked === 'number')
          .map((p, i) => (
            <div key={p.id ?? i} className="flex items-center gap-2 text-sm">
              <span className="text-[#f1f3fc] truncate w-16">{p.name}</span>
              <span className="text-[#a8abb3]">Fragen: {p.questionsAsked}</span>
              {p.eliminated && (
                <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                  Raus
                </span>
              )}
              {p.guessedCorrectly && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                  ✓
                </span>
              )}
            </div>
          ))}

      {hasBomb &&
        players
          .filter((p) => typeof p.penalties === 'number')
          .map((p, i) => (
            <div key={p.id ?? i} className="flex items-center gap-2 text-sm">
              <span className="text-[#f1f3fc] truncate w-16">{p.name}</span>
              <span className="text-[#a8abb3]">Strafen: {p.penalties}</span>
            </div>
          ))}

      {hasFastest && (() => {
        const fastest = players
          .filter((p) => typeof p.fastestMs === 'number' && p.fastestMs > 0)
          .sort((a, b) => a.fastestMs - b.fastestMs)[0];
        return fastest ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#f1f3fc]">⚡ {fastest.name}</span>
            <span className="text-[#a8abb3]">{fastest.fastestMs}ms</span>
          </div>
        ) : null;
      })()}
    </div>
  );
}

// --- Divider ---
function Divider() {
  return <div className="w-full h-px bg-white/5" />;
}

// --- Main Component ---
export default function TVStatsOverlay({
  gameState,
  visible = true,
}: TVStatsOverlayProps) {
  const players = gameState?.players || [];
  const phase = gameState?.phase || '';

  const hasScores = players.some((p) => typeof p.score === 'number' && p.score > 0);
  const hasStreaks = players.some((p) => typeof p.streak === 'number' && p.streak > 0);
  const hasAccuracy = players.some((p) => typeof p.correct === 'number');
  const hasActivity =
    players.some((p) => typeof p.truthCount === 'number') ||
    players.some((p) => typeof p.questionsAsked === 'number') ||
    players.some((p) => typeof p.penalties === 'number') ||
    players.some((p) => typeof p.fastestMs === 'number' && p.fastestMs > 0);

  const hasMeaningfulStats = hasScores || hasStreaks || hasAccuracy || hasActivity;

  const shouldHide =
    !visible ||
    players.length === 0 ||
    HIDDEN_PHASES.has(phase) ||
    !hasMeaningfulStats;

  const sections: JSX.Element[] = [];
  if (hasScores) sections.push(<ScoreRanking key="scores" players={players} />);
  if (hasStreaks) sections.push(<StreakSection key="streaks" players={players} />);
  if (hasAccuracy) sections.push(<AccuracySection key="accuracy" players={players} />);
  if (hasActivity)
    sections.push(<ActivityStats key="activity" players={players} gameState={gameState} />);

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.aside
          className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-[280px] max-h-[80vh] overflow-y-auto
            rounded-2xl px-4 py-4 flex flex-col gap-3
            border border-white/[0.08] scrollbar-none"
          style={{
            background: 'rgba(6,8,16,0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-widest text-[#8ff5ff] font-medium">
              Live Stats
            </span>
            {gameState?.game && (
              <span className="text-sm text-[#a8abb3] capitalize">{gameState.game}</span>
            )}
          </div>

          <Divider />

          {/* Dynamic Sections */}
          {sections.map((section, i) => (
            <AnimatePresence key={section.key} mode="popLayout">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ delay: i * 0.05 }}
              >
                {section}
                {i < sections.length - 1 && <div className="mt-3"><Divider /></div>}
              </motion.div>
            </AnimatePresence>
          ))}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
