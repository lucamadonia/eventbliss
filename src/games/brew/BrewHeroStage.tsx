/**
 * Buehne der aktiven Person: Rezept + grosses Glas (aus BrewGame ausgelagert).
 */
import type { RefObject } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrewStageFX } from "./BrewStageFX";
import { Glass } from "./Glass";
import { shapeForRecipe } from "./glass-shapes";
import { ingredientPlate, POUR_BEATS } from "./BrewFX";
import { IngredientIcon } from "./IngredientIcon";
import { INGREDIENTS, ingredientKey, recipeKey, type Skin } from "./brew-content";
import type { BrewPalette } from "./brew-palette";
import type { PourPlan } from "./PourFlight";
import type { DrawnCard } from "./DrawReveal";
import type { DealtRecipe, IngredientId } from "./deck";

export interface BrewHeroStageProps {
  me: { id: string; recipe: DealtRecipe; glass: IngredientId[] };
  skin: Skin;
  theme: BrewPalette;
  accent: string;
  reduceMotion: boolean;
  chainLevel: 0 | 1 | 2 | 3;
  trayHits: number;
  pourAwarded: number;
  glassProgress: number;
  drawnCard: DrawnCard | null;
  pourSeq: number;
  pourPlan: PourPlan | null;
  glassBoxRef: RefObject<HTMLDivElement>;
}

