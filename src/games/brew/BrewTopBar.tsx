/**
 * Kopfzeile + Mini-Glaeser aller Mitspielenden (aus BrewGame ausgelagert).
 */
import { useTranslation } from "react-i18next";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasShellBackButton } from "../ui/shell-back";
import { Glass } from "./Glass";
import { shapeForRecipe } from "./glass-shapes";
import { POUR_BEATS } from "./BrewFX";
import type { BrewPalette } from "./brew-palette";
import type { PourPlan } from "./PourFlight";
import type { DealtRecipe, IngredientId } from "./deck";
import type { Skin } from "./brew-content";

export interface BrewTopBarProps {
  onLeave: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  theme: BrewPalette;
  accent: string;
  activeName: string;
  cardsRemaining: number;
  players: { id: string; name: string; color: string; recipe: DealtRecipe; glass: IngredientId[] }[];
  activeIdx: number;
  skin: Skin;
  pourPlan: PourPlan | null;
}

export function BrewTopBar({ onLeave, onToggleSound, soundEnabled, theme, accent, activeName, cardsRemaining, players, activeIdx, skin, pourPlan }: BrewTopBarProps) {
  const { t } = useTranslation();
  return (
    <>
    {/* Kopf */}
    <div className="relative z-10 px-4 pt-14 pb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <button
        onClick={onLeave}
        className={cn("flex items-center gap-1 text-xs font-bold", hasShellBackButton() && "invisible pointer-events-none")}
        aria-hidden={hasShellBackButton()}
        tabIndex={hasShellBackButton() ? -1 : undefined}
        style={{ color: theme.dim }}
      >
        <ArrowLeft className="w-4 h-4" /> {t("games.brew.leave")}
      </button>
      <div className="text-xs font-bold" style={{ color: theme.dim }}>
        {t("games.brew.turnOf", { name: activeName })}
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="text-xs font-bold" style={{ color: accent }}>
          {t("games.brew.deckCount", { count: cardsRemaining })}
        </div>
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={t(soundEnabled ? "games.brew.soundOff" : "games.brew.soundOn")}
          className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/20"
          style={{ color: theme.dim }}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>
    </div>

    {/* Mini-Gläser aller Mitspieler:innen */}
    <div className="relative z-10 px-4 flex gap-3 overflow-x-auto pb-2">
      {players.map((p, i) => (
        <div key={p.id} className="flex flex-col items-center shrink-0" style={{ opacity: i === activeIdx ? 1 : 0.55 }}>
          <div
            className="rounded-2xl p-1"
            style={{ border: i === activeIdx ? `2px solid ${p.color}` : "2px solid transparent" }}
          >
            <Glass
              recipeNeeds={p.recipe.needs}
              filled={p.glass}
              skin={skin}
              shape={shapeForRecipe(p.recipe.id, skin)}
              size="sm"
              height={skin === "bar" ? 74 : undefined}
              quality="compact"
              active={i === activeIdx}
              // Dieselbe Verzoegerung wie das grosse Glas — sonst fuellt sich
              // das Miniglas derselben Person 720 ms zu frueh.
              arrivalDelay={pourPlan?.pid === p.id ? POUR_BEATS.depart + POUR_BEATS.flight : 0}
              layerStagger={POUR_BEATS.stagger}
            />
          </div>
          <span dir="auto" className="mt-1 max-w-[72px] line-clamp-2 break-words text-center text-[12px] font-bold leading-tight text-white/85">
            {p.name}
          </span>
        </div>
      ))}
    </div>

    </>
  );
}
