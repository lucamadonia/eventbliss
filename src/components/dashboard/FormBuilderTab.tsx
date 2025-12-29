import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  type QuestionConfigs,
  type QuestionConfig,
  DEFAULT_SURVEY_CONFIG,
  DEFAULT_BRANDING,
  DEFAULT_QUESTION_CONFIG,
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
  const { t } = useTranslation();
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
  
  // Question configuration (visibility + multi-select)
  const [questionConfig, setQuestionConfig] = useState<QuestionConfigs>(
    settings.question_config || DEFAULT_QUESTION_CONFIG
  );
  
  const updateQuestionConfig = (key: keyof QuestionConfigs, config: QuestionConfig) => {
    setQuestionConfig(prev => ({ ...prev, [key]: config }));
  };
  
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
        question_config: questionConfig,
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
        throw new Error(data.error || t('common.error'));
      }

      toast.success(t('dashboard.form.successMessage'));
      onUpdate();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(t('common.error'));
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
            {t('dashboard.form.title')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('dashboard.form.subtitle', { eventName: event.name })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={`/e/${event.id.split('-').slice(0, 3).join('-')}`} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4" />
              {t('dashboard.form.preview')}
            </a>
          </Button>
          <GradientButton onClick={handleSave} disabled={isSaving} icon={<Save className="w-4 h-4" />}>
            {isSaving ? t('dashboard.form.saving') : t('dashboard.form.save')}
          </GradientButton>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="content" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.form.tabs.content')}</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.form.tabs.design')}</span>
          </TabsTrigger>
          <TabsTrigger value="extras" className="gap-2">
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.form.tabs.extras')}</span>
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
                      <h3 className="font-semibold">{t('dashboard.form.sections.attendance.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.form.sections.attendance.description')}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6">
                    <CoreQuestionEditor
                      title={t('dashboard.form.questions.attendance.title')}
                      description={t('dashboard.form.questions.attendance.description')}
                      options={attendanceOptions}
                      onChange={setAttendanceOptions}
                      showEmoji={true}
                      maxOptions={5}
                      placeholder={t('dashboard.form.newOption')}
                      questionConfig={questionConfig.attendance}
                      onConfigChange={(c) => updateQuestionConfig('attendance', c)}
                    />
                    <div className="border-t border-border pt-6">
                      <CoreQuestionEditor
                        title={t('dashboard.form.questions.duration.title')}
                        description={t('dashboard.form.questions.duration.description')}
                        options={durationOptions}
                        onChange={setDurationOptions}
                        showEmoji={false}
                        maxOptions={5}
                        placeholder={t('dashboard.form.newOption')}
                        questionConfig={questionConfig.duration}
                        onConfigChange={(c) => updateQuestionConfig('duration', c)}
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
                      <h3 className="font-semibold">{t('dashboard.form.sections.travel.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.form.sections.travel.description')}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6">
                    <CoreQuestionEditor
                      title={t('dashboard.form.questions.travel.title')}
                      description={t('dashboard.form.questions.travel.description')}
                      options={travelOptions}
                      onChange={setTravelOptions}
                      showEmoji={false}
                      maxOptions={5}
                      placeholder={t('dashboard.form.newOption')}
                      questionConfig={questionConfig.travel}
                      onConfigChange={(c) => updateQuestionConfig('travel', c)}
                    />
                    <div className="border-t border-border pt-6">
                      <CoreQuestionEditor
                        title={t('dashboard.form.questions.fitness.title')}
                        description={t('dashboard.form.questions.fitness.description')}
                        options={fitnessOptions}
                        onChange={setFitnessOptions}
                        showEmoji={true}
                        maxOptions={5}
                        placeholder={t('dashboard.form.newOption')}
                        questionConfig={questionConfig.fitness}
                        onConfigChange={(c) => updateQuestionConfig('fitness', c)}
                      />
                    </div>
                    <div className="border-t border-border pt-6">
                      <CoreQuestionEditor
                        title={t('dashboard.form.questions.alcohol.title')}
                        description={t('dashboard.form.questions.alcohol.description')}
                        options={alcoholOptions}
                        onChange={setAlcoholOptions}
                        showEmoji={true}
                        maxOptions={4}
                        placeholder={t('dashboard.form.newOption')}
                        questionConfig={questionConfig.alcohol}
                        onConfigChange={(c) => updateQuestionConfig('alcohol', c)}
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
                      <h3 className="font-semibold">{t('dashboard.form.sections.dates.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.form.sections.dates.configured', { count: dateBlocks.length })}
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
                      <h3 className="font-semibold">{t('dashboard.form.sections.activities.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.form.sections.activities.selected', { count: selectedActivities.length })}
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
                      <h3 className="font-semibold">{t('dashboard.form.sections.budget.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('dashboard.form.sections.budget.options', { count: budgetOptions.length })}</p>
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
                        placeholder={t('dashboard.form.sections.budget.placeholder')}
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
                      <h3 className="font-semibold">{t('dashboard.form.sections.destinations.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('dashboard.form.sections.destinations.options', { count: destinationOptions.length })}</p>
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
                        placeholder={t('dashboard.form.sections.destinations.emojiPlaceholder')}
                        value={newDestinationEmoji}
                        onChange={(e) => setNewDestinationEmoji(e.target.value)}
                        className="w-16"
                        maxLength={4}
                      />
                      <Input
                        placeholder={t('dashboard.form.sections.destinations.placeholder')}
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
                      <h3 className="font-semibold">{t('dashboard.form.sections.rules.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.form.sections.rules.rulesCount', { count: noGos.length + focusPoints.length })}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6">
                    {/* No-Gos */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">❌ {t('dashboard.form.noGos.title')}</Label>
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
                          placeholder={t('dashboard.form.noGos.placeholder')}
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
                      <Label className="text-sm font-medium mb-3 block">✨ {t('dashboard.form.focusPoints.title')}</Label>
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
                          placeholder={t('dashboard.form.focusPoints.placeholder')}
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
                <h3 className="font-semibold">{t('dashboard.form.design.templateTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.form.design.templateDescription')}
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
                <h3 className="font-semibold">{t('dashboard.form.design.brandingTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.form.design.brandingDescription')}
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
                <h3 className="font-semibold">{t('dashboard.form.extras.customQuestionsTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.form.extras.customQuestionsDescription')}
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
            {t('dashboard.form.previewHint')}
            <ChevronRight className="w-4 h-4 inline mx-1" />
            <a 
              href={`/e/${event.id.split('-').slice(0, 3).join('-')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('dashboard.form.openPreview')}
            </a>
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
