import { useCallback, useEffect, useRef, useState } from "react";

export type BrewCue = "draw" | "hit" | "miss" | "pour" | "perfect" | "bust" | "finish";

const SOUND_KEY = "eb.brew-sound";
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, duration: number, gain: number, delay = 0, type: OscillatorType = "sine") {
  const audio = context();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const volume = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, audio.currentTime + delay);
  volume.gain.setValueAtTime(Math.max(0.001, gain), audio.currentTime + delay);
  volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + delay + duration);
  oscillator.connect(volume);
  volume.connect(audio.destination);
  oscillator.start(audio.currentTime + delay);
  oscillator.stop(audio.currentTime + delay + duration + 0.03);
}

function noise(duration: number, gain: number, delay = 0, highpass = 700) {
  const audio = context();
  if (!audio) return;
  const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const volume = audio.createGain();
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = highpass;
  volume.gain.setValueAtTime(gain, audio.currentTime + delay);
  volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + delay + duration);
  source.connect(filter);
  filter.connect(volume);
  volume.connect(audio.destination);
  source.start(audio.currentTime + delay);
}

export function playBrewCue(cue: BrewCue): void {
  switch (cue) {
    case "draw":
      tone(260, 0.1, 0.055, 0, "triangle");
      tone(520, 0.14, 0.045, 0.08, "sine");
      break;
    case "hit":
      tone(523, 0.12, 0.07);
      tone(784, 0.2, 0.075, 0.09);
      break;
    case "miss":
      tone(210, 0.16, 0.045, 0, "triangle");
      break;
    case "pour":
      noise(0.32, 0.035, 0, 1200);
      tone(392, 0.28, 0.05, 0.08);
      tone(587, 0.28, 0.05, 0.2);
      break;
    case "perfect":
      [659, 880, 1175].forEach((f, i) => tone(f, 0.28, 0.06, i * 0.09));
      break;
    case "bust":
      noise(0.34, 0.075, 0, 120);
      tone(120, 0.55, 0.09, 0, "sawtooth");
      tone(72, 0.65, 0.08, 0.1, "triangle");
      break;
    case "finish":
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.46, 0.07, i * 0.1));
      break;
  }
}

export function useBrewAudio() {
  const [enabled, setEnabledState] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  });
  const enabledRef = useRef(enabled);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    enabledRef.current = next;
    if (typeof window !== "undefined") window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    if (next) context();
  }, []);

  const play = useCallback((cue: BrewCue) => {
    if (enabledRef.current) playBrewCue(cue);
  }, []);

  return { enabled, setEnabled, play };
}
