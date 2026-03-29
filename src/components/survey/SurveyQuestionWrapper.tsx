import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface SurveyQuestionWrapperProps {
  children: React.ReactNode;
  isVisible?: boolean;
  hasError?: boolean;
  className?: string;
}

const SurveyQuestionWrapper = ({
  children,
  isVisible = true,
  hasError = false,
  className = "",
}: SurveyQuestionWrapperProps) => {
  const shouldReduceMotion = useReducedMotion();

  const shakeAnimation = hasError
    ? { x: [0, -10, 10, -10, 10, 0] }
    : {};

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={`bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 ${className}`}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 40 }}
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 1, x: 0, ...shakeAnimation }
          }
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 300, damping: 30 }
          }
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SurveyQuestionWrapper;
