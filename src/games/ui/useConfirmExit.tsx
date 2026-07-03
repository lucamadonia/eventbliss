/**
 * useConfirmExit + ConfirmExitDialog — a shared "Spiel verlassen?" guard so an
 * accidental tap on a game's in-game back button never drops the player
 * straight out to the games list, losing the whole round.
 *
 * Usage in a game:
 *   const navigate = useNavigate();
 *   const exit = useConfirmExit(() => navigate('/games'));
 *   // in-game (active play) back button:  onClick={exit.request}
 *   // setup / final-results back button:  onClick={() => navigate('/games')}  (direct, nothing to lose)
 *   // render once:  <ConfirmExitDialog {...exit.dialogProps} accent="#df8eff" />
 */
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function useConfirmExit(onExit: () => void) {
  const [open, setOpen] = useState(false);
  const request = useCallback(() => setOpen(true), []);
  const cancel = useCallback(() => setOpen(false), []);
  const confirm = useCallback(() => {
    setOpen(false);
    onExit();
  }, [onExit]);
  return { open, request, cancel, confirm, dialogProps: { open, onStay: cancel, onLeave: confirm } };
}

interface ConfirmExitDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  /** Accent for the primary "keep playing" button — pass the game's palette. */
  accent?: string;
  title?: string;
  subtitle?: string;
}

export function ConfirmExitDialog({
  open,
  onStay,
  onLeave,
  accent = "#df8eff",
  title,
  subtitle,
}: ConfirmExitDialogProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)" }}
          onClick={onStay}
        >
          <motion.div
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-3xl p-5 text-center"
            style={{ background: "#151a21", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p className="text-base font-bold mb-1 text-white">
              {title ?? t("games.common.leaveTitle", "Spiel verlassen?")}
            </p>
            <p className="text-xs mb-4 text-white/50">
              {subtitle ?? t("games.common.leaveSub", "Der aktuelle Spielstand geht dabei verloren.")}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={onStay}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{ background: accent, color: "#0a0e14" }}
              >
                {t("games.common.leaveStay", "Weiterspielen")}
              </button>
              <button
                onClick={onLeave}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white/60"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {t("games.common.leaveConfirm", "Verlassen")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
