/**
 * ScenePartyMode — Folie 5: das Besondere an EventBliss zeigen, nicht
 * behaupten. Die Kacheln benutzen die ECHTEN Spiel-Artworks aus
 * `public/images/games/*.webp` (ueber `playableGames`), erledigt/jetzt/kommt-
 * noch spiegelt dieselbe Logik wie `PartySetlistStrip`, und der Punktestand
 * laeuft beim Erscheinen hoch — ueber alle Spiele hinweg, nicht pro Spiel.
 */
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { playableGames } from "@/lib/playable-games";
import { ONBOARDING_ACTIVE_INDEX, ONBOARDING_GAME_IDS, sceneMotion } from "./onboarding-data";

const TARGET_POINTS = 340;

export function ScenePartyMode() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { stagger, item } = sceneMotion(!!reduce);
  const [points, setPoints] = useState(reduce ? TARGET_POINTS : 0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setPoints((p) => {
        const next = p + 17;
        if (next >= TARGET_POINTS) window.clearInterval(id);
        return Math.min(TARGET_POINTS, next);
      });
    }, 40);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="w-full rounded-3xl p-4 shadow-lg"
      style={{ background: "linear-gradient(160deg, #1a0f2e, #0b0716)" }}
    >
      <motion.div variants={item} className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
          {t("nativeExtra.partyNight.setlistHeading")}
        </span>
        <span className="text-sm font-black tabular-nums text-[#f9ca24]">
          {points} {t("native.onboarding.scene.partyMode.scoreLabel")}
        </span>
      </motion.div>

      <div className="flex gap-2.5">
        {ONBOARDING_GAME_IDS.map((id, i) => {
          const game = playableGames.find((g) => g.id === id)!;
          const done = i < ONBOARDING_ACTIVE_INDEX;
          const active = i === ONBOARDING_ACTIVE_INDEX;
          return (
            <motion.div key={id} variants={item} className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
              <div
                className="relative w-full aspect-square rounded-2xl overflow-hidden"
                style={{
                  border: active ? "2px solid #df8eff" : "2px solid rgba(255,255,255,0.08)",
                  boxShadow: active ? "0 0 24px -4px #df8eff" : undefined,
                  filter: done ? "grayscale(0.7) brightness(0.6)" : undefined,
                }}
              >
                <img src={game.image} alt="" className="w-full h-full object-cover" />
                {done && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white/90" aria-hidden />
                  </div>
                )}
              </div>
              <span
                className="text-[9px] font-bold uppercase text-center leading-tight truncate w-full"
                style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.4)" }}
              >
                {t(game.nameKey)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
