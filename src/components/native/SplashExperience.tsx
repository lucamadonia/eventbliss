/** A short visual story that hands the native launch frame into EventBliss. */
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SplashScreen } from "@capacitor/splash-screen";
import { useTranslation } from "react-i18next";
import { useHaptics } from "@/hooks/useHaptics";
import { isNative } from "@/lib/platform";
import { splashBeats, splashMotion } from "@/lib/motion";
import splashMark from "@/assets/eventbliss-splash-mark-v2.png";
import wordmark from "@/assets/eventbliss-wordmark-v2.png";
import planningScene from "@/assets/splash-plan.webp";
import playingScene from "@/assets/splash-play.webp";
import celebratingScene from "@/assets/splash-celebrate.webp";
import ohrwurmTV from "@/assets/splash-ohrwurm-tv.webp";
import "./splash-story.css";

interface Props {
  onComplete: () => void;
}

type Phase = "rest" | "unfold" | "plan" | "play" | "celebrate" | "brand" | "release";

const phaseOrder: Record<Phase, number> = {
  rest: 0,
  unfold: 1,
  plan: 2,
  play: 3,
  celebrate: 4,
  brand: 5,
  release: 6,
};

const scenes = [
  { src: planningScene, name: "plan", step: phaseOrder.plan, origin: "51% 54%" },
  { src: playingScene, name: "play", step: phaseOrder.play, origin: "54% 58%" },
  { src: celebratingScene, name: "celebrate", step: phaseOrder.celebrate, origin: "51% 53%" },
] as const;

function StoryArtwork({ src, showTV }: { src: string; showTV: boolean }) {
  return (
    <div className="splash-story-art">
      <img src={src} alt="" className="splash-story-image" loading="eager" decoding="async" />
      {showTV && <img src={ohrwurmTV} alt="" className="splash-story-tv" loading="eager" decoding="async" />}
    </div>
  );
}

function launchBackground() {
  // The first WebView frame must match the OS-selected native launch image.
  if (typeof window !== "undefined" && isNative() && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "#fafafa";
  }
  return "#1a1625";
}

