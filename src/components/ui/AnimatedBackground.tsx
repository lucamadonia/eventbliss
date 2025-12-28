import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "mesh" | "gradient" | "particles";
}

export function AnimatedBackground({
  className,
  children,
  variant = "mesh",
}: AnimatedBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Base background */}
      <div className="fixed inset-0 bg-background" />

      {/* Animated gradient orbs */}
      {variant === "mesh" && (
        <>
          <motion.div
            className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="fixed top-[40%] right-[-15%] w-[500px] h-[500px] rounded-full bg-accent/15 blur-[100px]"
            animate={{
              x: [0, -80, 0],
              y: [0, -60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          <motion.div
            className="fixed bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full blur-[80px]"
            style={{ background: "hsl(var(--neon-pink) / 0.15)" }}
            animate={{
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </>
      )}

      {/* Gradient variant */}
      {variant === "gradient" && (
        <div className="fixed inset-0 animated-gradient opacity-30" />
      )}

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 grid-pattern opacity-50" />

      {/* Noise texture */}
      <div className="fixed inset-0 noise-texture" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
