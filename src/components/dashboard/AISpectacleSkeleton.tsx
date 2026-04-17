import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

/**
 * Loading placeholder that mirrors the structure of EpicNarrativeResponse —
 * a hero strip and 3 timeline day cards, each with a shimmer overlay. Used
 * while the AI is generating a response.
 */
interface AISpectacleSkeletonProps {
  variant?: "narrative" | "quick";
  message?: string;
}

export default function AISpectacleSkeleton({
  variant = "narrative",
  message,
}: AISpectacleSkeletonProps) {
  const { t } = useTranslation();
  const cardCount = variant === "narrative" ? 4 : 2;

  return (
    <div className="space-y-4">
      {/* Hero skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 p-5 md:p-7 bg-gradient-to-br from-purple-600/15 via-pink-600/10 to-amber-500/10"
      >
        <div className="liquid-shimmer absolute inset-0 rounded-2xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/40">
            <motion.div
              animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded-full bg-white/15" />
            <div className="h-5 w-3/4 rounded-full bg-white/20" />
          </div>
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold text-white/80"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            {message || t("dashboard.ai.thinking", "Claude plant deinen Tag …")}
          </motion.div>
        </div>
        <div className="relative mt-5 flex gap-2">
          <div className="h-6 w-24 rounded-full bg-white/10" />
          <div className="h-6 w-32 rounded-full bg-white/10" />
          <div className="h-6 w-20 rounded-full bg-white/10 hidden sm:block" />
        </div>
      </motion.div>

      {/* Timeline section cards */}
      <div className="relative space-y-4 sm:pl-8">
        <div className="absolute left-[15px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-purple-600/40 via-indigo-500/40 to-cyan-500/0 hidden sm:block" />
        {Array.from({ length: cardCount }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
            className="relative"
          >
            {/* Timeline dot */}
            <div className="absolute -left-3 sm:-left-4 top-6 z-10 hidden sm:flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/40"
              >
                {i + 1}
              </motion.div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-xl">
              <div className="liquid-shimmer absolute inset-0 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500" />
              <div className="relative p-5 md:p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-16 rounded-full bg-white/15" />
                    <div className="h-5 w-3/5 rounded-full bg-white/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-white/10" />
                  <div className="h-3 w-11/12 rounded-full bg-white/10" />
                  <div className="h-3 w-4/5 rounded-full bg-white/10" />
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-5 pt-5 border-t border-white/10">
                  <div className="h-14 rounded-xl bg-white/[0.05]" />
                  <div className="h-14 rounded-xl bg-white/[0.05]" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
