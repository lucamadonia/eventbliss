import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Control } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SurveyOptionCard from "./SurveyOptionCard";
import type { ActivityOption } from "@/lib/survey-config";
import type { DynamicResponseFormData } from "@/lib/schemas";

interface ActivityPreferencesSectionProps {
  control: Control<DynamicResponseFormData>;
  activityOptions: ActivityOption[];
}

// Category configuration with emojis, i18n keys and default (German) labels.
const CATEGORY_CONFIG: Record<
  string,
  { emoji: string; i18nKey: string; label: string; order: number }
> = {
  action: { emoji: "🎬", i18nKey: "guestForm.categories.action", label: "Action & Abenteuer", order: 1 },
  outdoor: { emoji: "🌿", i18nKey: "guestForm.categories.outdoor", label: "Outdoor & Natur", order: 2 },
  food: { emoji: "🍽️", i18nKey: "guestForm.categories.food", label: "Essen & Trinken", order: 3 },
  chill: { emoji: "🧖", i18nKey: "guestForm.categories.chill", label: "Entspannung", order: 4 },
  mixed: { emoji: "⭐", i18nKey: "guestForm.categories.mixed", label: "Sonstiges", order: 5 },
};

const ActivityPreferencesSection = ({ control, activityOptions }: ActivityPreferencesSectionProps) => {
  const { t } = useTranslation();
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["action"]));

  // Helper to translate template labels
  const translateLabel = (label: string): string => {
    if (label.startsWith('templates.') && i18n.exists(label)) {
      return t(label);
    }
    return label;
  };

  // Group activities by category
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityOption[]> = {};

    activityOptions.forEach((option) => {
      const category = option.category || "mixed";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(option);
    });

    // Sort categories by order and return as array
    return Object.entries(groups)
      .sort(([a], [b]) => {
        const orderA = CATEGORY_CONFIG[a]?.order ?? 99;
        const orderB = CATEGORY_CONFIG[b]?.order ?? 99;
        return orderA - orderB;
      })
      .map(([category, options]) => ({
        category,
        config: CATEGORY_CONFIG[category] || { emoji: "📌", i18nKey: "", label: category, order: 99 },
        options,
      }));
  }, [activityOptions]);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <FormField
      control={control}
      name="preferences"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="form-label">
            {t("guestForm.q.activities", { defaultValue: "Aktivitäten / Präferenzen" })} *
          </FormLabel>
          <FormDescription className="text-xs mb-3">
            {t("guestForm.q.activitiesHint", { defaultValue: "Wähle alles, was dich interessiert" })}
          </FormDescription>

          <div className="space-y-2">
            {groupedActivities.map(({ category, config, options }) => {
              const isOpen = openCategories.has(category);
              const selectedCount = options.filter(
                (opt) => field.value?.includes(opt.value)
              ).length;
              const categoryLabel = config.i18nKey
                ? t(config.i18nKey, { defaultValue: config.label })
                : config.label;

              return (
                <Collapsible
                  key={category}
                  open={isOpen}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl border border-white/[0.08] hover:bg-white/[0.06] transition-colors bg-white/[0.03]">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config.emoji}</span>
                      <span className="font-medium">{categoryLabel}</span>
                      {selectedCount > 0 && (
                        <span
                          className="px-2 py-0.5 text-xs rounded-full font-medium text-white"
                          style={{ backgroundColor: "var(--template-primary, hsl(var(--primary)))" }}
                        >
                          {t("guestForm.selectedCount", {
                            defaultValue: "{{count}} ausgewählt",
                            count: selectedCount,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {t("guestForm.optionCount", {
                          defaultValue: "{{count}} Optionen",
                          count: options.length,
                        })}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-2">
                    <div className="grid sm:grid-cols-2 gap-2 pl-2">
                      {options.map((option) => (
                        <SurveyOptionCard
                          key={option.value}
                          multiSelect
                          label={translateLabel(option.label)}
                          icon={option.emoji}
                          selected={!!field.value?.includes(option.value)}
                          onSelect={() => {
                            const current = field.value || [];
                            field.onChange(
                              current.includes(option.value)
                                ? current.filter((v) => v !== option.value)
                                : [...current, option.value]
                            );
                          }}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ActivityPreferencesSection;
