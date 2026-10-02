/** Stop chime and scoped styles of the Flaschendrehen table (kept out of the game component). */
export function playStopSound() {
  try {
    const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch { /* audio unavailable */ }
}

export const neonStyles = `
  .neon-text { text-shadow: 0 0 15px rgba(255,107,152,0.6), 0 0 40px rgba(150,160,165,0.2); }
  .neon-text-cyan { text-shadow: 0 0 15px rgba(143,245,255,0.6), 0 0 40px rgba(0,238,252,0.2); }
  .neon-text-purple { text-shadow: 0 0 15px rgba(150,160,165,0.6), 0 0 40px rgba(150,160,165,0.2); }
  .glass-panel { backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(150,160,165,0.1); background: rgba(21,26,33,0.8); }
  .glass-panel-elevated { backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(150,160,165,0.08); background: rgba(27,32,40,0.85); }
  .card-glow { box-shadow: 0 0 40px -10px rgba(255,107,152,0.4), 0 0 80px -20px rgba(150,160,165,0.2); }
  .btn-glow { box-shadow: 0 0 30px -5px rgba(150,160,165,0.4), 0 0 60px -10px rgba(255,107,152,0.2); }
  .trophy-glow { box-shadow: 0 0 30px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.1); }
  @keyframes pulse-ring { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
  .pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
  @keyframes float-aura { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(5px,-5px) scale(1.05); } }
  .float-aura { animation: float-aura 6s ease-in-out infinite; }
`;
