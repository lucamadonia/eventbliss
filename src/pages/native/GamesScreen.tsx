/**
 * GamesScreen — native "Play" tab. The fun factor.
 * Uses REAL game thumbnails from /images/games/{id}.webp paired with
 * canonical game IDs that match the /games/:gameId router.
 *
 * The playable-games registry is shared via @/lib/playable-games so the
 * "Play" tab, the Ideas highlight shelf and party mode never drift apart.
 */
import { useCallback, useMemo, useState } from "react";
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
  PartyPopper,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { playableGames, GAME_BADGE_KEY, type PlayableGame } from "@/lib/playable-games";
import { PartyResumeBanner } from "@/components/native/party/PartyResumeBanner";
import { usePartyResumeState } from "@/components/native/party/usePartyResume";
import { usePartySession } from "@/hooks/usePartySession";

type Category = "alle" | "party" | "quiz" | "wort" | "karte" | "reaktion" | "social" | "kreativ";

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
  const party = usePartySession();
  // Genau EIN Aufrufer — der Ausblend-Zustand lebt in diesem Hook.
  const partyResume = usePartyResumeState();

  /** Die unterbrochene Set-Liste beim faelligen Spiel fortsetzen. */
  const handleResumeParty = useCallback(
    (gameId: string) => {
      haptics.medium();
      party.startGame(gameId);
      // `?party=true` schickt den Zurueck-Weg in die Party-Lobby.
      navigate(`/games/${gameId}?party=true`);
    },
    [party, haptics, navigate]
  );

  const filtered = useMemo(
    () =>
      category === "alle"
        ? playableGames
        : playableGames.filter((g) => (g.categories as string[]).includes(category)),
    [category]
  );

  const playGame = (game: PlayableGame) => {
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

      {/* Party Mode CTA — bei laufender Set-Liste wird derselbe Platz zum
          Fortsetzen-Hinweis; es kommt KEIN zweites Element dazu. */}
      <div className="px-5 pb-3">
        {partyResume.visible && partyResume.gameId ? (
          <PartyResumeBanner
            gameId={partyResume.gameId}
            onResume={handleResumeParty}
            onDismiss={partyResume.dismiss}
            onOpenLobby={() => { haptics.light(); navigate("/party"); }}
          />
        ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptics.medium();
            navigate("/party");
          }}
          className="w-full relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#df8eff]/15 via-[#ff6b98]/10 to-[#f9ca24]/15 border border-[#df8eff]/25 flex items-center gap-3 text-left group"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#df8eff] to-[#ff6b98] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(223,142,255,0.3)]">
            <PartyPopper className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('nativeExtra.startParty')}</p>
            <p className="text-[11px] text-muted-foreground">{t('nativeExtra.startPartySub')}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-active:translate-x-0.5 transition-transform" />
          {/* Ambient shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
        </motion.button>
        )}
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
                      {t(GAME_BADGE_KEY[game.badge])}
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
