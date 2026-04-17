import { useState } from "react";
import { MapPin, Calendar, DollarSign, Lightbulb, RefreshCw, AlertTriangle, Store, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { useAICredits } from "@/hooks/useAICredits";
import { PaywallOverlay } from "@/components/premium/PaywallOverlay";
import { AIResponseCard } from "@/components/dashboard/AIResponseCard";
import { AddToPlannerDialog } from "@/components/dashboard/AddToPlannerDialog";
import { MarketplaceRecommendationCard } from "@/components/dashboard/MarketplaceRecommendationCard";
import { DayPlanDurationSelector } from "@/components/ai/DayPlanDurationSelector";
import AIHeroHeader from "@/components/dashboard/AIHeroHeader";
import { AIRequestCard } from "@/components/dashboard/AIRequestCard";
import AIChatInput from "@/components/dashboard/AIChatInput";
import AISpectacleSkeleton from "@/components/dashboard/AISpectacleSkeleton";
import { cn } from "@/lib/utils";
import type { EventData } from "@/hooks/useEvent";
import type { ParsedActivity, ParsedTimeBlock, ParsedDay } from "@/lib/ai-response-parser";

interface AIAssistantTabProps {
  event: EventData;
  stats: {
    attendance: { yes: number; maybe: number; no: number };
    budgets: Record<string, number>;
    destinations: Record<string, number>;
    activities: Record<string, number>;
    fitness_levels: Record<string, number>;
  } | null;
}

type RequestType = "trip_ideas" | "activities" | "day_plan" | "budget_estimate" | "chat" | "recommend_services";

interface AIRequest {
  type: RequestType;
  icon: React.ElementType;
  labelKey: string;
  descriptionKey: string;
  /** Tailwind gradient classes — "from-… via-… to-…" */
  gradient: string;
  /** "r,g,b" tuple for mouse-tracking spotlight rgba */
  accent: string;
  badge?: string;
}

const AI_REQUESTS: AIRequest[] = [
  {
    type: "trip_ideas",
    icon: MapPin,
    labelKey: "dashboard.ai.tripIdeas",
    descriptionKey: "dashboard.ai.tripIdeasDesc",
    gradient: "from-purple-600 via-pink-600 to-amber-500",
    accent: "236,72,153",
  },
  {
    type: "activities",
    icon: Lightbulb,
    labelKey: "dashboard.ai.activities",
    descriptionKey: "dashboard.ai.activitiesDesc",
    gradient: "from-cyan-500 via-blue-500 to-indigo-600",
    accent: "59,130,246",
  },
  {
    type: "day_plan",
    icon: Calendar,
    labelKey: "dashboard.ai.dayPlan",
    descriptionKey: "dashboard.ai.dayPlanDesc",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    accent: "20,184,166",
  },
  {
    type: "budget_estimate",
    icon: DollarSign,
    labelKey: "dashboard.ai.budgetEstimate",
    descriptionKey: "dashboard.ai.budgetEstimateDesc",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    accent: "245,158,11",
  },
  {
    type: "recommend_services" as RequestType,
    icon: Store,
    labelKey: "dashboard.ai.recommendServices",
    descriptionKey: "dashboard.ai.recommendServicesDesc",
    gradient: "from-fuchsia-500 via-rose-500 to-amber-400",
    accent: "232,121,249",
    badge: "NEU",
  },
];

export const AIAssistantTab = ({ event, stats }: AIAssistantTabProps) => {
  const { t, i18n } = useTranslation();
  const { isPremium, loading: premiumLoading } = usePremium();
  const { used, limit, remaining, resetDate, loading: creditsLoading, refetch: refetchCredits } = useAICredits();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [currentType, setCurrentType] = useState<RequestType | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<ParsedActivity | null>(null);
  const [showPlannerDialog, setShowPlannerDialog] = useState(false);
  const [showDurationSelector, setShowDurationSelector] = useState(false);
  const [creditAnimation, setCreditAnimation] = useState(false);

  // Show paywall if not premium
  if (!premiumLoading && !isPremium) {
    return <PaywallOverlay feature="ai_assistant" />;
  }

  const creditsExhausted = limit > 0 && remaining <= 0;

  const getContext = (targetDays?: number) => {
    const participantCount = (stats?.attendance.yes || 0) + (stats?.attendance.maybe || 0);
    
    // Get top budget
    const budgetEntries = Object.entries(stats?.budgets || {});
    const topBudget = budgetEntries.length > 0 
      ? budgetEntries.sort((a, b) => b[1] - a[1])[0][0]
      : "150-250";

    // Get top destination
    const destEntries = Object.entries(stats?.destinations || {});
    const topDestination = destEntries.length > 0
      ? destEntries.sort((a, b) => b[1] - a[1])[0][0]
      : "either";

    // Get top activities
    const activityEntries = Object.entries(stats?.activities || {});
    const topActivities = activityEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => key);

    // Get fitness level
    const fitnessEntries = Object.entries(stats?.fitness_levels || {});
    const topFitness = fitnessEntries.length > 0
      ? fitnessEntries.sort((a, b) => b[1] - a[1])[0][0]
      : "normal";

    return {
      event_type: event.event_type,
      honoree_name: event.honoree_name,
      participant_count: participantCount || 8,
      avg_budget: topBudget,
      destination_pref: topDestination,
      top_activities: topActivities,
      fitness_level: topFitness,
      duration: "weekend",
      language: (i18n.language || event.locale || 'en').toLowerCase().split(/[-_]/)[0],
      event_name: event.name,
      event_description: event.description || undefined,
      target_days: targetDays,
      marketplace_hint: "Beruecksichtige verfuegbare Services im EventBliss Marketplace. Empfehle konkrete Kategorien: workshop, entertainment, catering, music, photography, venue, wellness, sport.",
    };
  };

  const handleRequest = async (type: RequestType, message?: string, options?: { targetDays?: number }) => {
    if (creditsExhausted) {
      toast.error(t('aiCredits.noCreditsLeft'));
      return;
    }

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
        if (error.message?.includes('429') || error.message?.includes('rate')) {
          toast.error(t('dashboard.ai.tooManyRequests'));
        } else if (error.message?.includes('402') || error.message?.includes('credit')) {
          toast.error(t('aiCredits.noCreditsLeft'));
        } else {
          throw new Error(error.message || "AI request failed");
        }
        return;
      }

      if (!result?.success) {
        throw new Error(result?.error || "AI request failed");
      }

      setResponse(result.response);

      // Extract marketplace categories from AI response for matching
      const categories: string[] = [];
      const responseText = (result.response || "").toLowerCase();
      if (responseText.includes("cocktail") || responseText.includes("workshop") || responseText.includes("kurs")) categories.push("workshop");
      if (responseText.includes("escape") || responseText.includes("unterhaltung") || responseText.includes("show") || responseText.includes("krimi")) categories.push("entertainment");
      if (responseText.includes("essen") || responseText.includes("dinner") || responseText.includes("tasting") || responseText.includes("koch") || responseText.includes("wein")) categories.push("catering");
      if (responseText.includes("dj") || responseText.includes("musik") || responseText.includes("band") || responseText.includes("karaoke")) categories.push("music");
      if (responseText.includes("foto") || responseText.includes("shooting") || responseText.includes("kamera")) categories.push("photography");
      if (responseText.includes("yoga") || responseText.includes("wellness") || responseText.includes("spa") || responseText.includes("massage")) categories.push("wellness");
      if (responseText.includes("sport") || responseText.includes("kart") || responseText.includes("kletter") || responseText.includes("bowling")) categories.push("sport");
      if (responseText.includes("location") || responseText.includes("venue") || responseText.includes("raum")) categories.push("venue");
      setSuggestedCategories([...new Set(categories)]);

      // Refetch credits and show animation
      await refetchCredits();
      setCreditAnimation(true);
      setTimeout(() => setCreditAnimation(false), 1500);
      
      // Show credit used toast
      toast.success(t('aiCredits.creditUsed', { remaining: Math.max(0, remaining - 1) }));
    } catch (error) {
      console.error("AI error:", error);
      toast.error(t('dashboard.ai.requestFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    await handleRequest("chat", chatMessage);
    setChatMessage("");
  };

  const handleDayPlanClick = () => {
    if (creditsExhausted) {
      toast.error(t('aiCredits.noCreditsLeft'));
      return;
    }
    setShowDurationSelector(true);
    setResponse(null);
    setCurrentType("day_plan");
  };

  const handleDurationSelect = async (days: number) => {
    await handleRequest("day_plan", undefined, { targetDays: days });
  };

  const handleRegenerate = async (targetDays?: number) => {
    if (currentType === "day_plan") {
      await handleRequest("day_plan", undefined, { targetDays });
    } else if (currentType) {
      await handleRequest(currentType);
    }
  };

  const handleExpand = async (targetDays: number) => {
    await handleRequest("day_plan", undefined, { targetDays });
  };

  const handleAddToPlanner = (activity: ParsedActivity) => {
    setSelectedActivity(activity);
    setShowPlannerDialog(true);
  };

  const handleAddTimeBlock = (timeBlock: ParsedTimeBlock, dayName: string) => {
    const activity: ParsedActivity = {
      emoji: timeBlock.emoji,
      title: timeBlock.title,
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

  // Get context for response card
  const participantCount = (stats?.attendance.yes || 0) + (stats?.attendance.maybe || 0);
  const budgetEntries = Object.entries(stats?.budgets || {});
  const topBudget = budgetEntries.length > 0 
    ? budgetEntries.sort((a, b) => b[1] - a[1])[0][0]
    : undefined;

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
              <p className="font-black text-amber-200">{t('aiCredits.exhausted', 'Credits aufgebraucht')}</p>
              <p className="text-sm text-amber-100/80">
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
        city={getContext().destination_pref !== "either" ? getContext().destination_pref : undefined}
        participantCount={(stats?.attendance.yes || 0) + (stats?.attendance.maybe || 0)}
        surveyResponses={(stats?.attendance.yes || 0) + (stats?.attendance.maybe || 0)}
        credits={{
          used,
          limit,
          remaining,
          resetDate,
          loading: creditsLoading,
        }}
        creditsAnimating={creditAnimation}
      />

      {/* Spectacle action cards: 5 cards with per-kind gradient, spotlight, icon bounce */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {AI_REQUESTS.map((req, i) => {
          const isActive = currentType === req.type && isLoading;
          const isDayPlan = req.type === "day_plan";
          return (
            <AIRequestCard
              key={req.type}
              label={t(req.labelKey)}
              description={t(req.descriptionKey)}
              icon={req.icon}
              gradient={req.gradient}
              accentColor={req.accent}
              isLoading={isActive}
              disabled={creditsExhausted}
              lockedLabel={creditsExhausted ? t("aiCredits.exhausted", "Leer") : undefined}
              badge={req.badge}
              index={i}
              onClick={() => {
                if (isLoading || creditsExhausted) return;
                if (isDayPlan) handleDayPlanClick();
                else handleRequest(req.type);
              }}
            />
          );
        })}
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
        disabled={creditsExhausted}
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
                onClick={() => currentType && handleRequest(currentType)}
                disabled={isLoading || creditsExhausted}
                whileHover={isLoading || creditsExhausted ? undefined : { scale: 1.03 }}
                whileTap={isLoading || creditsExhausted ? undefined : { scale: 0.97 }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                  "bg-white/[0.05] border border-white/15 text-white/80",
                  "hover:bg-white/10 hover:border-white/30 hover:text-white",
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
            city={getContext().destination_pref !== "either" ? getContext().destination_pref : undefined}
            requestType={currentType || undefined}
            onAddToPlanner={handleAddToPlanner}
            onAddTimeBlock={handleAddTimeBlock}
            onAddDay={handleAddDay}
            onRegenerate={currentType === 'day_plan' ? handleRegenerate : undefined}
            onExpand={currentType === 'day_plan' ? handleExpand : undefined}
            isLoading={isLoading}
            remainingCredits={remaining}
          />

          {/* Marketplace Recommendations — hidden for trip_ideas since the
              Epic narrative renderer already embeds contextual services inline. */}
          {response && suggestedCategories.length > 0 && currentType !== 'trip_ideas' && (
            <MarketplaceRecommendationCard
              suggestedCategories={suggestedCategories}
              responseText={response}
              city={getContext().destination_pref !== "either" ? getContext().destination_pref : undefined}
              eventType={event.event_type}
              requestType={currentType || undefined}
              eventId={event.id}
            />
          )}
        </div>
      )}

      {/* Add to Planner Dialog */}
      <AddToPlannerDialog
        open={showPlannerDialog}
        onOpenChange={setShowPlannerDialog}
        activity={selectedActivity}
        eventId={event.id}
        onSuccess={() => {
          setSelectedActivity(null);
        }}
      />

      {/* No Stats Warning — gradient glass */}
      {!stats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10" />
          <div className="relative p-5 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-black text-foreground mb-0.5">{t('dashboard.ai.noData', 'Noch keine Umfragedaten')}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('dashboard.ai.noDataDesc', 'Teile deine Umfrage — sobald Antworten reinkommen, personalisiert die KI ihre Vorschläge.')}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
