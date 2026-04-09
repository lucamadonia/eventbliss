/**
 * TiltCard — interactive card with 3D tilt on hover/touch + glow.
 * Uses CSS perspective + framer-motion for smooth feedback.
 */
import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function TiltCard({
  children,
  className,
  glowColor = "rgba(139, 92, 246, 0.3)",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });

  const handleMove = (e: React.PointerEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div className="perspective-1000">
      <motion.div
        ref={ref}
        className={cn(
          "relative preserve-3d rounded-2xl transition-shadow duration-300",
          "hover:shadow-[0_0_30px_var(--tilt-glow)]",
          className
        )}
        style={
          {
            rotateX,
            rotateY,
            "--tilt-glow": glowColor,
          } as React.CSSProperties & { "--tilt-glow": string }
        }
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
