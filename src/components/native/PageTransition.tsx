/**
 * PageTransition — wraps <Routes> in AnimatePresence and picks a variant
 * based on the navigation direction.
 *
 * CRITICAL: The Suspense boundary for lazy routes must be INSIDE this
 * component so exit animations get to play before the new chunk mounts.
 */
import { ReactNode, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants, reducedPageVariants, duration as dur, ease } from "@/lib/motion";
import { useNavigationDirection } from "@/hooks/useNavigationDirection";
import { TABS } from "./BottomTabBar";
import PageLoader from "@/components/ui/PageLoader";

interface Props {
  children: ReactNode;
}

const tabPaths = TABS.map((t) => t.to);
const modalPaths = ["/create", "/join", "/auth"];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function PageTransition({ children }: Props) {
  const location = useLocation();
  const direction = useNavigationDirection({ tabPaths, modalPaths });

  const reduced = prefersReducedMotion();
  const variants = reduced
    ? reducedPageVariants
    : direction === "pop"
    ? pageVariants.pop
    : direction === "modal"
    ? pageVariants.modal
    : direction === "tab" || direction === "initial"
    ? pageVariants.tab
    : pageVariants.push;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="absolute inset-0 overflow-hidden"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
      >
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
