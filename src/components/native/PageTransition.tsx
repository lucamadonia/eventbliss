/**
 * PageTransition — wraps <Routes> in AnimatePresence and picks a variant
 * based on the navigation direction.
 *
 * CRITICAL: The Suspense boundary for lazy routes must be INSIDE this
 * component so exit animations get to play before the new chunk mounts.
 */
import { ReactNode, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { pageVariants, reducedPageVariants } from "@/lib/motion";
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

  // Tab roots are NOT rendered here — they live in the always-mounted
  // TabsLayer beneath this component (keep-alive: switching tabs is a pure
  // visibility flip, no unmount/remount, no transition needed).
  const isTabRoot = tabPaths.includes(location.pathname);

  return (
    // Concurrent mode (NO mode="wait"): the new page mounts immediately and
    // animates in WHILE the old one animates out. Pages are absolutely
    // positioned, so they overlap instead of shifting layout. mode="wait"
    // blocked the new page behind the old page's full exit animation — under
    // load or when tapping tabs quickly this queued/wedged transitions
    // (frozen frames, screens stuck mid-transform, multi-second switches).
    // The destination tab is already visible in TabsLayer. Pass that target
    // to the departing route: a stack-page slide would briefly cover the tab
    // with a dark panel ending at 70% of the screen.
    <AnimatePresence initial={false} custom={isTabRoot}>
      {!isTabRoot && (
        <motion.div
          key={location.pathname}
          className="absolute inset-0 z-10 overflow-hidden bg-background"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={{
            ...variants,
            exit: (toTabRoot: boolean) => toTabRoot
              ? { opacity: 0, x: 0, transition: { duration: 0 } }
              : variants.exit as TargetAndTransition,
          }}
        >
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
