/**
 * PartyLobbyScreen — the central hub for a game night party session.
 * Players are added once and shared across multiple games.
 * Tracks overall scores, game history, and TV connection.
 */
import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Minus, Trophy, Users, Tv, Crown, Gamepad2,
  X, ChevronRight, RotateCcw, Sparkles,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { usePartySession, PLAYER_COLORS } from "@/hooks/usePartySession";
import { PartyGamePicker } from "@/components/native/PartyGamePicker";
import { spring, stagger, staggerItem, blissBloom } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { getBaseUrl } from "@/lib/platform";

const AVATARS = [
  "🎉", "🔥", "⭐", "🎯", "🚀", "💎", "🌟", "🎪",
  "🎲", "🎸", "🎨", "🦄",
];

export default function PartyLobbyScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const haptics = useHaptics();
  const party = usePartySession();
  const [newName, setNewName] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-start session if not active
  useEffect(() => {
    if (!party.isPartyActive) {
      party.startSession();
    }
  }, []);

  // Handle return from a game — check for last-game info
  const lastGame = searchParams.get("lastGame");
  const lastWinner = searchParams.get("lastWinner");

  const handleAddPlayer = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if ((party.session?.players.length ?? 0) >= 12) return;
    haptics.success();
    party.addPlayer(trimmed);
    setNewName("");
  }, [newName, haptics, party]);

  const handleRemovePlayer = useCallback(
    (id: string) => {
      haptics.light();
      party.removePlayer(id);
    },
    [haptics, party]
  );

  const handleSelectGame = useCallback(
    (gameId: string) => {
      haptics.medium();
      party.startGame(gameId);
      setShowPicker(false);
      navigate(`/games/${gameId}?party=true`);
    },
    [haptics, party, navigate]
  );

  const handleEndParty = useCallback(() => {
    haptics.celebrate();
    setShowFinalLeaderboard(true);
  }, [haptics]);

  const handleConfirmEnd = useCallback(() => {
    party.resetSession();
    setShowFinalLeaderboard(false);
    navigate("/games");
  }, [party, navigate]);

  const handleCopyTvLink = useCallback(async () => {
    if (!party.tvCode) return;
    haptics.success();
    const url = `${getBaseUrl()}/tv/${party.tvCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [party.tvCode, haptics]);

  const session = party.session;
  const players = session?.players ?? [];
  const leaderboard = party.getOverallLeaderboard();
  const history = session?.gameHistory ?? [];
  const canStartGame = players.length >= 2;

  return (
    <div className="relative min-h-screen bg-background safe-top">
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#df8eff]/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#ff6b98]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8ff5ff]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 pb-32">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                className="text-3xl font-display font-bold text-foreground"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Party Night
              </motion.h1>
              <motion.p
                className="text-sm text-muted-foreground mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {players.length} Spieler{players.length !== 1 ? "" : ""} &middot; {history.length} Spiel{history.length !== 1 ? "e" : ""} gespielt
              </motion.p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptics.light(); navigate("/games"); }}
              className="w-10 h-10 rounded-full bg-foreground/5 border border-border flex items-center justify-center"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>

        {/* Last game result banner */}
        <AnimatePresence>
          {lastGame && lastWinner && (
            <motion.div
              className="mx-5 mb-4 p-3 rounded-2xl bg-[#df8eff]/10 border border-[#df8eff]/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#f9ca24]" />
                <span className="text-sm text-foreground">
                  <span className="font-semibold">{lastWinner}</span> hat gewonnen!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players section */}
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Spieler ({players.length}/12)
            </h2>
          </div>

          <motion.div className="space-y-2" variants={stagger} initial="initial" animate="animate">
            <AnimatePresence initial={false}>
              {players.map((player, i) => (
                <motion.div
                  key={player.id}
                  layout
                  variants={staggerItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: player.color + "30", borderColor: player.color, borderWidth: 2 }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
                    {player.gamesPlayed > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        {player.totalScore} Pkt &middot; {player.gamesWon} Siege
                      </p>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemovePlayer(player.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"
                  >
                    <Minus className="w-4 h-4 text-red-400" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Add player input */}
          {players.length < 12 && (
            <motion.div
              className="flex items-center gap-2 mt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                placeholder="Spielername..."
                maxLength={20}
                className="flex-1 h-11 px-4 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAddPlayer}
                disabled={!newName.trim()}
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                  newName.trim()
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    : "bg-foreground/5 text-muted-foreground border border-border"
                )}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </section>

        {/* TV Connection */}
        {party.tvCode && (
          <section className="px-5 mb-5">
            <motion.div
              className="p-4 rounded-2xl bg-[#df8eff]/5 border border-[#df8eff]/15"
              variants={blissBloom}
              initial="initial"
              animate="animate"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#df8eff]/20 flex items-center justify-center shrink-0">
                  <Tv className="w-5 h-5 text-[#df8eff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">TV verbinden</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getBaseUrl()}/tv/{party.tvCode}
                  </p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-xl font-display font-black text-[#df8eff] tracking-[0.15em]">
                    {party.tvCode}
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCopyTvLink}
                className="w-full mt-3 h-9 rounded-xl bg-[#df8eff]/10 border border-[#df8eff]/20 text-[#df8eff] text-xs font-semibold"
              >
                {copied ? "Kopiert!" : "TV-Link kopieren"}
              </motion.button>
            </motion.div>
          </section>
        )}

        {/* Overall Leaderboard — only after first game */}
        {history.length > 0 && (
          <section className="px-5 mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4" /> Gesamtwertung
            </h2>
            <div className="space-y-2">
              {leaderboard.map((player, i) => (
                <motion.div
                  key={player.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border",
                    i === 0
                      ? "bg-[#f9ca24]/10 border-[#f9ca24]/30"
                      : "bg-card border-border"
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-7 flex items-center justify-center shrink-0">
                    {i === 0 && <Crown className="w-5 h-5 text-[#f9ca24]" />}
                    {i === 1 && <span className="text-sm font-bold text-gray-400">2</span>}
                    {i === 2 && <span className="text-sm font-bold text-amber-700">3</span>}
                    {i > 2 && <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>}
                  </div>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: player.color + "30", borderColor: player.color, borderWidth: 2 }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {player.gamesWon} Siege &middot; {player.gamesPlayed} Spiele
                    </p>
                  </div>
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {player.totalScore}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Game History */}
        {history.length > 0 && (
          <section className="px-5 mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
              <Gamepad2 className="w-4 h-4" /> Gespielte Spiele
            </h2>
            <div className="space-y-2">
              {[...history].reverse().map((entry, i) => (
                <motion.div
                  key={`${entry.gameId}-${entry.playedAt}`}
                  className="p-3 rounded-xl bg-card border border-border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{entry.gameName}</p>
                    <div className="flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-[#f9ca24]" />
                      <span className="text-xs font-medium text-muted-foreground">{entry.winnerName}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Start game CTA */}
        <div className="px-5 space-y-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              haptics.medium();
              setShowPicker(true);
            }}
            disabled={!canStartGame}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all",
              canStartGame
                ? "bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#f9ca24] text-white shadow-[0_0_30px_rgba(223,142,255,0.3)]"
                : "bg-foreground/5 text-muted-foreground border border-border cursor-not-allowed"
            )}
          >
            <Sparkles className="w-5 h-5" />
            Spiel wahlen
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {!canStartGame && (
            <p className="text-xs text-center text-muted-foreground">
              Mindestens 2 Spieler hinzufugen
            </p>
          )}

          {history.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEndParty}
              className="w-full py-3.5 rounded-2xl border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-foreground/5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Party beenden
            </motion.button>
          )}
        </div>
      </div>

      {/* Game picker overlay */}
      <PartyGamePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectGame={handleSelectGame}
        playerCount={players.length}
      />

      {/* Final Leaderboard overlay */}
      <AnimatePresence>
        {showFinalLeaderboard && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm space-y-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.bouncy}
            >
              {/* Trophy */}
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
              >
                <div className="w-20 h-20 rounded-full bg-[#f9ca24]/20 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-[#f9ca24]" />
                </div>
              </motion.div>

              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">Party vorbei!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {history.length} Spiel{history.length !== 1 ? "e" : ""} &middot; {players.length} Spieler
                </p>
              </div>

              {/* Final rankings */}
              <div className="space-y-2">
                {leaderboard.map((player, i) => (
                  <motion.div
                    key={player.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border",
                      i === 0
                        ? "bg-[#f9ca24]/10 border-[#f9ca24]/30"
                        : i === 1
                        ? "bg-foreground/5 border-border"
                        : "bg-card border-border"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {i === 0 && <Crown className="w-5 h-5 text-[#f9ca24]" />}
                      {i === 1 && <span className="text-sm font-bold text-gray-400">2</span>}
                      {i === 2 && <span className="text-sm font-bold text-amber-700">3</span>}
                      {i > 2 && <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>}
                    </div>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: player.color + "30", borderColor: player.color, borderWidth: 2 }}
                    >
                      {player.avatar}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-foreground truncate">
                      {player.name}
                    </span>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-foreground tabular-nums">
                        {player.totalScore}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{player.gamesWon} Siege</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirmEnd}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white font-bold text-base shadow-[0_0_25px_rgba(223,142,255,0.3)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Fertig
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
