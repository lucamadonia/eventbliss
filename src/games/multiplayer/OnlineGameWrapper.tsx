import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Loader2, WifiOff, RefreshCw } from "lucide-react";
import { useGameRoom, type RoomPlayer } from "./useGameRoom";
import ConnectionStatus from "./ConnectionStatus";
import { gameStageStyle } from '../ui/GameStage';
import type { OnlineGameProps } from "./OnlineGameTypes";
import { useTranslation } from "react-i18next";

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
}: {
  players: RoomPlayer[];
  isExpanded: boolean;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      layout
      id="online-game-roster"
      className="absolute right-3 top-full z-[90] w-[min(320px,calc(100vw-24px))]"
    >


      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="mt-2 max-h-[60dvh] overflow-y-auto rounded-2xl p-3 space-y-1 shadow-2xl"
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
                className="flex min-h-12 items-center gap-3 rounded-lg px-2 py-2"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar}
                </div>
                <span className="truncate text-[11px] font-medium text-white/70 font-sans">
                  {p.name}
                </span>
                {p.isHost && (
                  <Crown
                    className="ml-auto h-3 w-3 flex-shrink-0"
                    style={{ color: "var(--stage-accent)" }}
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
  const { t } = useTranslation();
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
          backgroundColor: "var(--stage-surface)",
          border: `1px solid ${EP.border}`,
        }}
      >
        <WifiOff
          className="mx-auto mb-4 h-10 w-10"
          style={{ color: EP.neonPink }}
        />
        <h2 className="text-lg font-extrabold text-white font-game mb-2">
          {t('games.connectionPaused')}
        </h2>
        <p className="text-sm text-white/70 font-sans mb-4">
          {t('games.connectionPausedHint')}
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white"
          style={{
            background: "var(--stage-accent)", color: "#172022", minHeight: 52,
          }}
        >
          <RefreshCw className="h-4 w-4" /> {t('games.reconnect')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Connecting Overlay
// ---------------------------------------------------------------------------

function ConnectingOverlay({ roomCode }: { roomCode: string }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: "var(--stage-bg)" }}
    >
      <div className="text-center">
        <Loader2
          className="mx-auto mb-4 h-10 w-10 animate-spin"
          style={{ color: "var(--stage-accent)" }}
        />
        <h2 className="text-lg font-extrabold text-white font-game mb-1">
          {t('tv.connecting')}
        </h2>
        <p className="text-sm text-white/70 font-sans">
          {t('games.setup.onlineRoom')}{" "}
          <span
            className="font-bold tracking-wider"
            style={{ color: "var(--stage-accent)" }}
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
  const { t } = useTranslation();
  const {
    room,
    players,
    roomHasPremium,
    isHost,
    myPlayerId,
    joinRoom,
    connection,
    broadcast,
    broadcastTo,
    onBroadcast,
    error,
  } = useGameRoom();

  const [playerListExpanded, setPlayerListExpanded] = useState(false);
  const joinedRef = useRef('');
  const connectionState: ConnectionState = room?.roomCode === roomCode && connection === 'connected'
    ? 'connected' : connection === 'disconnected' || connection === 'reconnecting' ? 'disconnected' : 'connecting';

  // Auto-join the room on mount — but only if NOT already connected
  useEffect(() => {
    if (joinedRef.current === roomCode) return;
    // If already in a room (from GameLobby), don't rejoin
    if (room && room.roomCode === roomCode) {
      joinedRef.current = roomCode;
      return;
    }
    joinedRef.current = roomCode;

    const doJoin = async () => {
      try {
        await joinRoom(roomCode, playerName || "Spieler");
      } catch { /* The shared session exposes the connection error. */ }
    };
    doJoin();

    // DON'T leaveRoom on unmount — keep channel alive
  }, [roomCode, playerName, joinRoom, room]);

  // myPlayerId comes from the hook now (global singleton)

  const handleRetry = useCallback(() => {
    const doJoin = async () => {
      try {
        await joinRoom(roomCode, playerName || "Spieler");
      } catch { /* The shared session exposes the connection error. */ }
    };
    doJoin();
  }, [joinRoom, roomCode, playerName]);

  // Build the OnlineGameProps to pass to children
  const onlineProps = useMemo<OnlineGameProps>(() => ({
    isOnline: true,
    isHost,
    isConnected: connectionState === 'connected',
    roomCode,
    players,
    myPlayerId,
    roomHasPremium,
    broadcast,
    broadcastTo,
    onBroadcast,
  }), [isHost, connectionState, roomCode, players, myPlayerId, roomHasPremium, broadcast, broadcastTo, onBroadcast]);

  return (
    <div className="relative online-game-surface font-sans" style={gameStageStyle(gameId)}>
      <div className="sticky top-0 z-[90]">
      {/* Connection status bar */}
      <ConnectionStatus
        connected={connectionState === "connected"}
        roomCode={roomCode}
        playerCount={players.length}
        reconnecting={connectionState === "connecting"}
        onPlayersClick={() => setPlayerListExpanded(v => !v)}
        expanded={playerListExpanded}
      />

      {/* Floating player list during gameplay */}
      {connectionState === "connected" && players.length > 0 && playerListExpanded && (
        <FloatingPlayerList
          players={players}
          isExpanded={playerListExpanded}
        />
      )}
      </div>

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
      <div className="contents" data-online-game-content
        ref={node => { node?.toggleAttribute('inert', connectionState !== 'connected'); }}>
        {room?.roomCode === roomCode && myPlayerId && children(onlineProps)}
      </div>
    </div>
  );
}
