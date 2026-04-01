import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Target, Flame, Clock, Gamepad2,
  Star, ArrowLeft, BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStats } from './useGameStats';
import { useAchievements } from './useAchievements';
import { Leaderboard } from './Leaderboard';
import type { Achievement, GameStat, UserAchievement } from './types';
import { RARITY_COLORS, RARITY_LABELS, GAME_NAMES } from './types';

type Tab = 'overview' | 'achievements' | 'leaderboard';

export function GameProfilePage() {
  const navigate = useNavigate();
  const { getMyStats } = useGameStats();
  const { getAllAchievements, getMyAchievements } = useAchievements();

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<GameStat[]>([]);
  const [allAch, setAllAch] = useState<Achievement[]>([]);
  const [myAch, setMyAch] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyStats(), getAllAchievements(), getMyAchievements()]).then(
      ([s, a, m]) => {
        setStats(s);
        setAllAch(a);
        setMyAch(m);
        setLoading(false);
      },
    );
  }, [getMyStats, getAllAchievements, getMyAchievements]);

  const unlockedIds = useMemo(() => new Set(myAch.map((a) => a.achievement_id)), [myAch]);

  const totals = useMemo(() => {
    const gamesPlayed = stats.reduce((s, g) => s + g.games_played, 0);
    const gamesWon = stats.reduce((s, g) => s + g.games_won, 0);
    const totalScore = stats.reduce((s, g) => s + g.total_score, 0);
    const timePlayed = stats.reduce((s, g) => s + g.total_time_played, 0);
    const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
    const bestStreak = Math.max(0, ...stats.map((g) => g.best_streak));
    const favorite = stats.length > 0
      ? stats.reduce((a, b) => (a.games_played > b.games_played ? a : b)).game_id
      : null;
    return { gamesPlayed, gamesWon, totalScore, timePlayed, winRate, bestStreak, favorite };
  }, [stats]);

  const achievementPoints = useMemo(() => {
    return myAch.reduce((sum, ua) => {
      const ach = allAch.find((a) => a.id === ua.achievement_id);
      return sum + (ach?.points ?? 0);
    }, 0);
  }, [myAch, allAch]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Uebersicht' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'leaderboard', label: 'Bestenliste' },
  ];

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: '#0a0e14' }}>
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/games')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: '#1b2028', border: '1px solid rgba(72, 71, 80, 0.15)' }}
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Mein Profil</h1>
            <p className="text-xs text-gray-500">{achievementPoints} Achievement-Punkte</p>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: '#151a21', border: '1px solid rgba(72, 71, 80, 0.1)' }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: tab === t.id ? '#20262f' : 'transparent',
                color: tab === t.id ? '#df8eff' : '#6b7280',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <LoadingSkeleton />}

        {!loading && tab === 'overview' && (
          <OverviewTab
            totals={totals}
            stats={stats}
            unlockedCount={myAch.length}
            totalCount={allAch.length}
            formatTime={formatTime}
          />
        )}

        {!loading && tab === 'achievements' && (
          <AchievementsTab
            allAchievements={allAch}
            unlockedIds={unlockedIds}
            stats={stats}
          />
        )}

        {!loading && tab === 'leaderboard' && <Leaderboard />}
      </div>
    </div>
  );
}

/* ─── Overview Tab ──────────────────────────────────────────── */

interface OverviewTabProps {
  totals: {
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    timePlayed: number;
    winRate: number;
    bestStreak: number;
    favorite: string | null;
  };
  stats: GameStat[];
  unlockedCount: number;
  totalCount: number;
  formatTime: (s: number) => string;
}

