/**
 * IngredientCard — DIE Zutatenkarte. Eine Komponente fuer alle vier
 * Kartenorte: Tablett und Theke auf dem Telefon, Theke und Tablett auf dem
 * Fernseher, dazu die kleinen Rezept-Chips.
 *
 * WARUM ZENTRAL: Vorher teilten sich die vier Orte nur den HINTERGRUND
 * (`ingredientPlate`). Polsterung, Radius, Icongroesse und die Frage, ob ein
 * Name dabeisteht, erfand jeder Ort neu — deshalb war die TV-Karte quadratisch
 * und namenlos, die Telefonkarte hochkant mit einem 10-px-Namen, und die
 * Rezeptanzeige benutzte rohe Emoji auf Vollfarbe statt der vorhandenen
 * Artworks. Genau so laufen vier Orte auseinander.
 *
 * KEINE NEUEN SPRACHSCHLUESSEL: Der Name kommt aus `ingredientKey`, den es in
 * allen zehn Sprachen bereits gibt — `TVBrewView` benutzte ihn schon als
 * `title`, nur eben unsichtbar.
 */
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { ingredientPlate } from "./BrewFX";
import { INGREDIENTS, ingredientKey, type IngredientId, type Skin } from "./brew-content";
import { BREW_PALETTES, brewRadius, type BrewPalette } from "./brew-palette";
import { IngredientIcon } from "./IngredientIcon";

export type CardVariant = "tv" | "phone" | "chip";
export type CardState = "idle" | "wanted" | "muted" | "fresh" | "owned";

export interface IngredientCardProps {
  id: IngredientId;
  skin: Skin;
  variant: CardVariant;
  state?: CardState;
  /** Namensband unten. Auf dem Fernseher aus drei Metern gut lesbar. */
  showName?: boolean;
  /** Breite ueberschreiben, sonst die Vorgabe der Variante. */
  width?: string;
  palette?: BrewPalette;
  className?: string;
}

/** Breite und Iconanteil je Variante. */
const MASSE: Record<CardVariant, { width: string; icon: string; emoji: string; radius: number }> = {
  tv: { width: "clamp(3.4rem, 5.2vw, 5.6rem)", icon: "62%", emoji: "clamp(1.5rem,2.4vw,2.4rem)", radius: brewRadius.md },
  phone: { width: "72px", icon: "48px", emoji: "2rem", radius: brewRadius.md },
  chip: { width: "clamp(1.4rem, 2vw, 2.2rem)", icon: "82%", emoji: "clamp(0.8rem,1.2vw,1.1rem)", radius: brewRadius.sm },
};

function IngredientCardImpl({
  id, skin, variant, state = "idle", showName = false, width, palette, className,
}: IngredientCardProps) {
  const { t } = useTranslation();
  const p = palette ?? BREW_PALETTES[skin];
  const m = MASSE[variant];
  const farbe = INGREDIENTS[id].color;

  const glow = state === "wanted" || state === "fresh" ? "strong" : state === "muted" ? "none" : "soft";
  const platte = ingredientPlate(farbe, p.plateBase, glow);

  return (
    <div
      className={className}
      style={{
        width: width ?? m.width,
        // Hochformat auf Fernseher und Telefon, quadratisch nur als Chip.
        aspectRatio: variant === "chip" ? "1 / 1" : "3 / 4",
        borderRadius: m.radius,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: state === "wanted" || state === "fresh" ? "scale(1.04)" : undefined,
        opacity: state === "muted" ? 0.5 : 1,
        filter: state === "muted" ? "saturate(0.45)" : undefined,
        transition: "transform 180ms ease-out, opacity 180ms ease-out",
        ...platte,
      }}
      title={t(ingredientKey(id, skin))}
    >
      <IngredientIcon
        id={id}
        skin={skin}
        emojiSize={m.emoji}
        style={{
          width: m.icon,
          height: m.icon,
          // Platz fuer das Namensband lassen, sonst sitzt das Icon darauf.
          marginBottom: showName ? "18%" : 0,
        }}
      />

      {showName && (
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            padding: "18% 6% 5%",
            background: "linear-gradient(0deg, rgba(0,0,0,0.62), transparent)",
            color: p.text,
            fontSize: variant === "tv" ? "clamp(0.62rem, 0.82vw, 1rem)" : "10px",
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.1,
            textAlign: "center",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {t(ingredientKey(id, skin))}
        </div>
      )}
    </div>
  );
}

/** Karten ohne geaenderten Zustand bleiben auf dem TV unangetastet. */
export const IngredientCard = memo(IngredientCardImpl);
