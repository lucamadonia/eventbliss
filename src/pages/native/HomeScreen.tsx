/**
 * HomeScreen — native home tab. The app's face on mobile.
 * Ambient FloatingOrbs, typewriter greeting, pull-to-refresh, event carousel.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Calendar,
  Users,
  Gamepad2,
  ArrowRight,
  PartyPopper,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useMyEvents } from "@/hooks/useMyEvents";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { spring, stagger, staggerItem, blissBloom } from "@/lib/motion";
import { FloatingOrbs } from "@/components/vfx/FloatingOrbs";
import { cn } from "@/lib/utils";

function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return displayed;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { events = [], isLoading, refetch } = useMyEvents();
  const haptics = useHaptics();

  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Freund";

  const greetingText = t('native.home.greeting', { name: firstName });
  const typedGreeting = useTypewriter(greetingText, 50);

  const upcoming = events
    .filter((e) => !e.archived_at && !e.deleted_at)
    .slice(0, 5);

  const go = (path: string) => {
    haptics.light();
    navigate(path);
  };

  const { containerRef, PullIndicator } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
  });

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto native-scroll safe-top pb-tabbar"
    >
      {/* Pull indicator */}
      <PullIndicator />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <FloatingOrbs />
      </div>

      {/* Greeting — typewriter */}
      <motion.div
        className="px-5 pt-6 pb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.1 }}
      >
        <p className="text-sm text-muted-foreground font-medium h-5">
          {typedGreeting}
          <motion.span
            className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          />
        </p>
        <h1 className="text-3xl font-display font-bold text-foreground mt-1 tracking-tight leading-tight">
          {t('native.home.heroTitle')} <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            {t('native.home.heroHighlight')}
          </span>
        </h1>
      </motion.div>

      {/* Primary CTA — Create Event */}
      <motion.div
        className="px-5 mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.2 }}
      >
        <motion.button
          onClick={() => go("/create")}
          whileTap={{ scale: 0.97 }}
          transition={spring.snappy}
          className="w-full relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-[0_10px_40px_-8px_rgba(139,92,246,0.5)]"
        >
          {/* Animated sheen */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />
          <div className="relative flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs uppercase tracking-wider text-white/80 font-semibold">
                {t('native.home.newEvent')}
              </p>
              <p className="text-xl font-display font-bold mt-0.5">
                {t('native.home.planParty')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* Secondary actions */}
      <motion.div
        className="px-5 grid grid-cols-2 gap-3 mb-6"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {[
          {
            to: "/join",
            label: t('native.home.joinEvent'),
            icon: Users,
            gradient: "from-cyan-500/20 to-teal-500/10",
            iconColor: "text-cyan-300",
          },
          {
            to: "/games",
            label: t('native.home.games'),
            icon: Gamepad2,
            gradient: "from-amber-500/20 to-orange-500/10",
            iconColor: "text-amber-300",
          },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.to}
              variants={staggerItem}
              onClick={() => go(a.to)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "rounded-2xl p-4 bg-gradient-to-br backdrop-blur border border-border text-left",
                a.gradient
              )}
            >
              <Icon className={cn("w-6 h-6 mb-2", a.iconColor)} />
              <p className="text-sm font-semibold text-foreground">{a.label}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Your events */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-primary" />
            {t('native.home.yourEvents')}
          </h2>
          {upcoming.length > 0 && (
            <button
              onClick={() => go("/my-events")}
              className="text-xs text-muted-foreground font-medium flex items-center gap-0.5"
            >
              {t('native.home.allEvents')}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-64 h-[140px] rounded-2xl native-skeleton" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="mx-5 rounded-2xl p-6 border border-dashed border-border bg-foreground/5 text-center">
            <Sparkles className="w-8 h-8 text-primary/60 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('native.home.noEventsYet')}
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
            {upcoming.map((event, i) => (
              <motion.button
                key={event.id}
                variants={blissBloom}
                initial="initial"
                animate="animate"
                transition={{ ...spring.soft, delay: 0.1 * i }}
                onClick={() => go(`/e/${event.slug}/dashboard`)}
                whileTap={{ scale: 0.97 }}
                className="flex-shrink-0 w-64 rounded-2xl p-4 bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 flex items-center justify-center">
                    <PartyPopper className="w-5 h-5 text-violet-200" />
                  </div>
                  {event.event_date && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                      {new Date(event.event_date).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-base font-semibold text-foreground truncate">
                  {event.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {event.honoree_name || event.event_type}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {event.participant_count} {t('native.home.participants')}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Play now */}
      <motion.div
        className="px-5 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...spring.soft }}
      >
        <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2 mb-3">
          <Gamepad2 className="w-5 h-5 text-accent" />
          {t('native.home.playNow')}
        </h2>
        <motion.button
          onClick={() => go("/games")}
          whileTap={{ scale: 0.98 }}
          className="w-full relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-cyan-600/30 via-teal-600/20 to-emerald-600/20 border border-border text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-cyan-300/80 font-semibold">
                {t('native.home.partyGamesCount')}
              </p>
              <p className="text-lg font-display font-bold text-foreground">
                {t('native.home.partyGamesSubtitle')}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </motion.button>
      </motion.div>

      {/* Ideas shortcut */}
      <motion.div
        className="px-5 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ...spring.soft }}
      >
        <motion.button
          onClick={() => go("/ideas")}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl p-4 bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-border flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t('native.home.findInspiration')}</p>
            <p className="text-xs text-muted-foreground">{t('native.home.findInspirationSub')}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      </motion.div>
    </div>
  );
}
