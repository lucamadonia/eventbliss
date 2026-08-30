import { motion } from 'framer-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';

interface TVGlowFrameProps {
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
  pulse?: boolean;
  rainbow?: boolean;
}

const GLOW_CONFIG = {
  low: { blur: 60, spread: 2, alpha: 0.15, duration: 4 },
  medium: { blur: 100, spread: 4, alpha: 0.25, duration: 2 },
  high: { blur: 150, spread: 8, alpha: 0.4, duration: 1 },
} as const;

const toRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Festive cross-fade colors for the game-over "rainbow" glow — each is a static
// inset shadow layer whose OPACITY is animated (compositor-only), instead of
// animating `box-shadow` keyframes (a full-viewport repaint every frame).
const RAINBOW = ['#df8eff', '#ff6b98', '#8ff5ff', '#fbbf24'];

export default function TVGlowFrame({
  color = '#df8eff',
  intensity = 'low',
  pulse = true,
  rainbow = false,
}: TVGlowFrameProps) {
  const config = GLOW_CONFIG[intensity];
  const ambient = useAmbientMotion();
  const doPulse = pulse && ambient;

  // On a TV, large inset box-shadows allocate and repaint an oversized blur
  // surface. A static edge gradient keeps the frame without that GPU cost.
  if (!ambient) {
    const background = rainbow
      ? [
          `radial-gradient(circle at 0% 0%, ${toRgba(RAINBOW[0], config.alpha)} 0%, transparent 34%)`,
          `radial-gradient(circle at 100% 0%, ${toRgba(RAINBOW[1], config.alpha)} 0%, transparent 34%)`,
          `radial-gradient(circle at 100% 100%, ${toRgba(RAINBOW[2], config.alpha)} 0%, transparent 34%)`,
          `radial-gradient(circle at 0% 100%, ${toRgba(RAINBOW[3], config.alpha)} 0%, transparent 34%)`,
        ].join(',')
      : `radial-gradient(ellipse at center, transparent 58%, ${toRgba(color, config.alpha * 0.72)} 100%)`;

    return (
      <div
        className="fixed inset-0 pointer-events-none z-10"
        aria-hidden
        data-tv-performance="static-glow"
        style={{ background }}
      />
    );
  }

  if (rainbow) {
    return (
      <div className="fixed inset-0 pointer-events-none z-10">
        {RAINBOW.map((c, i) => (
          <motion.div
            key={c}
            className="absolute inset-0"
            style={{ boxShadow: `inset 0 0 ${config.blur}px ${config.spread}px ${toRgba(c, config.alpha)}`, willChange: 'opacity' }}
            initial={{ opacity: i === 0 ? 1 : 0 }}
            animate={ambient ? { opacity: [0, 1, 0] } : { opacity: 0.6 }}
            transition={ambient ? { duration: RAINBOW.length * 1.5, times: undefined, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 } : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-10"
      style={{ boxShadow: `inset 0 0 ${config.blur}px ${config.spread}px ${toRgba(color, config.alpha)}`, willChange: 'opacity' }}
      animate={doPulse ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
      transition={doPulse ? { duration: config.duration, repeat: Infinity, ease: 'easeInOut' } : undefined}
    />
  );
}
