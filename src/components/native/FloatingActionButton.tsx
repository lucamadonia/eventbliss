/**
 * FloatingActionButton — violet gradient FAB above the tab bar.
 * Opens a bottom sheet with quick actions: create event, join, quick game.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Users, Gamepad2, X } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { useTabBarVisible } from "./BottomTabBar";

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
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

  const actions = [
    { icon: Calendar, label: "Event erstellen", path: "/create", color: "from-violet-500 to-fuchsia-500" },
    { icon: Users, label: "Event beitreten", path: "/join", color: "from-cyan-500 to-teal-500" },
    { icon: Gamepad2, label: "Quick Game", path: "/games", color: "from-amber-500 to-pink-500" },
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
                    key={a.path}
                    onClick={() => go(a.path)}
                    className="flex items-center gap-3"
                    initial={{ x: 40, opacity: 0, scale: 0.8 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 40, opacity: 0, scale: 0.8 }}
                    transition={{ ...spring.bouncy, delay: i * 0.05 }}
                  >
                    <span className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-white/10 text-sm text-white font-medium whitespace-nowrap shadow-lg">
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
    </>
  );
}
