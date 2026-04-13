/**
 * FloatingActionButton — violet gradient FAB above the tab bar.
 * Opens a bottom sheet with quick actions: create event, join, quick game.
 */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Plus, Calendar, Users, Gamepad2, Wifi, LogIn, X } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { useTabBarVisible } from "./BottomTabBar";
import GameRoomSheet from "./GameRoomSheet";

interface Action {
  icon: typeof Calendar;
  label: string;
  path?: string;
  onClick?: () => void;
  color: string;
}

export function FloatingActionButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [roomSheet, setRoomSheet] = useState<"create" | "join" | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const haptics = useHaptics();
  const visible = useTabBarVisible();

  if (!visible) return null;

  const handleToggle = () => {
    haptics.medium();
    setOpen((o) => !o);
  };

  const go = (path: string) => {
    haptics.light();
    setOpen(false);
    setTimeout(() => navigate(path), 120);
  };

  const openRoom = (tab: "create" | "join") => {
    haptics.light();
    setOpen(false);
    setTimeout(() => setRoomSheet(tab), 120);
  };

  // Context-aware actions based on current tab
  const isGamesTab = location.pathname === "/games";

  const actions: Action[] = [
    { icon: Calendar, label: t("nativeFab.createEvent"), path: "/create", color: "from-violet-500 to-fuchsia-500" },
    { icon: Users, label: t("nativeFab.joinEvent"), path: "/join", color: "from-cyan-500 to-teal-500" },
    { icon: Wifi, label: t("nativeFab.createRoom"), onClick: () => openRoom("create"), color: "from-emerald-500 to-green-500" },
    { icon: LogIn, label: t("nativeFab.joinRoom"), path: "/join-room", color: "from-sky-500 to-blue-500" },
    ...(isGamesTab ? [] : [{ icon: Gamepad2, label: t("nativeFab.quickGame"), path: "/games", color: "from-amber-500 to-pink-500" } as Action]),
  ];

  return (
    <>
      {/* Backdrop when open */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleToggle}
          />
        )}
      </AnimatePresence>

      {/* FAB + action stack */}
      <div className="fixed z-50 right-5 pointer-events-none" style={{ bottom: "calc(86px + env(safe-area-inset-bottom))" }}>
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex flex-col items-end gap-3 mb-4 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {actions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.button
                    key={a.label}
                    onClick={() => a.onClick ? a.onClick() : a.path && go(a.path)}
                    className="flex items-center gap-3"
                    initial={{ x: 40, opacity: 0, scale: 0.8 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 40, opacity: 0, scale: 0.8 }}
                    transition={{ ...spring.bouncy, delay: i * 0.05 }}
                  >
                    <span className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-border text-sm text-foreground font-medium whitespace-nowrap shadow-lg">
                      {a.label}
                    </span>
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleToggle}
          className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center border border-white/20"
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={spring.snappy}
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </motion.button>
      </div>

      {/* Game Room bottom sheet */}
      <GameRoomSheet
        open={roomSheet !== null}
        onOpenChange={(o) => !o && setRoomSheet(null)}
        initialTab={roomSheet || "create"}
      />
    </>
  );
}
