import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Dumbbell, 
  Plus, 
  Trash2, 
  Save,
  AlertTriangle,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { 
  type EventSettings, 
  type SelectOption,
  type ActivityOption,
  DEFAULT_SURVEY_CONFIG,
  mergeWithDefaults,
} from "@/lib/survey-config";

interface Event {
  id: string;
  name: string;
  settings: EventSettings | null;
}

interface FormBuilderTabProps {
  event: Event;
  onUpdate: () => void;
}

export const FormBuilderTab = ({ event, onUpdate }: FormBuilderTabProps) => {
  const settings = mergeWithDefaults(event.settings);
  
  const [dateBlocks, setDateBlocks] = useState<Record<string, string>>(settings.date_blocks || {});
  const [dateWarnings, setDateWarnings] = useState<Record<string, string>>(settings.date_warnings || {});
  const [budgetOptions, setBudgetOptions] = useState<SelectOption[]>(settings.budget_options);
  const [destinationOptions, setDestinationOptions] = useState<SelectOption[]>(settings.destination_options);
  const [activityOptions, setActivityOptions] = useState<ActivityOption[]>(settings.activity_options);
  const [noGos, setNoGos] = useState<string[]>(settings.no_gos || []);
  const [focusPoints, setFocusPoints] = useState<string[]>(settings.focus_points || []);
  
  const [newDateKey, setNewDateKey] = useState("");
  const [newDateLabel, setNewDateLabel] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newDestinationEmoji, setNewDestinationEmoji] = useState("");
  const [newNoGo, setNewNoGo] = useState("");
  const [newFocusPoint, setNewFocusPoint] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings: Partial<EventSettings> = {
        ...settings,
        date_blocks: dateBlocks,
        date_warnings: dateWarnings,
        budget_options: budgetOptions,
        destination_options: destinationOptions,
        activity_options: activityOptions,
        no_gos: noGos,
        focus_points: focusPoints,
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-event-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            event_id: event.id,
            settings: updatedSettings,
          }),
        }
      );

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Fehler beim Speichern");
      }

      toast.success("Formular-Konfiguration gespeichert!");
      onUpdate();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  // Date block helpers
  const addDateBlock = () => {
    if (!newDateKey || !newDateLabel) return;
    setDateBlocks({ ...dateBlocks, [newDateKey.toUpperCase()]: newDateLabel });
    setNewDateKey("");
    setNewDateLabel("");
  };

  const removeDateBlock = (key: string) => {
    const { [key]: _, ...rest } = dateBlocks;
    setDateBlocks(rest);
    const { [key]: __, ...warningsRest } = dateWarnings;
    setDateWarnings(warningsRest);
  };

  const toggleDateWarning = (key: string, warning: string) => {
    if (dateWarnings[key]) {
      const { [key]: _, ...rest } = dateWarnings;
      setDateWarnings(rest);
    } else {
      setDateWarnings({ ...dateWarnings, [key]: warning });
    }
  };

  // Budget helpers
  const addBudgetOption = () => {
    if (!newBudget) return;
    setBudgetOptions([...budgetOptions, { value: newBudget.toLowerCase().replace(/\s/g, '-'), label: newBudget }]);
    setNewBudget("");
  };

  const removeBudgetOption = (value: string) => {
    setBudgetOptions(budgetOptions.filter(o => o.value !== value));
  };

  // Destination helpers
  const addDestination = () => {
    if (!newDestination) return;
    setDestinationOptions([
      ...destinationOptions, 
      { 
        value: newDestination.toLowerCase().replace(/\s/g, '_'), 
        label: newDestination,
        emoji: newDestinationEmoji || undefined,
      }
    ]);
    setNewDestination("");
    setNewDestinationEmoji("");
  };

  const removeDestination = (value: string) => {
    setDestinationOptions(destinationOptions.filter(o => o.value !== value));
  };

  // Activity helpers
  const toggleActivity = (activityValue: string) => {
    const exists = activityOptions.find(a => a.value === activityValue);
    if (exists) {
      setActivityOptions(activityOptions.filter(a => a.value !== activityValue));
    } else {
      const defaultActivity = DEFAULT_SURVEY_CONFIG.activity_options.find(a => a.value === activityValue);
      if (defaultActivity) {
        setActivityOptions([...activityOptions, defaultActivity]);
      }
    }
  };

  // No-Go helpers
  const addNoGo = () => {
    if (!newNoGo) return;
    setNoGos([...noGos, newNoGo]);
    setNewNoGo("");
  };

  const removeNoGo = (index: number) => {
    setNoGos(noGos.filter((_, i) => i !== index));
  };

  // Focus point helpers
  const addFocusPoint = () => {
    if (!newFocusPoint) return;
    setFocusPoints([...focusPoints, newFocusPoint]);
    setNewFocusPoint("");
  };

  const removeFocusPoint = (index: number) => {
    setFocusPoints(focusPoints.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Formular konfigurieren</h2>
          <p className="text-muted-foreground text-sm">Passe das Survey-Formular für dein Event an</p>
        </div>
        <GradientButton onClick={handleSave} disabled={isSaving} icon={<Save className="w-4 h-4" />}>
          {isSaving ? "Speichert..." : "Speichern"}
        </GradientButton>
      </div>

      <Accordion type="multiple" defaultValue={["dates", "destinations"]} className="space-y-4">
        {/* Date Blocks Section */}
        <AccordionItem value="dates" className="border-none">
          <GlassCard className="overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Terminblöcke</h3>
                  <p className="text-sm text-muted-foreground">{Object.keys(dateBlocks).length} Termine konfiguriert</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* Existing date blocks */}
                <div className="space-y-2">
                  {Object.entries(dateBlocks).map(([key, label]) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <Badge variant="outline" className="font-mono">{key}</Badge>
                      <span className="flex-1 text-sm">{label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDateWarning(key, "Mögliche Einschränkungen")}
                        className={dateWarnings[key] ? "text-warning" : "text-muted-foreground"}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDateBlock(key)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Add new date block */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Block (z.B. A)"
                    value={newDateKey}
                    onChange={(e) => setNewDateKey(e.target.value.toUpperCase())}
                    className="w-20"
                    maxLength={2}
                  />
                  <Input
                    placeholder="Datum (z.B. Fr 27.02.–So 01.03.2026)"
                    value={newDateLabel}
                    onChange={(e) => setNewDateLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addDateBlock} disabled={!newDateKey || !newDateLabel}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </GlassCard>
        </AccordionItem>

        {/* Budget Options Section */}
        <AccordionItem value="budget" className="border-none">
          <GlassCard className="overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Budget-Optionen</h3>
                  <p className="text-sm text-muted-foreground">{budgetOptions.length} Optionen</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {budgetOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="pl-3 pr-1 py-1.5 flex items-center gap-2"
                    >
                      {option.label}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-destructive/20"
                        onClick={() => removeBudgetOption(option.value)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="z.B. 500-750 €"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addBudgetOption} disabled={!newBudget}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </GlassCard>
        </AccordionItem>

        {/* Destinations Section */}
        <AccordionItem value="destinations" className="border-none">
          <GlassCard className="overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <MapPin className="w-5 h-5 text-success" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Destinations</h3>
                  <p className="text-sm text-muted-foreground">{destinationOptions.length} Optionen</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-2">
                  {destinationOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border"
                    >
                      <span className="text-sm">
                        {option.emoji} {option.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDestination(option.value)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Emoji (optional)"
                    value={newDestinationEmoji}
                    onChange={(e) => setNewDestinationEmoji(e.target.value)}
                    className="w-20"
                    maxLength={4}
                  />
                  <Input
                    placeholder="z.B. Amsterdam"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addDestination} disabled={!newDestination}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </GlassCard>
        </AccordionItem>

        {/* Activities Section */}
        <AccordionItem value="activities" className="border-none">
          <GlassCard className="overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Dumbbell className="w-5 h-5 text-warning" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Aktivitäten</h3>
                  <p className="text-sm text-muted-foreground">{activityOptions.length} ausgewählt</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {DEFAULT_SURVEY_CONFIG.activity_options.map((activity) => {
                  const isSelected = activityOptions.some(a => a.value === activity.value);
                  return (
                    <label
                      key={activity.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/50 hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleActivity(activity.value)}
                      />
                      <span className="text-lg">{activity.emoji}</span>
                      <span className="text-sm">{activity.label}</span>
                    </label>
                  );
                })}
              </div>
            </AccordionContent>
          </GlassCard>
        </AccordionItem>

        {/* No-Gos & Focus Points Section */}
        <AccordionItem value="rules" className="border-none">
          <GlassCard className="overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Sparkles className="w-5 h-5 text-destructive" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">No-Gos & Fokus</h3>
                  <p className="text-sm text-muted-foreground">Regeln für das Event</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                {/* No-Gos */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">❌ No-Gos</Label>
                  <div className="space-y-2 mb-3">
                    {noGos.map((noGo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg"
                      >
                        <span className="text-sm">{noGo}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNoGo(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="z.B. Keine Stripper"
                      value={newNoGo}
                      onChange={(e) => setNewNoGo(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addNoGo} disabled={!newNoGo} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Focus Points */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">✨ Fokus / Wünsche</Label>
                  <div className="space-y-2 mb-3">
                    {focusPoints.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-success/10 rounded-lg"
                      >
                        <span className="text-sm">{point}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFocusPoint(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="z.B. Action & Spaß"
                      value={newFocusPoint}
                      onChange={(e) => setNewFocusPoint(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addFocusPoint} disabled={!newFocusPoint} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </GlassCard>
        </AccordionItem>
      </Accordion>

      {/* Preview hint */}
      <GlassCard className="p-4 border-dashed">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="w-5 h-5" />
          <p className="text-sm">
            Änderungen werden sofort im Survey-Formular sichtbar, sobald du speicherst.
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
