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
  CORE_QUESTION_KEYS,
} from "@/lib/survey-config";
import { supabase } from "@/integrations/supabase/client";
import {
  CORE_QUESTION_RENDERERS,
  CustomQuestionField,
  type CoreQuestionKey,
} from "./questions";
import SurveyQuestionWrapper from "./SurveyQuestionWrapper";
import SurveyProgressBar from "./SurveyProgressBar";
import SurveyCompletionScreen from "./SurveyCompletionScreen";

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
  /** Event name + honoree, used to theme the celebratory success screen. */
  eventName?: string;
  honoreeName?: string;
  /**
   * Form Studio live preview. When true: participant select is replaced by a
   * disabled placeholder, submit is disabled and onSubmit is a no-op (nothing
   * is written). Absent = zero behavior change from the live guest form.
   */
  previewMode?: boolean;
  /** Overrides `settings` when previewing an unsaved draft. */
  previewSettings?: EventSettings;
}

/** Maps a core question key to its react-hook-form field name (progress calc). */
const FIELD_BY_KEY: Record<CoreQuestionKey, keyof DynamicResponseFormData> = {
  attendance: "attendance",
  duration: "duration_pref",
  date_blocks: "date_blocks",
  budget: "budget",
  destination: "destination",
  travel: "travel_pref",
  activities: "preferences",
  fitness: "fitness_level",
  alcohol: "alcohol",
};

