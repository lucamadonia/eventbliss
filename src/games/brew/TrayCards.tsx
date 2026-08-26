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
import { useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { INGREDIENTS, ingredientKey, type IngredientId, type Skin } from "./brew-content";
import { ingredientPlate } from "./BrewFX";
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
  /**
   * Welche Karte gebraucht wird — eine Angabe pro Karte, in Reihenfolge.
   *
   * WARUM: Die zentrale Frage des Spiels lautet "brauche ich das?", und sie war
   * nirgends beantwortet — man musste 5-7 Rezeptsymbole gegen bis zu sieben
   * Tablettkarten pixelweise abgleichen, ohne Namen und ohne Farbe.
   *
   * BEWUSST VON AUSSEN, nicht hier gerechnet: Auf dem TABLETT konkurrieren die
   * Karten miteinander — eine doppelt gezogene Zutat ist beim zweiten Mal
   * Ballast, und diese Regel gehoert `splitTray` in deck.ts, nicht einer
   * zweiten Fassung in der Darstellung. Auf der THEKE gilt das Gegenteil: man
   * nimmt nur eine Karte, also ist jede fuer sich zu beurteilen.
   */
  marks?: boolean[];
  emptyLabel?: string;
  className?: string;
  /**
   * Meldet laufend, wo die Karten gerade liegen.
   *
   * WARUM LAUFEND UND NICHT ERST BEIM EINGIESSEN: Danach ist die Reihe leer,
   * ein Effekt misst also zu spaet. Und online klickt der Gast gar nicht — bei
   * ihm leert derselbe Schnappschuss das Tablett, der den Guss ankuendigt. Nur
   * ein staendig aktueller Zwischenspeicher kennt beide Faelle.
   */
  onGeometry?: (rects: DOMRect[]) => void;
}

export function TrayCards({ ids, skin, onTake, disabled, marks, emptyLabel, className, onGeometry }: TrayCardsProps) {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  useLayoutEffect(() => {
    if (!onGeometry) return;
    onGeometry(cardRefs.current.slice(0, ids.length).map((el) => el?.getBoundingClientRect() as DOMRect).filter(Boolean));
  });
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
          const wanted = marks?.[i] ?? false;
          const plate = ingredientPlate(INGREDIENTS[id].color);
          const Comp: typeof motion.div | typeof motion.button = onTake ? motion.button : motion.div;
          return (
            <Comp
              key={`${id}-${i}`}
              ref={(el: HTMLElement | null) => { cardRefs.current[i] = el; }}
              {...cardMotion}
              layout={!reduce}
              onClick={onTake ? () => onTake(id, i) : undefined}
              disabled={onTake ? disabled : undefined}
              title={name}
              className={cn(
                // 72 statt 48 Pixel breit, und der NAME steht darunter.
                // Vorher: 48-px-Karte mit 36-px-Motiv, den Namen gab es nur im
                // aria-label. Auf dem Telefon war jede Zutat damit ein
                // Farbfleck — "man weiss nicht was es ist".
                "relative w-[72px] rounded-2xl flex flex-col items-center gap-1 pt-2 pb-1.5 px-1 shrink-0",
                onTake && !disabled && "cursor-pointer active:scale-90 transition-transform",
                onTake && disabled && "opacity-40 cursor-not-allowed",
                // Ballast tritt zurueck, sobald ueberhaupt markiert wird.
                marks && !wanted && "opacity-55 saturate-50",
              )}
              style={{
                ...plate,
                ...(wanted
                  ? { boxShadow: `inset 0 0 0 2px ${INGREDIENTS[id].color}, 0 0 14px -2px ${INGREDIENTS[id].color}` }
                  : {}),
              }}
              aria-label={name}
            >
              <IngredientIcon id={id} skin={skin} className="w-12 h-12" emojiSize="2rem" />
              {/* Der Name IST die Erklaerung. Zwei Zeilen reichen fuer jede
                  Zutat in allen zehn Sprachen ("Spinnenweb-Extrakt",
                  "Coconut Cream"); laengeres wird abgeschnitten statt die
                  Karte zu sprengen. */}
              <span
                className="w-full text-[10px] leading-tight font-bold text-center line-clamp-2 break-words"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                {name}
              </span>
            </Comp>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
