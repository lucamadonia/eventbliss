import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Palette,
  MessageSquarePlus,
  Eye,
  Settings2,
  ChevronRight,
  Users,
  Car,
  Heart,
  Wine,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  type EventSettings, 
  type SelectOption,
  type BrandingConfig,
  type CustomQuestion,
  DEFAULT_SURVEY_CONFIG,
  DEFAULT_BRANDING,
  mergeWithDefaults,
} from "@/lib/survey-config";
import { DateRangeBlockEditor, DateRangeBlock } from "./DateRangeBlockEditor";
import { AdvancedActivitySelector } from "./AdvancedActivitySelector";
import { DesignTemplateSelector } from "./DesignTemplateSelector";
import { BrandingEditor } from "./BrandingEditor";
import { CustomQuestionBuilder } from "./CustomQuestionBuilder";
import { CoreQuestionEditor } from "./CoreQuestionEditor";
import { DesignTemplate, getTemplateById } from "@/lib/design-templates";
import { ActivityItem, ACTIVITIES_LIBRARY } from "@/lib/activities-library";

interface Event {
  id: string;
  name: string;
  honoree_name?: string;
  event_type?: string;
  settings: Partial<EventSettings> | null;
}

interface FormBuilderTabProps {
  event: Event;
  onUpdate: () => void;
}

