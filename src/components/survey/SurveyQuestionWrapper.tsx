import { motion, useReducedMotion } from "framer-motion";

interface SurveyQuestionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Branded survey card that reveals itself with a staggered entrance as it
 * scrolls into view (immersive-scroll form). The surface is the shared
 * `.survey-card` glass tile; entrance respects prefers-reduced-motion.
 */
const SurveyQuestionWrapper = ({
  children,
  className = "",
}: SurveyQuestionWrapperProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`survey-card ${className}`}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        shouldReduceMotion
          ? { duration: 0.15 }
          : { type: "spring", stiffness: 260, damping: 28 }
      }
    >
      {children}
    </motion.div>
  );
};

export default SurveyQuestionWrapper;
