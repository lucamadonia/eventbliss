import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Crown, Loader2, WifiOff, RefreshCw } from "lucide-react";
import { gameRoomSession, useGameRoom, type RoomPlayer } from "./useGameRoom";
import ConnectionStatus from "./ConnectionStatus";
import { gameStageStyle } from '../ui/GameStage';
import type { OnlineGameProps } from "./OnlineGameTypes";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import MatchGuardOverlay from "./MatchGuardOverlay";
import WaitingForPlayer from "./WaitingForPlayer";
import LateToast from "./LateToast";
import { matchGuard, readIds } from "./party-roster";
import { localPlayerIdsFor } from "./participants";
import { abortControllerGame, kickControllerPlayer, releaseControllerSeat } from "@/games/party/controller-session";
import { playableGames } from "@/lib/playable-games";
import { partyMotion } from "@/lib/party-motion";
import { useTvLink } from "./useTvLink";
import { tvLinked } from "./tv-link";
import { useTVContext } from "@/contexts/TVBroadcastContext";

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
  /** Host chose „Spiel abbrechen (zählt nicht)“ after too many removals. Default: abort the party match. */
  onAbortMatch?: () => Promise<void> | void;
  /** Host chose „Zurück in die Lobby“. Default: abort the match and open the party lobby. */
  onReturnToLobby?: () => Promise<void> | void;
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
  onAbortMatch,
  onReturnToLobby,
}: OnlineGameWrapperProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    room,
    players: connectedPlayers,
    roomHasPremium,
    isHost,
    myPlayerId,
    joinRoom,
    reconnect,
    dropParticipant,
    connection,
    broadcast,
    broadcastTo,
    onBroadcast,
    error,
  } = useGameRoom();

  const [playerListExpanded, setPlayerListExpanded] = useState(false);
  const players = useMemo(() => room?.settings.controllerParty && room.status === 'playing'
    ? room.participantIds.flatMap(id => {
        const player = room.players.find(candidate => candidate.id === id);
        return player ? [player] : [];
      }) : connectedPlayers, [connectedPlayers, room]);
  const settings = room?.settings;
  const removedPlayerIds = useMemo(() => readIds(settings, 'removedPlayerIds'), [settings]);
  const sittingOut = useMemo(() => readIds(settings, 'sittingOut')
    .filter(id => !room?.participantIds.includes(id) && !removedPlayerIds.includes(id)), [settings, room?.participantIds, removedPlayerIds]);
  const localPlayerIds = useMemo(() => localPlayerIdsFor(players, myPlayerId), [players, myPlayerId]);
  const guard = room ? matchGuard({ status: room.status, controllerParty: !!room.settings.controllerParty,
    gameId: room.gameId, activeCount: room.participantIds.length, isHost }) : 'ok';
  const removedFromMatch = !isHost && !!myPlayerId && removedPlayerIds.includes(myPlayerId);
  const reduced = !!useReducedMotion();
  const tvCtx = useTVContext();
  // TV heartbeat on the room channel, or (host) on its TV channel; phones also see the host's shared flag.
  const tvHeard = useTvLink(room?.roomCode === roomCode);
  const hostTvSeenAt = tvCtx?.lastTvReadyAt ?? 0;
  const tvLinkedNow = tvHeard || (isHost ? hostTvSeenAt > 0 && tvLinked(hostTvSeenAt, Date.now(), 45_000) : room?.settings.tvLinked === true);
  useEffect(() => {
    if (isHost && room?.settings.controllerParty && room.settings.tvLinked !== tvLinkedNow) gameRoomSession.updatePartySettings({ tvLinked: tvLinkedNow });
  }, [isHost, tvLinkedNow, room?.settings.controllerParty, room?.settings.tvLinked]);
  const game = playableGames.find(candidate => candidate.id === room?.gameId);
  const gameTitle = game ? t(game.nameKey) : gameId;
  const seat = useCallback((id: string) => {
    const player = room?.players.find(candidate => candidate.id === id) ?? connectedPlayers.find(candidate => candidate.id === id);
    return { id, name: player?.name ?? '…', color: player?.color ?? '#df8eff' };
  }, [room?.players, connectedPlayers]);
  // T13: an active seat dropped while the host is connected (guests follow the host).
  const hostConnected = !!room && connectedPlayers.some(p => p.id === room.hostId);
  const missing = room?.settings.controllerParty && room.status === 'playing' && connection === 'reconnecting' && hostConnected
    && (typeof navigator === 'undefined' || navigator.onLine !== false)
    ? room.participantIds.find(id => !connectedPlayers.some(p => p.id === id)) : undefined;
  const abortMatch = useCallback(async () => {
    if (onAbortMatch) await onAbortMatch(); else await abortControllerGame();
  }, [onAbortMatch]);
  const returnToLobby = useCallback(async () => {
    if (onReturnToLobby) { await onReturnToLobby(); return; }
    await abortControllerGame();
    navigate('/party/controllers', { replace: true });
  }, [onReturnToLobby, navigate]);
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
        // Same room: rebuild the transport even if the old channel still looks joined.
        if (room?.roomCode === roomCode) await reconnect();
        else await joinRoom(roomCode, playerName || "Spieler");
      } catch { /* The shared session exposes the connection error. */ }
    };
    doJoin();
  }, [joinRoom, reconnect, room?.roomCode, roomCode, playerName]);

  // Build the OnlineGameProps to pass to children
  const onlineProps = useMemo<OnlineGameProps>(() => ({
    isOnline: true,
    isHost,
    isConnected: connectionState === 'connected',
    roomCode,
    players,
    myPlayerId,
    localPlayerIds,
    sittingOut,
    removedPlayerIds,
    hostPlayerId: room?.hostId,
    roomHasPremium,
    broadcast,
    broadcastTo,
    onBroadcast,
  }), [isHost, connectionState, roomCode, players, myPlayerId, localPlayerIds, sittingOut, removedPlayerIds, room?.hostId, roomHasPremium, broadcast, broadcastTo, onBroadcast]);

  return (
    // Fill the viewport in the stage colour: no white strip below short game screens.
    <div className="relative online-game-surface font-sans min-h-[100dvh]" style={{ background: 'var(--stage-bg, #060810)', ...gameStageStyle(gameId) }}>
      <div className="sticky top-0 z-[90]">
      {/* Connection status bar */}
      <ConnectionStatus
        connected={connectionState === "connected"}
        roomCode={roomCode}
        playerCount={players.length}
        reconnecting={connectionState === "connecting"}
        onPlayersClick={() => setPlayerListExpanded(v => !v)}
        expanded={playerListExpanded}
        tv={{ linked: tvLinkedNow, onOpen: isHost ? tvCtx?.openConnection : undefined }}
      />

      {/* Floating player list during gameplay */}
      {isHost && room?.status === 'playing' && sittingOut.length > 0 && (
        <p data-testid="sitout-banner" data-player-ids={sittingOut.join(',')}
          className="flex items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-semibold text-white/80"
          style={{ backgroundColor: "rgba(12,11,23,0.9)" }}>
          {sittingOut.map(id => <span key={id} aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: seat(id).color }} />)}
          {t('partyPlay.sittingOut', '{{names}} setzen diese Runde aus', { names: sittingOut.map(id => seat(id).name).join(', ') })}
        </p>
      )}
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
        {connectionState === "disconnected" && (missing
          ? <WaitingForPlayer key="waiting" player={seat(missing)} isHost={isHost}
              onContinueWithout={async () => { await kickControllerPlayer(missing, 'match_only'); dropParticipant(missing); }}
              onBackToHost={async () => { await releaseControllerSeat(missing); }} />
          : <DisconnectedOverlay onRetry={handleRetry} />
        )}
        {connectionState === "connected" && guard !== 'ok' && !removedFromMatch && (
          <MatchGuardOverlay guard={guard} gameName={gameTitle} left={removedPlayerIds.map(seat)}
            min={Math.max(2, game?.minPlayers ?? 2)} onAbort={abortMatch} onLobby={returnToLobby} />
        )}
      </AnimatePresence>
      {!isHost && <LateToast onBroadcast={onBroadcast} hostId={room?.hostId} />}

      {/* Game content via render props */}
      <div className="contents" data-online-game-content
        ref={node => { node?.toggleAttribute('inert', connectionState !== 'connected'); }}>
        {room?.roomCode === roomCode && myPlayerId && (removedFromMatch
          ? <div className="flex min-h-[70dvh] items-center justify-center px-6">
              <motion.div role="status" data-testid="removed-from-match" variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate"
                className="w-full max-w-sm rounded-[28px] p-8 text-center text-white"
                style={{ backgroundColor: "var(--stage-surface, #151a21)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div aria-hidden className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                  style={{ backgroundColor: seat(myPlayerId).color + '33' }}>🙌</div>
                <h2 className="text-xl font-extrabold font-game">{t('partyPlay.removedFromMatchTitle', 'Du setzt diese Runde aus')}</h2>
                <p className="mt-2 text-sm text-white/70">{t('partyPlay.removedFromMatchHint', 'Ab dem nächsten Spiel bist du wieder dabei.')}</p>
              </motion.div>
            </div>
          : children(onlineProps))}
      </div>
    </div>
  );
}
