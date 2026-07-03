/**
 * StudioHeader — Form Studio title bar: title, autosave chip, and a segmented
 * Edit | Preview control (layoutId gradient pill, like the dashboard tabs).
 */
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SaveStatusChip } from "./SaveStatusChip";
import type { SaveState } from "./formStudioReducer";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type StudioMode = "edit" | "preview";

interface StudioHeaderProps {
  mode: StudioMode;
  onMode: (mode: StudioMode) => void;
  saveState: SaveState;
  onRetry: () => void;
}

export function StudioHeader({ mode, onMode, saveState, onRetry }: StudioHeaderProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();

  const segments: { id: StudioMode; label: string }[] = [
    { id: "edit", label: t("formStudio.edit", "Bearbeiten") },
    { id: "preview", label: t("formStudio.preview", "Vorschau") },
  ];

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate font-display text-2xl font-bold text-foreground">
          {t("formStudio.title", "Form Studio")}
        </h2>
        <div className="mt-1">
          <SaveStatusChip saveState={saveState} onRetry={onRetry} />
        </div>
      </div>

      {/* Segmented Edit | Preview */}
      <div className="flex shrink-0 rounded-full border border-border bg-foreground/[0.04] p-0.5">
        {segments.map((s) => {
          const active = mode === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (active) return;
                haptics.medium();
                onMode(s.id);
              }}
              aria-pressed={active}
              className={cn(
                "relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active ? "text-white" : "text-muted-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="studio-mode-pill"
                  className="absolute inset-0 -z-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_16px_rgba(139,92,246,0.35)]"
                  transition={spring.snappy}
                />
              )}
              <span className="relative z-10">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
