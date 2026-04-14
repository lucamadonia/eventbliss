import { motion } from 'framer-motion';

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

export default function TVGlowFrame({
  color = '#df8eff',
  intensity = 'low',
  pulse = true,
  rainbow = false,
}: TVGlowFrameProps) {
  const config = GLOW_CONFIG[intensity];
  const shadow = `inset 0 0 ${config.blur}px ${config.spread}px ${toRgba(color, config.alpha)}`;

  if (rainbow) {
    const rainbowKeyframes = `
      @keyframes tv-rainbow-glow {
        0%, 100% { box-shadow: inset 0 0 ${config.blur}px ${config.spread}px rgba(223,142,255,${config.alpha}); }
        25% { box-shadow: inset 0 0 ${config.blur}px ${config.spread}px rgba(255,107,152,${config.alpha}); }
        50% { box-shadow: inset 0 0 ${config.blur}px ${config.spread}px rgba(143,245,255,${config.alpha}); }
        75% { box-shadow: inset 0 0 ${config.blur}px ${config.spread}px rgba(251,191,36,${config.alpha}); }
      }
    `;
    return (
      <>
        <style>{rainbowKeyframes}</style>
        <div
          className="fixed inset-0 pointer-events-none z-10"
          style={{ animation: 'tv-rainbow-glow 3s ease-in-out infinite' }}
        />
      </>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-10"
      style={{ boxShadow: shadow }}
      animate={pulse ? { opacity: [0.5, 1, 0.5] } : undefined}
      transition={
        pulse
          ? { duration: config.duration, repeat: Infinity, ease: 'easeInOut' }
          : undefined
      }
    />
  );
}
