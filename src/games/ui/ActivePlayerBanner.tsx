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
import { motion, AnimatePresence } from "framer-motion";
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
    <AnimatePresence mode="wait">
      {!hidden && (
        <motion.div
          key={playerName}
          className="w-full flex items-center justify-center gap-3 py-3 px-4"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={spring.snappy}
        >
          {/* Avatar */}
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{
              backgroundColor: playerColor,
              boxShadow: `0 0 20px ${playerColor}66, 0 0 40px ${playerColor}22`,
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {playerAvatar || initials}
          </motion.div>

          {/* Name + subtitle */}
          <div className="text-center min-w-0">
            <motion.p
              className="text-xl font-display font-bold text-foreground truncate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, ...spring.soft }}
            >
              {playerName}
            </motion.p>
            <motion.p
              className="text-sm text-muted-foreground font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle || t("native.games.isUp", "ist dran! 🎯")}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
