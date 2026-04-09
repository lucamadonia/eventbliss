/**
 * IdeasScreen — native "Ideas" tab. Epic design matching HomeScreen/GamesScreen.
 *
 * Features:
 *   - Hero section with animated gradient + floating orbs
 *   - Horizontal chip filters (Games / Themes toggle + category chips)
 *   - Games: 147 items from games-library.ts rendered as native cards
 *   - Themes: 56 items from theme-ideas-library.ts with color palette previews
 *   - Search, category filter, staggered reveal
 *
 * Desktop IdeasHub stays unchanged — this is native-only.
 */
import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Star,
  Gamepad2,
  Palette,
  Search,
  Users,
  Clock,
  Flame,
  Heart,
  Baby,
  MapPin,
  Trophy,
  PartyPopper,
  Shuffle,
  ChevronRight,
} from "lucide-react";
import { gamesLibrary, type GameItem, type GameCategory } from "@/lib/games-library";
import { themeIdeas, type ThemeItem, type ThemeCategory } from "@/lib/theme-ideas-library";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Tab = "games" | "themes";

const GAME_CATS: { id: GameCategory | "all"; label: string; icon: typeof Flame }[] = [
  { id: "all", label: "Alle", icon: Sparkles },
  { id: "party_games", label: "Party", icon: PartyPopper },
  { id: "jga_games", label: "JGA", icon: Heart },
  { id: "outdoor_games", label: "Outdoor", icon: MapPin },
  { id: "team_games", label: "Team", icon: Users },
  { id: "icebreaker", label: "Icebreaker", icon: Flame },
  { id: "family_games", label: "Familie", icon: Baby },
  { id: "wedding_games", label: "Hochzeit", icon: Heart },
];

const THEME_CATS: { id: ThemeCategory | "all"; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "retro", label: "Retro" },
  { id: "elegant", label: "Elegant" },
  { id: "casual", label: "Casual" },
  { id: "adventure", label: "Abenteuer" },
  { id: "seasonal", label: "Saison" },
  { id: "costume", label: "Kostüm" },
  { id: "relaxation", label: "Wellness" },
];

const difficultyColor = { easy: "text-emerald-400", medium: "text-amber-400", hard: "text-red-400" };
const difficultyLabel = { easy: "Leicht", medium: "Mittel", hard: "Schwer" };

