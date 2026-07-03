/**
 * SaveStatusChip — compact autosave indicator.
 *  - saved: muted check
 *  - saving/dirty: pulsing dot
 *  - error: tap-to-retry
 */
import { AlertCircle, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { SaveState } from "./formStudioReducer";
import { cn } from "@/lib/utils";

interface SaveStatusChipProps {
  saveState: SaveState;
  onRetry: () => void;
}

export function SaveStatusChip({ saveState, onRetry }: SaveStatusChipProps) {
  const { t } = useTranslation();

  if (saveState === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {t("formStudio.saveError", "Nicht gespeichert — tippen zum Wiederholen")}
      </button>
    );
  }

  if (saveState === "saving" || saveState === "dirty") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
        {t("formStudio.saving", "Speichert…")}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        "bg-foreground/[0.04] text-muted-foreground",
      )}
    >
      <Check className="h-3.5 w-3.5 text-emerald-500" />
      {t("formStudio.saved", "Gespeichert")}
    </span>
  );
}
