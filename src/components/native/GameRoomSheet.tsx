/**
 * GameRoomSheet — bottom sheet for creating/joining online game rooms.
 * Two tabs: "Erstellen" (pick game, create room) and "Beitreten" (enter code).
 * Uses vaul Drawer and existing design patterns (glassmorphism, haptics, spring).
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LogIn,
  Gamepad2,
  ArrowRight,
  X,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Game list (matches the canonical IDs)
// ---------------------------------------------------------------------------

const ONLINE_GAMES = [
  { id: "bomb", name: "Tickende Bombe", icon: "\u{1F4A3}" },
  { id: "headup", name: "Stirnraten", icon: "\u{1F9E0}" },
  { id: "taboo", name: "Wortverbot", icon: "\u{1F6AB}" },
  { id: "category", name: "Zeit-Kategorie", icon: "\u23F1\uFE0F" },
  { id: "this-or-that", name: "This or That", icon: "\u2194\uFE0F" },
  { id: "hochstapler", name: "Hochstapler", icon: "\u{1F3AD}" },
  { id: "wahrheit-pflicht", name: "Wahrheit/Pflicht", icon: "\u2764\uFE0F" },
  { id: "wer-bin-ich", name: "Wer bin ich?", icon: "\u2753" },
  { id: "flaschendrehen", name: "Flaschendrehen", icon: "\u{1F37E}" },
  { id: "emoji-raten", name: "Emoji-Raten", icon: "\u{1F600}" },
  { id: "fake-or-fact", name: "Fake or Fact", icon: "\u{1F3B2}" },
  { id: "schnellzeichner", name: "Schnellzeichner", icon: "\u{1F3A8}" },
  { id: "split-quiz", name: "Split Quiz", icon: "\u{1F9E9}" },
  { id: "geteilt-gequizzt", name: "Geteilt & Gequizzt", icon: "\u{1F517}" },
  { id: "story-builder", name: "Story Builder", icon: "\u{1F4D6}" },
  { id: "wo-ist-was", name: "Wo ist was?", icon: "\u{1F5FA}\uFE0F" },
  { id: "drueck-das-wort", name: "Drück das Wort", icon: "\u{1F524}" },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "create" | "join";

interface GameRoomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a tab when opening */
  initialTab?: Tab;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GameRoomSheet({
  open,
  onOpenChange,
  initialTab = "create",
}: GameRoomSheetProps) {
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Reset state when drawer opens
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setTab(initialTab);
        setJoinCode("");
        setJoinError("");
        setSelectedGame(null);
      }
      onOpenChange(next);
    },
    [initialTab, onOpenChange],
  );

  // ---- Create flow ----
  const handleSelectGame = (gameId: string) => {
    haptics.select();
    setSelectedGame(gameId);
  };

  const handleCreate = () => {
    if (!selectedGame) return;
    haptics.medium();
    // Navigate to GamesHub with ?lobby= param — GamesHub shows the GameLobby modal
    // which handles room creation, player name entry, code sharing, etc.
    navigate(`/games/${selectedGame}?lobby=${selectedGame}`);
    onOpenChange(false);
  };

  // ---- Join flow ----
  const handleJoin = () => {
    const normalized = joinCode.toUpperCase().trim();
    if (normalized.length !== 6) {
      haptics.warning();
      setJoinError("Der Code muss 6 Zeichen lang sein.");
      return;
    }
    haptics.medium();
    // Navigate through GameLobby with room code pre-filled (lobby= triggers
    // the lobby overlay in GamesHub, room= pre-fills the join code)
    navigate(`/games/bomb?lobby=bomb&room=${normalized}`);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} dismissible={false} repositionInputs={false} handleOnly>
      <DrawerContent className="max-h-[85vh] bg-background border-border" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DrawerHeader className="text-center pb-2 relative">
          {/* Explicit close button — drawer is non-dismissible on iOS to prevent keyboard issues */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-3 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <DrawerTitle className="text-xl font-display font-bold text-foreground">
            Online spielen
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Spiele mit Freunden in Echtzeit
          </DrawerDescription>
        </DrawerHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 px-5 pb-4">
          {([
            { id: "create" as Tab, label: "Erstellen", icon: Plus },
            { id: "join" as Tab, label: "Beitreten", icon: LogIn },
          ]).map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.95 }}
                transition={spring.snappy}
                onClick={() => {
                  haptics.select();
                  setTab(t.id);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold border transition-colors",
                  active
                    ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                    : "bg-foreground/5 text-muted-foreground border-border",
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </motion.button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="px-5 pb-8 overflow-y-auto max-h-[60vh] native-scroll">
          <AnimatePresence mode="wait">
            {tab === "create" ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={spring.snappy}
              >
                <CreateTab
                  selectedGame={selectedGame}
                  onSelectGame={handleSelectGame}
                  onCreate={handleCreate}
                />
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={spring.snappy}
              >
                <JoinTab
                  code={joinCode}
                  error={joinError}
                  onCodeChange={(v) => {
                    setJoinCode(v.toUpperCase());
                    setJoinError("");
                  }}
                  onJoin={handleJoin}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Create Tab — pick a game, then confirm
// ---------------------------------------------------------------------------

function CreateTab({
  selectedGame,
  onSelectGame,
  onCreate,
}: {
  selectedGame: string | null;
  onSelectGame: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Wähle ein Spiel, um einen Raum zu erstellen:
      </p>

      {/* Game picker grid */}
      <div className="grid grid-cols-2 gap-2">
        {ONLINE_GAMES.map((game) => {
          const active = selectedGame === game.id;
          return (
            <motion.button
              key={game.id}
              whileTap={{ scale: 0.95 }}
              transition={spring.snappy}
              onClick={() => onSelectGame(game.id)}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all min-h-[52px]",
                active
                  ? "bg-primary/10 border-primary/50 shadow-[0_0_16px_rgba(139,92,246,0.15)]"
                  : "bg-foreground/[0.03] border-border hover:bg-foreground/[0.06]",
              )}
            >
              <span className="text-lg flex-shrink-0">{game.icon}</span>
              <span
                className={cn(
                  "text-xs font-medium leading-tight line-clamp-2",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {game.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Create button */}
      <motion.button
        onClick={onCreate}
        disabled={!selectedGame}
        whileTap={{ scale: selectedGame ? 0.96 : 1 }}
        transition={spring.snappy}
        className={cn(
          "w-full h-14 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 transition-all",
          selectedGame
            ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.5)]"
            : "bg-foreground/[0.08] text-muted-foreground/60 cursor-not-allowed",
        )}
      >
        <Gamepad2 className="w-5 h-5" />
        Raum erstellen
      </motion.button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Join Tab — code input + join button
// ---------------------------------------------------------------------------

function JoinTab({
  code,
  error,
  onCodeChange,
  onJoin,
}: {
  code: string;
  error: string;
  onCodeChange: (v: string) => void;
  onJoin: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gib den 6-stelligen Raumcode ein:
      </p>

      {/* Big code input (JoinEventFlow style) */}
      <div className="relative">
        <input
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onJoin()}
          placeholder="Z.B. ABC123"
          maxLength={6}
          className="w-full h-16 px-5 rounded-2xl bg-foreground/5 border-2 border-border text-foreground text-center text-2xl font-display font-bold tracking-[0.3em] placeholder:text-muted-foreground/60 placeholder:tracking-widest placeholder:text-lg focus:outline-none focus:border-primary/60 transition-colors uppercase"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-sm text-red-400 text-center"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Join button */}
      <motion.button
        onClick={onJoin}
        disabled={!code.trim()}
        whileTap={{ scale: code.trim() ? 0.96 : 1 }}
        transition={spring.snappy}
        className={cn(
          "w-full h-14 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 transition-all",
          code.trim()
            ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.5)]"
            : "bg-foreground/[0.08] text-muted-foreground/60 cursor-not-allowed",
        )}
      >
        <ArrowRight className="w-5 h-5" />
        Beitreten
      </motion.button>
    </div>
  );
}
