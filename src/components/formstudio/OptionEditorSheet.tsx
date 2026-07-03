/**
 * OptionEditorSheet — edit the answer options of ONE core question.
 *
 * Layout: a pinned live preview on top, then the editable option rows (emoji
 * chip + inline label + drag grip + delete), a curated emoji strip that applies
 * to the currently-picked row, an add-option affordance, and a multi-select
 * switch. Policy from questionRegistry decides what's allowed:
 *  - canEditValues=false (DB CHECK-locked values): no add/delete, values-locked
 *    footnote shown; labels & emojis stay editable
 *  - canMultiSelect=false: no single/multi switch
 *  - free users are capped at maxOptionsFree with a premium upsell beyond it
 *
 * The 'activities' question embeds the full AdvancedActivitySelector instead of
 * plain rows. Every edit dispatches SET_OPTIONS / SET_QUESTION_CONFIG; the sheet
 * flushes on close (handled by StudioSheet).
 */
import { useState } from "react";
import { Reorder } from "framer-motion";
import { Crown, GripVertical, Plus, Smile, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StudioSheet } from "./StudioSheet";
import { QuestionLivePreview } from "./QuestionLivePreview";
import { CORE_META_BY_KEY, optionsOf, type CoreKey } from "@/components/formstudio/questionRegistry";
import type { FormStudioAction } from "./formStudioReducer";
import {
  type EventSettings,
  type SelectOption,
  type ActivityOption,
  type QuestionConfigs,
} from "@/lib/survey-config";
import {
  ACTIVITIES_LIBRARY,
  type ActivityItem,
} from "@/lib/activities-library";
import { AdvancedActivitySelector } from "@/components/dashboard/AdvancedActivitySelector";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

/** ~12 party-relevant emoji suggestions per question (+ a clear option). */
const EMOJI_SUGGESTIONS: Partial<Record<CoreKey, string[]>> = {
  attendance: ["🎉", "🙌", "🤔", "😅", "😔", "🚫", "❤️", "🥳", "👍", "👎", "⏳", "✨"],
  duration: ["🗓️", "☀️", "🌙", "⏱️", "🏖️", "🎊", "🕐", "📆", "🌇", "🌃", "🍹", "✨"],
  budget: ["💶", "💰", "🪙", "💳", "🤑", "💸", "🏦", "📉", "📈", "🎯", "🧾", "✨"],
  destination: ["📍", "🌆", "🏝️", "🗺️", "✈️", "🚗", "🏔️", "🌊", "🏰", "🎡", "🌴", "🍷"],
  travel: ["🧳", "🚗", "🚆", "✈️", "🛏️", "🏨", "🌙", "⛺", "🗺️", "🚌", "⛴️", "✨"],
  fitness: ["💪", "🛋️", "🚶", "🏃", "🧘", "🤸", "🏋️", "⛹️", "🥵", "😌", "🔥", "✨"],
  alcohol: ["🍻", "🍹", "🥂", "🍾", "🍸", "🚱", "🧃", "☕", "🍷", "🫗", "🙅", "✨"],
  activities: ["🎯", "🏎️", "🔐", "🔫", "🪓", "🎮", "🧗", "⚽", "🏕️", "🧖", "🍽️", "🎨"],
};

const CLEAR = "__clear__";

/** Map the broader library category onto the survey's fixed category union. */
function mapCategory(cat: ActivityItem["category"]): ActivityOption["category"] {
  const m: Record<string, ActivityOption["category"]> = {
    action: "action",
    outdoor: "outdoor",
    chill: "chill",
    food: "food",
    entertainment: "other",
    creative: "other",
    sport: "action",
    nightlife: "other",
    culture: "other",
    adventure: "outdoor",
  };
  return m[cat] || "other";
}

interface OptionEditorSheetProps {
  open: boolean;
  coreKey: CoreKey;
  settings: EventSettings;
  isPremium: boolean;
  dispatch: React.Dispatch<FormStudioAction>;
  onClose: () => void;
  flush: () => void;
  onPeek: (key: CoreKey) => void;
}

