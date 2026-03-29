import { motion } from "framer-motion";
import { Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlayerColor, getPlayerInitial } from "./PlayerAvatars";

interface GameHUDProps {
  round: number;
  maxRounds: number;
  score: number;
  timer: number;
  currentPlayer: { name: string; index: number };
  onPause: () => void;
}

export function GameHUD({ round, maxRounds, score, timer, currentPlayer, onPause }: GameHUDProps) {
  const color = getPlayerColor(currentPlayer.index);
  const timerUrgent = timer <= 5;
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timerDisplay = minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : String(seconds);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-40 px-4 py-2"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="mx-auto max-w-lg flex items-center justify-between rounded-b-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700/50 px-4 py-2 shadow-lg">
        {/* Round indicator */}
        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">Runde</span>
          <span className="text-sm font-bold text-white">
            {round}/{maxRounds}
          </span>
        </div>

        {/* Current player */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}60` }}
          >
            {getPlayerInitial(currentPlayer.name)}
          </div>
          <span className="text-sm font-semibold text-white max-w-[100px] truncate">
            {currentPlayer.name}
          </span>
        </div>

        {/* Timer */}
        <motion.div
          className={cn(
            "text-xl font-mono font-bold min-w-[48px] text-center",
            timerUrgent ? "text-red-400" : "text-white"
          )}
          animate={timerUrgent ? { scale: [1, 1.15, 1] } : {}}
          transition={timerUrgent ? { repeat: Infinity, duration: 0.6 } : {}}
        >
          {timerDisplay}
        </motion.div>

        {/* Score */}
        <div className="flex flex-col items-center min-w-[50px]">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">Punkte</span>
          <span className="text-sm font-bold text-yellow-400">{score}</span>
        </div>

        {/* Pause button */}
        <button
          onClick={onPause}
          className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors active:scale-95"
          aria-label="Pause"
        >
          <Pause className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    </motion.div>
  );
}
