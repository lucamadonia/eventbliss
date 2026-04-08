/**
 * SplashExperience — animated JS splash that seamlessly takes over from the
 * native Capacitor splash PNG, then hands off to the app.
 *
 * CRITICAL: This component's background MUST be #1a1625 (matching native
 * splash PNG) — any drift causes a visible flash during handoff.
 *
 * Sequence:
 *   0ms:    mount (native splash still visible behind)
 *   50ms:   SplashScreen.hide() — native fades out (250ms)
 *   200ms:  logo spring scale 0.92→1.0, opacity 0.6→1
 *   400ms:  haptic Medium, LogoParticles burst
 *   800ms:  tagline fades in y:12→0
 *   1600ms: ambient orbs fade in
 *   1800ms: dissolve — logo scales up + fades, tagline slides up
 *   2100ms: onComplete()
 */
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen } from "@capacitor/splash-screen";
import { useHaptics } from "@/hooks/useHaptics";
import { isNative } from "@/lib/platform";
import { spring, duration, ease } from "@/lib/motion";
import eventBlissLogo from "@/assets/eventbliss-logo.png";
import { LogoParticles } from "./LogoParticles";

interface Props {
  onComplete: () => void;
}

export function SplashExperience({ onComplete }: Props) {
  const haptics = useHaptics();

  useEffect(() => {
    // Hide native splash immediately so JS owns the screen
    if (isNative()) {
      // Let the first paint land, then hide with a soft crossfade
      requestAnimationFrame(() => {
        SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined);
      });
    }

    const hapticTimer = setTimeout(() => haptics.medium(), 400);
    const completeTimer = setTimeout(onComplete, 2100);

    return () => {
      clearTimeout(hapticTimer);
      clearTimeout(completeTimer);
    };
  }, [haptics, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: "#1a1625" }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3, ease: ease.out } }}
      >
        {/* Radial glow backdrop */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(139, 92, 246, 0.25), transparent 60%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1.2, ease: ease.out }}
        />

        {/* Ambient orbs fade in later */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.6, duration: 0.5 }}
        >
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/30 blur-3xl animate-float" />
          <div
            className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/20 blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          />
        </motion.div>

        {/* Logo — the hero element */}
        <motion.div
          className="relative flex flex-col items-center gap-6 z-10"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.92, 1, 1, 1.08],
          }}
          transition={{
            times: [0, 0.1, 0.85, 1],
            duration: 2.1,
            ease: ease.out,
          }}
        >
          <div className="relative">
            {/* Logo image with heartbeat pulse */}
            <motion.img
              src={eventBlissLogo}
              alt="EventBliss"
              className="w-40 h-40 object-contain drop-shadow-[0_0_40px_rgba(139,92,246,0.6)]"
              initial={{ scale: 0.92, opacity: 0.6 }}
              animate={{
                scale: [0.92, 1, 1.04, 1, 1.04, 1],
                opacity: [0.6, 1, 1, 1, 1, 1],
              }}
              transition={{
                times: [0, 0.15, 0.45, 0.55, 0.75, 0.85],
                duration: 2.1,
                ease: ease.out,
              }}
            />

            {/* Particle burst */}
            <LogoParticles delay={0.45} />
          </div>

          {/* Tagline */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: [0, 0, 1, 1, 0],
              y: [12, 12, 0, 0, -20],
            }}
            transition={{
              times: [0, 0.38, 0.48, 0.85, 1],
              duration: 2.1,
              ease: ease.out,
            }}
          >
            <p className="text-2xl font-display font-semibold text-white tracking-tight">
              EventBliss
            </p>
            <p className="text-sm text-white/60 mt-1 font-body">
              Plan events worth remembering
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