export function OptionEditorSheet({
  open,
  coreKey,
  settings,
  isPremium,
  dispatch,
  onClose,
  flush,
  onPeek,
}: OptionEditorSheetProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const [emojiTarget, setEmojiTarget] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");

  const meta = CORE_META_BY_KEY[coreKey];
  const cfg = (settings.question_config as QuestionConfigs)[coreKey];
  const options = optionsOf(settings, coreKey);
  const optionsKey = meta.optionsKey;
  const { canEditValues, canMultiSelect } = meta.policy;
  const maxOptions = isPremium ? meta.maxOptionsPremium : meta.maxOptionsFree;

  const translateLabel = (label: string): string =>
    label.startsWith("templates.") && i18n.exists(label) ? t(label) : label;

  const commit = (next: SelectOption[]) => {
    if (!optionsKey) return;
    dispatch({ type: "SET_OPTIONS", optionsKey, options: next });
  };

  const updateOption = (value: string, patch: Partial<SelectOption>) =>
    commit(options.map((o) => (o.value === value ? { ...o, ...patch } : o)));

  const removeOption = (value: string) => {
    haptics.light();
    commit(options.filter((o) => o.value !== value));
    if (emojiTarget === value) setEmojiTarget(null);
  };

  const addOption = () => {
    const label = newLabel.trim();
    if (!label) return;
    const slug = label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] || c)
      .replace(/[^a-z0-9_]/g, "");
    haptics.select();
    commit([...options, { value: `${slug}_${Date.now()}`, label }]);
    setNewLabel("");
  };

  const applyEmoji = (emoji: string) => {
    if (!emojiTarget) return;
    haptics.select();
    updateOption(emojiTarget, { emoji: emoji === CLEAR ? undefined : emoji });
  };

  const isActivities = coreKey === "activities";
  const suggestions = EMOJI_SUGGESTIONS[coreKey] ?? [];

  // Activities body: convert to/from the library shape.
  const selectedActivities: ActivityItem[] = (settings.activity_options ?? []).map((opt) => {
    const lib = ACTIVITIES_LIBRARY.find((a) => a.value === opt.value);
    return (
      lib || {
        value: opt.value,
        label: opt.label,
        emoji: opt.emoji || "🎯",
        category: (opt.category || "other") as ActivityItem["category"],
        tags: [],
      }
    );
  });

  const onActivitiesChange = (items: ActivityItem[]) => {
    dispatch({
      type: "SET_OPTIONS",
      optionsKey: "activity_options",
      options: items.map((a) => ({
        value: a.value,
        label: a.label,
        emoji: a.emoji,
        category: mapCategory(a.category),
      })),
    });
  };

  return (
    <StudioSheet
      open={open}
      onClose={onClose}
      flush={flush}
      emoji={meta.emoji}
      title={t(meta.titleKey, coreKey)}
      onPeek={() => onPeek(coreKey)}
    >
      <div className="space-y-4">
        {/* Live preview */}
        <QuestionLivePreview settings={settings} coreKey={coreKey} />

        {isActivities ? (
          <AdvancedActivitySelector
            selectedActivities={selectedActivities}
            onSelectionChange={onActivitiesChange}
            eventType="bachelor"
          />
        ) : (
          <>
            {/* Multi-select switch */}
            {canMultiSelect && (
              <div className="flex items-center justify-between rounded-xl bg-foreground/[0.04] px-3.5 py-2.5">
                <span className="text-sm font-medium text-foreground">
                  {cfg?.multiSelect ? t("formStudio.multi", "Mehrfachauswahl") : t("formStudio.single", "Einfachauswahl")}
                </span>
                <Switch
                  checked={cfg?.multiSelect ?? false}
                  onCheckedChange={(v) => {
                    haptics.select();
                    dispatch({ type: "SET_QUESTION_CONFIG", key: coreKey, cfg: { ...cfg, multiSelect: v } });
                  }}
                />
              </div>
            )}

            {/* Option rows */}
            <Reorder.Group axis="y" values={options} onReorder={commit} className="space-y-2">
              {options.map((o) => (
                <Reorder.Item
                  key={o.value}
                  value={o}
                  dragListener={false}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background/50 p-2"
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/40 active:cursor-grabbing" />
                  <button
                    type="button"
                    onClick={() => setEmojiTarget(emojiTarget === o.value ? null : o.value)}
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg transition-colors",
                      emojiTarget === o.value ? "bg-primary/15 ring-1 ring-primary/40" : "bg-foreground/[0.06]",
                    )}
                  >
                    {o.emoji || <Smile className="h-4 w-4 text-muted-foreground/50" />}
                  </button>
                  <Input
                    value={translateLabel(o.label)}
                    onChange={(e) => updateOption(o.value, { label: e.target.value })}
                    className="h-9 flex-1"
                  />
                  {canEditValues && (
                    <button
                      type="button"
                      onClick={() => removeOption(o.value)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-destructive/80"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {/* Emoji strip for the picked row */}
            {emojiTarget && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 rounded-xl bg-foreground/[0.03] p-2.5">
                {suggestions.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => applyEmoji(e)}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-foreground/[0.06] text-lg active:bg-foreground/[0.12]"
                  >
                    {e}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => applyEmoji(CLEAR)}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-foreground/[0.06] text-sm text-muted-foreground active:bg-foreground/[0.12]"
                  aria-label="Clear emoji"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Add option / premium cap / locked footnote */}
            {canEditValues ? (
              options.length < maxOptions ? (
                <div className="flex gap-2">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addOption()}
                    placeholder={t("formStudio.addOption", "Antwort hinzufügen")}
                    className="h-10 flex-1 border-dashed"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={!newLabel.trim()}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : !isPremium ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-3.5 py-2.5 text-xs text-amber-500">
                  <Crown className="h-4 w-4 shrink-0" />
                  {t("formStudio.premiumUpsell", "Mit Premium: unbegrenzte eigene Fragen & alle Fragetypen")}
                </div>
              ) : null
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("formStudio.valuesLocked", "Antwort-Werte sind bei dieser Frage fest — Text & Emoji kannst du frei anpassen")}
              </p>
            )}
          </>
        )}
      </div>
    </StudioSheet>
  );
}
