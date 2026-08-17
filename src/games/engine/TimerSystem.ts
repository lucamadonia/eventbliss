import { useState, useEffect, useCallback, useMemo, useRef } from "react";

export function useGameTimer(initialSeconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  // Verhindert doppeltes Auslösen desselben Nulldurchgangs.
  const expiredRef = useRef(false);

  // Tick. Der State-Updater bleibt bewusst FREI von Seiteneffekten: React darf
  // Updater erneut ausführen, und ein onExpire() darin feuerte dadurch mehrfach
  // (in OHRWURM wurden so zwei beginTurn() geplant → ein Spieler übersprungen).
  // Die Deps hängen außerdem nicht mehr an timeLeft — sonst wurde das Intervall
  // jede Sekunde abgerissen und neu gesetzt, was die Uhr driften ließ.
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Ablauf als eigener Effekt — garantiert genau einmal pro Nulldurchgang.
  useEffect(() => {
    if (timeLeft > 0) { expiredRef.current = false; return; }
    if (!isRunning || expiredRef.current) return;
    expiredRef.current = true;
    setIsRunning(false);
    onExpireRef.current();
  }, [timeLeft, isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((seconds?: number) => {
    expiredRef.current = false;
    setTimeLeft(seconds ?? initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  const percentLeft = initialSeconds > 0 ? (timeLeft / initialSeconds) * 100 : 0;

  // Stabile Referenz: vorher erzeugte JEDER Render des aufrufenden Spiels ein
  // neues Objekt, was alle useCallback/useEffect mit `timer` in den Deps unnötig
  // invalidierte. Jetzt ändert es sich nur noch mit dem Timer-Zustand selbst.
  return useMemo(
    () => ({ timeLeft, isRunning, start, pause, reset, percentLeft }),
    [timeLeft, isRunning, start, pause, reset, percentLeft],
  );
}

// NOTE: BombGame has its own useBombTimer (different signature/semantics) in
// src/games/bomb/BombGame.tsx. The unused engine variant was removed so the
// two can't be confused.
