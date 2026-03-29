import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, PartyPopper, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SurveyCompletionScreenProps {
  eventName: string;
  onGoBack: () => void;
}

const stagger = {
  animate: {
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const SurveyCompletionScreen = ({
  eventName,
  onGoBack,
}: SurveyCompletionScreenProps) => {
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 200, damping: 20 };

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* CSS-only floating dots */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-violet-400/30 animate-float-particle"
            style={{
              left: `${12 + i * 13}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        className="text-center px-6 max-w-md mx-auto"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* Icons row */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-6"
          variants={fadeUp}
          transition={transition}
        >
          <motion.span
            initial={shouldReduceMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...transition, delay: 0.1 }}
          >
            <Sparkles className="w-8 h-8 text-amber-400/80" />
          </motion.span>
          <motion.span
            initial={shouldReduceMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...transition, delay: 0.2 }}
          >
            <CheckCircle2 className="w-14 h-14 text-emerald-400" />
          </motion.span>
          <motion.span
            initial={shouldReduceMotion ? {} : { scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...transition, delay: 0.3 }}
          >
            <PartyPopper className="w-8 h-8 text-violet-400/80" />
          </motion.span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          className="font-display text-3xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent"
          variants={fadeUp}
          transition={transition}
        >
          Vielen Dank!
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground mb-1"
          variants={fadeUp}
          transition={transition}
        >
          Deine Antworten wurden gespeichert
        </motion.p>

        {/* Event name */}
        <motion.p
          className="text-sm text-muted-foreground/70 mb-8"
          variants={fadeUp}
          transition={transition}
        >
          {eventName}
        </motion.p>

        {/* Back button */}
        <motion.div variants={fadeUp} transition={transition}>
          <Button
            onClick={onGoBack}
            variant="outline"
            className="cursor-pointer gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurueck zur Uebersicht
          </Button>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh); opacity: 0; }
        }
        .animate-float-particle {
          animation: float-particle linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SurveyCompletionScreen;
