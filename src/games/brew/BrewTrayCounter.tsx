/**
 * Tablett (Risiko) und Theke (Angebot) — aus BrewGame ausgelagert.
 */
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";
import { TrayCards } from "./TrayCards";
import { TrayTip } from "./BrewFX";
import type { BrewPalette } from "./brew-palette";
import type { BrewRiskTier } from "./brew-gameplay";
import type { PourPlan } from "./PourFlight";
import type { IngredientId } from "./deck";
import type { Skin } from "./brew-content";

export interface BrewTrayCounterProps {
  skin: Skin;
  theme: BrewPalette;
  accent: string;
  riskTier: BrewRiskTier;
  withTray: boolean;
  tray: IngredientId[];
  pourFreeze: IngredientId[] | null;
  pourPlan: PourPlan | null;
  trayMarks: boolean[];
  onTrayGeometry: (rects: DOMRect[]) => void;
  bustTrayCount: number;
  bustTrigger: number;
  counter: IngredientId[];
  counterMarks: boolean[];
  counterTaken: boolean;
  counterBoxRef: RefObject<HTMLDivElement>;
  onTake: (id: IngredientId, index: number) => void;
  isMyTurn: boolean;
  drawnCard: unknown;
}

export function BrewTrayCounter({ skin, theme, accent, riskTier, withTray, tray, pourFreeze, pourPlan, trayMarks, onTrayGeometry, bustTrayCount, bustTrigger,
  counter, counterMarks, counterTaken, counterBoxRef, onTake, isMyTurn, drawnCard }: BrewTrayCounterProps) {
  const { t } = useTranslation();
  return (
    <>
    {/* Tablett — bewusst als eigener Behaelter mit warnfarbenem Rand.
        Vorher sahen Rezept, Tablett und Theke aus wie dreimal dieselbe
        Kartenreihe, obwohl sie Ziel, Risiko und Angebot bedeuten. */}
    <div className="relative z-10 px-4 mt-4">
      <p className="text-[13px] font-black mb-2 flex items-center gap-2" style={{ color: theme.dim }}>
        {t(withTray ? "games.brew.trayLabel" : "games.brew.directCardLabel")}
        <span className="font-bold normal-case tracking-normal" style={{ color: withTray ? theme.bad : theme.dim }}>
          {t(withTray ? "games.brew.trayNote" : "games.brew.directCardHint")}
        </span>
        {withTray && <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px]"
          style={{ color: riskTier === "critical" ? theme.bad : accent, background: `${riskTier === "critical" ? theme.bad : accent}12` }}>
          <Flame className="h-3 w-3" /> {t(`games.brew.risk.${riskTier}`)}
        </span>}
      </p>
      <div className="relative rounded-2xl p-2" style={{ border: `1px ${withTray ? 'dashed' : 'solid'} ${withTray ? theme.bad : accent}55`, background: withTray ? "rgba(251,113,133,0.04)" : `${accent}0a` }}>
        <TrayCards
          // Waehrend der Sortierphase bleibt die alte Reihe stehen — die
          // Wahrheit ist bereits gewechselt, nur das Bild wartet.
          ids={pourFreeze ?? tray}
          skin={skin}
          marks={pourFreeze && pourPlan
            ? pourFreeze.map((_, i) => i < pourPlan.used.length)
            : trayMarks}
          onGeometry={onTrayGeometry}
          emptyLabel={t(withTray ? "games.brew.trayEmpty" : "games.brew.directCardEmpty")}
        />
        {/* Bust: das Tablett kippt sichtbar, bevor die Strafe erscheint. */}
        {withTray && <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-4">
          <TrayTip cards={bustTrayCount} trigger={bustTrigger} skin={skin} size={0.7} />
        </div>}

      </div>
    </div>

    {/* Theke */}
    <div className="relative z-10 px-4 mt-4">
      <p className="text-[13px] font-black mb-2 flex items-baseline gap-2" style={{ color: theme.dim }}>
        {skin === "brew" ? t("games.brew.counterLabelBrew") : t("games.brew.counterLabelBar")}
        <span className="font-bold normal-case tracking-normal" style={{ color: theme.dim }}>
          {t("games.brew.counterNote")}
        </span>
      </p>
      <div ref={counterBoxRef} className="min-h-[3.5rem]">
      <TrayCards
        ids={counter}
        skin={skin}
        onTake={onTake}
        disabled={counterTaken || !isMyTurn || !!drawnCard || !!pourPlan}
        disabledIndices={withTray ? undefined : counterMarks.map(mark => !mark)}
        marks={counterMarks}
        emptyLabel={t("games.brew.counterEmpty")}
      />
      </div>
      {counterTaken && counter.length > 0 && (
        <p className="text-[13px] mt-1" style={{ color: theme.dim }}>{t("games.brew.counterUsed")}</p>
      )}
    </div>

    </>
  );
}
