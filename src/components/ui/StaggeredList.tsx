/**
 * StaggeredList — wraps children and reveals them with staggered fade+slide
 * animation as they enter the viewport.
 *
 * Usage:
 *   <StaggeredList>
 *     {items.map(i => <Card key={i.id} ... />)}
 *   </StaggeredList>
 */
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";

interface Props {
  children: ReactNode;
  className?: string;
  /** Delay between each child reveal. Default 0.06s. */
  staggerDelay?: number;
}

const containerVariants = (delay: number) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: 0.04,
    },
  },
});

const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: spring.soft },
};

export function StaggeredList({ children, className, staggerDelay = 0.06 }: Props) {
  return (
    <motion.div
      className={className}
      variants={containerVariants(staggerDelay)}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-50px" }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
