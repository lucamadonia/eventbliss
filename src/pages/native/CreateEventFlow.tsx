/**
 * CreateEventFlow — native multi-step event creation.
 *
 * Steps:
 *   1. Type     — emoji cards (bachelor, bachelorette, birthday, trip, other)
 *   2. Details  — name, honoree, date picker
 *   3. Guests   — add participant names
 *   4. Review   — summary + submit
 *   5. Success  — share link + WhatsApp
 *
 * Reuses the same Supabase Edge Function (create-event) as desktop.
 */
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  PartyPopper,
  Sparkles,
  Cake,
  Plane,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Share2,
  Plus,
  X,
  Calendar,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/platform";
import { savePendingClaim } from "@/lib/guest-claim";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { spring, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MobileHeader } from "@/components/native/MobileHeader";
import {
  EventQuestionsStep,
  defaultQuestionsOptions,
  questionsOptionsToSettings,
  type QuestionsOptions,
} from "@/components/survey/EventQuestionsStep";
import { AIFormSheet } from "@/components/formstudio/sheets/AIFormSheet";
import { usePremium } from "@/hooks/usePremium";
import { ChevronRight } from "lucide-react";
import type { EventSettings } from "@/lib/survey-config";
import {
  questionConfigForEventType,
  DEFAULT_QUESTION_CONFIG,
  type QuestionConfigs,
  type CustomQuestion,
} from "@/lib/survey-config";

const EVENT_TYPES = [
  { value: "bachelor", labelKey: "native.create.stepType.bachelor", emoji: "🎉", gradient: "from-violet-500 to-fuchsia-500" },
  { value: "bachelorette", labelKey: "native.create.stepType.bachelorette", emoji: "💅", gradient: "from-pink-500 to-rose-500" },
  { value: "birthday", labelKey: "native.create.stepType.birthday", emoji: "🎂", gradient: "from-amber-500 to-orange-500" },
  { value: "trip", labelKey: "native.create.stepType.trip", emoji: "✈️", gradient: "from-cyan-500 to-teal-500" },
  { value: "other", labelKey: "native.create.stepType.other", emoji: "🎊", gradient: "from-emerald-500 to-green-500" },
  { value: "wedding", labelKey: "native.create.stepType.wedding", emoji: "💍", gradient: "from-rose-500 to-pink-500" },
  { value: "corporate", labelKey: "native.create.stepType.corporate", emoji: "🏢", gradient: "from-slate-500 to-blue-500" },
  { value: "family", labelKey: "native.create.stepType.family", emoji: "🎈", gradient: "from-amber-500 to-yellow-500" },
  { value: "anniversary", labelKey: "native.create.stepType.anniversary", emoji: "🥂", gradient: "from-purple-500 to-indigo-500" },
  { value: "babyshower", labelKey: "native.create.stepType.babyshower", emoji: "🍼", gradient: "from-sky-400 to-cyan-400" },
  { value: "graduation", labelKey: "native.create.stepType.graduation", emoji: "🎓", gradient: "from-emerald-500 to-teal-500" },
];

interface FormData {
  event_type: string;
  name: string;
  honoree_name: string;
  event_date: string;
  organizer_name: string;
  participants: string[];
  question_config: QuestionConfigs;
  custom_questions: CustomQuestion[];
  options: QuestionsOptions;
  no_gos: string[];
  focus_points: string[];
}

const stepVariants = {
  enter: { x: "60%", opacity: 0 },
  center: { x: 0, opacity: 1, transition: spring.soft },
  exit: { x: "-30%", opacity: 0, transition: { duration: 0.2, ease: ease.in } },
};

const stepBackVariants = {
  enter: { x: "-60%", opacity: 0 },
  center: { x: 0, opacity: 1, transition: spring.soft },
  exit: { x: "30%", opacity: 0, transition: { duration: 0.2, ease: ease.in } },
};

