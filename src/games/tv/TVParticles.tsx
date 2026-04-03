const CSS = `
@keyframes tv-float{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-10vh) scale(1);opacity:0}}
@keyframes tv-glow-drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.1)}66%{transform:translate(-20px,15px) scale(0.9)}}
.tv-particle{position:absolute;border-radius:50%;animation:tv-float linear infinite;pointer-events:none}
.tv-glow-orb{position:absolute;border-radius:50%;filter:blur(120px);animation:tv-glow-drift 20s ease-in-out infinite;pointer-events:none}
`;

const COLORS = ['#df8eff', '#ff6b98', '#8ff5ff', '#d779ff', '#00deec'];

export default function TVParticles() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 4,
    color: COLORS[i % COLORS.length],
    duration: 30 + Math.random() * 30,
    delay: Math.random() * 20,
    opacity: 0.15 + Math.random() * 0.25,
  }));

  return (
    <>
      <style>{CSS}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Ambient glow orbs */}
        <div className="tv-glow-orb" style={{ top: '15%', left: '10%', width: '40vw', height: '40vw', background: 'rgba(223,142,255,0.06)' }} />
        <div className="tv-glow-orb" style={{ bottom: '10%', right: '5%', width: '35vw', height: '35vw', background: 'rgba(255,107,152,0.04)', animationDelay: '-7s' }} />
        <div className="tv-glow-orb" style={{ top: '50%', left: '60%', width: '25vw', height: '25vw', background: 'rgba(143,245,255,0.04)', animationDelay: '-14s' }} />
        {/* Floating particles */}
        {particles.map((p, i) => (
          <div key={i} className="tv-particle" style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, opacity: p.opacity, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />
        ))}
      </div>
    </>
  );
}
