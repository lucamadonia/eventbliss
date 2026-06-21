import { memo } from 'react';
import { motion } from 'framer-motion';
import { tvType, tvActiveRing } from '../tv-tokens';

/**
 * TVScoreboard — the shared "every player is on screen" roster for all TV views.
 *
 * The TV is the group's shared canvas, so it always shows the WHOLE party, not
 * just the active player: avatar, name, score (+ optional target progress),
 * leader crown, a per-game subtitle (hooks, streak, penalties…), and a clear
 * status treatment (active ring / done ✓ / out / waiting). Drop it into the
 * bottom strip (`layout="strip"`) or a side rail (`layout="rail"`).
 */
export interface TVScorePlayer {
  id: string;
  name: string;
  color: string;
  score?: number;
  /** small line under the name, e.g. "3 🎣", "🔥 4", "2 Strafen" */
  subtitle?: string;
  /** drives the visual treatment; defaults to 'active' for the activeId player */
  status?: 'active' | 'done' | 'out' | 'waiting';
  avatar?: string;
}

interface Props {
  players: TVScorePlayer[];
  activeId?: string | null;
  /** when set, each chip shows a score/target progress bar */
  target?: number;
  /** 'strip' = horizontal bottom bar, 'rail' = vertical side column */
  layout?: 'strip' | 'rail';
  /** sort by score desc (default) or keep play order (e.g. turn order) */
  sort?: 'score' | 'order';
  className?: string;
}

function TVScoreboardImpl({ players, activeId, target, layout = 'strip', sort = 'score', className }: Props) {
  const hasScores = players.some((p) => typeof p.score === 'number');
  const ordered = sort === 'score' && hasScores
    ? [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    : players;
  const leaderScore = Math.max(0, ...players.map((p) => p.score ?? 0));

  const isRail = layout === 'rail';

  return (
    <div className={`flex ${isRail ? 'flex-col' : 'flex-wrap justify-center'} gap-2.5 ${className ?? ''}`}>
      {ordered.map((p, i) => {
        const status = p.status ?? (p.id === activeId ? 'active' : 'waiting');
        const isActive = status === 'active';
        const isLeader = hasScores && (p.score ?? 0) === leaderScore && leaderScore > 0;
        const dimmed = status === 'out' || status === 'done';
        const pct = target ? Math.max(0, Math.min(1, (p.score ?? 0) / target)) : 0;

        const rank = sort === 'score' && hasScores ? i + 1 : null;
        const showRank = rank !== null && (p.score ?? 0) > 0;

        return (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: dimmed ? 0.55 : 1, y: 0 }}
            transition={{ layout: { type: 'spring', stiffness: 360, damping: 30 }, delay: Math.min(i * 0.04, 0.3) }}
            className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${isRail ? 'w-full' : ''}`}
            style={{
              background: isLeader ? `linear-gradient(120deg, ${p.color}1f, #140e24 60%)` : '#140e24',
              border: `1.5px solid ${isActive ? p.color : isLeader ? `${p.color}66` : 'rgba(255,255,255,0.08)'}`,
              ...(isActive ? tvActiveRing(p.color) : isLeader ? { boxShadow: `0 0 28px -8px ${p.color}` } : {}),
            }}
          >
            {showRank && (
              <span
                className="shrink-0 font-black tabular-nums text-center"
                style={{ fontSize: tvType.label, width: '1.4em', color: rank === 1 ? '#FFD23F' : rank === 2 ? '#cfd3dc' : rank === 3 ? '#e0915b' : '#6b6480' }}
              >
                {rank}
              </span>
            )}
            <div
              className="relative shrink-0 rounded-full flex items-center justify-center font-black text-white"
              style={{ width: 'clamp(2rem,2.6vw,2.75rem)', height: 'clamp(2rem,2.6vw,2.75rem)', fontSize: tvType.micro, background: p.color }}
            >
              {p.avatar || p.name?.slice(0, 1).toUpperCase()}
              {status === 'done' && (
                <span className="absolute -right-1 -bottom-1 rounded-full bg-emerald-500 text-white w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
              )}
              {status === 'out' && (
                <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-[11px]">💀</span>
              )}
            </div>

            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                {isLeader && <span style={{ fontSize: tvType.micro }}>👑</span>}
                <span className="font-bold text-white truncate" style={{ fontSize: tvType.micro }}>{p.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {typeof p.score === 'number' && target ? (
                  <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full origin-left" style={{ background: p.color, transform: `scaleX(${pct})` }} />
                  </div>
                ) : null}
                <span className="font-mono tabular-nums whitespace-nowrap" style={{ fontSize: tvType.micro, color: '#b3a8c9' }}>
                  {typeof p.score === 'number' ? (target ? `${p.score}/${target}` : p.score) : ''}
                  {p.subtitle ? `${typeof p.score === 'number' ? ' · ' : ''}${p.subtitle}` : ''}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Memoized — a stable roster won't re-render on the TV's per-second tick. */
const TVScoreboard = memo(TVScoreboardImpl);
export default TVScoreboard;