export function BrewHeroStage({ me, skin, theme, accent, reduceMotion, chainLevel, trayHits, pourAwarded, glassProgress, drawnCard, pourSeq, pourPlan, glassBoxRef }: BrewHeroStageProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      className="relative z-10 mt-2 min-h-[430px] overflow-hidden border-y px-4 pb-5 pt-4"
      style={{
        background: `radial-gradient(circle at 50% 42%, ${accent}26 0%, transparent 34%), linear-gradient(180deg, rgba(5,7,16,.22), ${theme.surface} 72%, rgba(3,4,10,.82))`,
        borderColor: `${accent}42`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.1), inset 0 -30px 70px rgba(0,0,0,.24), 0 30px 80px -52px ${accent}`,
      }}
      animate={reduceMotion ? undefined : { boxShadow: chainLevel >= 2
        ? [`inset 0 1px 0 rgba(255,255,255,.08), 0 18px 48px -34px ${accent}`,
           `inset 0 1px 0 rgba(255,255,255,.08), 0 26px 70px -25px ${accent}`,
           `inset 0 1px 0 rgba(255,255,255,.08), 0 18px 48px -34px ${accent}`]
        : `inset 0 1px 0 rgba(255,255,255,.08), 0 24px 60px -42px ${accent}` }}
      transition={{ duration: 1.8, repeat: chainLevel >= 2 ? Infinity : 0, ease: "easeInOut" }}
    >
      <BrewStageFX
        drawnCard={drawnCard}
        pourSeq={pourSeq}
        pouring={!!pourPlan}
        accent={accent}
        danger={theme.bad}
        reduced={!!reduceMotion}
      />
      <div aria-hidden className="absolute inset-0 opacity-60"
        style={{ backgroundImage: `linear-gradient(${accent}0d 1px, transparent 1px), linear-gradient(90deg, ${accent}0d 1px, transparent 1px)`, backgroundSize: "28px 28px", maskImage: "radial-gradient(circle at 50% 44%, black, transparent 72%)" }} />
      <div aria-hidden className="absolute left-1/2 top-[44%] h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{ borderColor: `${accent}30`, boxShadow: `inset 0 0 50px ${accent}12, 0 0 70px ${accent}16` }} />
      <motion.div aria-hidden className="absolute left-1/2 top-[44%] h-[238px] w-[238px] rounded-full border border-dashed"
        style={{ x: "-50%", y: "-50%", borderColor: `${accent}65` }}
        animate={reduceMotion ? undefined : { rotate: chainLevel > 0 ? 360 : 90, scale: chainLevel >= 2 ? [1, 1.035, 1] : 1 }}
        transition={{ rotate: { duration: Math.max(7, 15 - chainLevel * 2), repeat: Infinity, ease: "linear" }, scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } }}
      />
      {[0, 1, 2, 3].map((i) => (
        <motion.span key={i} aria-hidden className="absolute left-1/2 top-[44%] h-2 w-2 rounded-full"
          style={{ background: i < chainLevel ? accent : `${accent}48`, boxShadow: `0 0 16px ${accent}`, x: "-50%", y: "-50%" }}
          animate={reduceMotion ? undefined : { x: [Math.cos(i * Math.PI / 2) * 132, Math.cos(i * Math.PI / 2 + Math.PI) * 132, Math.cos(i * Math.PI / 2) * 132], y: [Math.sin(i * Math.PI / 2) * 132, Math.sin(i * Math.PI / 2 + Math.PI) * 132, Math.sin(i * Math.PI / 2) * 132], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 5.5 + i * 0.4, repeat: Infinity, ease: "linear" }} />
      ))}
      <p className="relative text-center text-[13px] font-black" style={{ color: accent }}>
        {t("games.brew.yourRecipe")} · {t(recipeKey(me.recipe.id, skin))}
      </p>
      <div className="relative flex flex-col items-center">
        <div ref={glassBoxRef} className="relative z-10 mt-1 inline-flex h-[300px] items-end justify-center">
          <motion.div aria-hidden className="absolute bottom-[2%] left-1/2 h-28 w-56 -translate-x-1/2 rounded-full"
            style={{ background: `radial-gradient(ellipse, ${accent}70, ${accent}18 42%, transparent 72%)` }}
            animate={reduceMotion ? undefined : { opacity: [0.42, 0.95, 0.42], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: Math.max(0.8, 2 - chainLevel * 0.28), repeat: Infinity, ease: "easeInOut" }} />
          <Glass
            key={me.id}
            recipeNeeds={me.recipe.needs}
            filled={me.glass}
            skin={skin}
            shape={shapeForRecipe(me.recipe.id, skin)}
            bubbles
            width={skin === "brew" ? "clamp(190px, 56vw, 260px)" : undefined}
            height={skin === "bar" ? "clamp(230px, 38dvh, 292px)" : undefined}
            quality="hero"
            active
            intensity={chainLevel}
            arrivalDelay={pourPlan?.pid === me.id ? POUR_BEATS.depart + POUR_BEATS.flight : 0}
            layerStagger={POUR_BEATS.stagger}
          />
        </div>
        <div className="relative z-10 mt-1 flex w-full justify-center gap-1.5 overflow-x-auto pb-1">
          {me.recipe.needs.map((id) => {
            const owned = me.glass.includes(id);
            return (
              <div
                key={id}
                title={t(ingredientKey(id, skin))}
                className={cn(
                  // Gleiche Karte wie auf Tablett und Theke — mit NAMEN.
                  // Vorher: 44-px-Kachel mit 32-px-Motiv, und wenn die Zutat
                  // fehlte, ein gestrichelter Umriss. Der liess den ganzen
                  // Bildschirm wie einen unfertigen Entwurf wirken.
                  "w-[58px] shrink-0 rounded-xl flex flex-col items-center gap-0.5 pt-1.5 pb-1 px-1 transition-opacity",
                  // Fehlende Zutat tritt zurueck — ueber Saettigung, nicht
                  // ueber eine gestrichelte Linie.
                  !owned && "opacity-45 saturate-[0.35]",
                )}
                style={ingredientPlate(INGREDIENTS[id].color)}
              >
                <IngredientIcon id={id} skin={skin} className="h-9 w-9" emojiSize="1.55rem" />
                <span
                  className="w-full text-[12px] leading-tight font-bold text-center line-clamp-1 break-words"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  {t(ingredientKey(id, skin))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {glassProgress > 0 && (
        <p className="text-[13px] mt-2" style={{ color: theme.dim }}>
          {t("games.brew.missingCount", { count: glassProgress })}
        </p>
      )}
      {chainLevel > 0 && (
        <motion.div initial={false} animate={{ opacity: [0, 1], y: [5, 0] }}
          className="mt-3 flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-[13px] font-black"
          style={{ borderColor: `${accent}45`, color: accent, background: `${accent}12` }}>
          <Sparkles className="h-3.5 w-3.5" />
          {t("games.brew.chain", { count: trayHits })}
          {pourAwarded > 0 && <span>· +{pourAwarded}</span>}
        </motion.div>
      )}
    </motion.div>

  );
}