export default function CreateEventFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { user } = useAuthContext();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantInput, setParticipantInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<{
    slug: string;
    access_code: string;
    share_link: string;
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    event_type: "",
    name: "",
    honoree_name: "",
    event_date: "",
    organizer_name: user?.user_metadata?.first_name || user?.email?.split("@")[0] || "",
    participants: [],
    question_config: DEFAULT_QUESTION_CONFIG,
    custom_questions: [],
    options: defaultQuestionsOptions(),
    no_gos: [],
    focus_points: [],
  });

  // Everyone configures the form questions BEFORE the event is created, so
  // the shared link is immediately invite-ready. The step can be skipped —
  // then the event-type defaults apply (adjustable later in the dashboard).
  const isGuest = !user;
  const [skippedQuestions, setSkippedQuestions] = useState(false);
  const [showAiSheet, setShowAiSheet] = useState(false);
  const { isPremium } = usePremium();

  // Apply an AI-generated form to the wizard: overlay only the AI-owned keys
  // onto the current step value (locked option arrays + date blocks survive).
  const applyAiSettings = useCallback((ai: Partial<EventSettings>) => {
    setForm((prev) => {
      // AI-supplied answer options are invisible while their question is
      // disabled — force-enable the matching core question when the AI
      // delivered options for it.
      const config: QuestionConfigs = { ...(ai.question_config ?? prev.question_config) };
      const enableIf = (key: keyof QuestionConfigs, hasOptions: boolean) => {
        if (hasOptions) config[key] = { multiSelect: false, ...(config[key] ?? {}), enabled: true };
      };
      enableIf("budget", !!ai.budget_options?.length);
      enableIf("destination", !!ai.destination_options?.length);
      enableIf("duration", !!ai.duration_options?.length);
      enableIf("activities", !!ai.activity_options?.length);
      return {
        ...prev,
        question_config: config,
        custom_questions: ai.custom_questions ?? prev.custom_questions,
        no_gos: ai.no_gos ?? prev.no_gos,
        focus_points: ai.focus_points ?? prev.focus_points,
        options: {
          ...prev.options,
          ...(ai.budget_options ? { budget_options: ai.budget_options } : {}),
          ...(ai.destination_options ? { destination_options: ai.destination_options } : {}),
          ...(ai.duration_options ? { duration_options: ai.duration_options } : {}),
          ...(ai.activity_options ? { activity_options: ai.activity_options } : {}),
        },
      };
    });
  }, []);
  const stepKeys = useMemo(
    () => ["type", "details", "guests", "questions", "review"] as const,
    [],
  );

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    haptics.light();
    setDirection(1);
    setStep((s) => s + 1);
  };
  const back = () => {
    haptics.light();
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const addParticipant = () => {
    const name = participantInput.trim();
    if (!name) return;
    haptics.light();
    update("participants", [...form.participants, name]);
    setParticipantInput("");
  };

  const removeParticipant = (i: number) => {
    haptics.light();
    update("participants", form.participants.filter((_, idx) => idx !== i));
  };

  const canProceed = () => {
    switch (stepKeys[step - 1]) {
      case "type": return !!form.event_type;
      case "details": return !!form.name && !!form.honoree_name;
      case "guests": return true;
      case "questions": return Object.values(form.question_config).some((q) => q.enabled);
      case "review": return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    haptics.medium();
    try {
      const { data, error } = await supabase.functions.invoke("create-event", {
        body: {
          name: form.name,
          honoree_name: form.honoree_name,
          event_type: form.event_type,
          event_date: form.event_date || null,
          organizer_name: form.organizer_name,
          participants: form.participants.map((name) => ({ name })),
          template_id: "flexible",
          no_gos: form.no_gos,
          focus_points: form.focus_points,
        },
      });
      if (error) throw error;
      if (data?.success) {
        // Persist the questions chosen in the wizard onto the event so the
        // public form asks exactly that. Skipped → keep the event-type
        // defaults untouched (configurable later in the dashboard).
        if (!skippedQuestions && data.event?.id) {
          try {
            await supabase.functions.invoke("update-event-settings", {
              body: {
                event_id: data.event.id,
                settings: {
                  question_config: form.question_config,
                  custom_questions: form.custom_questions,
                  ...questionsOptionsToSettings(form.options),
                },
              },
            });
          } catch (e) {
            console.warn("Could not persist question config:", e);
          }
        }
        if (isGuest) {
          // Remember the organizer token so the guest can claim the event after registering.
          savePendingClaim({ slug: data.event.slug, token: data.organizer_token });
        }
        haptics.celebrate();
        setCreatedEvent({
          slug: data.event.slug,
          access_code: data.event.access_code,
          // ALWAYS build the link client-side: the edge function derives its
          // share_link from the request origin, which inside the native app
          // is capacitor://localhost — useless for sharing. getBaseUrl()
          // returns the production domain on native.
          share_link: `${getBaseUrl()}/e/${data.event.slug}`,
        });
        setDirection(1);
        setStep(stepKeys.length + 1);
      } else throw new Error(data?.error || "Failed");
    } catch (err) {
      haptics.error();
      console.error("Create event failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!createdEvent) return;
    haptics.success();
    await navigator.clipboard.writeText(createdEvent.share_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!createdEvent) return;
    haptics.light();
    const text = t('native.create.stepSuccess.whatsAppText', { name: form.name, honoree: form.honoree_name, link: createdEvent.share_link, code: createdEvent.access_code });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const totalSteps = stepKeys.length;
  const isSuccess = step > stepKeys.length;

  return (
    <div className="h-full flex flex-col bg-background">
      <MobileHeader
        title={isSuccess ? t('native.create.headerDone') : t('native.create.headerTitle')}
        showBack={!isSuccess}
        onBack={step > 1 && !isSuccess ? back : undefined}
      />

      {/* Progress bar */}
      {!isSuccess && (
        <div className="px-5 pb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <motion.div
                key={i}
                className="flex-1 h-1 rounded-full"
                animate={{
                  backgroundColor: i < step ? "rgb(139, 92, 246)" : "hsl(var(--foreground) / 0.12)",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            {t('native.create.stepOf', { step, total: totalSteps })}
          </p>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={direction === 1 ? stepVariants : stepBackVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 overflow-y-auto native-scroll px-5 pb-8"
          >
            {stepKeys[step - 1] === "type" && (
              <StepType
                selected={form.event_type}
                onSelect={(v) => {
                  haptics.medium();
                  setForm((prev) => ({ ...prev, event_type: v, question_config: questionConfigForEventType(v) }));
                }}
              />
            )}
            {stepKeys[step - 1] === "details" && (
              <StepDetails form={form} update={update} />
            )}
            {stepKeys[step - 1] === "guests" && (
              <StepGuests
                participants={form.participants}
                input={participantInput}
                onInputChange={setParticipantInput}
                onAdd={addParticipant}
                onRemove={removeParticipant}
              />
            )}
            {stepKeys[step - 1] === "questions" && (
              <div className="space-y-4">
                {/* AI hero — let the KI configure the whole form from a short description */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.985 }}
                  transition={spring.snappy}
                  onClick={() => { haptics.medium(); setShowAiSheet(true); }}
                  className="relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl p-4 text-left"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                  <span className="absolute inset-0 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(255,255,255,0.28),transparent_55%)]" />
                  <motion.span
                    aria-hidden
                    animate={{ x: ["-120%", "220%"] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
                    className="pointer-events-none absolute inset-y-0 w-1/3 skew-x-[-18deg] bg-white/20 blur-md"
                  />
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-white drop-shadow-sm">
                      {t("formStudio.aiEntry", "Mit KI erstellen")}
                    </span>
                    <span className="block truncate text-xs font-medium text-white/85">
                      {t("formStudio.aiEntrySub", "Beschreibe dein Event — die KI baut das Formular")}
                    </span>
                  </span>
                  <ChevronRight className="relative h-5 w-5 shrink-0 text-white/90" />
                </motion.button>

                <EventQuestionsStep
                  value={{ question_config: form.question_config, custom_questions: form.custom_questions, options: form.options }}
                  onChange={(v) => setForm((prev) => ({ ...prev, question_config: v.question_config, custom_questions: v.custom_questions, options: v.options }))}
                  eventType={form.event_type}
                />
              </div>
            )}
            {stepKeys[step - 1] === "review" && (
              <StepReview form={form} />
            )}
            {isSuccess && createdEvent && (
              <StepSuccess
                event={createdEvent}
                formName={form.name}
                copied={copied}
                onCopy={copyLink}
                onWhatsApp={shareWhatsApp}
                onDashboard={() => {
                  haptics.light();
                  navigate(`/e/${createdEvent.slug}/dashboard`);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      {!isSuccess && (
        <div className="safe-bottom px-5 pb-4 pt-2">
          {/* Questions can be skipped — event-type defaults apply then */}
          {stepKeys[step - 1] === "questions" && (
            <button
              onClick={() => {
                haptics.light();
                setSkippedQuestions(true);
                setDirection(1);
                setStep((s) => s + 1);
              }}
              className="w-full h-10 mb-2 text-sm font-medium text-muted-foreground"
            >
              {t('native.create.questions.skipForNow')}
            </button>
          )}
          <motion.button
            onClick={() => {
              // Proceeding through the questions step normally un-skips it
              if (stepKeys[step - 1] === "questions") setSkippedQuestions(false);
              if (step === stepKeys.length) handleSubmit();
              else next();
            }}
            disabled={!canProceed() || isSubmitting}
            whileTap={{ scale: canProceed() ? 0.96 : 1 }}
            transition={spring.snappy}
            className={cn(
              "w-full h-14 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2 transition-all",
              canProceed()
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.5)]"
                : "bg-foreground/[0.08] text-muted-foreground/60 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === stepKeys.length ? (
              <>
                {t('native.create.buttonCreate')}
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                {t('native.create.buttonNext')}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      )}

      {showAiSheet && (
        <AIFormSheet
          open
          event={{
            event_type: form.event_type,
            honoree_name: form.honoree_name,
            guest_count: form.participants.length,
          }}
          isPremium={isPremium}
          flush={() => {}}
          onClose={() => setShowAiSheet(false)}
          onApply={(ai) => { applyAiSettings(ai); haptics.celebrate(); }}
        />
      )}
    </div>
  );
}

/* ────── Step Sub-Components ────── */

function StepType({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="pt-2">
      <h2 className="text-2xl font-display font-bold text-foreground mb-1">
        {t('native.create.stepType.title')}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">{t('native.create.stepType.subtitle')}</p>
      <div className="space-y-3">
        {EVENT_TYPES.map((type) => {
          const active = selected === type.value;
          return (
            <motion.button
              key={type.value}
              onClick={() => onSelect(type.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                active
                  ? `bg-gradient-to-r ${type.gradient} border-transparent shadow-lg`
                  : "bg-foreground/5 border-border hover:border-border"
              )}
            >
              <span className="text-3xl">{type.emoji}</span>
              <span className={cn(
                "text-base font-semibold",
                active ? "text-white" : "text-foreground/80"
              )}>
                {t(type.labelKey)}
              </span>
              {active && (
                <motion.div
                  className="ml-auto w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={spring.bouncy}
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StepDetails({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="pt-2 space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">{t('native.create.stepDetails.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('native.create.stepDetails.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">{t('native.create.stepDetails.eventName')}</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder={t(`createEvent.step2.placeholders.${form.event_type || 'other'}.eventName`)}
            className="w-full h-12 px-4 rounded-2xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:border-primary/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">{t('native.create.stepDetails.honoree')}</label>
          <input
            value={form.honoree_name}
            onChange={(e) => update("honoree_name", e.target.value)}
            placeholder={t(`createEvent.step2.placeholders.${form.event_type || 'other'}.honoreeName`)}
            className="w-full h-12 px-4 rounded-2xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:border-primary/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
            <Calendar className="w-4 h-4 inline mr-1.5" />
            {t('native.create.stepDetails.date')}
          </label>
          {/* appearance-none + min-w-0: iOS date inputs have an intrinsic
              min-width and overflow the viewport unless native styling is
              disabled. */}
          <input
            type="date"
            value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
            className="appearance-none block w-full min-w-0 h-12 px-4 rounded-2xl bg-foreground/5 border border-border text-foreground text-base text-left focus:outline-none focus:border-primary/50 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">{t('native.create.stepDetails.yourName')}</label>
          <input
            value={form.organizer_name}
            onChange={(e) => update("organizer_name", e.target.value)}
            placeholder={t('native.create.stepDetails.yourNamePlaceholder')}
            className="w-full h-12 px-4 rounded-2xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>
    </div>
  );
}

function StepGuests({
  participants,
  input,
  onInputChange,
  onAdd,
  onRemove,
}: {
  participants: string[];
  input: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="pt-2">
      <h2 className="text-2xl font-display font-bold text-foreground mb-1">{t('native.create.stepGuests.title')}</h2>
      <p className="text-sm text-muted-foreground mb-5">{t('native.create.stepGuests.subtitle')}</p>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder={t('native.create.stepGuests.inputPlaceholder')}
          className="flex-1 h-12 px-4 rounded-2xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:border-primary/50"
        />
        <motion.button
          onClick={onAdd}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {participants.length > 0 && (
        <div className="space-y-2">
          {participants.map((name, i) => (
            <motion.div
              key={`${name}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-foreground/5 border border-border"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                {name.slice(0, 1).toUpperCase()}
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">{name}</span>
              <button onClick={() => onRemove(i)} className="text-muted-foreground/60 hover:text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
          <p className="text-xs text-muted-foreground/60 text-center mt-2">
            {t('native.create.stepGuests.guestCount', { count: participants.length })}
          </p>
        </div>
      )}

      {participants.length === 0 && (
        <div className="rounded-2xl p-8 border border-dashed border-border text-center mt-4">
          <Users className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('native.create.stepGuests.noGuests')}
          </p>
        </div>
      )}
    </div>
  );
}

function StepReview({ form }: { form: FormData }) {
  const { t } = useTranslation();
  const type = EVENT_TYPES.find((et) => et.value === form.event_type);
  return (
    <div className="pt-2">
      <h2 className="text-2xl font-display font-bold text-foreground mb-1">{t('native.create.stepReview.title')}</h2>
      <p className="text-sm text-muted-foreground mb-5">{t('native.create.stepReview.subtitle')}</p>

      <div className="space-y-3">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{type?.emoji}</span>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {type ? t(type.labelKey) : ''}
              </p>
              <h3 className="text-xl font-display font-bold text-foreground">{form.name}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">{t('native.create.stepReview.forLabel')}</p>
              <p className="text-foreground font-medium">{form.honoree_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('native.create.stepReview.dateLabel')}</p>
              <p className="text-foreground font-medium">
                {form.event_date
                  ? new Date(form.event_date).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : t('native.create.stepReview.dateOpen')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('native.create.stepReview.organizer')}</p>
              <p className="text-foreground font-medium">{form.organizer_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('native.create.stepReview.guestsLabel')}</p>
              <p className="text-foreground font-medium">{form.participants.length || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepSuccess({
  event,
  formName,
  copied,
  onCopy,
  onWhatsApp,
  onDashboard,
}: {
  event: { slug: string; access_code: string; share_link: string };
  formName: string;
  copied: boolean;
  onCopy: () => void;
  onWhatsApp: () => void;
  onDashboard: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="pt-6 flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={spring.bouncy}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
      >
        <Check className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-display font-bold text-foreground mb-1"
      >
        {t('native.create.stepSuccess.title')}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground mb-8"
      >
        {t('native.create.stepSuccess.subtitle')}
      </motion.p>

      {/* Access code */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full rounded-2xl p-4 bg-foreground/5 border border-border mb-3"
      >
        <p className="text-xs text-muted-foreground mb-1">{t('native.create.stepSuccess.accessCode')}</p>
        <p className="text-2xl font-display font-bold text-primary tracking-wider">
          {event.access_code}
        </p>
      </motion.div>

      {/* Share link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full rounded-2xl p-4 bg-foreground/5 border border-border mb-6"
      >
        <p className="text-xs text-muted-foreground mb-1">{t('native.create.stepSuccess.link')}</p>
        <p className="text-sm text-foreground/80 truncate">{event.share_link}</p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full space-y-3"
      >
        <motion.button
          onClick={onCopy}
          whileTap={{ scale: 0.96 }}
          className="w-full h-13 rounded-2xl bg-foreground/[0.08] border border-border text-foreground font-semibold flex items-center justify-center gap-2 py-3"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          {copied ? t('native.create.stepSuccess.copied') : t('native.create.stepSuccess.copyLink')}
        </motion.button>

        <motion.button
          onClick={onWhatsApp}
          whileTap={{ scale: 0.96 }}
          className="w-full h-13 rounded-2xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 py-3"
        >
          <Share2 className="w-5 h-5" />
          {t('native.create.stepSuccess.shareWhatsApp')}
        </motion.button>

        <motion.button
          onClick={onDashboard}
          whileTap={{ scale: 0.96 }}
          className="w-full h-13 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold flex items-center justify-center gap-2 py-3 shadow-[0_8px_30px_-6px_rgba(139,92,246,0.4)]"
        >
          {t('native.create.stepSuccess.toDashboard')}
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
