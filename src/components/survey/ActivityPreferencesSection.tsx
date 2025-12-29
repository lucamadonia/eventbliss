import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
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
import type { ActivityOption } from "@/lib/survey-config";
import type { ResponseFormData } from "@/lib/schemas";

interface ActivityPreferencesSectionProps {
  control: Control<ResponseFormData>;
  activityOptions: ActivityOption[];
}

// Category configuration with emojis and labels
const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; order: number }> = {
  action: { emoji: "🎬", label: "Action & Abenteuer", order: 1 },
  outdoor: { emoji: "🌿", label: "Outdoor & Natur", order: 2 },
  food: { emoji: "🍽️", label: "Essen & Trinken", order: 3 },
  chill: { emoji: "🧖", label: "Entspannung", order: 4 },
  mixed: { emoji: "⭐", label: "Sonstiges", order: 5 },
};

const ActivityPreferencesSection = ({ control, activityOptions }: ActivityPreferencesSectionProps) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["action"]));

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
        config: CATEGORY_CONFIG[category] || { emoji: "📌", label: category, order: 99 },
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
    <div className="form-section">
      <FormField
        control={control}
        name="preferences"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">Aktivitäten / Präferenzen *</FormLabel>
            <FormDescription className="text-xs mb-3">
              Wähle alles, was dich interessiert
            </FormDescription>
            
            <div className="space-y-2">
              {groupedActivities.map(({ category, config, options }) => {
                const isOpen = openCategories.has(category);
                const selectedCount = options.filter(
                  (opt) => field.value?.includes(opt.value)
                ).length;
                
                return (
                  <Collapsible
                    key={category}
                    open={isOpen}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:border-primary/50 transition-colors bg-background/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.emoji}</span>
                        <span className="font-medium">{config.label}</span>
                        {selectedCount > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
                            {selectedCount} ausgewählt
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {options.length} Optionen
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
                          <div
                            key={option.value}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                              field.value?.includes(option.value)
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => {
                              const isChecked = field.value?.includes(option.value);
                              const newValue = isChecked
                                ? field.value?.filter((v) => v !== option.value) || []
                                : [...(field.value || []), option.value];
                              field.onChange(newValue);
                            }}
                          >
                            <Checkbox
                              checked={field.value?.includes(option.value)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...(field.value || []), option.value]
                                  : field.value?.filter((v) => v !== option.value) || [];
                                field.onChange(newValue);
                              }}
                            />
                            <Label className="cursor-pointer flex-1 font-normal">
                              {option.emoji} {option.label}
                            </Label>
                          </div>
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
    </div>
  );
};

export default ActivityPreferencesSection;
