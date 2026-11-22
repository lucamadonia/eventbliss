import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { playableGames } from "@/lib/playable-games";
import { gameFlagKey } from "@/lib/app-switches";
import { AREA_ENTRIES } from "./areas";
import { AreaSwitches } from "./AreaSwitches";
import { GameSwitches } from "./GameSwitches";
import { useVisibilityFlags } from "./useVisibilityFlags";

/**
 * Funktionen ein-/ausblenden: one place for every kill switch an admin may
 * flip. Rows live in `feature_flags`; the app reads them through
 * `useFeatureFlag` / `useHiddenGames`, which cache for 5 minutes.
 */
export default function VisibilityTab() {
  const { t } = useTranslation();
  const flags = useVisibilityFlags();

  const visibleGameCount = playableGames.filter((game) => !flags.isHidden(gameFlagKey(game.id))).length;
  const hiddenAreaCount = AREA_ENTRIES.filter((entry) => flags.isHidden(entry.key)).length;
  const settled = !flags.isLoading && !flags.isError;

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight md:text-3xl">{t("admin.visibility.title", "Funktionen ein-/ausblenden")}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {t("admin.visibility.subtitle", "Lege fest, was Nutzer sehen. Gespeichert wird sofort; geöffnete Apps und Seiten übernehmen es nach spätestens 5 Minuten, laufende Spielrunden und Partys spielen weiter.")}
        </p>
        <div className="pt-1 text-sm font-medium" aria-live="polite">
          {settled ? (
            <p>
              <span className="tabular-nums">
                {t("admin.visibility.summaryGames", "{{visible}} von {{total}} Spielen sichtbar", { visible: visibleGameCount, total: playableGames.length })}
              </span>
              <span aria-hidden className="mx-2 text-muted-foreground">·</span>
              <span className="tabular-nums">
                {hiddenAreaCount === 0
                  ? t("admin.visibility.summaryAreasNone", "kein Bereich ausgeblendet")
                  : hiddenAreaCount === 1
                    ? t("admin.visibility.summaryAreasOne", "1 Bereich ausgeblendet")
                    : t("admin.visibility.summaryAreasMany", "{{count}} Bereiche ausgeblendet", { count: hiddenAreaCount })}
              </span>
            </p>
          ) : flags.isLoading ? (
            <Skeleton className="h-5 w-72 max-w-full" />
          ) : null}
        </div>
      </header>

      {flags.isError ? (
        // No switches on a load error: they would claim "Sichtbar" for rows that were never read.
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-card px-6 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">{t("admin.visibility.loadError", "Der aktuelle Stand konnte nicht geladen werden")}</p>
            <p className="text-sm text-muted-foreground">
              {t("admin.visibility.loadErrorHint", "Es wurde nichts verändert. Prüfe die Verbindung und versuche es erneut.")}
            </p>
            {flags.error?.message && <p className="break-words font-mono text-xs text-muted-foreground">{flags.error.message}</p>}
          </div>
          <Button variant="outline" className="min-h-11 gap-2" onClick={() => void flags.refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("common.retry", "Erneut versuchen")}
          </Button>
        </div>
      ) : (
        <>
          <AreaSwitches isLoading={flags.isLoading} isHidden={flags.isHidden} onChange={flags.setHidden} />
          <GameSwitches isLoading={flags.isLoading} hiddenKeys={flags.hiddenKeys} onChange={flags.setHidden} />
        </>
      )}
    </div>
  );
}
