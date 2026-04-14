/**
 * TVVFXLayer — persistent VFX overlay for TV Mode.
 * Auto-triggers confetti, screen flash, and timer vignette
 * based on game phase transitions.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ConfettiBurst } from "@/components/vfx/ConfettiBurst";
import { useConfetti } from "@/components/vfx/ConfettiBurst";
import { ScreenFlash } from "@/components/vfx/ScreenFlash";

interface TVVFXLayerProps {
  gameState: { game: string; phase: string; [key: string]: unknown } | null;
  prevPhase?: string;
}

type FlashColor = "success" | "error" | "primary";

function VignetteOverlay({ timeLeft }: { timeLeft: number }) {
  // Pulse faster as time decreases: 2s at 5s, 0.5s at 1s
  const duration = Math.max(0.5, timeLeft * 0.375);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 50%, rgba(239,68,68,0.3) 100%)",
      }}
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function TVVFXLayer({ gameState }: TVVFXLayerProps) {
  const prevPhaseRef = useRef<string>("");
  const { fire: fireConfetti, active: confettiActive } = useConfetti();
  const [flashColor, setFlashColor] = useState<FlashColor>("primary");
  const [flashActive, setFlashActive] = useState(false);
  const [showVignette, setShowVignette] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFlash = useCallback((color: FlashColor) => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlashColor(color);
    setFlashActive(true);
    flashTimeoutRef.current = setTimeout(() => setFlashActive(false), 400);
  }, []);

  // Phase transition effects
  useEffect(() => {
    const phase = gameState?.phase || "";
    const prev = prevPhaseRef.current;

    if (phase && phase !== prev) {
      if (phase === "leaderboard" || phase === "roundEnd") {
        fireConfetti();
        triggerFlash("primary");
      } else if (phase === "gameOver") {
        fireConfetti();
        triggerFlash("success");
        // Second confetti burst with delay
        setTimeout(() => fireConfetti(), 800);
      } else if (phase === "reveal") {
        triggerFlash("success");
      } else if (phase === "voting") {
        triggerFlash("primary");
      }

      prevPhaseRef.current = phase;
    }
  }, [gameState?.phase, fireConfetti, triggerFlash]);

  // Timer vignette
  useEffect(() => {
    const timeLeft = gameState?.timeLeft as number | undefined;
    setShowVignette(
      typeof timeLeft === "number" && timeLeft <= 5 && timeLeft > 0
    );
  }, [gameState?.timeLeft]);

  // Cleanup flash timeout on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const timeLeft = (gameState?.timeLeft as number) ?? 0;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <ConfettiBurst active={confettiActive} />
      <ScreenFlash color={flashColor} active={flashActive} />
      {showVignette && <VignetteOverlay timeLeft={timeLeft} />}
    </div>
  );
}
