/**
 * ActivePlayerBanner — prominent "whose turn" indicator for mobile.
 *
 * Shows the active player's avatar, name, and a localized subtitle
 * with a slide-in animation + haptic on player change.
 *
 * Usage:
 *   <ActivePlayerBanner
 *     playerName="Tim"
 *     playerColor="#df8eff"
 *     playerAvatar="🎉"
 *   />
 */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useTranslation } from "react-i18next";
import { haptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";

interface Props {
  playerName: string;
  playerColor?: string;
  playerAvatar?: string;
  /** Optional subtitle override (default: "ist dran!" / "is up!") */
  subtitle?: string;
  /** Hide the banner (e.g., during result screens) */
  hidden?: boolean;
}

export function ActivePlayerBanner({
  playerName,
  playerColor = "#df8eff",
  playerAvatar,
  subtitle,
  hidden = false,
}: Props) {
  const { t } = useTranslation();
  const prevNameRef = useRef(playerName);

  // Haptic on player change
  useEffect(() => {
    if (playerName !== prevNameRef.current) {
      haptics.select();
      prevNameRef.current = playerName;
    }
  }, [playerName]);

  const initials = playerName.slice(0, 1).toUpperCase();

  return (
    <MotionConfig reducedMotion="user"><AnimatePresence mode="wait">
      {!hidden && (
        <motion.div
          key={playerName}
          className="w-full flex items-center gap-3 py-3 px-4"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={spring.snappy}
        >
          {/* Avatar */}
          <motion.div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
            style={{
              backgroundColor: `${playerColor}20`,
              color: playerColor,
              border: `1px solid ${playerColor}50`,
            }}
          >
            {playerAvatar || initials}
          </motion.div>

          {/* Name + subtitle */}
          <div className="text-left min-w-0">
            <motion.p
              className="text-lg font-display font-bold text-white truncate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, ...spring.soft }}
            >
              {playerName}
            </motion.p>
            <motion.p
              className="text-sm text-white/70 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle || t("native.games.isUp")}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence></MotionConfig>
  );
}
