/**
 * GamesScreen — native "Play" tab. The fun factor.
 * Uses REAL game thumbnails from /images/games/{id}.webp paired with
 * canonical game IDs that match the /games/:gameId router.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Flame,
  Users,
  Brain,
  Zap,
  Map as MapIcon,
  Star,
  Lock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";


type Category = "alle" | "party" | "quiz" | "wort" | "karte" | "reaktion" | "social" | "kreativ";

interface GameMeta {
  id: string;
  nameKey: string;
  descKey: string;
  image: string;
  gradient: string;
  tier: "free" | "premium";
  categories: Category[];
  badge?: "Hot" | "Neu";
}

const GAMES: GameMeta[] = [
  { id: "bomb",            nameKey: "native.gameNames.bomb",            descKey: "native.gameDescs.bomb",            image: "/images/games/bomb.webp",            gradient: "from-orange-500 to-red-600",       tier: "free",    badge: "Hot", categories: ["party", "quiz"] },
  { id: "headup",          nameKey: "native.gameNames.headup",          descKey: "native.gameDescs.headup",          image: "/images/games/headup.webp",          gradient: "from-violet-500 to-purple-600",    tier: "free",                  categories: ["party", "wort"] },
  { id: "taboo",           nameKey: "native.gameNames.taboo",           descKey: "native.gameDescs.taboo",           image: "/images/games/taboo.webp",           gradient: "from-cyan-500 to-blue-600",        tier: "free",                  categories: ["party", "wort"] },
  { id: "category",        nameKey: "native.gameNames.category",        descKey: "native.gameDescs.category",        image: "/images/games/category.webp",        gradient: "from-amber-500 to-orange-600",     tier: "free",                  categories: ["wort", "reaktion"] },
  { id: "this-or-that",    nameKey: "native.gameNames.thisOrThat",      descKey: "native.gameDescs.thisOrThat",      image: "/images/games/this-or-that.webp",    gradient: "from-violet-500 to-fuchsia-600",   tier: "free",    badge: "Neu", categories: ["party", "social"] },
  { id: "hochstapler",     nameKey: "native.gameNames.hochstapler",     descKey: "native.gameDescs.hochstapler",     image: "/images/games/hochstapler.webp",     gradient: "from-slate-600 to-gray-800",       tier: "premium", badge: "Neu", categories: ["social", "party"] },
  { id: "wahrheit-pflicht",nameKey: "native.gameNames.wahrheitPflicht", descKey: "native.gameDescs.wahrheitPflicht", image: "/images/games/wahrheit-pflicht.webp",gradient: "from-pink-500 to-rose-600",        tier: "premium", badge: "Neu", categories: ["party", "social"] },
  { id: "wer-bin-ich",     nameKey: "native.gameNames.werBinIch",       descKey: "native.gameDescs.werBinIch",       image: "/images/games/wer-bin-ich.webp",     gradient: "from-amber-400 to-orange-500",     tier: "premium", badge: "Neu", categories: ["social", "party"] },
  { id: "flaschendrehen",  nameKey: "native.gameNames.flaschendrehen",  descKey: "native.gameDescs.flaschendrehen",  image: "/images/games/flaschendrehen.webp",  gradient: "from-violet-500 to-pink-500",      tier: "premium", badge: "Hot", categories: ["party", "social"] },
  { id: "emoji-raten",     nameKey: "native.gameNames.emojiRaten",      descKey: "native.gameDescs.emojiRaten",      image: "/images/games/emoji-raten.webp",     gradient: "from-yellow-400 to-amber-500",     tier: "premium", badge: "Neu", categories: ["quiz", "kreativ"] },
  { id: "fake-or-fact",    nameKey: "native.gameNames.fakeOrFact",      descKey: "native.gameDescs.fakeOrFact",      image: "/images/games/fake-or-fact.webp",    gradient: "from-red-500 to-rose-600",         tier: "premium", badge: "Neu", categories: ["quiz", "wort"] },
  { id: "schnellzeichner", nameKey: "native.gameNames.schnellzeichner", descKey: "native.gameDescs.schnellzeichner", image: "/images/games/schnellzeichner.webp", gradient: "from-orange-500 to-red-500",       tier: "premium", badge: "Neu", categories: ["kreativ", "party"] },
  { id: "split-quiz",      nameKey: "native.gameNames.splitQuiz",       descKey: "native.gameDescs.splitQuiz",       image: "/images/games/split-quiz.webp",      gradient: "from-blue-500 to-indigo-700",      tier: "premium",               categories: ["quiz", "social"] },
  { id: "geteilt-gequizzt",nameKey: "native.gameNames.geteiltGequizzt", descKey: "native.gameDescs.geteiltGequizzt", image: "/images/games/geteilt-gequizzt.webp",gradient: "from-cyan-500 to-blue-600",        tier: "premium", badge: "Neu", categories: ["quiz", "social"] },
  { id: "story-builder",   nameKey: "native.gameNames.storyBuilder",    descKey: "native.gameDescs.storyBuilder",    image: "/images/games/story-builder.webp",   gradient: "from-teal-400 to-emerald-500",     tier: "premium", badge: "Neu", categories: ["kreativ", "wort"] },
  { id: "wo-ist-was",      nameKey: "native.gameNames.woIstWas",        descKey: "native.gameDescs.woIstWas",        image: "/images/games/wo-ist-was.webp",      gradient: "from-cyan-500 to-blue-600",        tier: "premium",               categories: ["karte", "quiz"] },
  { id: "drueck-das-wort", nameKey: "native.gameNames.drueckDasWort",   descKey: "native.gameDescs.drueckDasWort",   image: "/images/games/drueck-das-wort.webp", gradient: "from-emerald-500 to-green-600",    tier: "premium",               categories: ["wort", "reaktion"] },
];

const CATEGORIES: { id: Category; labelKey: string; icon: typeof Sparkles }[] = [
  { id: "alle",     labelKey: "native.games.categories.alle",     icon: Sparkles },
  { id: "party",    labelKey: "native.games.categories.party",    icon: Flame },
  { id: "social",   labelKey: "native.games.categories.social",   icon: Users },
  { id: "quiz",     labelKey: "native.games.categories.quiz",     icon: Brain },
  { id: "wort",     labelKey: "native.games.categories.wort",     icon: Brain },
  { id: "karte",    labelKey: "native.games.categories.karte",    icon: MapIcon },
  { id: "reaktion", labelKey: "native.games.categories.reaktion", icon: Zap },
  { id: "kreativ",  labelKey: "native.games.categories.kreativ",  icon: Sparkles },
];

export default function GamesScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { isPremium } = usePremium();
  const [category, setCategory] = useState<Category>("alle");

  const filtered = useMemo(
    () =>
      category === "alle"
        ? GAMES
        : GAMES.filter((g) => g.categories.includes(category)),
    [category]
  );

  const playGame = (game: GameMeta) => {
    haptics.medium();
    navigate(`/games/${game.id}`);
  };

  return (
    <div className="relative h-full flex flex-col bg-background safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-sm text-accent font-semibold uppercase tracking-wider">
          {t('native.games.subtitle')}
        </p>
        <h1 className="text-3xl font-display font-bold text-foreground mt-1 leading-tight">
          {t('native.games.title')}
        </h1>
      </div>

      {/* Category chips */}
      <div className="pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5">
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
                    : "bg-foreground/5 text-muted-foreground border-border"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(c.labelKey)}
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
          {filtered.map((game) => {
            const locked = game.tier === "premium" && !isPremium;
            return (
              <motion.button
                key={game.id}
                variants={staggerItem}
                whileTap={{ scale: 0.96 }}
                transition={spring.snappy}
                onClick={() => playGame(game)}
                className="relative aspect-[3/4] rounded-3xl overflow-hidden text-left border border-border bg-card group"
              >
                {/* Real game image */}
                <div className="absolute inset-0">
                  <img
                    src={game.image}
                    alt={t(game.nameKey)}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback: hide broken image, gradient shows through
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {/* Gradient tint overlay for readability */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"
                    )}
                  />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br mix-blend-overlay opacity-60",
                      game.gradient
                    )}
                  />
                </div>

                {/* Top badges */}
                <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between">
                  {game.badge ? (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                        game.badge === "Hot"
                          ? "bg-red-500 text-white"
                          : "bg-emerald-500 text-white"
                      )}
                    >
                      {game.badge}
                    </span>
                  ) : (
                    <span />
                  )}
                  {locked && (
                    <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-amber-400/40">
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                  )}
                </div>

                {/* Title + description */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-3 space-y-0.5">
                  <p className="text-base font-display font-bold text-white leading-tight drop-shadow-lg">
                    {t(game.nameKey)}
                  </p>
                  <p className="text-[11px] text-white/80 leading-tight line-clamp-2 drop-shadow">
                    {t(game.descKey)}
                  </p>
                </div>

                {/* Hover glow */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-active:ring-primary/50 transition-all rounded-3xl pointer-events-none" />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Footer: premium hint */}
        {!isPremium && (
          <motion.button
            onClick={() => {
              haptics.light();
              navigate("/premium");
            }}
            className="mx-5 mt-5 mb-2 w-[calc(100%-40px)] relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-pink-500/20 border border-amber-400/30 flex items-center gap-3 text-left"
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {t('native.games.unlockPremium')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('native.games.unlockPremiumSub')}
              </p>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}
