/**
 * DrinkTrackerScreen — Party-Modus 18+ Drink-Tracker.
 *
 * Shows session stats, all-time counter, and fun achievements.
 * Only accessible when Party-Modus is activated.
 *
 * Epic amber/gold design with motion effects.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beer,
  Trophy,
  Flame,
  RotateCcw,
  TrendingUp,
  Clock,
  Users,
  Droplets,
} from "lucide-react";
import { useDrinkingMode } from "@/hooks/useDrinkingMode";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { MobileHeader } from "@/components/native/MobileHeader";
import { cn } from "@/lib/utils";

// Fun rank titles based on total drinks
function getRank(total: number): { title: string; emoji: string; color: string } {
  if (total >= 100) return { title: "Legende", emoji: "👑", color: "from-yellow-400 to-amber-500" };
  if (total >= 75) return { title: "Champion", emoji: "🏆", color: "from-amber-400 to-orange-500" };
  if (total >= 50) return { title: "Party-Tier", emoji: "🦁", color: "from-orange-400 to-red-500" };
  if (total >= 30) return { title: "Profi", emoji: "🎯", color: "from-violet-400 to-fuchsia-500" };
  if (total >= 15) return { title: "Enthusiast", emoji: "🔥", color: "from-pink-400 to-rose-500" };
  if (total >= 5) return { title: "Einsteiger", emoji: "🌱", color: "from-emerald-400 to-teal-500" };
  return { title: "Nüchtern", emoji: "😇", color: "from-sky-400 to-blue-500" };
}

// Get session start time
function getSessionStart(): string | null {
  try { return localStorage.getItem("eventbliss.drinkSession"); }
  catch { return null; }
}

// Get total all-time drinks
function getAllTimeDrinks(): number {
  try { return parseInt(localStorage.getItem("eventbliss.drinkAllTime") || "0", 10); }
  catch { return 0; }
}

export default function DrinkTrackerScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const drinkingMode = useDrinkingMode();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [allTime, setAllTime] = useState(getAllTimeDrinks());

  const sessionStart = getSessionStart();
  const sessionDuration = sessionStart
    ? Math.floor((Date.now() - new Date(sessionStart).getTime()) / 60000)
    : 0;
  const sessionHours = Math.floor(sessionDuration / 60);
  const sessionMins = sessionDuration % 60;

  const rank = getRank(drinkingMode.drinkCount);

  // Sync all-time on mount
  useEffect(() => {
    try {
      const current = parseInt(localStorage.getItem("eventbliss.drinkAllTime") || "0", 10);
      setAllTime(current);
    } catch { /* */ }
  }, [drinkingMode.drinkCount]);

  const handleReset = () => {
    haptics.medium();
    // Save current session to all-time before reset
    try {
      const current = parseInt(localStorage.getItem("eventbliss.drinkAllTime") || "0", 10);
      localStorage.setItem("eventbliss.drinkAllTime", String(current + drinkingMode.drinkCount));
      setAllTime(current + drinkingMode.drinkCount);
    } catch { /* */ }
    drinkingMode.resetSession();
    setShowResetConfirm(false);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <MobileHeader title="🍺 Party Stats" showBack />

      <div className="flex-1 overflow-y-auto native-scroll overflow-x-hidden px-5 pb-8">
        {/* Hero — current rank */}
        <motion.div
          className="relative mt-4 mb-6 rounded-3xl overflow-hidden p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
        >
          {/* Gradient bg */}
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", rank.color)} />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

          <div className="relative">
            <motion.div
              className="text-7xl mb-3"
              animate={{ rotate: [0, -5, 5, -3, 3, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ filter: "drop-shadow(0 0 20px rgba(245,158,11,0.5))" }}
            >
              {rank.emoji}
            </motion.div>
            <h2 className={cn(
              "text-2xl font-display font-black bg-gradient-to-r bg-clip-text text-transparent",
              rank.color
            )}>
              {rank.title}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Dein Party-Rang heute Abend
            </p>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-6"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {/* Session drinks */}
          <motion.div
            variants={staggerItem}
            className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-400/20 text-center"
          >
            <motion.p
              className="text-4xl font-display font-black text-amber-400"
              key={drinkingMode.drinkCount}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.bouncy}
            >
              {drinkingMode.drinkCount}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              🍺 Heute
            </p>
          </motion.div>

          {/* All-time */}
          <motion.div
            variants={staggerItem}
            className="rounded-2xl p-4 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border border-violet-400/20 text-center"
          >
            <p className="text-4xl font-display font-black text-violet-400">
              {allTime + drinkingMode.drinkCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              🏆 Gesamt
            </p>
          </motion.div>

          {/* Session duration */}
          <motion.div
            variants={staggerItem}
            className="rounded-2xl p-4 bg-gradient-to-br from-cyan-500/15 to-teal-500/10 border border-cyan-400/20 text-center"
          >
            <p className="text-2xl font-display font-bold text-cyan-400">
              {sessionHours > 0 ? `${sessionHours}h ${sessionMins}m` : `${sessionMins}m`}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              ⏱️ Session-Dauer
            </p>
          </motion.div>

          {/* Average pace */}
          <motion.div
            variants={staggerItem}
            className="rounded-2xl p-4 bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-400/20 text-center"
          >
            <p className="text-2xl font-display font-bold text-pink-400">
              {sessionDuration > 0
                ? `${(drinkingMode.drinkCount / Math.max(sessionDuration / 60, 0.1)).toFixed(1)}/h`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              📊 Runden/Stunde
            </p>
          </motion.div>
        </motion.div>

        {/* Progress to next rank */}
        <motion.div
          className="rounded-2xl p-4 bg-foreground/[0.04] border border-border mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Nächster Rang</span>
          </div>
          {(() => {
            const thresholds = [5, 15, 30, 50, 75, 100];
            const next = thresholds.find(t => t > drinkingMode.drinkCount) || 100;
            const prev = thresholds.filter(t => t <= drinkingMode.drinkCount).pop() || 0;
            const progress = ((drinkingMode.drinkCount - prev) / (next - prev)) * 100;
            const nextRank = getRank(next);
            return (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{rank.emoji} {rank.title}</span>
                  <span>{nextRank.emoji} {nextRank.title} ({next})</span>
                </div>
                <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-r", rank.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </>
            );
          })()}
        </motion.div>

        {/* Hydration reminder */}
        <motion.div
          className="rounded-2xl p-4 bg-sky-500/10 border border-sky-400/20 flex items-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Droplets className="w-8 h-8 text-sky-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Wasser nicht vergessen!</p>
            <p className="text-xs text-muted-foreground">
              Pro Drink mindestens ein Glas Wasser trinken. Euer Körper dankt's euch morgen. 💧
            </p>
          </div>
        </motion.div>

        {/* Reset session */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {!showResetConfirm ? (
            <button
              onClick={() => { haptics.light(); setShowResetConfirm(true); }}
              className="text-sm text-muted-foreground/60 underline underline-offset-2"
            >
              Session zurücksetzen
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex gap-3"
            >
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-400 text-sm font-semibold"
              >
                Ja, zurücksetzen
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-foreground/5 border border-border text-muted-foreground text-sm"
              >
                Abbrechen
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
