import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
}

export function FloatingElement({
  children,
  className,
  delay = 0,
  duration = 6,
  distance = 20,
}: FloatingElementProps) {
  return (
    <motion.div
      className={cn("", className)}
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2],
        rotate: [-2, 2, -2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
