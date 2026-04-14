import { useCallback, useState } from 'react';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  delay = 0,
): void {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(gain, ctx.currentTime + delay);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.05);
}

function playNoiseBurst(duration: number, gain = 0.1, delay = 0): void {
  const ctx = getCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const vol = ctx.createGain();
  vol.gain.setValueAtTime(gain, ctx.currentTime + delay);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  source.connect(vol);
  vol.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
  source.stop(ctx.currentTime + delay + duration + 0.05);
}

function playFilteredNoise(duration: number, freq: number, gain = 0.1, delay = 0): void {
  const ctx = getCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = freq;
  const vol = ctx.createGain();
  vol.gain.setValueAtTime(gain, ctx.currentTime + delay);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  source.connect(filter);
  filter.connect(vol);
  vol.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
  source.stop(ctx.currentTime + delay + duration + 0.05);
}

export function useTVAudio() {
  const [isEnabled, setIsEnabled] = useState(false);

  const enable = useCallback(() => {
    const ctx = getCtx();
    if (ctx) {
      setIsEnabled(true);
      playTone(0, 0.01, 'sine', 0.001);
    }
  }, []);

  const playChime = useCallback(() => {
    if (!isEnabled) return;
    playTone(523, 0.12, 'sine', 0.15, 0);
    playTone(659, 0.12, 'sine', 0.15, 0.15);
    playTone(784, 0.15, 'sine', 0.18, 0.3);
  }, [isEnabled]);

  const playTick = useCallback(() => {
    if (!isEnabled) return;
    playTone(800, 0.05, 'sine', 0.1);
  }, [isEnabled]);

  const playCorrect = useCallback(() => {
    if (!isEnabled) return;
    playTone(523, 0.1, 'sine', 0.2, 0);
    playTone(1046, 0.2, 'sine', 0.2, 0.08);
  }, [isEnabled]);

  const playWrong = useCallback(() => {
    if (!isEnabled) return;
    playTone(150, 0.25, 'sawtooth', 0.15, 0);
    playTone(155, 0.25, 'sawtooth', 0.12, 0);
  }, [isEnabled]);

  const playFanfare = useCallback(() => {
    if (!isEnabled) return;
    playTone(523, 0.8, 'sine', 0.12, 0);
    playTone(659, 0.8, 'sine', 0.12, 0);
    playTone(784, 0.8, 'sine', 0.12, 0);
    playTone(523, 0.5, 'sine', 0.1, 0.3);
    playTone(659, 0.5, 'sine', 0.1, 0.3);
    playTone(784, 0.5, 'sine', 0.1, 0.3);
    playTone(1046, 0.5, 'sine', 0.12, 0.3);
  }, [isEnabled]);

  const playDrumroll = useCallback((): (() => void) => {
    if (!isEnabled) return () => {};
    const ctx = getCtx();
    if (!ctx) return () => {};
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 80;
    vol.gain.setValueAtTime(0.001, ctx.currentTime);
    vol.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2);
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start();
    return () => {
      try {
        vol.gain.cancelScheduledValues(ctx.currentTime);
        vol.gain.setValueAtTime(vol.gain.value, ctx.currentTime);
        vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.stop(ctx.currentTime + 0.15);
      } catch {
        /* already stopped */
      }
    };
  }, [isEnabled]);

  const playReveal = useCallback(() => {
    if (!isEnabled) return;
    playTone(784, 0.08, 'triangle', 0.15, 0);
    playTone(523, 0.08, 'triangle', 0.15, 0.08);
    playTone(784, 0.1, 'triangle', 0.18, 0.16);
    playFilteredNoise(0.2, 3000, 0.08, 0.26);
  }, [isEnabled]);

  return {
    playChime,
    playTick,
    playCorrect,
    playWrong,
    playFanfare,
    playDrumroll,
    playReveal,
    isEnabled,
    enable,
  };
}
