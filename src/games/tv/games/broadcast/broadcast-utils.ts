import { useEffect, useRef, useState } from 'react';

/**
 * Manche Spiele schicken als „Avatar“ die Initiale (lokale Plaetze). Auf dem
 * Fernseher soll dann das Emoji aus der Teilnehmerliste erscheinen — also
 * Buchstaben/Ziffern verwerfen, damit TVPlayerAvatar nachschlagen kann.
 */
export function emojiAvatar(avatar: string | undefined | null): string | undefined {
  const a = (avatar ?? '').trim();
  if (!a || /^[\p{L}\p{N}]{1,2}$/u.test(a)) return undefined;
  return a;
}

/**
 * Restsekunden bis zu einer Frist, die das Host-Handy mit SEINER Uhr stempelt.
 * Weicht die Fernsehuhr offensichtlich ab (Rest groesser als die ganze Zug-
 * dauer oder deutlich negativ), zaehlt der TV ab Empfang die volle Dauer
 * herunter — besser leicht spaet als komplett falsch. Steht die Uhr (Weitergabe),
 * friert der Wert ein.
 */
export function useDeadlineSeconds(deadline: number | undefined, totalSeconds: number, paused: boolean): number | null {
  const endRef = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline || deadline <= 0 || totalSeconds <= 0) { endRef.current = null; return; }
    const local = Date.now();
    const rest = deadline - local;
    const plausible = rest <= totalSeconds * 1000 + 2500 && rest >= -2500;
    endRef.current = plausible ? deadline : local + totalSeconds * 1000;
    setNow(local);
  }, [deadline, totalSeconds]);

  useEffect(() => {
    if (paused || endRef.current === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [paused, deadline]);

  if (endRef.current === null) return null;
  return Math.max(0, (endRef.current - now) / 1000);
}
