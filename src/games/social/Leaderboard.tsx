import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, ChevronDown } from 'lucide-react';
import { useGameStats } from './useGameStats';
import { supabase } from '@/integrations/supabase/client';
import type { LeaderboardEntry } from './types';
import { GAME_NAMES, RARITY_COLORS } from './types';

const GAME_IDS = Object.keys(GAME_NAMES);

const RANK_STYLES: Record<number, { bg: string; border: string; icon: React.ReactNode; glow: string }> = {
  1: {
    bg: 'rgba(255, 215, 0, 0.08)',
    border: 'rgba(255, 215, 0, 0.3)',
    icon: <Crown className="w-5 h-5 text-yellow-400" />,
    glow: '0 0 20px rgba(255, 215, 0, 0.15)',
  },
  2: {
    bg: 'rgba(192, 192, 192, 0.06)',
    border: 'rgba(192, 192, 192, 0.25)',
    icon: <Medal className="w-5 h-5 text-gray-300" />,
    glow: '0 0 15px rgba(192, 192, 192, 0.1)',
  },
  3: {
    bg: 'rgba(205, 127, 50, 0.06)',
    border: 'rgba(205, 127, 50, 0.25)',
    icon: <Medal className="w-5 h-5 text-amber-600" />,
    glow: '0 0 15px rgba(205, 127, 50, 0.1)',
  },
};

interface LeaderboardProps {
  initialGameId?: string;
}

export function Leaderboard({ initialGameId }: LeaderboardProps) {
  const [selectedGame, setSelectedGame] = useState(initialGameId ?? GAME_IDS[0]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { getLeaderboard } = useGameStats();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLeaderboard(selectedGame, 50).then((data) => {
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedGame, getLeaderboard]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: RARITY_COLORS.legendary }} />
          <h2 className="text-lg font-bold text-white">Bestenliste</h2>
        </div>

        {/* Game filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: 'rgba(223, 142, 255, 0.1)',
              color: '#df8eff',
              border: '1px solid rgba(223, 142, 255, 0.2)',
            }}
          >
            {GAME_NAMES[selectedGame] ?? selectedGame}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showDropdown && (
            <motion.div
              className="absolute right-0 top-full mt-1 w-48 rounded-xl overflow-hidden z-50"
              style={{
                background: '#1b2028',
                border: '1px solid rgba(223, 142, 255, 0.15)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="max-h-60 overflow-y-auto py-1">
                {GAME_IDS.map((gid) => (
                  <button
                    key={gid}
                    onClick={() => { setSelectedGame(gid); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: gid === selectedGame ? '#df8eff' : '#9ca3af' }}
                  >
                    {GAME_NAMES[gid]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl animate-pulse"
              style={{ background: '#1b2028' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: '#484750' }} />
          <p className="text-gray-500 text-sm">Noch keine Eintraege</p>
          <p className="text-gray-600 text-xs mt-1">Spiele ein Spiel, um hier zu erscheinen!</p>
        </div>
      )}

      {/* Entries */}
      {!loading && entries.length > 0 && (
        <div className="space-y-1.5">
          {entries.map((entry, i) => {
            const rankStyle = RANK_STYLES[entry.rank];
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <motion.div
                key={`${entry.user_id}-${entry.game_id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={{
                  background: isCurrentUser
                    ? 'rgba(143, 245, 255, 0.08)'
                    : rankStyle?.bg ?? 'rgba(27, 32, 40, 0.6)',
                  border: `1px solid ${isCurrentUser ? 'rgba(143, 245, 255, 0.25)' : rankStyle?.border ?? 'rgba(72, 71, 80, 0.15)'}`,
                  boxShadow: isCurrentUser
                    ? '0 0 20px rgba(143, 245, 255, 0.08)'
                    : rankStyle?.glow ?? 'none',
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center shrink-0">
                  {rankStyle?.icon ?? (
                    <span className="text-sm font-bold text-gray-500">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Name */}
                <span
                  className="flex-1 text-sm font-medium truncate"
                  style={{ color: isCurrentUser ? '#8ff5ff' : '#e5e7eb' }}
                >
                  {entry.full_name ?? 'Anonym'}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-60">
                      (Du)
                    </span>
                  )}
                </span>

                {/* Stats */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{entry.total_score.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Punkte</p>
                  </div>
                  <div className="text-right min-w-[40px]">
                    <p className="text-sm font-semibold" style={{ color: '#df8eff' }}>{entry.games_won}</p>
                    <p className="text-[10px] text-gray-500">Siege</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
