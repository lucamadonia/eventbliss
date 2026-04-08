/**
 * GamesScreen — native "Play" tab. The fun factor.
 * Horizontal category chips + 2-column tactile game cards.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Flame,
  Sparkles,
  Brain,
  Users,
  Zap,
  Lock,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Category = "all" | "party" | "word" | "action" | "quiz" | "social";

interface GameMeta {
  id: string;
  name: string;
  emoji: string;
  category: Category[];
  gradient: string;
  tier: "free" | "premium";
  description: string;
}

const GAMES: GameMeta[] = [
  { id: "bomb", name: "Bombe", emoji: "💣", category: ["party", "word"], gradient: "from-red-500 to-orange-500", tier: "free", description: "Wörter weitergeben bevor's knallt" },
  { id: "taboo", name: "Tabu", emoji: "🚫", category: ["party", "word"], gradient: "from-purple-500 to-pink-500", tier: "free", description: "Umschreiben ohne Tabuwörter" },
  { id: "headup", name: "Heads Up", emoji: "🧠", category: ["party", "action"], gradient: "from-amber-500 to-orange-500", tier: "free", description: "Erraten mit dem Handy an der Stirn" },
  { id: "category", name: "Kategorie", emoji: "📚", category: ["party", "quiz"], gradient: "from-cyan-500 to-teal-500", tier: "free", description: "Gemeinsam Worte finden" },
  { id: "this-or-that", name: "Dies oder Das", emoji: "⚖️", category: ["social"], gradient: "from-violet-500 to-fuchsia-500", tier: "free", description: "Entweder — oder?" },
  { id: "hochstapler", name: "Impostor", emoji: "🕵️", category: ["party", "social"], gradient: "from-slate-600 to-gray-700", tier: "premium", description: "Finde den Hochstapler" },
  { id: "wahrheit-pflicht", name: "Wahrheit/Pflicht", emoji: "🎲", category: ["party", "social"], gradient: "from-pink-500 to-rose-500", tier: "premium", description: "Der Klassiker neu gedacht" },
  { id: "wer-bin-ich", name: "Wer bin ich?", emoji: "🎭", category: ["party"], gradient: "from-emerald-500 to-teal-500", tier: "premium", description: "Zettel auf die Stirn" },
  { id: "emoji-raten", name: "Emoji Quiz", emoji: "😀", category: ["quiz"], gradient: "from-yellow-500 to-amber-500", tier: "premium", description: "Errate die Wörter" },
  { id: "fake-or-fact", name: "Fake or Fact", emoji: "🤔", category: ["quiz"], gradient: "from-blue-500 to-indigo-500", tier: "premium", description: "Stimmt's — oder nicht?" },
  { id: "schnellzeichner", name: "Quickdraw", emoji: "✏️", category: ["action"], gradient: "from-green-500 to-emerald-500", tier: "premium", description: "Zeichnen unter Zeitdruck" },
  { id: "flaschendrehen", name: "Flaschendrehen", emoji: "🍾", category: ["party"], gradient: "from-teal-500 to-cyan-500", tier: "premium", description: "Digital & mit Kick" },
  { id: "split-quiz", name: "Split Quiz", emoji: "🔀", category: ["quiz"], gradient: "from-fuchsia-500 to-purple-500", tier: "premium", description: "Team gegen Team" },
  { id: "story-builder", name: "Story Builder", emoji: "📖", category: ["word"], gradient: "from-indigo-500 to-violet-500", tier: "premium", description: "Gemeinsam Geschichten" },
  { id: "wo-ist-was", name: "Wo ist was?", emoji: "🗺️", category: ["quiz", "action"], gradient: "from-sky-500 to-blue-500", tier: "premium", description: "Geo-Quiz" },
  { id: "drueck-das-wort", name: "Drück das Wort", emoji: "🎤", category: ["word"], gradient: "from-rose-500 to-pink-500", tier: "premium", description: "Sprich, aber nicht diese Worte" },
];

const CATEGORIES: { id: Category; label: string; icon: typeof Gamepad2 }[] = [
  { id: "all", label: "Alle", icon: Sparkles },
  { id: "party", label: "Party", icon: Flame },
  { id: "social", label: "Social", icon: Users },
  { id: "word", label: "Wort", icon: Brain },
  { id: "action", label: "Action", icon: Zap },
  { id: "quiz", label: "Quiz", icon: Brain },
];

export default function GamesScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { isPremium } = usePremium();
  const [category, setCategory] = useState<Category>("all");

  const filtered = useMemo(
    () => (category === "all" ? GAMES : GAMES.filter((g) => g.category.includes(category))),
    [category]
  );

  const playGame = (game: GameMeta) => {
    if (game.tier === "premium" && !isPremium) {
      haptics.warning();
      navigate("/premium");
      return;
    }
    haptics.medium();
    navigate(`/games/${game.id}`);
  };

  return (
    <div className="relative h-full flex flex-col bg-background safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-sm text-white/50 font-medium">Party Games</p>
        <h1 className="text-3xl font-display font-bold text-white mt-1">
          Bereit für Spaß?
        </h1>
      </div>

      {/* Category chips */}
      <div className="px-5 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  haptics.select();
                  setCategory(c.id);
                }}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-medium border transition-colors",
                  active
                    ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                    : "bg-white/5 text-white/60 border-white/10"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Game grid */}
      <div className="flex-1 overflow-y-auto native-scroll pb-tabbar">
        <motion.div
          className="px-5 pt-2 grid grid-cols-2 gap-3"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {filtered.map((game) => (
            <motion.button
              key={game.id}
              variants={staggerItem}
              whileTap={{ scale: 0.96 }}
              transition={spring.snappy}
              onClick={() => playGame(game)}
              className={cn(
                "relative aspect-[3/4] rounded-3xl overflow-hidden p-4 flex flex-col justify-between bg-gradient-to-br text-left border border-white/10",
                game.gradient
              )}
            >
              {/* Noise overlay */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
              </div>

              {/* Lock badge */}
              {game.tier === "premium" && !isPremium && (
                <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20">
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                </div>
              )}

              {/* Emoji */}
              <div className="relative text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {game.emoji}
              </div>

              {/* Title & desc */}
              <div className="relative">
                <p className="text-base font-display font-bold text-white leading-tight">
                  {game.name}
                </p>
                <p className="text-[11px] text-white/70 mt-0.5 line-clamp-2 leading-tight">
                  {game.description}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
