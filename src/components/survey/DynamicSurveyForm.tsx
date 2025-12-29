import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { Send, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { dynamicResponseSchema, type DynamicResponseFormData } from "@/lib/schemas";
import {
  type EventSettings, 
  type SelectOption,
  type ActivityOption,
  type DateBlockOption,
  type QuestionConfigs,
  mergeWithDefaults,
  getDateBlocksArray,
} from "@/lib/survey-config";
import { supabase } from "@/integrations/supabase/client";
import ActivityPreferencesSection from "./ActivityPreferencesSection";

interface Participant {
  id: string;
  name: string;
  email?: string;
  role: string;
  status: string;
}

interface DynamicSurveyFormProps {
  isLocked?: boolean;
  eventId: string;
  settings: EventSettings;
  participants: Participant[];
}

const DynamicSurveyForm = ({ 
  isLocked = false, 
  eventId, 
  settings, 
  participants 
}: DynamicSurveyFormProps) => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Merge settings with defaults
  const config = mergeWithDefaults(settings);
  const dateBlocks = getDateBlocksArray(config.date_blocks, config.date_warnings);
  const questionConfig = config.question_config;

  const form = useForm<DynamicResponseFormData>({
    resolver: zodResolver(dynamicResponseSchema),
    defaultValues: {
      participant: "",
      attendance: "",
      duration_pref: "",
      date_blocks: [],
      budget: questionConfig.budget.multiSelect ? [] : "",
      destination: questionConfig.destination.multiSelect ? [] : "",
      travel_pref: "",
      preferences: [],
      fitness_level: "",
      group_code: "",
      partial_days: "",
      alcohol: "",
      restrictions: "",
      suggestions: "",
      de_city: "",
    },
  });

  const watchDestination = form.watch("destination");
  const showDeCityField = Array.isArray(watchDestination) 
    ? watchDestination.includes("de_city") 
    : watchDestination === "de_city";
  const onSubmit = async (data: DynamicResponseFormData) => {
    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke("submit-response", {
        body: {
          ...data,
          event_id: eventId,
        },
      });

      if (error) {
        throw new Error(error.message || "Fehler beim Absenden");
      }

      if (result?.error) {
        if (result.error.includes("Gruppencode")) {
          form.setError("group_code", { message: result.error });
          toast.error(result.error);
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success("Antwort gespeichert!");
      navigate("/danke");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Fehler beim Absenden. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLocked) {
    return (
      <section className="container pb-8">
        <div className="bg-muted rounded-2xl p-8 text-center border border-border">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">
            Formular geschlossen
          </h3>
          <p className="text-muted-foreground">
            Der Termin wurde bereits festgelegt. Details folgen per WhatsApp.
          </p>
        </div>
      </section>
    );
  }

  // Filter out the honoree from participants (they shouldn't fill out the form)
  const selectableParticipants = participants.filter(p => p.role !== 'honoree');

  return (
    <section className="container pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 animate-slide-up delay-300">
          <h2 className="font-display text-2xl font-semibold mb-2">
            Deine Antwort
          </h2>
          <p className="text-muted-foreground text-sm">
            Dauert nur 2 Minuten. Du kannst später erneut absenden, um zu aktualisieren.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Participant Selection - Dynamic from DB */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="participant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Wer bist du? *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Deinen Namen auswählen..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectableParticipants.map((participant) => (
                          <SelectItem key={participant.id} value={participant.name}>
                            {participant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Attendance - Dynamic options */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="attendance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Bist du dabei? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        {config.attendance_options.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={`attendance-${option.value}`} />
                            <Label htmlFor={`attendance-${option.value}`} className="cursor-pointer flex-1">
                              {option.label} {option.emoji}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration Preference - Dynamic options */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="duration_pref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Bevorzugte Dauer *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        {config.duration_options.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
                            <Label htmlFor={`duration-${option.value}`} className="cursor-pointer flex-1">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Blocks - Dynamic from event settings */}
            {dateBlocks.length > 0 && (
              <div className="form-section">
                <FormField
                  control={form.control}
                  name="date_blocks"
                  render={() => (
                    <FormItem>
                      <FormLabel className="form-label">Mögliche Termine *</FormLabel>
                      <FormDescription className="text-xs flex items-start gap-1.5 mb-3">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>Wähle ALLE Termine, die für dich gehen – nicht nur den Favoriten!</span>
                      </FormDescription>
                      <div className="grid gap-3">
                        {dateBlocks.map((block) => (
                          <FormField
                            key={block.key}
                            control={form.control}
                            name="date_blocks"
                            render={({ field }) => (
                              <FormItem
                                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                  block.warning
                                    ? "border-warning/50 bg-warning/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(block.key)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...(field.value || []), block.key]
                                        : field.value?.filter((v) => v !== block.key) || [];
                                      field.onChange(newValue);
                                    }}
                                  />
                                </FormControl>
                                <div className="flex-1">
                                  <Label className="cursor-pointer font-medium">
                                    Block {block.key}: {block.label}
                                  </Label>
                                  {block.warning && (
                                    <p className="text-xs text-warning mt-1">
                                      ⚠️ {block.warning}
                                    </p>
                                  )}
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Partial Days (Optional) */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="partial_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Teilweise möglich? (optional)</FormLabel>
                    <FormDescription className="text-xs mb-2">
                      Falls du nur an bestimmten Tagen/Uhrzeiten kannst
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="z.B. Block B nur Samstag, ab 14 Uhr..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Budget - Dynamic options (single or multi-select) */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Dein Budget pro Person *</FormLabel>
                    <FormControl>
                      {questionConfig.budget.multiSelect ? (
                        <div className="grid grid-cols-2 gap-3">
                          {config.budget_options.map((option) => {
                            const values = Array.isArray(field.value) ? field.value : [];
                            const isChecked = values.includes(option.value);
                            return (
                              <div
                                key={option.value}
                                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                  isChecked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => {
                                  const newValue = isChecked
                                    ? values.filter((v) => v !== option.value)
                                    : [...values, option.value];
                                  field.onChange(newValue);
                                }}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...values, option.value]
                                      : values.filter((v) => v !== option.value);
                                    field.onChange(newValue);
                                  }}
                                />
                                <Label className="cursor-pointer">{option.label}</Label>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={typeof field.value === 'string' ? field.value : ''}
                          className="grid grid-cols-2 gap-3"
                        >
                          {config.budget_options.map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                            >
                              <RadioGroupItem value={option.value} id={`budget-${option.value}`} />
                              <Label htmlFor={`budget-${option.value}`} className="cursor-pointer">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Destination - Dynamic options (single or multi-select) */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Destination *</FormLabel>
                    <FormControl>
                      {questionConfig.destination.multiSelect ? (
                        <div className="grid gap-3">
                          {config.destination_options.map((option) => {
                            const values = Array.isArray(field.value) ? field.value : [];
                            const isChecked = values.includes(option.value);
                            return (
                              <div
                                key={option.value}
                                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                  isChecked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => {
                                  const newValue = isChecked
                                    ? values.filter((v) => v !== option.value)
                                    : [...values, option.value];
                                  field.onChange(newValue);
                                }}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...values, option.value]
                                      : values.filter((v) => v !== option.value);
                                    field.onChange(newValue);
                                  }}
                                />
                                <Label className="cursor-pointer flex-1">
                                  {option.label} {option.emoji}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={typeof field.value === 'string' ? field.value : ''}
                          className="grid gap-3"
                        >
                          {config.destination_options.map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                            >
                              <RadioGroupItem value={option.value} id={`dest-${option.value}`} />
                              <Label htmlFor={`dest-${option.value}`} className="cursor-pointer flex-1">
                                {option.label} {option.emoji}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DE City (conditional) */}
              {showDeCityField && (
                <FormField
                  control={form.control}
                  name="de_city"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="form-label">Wunschstadt in DE (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Berlin, Hamburg, München, Köln..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Travel Preference - Dynamic options */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="travel_pref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Reisebereitschaft *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        {config.travel_options.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={`travel-${option.value}`} />
                            <Label htmlFor={`travel-${option.value}`} className="cursor-pointer flex-1">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Activity Preferences - Grouped by Category */}
            <ActivityPreferencesSection 
              control={form.control} 
              activityOptions={config.activity_options} 
            />

            {/* Fitness Level - Dynamic options */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="fitness_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Fitness-Level *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                        {config.fitness_options.map((option) => (
                          <div
                            key={option.value}
                            className="flex flex-col items-center p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer text-center"
                          >
                            <RadioGroupItem value={option.value} id={`fitness-${option.value}`} className="sr-only" />
                            <Label
                              htmlFor={`fitness-${option.value}`}
                              className="cursor-pointer w-full text-center"
                            >
                              <span className="text-2xl block mb-1">{option.emoji}</span>
                              <span className="text-sm">{option.label}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Alcohol - Dynamic options */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="alcohol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Alkohol? (optional)</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                        {config.alcohol_options.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center justify-center p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={`alcohol-${option.value}`} className="sr-only" />
                            <Label htmlFor={`alcohol-${option.value}`} className="cursor-pointer text-center text-sm">
                              {option.label} {option.emoji}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Restrictions */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="restrictions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Allergien / Einschränkungen (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="z.B. Höhenangst, Laktoseintoleranz, Vegetarier..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Suggestions */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="suggestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Ideen / Wünsche (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Irgendwelche speziellen Wünsche oder Ideen?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Group Code */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="group_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Gruppencode *</FormLabel>
                    <FormDescription className="text-xs mb-2">
                      Den Code hast du in der Einladung erhalten
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder="z.B. ABC123"
                        className="uppercase"
                        maxLength={10}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full gradient-bg hover:opacity-90 transition-opacity"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Wird gesendet...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Absenden
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
};

export default DynamicSurveyForm;
