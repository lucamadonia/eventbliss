import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Calendar, DollarSign, Lightbulb, RefreshCw, AlertTriangle, Store, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { useAICredits } from "@/hooks/useAICredits";
import { PaywallOverlay } from "@/components/premium/PaywallOverlay";
import { AIResponseCard } from "@/components/dashboard/AIResponseCard";
import { AddToPlannerDialog } from "@/components/dashboard/AddToPlannerDialog";
import { DayPlanDurationSelector } from "@/components/ai/DayPlanDurationSelector";
import AIHeroHeader from "@/components/dashboard/AIHeroHeader";
import { AIRequestCard } from "@/components/dashboard/AIRequestCard";
import AIChatInput from "@/components/dashboard/AIChatInput";
import AISpectacleSkeleton from "@/components/dashboard/AISpectacleSkeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventData } from "@/hooks/useEvent";
import { mergeWithDefaults } from "@/lib/survey-config";
import { makeOptionLabelResolver } from "@/components/native/responses/responseHelpers";
import { edgeHeaders } from "@/lib/edge";
import { parseDayPlan, type ParsedActivity, type ParsedTimeBlock, type ParsedDay } from "@/lib/ai-response-parser";

interface AIAssistantTabProps {
  event: EventData;
  participantCount?: number;
  responseCount?: number;
  stats: {
    attendance: { yes: number; maybe: number; no: number };
    budgets: Record<string, number>;
    destinations: Record<string, number>;
    activities: Record<string, number>;
    fitness_levels: Record<string, number>;
    date_blocks?: Record<string, { yes: number; maybe: number; total: number }>;
    total_responses?: number;
  } | null;
}

type RequestType = "trip_ideas" | "activities" | "day_plan" | "budget_estimate" | "chat" | "recommend_services";
type PlanningDraft = { response: string; type: RequestType; targetDays?: number; wishes?: string };

interface AIRequest {
  type: RequestType;
  icon: typeof MapPin;
  labelKey: string;
  descriptionKey: string;
  image: string;
  /** Tailwind gradient classes — "from-… via-… to-…" */
  gradient: string;
  badge?: string;
}

const AI_REQUESTS: AIRequest[] = [
  {
    type: "trip_ideas",
    icon: MapPin,
    labelKey: "dashboard.ai.tripIdeas",
    descriptionKey: "dashboard.ai.tripIdeasDesc",
    image: "/images/planning-studio/quick-travel-v2.webp",
    gradient: "from-purple-600 via-pink-600 to-amber-500",
  },
  {
    type: "activities",
    icon: Lightbulb,
    labelKey: "dashboard.ai.activities",
    descriptionKey: "dashboard.ai.activitiesDesc",
    image: "/images/planning-studio/quick-activities-v2.webp",
    gradient: "from-cyan-500 via-blue-500 to-indigo-600",
  },
  {
    type: "day_plan",
    icon: Calendar,
    labelKey: "dashboard.ai.dayPlan",
    descriptionKey: "dashboard.ai.dayPlanDesc",
    image: "/images/planning-studio/duration-5-v2.webp",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    type: "budget_estimate",
    icon: DollarSign,
    labelKey: "dashboard.ai.budgetEstimate",
    descriptionKey: "dashboard.ai.budgetEstimateDesc",
    image: "/images/planning-studio/quick-budget-v2.webp",
    gradient: "from-amber-500 via-orange-500 to-red-500",
  },
  {
    type: "recommend_services" as RequestType,
    icon: Store,
    labelKey: "dashboard.ai.recommendServices",
    descriptionKey: "dashboard.ai.recommendServicesDesc",
    image: "/images/planning-studio/quick-services-v2.webp",
    gradient: "from-fuchsia-500 via-rose-500 to-amber-400",
    badge: "NEU",
  },
];

