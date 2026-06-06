/**
 * PlayableGamesShelf — the "Special Highlight" inside the Ideas → Games tab.
 *
 * Surfaces the 18 fully integrated, playable games (from @/lib/playable-games)
 * as a glowing horizontal shelf that deep-links straight into /games/:id.
 * Visually set apart from the 147 static idea cards by a gradient glow frame
 * and a "Play" affordance, so users instantly see what's playable right now.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gamepad2, Play, Lock, ChevronRight } from "lucide-react";
import { playableGames } from "@/lib/playable-games";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { cn } from "@/lib/utils";

export function PlayableGamesShelf() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { isPremium } = usePremium();

  const play = (id: string) => {
    haptics.medium();
    navigate(`/games/${id}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative mx-5 mb-4 rounded-3xl p-[1.5px] bg-gradient-to-br from-violet-500/60 via-fuchsia-500/40 to-amber-400/50 shadow-[0_0_30px_rgba(139,92,246,0.25)]"
    >
      <div className="relative rounded-3xl bg-background/95 overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-10 -right-6 w-40 h-40 rounded-full bg-fuchsia-500/20 blur-3xl" />

        {/* Header */}
        <button
          type="button"
          onClick={() => {
            haptics.light();
            navigate("/games");
          }}
          className="relative w-full flex items-center gap-3 px-4 pt-4 pb-3 text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(217,70,239,0.45)]">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-display font-bold text-foreground leading-tight">
              {t("native.ideas.playableTitle", "Direkt spielbar")}
            </h2>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {t("native.ideas.playableSubtitle", "Sofort loslegen — in der App integriert")}
            </p>
          </div>
          <span className="flex items-center gap-0.5 text-xs font-medium text-primary shrink-0">
            {t("native.ideas.playableAll", "Alle")}
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        {/* Horizontal shelf */}
        <div className="relative flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4 pt-1 snap-x snap-mandatory">
          {playableGames.map((game) => {
            const locked = game.tier === "premium" && !isPremium;
            return (
              <motion.button
                key={game.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => play(game.id)}
                className="relative w-[42vw] max-w-[160px] shrink-0 snap-start aspect-[3/4] rounded-2xl overflow-hidden text-left border border-border bg-card group"
              >
                {/* Thumbnail */}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                  <div className={cn("absolute inset-0 bg-gradient-to-br mix-blend-overlay opacity-60", game.gradient)} />
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
                  ) : (
                    <span />
                  )}
                  {locked && (
                    <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-amber-400/40">
                      <Lock className="w-3 h-3 text-amber-300" />
                    </div>
                  )}
                </div>

                {/* Title + play pill */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-2.5">
                  <p className="text-sm font-display font-bold text-white leading-tight drop-shadow-lg line-clamp-1">
                    {t(game.nameKey)}
                  </p>
                  <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur text-[10px] font-semibold text-white border border-white/20">
                    <Play className="w-3 h-3 fill-white" />
                    {t("native.ideas.playableCta", "Spielen")}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

export default PlayableGamesShelf;