export const FormBuilderTab = ({ event, onUpdate }: FormBuilderTabProps) => {
  const settings = mergeWithDefaults(event.settings);
  
  // Convert stored date_blocks to DateRangeBlock format
  const initialDateBlocks: DateRangeBlock[] = useMemo(() => {
    return Object.entries(settings.date_blocks || {}).map(([key, label]) => ({
      key,
      start: '', // We don't have start/end stored separately yet
      end: '',
      label,
      warning: settings.date_warnings?.[key],
    }));
  }, [settings.date_blocks, settings.date_warnings]);

  // Convert stored activity_options to ActivityItem format
  const initialActivities: ActivityItem[] = useMemo(() => {
    return settings.activity_options.map(opt => {
      const libActivity = ACTIVITIES_LIBRARY.find(a => a.value === opt.value);
      return libActivity || {
        value: opt.value,
        label: opt.label,
        emoji: opt.emoji || '🎯',
        category: (opt.category || 'other') as ActivityItem['category'],
        tags: [],
      };
    });
  }, [settings.activity_options]);

  // State
  const [activeTab, setActiveTab] = useState("content");
  const [dateBlocks, setDateBlocks] = useState<DateRangeBlock[]>(initialDateBlocks);
  const [budgetOptions, setBudgetOptions] = useState<SelectOption[]>(settings.budget_options);
  const [destinationOptions, setDestinationOptions] = useState<SelectOption[]>(settings.destination_options);
  const [selectedActivities, setSelectedActivities] = useState<ActivityItem[]>(initialActivities);
  const [noGos, setNoGos] = useState<string[]>(settings.no_gos || []);
  const [focusPoints, setFocusPoints] = useState<string[]>(settings.focus_points || []);
  const [branding, setBranding] = useState<BrandingConfig>(settings.branding || DEFAULT_BRANDING);
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(
    branding.template_id ? getTemplateById(branding.template_id) || null : null
  );
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(settings.custom_questions || []);
  
  // Core question states
  const [attendanceOptions, setAttendanceOptions] = useState<SelectOption[]>(settings.attendance_options);
  const [durationOptions, setDurationOptions] = useState<SelectOption[]>(settings.duration_options);
  const [travelOptions, setTravelOptions] = useState<SelectOption[]>(settings.travel_options);
  const [fitnessOptions, setFitnessOptions] = useState<SelectOption[]>(settings.fitness_options);
  const [alcoholOptions, setAlcoholOptions] = useState<SelectOption[]>(settings.alcohol_options);
  
  const [newBudget, setNewBudget] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newDestinationEmoji, setNewDestinationEmoji] = useState("");
  const [newNoGo, setNewNoGo] = useState("");
  const [newFocusPoint, setNewFocusPoint] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert dateBlocks to storage format
      const dateBlocksRecord: Record<string, string> = {};
      const dateWarningsRecord: Record<string, string> = {};
      
      dateBlocks.forEach(block => {
        dateBlocksRecord[block.key] = block.label;
        if (block.warning) {
          dateWarningsRecord[block.key] = block.warning;
        }
      });

      // Convert activities to storage format - map extended categories to basic ones
      const mapCategory = (cat: ActivityItem['category']): 'action' | 'chill' | 'food' | 'outdoor' | 'other' => {
        const categoryMap: Record<string, 'action' | 'chill' | 'food' | 'outdoor' | 'other'> = {
          action: 'action',
          outdoor: 'outdoor',
          chill: 'chill',
          food: 'food',
          entertainment: 'other',
          creative: 'other',
          sport: 'action',
          nightlife: 'other',
          culture: 'other',
          adventure: 'outdoor',
        };
        return categoryMap[cat] || 'other';
      };

      const activityOptions = selectedActivities.map(activity => ({
        value: activity.value,
        label: activity.label,
        emoji: activity.emoji,
        category: mapCategory(activity.category),
      }));

      const updatedSettings: Partial<EventSettings> = {
        ...settings,
        date_blocks: dateBlocksRecord,
        date_warnings: dateWarningsRecord,
        budget_options: budgetOptions,
        destination_options: destinationOptions,
        activity_options: activityOptions,
        attendance_options: attendanceOptions,
        duration_options: durationOptions,
        travel_options: travelOptions,
        fitness_options: fitnessOptions,
        alcohol_options: alcoholOptions,
        no_gos: noGos,
        focus_points: focusPoints,
        branding: {
          ...branding,
          template_id: selectedTemplate?.id,
        },
        custom_questions: customQuestions,
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

  const handleTemplateSelect = (template: DesignTemplate) => {
    setSelectedTemplate(template);
    setBranding({
      ...branding,
      primary_color: template.branding.primary_color,
      accent_color: template.branding.accent_color,
      background_style: template.branding.background_style,
      template_id: template.id,
    });
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

  const eventType = event.event_type || 'bachelor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" />
            Formular-Builder
          </h2>
          <p className="text-muted-foreground text-sm">
            Konfiguriere das Survey für <span className="font-medium text-foreground">{event.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={`/e/${event.id.split('-').slice(0, 3).join('-')}`} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4" />
              Vorschau
            </a>
          </Button>
          <GradientButton onClick={handleSave} disabled={isSaving} icon={<Save className="w-4 h-4" />}>
            {isSaving ? "Speichert..." : "Speichern"}
          </GradientButton>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="content" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Inhalt</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Design</span>
          </TabsTrigger>
          <TabsTrigger value="extras" className="gap-2">
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Extras</span>
          </TabsTrigger>
        </TabsList>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-4">
          <Accordion type="multiple" defaultValue={["attendance", "dates", "activities"]} className="space-y-4">
            
            {/* Attendance & Duration Questions */}
            <AccordionItem value="attendance" className="border-none">
              <GlassCard className="overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Teilnahme-Fragen</h3>
                      <p className="text-sm text-muted-foreground">
                        Dabei?, Dauer, Teilweise möglich
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6">
                    <CoreQuestionEditor
                      title="Bist du dabei? *"
                      description="Antwortoptionen für die Teilnahme-Frage"
                      options={attendanceOptions}
                      onChange={setAttendanceOptions}
                      showEmoji={true}
                      maxOptions={5}
                      placeholder="z.B. Unter Vorbehalt"
                    />
                    <div className="border-t border-border pt-6">
                      <CoreQuestionEditor
                        title="Bevorzugte Dauer *"
                        description="Optionen für die Dauer des Events"
                        options={durationOptions}
                        onChange={setDurationOptions}
                        showEmoji={false}
                        maxOptions={5}
                        placeholder="z.B. 3-4 Tage"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>

            {/* Travel & Fitness Questions */}
            <AccordionItem value="travel" className="border-none">
              <GlassCard className="overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-info/10">
                      <Car className="w-5 h-5 text-info" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Reise & Fitness</h3>
                      <p className="text-sm text-muted-foreground">
                        Reisebereitschaft, Fitnesslevel, Alkohol
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6">
                    <CoreQuestionEditor
                      title="Maximale Reisedauer *"
                      description="Wie weit sind die Gäste bereit zu reisen?"
                      options={travelOptions}
                      onChange={setTravelOptions}
                      showEmoji={false}
                      maxOptions={5}
                      placeholder="z.B. Egal - flexibel"
                    />
                    <div className="border-t border-border pt-6">
                      <CoreQuestionEditor
                        title="Fitness-Level *"
                        description="Bevorzugtes Aktivitätsniveau"
                        options={fitnessOptions}
                        onChange={setFitnessOptions}
                        showEmoji={true}
                        maxOptions={5}
                        placeholder="z.B. Sehr sportlich"
                      />
                    </div>
                    <div className="border-t border-border pt-6">
                      <CoreQuestionEditor
                        title="Alkohol-Präferenz"
                        description="Einstellung zu alkoholischen Getränken"
                        options={alcoholOptions}
                        onChange={setAlcoholOptions}
                        showEmoji={true}
                        maxOptions={4}
                        placeholder="z.B. Nur Bier"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>
            
            {/* Date Blocks Section - Using new DateRangeBlockEditor */}
            <AccordionItem value="dates" className="border-none">
              <GlassCard className="overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Terminblöcke</h3>
                      <p className="text-sm text-muted-foreground">
                        {dateBlocks.length} Termine konfiguriert
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <DateRangeBlockEditor 
                    blocks={dateBlocks} 
                    onChange={setDateBlocks}
                  />
                </AccordionContent>
              </GlassCard>
            </AccordionItem>

            {/* Activities Section - Using new AdvancedActivitySelector */}
            <AccordionItem value="activities" className="border-none">
              <GlassCard className="overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Dumbbell className="w-5 h-5 text-warning" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Aktivitäten</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedActivities.length} von 100+ ausgewählt
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <AdvancedActivitySelector
                    selectedActivities={selectedActivities}
                    onSelectionChange={setSelectedActivities}
                    eventType={eventType}
                  />
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
                        placeholder="Emoji"
                        value={newDestinationEmoji}
                        onChange={(e) => setNewDestinationEmoji(e.target.value)}
                        className="w-16"
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

            {/* No-Gos & Focus Points Section */}
            <AccordionItem value="rules" className="border-none">
              <GlassCard className="overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">No-Gos & Fokus</h3>
                      <p className="text-sm text-muted-foreground">
                        {noGos.length + focusPoints.length} Regeln
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6">
                    {/* No-Gos */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">❌ No-Gos</Label>
                      <div className="space-y-2 mb-3">
                        <AnimatePresence>
                          {noGos.map((noGo, index) => (
                            <motion.div
                              key={`nogo-${index}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
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
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="z.B. Keine Stripper"
                          value={newNoGo}
                          onChange={(e) => setNewNoGo(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addNoGo()}
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
                        <AnimatePresence>
                          {focusPoints.map((point, index) => (
                            <motion.div
                              key={`focus-${index}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
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
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="z.B. Action & Spaß"
                          value={newFocusPoint}
                          onChange={(e) => setNewFocusPoint(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addFocusPoint()}
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
        </TabsContent>

        {/* DESIGN TAB */}
        <TabsContent value="design" className="space-y-6">
          {/* Template Selector */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Design-Template wählen</h3>
                <p className="text-sm text-muted-foreground">
                  Wähle ein passendes Design für dein Event
                </p>
              </div>
            </div>
            <DesignTemplateSelector
              selectedTemplateId={selectedTemplate?.id || null}
              onSelect={handleTemplateSelect}
              eventType={eventType}
            />
          </GlassCard>

          {/* Branding Editor */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <Palette className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Branding anpassen</h3>
                <p className="text-sm text-muted-foreground">
                  Farben, Texte & Key-Datum konfigurieren
                </p>
              </div>
            </div>
            <BrandingEditor
              branding={branding}
              onChange={setBranding}
              eventName={event.name}
              honoreeName={event.honoree_name || ''}
              selectedTemplate={selectedTemplate}
            />
          </GlassCard>
        </TabsContent>

        {/* EXTRAS TAB */}
        <TabsContent value="extras" className="space-y-6">
          {/* Custom Questions */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquarePlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Eigene Fragen</h3>
                <p className="text-sm text-muted-foreground">
                  Füge individuelle Fragen zum Formular hinzu
                </p>
              </div>
            </div>
            <CustomQuestionBuilder
              questions={customQuestions}
              onChange={setCustomQuestions}
            />
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Preview hint */}
      <GlassCard className="p-4 border-dashed border-primary/30">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="text-sm">
            Änderungen werden sofort im Survey-Formular sichtbar, sobald du speicherst.
            <ChevronRight className="w-4 h-4 inline mx-1" />
            <a 
              href={`/e/${event.id.split('-').slice(0, 3).join('-')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Vorschau öffnen
            </a>
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
