/**
 * PartyFinaleOverlay — der Abschluss des Abends.
 *
 * Aus `PartyLobbyScreen` herausgeloest: Die Lobby hat inzwischen Set-Liste,
 * Tabelle und Historie zu tragen und soll nicht zusaetzlich die Zeremonie
 * enthalten (Dateien bleiben unter 500 Zeilen).
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { NativeOverlayPortal } from "@/components/native/NativeOverlayPortal";
import { ConfettiBurst } from "@/components/vfx/ConfettiBurst";
import type { PartyStanding } from "@/games/tv/party-types";
import { spring } from "@/lib/motion";

import { PartyStandingsList } from "./PartyStandingsList";

export interface PartyFinaleOverlayProps {
  open: boolean;
  standings: PartyStanding[];
  gamesPlayed: number;
  playerCount: number;
  onDone: () => void;
}

export function PartyFinaleOverlay({
  open,
  standings,
  gamesPlayed,
  playerCount,
  onDone,
}: PartyFinaleOverlayProps) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    setConfetti(open && !reduce);
  }, [open, reduce]);

  return (
    <NativeOverlayPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <ConfettiBurst active={confetti} count={44} onComplete={() => setConfetti(false)} />

            <motion.div
              className="w-full max-w-sm space-y-6 max-h-[86vh] overflow-y-auto native-scroll"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduce ? { duration: 0.15 } : spring.bouncy}
            >
              <motion.div
                className="flex justify-center"
                initial={reduce ? false : { scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.15 }}
              >
                <div className="w-20 h-20 rounded-full bg-[#f9ca24]/20 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-amber-500 dark:text-[#f9ca24]" aria-hidden />
                </div>
              </motion.div>

              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {t("nativeExtra.partyOver")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("nativeExtra.partyLobby.finalSummary", {
                    games: gamesPlayed,
                    players: playerCount,
                  })}
                </p>
              </div>

              <PartyStandingsList standings={standings} />

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onDone}
                className="cursor-pointer w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white font-bold text-base shadow-[0_0_25px_rgba(223,142,255,0.3)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...spring.snappy, delay: reduce ? 0 : 0.5 }}
              >
                {t("nativeExtra.partyLobby.done")}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </NativeOverlayPortal>
  );
}
