import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Send, AlertCircle, Info } from "lucide-react";
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

import { responseSchema, type ResponseFormData } from "@/lib/schemas";
import {
  PARTICIPANTS,
  DATE_BLOCKS,
  DATE_WARNINGS,
  ATTENDANCE_OPTIONS,
  DURATION_OPTIONS,
  BUDGET_OPTIONS,
  DESTINATION_OPTIONS,
  TRAVEL_OPTIONS,
  ACTIVITY_OPTIONS,
  FITNESS_OPTIONS,
  ALCOHOL_OPTIONS,
  type DateBlockKey,
} from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

interface SurveyFormProps {
  isLocked?: boolean;
}

const SurveyForm = ({ isLocked = false }: SurveyFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      participant: undefined,
      attendance: undefined,
      duration_pref: undefined,
      date_blocks: [],
      budget: undefined,
      destination: undefined,
      travel_pref: undefined,
      preferences: [],
      fitness_level: undefined,
      group_code: "",
      partial_days: "",
      alcohol: undefined,
      restrictions: "",
      suggestions: "",
      de_city: "",
    },
  });

  const watchDestination = form.watch("destination");

  const onSubmit = async (data: ResponseFormData) => {
    setIsSubmitting(true);

    try {
      // Call edge function to submit response
      const { data: result, error } = await supabase.functions.invoke("submit-response", {
        body: data,
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
            {/* Participant Selection */}
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
                        {PARTICIPANTS.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Attendance */}
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
                        {ATTENDANCE_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={`attendance-${option.value}`} />
                            <Label htmlFor={`attendance-${option.value}`} className="cursor-pointer flex-1">
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

            {/* Duration Preference */}
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
                        {DURATION_OPTIONS.map((option) => (
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

            {/* Date Blocks */}
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
                      {(Object.entries(DATE_BLOCKS) as [DateBlockKey, string][]).map(([key, label]) => (
                        <FormField
                          key={key}
                          control={form.control}
                          name="date_blocks"
                          render={({ field }) => (
                            <FormItem
                              className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                DATE_WARNINGS[key]
                                  ? "border-warning/50 bg-warning/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(key)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), key]
                                      : field.value?.filter((v) => v !== key) || [];
                                    field.onChange(newValue);
                                  }}
                                />
                              </FormControl>
                              <div className="flex-1">
                                <Label className="cursor-pointer font-medium">
                                  Block {key}: {label}
                                </Label>
                                {DATE_WARNINGS[key] && (
                                  <p className="text-xs text-warning mt-1">
                                    ⚠️ {DATE_WARNINGS[key]}
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

            {/* Budget */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Dein Budget pro Person *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-3"
                      >
                        {BUDGET_OPTIONS.map((option) => (
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Destination */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Destination *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        {DESTINATION_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={`dest-${option.value}`} />
                            <Label htmlFor={`dest-${option.value}`} className="cursor-pointer flex-1">
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

              {/* DE City (conditional) */}
              {watchDestination === "de_city" && (
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

            {/* Travel Preference */}
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
                        {TRAVEL_OPTIONS.map((option) => (
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

            {/* Activity Preferences */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="preferences"
                render={() => (
                  <FormItem>
                    <FormLabel className="form-label">Aktivitäten / Präferenzen *</FormLabel>
                    <FormDescription className="text-xs mb-3">
                      Wähle alles, was dich interessiert
                    </FormDescription>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {ACTIVITY_OPTIONS.map((option) => (
                        <FormField
                          key={option.value}
                          control={form.control}
                          name="preferences"
                          render={({ field }) => (
                            <FormItem
                              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), option.value]
                                      : field.value?.filter((v) => v !== option.value) || [];
                                    field.onChange(newValue);
                                  }}
                                />
                              </FormControl>
                              <Label className="cursor-pointer text-sm">{option.label}</Label>
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

            {/* Fitness Level */}
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
                        {FITNESS_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            className="flex flex-col items-center p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer text-center"
                          >
                            <RadioGroupItem value={option.value} id={`fitness-${option.value}`} className="sr-only" />
                            <Label htmlFor={`fitness-${option.value}`} className="cursor-pointer text-sm">
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

            {/* Alcohol Preference (Optional) */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="alcohol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Alkoholpräferenz (optional)</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                        {ALCOHOL_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center justify-center p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={`alcohol-${option.value}`} className="sr-only" />
                            <Label htmlFor={`alcohol-${option.value}`} className="cursor-pointer text-sm text-center">
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

            {/* Restrictions (Optional) */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="restrictions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Einschränkungen (optional)</FormLabel>
                    <FormDescription className="text-xs mb-2">
                      Allergien, Verletzungen, etc.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Falls etwas wichtig ist..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Suggestions (Optional) */}
            <div className="form-section">
              <FormField
                control={form.control}
                name="suggestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Eigene Vorschläge (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ideen, Wünsche, Vorschläge..."
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
                      Wurde dir per WhatsApp geschickt
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Gruppencode eingeben..."
                        autoComplete="off"
                        {...field}
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
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse">Wird gespeichert...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Antwort absenden
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

export default SurveyForm;
