/**
 * ScreenFlash — full-screen color flash overlay.
 * Use for correct/wrong answers, celebrations.
 *
 * Usage: <ScreenFlash color="success" active={showFlash} />
 */
import { motion, AnimatePresence } from "framer-motion";

type FlashColor = "success" | "error" | "primary";

const colorMap: Record<FlashColor, string> = {
  success: "rgba(16, 185, 129, 0.4)",
  error: "rgba(239, 68, 68, 0.4)",
  primary: "rgba(139, 92, 246, 0.4)",
};

interface Props {
  color: FlashColor;
  active: boolean;
}

export function ScreenFlash({ color, active }: Props) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[90] pointer-events-none"
          style={{ backgroundColor: colorMap[color] }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, times: [0, 0.3, 1] }}
        />
      )}
    </AnimatePresence>
  );
}
