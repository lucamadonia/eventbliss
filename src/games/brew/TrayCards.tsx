/**
 * TrayCards — eine Reihe Zutatenkarten.
 *
 * Dieselbe Darstellung bedient zwei Rollen in BrewGame.tsx:
 *  - das TABLETT: nur Anzeige, nichts anklickbar (kein `onTake`).
 *  - die THEKE: anklickbar, wer dran ist nimmt sich eine Karte (`onTake`).
 *
 * Zwei getrennte Komponenten wären hier nur derselbe Kartenkörper zweimal
 * gewesen — die einzig echte Abweichung ist "reagiert die Karte auf Tippen".
 */
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ingredientKey, type IngredientId, type Skin } from "./brew-content";
import { IngredientIcon } from "./IngredientIcon";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface TrayCardsProps {
  ids: IngredientId[];
  skin: Skin;
  /** Vorhanden = Karten sind Knöpfe (Theke). Fehlt = reine Anzeige (Tablett). */
  onTake?: (id: IngredientId, index: number) => void;
  /** Theke ist pro Zug nur einmal nutzbar — dann bleiben die Karten sichtbar, aber tot. */
  disabled?: boolean;
  emptyLabel?: string;
  className?: string;
}

export function TrayCards({ ids, skin, onTake, disabled, emptyLabel, className }: TrayCardsProps) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  if (ids.length === 0) {
    return emptyLabel ? (
      <p className="text-xs italic opacity-50 py-2">{emptyLabel}</p>
    ) : null;
  }

  const cardMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, scale: 0.6, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.6 },
        transition: { type: "spring" as const, stiffness: 300, damping: 20 },
      };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <AnimatePresence initial={false}>
        {ids.map((id, i) => {
          const name = t(ingredientKey(id, skin));
          const Comp: typeof motion.div | typeof motion.button = onTake ? motion.button : motion.div;
          return (
            <Comp
              key={`${id}-${i}`}
              {...cardMotion}
              layout={!reduce}
              onClick={onTake ? () => onTake(id, i) : undefined}
              disabled={onTake ? disabled : undefined}
              title={name}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0",
                "bg-white/[0.06] border border-white/10",
                onTake && !disabled && "cursor-pointer active:scale-90 transition-transform hover:bg-white/10",
                onTake && disabled && "opacity-40 cursor-not-allowed",
              )}
              aria-label={name}
            >
              <IngredientIcon id={id} skin={skin} className="w-9 h-9" emojiSize="1.5rem" />
            </Comp>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
