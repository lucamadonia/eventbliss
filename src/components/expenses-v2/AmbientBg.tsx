import { motion, useReducedMotion } from "framer-motion";

/**
 * AmbientBg — subtle animated gradient backdrop for the Expenses module.
 * Three slow-drifting blobs + film grain. Respects prefers-reduced-motion.
 * Fixed behind content, pointer-events disabled.
 */
export function AmbientBg({ tone = "violet" }: { tone?: "violet" | "emerald" | "rose" | "neutral" }) {
  const reduced = useReducedMotion();

  const palettes = {
    violet: {
      a: "rgba(124, 92, 255, 0.22)",
      b: "rgba(0, 227, 253, 0.14)",
      c: "rgba(255, 180, 100, 0.08)",
    },
    emerald: {
      a: "rgba(47, 210, 122, 0.20)",
      b: "rgba(0, 227, 253, 0.12)",
      c: "rgba(124, 92, 255, 0.08)",
    },
    rose: {
      a: "rgba(255, 77, 109, 0.20)",
      b: "rgba(255, 180, 100, 0.10)",
      c: "rgba(124, 92, 255, 0.06)",
    },
    neutral: {
      a: "rgba(124, 92, 255, 0.15)",
      b: "rgba(0, 227, 253, 0.10)",
      c: "rgba(255, 180, 100, 0.05)",
    },
  }[tone];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -top-1/3 -left-1/4 w-[90vw] h-[90vw] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${palettes.a}, transparent 60%)` }}
        animate={reduced ? undefined : { x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-1/3 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${palettes.b}, transparent 60%)` }}
        animate={reduced ? undefined : { x: [0, -30, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 w-[40vw] h-[40vw] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${palettes.c}, transparent 60%)` }}
        animate={reduced ? undefined : { scale: [0.95, 1.15, 0.95] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.6%22/></svg>")',
        }}
      />
    </div>
  );
}
