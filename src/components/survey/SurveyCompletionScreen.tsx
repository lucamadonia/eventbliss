import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle2, PartyPopper, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SurveyCompletionScreenProps {
  eventName: string;
  /** The person being celebrated — shown as "für <name>" when present. */
  honoreeName?: string;
  /** Event branding colours for the themed heading + particles. */
  primaryColor?: string;
  accentColor?: string;
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
  honoreeName,
  primaryColor,
  accentColor,
  onGoBack,
}: SurveyCompletionScreenProps) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 200, damping: 20 };

  const primary = primaryColor || "hsl(var(--primary))";
  const accent = accentColor || "hsl(var(--accent))";

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* CSS-only floating dots, tinted to the event primary */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full animate-float-particle"
            style={{
              left: `${12 + i * 13}%`,
              backgroundColor: `color-mix(in srgb, ${primary} 45%, transparent)`,
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
            <Sparkles className="w-8 h-8" style={{ color: accent }} />
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
            <PartyPopper className="w-8 h-8" style={{ color: primary }} />
          </motion.span>
        </motion.div>

        {/* Heading — themed to branding */}
        <motion.h2
          className="font-display text-3xl font-bold mb-2 bg-clip-text text-transparent"
          style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${accent})` }}
          variants={fadeUp}
          transition={transition}
        >
          {t("guestForm.successTitle", { defaultValue: "Vielen Dank!" })}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground mb-1"
          variants={fadeUp}
          transition={transition}
        >
          {t("guestForm.successSubtitle", {
            defaultValue: "Deine Antworten wurden gespeichert",
          })}
        </motion.p>

        {/* Event name + honoree */}
        <motion.p
          className="text-sm text-muted-foreground/70 mb-8"
          variants={fadeUp}
          transition={transition}
        >
          {honoreeName
            ? t("guestForm.successForHonoree", {
                defaultValue: "{{event}} · für {{name}}",
                event: eventName,
                name: honoreeName,
              })
            : eventName}
        </motion.p>

        {/* Back button */}
        <motion.div variants={fadeUp} transition={transition}>
          <Button onClick={onGoBack} variant="outline" className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("guestForm.successBack", { defaultValue: "Zurück zur Startseite" })}
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
        @media (prefers-reduced-motion: reduce) {
          .animate-float-particle { animation: none; opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default SurveyCompletionScreen;
