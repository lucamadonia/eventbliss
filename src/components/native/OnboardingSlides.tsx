/**
 * OnboardingSlides — 4-slide swipeable first-launch tutorial.
 * Uses embla-carousel-react (already installed).
 *
 * Slides:
 *   1. Plan epic events     (CalendarHeart icon + animated gradient)
 *   2. Play 24+ games       (Gamepad2 icon + bounce)
 *   3. Track expenses       (Wallet icon + pulse)
 *   4. Invite friends       (Users icon + orbit)
 *
 * Each slide uses pure CSS/framer-motion animation (no Lottie files needed
 * for first ship — can swap to Lottie later).
 */
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarHeart, Gamepad2, Wallet, Users, ArrowRight, Sparkles } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Props {
  onComplete: () => void;
}

interface Slide {
  icon: typeof CalendarHeart;
  title: string;
  subtitle: string;
  gradient: string;
  accent: string;
}

const slides: Slide[] = [
  {
    icon: CalendarHeart,
    title: "Plan epic events",
    subtitle: "Bachelor parties, birthdays, group trips — all from one place.",
    gradient: "from-violet-500/30 via-fuchsia-500/20 to-transparent",
    accent: "text-violet-300",
  },
  {
    icon: Gamepad2,
    title: "Play 24+ party games",
    subtitle: "Taboo, Bomb, Headup, Truth or Dare, Impostor and more.",
    gradient: "from-fuchsia-500/30 via-pink-500/20 to-transparent",
    accent: "text-fuchsia-300",
  },
  {
    icon: Wallet,
    title: "Split the costs",
    subtitle: "Track expenses and settle up without awkward conversations.",
    gradient: "from-cyan-500/30 via-teal-500/20 to-transparent",
    accent: "text-cyan-300",
  },
  {
    icon: Users,
    title: "Invite everyone",
    subtitle: "Share a link, collect RSVPs, and keep your crew in the loop.",
    gradient: "from-amber-500/30 via-orange-500/20 to-transparent",
    accent: "text-amber-300",
  },
];

export function OnboardingSlides({ onComplete }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const haptics = useHaptics();

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

  return (
    <motion.div
      className="fixed inset-0 z-[9998] flex flex-col"
      style={{ backgroundColor: "#1a1625" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4, ease: ease.out } }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: ease.in } }}
    >
      {/* Skip button */}
      <div className="absolute top-0 right-0 z-10 safe-top">
        <button
          onClick={handleSkip}
          className="m-4 px-4 py-2 text-sm text-white/60 hover:text-white/90 font-medium transition-colors"
        >
          Überspringen
        </button>
      </div>

      {/* Slides viewport */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => {
            const Icon = slide.icon;
            return (
              <div
                key={i}
                className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center px-8"
              >
                {/* Gradient hero */}
                <div
                  className={cn(
                    "relative w-64 h-64 rounded-full bg-gradient-to-br flex items-center justify-center mb-10",
                    slide.gradient
                  )}
                >
                  <AnimatePresence mode="wait">
                    {selectedIndex === i && (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={spring.bouncy}
                      >
                        <Icon
                          className={cn("w-32 h-32", slide.accent)}
                          strokeWidth={1.5}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Ambient orbit */}
                  <motion.div
                    className="absolute inset-0 rounded-full border border-white/10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-white/40" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-1.5 h-1.5 rounded-full bg-white/30" />
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  {selectedIndex === i && (
                    <motion.div
                      key={`text-${i}`}
                      className="text-center max-w-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ ...spring.soft, delay: 0.1 }}
                    >
                      <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">
                        {slide.title}
                      </h2>
                      <p className="text-base text-white/70 font-body leading-relaxed">
                        {slide.subtitle}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress dots + CTA */}
      <div className="safe-bottom px-8 pb-6 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full bg-white/20"
              animate={{
                width: selectedIndex === i ? 32 : 8,
                backgroundColor:
                  selectedIndex === i ? "rgba(139, 92, 246, 1)" : "rgba(255, 255, 255, 0.2)",
              }}
              transition={spring.snappy}
            />
          ))}
        </div>

        <motion.button
          onClick={handleNext}
          className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-lg shadow-[0_0_40px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
          whileTap={{ scale: 0.96 }}
          transition={spring.snappy}
        >
          {isLast ? (
            <>
              Los geht's
              <Sparkles className="w-5 h-5" />
            </>
          ) : (
            <>
              Weiter
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
