/** A short, finite handoff from the native launch frame into EventBliss. */
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SplashScreen } from "@capacitor/splash-screen";
import { useTranslation } from "react-i18next";
import { useHaptics } from "@/hooks/useHaptics";
import { isNative } from "@/lib/platform";
import { splashBeats, splashMotion } from "@/lib/motion";
import splashMark from "@/assets/eventbliss-splash-mark-v2.png";
import wordmark from "@/assets/eventbliss-wordmark-v2.png";

interface Props {
  onComplete: () => void;
}

type Phase = "rest" | "trace" | "reveal" | "release";

function launchBackground() {
  // The native assets follow the OS appearance; matching that appearance is
  // more reliable than reading an app theme that may load after the launch.
  if (typeof window !== "undefined" && isNative() && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "#fafafa";
  }
  return "#1a1625";
}

export function SplashExperience({ onComplete }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const background = launchBackground();
  const isLight = background === "#fafafa";
  const initialReducedRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const liveReducedMotion = useReducedMotion();
  const reducedMotion = liveReducedMotion ?? initialReducedRef.current;
  const [phase, setPhase] = useState<Phase>(() => reducedMotion ? "reveal" : "rest");

  useEffect(() => {
    const hideFrame = requestAnimationFrame(() => {
      if (isNative()) SplashScreen.hide({ fadeOutDuration: 180 }).catch(() => undefined);
    });
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (reducedMotion) {
      timers.push(setTimeout(() => setPhase("release"), 650));
      timers.push(setTimeout(onComplete, 850));
    } else {
      timers.push(setTimeout(() => { setPhase("trace"); haptics.light(); }, splashBeats.trace));
      timers.push(setTimeout(() => { setPhase("reveal"); haptics.medium(); }, splashBeats.reveal));
      timers.push(setTimeout(() => setPhase("release"), splashBeats.release));
      timers.push(setTimeout(onComplete, splashBeats.done));
    }

    return () => {
      cancelAnimationFrame(hideFrame);
      timers.forEach(clearTimeout);
    };
  }, [haptics, onComplete, reducedMotion]);

  const revealed = phase === "reveal" || phase === "release";
  const released = phase === "release";

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: background }}
      initial={false}
      animate={{ opacity: released ? 0 : 1 }}
      transition={released ? reducedMotion ? { duration: 0.2 } : splashMotion.release : { duration: 0 }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 55% 36% at 50% 50%, rgba(137,69,194,0.13), transparent 76%)"
            : "radial-gradient(ellipse 55% 38% at 50% 50%, rgba(111,62,204,0.27), rgba(28,118,170,0.08) 48%, transparent 78%)",
        }}
        initial={false}
        animate={{ opacity: phase === "rest" || reducedMotion ? 0 : revealed ? 1 : 0.58 }}
        transition={splashMotion.reveal}
      />

      {!reducedMotion && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute overflow-visible"
          style={{ width: splashMotion.orbitWidth, height: splashMotion.orbitWidth }}
          viewBox="0 0 400 400"
          fill="none"
        >
          <defs>
            <linearGradient id="launch-orbit-a" x1="50" y1="80" x2="340" y2="300" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9e58f0" />
              <stop offset="0.55" stopColor="#35b7eb" />
              <stop offset="1" stopColor="#84dfae" />
            </linearGradient>
            <linearGradient id="launch-orbit-b" x1="350" y1="90" x2="50" y2="320" gradientUnits="userSpaceOnUse">
              <stop stopColor="#83dcb4" />
              <stop offset="0.52" stopColor="#42aeea" />
              <stop offset="1" stopColor="#b775ed" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 72 240 C 26 150, 94 58, 202 58 C 312 58, 374 145, 334 226"
            stroke="url(#launch-orbit-a)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: phase === "rest" ? 0 : 1, opacity: revealed ? 0.22 : phase === "rest" ? 0 : 0.85 }}
            transition={splashMotion.trace}
          />
          <motion.path
            d="M 328 158 C 376 245, 315 344, 202 344 C 91 344, 27 252, 68 176"
            stroke="url(#launch-orbit-b)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: phase === "rest" ? 0 : 1, opacity: revealed ? 0.22 : phase === "rest" ? 0 : 0.85 }}
            transition={{ ...splashMotion.trace, delay: 0.09 }}
          />
        </svg>
      )}

      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full border"
          style={{
            width: splashMotion.orbitWidth,
            height: splashMotion.orbitWidth,
            borderColor: isLight ? "rgba(114,54,171,0.25)" : "rgba(120,199,251,0.42)",
            boxShadow: isLight ? "none" : "0 0 38px rgba(91,167,249,0.14)",
          }}
          initial={false}
          animate={{ scale: revealed ? 1.28 : 0.55, opacity: revealed ? [0, 0.42, 0] : 0 }}
          transition={{ ...splashMotion.reveal, times: [0, 0.25, 1] }}
        />
      )}

      <div className="relative flex h-[300px] w-full items-center justify-center" role="img" aria-label="EventBliss">
        <motion.img
          src={splashMark}
          alt=""
          className="relative z-10 object-contain"
          style={{ width: splashMotion.markWidth, height: "auto" }}
          initial={false}
          animate={{
            y: revealed ? splashMotion.markLift : 0,
            scale: revealed ? splashMotion.markRevealScale : 1,
            opacity: 1,
          }}
          transition={splashMotion.reveal}
        />

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute z-0 rounded-full"
          style={{
            width: "min(48vmin, 210px)",
            height: "min(48vmin, 210px)",
            background: isLight
              ? "radial-gradient(circle, rgba(106,70,179,0.2), transparent 68%)"
              : "radial-gradient(circle, rgba(114,80,232,0.36), rgba(40,187,229,0.14) 48%, transparent 72%)",
            filter: "blur(18px)",
          }}
          initial={false}
          animate={{ opacity: phase === "rest" || reducedMotion ? 0 : 1, scale: revealed ? 1.65 : 0.86 }}
          transition={splashMotion.reveal}
        />

        <motion.img
          src={wordmark}
          alt=""
          className="absolute z-10 object-contain"
          style={{ width: "min(74vw, 330px)", height: "auto" }}
          initial={false}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? splashMotion.wordmarkY : splashMotion.wordmarkY + 18 }}
          transition={{ ...splashMotion.reveal, delay: reducedMotion ? 0 : 0.05 }}
        />
        <motion.span
          className="absolute z-10 whitespace-nowrap text-center font-body text-xs tracking-[0.18em]"
          style={{ color: isLight ? "#5e546b" : "#b9adc8" }}
          initial={false}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? splashMotion.taglineY : splashMotion.taglineY + 12 }}
          transition={{ ...splashMotion.reveal, delay: reducedMotion ? 0 : 0.17 }}
        >
          {t("native.splash.tagline")}
        </motion.span>
      </div>
    </motion.div>
  );
}
