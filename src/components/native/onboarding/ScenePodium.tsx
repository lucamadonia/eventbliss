/**
 * ScenePodium — Folie 7: die Siegerehrung. Nutzt das ECHTE `TVPartyPodium`
 * (dasselbe Bauteil wie im TV-Finale), gefuettert mit dem erfundenen
 * Spielstand aus `onboarding-data.ts` — keine eigene Nachbildung noetig,
 * das Bauteil traegt seine Fluid-Groessen schon bis auf Telefonbreite herab.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TVPartyPodium from "@/games/tv/components/TVPartyPodium";
import { ONBOARDING_STANDINGS } from "./onboarding-data";

export function ScenePodium() {
  const { t } = useTranslation();
  // Kurze Verzoegerung, damit der Aufdeck-Beat des Podiums sichtbar ablaeuft,
  // statt schon im ersten Frame komplett offen dazustehen.
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReveal(true), 150);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className="w-full rounded-3xl p-5 pt-8 shadow-lg"
      style={{ background: "linear-gradient(160deg, #1a0f2e, #0b0716)" }}
    >
      <div className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 mb-4">
        {t("native.onboarding.scene.podium.heading")}
      </div>
      <TVPartyPodium entries={ONBOARDING_STANDINGS} reveal={reveal} showDelta variant="preview" compact />
    </div>
  );
}
