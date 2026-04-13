/**
 * BottomTabBar — iOS/Android-style bottom navigation with 5 tabs.
 * Glassmorphic bg, haptic feedback, hidden on specific routes (games, modals).
 */
import { useMemo } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CalendarHeart, Gamepad2, Store, User } from "lucide-react";
import { spring } from "@/lib/motion";
import { TabItem } from "./TabItem";

export interface Tab {
  to: string;
  labelKey: string;
  icon: typeof Sparkles;
  matchPrefix?: string;
}

export const TABS: Tab[] = [
  { to: "/", labelKey: "nativeTabs.home", icon: Sparkles },
  { to: "/my-events", labelKey: "nativeTabs.events", icon: CalendarHeart, matchPrefix: "/my-events" },
  { to: "/games", labelKey: "nativeTabs.play", icon: Gamepad2, matchPrefix: "/games" },
  { to: "/marketplace", labelKey: "nativeTabs.market", icon: Store, matchPrefix: "/marketplace" },
  { to: "/profile", labelKey: "nativeTabs.profile", icon: User, matchPrefix: "/profile" },
];

// Routes where the tab bar should be hidden (deep screens, modals, games).
const HIDDEN_PATTERNS = [
  "/auth",
  "/create",
  "/join",
  "/danke",
  "/premium",
  "/tv",
  "/tv/:roomCode",
  "/e/:slug",
  "/e/:slug/dashboard",
  "/e/:slug/expenses",
  "/e/:slug/claim/:token",
  "/client/:token",
  "/games/:gameId",
  "/admin/*",
  "/legal/*",
  "/partner-portal",
  "/partner-apply",
  "/agency",
  "/agency-portal",
  "/agency-apply",
  "/marketplace/service/:slug",
  "/marketplace/agency/:slug",
];

export function useTabBarVisible(): boolean {
  const location = useLocation();
  return useMemo(() => {
    // /games (exact) → show tab bar. /games/:gameId → hide.
    if (location.pathname === "/games") return true;
    return !HIDDEN_PATTERNS.some((pattern) =>
      matchPath({ path: pattern, end: true }, location.pathname) ||
      (pattern.endsWith("/*") && location.pathname.startsWith(pattern.slice(0, -2)))
    );
  }, [location.pathname]);
}

export function BottomTabBar() {
  const location = useLocation();
  const visible = useTabBarVisible();

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={spring.soft}
        >
          <div className="pointer-events-auto mx-3 mb-3 safe-bottom">
            <div className="relative flex items-center justify-around h-[64px] rounded-[28px] bg-background/70 backdrop-blur-2xl border border-border shadow-[0_-8px_32px_rgba(0,0,0,0.4)] px-2">
              {/* Ambient glow strip at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

              {TABS.map((tab) => {
                const isActive =
                  tab.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(tab.matchPrefix ?? tab.to);
                return <TabItem key={tab.to} tab={tab} active={isActive} />;
              })}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
