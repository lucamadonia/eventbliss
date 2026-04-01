import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Users, Loader2 } from "lucide-react";

const EP = {
  surface1: "#151a21",
  neonPurple: "#df8eff",
  neonCyan: "#8ff5ff",
  neonPink: "#ff6b98",
  border: "rgba(223,142,255,0.12)",
} as const;

interface ConnectionStatusProps {
  connected: boolean;
  roomCode: string;
  playerCount: number;
  reconnecting?: boolean;
}

export default function ConnectionStatus({
  connected,
  roomCode,
  playerCount,
  reconnecting = false,
}: ConnectionStatusProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="fixed top-3 right-3 z-[100] flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          background: "rgba(21,26,33,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${EP.border}`,
          boxShadow: connected
            ? `0 0 12px rgba(143,245,255,0.15)`
            : `0 0 12px rgba(255,107,152,0.15)`,
        }}
      >
        {/* Connection indicator */}
        {reconnecting ? (
          <Loader2
            className="h-3.5 w-3.5 animate-spin"
            style={{ color: EP.neonPink }}
          />
        ) : connected ? (
          <div className="relative flex items-center justify-center">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: EP.neonCyan }}
            />
            <Wifi
              className="ml-1 h-3.5 w-3.5"
              style={{ color: EP.neonCyan }}
            />
          </div>
        ) : (
          <WifiOff className="h-3.5 w-3.5" style={{ color: EP.neonPink }} />
        )}

        {/* Status text */}
        <span
          className="text-[11px] font-semibold font-['Be_Vietnam_Pro']"
          style={{
            color: reconnecting
              ? EP.neonPink
              : connected
                ? "rgba(255,255,255,0.7)"
                : EP.neonPink,
          }}
        >
          {reconnecting
            ? "Verbindung verloren..."
            : connected
              ? "Verbunden"
              : "Getrennt"}
        </span>

        {/* Room code */}
        {connected && (
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-widest font-['Plus_Jakarta_Sans']"
            style={{
              backgroundColor: "rgba(223,142,255,0.12)",
              color: EP.neonPurple,
            }}
          >
            {roomCode}
          </span>
        )}

        {/* Player count */}
        {connected && (
          <span
            className="flex items-center gap-0.5 text-[10px] font-semibold font-['Be_Vietnam_Pro']"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <Users className="h-3 w-3" />
            {playerCount}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