export const AIAssistantTab = ({ event, stats, participantCount: invitedCount, responseCount: knownResponseCount }: AIAssistantTabProps) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { isPremium, loading: premiumLoading } = usePremium();
  const { used, limit, remaining, resetDate, loading: creditsLoading, refetch: refetchCredits } = useAICredits();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(() => queryClient.getQueryData<PlanningDraft>(["planning-draft", event.id])?.response ?? null);
  const [currentType, setCurrentType] = useState<RequestType | null>(() => queryClient.getQueryData<PlanningDraft>(["planning-draft", event.id])?.type ?? null);
  const [chatMessage, setChatMessage] = useState("");
  const [lastChatMessage, setLastChatMessage] = useState("");
  const [lastPlanOptions, setLastPlanOptions] = useState(() => {
    const draft = queryClient.getQueryData<PlanningDraft>(["planning-draft", event.id]);
    return { days: draft?.targetDays ?? 3, wishes: draft?.wishes };
  });
  const ideasScrollRef = useRef<HTMLDivElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<ParsedActivity | null>(null);
  const [showPlannerDialog, setShowPlannerDialog] = useState(false);
  const [showDurationSelector, setShowDurationSelector] = useState(false);
  const [showPlanImport, setShowPlanImport] = useState(false);
  const [planStartDate, setPlanStartDate] = useState(event.event_date?.slice(0, 10) || "");
  const [importingPlan, setImportingPlan] = useState(false);
  const [creditAnimation, setCreditAnimation] = useState(false);

  const { data: fetchedStats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["planning-survey-stats", event.id],
    enabled: !stats,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-responses?event_id=${event.id}`, {
        headers: await edgeHeaders(),
      });
      if (!res.ok) throw new Error(`Survey stats: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Survey stats unavailable");
      return data.stats as NonNullable<AIAssistantTabProps["stats"]> & { total_responses?: number };
    },
  });
  const surveyStats = stats ?? fetchedStats ?? null;
  const planningUnavailable = statsLoading || (statsError && (knownResponseCount ?? 0) > 0);

  // Show paywall if not premium
  if (!premiumLoading && !isPremium) {
    return <PaywallOverlay feature="ai_assistant" />;
  }

  const creditsExhausted = limit > 0 && remaining <= 0;

  const getContext = (targetDays?: number) => {
    const participantCount = surveyStats
      ? surveyStats.attendance.yes + surveyStats.attendance.maybe
      : 0;
    // Resolve raw option slugs (incl. AI-generated ones) to their labels so
    // the model reasons over "80–150 €" instead of "budget_small".
    const config = mergeWithDefaults(event.settings);
    const resolve = makeOptionLabelResolver(config, t);

    // Get top budget
    const budgetEntries = Object.entries(surveyStats?.budgets || {});
    const topBudget = budgetEntries.length > 0
      ? resolve("budget", budgetEntries.sort((a, b) => b[1] - a[1])[0][0])
      : undefined;

    // Get top destination
    const destEntries = Object.entries(surveyStats?.destinations || {});
    const topDestination = destEntries.length > 0
      ? resolve("destination", destEntries.sort((a, b) => b[1] - a[1])[0][0])
      : undefined;

    // Get top activities
    const activityEntries = Object.entries(surveyStats?.activities || {});
    const topActivities = activityEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => resolve("preferences", key));

    // Get fitness level
    const fitnessEntries = Object.entries(surveyStats?.fitness_levels || {});
    const topFitness = fitnessEntries.length > 0
      ? fitnessEntries.sort((a, b) => b[1] - a[1])[0][0]
      : undefined;

    const preferredDates = Object.entries(surveyStats?.date_blocks || {})
      .filter(([, votes]) => votes.yes > 0)
      .sort((a, b) => b[1].yes - a[1].yes)
      .slice(0, 2)
      .map(([key, votes]) => `${config.date_blocks[key] || key} (${votes.yes} ${i18n.language.startsWith("de") ? "Zusagen" : "yes"})`);
    const dateInfo = [event.event_date, ...preferredDates].filter(Boolean).join("; ") || undefined;

    return {
      event_type: event.event_type,
      honoree_name: event.honoree_name,
      participant_count: participantCount,
      avg_budget: topBudget,
      destination_pref: topDestination,
      date_info: dateInfo,
      top_activities: topActivities,
      fitness_level: topFitness,
      duration: undefined,
      language: (i18n.language || event.locale || 'en').toLowerCase().split(/[-_]/)[0],
      event_name: event.name,
      event_description: event.description || undefined,
      target_days: targetDays,
      marketplace_hint: "Beruecksichtige verfuegbare Services im EventBliss Marketplace. Empfehle konkrete Kategorien: workshop, entertainment, catering, music, photography, venue, wellness, sport.",
    };
  };

  const handleRequest = async (type: RequestType, message?: string, options?: { targetDays?: number; wishes?: string }) => {
    if (planningUnavailable) return;
    if (creditsExhausted) {
      toast.error(t('aiCredits.noCreditsLeft'));
      return;
    }

    const previousDraft = queryClient.getQueryData<PlanningDraft>(["planning-draft", event.id]);
    const restorePreviousDraft = () => {
      if (previousDraft) {
        setResponse(previousDraft.response);
        setCurrentType(previousDraft.type);
      }
    };
    setIsLoading(true);
    setCurrentType(type);
    setResponse(null);
    setShowDurationSelector(false);

    // For recommend_services, use a pre-built message
    const aiMessage = type === "recommend_services"
      ? "Empfehle mir passende buchbare Aktivitäten und Services für unser Event. Berücksichtige dabei die Vorlieben der Teilnehmer und schlage konkrete Kategorien vor wie Workshops, Catering, Entertainment oder Wellness."
      : message;

    try {
      const { data: result, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: type === "recommend_services" ? "activities" : type,
          context: getContext(options?.targetDays),
          message: aiMessage || message,
          eventId: event.id,
        },
      });

      if (error) {
        console.error("AI function error:", error);
        const errorContext = (error as { context?: unknown }).context;
        const errorDetails = errorContext instanceof Response ? await errorContext.clone().json().catch(() => null) : null;
        if (errorDetails?.code === "INCOMPLETE_PLAN") {
          toast.error(t("dashboard.ai.incompletePlan"));
        } else if (error.message?.includes('429') || error.message?.includes('rate')) {
          toast.error(t('dashboard.ai.tooManyRequests'));
        } else if (error.message?.includes('402') || error.message?.includes('credit')) {
          toast.error(t('aiCredits.noCreditsLeft'));
        } else {
          throw new Error(error.message || "AI request failed");
        }
        restorePreviousDraft();
        return;
      }

      if (!result?.success) {
        throw new Error(result?.error || "AI request failed");
      }

      setResponse(result.response);
      queryClient.setQueryData<PlanningDraft>(["planning-draft", event.id], { response: result.response, type, targetDays: options?.targetDays, wishes: options?.wishes });
      if (type === "day_plan") setLastPlanOptions({ days: options?.targetDays ?? 3, wishes: options?.wishes });

      // Refetch credits and show animation
      await refetchCredits();
      setCreditAnimation(true);
      setTimeout(() => setCreditAnimation(false), 1500);
      
      // Show credit used toast
      toast.success(t('aiCredits.creditUsed', { remaining: Math.max(0, remaining - 1) }));
    } catch (error) {
      console.error("AI error:", error);
      toast.error(t('dashboard.ai.requestFailed'));
      restorePreviousDraft();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async (prompt?: string) => {
    const message = (prompt ?? chatMessage).trim();
    if (!message) return;
    setLastChatMessage(message);
    await handleRequest("chat", message);
    setChatMessage("");
  };

  const handleDayPlanClick = () => {
    if (planningUnavailable) return;
    if (creditsExhausted) {
      toast.error(t('aiCredits.noCreditsLeft'));
      return;
    }
    setShowDurationSelector(true);
    setResponse(null);
    setCurrentType("day_plan");
  };

  const handleDurationSelect = async (days: number, wishes?: string) => {
    await handleRequest("day_plan", wishes, { targetDays: days, wishes });
  };

  const handleRegenerate = async (targetDays?: number) => {
    if (currentType === "day_plan") {
      await handleRequest("day_plan", lastPlanOptions.wishes, { targetDays: targetDays ?? lastPlanOptions.days, wishes: lastPlanOptions.wishes });
    } else if (currentType) {
      await handleRequest(currentType, currentType === "chat" ? lastChatMessage : undefined);
    }
  };

  const handleExpand = async (targetDays: number) => {
    await handleRequest("day_plan", lastPlanOptions.wishes, { targetDays, wishes: lastPlanOptions.wishes });
  };

  const handleAddToPlanner = (activity: ParsedActivity) => {
    setSelectedActivity(activity);
    setShowPlannerDialog(true);
  };

  const handleAddTimeBlock = (timeBlock: ParsedTimeBlock, dayName: string) => {
    const activity: ParsedActivity = {
      emoji: timeBlock.emoji,
      title: timeBlock.title,
      startTime: /^\d{1,2}:\d{2}$/.test(timeBlock.time) ? timeBlock.time : undefined,
      category: timeBlock.category,
      duration: timeBlock.duration,
      cost: timeBlock.cost,
      fitness: 'normal',
      description: [
        timeBlock.description,
        timeBlock.location && `📍 ${timeBlock.location}`,
        timeBlock.transport && `🚗 ${timeBlock.transport}`,
        ...timeBlock.tips.map(t => `💡 ${t}`),
      ].filter(Boolean).join('\n'),
      rawSection: timeBlock.rawSection,
    };
    setSelectedActivity(activity);
    setShowPlannerDialog(true);
  };

  const handleAddDay = (day: ParsedDay) => {
    day.timeBlocks.forEach(block => handleAddTimeBlock(block, day.dayName));
    toast.success(t('dashboard.ai.dayAdded', 'Tag zum Planer hinzugefügt'));
  };

  const planDays = currentType === "day_plan" && response ? parseDayPlan(response).days : [];
  const planBlockCount = planDays.reduce((count, day) => count + day.timeBlocks.length, 0);
  const importFullPlan = async () => {
    if (!planStartDate || planBlockCount === 0) return;
    const categoryMap: Record<string, string> = { action: "activity", outdoor: "activity", drinks: "food", chill: "relaxation", wellness: "relaxation" };
    const allowed = new Set(["activity", "food", "transport", "accommodation", "party", "sightseeing", "relaxation", "other"]);
    const rows = planDays.flatMap((day, dayIndex) => {
      const date = new Date(`${planStartDate}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + dayIndex);
      return day.timeBlocks.map((block) => {
        const mappedCategory = categoryMap[block.category] || block.category;
        return {
          event_id: event.id,
          day_date: date.toISOString().slice(0, 10),
          title: block.title,
          description: block.description || null,
          start_time: /^\d{1,2}:\d{2}$/.test(block.time) ? block.time : null,
          end_time: null,
          category: allowed.has(mappedCategory) ? mappedCategory : "activity",
          location: block.location || null,
          notes: [block.transport, ...block.tips].filter(Boolean).join("\n") || null,
        };
      });
    });
    setImportingPlan(true);
    try {
      const { error } = await supabase.from("schedule_activities").insert(rows);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["native-schedule", event.slug] });
      await queryClient.invalidateQueries({ queryKey: ["schedule-activities", event.id] });
      setShowPlanImport(false);
      toast.success(i18n.language.startsWith("de") ? `${rows.length} Programmpunkte zum Zeitplan hinzugefügt` : `${rows.length} activities added to the schedule`);
    } catch (error) {
      console.error("Plan import failed:", error);
      toast.error(i18n.language.startsWith("de") ? "Der Plan konnte nicht übernommen werden" : "Could not add the plan to the schedule");
    } finally {
      setImportingPlan(false);
    }
  };

  // Get context for response card
  const participantCount = (surveyStats?.attendance.yes || 0) + (surveyStats?.attendance.maybe || 0);
  const actualResponseCount = surveyStats && "total_responses" in surveyStats
    ? Number(surveyStats.total_responses || 0)
    : knownResponseCount ?? 0;
  const topBudget = getContext().avg_budget;

  return (
    <div className="space-y-6">
      {/* Credits Exhausted Warning — gradient pulse */}
      {creditsExhausted && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/40"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20" />
          <div className="absolute inset-0 opacity-60 ai-pulse-ring bg-[radial-gradient(ellipse_at_left,rgba(245,158,11,0.35),transparent_60%)]" />
          <div className="relative p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-amber-700 dark:text-amber-200">{t('aiCredits.exhausted', 'Credits aufgebraucht')}</p>
              <p className="text-sm text-amber-700/80 dark:text-amber-100/80">
                {t('aiCredits.creditsReset', { date: resetDate.toLocaleDateString() })}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Header — mesh gradient + drifting particles + pulse-ring credits */}
      <AIHeroHeader
        eventName={event.name}
        eventType={event.event_type}
        honoreeName={event.honoree_name}
        city={getContext().destination_pref}
        participantCount={invitedCount}
        surveyResponses={actualResponseCount}
        isLoadingResponses={statsLoading && !stats}
        onGeneratePlan={handleDayPlanClick}
        disabled={creditsExhausted || isLoading || planningUnavailable}
        credits={{
          used,
          limit,
          remaining,
          resetDate,
          loading: creditsLoading,
        }}
        creditsAnimating={creditAnimation}
      />

      {statsError && !stats && (knownResponseCount ?? 0) > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm">
          <span>{i18n.language.startsWith("de") ? "Die Antworten konnten nicht geladen werden. Bitte versuche es erneut." : "Survey answers could not be loaded. Please try again."}</span>
          <button type="button" onClick={() => void refetchStats()} className="shrink-0 font-semibold underline">{t("common.retry", "Erneut")}</button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">{i18n.language.startsWith("de") ? "Quick-Ideen" : "Quick ideas"}</h3>
            <p className="text-sm text-muted-foreground">{i18n.language.startsWith("de") ? "Entdecke Bausteine für deinen Plan – wische für mehr." : "Explore ideas for your plan – swipe for more."}</p>
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button type="button" onClick={() => ideasScrollRef.current?.scrollBy({ left: -320, behavior: "smooth" })} aria-label={i18n.language.startsWith("de") ? "Vorherige Idee" : "Previous idea"} className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => ideasScrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })} aria-label={i18n.language.startsWith("de") ? "Nächste Idee" : "Next idea"} className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground hover:bg-muted"><ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div ref={ideasScrollRef} role="region" tabIndex={0} aria-label={i18n.language.startsWith("de") ? "Quick-Ideen" : "Quick ideas"} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3">
        {AI_REQUESTS.filter((req) => req.type !== "day_plan").map((req, i) => {
          const isActive = currentType === req.type && isLoading;
          return (
            <AIRequestCard
              key={req.type}
              label={t(req.labelKey)}
              description={t(req.descriptionKey)}
              icon={req.icon}
              imageSrc={req.image}
              gradient={req.gradient}
              isLoading={isActive}
              disabled={creditsExhausted || planningUnavailable}
              lockedLabel={creditsExhausted ? t("aiCredits.exhausted", "Leer") : undefined}
              badge={req.badge}
              index={i}
              onClick={() => {
                if (isLoading || creditsExhausted) return;
                handleRequest(req.type);
              }}
            />
          );
        })}
        </div>
      </div>

      {/* Duration Selector for Day Plan */}
      {showDurationSelector && !response && !isLoading && (
        <DayPlanDurationSelector
          onSelect={handleDurationSelect}
          isLoading={isLoading}
          disabled={creditsExhausted}
          remainingCredits={remaining}
        />
      )}

      {/* Epic Chat Input with quick-prompt chips */}
      <AIChatInput
        value={chatMessage}
        onChange={setChatMessage}
        onSubmit={handleChat}
        isLoading={isLoading && currentType === 'chat'}
        disabled={creditsExhausted || planningUnavailable}
      />

      {/* Loading Skeleton — spectacle variant */}
      {isLoading && !response && (
        <AISpectacleSkeleton
          variant={currentType === 'budget_estimate' ? 'quick' : 'narrative'}
        />
      )}

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {/* Regenerate button for non-day-plan types */}
          {currentType !== 'day_plan' && (
            <div className="flex items-center justify-end">
              <motion.button
                type="button"
                onClick={() => currentType && handleRequest(currentType, currentType === "chat" ? lastChatMessage : undefined)}
                disabled={isLoading || creditsExhausted}
                whileHover={isLoading || creditsExhausted ? undefined : { scale: 1.03 }}
                whileTap={isLoading || creditsExhausted ? undefined : { scale: 0.97 }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                  "bg-foreground/5 border border-border text-foreground/80",
                  "hover:bg-foreground/10 hover:border-foreground/30 hover:text-foreground",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                {t('aiCredits.regenerate', 'Neu generieren')}
              </motion.button>
            </div>
          )}
          
          <AIResponseCard
            response={response}
            eventName={event.name}
            eventId={event.id}
            eventType={event.event_type}
            participantCount={participantCount || undefined}
            budget={topBudget}
            city={getContext().destination_pref}
            requestType={currentType || undefined}
            onAddToPlanner={handleAddToPlanner}
            onAddTimeBlock={handleAddTimeBlock}
            onAddDay={handleAddDay}
            onAddAllToPlanner={() => setShowPlanImport(true)}
            onRegenerate={currentType === 'day_plan' ? handleRegenerate : undefined}
            onExpand={currentType === 'day_plan' ? handleExpand : undefined}
            isLoading={isLoading}
            remainingCredits={remaining}
          />

        </div>
      )}

      {/* Add to Planner Dialog */}
      <AddToPlannerDialog
        open={showPlannerDialog}
        onOpenChange={setShowPlannerDialog}
        activity={selectedActivity}
        eventId={event.id}
        defaultDate={event.event_date || undefined}
        onSuccess={() => {
          setSelectedActivity(null);
        }}
      />

      <Dialog open={showPlanImport} onOpenChange={setShowPlanImport}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{i18n.language.startsWith("de") ? "Plan in Zeitplan übernehmen" : "Add plan to schedule"}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{i18n.language.startsWith("de") ? `${planBlockCount} Programmpunkte an ${planDays.length} Tagen. Wähle den ersten Tag des Plans.` : `${planBlockCount} activities across ${planDays.length} days. Choose the first day.`}</p>
          <label className="space-y-2 text-sm font-medium">
            <span>{i18n.language.startsWith("de") ? "Erster Tag" : "First day"}</span>
            <input type="date" value={planStartDate} onChange={(event) => setPlanStartDate(event.target.value)} className="native-event-date block h-12 w-full rounded-xl border border-border bg-background px-3" />
          </label>
          <Button onClick={() => void importFullPlan()} disabled={!planStartDate || importingPlan || planBlockCount === 0}>{importingPlan ? (i18n.language.startsWith("de") ? "Wird übernommen…" : "Adding…") : (i18n.language.startsWith("de") ? "Alle Programmpunkte übernehmen" : "Add all activities")}</Button>
        </DialogContent>
      </Dialog>

      {/* No Stats Warning — gradient glass */}
      {!statsLoading && actualResponseCount === 0 && !response && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10" />
          <div className="relative p-5 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-black text-foreground mb-0.5">{t('dashboard.ai.noData', 'Noch keine Umfragedaten')}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('dashboard.ai.noDataDesc', 'Teile deine Umfrage — sobald Antworten reinkommen, wird dein Plan persönlicher.')}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
