import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, ArrowLeft, Users, Crown, CircleDot, UserMinus,
  Share2, Play, Plus, Wifi, WifiOff, Loader2, Sparkles,
} from "lucide-react";
import { useGameRoom, getSavedRoom, type RoomPlayer } from "./useGameRoom";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import EventInvite from "./EventInvite";

const EP = {
  bg: "#0a0e14", surface1: "#151a21", surface2: "#1b2028", surface3: "#20262f",
  neonPurple: "#df8eff", neonPink: "#ff6b98", neonCyan: "#8ff5ff",
  border: "rgba(223,142,255,0.12)",
} as const;

const GAME_LIST = [
  { id: "bomb", name: "Tickende Bombe", icon: "💣" },
  { id: "headup", name: "Stirnraten", icon: "🧠" },
  { id: "taboo", name: "Wortverbot", icon: "🚫" },
  { id: "category", name: "Zeit-Kategorie", icon: "⏱️" },
  { id: "hochstapler", name: "Hochstapler", icon: "🎭" },
  { id: "drueck-das-wort", name: "Drück das Wort", icon: "🔤" },
  { id: "wo-ist-was", name: "Wo ist was?", icon: "🗺️" },
  { id: "split-quiz", name: "Split Quiz", icon: "🧩" },
  { id: "geteilt-gequizzt", name: "Geteilt & Gequizzt", icon: "🔗" },
  { id: "schnellzeichner", name: "Schnellzeichner", icon: "🎨" },
  { id: "flaschendrehen", name: "Flaschendrehen", icon: "🍾" },
  { id: "wahrheit-pflicht", name: "Wahrheit/Pflicht", icon: "❤️" },
  { id: "this-or-that", name: "This or That", icon: "↔️" },
  { id: "wer-bin-ich", name: "Wer bin ich?", icon: "❓" },
  { id: "emoji-raten", name: "Emoji-Raten", icon: "😀" },
  { id: "fake-or-fact", name: "Fake or Fact", icon: "🎲" },
  { id: "story-builder", name: "Story Builder", icon: "📖" },
];

interface GameLobbyProps {
  gameId: string;
  gameName: string;
  onStart: (players: RoomPlayer[], roomCode: string, selectedGameId?: string) => void;
  onBack: () => void;
  maxPlayers?: number;
  minPlayers?: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { type: "spring" as const, stiffness: 300, damping: 26 },
};

const playerItem = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.9 },
  transition: { type: "spring" as const, stiffness: 350, damping: 28 },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
      style={{ backgroundColor: copied ? "rgba(143,245,255,0.15)" : "rgba(223,142,255,0.12)", color: copied ? EP.neonCyan : EP.neonPurple }}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Kopiert!" : "Kopieren"}
    </motion.button>
  );
}