export default function IdeasScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [tab, setTab] = useState<Tab>("games");
  const [query, setQuery] = useState("");
  const [gameCat, setGameCat] = useState<GameCategory | "all">("all");
  const [themeCat, setThemeCat] = useState<ThemeCategory | "all">("all");

  const filteredGames = useMemo(() => {
    let result = gamesLibrary;
    if (gameCat !== "all") result = result.filter((g) => g.categories.includes(gameCat));
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (g) =>
          t(g.nameKey).toLowerCase().includes(q) ||
          t(g.descriptionKey).toLowerCase().includes(q) ||
          g.tags.some((tag) => tag.includes(q))
      );
    }
    return result;
  }, [gameCat, query, t]);

  const filteredThemes = useMemo(() => {
    let result = themeIdeas;
    if (themeCat !== "all") result = result.filter((th) => th.category === themeCat);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (th) =>
          t(th.nameKey).toLowerCase().includes(q) ||
          t(th.descriptionKey).toLowerCase().includes(q)
      );
    }
    return result;
  }, [themeCat, query, t]);

  const shuffleGames = useCallback(() => {
    haptics.light();
    setGameCat("all");
    setQuery("");
  }, [haptics]);

  const switchTab = (next: Tab) => {
    haptics.select();
    setTab(next);
    setQuery("");
  };

  return (
    <div className="relative h-full overflow-y-auto native-scroll bg-background safe-top pb-tabbar">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <motion.div
          className="absolute top-0 right-0 w-[120%] h-[50vh] -translate-y-1/4 translate-x-1/4 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(245, 158, 11, 0.2), transparent 60%)" }}
          animate={{ x: ["10%", "-5%", "10%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-[100%] h-[40vh] -translate-x-1/4 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent 60%)" }}
          animate={{ x: ["-10%", "5%", "-10%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header — scrolls with content */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          <p className="text-sm text-amber-400 font-semibold uppercase tracking-wider">Inspiration</p>
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mt-1 leading-tight">
          Ideen, die{" "}
          <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-pink-400 bg-clip-text text-transparent">
            begeistern
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          147 Spiele · 56 Themen · Für jeden Anlass
        </p>
      </div>

      {/* Tab toggle */}
      <div className="px-5 mb-3">
        <div className="relative flex gap-1 p-1 rounded-2xl bg-foreground/5 border border-border">
          {(["games", "themes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="relative flex-1 h-10 text-sm font-medium z-10 text-foreground/80 flex items-center justify-center gap-1.5"
            >
              {tab === t && (
                <motion.div
                  layoutId="ideas-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500"
                  transition={spring.snappy}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {t === "games" ? <Gamepad2 className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                {t === "games" ? `Spiele (${filteredGames.length})` : `Themen (${filteredThemes.length})`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder={tab === "games" ? "Spiel suchen..." : "Thema suchen..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-2xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5">
          {(tab === "games" ? GAME_CATS : THEME_CATS).map((c) => {
            const active = tab === "games" ? gameCat === c.id : themeCat === c.id;
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  haptics.select();
                  if (tab === "games") setGameCat(c.id as GameCategory | "all");
                  else setThemeCat(c.id as ThemeCategory | "all");
                }}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-3.5 h-8 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary text-white border-primary shadow-[0_0_16px_rgba(139,92,246,0.4)]"
                    : "bg-foreground/5 text-muted-foreground border-border"
                )}
              >
                {c.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content — inline in the same scroll container */}
      <div>
        <AnimatePresence mode="wait">
          {tab === "games" ? (
            <motion.div
              key="games"
              className="px-5 pt-1 space-y-3"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {filteredGames.slice(0, 50).map((game) => (
                <GameItemCard key={game.id} game={game} t={t} haptics={haptics} />
              ))}
              {filteredGames.length > 50 && (
                <p className="text-center text-xs text-muted-foreground/60 py-4">
                  +{filteredGames.length - 50} weitere Spiele
                </p>
              )}
              {filteredGames.length === 0 && <EmptyState text="Keine Spiele gefunden" />}
            </motion.div>
          ) : (
            <motion.div
              key="themes"
              className="px-5 pt-1 grid grid-cols-2 gap-3"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {filteredThemes.slice(0, 40).map((theme) => (
                <ThemeItemCard key={theme.id} theme={theme} t={t} haptics={haptics} />
              ))}
              {filteredThemes.length === 0 && (
                <div className="col-span-2">
                  <EmptyState text="Keine Themen gefunden" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function GameItemCard({
  game,
  t,
  haptics,
}: {
  game: GameItem;
  t: (key: string) => string;
  haptics: ReturnType<typeof import("@/hooks/useHaptics").useHaptics>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      variants={staggerItem}
      className="rounded-2xl overflow-hidden bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border text-left"
    >
      <button
        onClick={() => {
          haptics.light();
          setExpanded((e) => !e);
        }}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          {/* Emoji */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 flex items-center justify-center text-2xl flex-shrink-0">
            {game.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {t(game.nameKey)}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {t(game.descriptionKey)}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {game.groupSize.min}–{game.groupSize.max || "∞"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {game.duration}
              </span>
              <span className={cn("flex items-center gap-1", difficultyColor[game.difficulty])}>
                <Trophy className="w-3 h-3" />
                {difficultyLabel[game.difficulty]}
              </span>
            </div>
          </div>
          <ChevronRight
            className={cn(
              "w-4 h-4 text-muted-foreground/60 transition-transform mt-1 flex-shrink-0",
              expanded && "rotate-90"
            )}
          />
        </div>
      </button>

      {/* Expandable instructions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50">
              <p className="text-sm text-foreground/80 leading-relaxed mt-3 whitespace-pre-line">
                {t(game.instructionsKey)}
              </p>
              {game.materials && game.materials.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Material</p>
                  <div className="flex flex-wrap gap-1">
                    {game.materials.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-full bg-foreground/5 border border-border text-[11px] text-foreground/80">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ThemeItemCard({
  theme,
  t,
  haptics,
}: {
  theme: ThemeItem;
  t: (key: string) => string;
  haptics: ReturnType<typeof import("@/hooks/useHaptics").useHaptics>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.button
      variants={staggerItem}
      onClick={() => {
        haptics.light();
        setExpanded((e) => !e);
      }}
      className="aspect-square rounded-3xl p-3 flex flex-col justify-between items-start text-left bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border relative overflow-hidden"
    >
      {/* Color palette preview */}
      <div className="flex gap-1 w-full">
        {[theme.colorPalette.primary, theme.colorPalette.secondary, theme.colorPalette.accent].map(
          (c, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full"
              style={{ backgroundColor: c }}
            />
          )
        )}
      </div>

      {/* Emoji */}
      <div className="text-4xl mt-2 drop-shadow-[0_0_16px_rgba(255,255,255,0.2)]">
        {theme.emoji}
      </div>

      {/* Info */}
      <div className="mt-auto">
        <p className="text-sm font-display font-bold text-foreground leading-tight">
          {t(theme.nameKey)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
          {t(theme.descriptionKey)}
        </p>
      </div>

      {/* Category badge */}
      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-foreground/[0.08] text-[9px] text-muted-foreground uppercase tracking-wide font-medium">
        {theme.category}
      </span>
    </motion.button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-3">
        <Search className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
