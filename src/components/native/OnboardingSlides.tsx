/**
 * OnboardingSlides — 7-Folien-Intro, das den Abend als Bogen erzaehlt: von
 * der Planung ueber die Buchung bis zur Siegerehrung. Jede Folie baut aus
 * ECHTEN App-Bauteilen eine kleine Vorschau statt sie nur zu behaupten —
 * Folie 5 nutzt die echten Spiel-Artworks, Folie 6 die echte `TVPartyMap`
 * (verkleinert), Folie 7 das echte `TVPartyPodium`.
 *
 * Ab Folie 3 bleibt zusaetzlich ein "Loslegen"-Knopf sichtbar: wer schon
 * ueberzeugt ist, soll nicht erst durch die restlichen Folien swipen muessen.
 */
import { useCallback, useEffect, useState, type ComponentType } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Rocket, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { SceneEventPlan } from "./onboarding/SceneEventPlan";
import { SceneSurvey } from "./onboarding/SceneSurvey";
import { SceneMarketplace } from "./onboarding/SceneMarketplace";
import { SceneExpenses } from "./onboarding/SceneExpenses";
import { ScenePartyMode } from "./onboarding/ScenePartyMode";
import { SceneNightRoute } from "./onboarding/SceneNightRoute";
import { ScenePodium } from "./onboarding/ScenePodium";

interface Props {
  onComplete: () => void;
}

interface Slide {
  titleKey: string;
  subtitleKey: string;
  gradient: string;
  Scene: ComponentType;
  visual?: string;
}

const slides: Slide[] = [
  {
    titleKey: "native.onboarding.slide1Title",
    subtitleKey: "native.onboarding.slide1Subtitle",
    gradient: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
    Scene: SceneEventPlan,
    visual: "/images/onboarding/event-to-party-v3.webp",
  },
  {
    titleKey: "native.onboarding.slide2Title",
    subtitleKey: "native.onboarding.slide2Subtitle",
    gradient: "from-fuchsia-500/25 via-pink-500/15 to-transparent",
    Scene: SceneSurvey,
    visual: "/images/onboarding/messages-and-decisions-v3.webp",
  },
  {
    titleKey: "native.onboarding.slide3Title",
    subtitleKey: "native.onboarding.slide3Subtitle",
    gradient: "from-cyan-500/25 via-teal-500/15 to-transparent",
    Scene: SceneMarketplace,
    visual: "/images/onboarding/vendors-budget-flow-v3.webp",
  },
  {
    titleKey: "native.onboarding.slide4Title",
    subtitleKey: "native.onboarding.slide4Subtitle",
    gradient: "from-amber-500/25 via-orange-500/15 to-transparent",
    Scene: SceneExpenses,
  },
  {
    titleKey: "native.onboarding.slide5Title",
    subtitleKey: "native.onboarding.slide5Subtitle",
    gradient: "from-[#df8eff]/25 via-[#ff6b98]/15 to-transparent",
    Scene: ScenePartyMode,
  },
  {
    titleKey: "native.onboarding.slide6Title",
    subtitleKey: "native.onboarding.slide6Subtitle",
    gradient: "from-[#1a0f2e]/40 via-[#0b0716]/25 to-transparent",
    Scene: SceneNightRoute,
  },
  {
    titleKey: "native.onboarding.slide7Title",
    subtitleKey: "native.onboarding.slide7Subtitle",
    gradient: "from-amber-400/25 via-yellow-500/15 to-transparent",
    Scene: ScenePodium,
  },
];

/** Ab dieser (0-basierten) Folie bleibt der fruehe Ausstieg staendig sichtbar. */
const EARLY_EXIT_FROM_INDEX = 2;

