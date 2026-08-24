/**
 * SceneNightRoute — Folie 6: der Fernseher wird zur Buehne. Das ist die
 * ECHTE `TVPartyMap`-Komponente, keine Nachbildung.
 *
 * DAS PROBLEM: `TVPartyMap` ist fuer 16:9-Fernseher gebaut und misst
 * Medaillons in `vw` (Breite des BILDSCHIRMS) statt Breite des Containers.
 * In einem Handy-schmalen Rahmen waeren die Medaillons riesig, weil `vw` auf
 * einem Telefon winzig ist und jede Groesse auf ihrem Mindestwert landet.
 *
 * DIE LOESUNG: die Komponente in ihrer echten Zielgroesse (1280x720) in einem
 * unsichtbaren Block rendern und den ganzen Block per CSS-Transform auf die
 * Rahmengroesse herunterskalieren. Dasselbe Prinzip wie ein Bild-im-Bild-
 * Vorschaufenster — es ist derselbe Fernseher, nur verkleinert.
 */
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import TVPartyMap from "@/games/tv/components/TVPartyMap";
import { ONBOARDING_ACTIVE_INDEX, ONBOARDING_STANDINGS, buildOnboardingPlaylist } from "./onboarding-data";

/** Zielgroesse, fuer die die Nacht-Route gerechnet ist — siehe party-map.ts. */
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

export function SceneNightRoute() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / STAGE_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const playlist = buildOnboardingPlaylist(t);

  return (
    <div
      ref={frameRef}
      className="relative w-full aspect-video overflow-hidden rounded-[18px] border-[6px] border-[#1a1522] bg-[#060810] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.6)]"
    >
      {/* Kamera-Punkt oben in der Blende — macht aus dem Rahmen erkennbar
          einen Fernseher statt nur eine abgerundete Kachel. */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/15 z-10" aria-hidden />

      {scale > 0 && (
        <div
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <TVPartyMap
            playlist={playlist}
            index={ONBOARDING_ACTIVE_INDEX}
            standings={ONBOARDING_STANDINGS}
            travel={!reduce}
          />
        </div>
      )}
    </div>
  );
}
