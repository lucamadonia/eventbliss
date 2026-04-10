import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, ArrowLeft, Play, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlayerColor, getPlayerInitial } from "./PlayerAvatars";
import { haptics } from "@/hooks/useHaptics";
import { isPartySessionActive } from "@/hooks/usePartySession";

interface ResultPlayer {
  name: string;
  score: number;
  streak: number;
}

interface ResultScreenProps {
  players: ResultPlayer[];
  gameTitle: string;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  totalRounds?: number;
  gameId?: string;
}

const confettiColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#F9CA24", "#6C5CE7",
  "#FD79A8", "#00B894", "#E17055", "#0984E3", "#A29BFE",
  "#FF9FF3", "#FECA57", "#54A0FF", "#5F27CD", "#01A3A4",
  "#F368E0", "#FF6348", "#7BED9F", "#70A1FF", "#ECCC68",
];

function ConfettiDots() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {confettiColors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: color, left: `${(i / 20) * 100 + Math.random() * 5}%` }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 20 : 800,
            opacity: [1, 1, 0],
            rotate: 360 * (i % 2 === 0 ? 1 : -1),
            x: [0, (i % 2 === 0 ? 1 : -1) * (30 + Math.random() * 40)],
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: Math.random() * 0.8,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

const rankIcons = [
  <Medal key="g" className="w-6 h-6 text-yellow-400" />,
  <Medal key="s" className="w-6 h-6 text-gray-300" />,
  <Medal key="b" className="w-6 h-6 text-amber-600" />,
];

export function ResultScreen({
  players,
  gameTitle,
  onPlayAgain,
  onBackToHub,
  totalRounds,
  gameId,
}: ResultScreenProps) {
  const navigate = useNavigate();
  const partyActive = isPartySessionActive();
  const sorted = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players]
  );
  const winner = sorted[0];

  const bestRound = useMemo(() => {
    return Math.max(...sorted.map((p) => p.score));
  }, [sorted]);

  const longestStreak = useMemo(() => {
    return Math.max(...sorted.map((p) => p.streak), 0);
  }, [sorted]);

  // Celebrate on mount — triple haptic burst for the win screen
  useEffect(() => {
    haptics.celebrate();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 relative">
      <ConfettiDots />

      <div className="mx-auto max-w-md space-y-6 relative z-10">
        {/* Trophy animation */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
        >
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
        </motion.div>

        {/* Winner announcement */}
        <motion.div
          className="text-center space-y-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-gray-400 uppercase tracking-wider">{gameTitle}</p>
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: getPlayerColor(0), boxShadow: `0 0 20px ${getPlayerColor(0)}60` }}
            >
              {getPlayerInitial(winner?.name ?? "?")}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{winner?.name}</h2>
              <p className="text-yellow-400 font-semibold">{winner?.score} Punkte</p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.section
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Rangliste
          </h3>
          <div className="space-y-2">
            {sorted.map((player, i) => (
              <motion.div
                key={player.name + i}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  i === 0
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-gray-800/40 border-gray-700/50"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div className="w-8 flex items-center justify-center">
                  {i < 3 ? rankIcons[i] : (
                    <span className="text-sm font-bold text-gray-500">{i + 1}</span>
                  )}
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: getPlayerColor(i) }}
                >
                  {getPlayerInitial(player.name)}
                </div>
                <span className="flex-1 text-white font-medium text-sm truncate">
                  {player.name}
                </span>
                {player.streak >= 3 && (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold">
                    {player.streak}x Streak
                  </span>
                )}
                <span className="text-sm font-bold text-gray-300 min-w-[40px] text-right">
                  {player.score}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          {[
            { label: "Runden", value: totalRounds ?? "-" },
            { label: "Beste Punkte", value: bestRound },
            { label: "Langster Streak", value: longestStreak },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 text-center"
            >
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.section>

        {/* Action buttons */}
        <motion.div
          className="flex gap-3 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <motion.button
            onClick={() => {
              haptics.light();
              if (partyActive) {
                navigate("/party");
              } else {
                onBackToHub();
              }
            }}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-600 text-gray-300 font-semibold flex items-center justify-center gap-2 hover:border-gray-500 transition-colors text-sm"
            whileTap={{ scale: 0.97 }}
          >
            {partyActive ? (
              <>
                <PartyPopper className="w-4 h-4" />
                Zur Party
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                Anderes Spiel
              </>
            )}
          </motion.button>
          <motion.button
            onClick={onPlayAgain}
            className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)] text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Play className="w-4 h-4" />
            Nochmal spielen
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
