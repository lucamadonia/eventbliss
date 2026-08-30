import { memo, useMemo } from 'react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';

export type ParticleMood = 'ambient' | 'tense' | 'celebrate' | 'danger';

const MOOD_CONFIG = {
  ambient: {
    colors: ['#df8eff', '#ff6b98', '#8ff5ff', '#d779ff', '#00deec'],
    speed: 1,
    opacity: [0.15, 0.4],
    orbAlpha: [0.06, 0.04, 0.04],
  },
  tense: {
    colors: ['#f59e0b', '#ef4444', '#ff6b98', '#df8eff', '#f59e0b'],
    speed: 0.6,
    opacity: [0.2, 0.5],
    orbAlpha: [0.08, 0.06, 0.05],
  },
  celebrate: {
    colors: ['#fbbf24', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'],
    speed: 0.5,
    opacity: [0.3, 0.6],
    orbAlpha: [0.1, 0.08, 0.06],
  },
  danger: {
    colors: ['#ef4444', '#dc2626', '#ff6b98', '#f59e0b', '#ef4444'],
    speed: 0.4,
    opacity: [0.25, 0.55],
    orbAlpha: [0.1, 0.08, 0.06],
  },
} as const;

const PARTICLE_COUNT = 18;

// Static stylesheet — parsed once (was rebuilt every render). Orb blur cut
// 120px → 70px (a full-viewport 120px blur was the single most expensive
// composite op on the always-on TV screen). `.tv-static` disables drift.
const CSS = `
@keyframes tv-float{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-10vh) scale(1);opacity:0}}
@keyframes tv-glow-drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.1)}66%{transform:translate(-20px,15px) scale(0.9)}}
.tv-particle{position:absolute;border-radius:50%;animation:tv-float linear infinite;pointer-events:none}
.tv-glow-orb{position:absolute;border-radius:50%;filter:blur(70px);animation:tv-glow-drift 22s ease-in-out infinite;pointer-events:none;transition:background 1.5s ease;will-change:transform}
.tv-glow-orb.tv-static{animation:none}
`;

interface Props {
  mood?: ParticleMood;
}

function TVParticlesImpl({ mood = 'ambient' }: Props) {
  const config = MOOD_CONFIG[mood];
  const ambient = useAmbientMotion();

  // Geometry is generated ONCE (was reshuffled on every render — the screen
  // re-renders ~1×/sec). Only color/opacity track the mood, cheaply.
  const geom = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => ({
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 4,
        duration: 30 + Math.random() * 30,
        delay: Math.random() * 20,
        rand: Math.random(),
        ci: Math.floor(Math.random() * 5),
      })),
    [],
  );

  const orbClass = `tv-glow-orb${ambient ? '' : ' tv-static'}`;

  // Dedicated TV profile: one static gradient layer, no full-screen blur and
  // no permanent compositor animation. Mood colors remain visible.
  if (!ambient) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden
        data-tv-performance="static-particles"
        style={{
          background: [
            `radial-gradient(circle at 12% 18%, rgba(${moodRgb(config.colors[0])},${config.orbAlpha[0] * 1.25}) 0%, transparent 34%)`,
            `radial-gradient(circle at 88% 82%, rgba(${moodRgb(config.colors[1])},${config.orbAlpha[1] * 1.35}) 0%, transparent 32%)`,
            `radial-gradient(circle at 64% 48%, rgba(${moodRgb(config.colors[2])},${config.orbAlpha[2]}) 0%, transparent 27%)`,
          ].join(','),
        }}
      />
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={orbClass} style={{ top: '15%', left: '10%', width: '40vw', height: '40vw', background: `rgba(${moodRgb(config.colors[0])},${config.orbAlpha[0]})` }} />
        <div className={orbClass} style={{ bottom: '10%', right: '5%', width: '35vw', height: '35vw', background: `rgba(${moodRgb(config.colors[1])},${config.orbAlpha[1]})`, animationDelay: '-7s' }} />
        <div className={orbClass} style={{ top: '50%', left: '60%', width: '25vw', height: '25vw', background: `rgba(${moodRgb(config.colors[2])},${config.orbAlpha[2]})`, animationDelay: '-14s' }} />
        {/* Floating particles — decoration; skipped when ambient motion is off */}
        {ambient && geom.map((p, i) => (
          <div
            key={i}
            className="tv-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: config.colors[p.ci % config.colors.length],
              opacity: config.opacity[0] + p.rand * (config.opacity[1] - config.opacity[0]),
              animationDuration: `${p.duration * config.speed}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/** Memoized: a stable `mood` no longer re-renders the particle field every second. */
const TVParticles = memo(TVParticlesImpl);
export default TVParticles;

/** Parse hex to r,g,b string */
function moodRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
