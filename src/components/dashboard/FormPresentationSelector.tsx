import { useTranslation } from "react-i18next";
import { Check, LayoutList, PanelsTopLeft, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandingConfig } from "@/lib/survey-config";

type Presentation = NonNullable<BrandingConfig["presentation"]>;

const OPTIONS = [
  { id: "classic", icon: LayoutList, title: "Alle Fragen", description: "Alles auf einer Seite" },
  { id: "wizard", icon: PanelsTopLeft, title: "Wizard", description: "Schritt für Schritt" },
  { id: "slides", icon: Layers3, title: "Slides", description: "Eine Frage pro Karte" },
] as const;

export function FormPresentationSelector({ value, onChange }: { value?: Presentation; onChange: (value: Presentation) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("formStudio.presentationTitle", "Formular-Darstellung")}</h3>
        <p className="text-xs text-muted-foreground">{t("formStudio.presentationHint", "So erleben Gäste die Fragen. Farben und Bild bleiben separat wählbar.")}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label={t("formStudio.presentationTitle", "Formular-Darstellung")}>
        {OPTIONS.map((option) => {
          const active = (value ?? "classic") === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              className={cn(
                "relative flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition-colors sm:flex-col sm:items-start",
                active ? "border-violet-400 bg-violet-500/10" : "border-border bg-background/50 hover:border-violet-400/40",
              )}
            >
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", active ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground")}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{t(`formStudio.presentation.${option.id}`, option.title)}</span>
                <span className="block text-xs text-muted-foreground">{t(`formStudio.presentationDescription.${option.id}`, option.description)}</span>
              </span>
              {active && <Check className="absolute right-3 top-3 h-4 w-4 text-violet-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
