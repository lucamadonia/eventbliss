/**
 * ExtrasSheet — the "fine print" editor: no-gos and focus points.
 * Simple add/remove list UI (ported from FormBuilderTab) dispatching SET_LIST.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { StudioSheet } from "./StudioSheet";
import type { FormStudioAction } from "./formStudioReducer";
import type { EventSettings } from "@/lib/survey-config";
import { useHaptics } from "@/hooks/useHaptics";

interface ListEditorProps {
  title: string;
  accent: "destructive" | "success";
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}

function ListEditor({ title, accent, items, placeholder, onChange }: ListEditorProps) {
  const haptics = useHaptics();
  const [value, setValue] = useState("");
  const add = () => {
    const v = value.trim();
    if (!v) return;
    haptics.select();
    onChange([...items, v]);
    setValue("");
  };
  const bg = accent === "destructive" ? "bg-destructive/10" : "bg-success/10";
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{title}</label>
      <div className="mb-3 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.div
              key={`${item}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`flex items-center justify-between rounded-lg ${bg} p-2.5`}
            >
              <span className="text-sm text-foreground">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          onClick={add}
          disabled={!value.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ExtrasSheetProps {
  open: boolean;
  settings: EventSettings;
  dispatch: React.Dispatch<FormStudioAction>;
  onClose: () => void;
  flush: () => void;
}

export function ExtrasSheet({ open, settings, dispatch, onClose, flush }: ExtrasSheetProps) {
  const { t } = useTranslation();
  return (
    <StudioSheet open={open} onClose={onClose} flush={flush} emoji="📝" title={t("formStudio.extras", "No-Gos & Fokus")}>
      <div className="space-y-6">
        <ListEditor
          title={`❌ ${t("dashboard.form.noGos.title", "No-Gos")}`}
          accent="destructive"
          items={settings.no_gos ?? []}
          placeholder={t("dashboard.form.noGos.placeholder", "z. B. keine Peinlichkeiten")}
          onChange={(items) => dispatch({ type: "SET_LIST", key: "no_gos", items })}
        />
        <ListEditor
          title={`✨ ${t("dashboard.form.focusPoints.title", "Fokuspunkte")}`}
          accent="success"
          items={settings.focus_points ?? []}
          placeholder={t("dashboard.form.focusPoints.placeholder", "z. B. gutes Essen")}
          onChange={(items) => dispatch({ type: "SET_LIST", key: "focus_points", items })}
        />
      </div>
    </StudioSheet>
  );
}
