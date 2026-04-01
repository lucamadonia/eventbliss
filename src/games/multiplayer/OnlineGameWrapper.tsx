import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, Loader2, WifiOff, RefreshCw } from "lucide-react";
import { useGameRoom, type RoomPlayer } from "./useGameRoom";
import ConnectionStatus from "./ConnectionStatus";
import type { OnlineGameProps } from "./OnlineGameTypes";

const EP = {
  bg: "#0a0e14",
  surface1: "#151a21",
  surface2: "#1b2028",
  neonPurple: "#df8eff",
  neonPink: "#ff6b98",
  neonCyan: "#8ff5ff",
  border: "rgba(223,142,255,0.12)",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnlineGameWrapperProps {
  gameId: string;
  roomCode: string;
  playerName: string;
  children: (props: OnlineGameProps) => React.ReactNode;
}

type ConnectionState = "connecting" | "connected" | "disconnected";

// ---------------------------------------------------------------------------
// Floating Player List
// ---------------------------------------------------------------------------

function FloatingPlayerList({
  players,
  isExpanded,
  onToggle,
}: {
  players: RoomPlayer[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      className="fixed bottom-20 right-3 z-[90]"
      style={{ maxWidth: "200px" }}
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2"
        style={{
          background: "rgba(21,26,33,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${EP.border}`,
        }}
      >
        <Users className="h-3.5 w-3.5" style={{ color: EP.neonPurple }} />
        <span
          className="text-[11px] font-semibold font-['Be_Vietnam_Pro']"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {players.length} Spieler
        </span>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="mt-2 rounded-xl p-2 space-y-1"
            style={{
              background: "rgba(21,26,33,0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${EP.border}`,
            }}
          >
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar}
                </div>
                <span className="truncate text-[11px] font-medium text-white/70 font-['Be_Vietnam_Pro']">
                  {p.name}
                </span>
                {p.isHost && (
                  <Crown
                    className="ml-auto h-3 w-3 flex-shrink-0"
                    style={{ color: EP.neonPurple }}
                  />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Disconnected Overlay
// ---------------------------------------------------------------------------

function DisconnectedOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: "rgba(10,14,20,0.9)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="rounded-2xl p-6 text-center max-w-xs mx-4"
        style={{
          backgroundColor: EP.surface1,
          border: `1px solid ${EP.border}`,
        }}
      >
        <WifiOff
          className="mx-auto mb-4 h-10 w-10"
          style={{ color: EP.neonPink }}
        />
        <h2 className="text-lg font-extrabold text-white font-['Plus_Jakarta_Sans'] mb-2">
          Verbindung verloren
        </h2>
        <p className="text-sm text-white/40 font-['Be_Vietnam_Pro'] mb-4">
          Die Verbindung zum Spielraum wurde unterbrochen.
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${EP.neonPurple}, ${EP.neonPink})`,
          }}
        >
          <RefreshCw className="h-4 w-4" /> Erneut verbinden
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Connecting Overlay
// ---------------------------------------------------------------------------

function ConnectingOverlay({ roomCode }: { roomCode: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: EP.bg }}
    >
      <div className="text-center">
        <Loader2
          className="mx-auto mb-4 h-10 w-10 animate-spin"
          style={{ color: EP.neonPurple }}
        />
        <h2 className="text-lg font-extrabold text-white font-['Plus_Jakarta_Sans'] mb-1">
          Verbinde...
        </h2>
        <p className="text-sm text-white/40 font-['Be_Vietnam_Pro']">
          Raum{" "}
          <span
            className="font-bold tracking-wider"
            style={{ color: EP.neonPurple }}
          >
            {roomCode}
          </span>
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Wrapper
// ---------------------------------------------------------------------------

export default function OnlineGameWrapper({
  gameId,
  roomCode,
  playerName,
  children,
}: OnlineGameWrapperProps) {
  const {
    room,
    players,
    isHost,
    joinRoom,
    leaveRoom,
    broadcast,
    onBroadcast,
    error,
  } = useGameRoom();

  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [playerListExpanded, setPlayerListExpanded] = useState(false);
  const joinedRef = useRef(false);
  const myPlayerIdRef = useRef(`player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  // Auto-join the room on mount
  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    const doJoin = async () => {
      try {
        await joinRoom(roomCode, playerName || "Spieler");
      } catch {
        setConnectionState("disconnected");
      }
    };
    doJoin();

    return () => {
      leaveRoom();
    };
  }, [roomCode, playerName, joinRoom, leaveRoom]);

  // Track connection state based on room status
  useEffect(() => {
    if (room && room.roomCode) {
      setConnectionState("connected");
    }
  }, [room]);

  useEffect(() => {
    if (error) {
      setConnectionState("disconnected");
    }
  }, [error]);

  // Derive my player id from the players list
  const myPlayerId = players.length > 0
    ? (players.find((p) => p.name === (playerName || "Spieler"))?.id ?? myPlayerIdRef.current)
    : myPlayerIdRef.current;

  const handleRetry = useCallback(() => {
    joinedRef.current = false;
    setConnectionState("connecting");
    const doJoin = async () => {
      try {
        await joinRoom(roomCode, playerName || "Spieler");
      } catch {
        setConnectionState("disconnected");
      }
    };
    doJoin();
  }, [joinRoom, roomCode, playerName]);

  // Build the OnlineGameProps to pass to children
  const onlineProps: OnlineGameProps = {
    isOnline: true,
    isHost,
    roomCode,
    players,
    myPlayerId,
    broadcast,
    onBroadcast,
  };

  return (
    <div className="relative">
      {/* Connection status bar */}
      <ConnectionStatus
        connected={connectionState === "connected"}
        roomCode={roomCode}
        playerCount={players.length}
        reconnecting={connectionState === "connecting"}
      />

      {/* Floating player list during gameplay */}
      {connectionState === "connected" && players.length > 0 && (
        <FloatingPlayerList
          players={players}
          isExpanded={playerListExpanded}
          onToggle={() => setPlayerListExpanded((v) => !v)}
        />
      )}

      {/* Overlays */}
      <AnimatePresence>
        {connectionState === "connecting" && (
          <ConnectingOverlay roomCode={roomCode} />
        )}
        {connectionState === "disconnected" && (
          <DisconnectedOverlay onRetry={handleRetry} />
        )}
      </AnimatePresence>

      {/* Game content via render props */}
      {connectionState === "connected" && children(onlineProps)}
    </div>
  );
}