export function OnboardingSlides({ onComplete }: Props) {
  const { t } = useTranslation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const haptics = useHaptics();
  const reduceMotion = useReducedMotion();

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    haptics.light();
  }, [emblaApi, haptics]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const isLast = selectedIndex === slides.length - 1;
  const showEarlyExit = selectedIndex >= EARLY_EXIT_FROM_INDEX && !isLast;

  const handleNext = () => {
    haptics.medium();
    if (isLast) {
      haptics.celebrate();
      onComplete();
    } else {
      emblaApi?.scrollNext();
    }
  };

  const handleSkip = () => {
    haptics.light();
    onComplete();
  };

  const handleEarlyExit = () => {
    haptics.celebrate();
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9998] flex flex-col overflow-hidden bg-[#070a14] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4, ease: ease.out } }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: ease.in } }}
    >
      {/* Skip button */}
      <div className="absolute top-0 right-0 z-10 safe-top">
        <button
          onClick={handleSkip}
          className="m-4 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-bold text-white/65 backdrop-blur-md transition-colors hover:text-white"
        >
          {t('native.onboarding.skip')}
        </button>
      </div>

      {/* Slides viewport */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => {
            const Scene = slide.Scene;
            const active = selectedIndex === i;
            return (
              <div
                key={i}
                className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center overflow-y-auto px-5 pb-2 pt-16"
              >
                {/* Buehne fuer die Szene — ersetzt das fruehere reine Symbol */}
                <div
                  className={cn(
                    "relative mb-5 w-full max-w-sm overflow-hidden rounded-[34px] bg-gradient-to-br p-2 ring-1 ring-white/10 shadow-[0_28px_90px_-34px_rgba(139,92,246,.72)]",
                    slide.gradient
                  )}
                >
                  <AnimatePresence mode="wait">
                    {active && (
                      <motion.div
                        key={i}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={reduceMotion ? { duration: 0.2 } : spring.soft}
                      >
                        {slide.visual ? (
                          <div className="relative h-[min(47vh,390px)] overflow-hidden rounded-[27px] bg-[#09142b]">
                            <motion.img src={slide.visual} alt="" className="h-full w-full object-cover"
                              initial={reduceMotion ? false : { scale: 1.08 }} animate={{ scale: 1 }}
                              transition={{ duration: 1.1, ease: ease.out }} />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#070a14]/45" />
                          </div>
                        ) : <Scene />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                  {active && (
                    <motion.div
                      key={`text-${i}`}
                      className="max-w-sm text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ ...spring.soft, delay: 0.1 }}
                    >
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#df8eff]">
                        {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                      </p>
                      <h2 className="mb-2 text-[clamp(1.7rem,7vw,2.35rem)] font-display font-black leading-[1.02] tracking-[-0.04em] text-white">
                        {t(slide.titleKey)}
                      </h2>
                      <p className="mx-auto max-w-[340px] text-sm font-body leading-relaxed text-white/62">
                        {t(slide.subtitleKey)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress dots + fruehzeitiger Ausstieg + CTA */}
      <div className="safe-bottom flex flex-col items-center gap-3 px-6 pb-5 pt-2">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full bg-white/15"
              animate={{
                width: selectedIndex === i ? 32 : 8,
                backgroundColor:
                  selectedIndex === i ? "rgba(139, 92, 246, 1)" : "hsl(var(--foreground) / 0.2)",
              }}
              transition={spring.snappy}
            />
          ))}
        </div>

        <AnimatePresence>
          {showEarlyExit && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={handleEarlyExit}
              className="flex items-center gap-1.5 text-sm font-semibold text-violet-500 dark:text-[#df8eff]"
            >
              <Rocket className="w-4 h-4" aria-hidden />
              {t('native.onboarding.skipToStart')}
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleNext}
          className="flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#ff6b98] py-4 text-base font-black text-white shadow-[0_0_46px_rgba(217,70,239,.38)]"
          whileTap={{ scale: 0.96 }}
          transition={spring.snappy}
        >
          {isLast ? (
            <>
              {t('native.onboarding.getStarted')}
              <Sparkles className="w-5 h-5" />
            </>
          ) : (
            <>
              {t('native.onboarding.next')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
