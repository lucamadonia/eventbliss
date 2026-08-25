import { useEffect, useState } from "react";

/**
 * Laedt ein Bild still vor und meldet nur, OB es da ist.
 *
 * Die Hausregel dieses Projekts fuer Stimmungsbilder: das Bild ist Kuer, der
 * Verlauf darunter traegt. `TVPartyMap` sagt es im Kopf so ("Der Hintergrund
 * ist Stimmung, kein Inhalt"), und `SplashExperience` laeuft bis heute
 * absichtlich ohne seine Dateien. Deshalb meldet dieser Hook nie einen Fehler
 * nach aussen — er sagt `false`, und der Aufrufer zeichnet einfach ohne Bild.
 *
 * Herausgeloest aus SplashExperience.tsx, damit BrewAtmosphere ihn mitbenutzt,
 * statt ihn zu kopieren.
 */
export function useOptionalImage(src: string): boolean {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    const img = new Image();
    img.onload = () => { if (!cancelled) setLoaded(true); };
    img.onerror = () => { if (!cancelled) setLoaded(false); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return loaded;
}
