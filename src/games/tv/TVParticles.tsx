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

const CSS = (speed: number) => `
@keyframes tv-float{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-10vh) scale(1);opacity:0}}
@keyframes tv-glow-drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.1)}66%{transform:translate(-20px,15px) scale(0.9)}}
.tv-particle{position:absolute;border-radius:50%;animation:tv-float linear infinite;pointer-events:none}
.tv-glow-orb{position:absolute;border-radius:50%;filter:blur(120px);animation:tv-glow-drift ${20 * speed}s ease-in-out infinite;pointer-events:none;transition:background 1.5s ease}
`;

interface Props {
  mood?: ParticleMood;
}

export default function TVParticles({ mood = 'ambient' }: Props) {
  const config = MOOD_CONFIG[mood];

  const particles = Array.from({ length: 25 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 4,
    color: config.colors[i % config.colors.length],
    duration: (30 + Math.random() * 30) * config.speed,
    delay: Math.random() * 20,
    opacity: config.opacity[0] + Math.random() * (config.opacity[1] - config.opacity[0]),
  }));

  return (
    <>
      <style>{CSS(config.speed)}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Ambient glow orbs */}
        <div className="tv-glow-orb" style={{ top: '15%', left: '10%', width: '40vw', height: '40vw', background: `rgba(${moodRgb(config.colors[0])},${config.orbAlpha[0]})` }} />
        <div className="tv-glow-orb" style={{ bottom: '10%', right: '5%', width: '35vw', height: '35vw', background: `rgba(${moodRgb(config.colors[1])},${config.orbAlpha[1]})`, animationDelay: '-7s' }} />
        <div className="tv-glow-orb" style={{ top: '50%', left: '60%', width: '25vw', height: '25vw', background: `rgba(${moodRgb(config.colors[2])},${config.orbAlpha[2]})`, animationDelay: '-14s' }} />
        {/* Floating particles */}
        {particles.map((p, i) => (
          <div key={i} className="tv-particle" style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, opacity: p.opacity, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />
        ))}
      </div>
    </>
  );
}

/** Parse hex to r,g,b string */
function moodRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
