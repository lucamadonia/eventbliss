/**
 * GameRulesModal — Epic, animated rules overlay for all 17 games.
 * Glassmorphism design, spring animations, auto-show on first play.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { HelpCircle, Lightbulb, Sparkles, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GAME_ICONS: Record<string, string> = {
  bomb: "💣", taboo: "🚫", headup: "🧠", category: "⏱️",
  emojiguess: "😀", fakeorfact: "🎲", truthdare: "❤️",
  thisorthat: "↔️", whoami: "❓", bottlespin: "🍾",
  storybuilder: "📖", sharedquiz: "🔗", quickdraw: "🎨",
  splitquiz: "🧩", hochstapler: "🎭", "wo-ist-was": "🗺️",
  flaschendrehen: "🍾", "drueck-das-wort": "🔤",
  "wer-bin-ich": "❓", "emoji-raten": "😀", "fake-or-fact": "🎲",
  "this-or-that": "↔️", "wahrheit-pflicht": "❤️",
  "story-builder": "📖", "geteilt-gequizzt": "🔗",
  "schnellzeichner": "🎨", "split-quiz": "🧩",
  "wo-ist-was": "🗺️",
};

const GAME_GRADIENTS: Record<string, string> = {
  bomb: "from-red-500 to-orange-500", taboo: "from-violet-500 to-purple-500",
  headup: "from-cyan-500 to-blue-500", category: "from-amber-500 to-yellow-500",
  emojiguess: "from-emerald-500 to-teal-500", fakeorfact: "from-blue-500 to-indigo-500",
  truthdare: "from-pink-500 to-rose-500", thisorthat: "from-sky-500 to-cyan-500",
  whoami: "from-fuchsia-500 to-pink-500", bottlespin: "from-green-500 to-emerald-500",
  storybuilder: "from-indigo-500 to-violet-500", sharedquiz: "from-teal-500 to-green-500",
  quickdraw: "from-orange-500 to-red-500", splitquiz: "from-purple-500 to-indigo-500",
  hochstapler: "from-slate-500 to-zinc-600", "wo-ist-was": "from-lime-500 to-green-500",
  flaschendrehen: "from-green-500 to-emerald-500",
};

const STEP_COLORS = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
];

function normalizeGameId(id: string): string {
  const map: Record<string, string> = {
    "drueck-das-wort": "drueck-das-wort",
    "wer-bin-ich": "whoami", "emoji-raten": "emojiguess",
    "fake-or-fact": "fakeorfact", "this-or-that": "thisorthat",
    "wahrheit-pflicht": "truthdare", "story-builder": "storybuilder",
    "geteilt-gequizzt": "sharedquiz", "schnellzeichner": "quickdraw",
    "split-quiz": "splitquiz",
  };
  return map[id] || id;
}

interface GameRulesModalProps {
  gameId: string;
  open: boolean;
  onClose: () => void;
}

export function GameRulesModal({ gameId, open, onClose }: GameRulesModalProps) {
  const { t } = useTranslation();
  const nid = normalizeGameId(gameId);
  const icon = GAME_ICONS[gameId] || GAME_ICONS[nid] || "🎮";
  const gradient = GAME_GRADIENTS[nid] || "from-violet-500 to-fuchsia-500";

  const title = t(`gameRules.${nid}.title`, "");
  const tagline = t(`gameRules.${nid}.tagline`, "");
  const tip = t(`gameRules.${nid}.tip`, "");

  // Steps are stored as step1, step2, step3, step4, step5
  const steps: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const s = t(`gameRules.${nid}.step${i}`, "");
    if (s) steps.push(s);
  }

  if (!title && !steps.length) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-[#0d0f14]/95 border border-white/10 shadow-[0_0_80px_rgba(139,92,246,0.15)]"
            initial={{ scale: 0.8, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Ambient glow */}
            <div className={cn("absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br", gradient)} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            <div className="relative p-6 space-y-5">
              {/* Header — Icon + Title + Tagline */}
              <motion.div
                className="text-center space-y-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className={cn("w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br flex items-center justify-center text-4xl shadow-lg", gradient)}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.15 }}
                >
                  {icon}
                </motion.div>
                <h2 className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
                  {title}
                </h2>
                {tagline && (
                  <p className="text-sm text-white/50 font-['Be_Vietnam_Pro'] max-w-xs mx-auto leading-relaxed">
                    {tagline}
                  </p>
                )}
              </motion.div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Steps */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold text-center">
                  {t("gameRules.howToPlay", "So geht's")}
                </p>
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-xs font-black text-white shadow-lg shrink-0", STEP_COLORS[i % STEP_COLORS.length])}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-white/80 font-['Be_Vietnam_Pro'] leading-relaxed pt-1">
                      {step}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Pro Tip */}
              {tip && (
                <motion.div
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20"
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-0.5">Pro-Tipp</p>
                    <p className="text-xs text-amber-200/80 font-['Be_Vietnam_Pro'] leading-relaxed">{tip}</p>
                  </div>
                </motion.div>
              )}

              {/* CTA Button */}
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r",
                  gradient,
                )}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Sparkles className="w-4 h-4" />
                {t("gameRules.understood", "Verstanden — los geht's!")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook: auto-show rules on first play of each game.
 * sessionStorage is only set when the modal is CLOSED (not on open).
 */
export function useAutoShowRules(gameId: string) {
  const nid = normalizeGameId(gameId);
  const key = `eb.rules-seen.${nid}`;

  // Check synchronously if we should auto-show
  const shouldAutoShow = (() => {
    if (!nid) return false;
    try { return !sessionStorage.getItem(key); } catch { return false; }
  })();

  const [show, setShow] = useState(shouldAutoShow);

  return {
    showRules: show,
    openRules: () => setShow(true),
    closeRules: () => {
      setShow(false);
      try { sessionStorage.setItem(key, "1"); } catch { /* private mode */ }
    },
  };
}

/**
 * Small help button to open rules.
 */
export function RulesHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
      title="Spielregeln"
    >
      <HelpCircle className="w-4 h-4 text-white/50" />
    </motion.button>
  );
}
