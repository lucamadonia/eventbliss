import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hoverGlow?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  gradient = false,
  hoverGlow = false,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "bg-white/[0.03] backdrop-blur-xl rounded-2xl transition-all duration-300",
        gradient
          ? "border border-transparent bg-clip-padding [background-image:linear-gradient(rgba(255,255,255,0.03),rgba(255,255,255,0.03)),linear-gradient(135deg,rgba(139,92,246,0.2),transparent_50%,rgba(6,182,212,0.2))] [background-origin:border-box] [background-clip:padding-box,border-box]"
          : "border border-white/[0.08]",
        hoverGlow &&
          "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:border-white/[0.12]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
