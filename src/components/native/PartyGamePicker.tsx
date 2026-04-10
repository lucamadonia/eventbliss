/**
 * PartyGamePicker — full-screen overlay to select a game during a party session.
 * Shows all 17 games as tappable cards. On selection, navigates to the game
 * with ?party=true so the game knows to use party players.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Search, Sparkles, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface GameMeta {
  id: string;
  nameKey: string;
  descKey: string;
  image: string;
  gradient: string;
  tier: "free" | "premium";
  badge?: "Hot" | "Neu";
}

const GAMES: GameMeta[] = [
  { id: "bomb",            nameKey: "native.gameNames.bomb",            descKey: "native.gameDescs.bomb",            image: "/images/games/bomb.webp",            gradient: "from-orange-500 to-red-600",       tier: "free",    badge: "Hot" },
  { id: "headup",          nameKey: "native.gameNames.headup",          descKey: "native.gameDescs.headup",          image: "/images/games/headup.webp",          gradient: "from-violet-500 to-purple-600",    tier: "free" },
  { id: "taboo",           nameKey: "native.gameNames.taboo",           descKey: "native.gameDescs.taboo",           image: "/images/games/taboo.webp",           gradient: "from-cyan-500 to-blue-600",        tier: "free" },
  { id: "category",        nameKey: "native.gameNames.category",        descKey: "native.gameDescs.category",        image: "/images/games/category.webp",        gradient: "from-amber-500 to-orange-600",     tier: "free" },
  { id: "this-or-that",    nameKey: "native.gameNames.thisOrThat",      descKey: "native.gameDescs.thisOrThat",      image: "/images/games/this-or-that.webp",    gradient: "from-violet-500 to-fuchsia-600",   tier: "free",    badge: "Neu" },
  { id: "hochstapler",     nameKey: "native.gameNames.hochstapler",     descKey: "native.gameDescs.hochstapler",     image: "/images/games/hochstapler.webp",     gradient: "from-slate-600 to-gray-800",       tier: "premium", badge: "Neu" },
  { id: "wahrheit-pflicht",nameKey: "native.gameNames.wahrheitPflicht", descKey: "native.gameDescs.wahrheitPflicht", image: "/images/games/wahrheit-pflicht.webp",gradient: "from-pink-500 to-rose-600",        tier: "premium", badge: "Neu" },
  { id: "wer-bin-ich",     nameKey: "native.gameNames.werBinIch",       descKey: "native.gameDescs.werBinIch",       image: "/images/games/wer-bin-ich.webp",     gradient: "from-amber-400 to-orange-500",     tier: "premium", badge: "Neu" },
  { id: "flaschendrehen",  nameKey: "native.gameNames.flaschendrehen",  descKey: "native.gameDescs.flaschendrehen",  image: "/images/games/flaschendrehen.webp",  gradient: "from-violet-500 to-pink-500",      tier: "premium", badge: "Hot" },
  { id: "emoji-raten",     nameKey: "native.gameNames.emojiRaten",      descKey: "native.gameDescs.emojiRaten",      image: "/images/games/emoji-raten.webp",     gradient: "from-yellow-400 to-amber-500",     tier: "premium", badge: "Neu" },
  { id: "fake-or-fact",    nameKey: "native.gameNames.fakeOrFact",      descKey: "native.gameDescs.fakeOrFact",      image: "/images/games/fake-or-fact.webp",    gradient: "from-red-500 to-rose-600",         tier: "premium", badge: "Neu" },
  { id: "schnellzeichner", nameKey: "native.gameNames.schnellzeichner", descKey: "native.gameDescs.schnellzeichner", image: "/images/games/schnellzeichner.webp", gradient: "from-orange-500 to-red-500",       tier: "premium", badge: "Neu" },
  { id: "split-quiz",      nameKey: "native.gameNames.splitQuiz",       descKey: "native.gameDescs.splitQuiz",       image: "/images/games/split-quiz.webp",      gradient: "from-blue-500 to-indigo-700",      tier: "premium" },
  { id: "geteilt-gequizzt",nameKey: "native.gameNames.geteiltGequizzt", descKey: "native.gameDescs.geteiltGequizzt", image: "/images/games/geteilt-gequizzt.webp",gradient: "from-cyan-500 to-blue-600",        tier: "premium", badge: "Neu" },
  { id: "story-builder",   nameKey: "native.gameNames.storyBuilder",    descKey: "native.gameDescs.storyBuilder",    image: "/images/games/story-builder.webp",   gradient: "from-teal-400 to-emerald-500",     tier: "premium", badge: "Neu" },
  { id: "wo-ist-was",      nameKey: "native.gameNames.woIstWas",        descKey: "native.gameDescs.woIstWas",        image: "/images/games/wo-ist-was.webp",      gradient: "from-cyan-500 to-blue-600",        tier: "premium" },
  { id: "drueck-das-wort", nameKey: "native.gameNames.drueckDasWort",   descKey: "native.gameDescs.drueckDasWort",   image: "/images/games/drueck-das-wort.webp", gradient: "from-emerald-500 to-green-600",    tier: "premium" },
];

interface PartyGamePickerProps {
  open: boolean;
  onClose: () => void;
  onSelectGame: (gameId: string) => void;
  playerCount: number;
}

export function PartyGamePicker({ open, onClose, onSelectGame, playerCount }: PartyGamePickerProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const { isPremium } = usePremium();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return GAMES;
    const q = search.toLowerCase();
    return GAMES.filter((g) => {
      const name = t(g.nameKey).toLowerCase();
      const desc = t(g.descKey).toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [search, t]);

  const handleSelect = (game: GameMeta) => {
    const locked = game.tier === "premium" && !isPremium;
    if (locked) return;
    haptics.medium();
    onSelectGame(game.id);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 safe-top">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Spiel wahlen</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{playerCount} Spieler bereit</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptics.light(); onClose(); }}
              className="w-10 h-10 rounded-full bg-foreground/5 border border-border flex items-center justify-center"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Spiel suchen..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Game grid */}
          <div className="flex-1 overflow-y-auto native-scroll pb-8">
            <motion.div
              className="px-5 grid grid-cols-2 gap-3"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {filtered.map((game) => {
                const locked = game.tier === "premium" && !isPremium;
                return (
                  <motion.button
                    key={game.id}
                    variants={staggerItem}
                    whileTap={{ scale: locked ? 1 : 0.96 }}
                    transition={spring.snappy}
                    onClick={() => handleSelect(game)}
                    className={cn(
                      "relative aspect-[3/4] rounded-2xl overflow-hidden text-left border border-border bg-card group",
                      locked && "opacity-50"
                    )}
                  >
                    {/* Image */}
                    <div className="absolute inset-0">
                      <img
                        src={game.image}
                        alt={t(game.nameKey)}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br mix-blend-overlay opacity-60",
                          game.gradient
                        )}
                      />
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between">
                      {game.badge ? (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                            game.badge === "Hot" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                          )}
                        >
                          {game.badge}
                        </span>
                      ) : <span />}
                      {locked && (
                        <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-amber-400/40">
                          <Lock className="w-3.5 h-3.5 text-amber-300" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-3 space-y-0.5">
                      <p className="text-sm font-display font-bold text-white leading-tight drop-shadow-lg">
                        {t(game.nameKey)}
                      </p>
                      <p className="text-[10px] text-white/70 leading-tight line-clamp-2 drop-shadow">
                        {t(game.descKey)}
                      </p>
                    </div>

                    {/* Active ring */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-active:ring-primary/50 transition-all rounded-2xl pointer-events-none" />
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
