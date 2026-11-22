import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronDown, EyeOff, Globe, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AREA_ENTRIES, type AreaEntry } from "./areas";
import type { SwitchSpec } from "./useVisibilityFlags";

interface Props {
  isLoading: boolean;
  isHidden: (key: string) => boolean;
  onChange: (specs: SwitchSpec[], hidden: boolean) => Promise<boolean>;
}

export function AreaSwitches({ isLoading, isHidden, onChange }: Props) {
  const { t } = useTranslation();

  const titleOf = (entry: AreaEntry) => t(`admin.visibility.areas.${entry.id}.title`, entry.title);

  /** Single toggles are never confirmed; the toast offers the way back instead. */
  const setVisible = async (entry: AreaEntry, visible: boolean, undoable = true) => {
    const ok = await onChange([{ key: entry.key, name: entry.name, description: entry.description }], !visible);
    if (!ok) return;
    const message = visible
      ? t("admin.visibility.nowVisible", "{{name}} ist wieder sichtbar", { name: titleOf(entry) })
      : t("admin.visibility.nowHidden", "{{name}} ist ausgeblendet", { name: titleOf(entry) });
    toast.success(message, undoable
      ? { action: { label: t("admin.visibility.undo", "Rückgängig"), onClick: () => void setVisible(entry, !visible, false) } }
      : undefined);
  };

  return (
    <section aria-labelledby="visibility-areas" className="space-y-4">
      <h3 id="visibility-areas" className="text-lg font-bold tracking-tight">{t("admin.visibility.areas.title", "App-Bereiche")}</h3>

      <div className="grid gap-3 md:grid-cols-2">
        {AREA_ENTRIES.map((entry) => {
          if (isLoading) {
            return (
              <div key={entry.id} className="space-y-3 rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            );
          }
          const hidden = isHidden(entry.key);
          const switchId = `area-switch-${entry.id}`;
          const ScopeIcon = entry.scope === "app" ? Smartphone : Globe;
          return (
            <article key={entry.id} className="rounded-2xl border bg-card transition-colors duration-200 motion-reduce:transition-none">
              {/* The whole upper part is the touch target for the switch. */}
              <label htmlFor={switchId} className="flex min-h-11 cursor-pointer items-start gap-4 p-4 pb-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{titleOf(entry)}</span>
                    {hidden && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                        <EyeOff className="h-3 w-3" aria-hidden />
                        {t("admin.visibility.hidden", "Ausgeblendet")}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-sm leading-relaxed text-muted-foreground transition-opacity duration-200 motion-reduce:transition-none", !hidden && "opacity-80")}>
                    {hidden
                      ? t(`admin.visibility.areas.${entry.id}.effect`, entry.effect)
                      : t("admin.visibility.areas.ifHidden", "Wenn ausgeblendet: {{effect}}", { effect: t(`admin.visibility.areas.${entry.id}.effect`, entry.effect) })}
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ScopeIcon className="h-3.5 w-3.5" aria-hidden />
                    {entry.scope === "app"
                      ? t("admin.visibility.areas.scopeApp", "Wirkt nur in der App (iOS und Android)")
                      : t("admin.visibility.areas.scopeAll", "Wirkt auf der Website und in der App")}
                  </p>
                </div>
                <Switch
                  id={switchId}
                  checked={!hidden}
                  onCheckedChange={(visible) => void setVisible(entry, visible)}
                  aria-label={hidden
                    ? t("admin.visibility.areas.showLabel", "Bereich {{name}} einblenden", { name: titleOf(entry) })
                    : t("admin.visibility.areas.hideLabel", "Bereich {{name}} ausblenden", { name: titleOf(entry) })}
                  className="mt-0.5 shrink-0"
                />
              </label>

              <details className="group border-t px-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {t("admin.visibility.areas.where", "Wo wirkt das?")}
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                </summary>
                <ul className="list-disc space-y-1.5 pb-3 pl-5 text-sm text-muted-foreground">
                  {entry.places.map((place, index) => (
                    <li key={place}>{t(`admin.visibility.areas.${entry.id}.places.${index}`, place)}</li>
                  ))}
                </ul>
                <p className="pb-4 text-xs text-muted-foreground">
                  {t("admin.visibility.technicalKey", "Technischer Schlüssel")}: <code className="font-mono">{entry.key}</code>
                </p>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