export function SplashExperience({ onComplete }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const background = launchBackground();
  const initialReducedRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const liveReducedMotion = useReducedMotion();
  const reducedMotion = liveReducedMotion ?? initialReducedRef.current;
  const [phase, setPhase] = useState<Phase>("rest");
  const step = phaseOrder[phase];
  const story = step >= phaseOrder.unfold;
  const brand = step >= phaseOrder.brand;
  const released = phase === "release";

  useEffect(() => {
    const hideFrame = requestAnimationFrame(() => {
      if (isNative()) SplashScreen.hide({ fadeOutDuration: 180 }).catch(() => undefined);
    });
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    if (reducedMotion) {
      timers.push(setTimeout(() => setPhase("brand"), 160));
      timers.push(setTimeout(() => setPhase("release"), 690));
      timers.push(setTimeout(onComplete, 890));
    } else {
      // Keep the matching native mark visible until local scenes can be painted.
      const ready = Promise.all([...scenes.map(({ src }) => src), ohrwurmTV].map((src) => {
        const image = new Image();
        image.src = src;
        return image.decode().catch(() => undefined);
      }));
      Promise.race([ready, new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, 1200));
      })]).then(() => {
        if (cancelled) return;
        timers.push(setTimeout(() => setPhase("unfold"), splashBeats.unfold));
        timers.push(setTimeout(() => setPhase("plan"), splashBeats.plan));
        timers.push(setTimeout(() => { setPhase("play"); haptics.light(); }, splashBeats.play));
        timers.push(setTimeout(() => setPhase("celebrate"), splashBeats.celebrate));
        timers.push(setTimeout(() => { setPhase("brand"); haptics.medium(); }, splashBeats.brand));
        timers.push(setTimeout(() => setPhase("release"), splashBeats.release));
        timers.push(setTimeout(onComplete, splashBeats.done));
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(hideFrame);
      timers.forEach(clearTimeout);
    };
  }, [haptics, onComplete, reducedMotion]);

  return (
    <motion.div
      data-splash-phase={phase}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ backgroundColor: background }}
      initial={false}
      animate={{ opacity: released ? 0 : 1 }}
      transition={released ? reducedMotion ? { duration: 0.2 } : splashMotion.release : { duration: 0 }}
    >
      {reducedMotion ? (
        <motion.div
          className="splash-story-scene absolute inset-0 overflow-hidden"
          initial={false}
          animate={{ opacity: brand ? 0.28 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="splash-story-backdrop" style={{ backgroundImage: `url(${celebratingScene})` }} />
          <StoryArtwork src={celebratingScene} showTV />
        </motion.div>
      ) : scenes.map(({ src, name, step: sceneStep, origin }) => {
        const visible = step >= sceneStep;
        return (
          <motion.div
            key={name}
            data-splash-scene={name}
            aria-hidden="true"
            className="splash-story-scene absolute inset-0 overflow-hidden"
            initial={false}
            animate={{
              opacity: visible ? 1 : 0,
              clipPath: visible ? `circle(130% at ${origin})` : `circle(0% at ${origin})`,
              scale: visible ? step > sceneStep ? 1.055 : 1 : 1.09,
            }}
            transition={{
              opacity: { duration: 0.08 },
              clipPath: splashMotion.sceneReveal,
              scale: splashMotion.sceneDrift,
            }}
          >
            <div className="splash-story-backdrop" style={{ backgroundImage: `url(${src})` }} />
            <StoryArtwork src={src} showTV={name !== "plan"} />
          </motion.div>
        );
      })}

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(12,9,24,.64) 0%, transparent 28%, transparent 54%, rgba(12,9,24,.28) 100%)" }}
        initial={false}
        animate={{ opacity: story && !reducedMotion ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "rgba(15,11,28,.59)" }}
        initial={false}
        animate={{ opacity: brand ? 1 : 0 }}
        transition={reducedMotion ? { duration: 0.2 } : splashMotion.brandVeil}
      />

      <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label="EventBliss">
        <motion.img
          src={splashMark}
          alt=""
          className="relative z-10 object-contain"
          style={{ width: splashMotion.markWidth, height: "auto" }}
          initial={false}
          animate={{
            x: reducedMotion || brand ? "0vw" : story ? "-35vw" : "0vw",
            y: reducedMotion ? "-8vh" : brand ? "-10vh" : story ? "-36vh" : "0vh",
            scale: reducedMotion ? brand ? 0.72 : 1 : brand ? 0.76 : story ? 0.4 : 1,
          }}
          transition={reducedMotion ? { duration: 0.2 } : splashMotion.markTravel}
        />
        <motion.img
          src={wordmark}
          alt=""
          className="absolute z-10 object-contain"
          style={{ width: "min(74vw, 420px)", height: "auto" }}
          initial={false}
          animate={{ opacity: brand ? 1 : 0, y: reducedMotion ? "8vh" : "7vh", scale: brand ? 1 : 0.92 }}
          transition={reducedMotion ? { duration: 0.2 } : splashMotion.wordmark}
        />
        <motion.span
          className="absolute z-10 w-[calc(100vw-32px)] max-w-lg px-2 text-center font-body text-[clamp(10px,2.6vw,12px)] leading-snug tracking-[0.11em]"
          style={{ color: "#e7deee" }}
          initial={false}
          animate={{ opacity: brand ? 1 : 0, y: reducedMotion ? "14vh" : "13vh" }}
          transition={reducedMotion ? { duration: 0.2 } : { ...splashMotion.wordmark, delay: 0.12 }}
        >
          {t("native.splash.tagline")}
        </motion.span>
      </div>
    </motion.div>
  );
}