function PlayerRow({ player, isCurrentHost, onKick }: { player: RoomPlayer; isCurrentHost: boolean; onKick?: () => void }) {
  return (
    <motion.div layout {...playerItem} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: EP.surface2 }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: player.color }}>{player.avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white font-['Plus_Jakarta_Sans']">{player.name}</span>
          {player.isHost && (
            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ backgroundColor: "rgba(223,142,255,0.15)", color: EP.neonPurple }}>
              <Crown className="h-2.5 w-2.5" /> Host
            </span>
          )}
          {player.isPremium && (
            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ backgroundColor: "rgba(249,202,36,0.15)", color: "#f9ca24" }}>
              <Crown className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {player.isReady ? (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: EP.neonCyan }}>
            <CircleDot className="h-3.5 w-3.5" /> Bereit
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold text-white/30">
            <CircleDot className="h-3.5 w-3.5" /> Warte...
          </span>
        )}
        {isCurrentHost && !player.isHost && onKick && (
          <motion.button whileTap={{ scale: 0.85 }} onClick={onKick} className="rounded-lg p-1.5 transition-colors hover:bg-red-500/10">
            <UserMinus className="h-4 w-4 text-red-400/60 hover:text-red-400" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

type LobbyView = "menu" | "create" | "join" | "lobby";

export function GameLobby({ gameId, gameName, onStart, onBack, maxPlayers = 12, minPlayers = 2 }: GameLobbyProps) {
  // Read name and room from URL params (for personalized invite links)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlName = urlParams?.get('name') || '';
  const urlRoom = urlParams?.get('room') || '';

  const [view, setView] = useState<LobbyView>(urlRoom ? "join" : "menu");
  const [joinCode, setJoinCode] = useState(urlRoom);
  const [joinName, setJoinName] = useState(urlName);
  const [hostName, setHostName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(gameId);
  const [showGamePicker, setShowGamePicker] = useState(false);

  const { isPremium } = usePremium();
  const { user } = useAuth();
  const { room, players, roomHasPremium, isHost, myPlayerId, createRoom, joinRoom, leaveRoom, setReady, startGame, kickPlayer, error } = useGameRoom();

  const savedRoom = getSavedRoom();
  const allReady = players.length >= minPlayers && players.every((p) => p.isReady);

  // Rejoin a saved room
  const handleRejoin = useCallback(async () => {
    if (!savedRoom) return;
    setIsLoading(true);
    const name = hostName.trim() || joinName.trim() || "Spieler";
    try { await joinRoom(savedRoom.roomCode, name, isPremium); setView("lobby"); } finally { setIsLoading(false); }
  }, [savedRoom, joinRoom, hostName, joinName, isPremium]);

  const handleCreate = useCallback(async () => {
    if (!hostName.trim()) return;
    setIsLoading(true);
    try { await createRoom(gameId, isPremium, hostName.trim()); setView("lobby"); } finally { setIsLoading(false); }
  }, [createRoom, gameId, hostName, isPremium]);

  const handleJoin = useCallback(async () => {
    if (!joinName.trim() || !joinCode.trim()) return;
    setIsLoading(true);
    try { await joinRoom(joinCode, joinName.trim(), isPremium); setView("lobby"); } finally { setIsLoading(false); }
  }, [joinRoom, joinCode, joinName, isPremium]);

  // Auto-join if name + room come from URL (personalized invite link)
  useEffect(() => {
    if (urlRoom && urlName && view === "join" && !room) {
      handleJoin();
    }
  }, []);

  const handleStart = useCallback(() => {
    if (!isHost || !allReady || !room) return;
    startGame();
    onStart(players, room.roomCode, selectedGame);
  }, [isHost, allReady, room, startGame, onStart, players, selectedGame]);

  const handleLeave = useCallback(() => { leaveRoom(); setView("menu"); }, [leaveRoom]);

  const me = players.find((p) => p.id === myPlayerId);
  const myReady = me?.isReady ?? false;

  const handleToggleReady = useCallback(() => {
    setReady(!myReady);
  }, [players, setReady]);

  const handleShare = useCallback(() => {
    if (!room) return;
    const url = `${window.location.origin}/games?room=${room.roomCode}`;
    if (navigator.share) {
      navigator.share({ title: `${gameName} - EventBliss`, text: `Tritt meinem Spiel bei! Code: ${room.roomCode}`, url });
    } else { navigator.clipboard.writeText(url); }
  }, [room, gameName]);

  return (
    <div className="min-h-screen px-4 py-6" style={{ backgroundColor: EP.bg }}>
      <div className="mx-auto max-w-md space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={view === "lobby" ? handleLeave : view === "menu" ? onBack : () => setView("menu")}
            className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: EP.surface2 }}>
            <ArrowLeft className="h-5 w-5 text-white/60" />
          </motion.button>
          <div>
            <h1 className="text-lg font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: EP.neonPurple }}>Online Multiplayer</h1>
            <p className="text-xs text-white/40 font-['Be_Vietnam_Pro']">{gameName}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {room ? <Wifi className="h-4 w-4" style={{ color: EP.neonCyan }} /> : <WifiOff className="h-4 w-4 text-white/20" />}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div {...fadeUp} className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: "rgba(255,107,152,0.12)", color: EP.neonPink }}>{error}</motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* MENU */}
          {view === "menu" && (
            <motion.div key="menu" {...fadeUp} className="space-y-4">
              {/* Rejoin saved room banner */}
              {savedRoom && savedRoom.gameId === gameId && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleRejoin}
                  className="w-full rounded-2xl p-4 text-left flex items-center gap-4"
                  style={{ backgroundColor: "rgba(143,245,255,0.08)", border: "1px solid rgba(143,245,255,0.25)" }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${EP.neonCyan}, ${EP.neonPurple})` }}>
                    <Wifi className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold font-['Plus_Jakarta_Sans']" style={{ color: EP.neonCyan }}>Aktiver Raum: {savedRoom.roomCode}</p>
                    <p className="text-xs text-white/40 font-['Be_Vietnam_Pro']">Tippe um wieder beizutreten</p>
                  </div>
                </motion.button>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setView("create")}
                className="w-full rounded-2xl p-5 text-left" style={{ backgroundColor: EP.surface1, border: `1px solid ${EP.border}` }}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${EP.neonPurple}, ${EP.neonPink})` }}>
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">Raum erstellen</p>
                    <p className="text-xs text-white/40 font-['Be_Vietnam_Pro']">Erstelle einen Raum und lade Freunde ein</p>
                  </div>
                </div>
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setView("join")}
                className="w-full rounded-2xl p-5 text-left" style={{ backgroundColor: EP.surface1, border: `1px solid ${EP.border}` }}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${EP.neonCyan}, ${EP.neonPurple})` }}>
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">Raum beitreten</p>
                    <p className="text-xs text-white/40 font-['Be_Vietnam_Pro']">Gib einen 6-stelligen Raumcode ein</p>
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* CREATE */}
          {view === "create" && (
            <motion.div key="create" {...fadeUp} className="space-y-5">
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: EP.surface1, border: `1px solid ${EP.border}` }}>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40 font-['Be_Vietnam_Pro']">Dein Name</span>
                  <input type="text" value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="z.B. Luca" maxLength={20}
                    className="mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2"
                    style={{ backgroundColor: EP.surface3, borderColor: EP.border }} />
                </label>
                <motion.button whileTap={{ scale: 0.96 }} disabled={!hostName.trim() || isLoading} onClick={handleCreate}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg, ${EP.neonPurple}, ${EP.neonPink})` }}>
                  {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Raum erstellen"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* JOIN */}
          {view === "join" && (
            <motion.div key="join" {...fadeUp} className="space-y-5">
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: EP.surface1, border: `1px solid ${EP.border}` }}>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40 font-['Be_Vietnam_Pro']">Dein Name</span>
                  <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="z.B. Max" maxLength={20}
                    className="mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none"
                    style={{ backgroundColor: EP.surface3, borderColor: EP.border }} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40 font-['Be_Vietnam_Pro']">Raumcode</span>
                  <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="Z.B. PARTY7" maxLength={6}
                    className="mt-2 w-full rounded-xl border px-4 py-3 text-center text-lg font-extrabold tracking-[0.3em] text-white placeholder:text-white/20 placeholder:tracking-[0.2em] placeholder:font-normal placeholder:text-sm focus:outline-none"
                    style={{ backgroundColor: EP.surface3, borderColor: EP.border }} />
                </label>
                <motion.button whileTap={{ scale: 0.96 }} disabled={!joinName.trim() || joinCode.length !== 6 || isLoading}
                  onClick={handleJoin} className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg, ${EP.neonCyan}, ${EP.neonPurple})` }}>
                  {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Beitreten"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* LOBBY */}
          {view === "lobby" && room && (
            <motion.div key="lobby" {...fadeUp} className="space-y-4">
              <div className="relative rounded-2xl p-5 text-center" style={{ backgroundColor: EP.surface1, border: `1px solid ${EP.border}` }}>
                <div className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at center, ${EP.neonPurple}08, transparent 70%)` }} />
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40 font-['Be_Vietnam_Pro'] mb-2">Raumcode</p>
                <p className="text-4xl font-extrabold tracking-[0.25em] font-['Plus_Jakarta_Sans']" style={{ color: EP.neonPurple }}>
                  {room.roomCode}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <CopyButton text={room.roomCode} />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ backgroundColor: "rgba(143,245,255,0.12)", color: EP.neonCyan }}>
                    <Share2 className="h-3.5 w-3.5" /> Teilen
                  </motion.button>
                </div>
              </div>

              <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: EP.surface1, border: `1px solid ${EP.border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 font-['Be_Vietnam_Pro']">Spieler</h2>
                  <span className="text-xs font-bold font-['Be_Vietnam_Pro']" style={{ color: EP.neonCyan }}>{players.length}/{maxPlayers}</span>
                </div>
                <AnimatePresence initial={false}>
                  {players.map((p) => (
                    <PlayerRow key={p.id} player={p} isCurrentHost={isHost}
                      onKick={isHost && !p.isHost ? () => kickPlayer(p.id) : undefined} />
                  ))}
                </AnimatePresence>
                {players.length < maxPlayers && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-xs text-white/20"
                    style={{ borderColor: "rgba(223,142,255,0.1)" }}>
                    <Users className="h-4 w-4" /> Warte auf Spieler...
                  </div>
                )}
              </div>

              {/* Premium sharing banner */}
              <AnimatePresence>
                {roomHasPremium ? (
                  <motion.div {...fadeUp} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ backgroundColor: "rgba(249,202,36,0.08)", border: "1px solid rgba(249,202,36,0.2)" }}>
                    <Sparkles className="h-5 w-5 flex-shrink-0" style={{ color: "#f9ca24" }} />
                    <p className="text-xs font-semibold font-['Be_Vietnam_Pro']" style={{ color: "#f9ca24" }}>
                      Premium-Spiele fuer alle freigeschaltet!
                    </p>
                  </motion.div>
                ) : (
                  <motion.div {...fadeUp} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ backgroundColor: "rgba(223,142,255,0.06)", border: `1px solid ${EP.border}` }}>
                    <Crown className="h-5 w-5 flex-shrink-0" style={{ color: EP.neonPurple }} />
                    <p className="text-[11px] text-white/40 font-['Be_Vietnam_Pro']">
                      Tipp: Mit einem Premium-Account spielen alle Gaeste kostenlos mit!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game Picker — Host can switch games */}
              {isHost && (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: EP.surface1, border: `1px solid ${EP.border}` }}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowGamePicker(v => !v)}
                    className="flex w-full items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" style={{ color: EP.neonPurple }} />
                      <span className="text-xs font-semibold text-white/70">Spiel: <strong style={{ color: EP.neonPurple }}>{GAME_LIST.find(g => g.id === selectedGame)?.name || gameName}</strong></span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: EP.neonCyan }}>Wechseln</span>
                  </motion.button>
                  <AnimatePresence>
                    {showGamePicker && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }} className="overflow-hidden">
                        <div className="px-3 pb-3 grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                          {GAME_LIST.map(g => (
                            <motion.button key={g.id} whileTap={{ scale: 0.95 }}
                              onClick={() => { setSelectedGame(g.id); setShowGamePicker(false); }}
                              className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-center transition-colors"
                              style={{
                                backgroundColor: selectedGame === g.id ? "rgba(223,142,255,0.12)" : EP.surface2,
                                border: selectedGame === g.id ? `1px solid ${EP.neonPurple}40` : "1px solid transparent",
                              }}>
                              <span className="text-lg">{g.icon}</span>
                              <span className="text-[9px] font-semibold leading-tight" style={{ color: selectedGame === g.id ? EP.neonPurple : "rgba(255,255,255,0.5)" }}>{g.name}</span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Event invite section */}
              {user && isHost && (
                <EventInvite roomCode={room.roomCode} gameId={selectedGame} />
              )}

              <div className="space-y-2">
                {/* Everyone can toggle ready */}
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleToggleReady}
                  className="w-full rounded-xl py-3.5 text-sm font-bold transition-all"
                  style={{
                    backgroundColor: myReady ? "rgba(143,245,255,0.15)" : EP.surface2,
                    color: myReady ? EP.neonCyan : "rgba(255,255,255,0.6)",
                    border: `1px solid ${myReady ? "rgba(143,245,255,0.3)" : EP.border}`,
                  }}>
                  {myReady ? "✓ Bereit!" : "Bereit melden"}
                </motion.button>
                {isHost && (
                  <motion.button whileHover={allReady ? { scale: 1.02 } : {}} whileTap={allReady ? { scale: 0.96 } : {}}
                    disabled={!allReady} onClick={handleStart}
                    className="w-full rounded-xl py-4 text-sm font-extrabold text-white transition-all disabled:opacity-30 font-['Plus_Jakarta_Sans']"
                    style={{
                      background: allReady ? `linear-gradient(135deg, ${EP.neonPurple}, ${EP.neonPink})` : EP.surface3,
                      boxShadow: allReady ? `0 0 24px ${EP.neonPurple}40` : "none",
                    }}>
                    <span className="flex items-center justify-center gap-2">
                      <Play className="h-5 w-5" />
                      {allReady ? "Spiel starten!" : `Warte auf ${players.filter((p) => !p.isReady).length} Spieler...`}
                    </span>
                  </motion.button>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 font-['Be_Vietnam_Pro']">
                <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: EP.neonCyan }} />
                Echtzeit-Verbindung aktiv
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GameLobby;
