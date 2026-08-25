/**
 * IngredientIcon — die EINZIGE Stelle, die je ein Zutatenbild rendert.
 *
 * Aufbau bewusst als zwei Schichten statt als onError-Zustand: das Emoji liegt
 * unten und ist sofort da, das Bild blendet sich darueber, sobald es geladen
 * ist. Damit gibt es kein Leerloch, keinen Layout-Sprung und — falls die Datei
 * fehlt — exakt das Bild von heute. Bei `onError` wird das <img> ganz entfernt,
 * sonst zeigt Safari seine Broken-Image-Glyphe ueber dem Emoji.
 *
 * Der Zugaenglichkeitsname bleibt am Kartenkoerper (title/aria-label dort), das
 * Icon selbst ist rein dekorativ.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { emojiFor, ingredientImage, type IngredientId, type Skin } from "./brew-content";

export interface IngredientIconProps {
  id: IngredientId;
  skin: Skin;
  /** Groesse des Motivs. Entweder ueber Klassen (w-9 h-9) oder ueber style. */
  className?: string;
  style?: React.CSSProperties;
  /** Schriftgroesse der Emoji-Grundschicht, falls sie nicht vom Elternteil kommt. */
  emojiSize?: string;
}

/**
 * Welche Bilder in dieser Sitzung schon geladen wurden.
 *
 * WARUM MODULWEIT: `loaded` startet sonst bei JEDEM Mounten wieder bei false,
 * und das Bild blendet 180 ms lang aus dem Emoji auf. Beim fliegenden Klon der
 * Eingiess-Choreografie mountet dasselbe Bild ein zweites Mal — es wuerde also
 * MITTEN IM FLUG ueberblenden. Nebenbei verschwindet damit dasselbe Flackern
 * bei jedem Neuzeichnen des Tabletts.
 */
const seen = new Set<string>();

export function IngredientIcon({ id, skin, className, style, emojiSize }: IngredientIconProps) {
  const src = ingredientImage(id, skin);
  const [loaded, setLoaded] = useState(() => seen.has(src));
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={style}
      aria-hidden
    >
      <span style={emojiSize ? { fontSize: emojiSize, lineHeight: 1 } : { lineHeight: 1 }}>
        {emojiFor(id, skin)}
      </span>
      {!failed && (
        <img
          src={src}
          alt=""
          aria-hidden
          decoding="async"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 180ms ease-out" }}
          onLoad={() => { seen.add(src); setLoaded(true); }}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
