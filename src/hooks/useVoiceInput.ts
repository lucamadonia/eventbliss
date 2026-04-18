import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the not-yet-standardized Web Speech API.
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
}
interface SpeechRecognitionEvent extends Event {
  results: { length: number; [index: number]: SpeechRecognitionResult };
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface VoiceInputState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  start: (opts?: { lang?: string }) => void;
  stop: () => void;
  reset: () => void;
}

/**
 * useVoiceInput — thin wrapper around Web Speech API for short,
 * single-shot dictation (description fields, quick notes). Falls back
 * gracefully with isSupported=false on Safari/Firefox desktop without
 * the API.
 */
export function useVoiceInput(): VoiceInputState {
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const Ctor = getRecognitionCtor();
  const isSupported = !!Ctor;

  useEffect(() => () => recogRef.current?.abort(), []);

  const start = useCallback(
    ({ lang = "de-DE" }: { lang?: string } = {}) => {
      if (!Ctor) {
        setError("Spracheingabe in diesem Browser nicht verfügbar.");
        return;
      }
      try {
        const r = new Ctor();
        r.lang = lang;
        r.continuous = false;
        r.interimResults = true;
        r.onresult = (e) => {
          let final = "";
          let inter = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            const t = res[0].transcript;
            if (res.isFinal) final += t;
            else inter += t;
          }
          if (final) setTranscript((prev) => (prev ? prev + " " : "") + final.trim());
          setInterim(inter);
        };
        r.onerror = (e) => {
          setError(
            e.error === "not-allowed"
              ? "Mikrofonzugriff verweigert."
              : `Fehler: ${e.error}`,
          );
          setIsListening(false);
        };
        r.onend = () => {
          setIsListening(false);
          setInterim("");
        };
        recogRef.current = r;
        setError(null);
        setIsListening(true);
        r.start();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setIsListening(false);
      }
    },
    [Ctor],
  );

  const stop = useCallback(() => {
    recogRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return { isSupported, isListening, transcript, interim, error, start, stop, reset };
}