const DynamicSurveyForm = ({
  isLocked = false,
  eventId,
  settings,
  participants,
  eventName,
  honoreeName,
  previewMode = false,
  previewSettings,
}: DynamicSurveyFormProps) => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  // Event branding → CSS vars for the whole form body (selected states, submit,
  // progress). Fallback to the theme tokens when no branding is set.
  const branding = config.branding;
  const primaryColor = branding?.primary_color || "#8B5CF6";
  const accentColor = branding?.accent_color || "#06B6D4";
  const brandVars = {
    "--template-primary": primaryColor,
    "--template-accent": accentColor,
  } as React.CSSProperties;

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

  // Live guest-completion progress (participant + enabled core + customs).
  const watched = form.watch();
  const customQuestions = config.custom_questions || [];
  const enabledCoreKeys = CORE_QUESTION_KEYS.filter((k) => {
    if (questionConfig?.[k]?.enabled === false) return false;
    if (k === "date_blocks" && dateBlocks.length === 0) return false;
    return true;
  });
  const isValueAnswered = (v: unknown) =>
    Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : !!v;
  const answeredCore = enabledCoreKeys.filter((k) =>
    isValueAnswered(watched[FIELD_BY_KEY[k]])
  ).length;
  const answeredCustoms = customQuestions.filter((q) => {
    const v = customAnswers[q.id];
    return typeof v === "boolean" ? true : typeof v === "string" && v.trim().length > 0;
  }).length;
  const participantAnswered = previewMode ? 1 : isValueAnswered(watched.participant) ? 1 : 0;
  const totalQuestions = 1 + enabledCoreKeys.length + customQuestions.length;
  const answeredQuestions = participantAnswered + answeredCore + answeredCustoms;

  const onSubmit = async (data: DynamicResponseFormData) => {
    if (previewMode) return; // preview never writes

    // Enforce required custom questions + clamp rating/number before submitting.
    const validation = validateCustomAnswers(config.custom_questions || [], customAnswers);
    if (!validation.ok) {
      toast.error(
        t("guestForm.requiredCustomToast", {
          defaultValue: "Bitte beantworte die Pflichtfrage: „{{label}}“",
          label: validation.firstMissingLabel,
        })
      );
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

      toast.success(t("guestForm.savedToast", { defaultValue: "Antwort gespeichert!" }));
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        t("guestForm.submitErrorToast", {
          defaultValue: "Fehler beim Absenden. Bitte versuche es erneut.",
        })
      );
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
            {t("guestForm.lockedTitle", { defaultValue: "Formular geschlossen" })}
          </h3>
          <p className="text-muted-foreground">
            {t("guestForm.lockedBody", {
              defaultValue: "Der Termin wurde bereits festgelegt. Details folgen per WhatsApp.",
            })}
          </p>
        </div>
      </section>
    );
  }

  // Celebratory in-place success screen (replaces navigate("/danke")); the
  // /danke route stays as a fallback via the screen's back action.
  if (isSubmitted) {
    return (
      <section className="container pb-16" style={brandVars}>
        <SurveyCompletionScreen
          eventName={eventName || ""}
          honoreeName={honoreeName}
          primaryColor={primaryColor}
          accentColor={accentColor}
          onGoBack={() => navigate("/danke")}
        />
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
    <section className="pb-24 md:pb-8" style={brandVars}>
      {/* Floating guest-completion bar (distinct from the event ProgressIndicator) */}
      <SurveyProgressBar
        currentStep={answeredQuestions}
        totalSteps={totalQuestions}
        themeColor={primaryColor}
      />

      <div className="container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 mt-6 animate-slide-up">
            <h2 className="font-display text-2xl font-semibold mb-2">
              {t("guestForm.heading", { defaultValue: "Deine Antwort" })}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("guestForm.subheading", {
                defaultValue:
                  "Dauert nur 2 Minuten. Du kannst später erneut absenden, um zu aktualisieren.",
              })}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Participant Selection - Dynamic from DB (always first) */}
              <div data-question-key="participant">
                <SurveyQuestionWrapper>
                  {previewMode ? (
                    <div className="space-y-2">
                      <Label className="form-label">
                        {t("guestForm.participantLabel", { defaultValue: "Wer bist du?" })} *
                      </Label>
                      <Input value="Max Mustermann" disabled />
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="participant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">
                            {t("guestForm.participantLabel", { defaultValue: "Wer bist du?" })} *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("guestForm.participantPlaceholder", {
                                    defaultValue: "Deinen Namen auswählen...",
                                  })}
                                />
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
                </SurveyQuestionWrapper>
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
                    <SurveyQuestionWrapper>
                      <CustomQuestionField
                        question={question}
                        value={customAnswers[question.id]}
                        onChange={(value) =>
                          setCustomAnswers(prev => ({ ...prev, [question.id]: value }))
                        }
                      />
                    </SurveyQuestionWrapper>
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
              <SurveyQuestionWrapper>
                <FormField
                  control={form.control}
                  name="restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">
                        {t("guestForm.restrictionsLabel", {
                          defaultValue: "Allergien / Einschränkungen (optional)",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("guestForm.restrictionsPlaceholder", {
                            defaultValue: "z.B. Höhenangst, Laktoseintoleranz, Vegetarier...",
                          })}
                          className="resize-none"
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        ⚠️{" "}
                        <strong>{t("guestForm.privacyTitle", { defaultValue: "Hinweis Datenschutz:" })}</strong>{" "}
                        {t("guestForm.privacyBody", {
                          defaultValue:
                            "Bitte gib hier nur Informationen an, die du freiwillig teilen möchtest. Mit dem Absenden des Formulars willigst du gemäß Art. 9 Abs. 2 lit. a DSGVO ausdrücklich in die Verarbeitung dieser Angaben ein. Sensible Gesundheits- oder Religionsdetails bitte nur eintragen, wenn organisatorisch zwingend nötig.",
                        })}{" "}
                        {t("guestForm.privacyMore", { defaultValue: "Mehr Info:" })}{" "}
                        <a href="/legal/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">
                          {t("guestForm.privacyLinkText", { defaultValue: "Datenschutzerklärung §10" })}
                        </a>
                        .
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </SurveyQuestionWrapper>

              {/* Suggestions */}
              <SurveyQuestionWrapper>
                <FormField
                  control={form.control}
                  name="suggestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">
                        {t("guestForm.suggestionsLabel", { defaultValue: "Ideen / Wünsche (optional)" })}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("guestForm.suggestionsPlaceholder", {
                            defaultValue: "Irgendwelche speziellen Wünsche oder Ideen?",
                          })}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </SurveyQuestionWrapper>

              {/* Group Code — skipped in preview (not required there) */}
              {!previewMode && (
                <SurveyQuestionWrapper>
                  <FormField
                    control={form.control}
                    name="group_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">
                          {t("guestForm.groupCodeLabel", { defaultValue: "Gruppencode" })} *
                        </FormLabel>
                        <FormDescription className="text-xs mb-2">
                          {t("guestForm.groupCodeDescription", {
                            defaultValue: "Den Code hast du in der Einladung erhalten",
                          })}
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder={t("guestForm.groupCodePlaceholder", { defaultValue: "z.B. ABC123" })}
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
                </SurveyQuestionWrapper>
              )}

              {/* Submit Button — branded accent→primary gradient */}
              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gradient-bg hover:opacity-90 transition-all"
                  style={{ boxShadow: `0 10px 34px -10px ${primaryColor}80` }}
                  disabled={isSubmitting || previewMode}
                >
                  {previewMode ? (
                    <>{t("guestForm.previewSubmit", { defaultValue: "Vorschau — Antworten werden nicht gespeichert" })}</>
                  ) : isSubmitting ? (
                    <>{t("guestForm.submitting", { defaultValue: "Wird gesendet..." })}</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t("guestForm.submit", { defaultValue: "Absenden" })}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default DynamicSurveyForm;
