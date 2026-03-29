import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PLAYER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#F9CA24", "#6C5CE7",
  "#A29BFE", "#FD79A8", "#00B894", "#E17055", "#0984E3",
] as const;

export interface PlayerData {
  id: string;
  name: string;
  score: number;
  isEliminated?: boolean;
}

interface PlayerAvatarsProps {
  players: PlayerData[];
  currentIndex: number;
  size?: "sm" | "md" | "lg";
}

export function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export function getPlayerInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

const sizeMap = {
  sm: { circle: "w-8 h-8 text-xs", badge: "text-[9px] -bottom-1 -right-1 w-4 h-4" },
  md: { circle: "w-12 h-12 text-base", badge: "text-[10px] -bottom-1 -right-2 w-5 h-5" },
  lg: { circle: "w-16 h-16 text-xl", badge: "text-xs -bottom-1 -right-2 w-6 h-6" },
};

export function PlayerAvatars({ players, currentIndex, size = "md" }: PlayerAvatarsProps) {
  const s = sizeMap[size];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {players.map((player, i) => {
        const color = getPlayerColor(i);
        const isActive = i === currentIndex && !player.isEliminated;

        return (
          <motion.div
            key={player.id}
            className="relative"
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={isActive ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
          >
            <div
              className={cn(
                "rounded-full flex items-center justify-center font-bold relative",
                s.circle,
                player.isEliminated && "grayscale opacity-50",
                isActive && "ring-2 ring-offset-2 ring-offset-gray-900"
              )}
              style={{
                backgroundColor: color,
                ...(isActive ? { boxShadow: `0 0 16px ${color}80`, ringColor: color } : {}),
              }}
            >
              <span className={cn("text-white", player.isEliminated && "line-through")}>
                {getPlayerInitial(player.name)}
              </span>
            </div>
            <div
              className={cn(
                "absolute rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center font-bold text-white",
                s.badge
              )}
            >
              {player.score}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
