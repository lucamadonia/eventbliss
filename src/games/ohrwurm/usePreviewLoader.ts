// OHRWURM — verborgene 30-s-Vorschau zur gezogenen Karte aufloesen.
//
// Robustheit ist hier kritisch: ohne Clip läuft die Runde stumm, der Spieler
// muss blind raten und verliert die Karte. Deshalb:
//  - Session-Cache (gleicher Song bei Tausch/Rematch → kein zweiter Call,
//    entlastet zusätzlich das iTunes-IP-Limit von ~20 Anfragen/Minute),
//  - `error` von functions.invoke wirklich auswerten (invoke wirft NICHT bei
//    Non-2xx — der frühere catch-Block war für HTTP-Fehler toter Code),
//  - EIN Retry mit kurzem Backoff bei transienten Fehlern (401/429/5xx),
//  - Timeout, damit previewLoading nie hängen bleibt.
import { useCallback, useState, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import type { Song } from './ohrwurm-engine';

const PREVIEW_TIMEOUT_MS = 8_000; // Vorschau-Lookup abbrechen, statt ewig zu laden
const PREVIEW_RETRY_MS = 700;     // Backoff vor dem einzigen Retry

// Session-Cache für aufgelöste Vorschau-URLs (songId → URL oder null).
// Bewusst modul-global: überlebt Rematch/Remount innerhalb derselben Seite und
// spart iTunes-Aufrufe (deren IP-Limit von ~20/min teilen sich ALLE Nutzer über
// die gemeinsame Supabase-Egress-IP — die Hauptursache stummer Runden).
const previewCache = new Map<string, string | null>();

/** Promise mit harter Zeitgrenze — verhindert hängendes `previewLoading`. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => { window.clearTimeout(id); resolve(v); },
      (e) => { window.clearTimeout(id); reject(e); },
    );
  });
}

export function usePreviewLoader(drawIdRef: MutableRefObject<number>, flash: (msg: string) => void) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const loadPreview = useCallback(async (s: Song, myDraw: number) => {
    // Kommt die Vorschau schon aus der Datenbank (Chart-Pipeline), gibt es
    // nichts zu holen. Das ist der eigentliche Fix gegen stumme Runden: kein
    // iTunes-Aufruf pro Runde, also auch keine Drossel bei ~20 Anfragen/Minute
    // auf der geteilten Egress-IP.
    if (s.previewUrl) {
      previewCache.set(s.id, s.previewUrl);
      setPreviewUrl(s.previewUrl);
      setPreviewLoading(false);
      return;
    }
    const cached = previewCache.get(s.id);
    if (cached !== undefined) {
      setPreviewUrl(cached);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    setPreviewUrl(null);

    let transient = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => window.setTimeout(r, PREVIEW_RETRY_MS));
        if (drawIdRef.current !== myDraw) return; // Runde ist weitergelaufen
      }
      try {
        const res = await withTimeout(
          supabase.functions.invoke('ohrwurm-preview', {
            body: { artist: s.artist, title: s.title },
          }),
          PREVIEW_TIMEOUT_MS,
        );
        if (drawIdRef.current !== myDraw) return; // veraltete Antwort verwerfen
        const data = res.data as { previewUrl?: string | null; reason?: string } | null;
        if (res.error) { transient = true; continue; }
        const url = data?.previewUrl ?? null;
        if (url) {
          previewCache.set(s.id, url);
          setPreviewUrl(url);
          setPreviewLoading(false);
          return;
        }
        // Kein Treffer: `reason` heißt "Upstream-Problem" (Drossel/Ausfall) →
        // retryfähig und NICHT cachen. Ohne reason ist der Song echt nicht
        // auffindbar → negativ cachen, damit wir es nicht erneut versuchen.
        if (data?.reason) { transient = true; continue; }
        previewCache.set(s.id, null);
        setPreviewUrl(null);
        setPreviewLoading(false);
        return;
      } catch {
        if (drawIdRef.current !== myDraw) return;
        transient = true;
      }
    }

    if (drawIdRef.current !== myDraw) return;
    setPreviewUrl(null);
    setPreviewLoading(false);
    if (transient) flash(t('games.ohrwurm.previewFailed'));
  }, [flash, t]);
  return { previewUrl, setPreviewUrl, previewLoading, loadPreview };
}
