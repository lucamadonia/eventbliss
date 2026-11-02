let context: AudioContext | null = null;

/** Unlock on the physical buzz gesture so iOS can play the answer countdown. */
export function unlockAnswerSound() {
  try {
    context ??= new AudioContext();
    if (context.state !== 'running') void context.resume().catch(() => {});
  } catch { /* Audio is optional when the device does not expose Web Audio. */ }
}

export function playAnswerTick(urgent: boolean) {
  if (!context || context.state !== 'running') return;
  const tone = context.createOscillator();
  const volume = context.createGain();
  tone.type = 'sine';
  tone.frequency.value = urgent ? 880 : 620;
  volume.gain.setValueAtTime(0.001, context.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.09, context.currentTime + 0.008);
  volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.11);
  tone.connect(volume);
  volume.connect(context.destination);
  tone.start();
  tone.stop(context.currentTime + 0.12);
  tone.onended = () => { tone.disconnect(); volume.disconnect(); };
}
