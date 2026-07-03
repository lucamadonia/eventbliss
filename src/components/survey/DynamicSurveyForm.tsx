import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

import { makeDynamicResponseSchema, type DynamicResponseFormData } from "@/lib/schemas";
import {
  type EventSettings,
  mergeWithDefaults,
  getDateBlocksArray,
  getEffectiveQuestionOrder,
  validateCustomAnswers,
  CUSTOM_ORDER_PREFIX,
} from "@/lib/survey-config";
import { supabase } from "@/integrations/supabase/client";
import {
  CORE_QUESTION_RENDERERS,
  CustomQuestionField,
  type CoreQuestionKey,
} from "./questions";

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
  /**
   * Form Studio live preview. When true: participant select is replaced by a
   * disabled placeholder, submit is disabled and onSubmit is a no-op (nothing
   * is written). Absent = zero behavior change from the live guest form.
   */
  previewMode?: boolean;
  /** Overrides `settings` when previewing an unsaved draft. */
  previewSettings?: EventSettings;
}

const DynamicSurveyForm = ({
  isLocked = false,
  eventId,
  settings,
  participants,
  previewMode = false,
  previewSettings,
}: DynamicSurveyFormProps) => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | boolean>>({});

  // Helper to translate template labels
  const translateLabel = (label: string): string => {
    if (label.startsWith('templates.') && i18n.exists(label)) {
      return t(label);
    }
    return label;
  };

  // Merge settings with defaults (previewSettings overrides when previewing a draft)
  const config = mergeWithDefaults(previewSettings ?? settings);
  const dateBlocks = getDateBlocksArray(config.date_blocks, config.date_warnings);
  const questionConfig = config.question_config;
  // Only require the questions the organizer actually enabled.
  const responseSchema = useMemo(() => makeDynamicResponseSchema(questionConfig), [questionConfig]);

  const form = useForm<DynamicResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      participant: "",
      attendance: "",
      duration_pref: questionConfig.duration?.multiSelect ? [] : "",
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

  const onSubmit = async (data: DynamicResponseFormData) => {
    if (previewMode) return; // preview never writes

    // Enforce required custom questions + clamp rating/number before submitting.
    const validation = validateCustomAnswers(config.custom_questions || [], customAnswers);
    if (!validation.ok) {
      toast.error(`Bitte beantworte die Pflichtfrage: „${validation.firstMissingLabel}"`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke("submit-response", {
        body: {
          ...data,
          event_id: eventId,
          custom_answers: validation.sanitized,
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

  // Uniform props shared by every core question renderer.
  const coreProps = {
    control: form.control,
    watch: form.watch,
    config,
    questionConfig,
    translateLabel,
    dateBlocks,
  };

  // Core + custom questions render in the organizer-defined order. For events
  // without a stored question_order this is the legacy order (core keys first,
  // then custom questions), so the rendered result is unchanged.
  const questionOrder = getEffectiveQuestionOrder(config);
  const customById = new Map((config.custom_questions || []).map((q) => [q.id, q]));

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
            <div data-question-key="participant" className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
              {previewMode ? (
                <div className="space-y-2">
                  <Label className="form-label">Wer bist du? *</Label>
                  <Input value="Max Mustermann" disabled />
                </div>
              ) : (
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
              )}
            </div>

            {/* Core + custom questions in organizer-defined order. Each block is
                wrapped in a div[data-question-key] for the Form Studio peek
                feature; empty:hidden keeps disabled (null-rendering) core
                questions from leaving a phantom space-y gap. */}
            {questionOrder.map((id) => {
              let content;
              if (id.startsWith(CUSTOM_ORDER_PREFIX)) {
                const question = customById.get(id.slice(CUSTOM_ORDER_PREFIX.length));
                if (!question) return null;
                content = (
                  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
                    <CustomQuestionField
                      question={question}
                      value={customAnswers[question.id]}
                      onChange={(value) =>
                        setCustomAnswers(prev => ({ ...prev, [question.id]: value }))
                      }
                    />
                  </div>
                );
              } else {
                const QuestionRenderer = CORE_QUESTION_RENDERERS[id as CoreQuestionKey];
                if (!QuestionRenderer) return null;
                content = <QuestionRenderer {...coreProps} />;
              }
              return (
                // space-y-6 keeps the DateBlocks fragment (date_blocks + partial_days)
                // at the same 24px rhythm the form uses; no-op for single-card blocks.
                <div key={id} data-question-key={id} className="space-y-6 empty:hidden">
                  {content}
                </div>
              );
            })}

            {/* Restrictions */}
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
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
                        maxLength={500}
                        {...field}
                      />
                    </FormControl>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      ⚠️ <strong>Hinweis Datenschutz:</strong> Bitte gib hier nur Informationen an, die du <em>freiwillig</em> teilen möchtest. Mit dem Absenden des Formulars willigst du gemäß <strong>Art. 9 Abs. 2 lit. a DSGVO</strong> ausdrücklich in die Verarbeitung dieser Angaben ein. Sensible Gesundheits- oder Religionsdetails bitte nur eintragen, wenn organisatorisch zwingend nötig.
                      Mehr Info: <a href="/legal/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">Datenschutzerklärung §10</a>.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Suggestions */}
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
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

            {/* Group Code — skipped in preview (not required there) */}
            {!previewMode && (
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
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
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full gradient-bg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                disabled={isSubmitting || previewMode}
              >
                {previewMode ? (
                  <>Vorschau — Antworten werden nicht gespeichert</>
                ) : isSubmitting ? (
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