function OverviewTab({ totals, stats, unlockedCount, totalCount, formatTime }: OverviewTabProps) {
  const statCards = [
    { icon: Gamepad2, label: 'Spiele', value: totals.gamesPlayed, color: '#df8eff' },
    { icon: Trophy, label: 'Siege', value: totals.gamesWon, color: '#ffd700' },
    { icon: Target, label: 'Siegesrate', value: `${totals.winRate}%`, color: '#8ff5ff' },
    { icon: Star, label: 'Punkte', value: totals.totalScore.toLocaleString(), color: '#ff6b98' },
    { icon: Flame, label: 'Beste Serie', value: totals.bestStreak, color: '#ff7350' },
    { icon: Clock, label: 'Spielzeit', value: formatTime(totals.timePlayed), color: '#00e3fd' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="p-3 rounded-xl text-center"
            style={{
              background: '#151a21',
              border: `1px solid ${card.color}15`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <card.icon className="w-4 h-4 mx-auto mb-1" style={{ color: card.color }} />
            <p className="text-lg font-bold text-white">{card.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Achievement progress */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Achievements</span>
          <span className="text-xs" style={{ color: '#df8eff' }}>
            {unlockedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#20262f' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #df8eff, #ff6b98)' }}
            initial={{ width: 0 }}
            animate={{ width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </GlassCard>

      {/* Favorite game */}
      {totals.favorite && (
        <GlassCard>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" style={{ color: '#8ff5ff' }} />
            <span className="text-xs text-gray-500">Lieblingsspiel</span>
          </div>
          <p className="text-white font-bold mt-1">{GAME_NAMES[totals.favorite] ?? totals.favorite}</p>
        </GlassCard>
      )}

      {/* Per-game breakdown */}
      {stats.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: '#8ff5ff' }} />
            <h3 className="text-sm font-semibold text-white">Pro Spiel</h3>
          </div>
          {stats
            .sort((a, b) => b.games_played - a.games_played)
            .map((g, i) => (
              <motion.div
                key={g.game_id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#151a21', border: '1px solid rgba(72, 71, 80, 0.1)' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <span className="flex-1 text-sm text-white font-medium truncate">
                  {GAME_NAMES[g.game_id] ?? g.game_id}
                </span>
                <StatChip label="Spiele" value={g.games_played} color="#df8eff" />
                <StatChip label="Siege" value={g.games_won} color="#ffd700" />
                <StatChip label="Beste" value={g.best_score} color="#8ff5ff" />
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ─── Achievements Tab ──────────────────────────────────────── */

interface AchievementsTabProps {
  allAchievements: Achievement[];
  unlockedIds: Set<string>;
  stats: GameStat[];
}

function AchievementsTab({ allAchievements, unlockedIds, stats }: AchievementsTabProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const a of allAchievements) {
      const list = map.get(a.category) ?? [];
      list.push(a);
      map.set(a.category, list);
    }
    return map;
  }, [allAchievements]);

  const categoryLabel = (cat: string) => {
    if (cat === 'general') return 'Allgemein';
    return GAME_NAMES[cat] ?? cat;
  };

  const getProgress = (a: Achievement): number => {
    if (unlockedIds.has(a.id)) return 1;
    // Find matching stat
    const stat = stats.find((s) =>
      a.category === 'general' ? true : s.game_id === a.category,
    );
    if (!stat) return 0;

    let current = 0;
    switch (a.requirement_type) {
      case 'games_played':
        current = a.category === 'general'
          ? stats.reduce((s, g) => s + g.games_played, 0)
          : stat.games_played;
        break;
      case 'games_won':
        current = a.category === 'general'
          ? stats.reduce((s, g) => s + g.games_won, 0)
          : stat.games_won;
        break;
      case 'score':
        current = a.category === 'general'
          ? stats.reduce((s, g) => s + g.total_score, 0)
          : stat.total_score;
        break;
      case 'streak':
        current = a.category === 'general'
          ? Math.max(0, ...stats.map((g) => g.best_streak))
          : stat.best_streak;
        break;
    }
    return Math.min(current / a.requirement_value, 1);
  };

  const categories = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'general') return -1;
    if (b === 'general') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat} className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {categoryLabel(cat)}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(grouped.get(cat) ?? []).map((a) => {
              const unlocked = unlockedIds.has(a.id);
              const progress = getProgress(a);
              const rarityColor = RARITY_COLORS[a.rarity] ?? RARITY_COLORS.common;

              return (
                <motion.div
                  key={a.id}
                  className="p-3 rounded-xl relative overflow-hidden"
                  style={{
                    background: unlocked ? `${rarityColor}08` : '#151a21',
                    border: `1px solid ${unlocked ? `${rarityColor}25` : 'rgba(72, 71, 80, 0.1)'}`,
                    opacity: unlocked ? 1 : 0.7,
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>
                      {unlocked ? a.icon : '🔒'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{a.name}</p>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{a.description}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!unlocked && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#20262f' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress * 100}%`,
                            background: rarityColor,
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-600 mt-0.5 text-right">
                        {Math.round(progress * 100)}%
                      </p>
                    </div>
                  )}

                  {/* Rarity + points badge */}
                  <div className="flex items-center justify-between mt-1.5">
                    <span
                      className="text-[8px] font-bold uppercase tracking-wider"
                      style={{ color: rarityColor }}
                    >
                      {RARITY_LABELS[a.rarity]}
                    </span>
                    <span className="text-[9px] font-semibold" style={{ color: rarityColor }}>
                      {a.points}P
                    </span>
                  </div>

                  {/* Unlocked glow */}
                  {unlocked && (
                    <div
                      className="absolute inset-0 pointer-events-none rounded-xl"
                      style={{
                        boxShadow: `inset 0 0 30px ${rarityColor}08`,
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Shared Components ─────────────────────────────────────── */

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: '#151a21',
        border: '1px solid rgba(72, 71, 80, 0.1)',
      }}
    >
      {children}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="text-center min-w-[40px]">
      <p className="text-xs font-bold" style={{ color }}>{value}</p>
      <p className="text-[8px] text-gray-600 uppercase">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#151a21' }} />
        ))}
      </div>
      <div className="h-16 rounded-xl animate-pulse" style={{ background: '#151a21' }} />
    </div>
  );
}
