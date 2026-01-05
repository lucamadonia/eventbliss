import { useState } from "react";
import { Sparkles, Loader2, MapPin, Calendar, DollarSign, Lightbulb, MessageCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePremium } from "@/hooks/usePremium";
import { useAICredits } from "@/hooks/useAICredits";
import { PaywallOverlay } from "@/components/premium/PaywallOverlay";
import { AIResponseCard } from "@/components/dashboard/AIResponseCard";
import { AddToPlannerDialog } from "@/components/dashboard/AddToPlannerDialog";
import { AIActivitiesSkeleton } from "@/components/dashboard/AIActivitiesSkeleton";
import { DayPlanSkeleton } from "@/components/dashboard/DayPlanSkeleton";
import { CreditIndicator } from "@/components/ai/CreditIndicator";
import { DayPlanDurationSelector } from "@/components/ai/DayPlanDurationSelector";
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

type RequestType = "trip_ideas" | "activities" | "day_plan" | "budget_estimate" | "chat";

interface AIRequest {
  type: RequestType;
  icon: React.ElementType;
  labelKey: string;
  descriptionKey: string;
}

const AI_REQUESTS: AIRequest[] = [
  {
    type: "trip_ideas",
    icon: MapPin,
    labelKey: "dashboard.ai.tripIdeas",
    descriptionKey: "dashboard.ai.tripIdeasDesc",
  },
  {
    type: "activities",
    icon: Lightbulb,
    labelKey: "dashboard.ai.activities",
    descriptionKey: "dashboard.ai.activitiesDesc",
  },
  {
    type: "day_plan",
    icon: Calendar,
    labelKey: "dashboard.ai.dayPlan",
    descriptionKey: "dashboard.ai.dayPlanDesc",
  },
  {
    type: "budget_estimate",
    icon: DollarSign,
    labelKey: "dashboard.ai.budgetEstimate",
    descriptionKey: "dashboard.ai.budgetEstimateDesc",
  },
];

export const AIAssistantTab = ({ event, stats }: AIAssistantTabProps) => {
  const { t, i18n } = useTranslation();
  const { isPremium, loading: premiumLoading } = usePremium();
  const { used, limit, remaining, resetDate, loading: creditsLoading, refetch: refetchCredits } = useAICredits();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
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

    try {
      const { data: result, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type,
          context: getContext(options?.targetDays),
          message,
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
      {/* Credits Exhausted Warning */}
      {creditsExhausted && (
        <GlassCard className="p-4 border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-600">{t('aiCredits.exhausted')}</p>
              <p className="text-sm text-muted-foreground">
                {t('aiCredits.creditsReset', { date: resetDate.toLocaleDateString() })}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Header with Credit Indicator */}
      <GlassCard className="p-6 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 rounded-xl bg-gradient-primary">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold">{t('dashboard.ai.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.ai.subtitle')}
              </p>
            </div>
          </div>
          
          {/* Credit Indicator */}
          {!creditsLoading && limit > 0 && (
            <CreditIndicator
              used={used}
              limit={limit}
              remaining={remaining}
              resetDate={resetDate}
              variant="compact"
              showAnimation={creditAnimation}
            />
          )}
        </div>
        
        <p className="text-muted-foreground mt-4">
          {t('dashboard.ai.basedOn', {
            count: (stats?.attendance.yes || 0) + (stats?.attendance.maybe || 0),
            name: event.honoree_name
          })}
        </p>
      </GlassCard>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {AI_REQUESTS.map((req) => {
          const Icon = req.icon;
          const isActive = currentType === req.type && isLoading;
          const isDayPlan = req.type === "day_plan";
          
          return (
            <GlassCard
              key={req.type}
              className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                isActive ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => {
                if (isLoading || creditsExhausted) return;
                if (isDayPlan) {
                  handleDayPlanClick();
                } else {
                  handleRequest(req.type);
                }
              }}
            >
              <div className={`flex flex-col items-center text-center gap-2 ${creditsExhausted ? 'opacity-50' : ''}`}>
                <div className={`p-3 rounded-xl ${
                  isActive ? "bg-primary/30" : "bg-muted/50"
                }`}>
                  {isActive ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm">{t(req.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(req.descriptionKey)}</p>
                </div>
              </div>
            </GlassCard>
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

      {/* Chat Input */}
      <GlassCard className="p-4">
        <div className="flex gap-3">
          <Textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder={t('dashboard.ai.chatPlaceholder')}
            className="resize-none bg-background/50"
            rows={2}
          />
          <GradientButton
            onClick={handleChat}
            disabled={isLoading || !chatMessage.trim() || creditsExhausted}
            icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          >
            {t('dashboard.ai.ask')}
          </GradientButton>
        </div>
      </GlassCard>

      {/* Loading Skeleton - Different for day_plan */}
      {isLoading && !response && (
        currentType === 'day_plan' ? (
          <DayPlanSkeleton />
        ) : (
          <AIActivitiesSkeleton 
            count={currentType === 'activities' ? 5 : 4} 
          />
        )
      )}

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {/* Regenerate button for non-day-plan types */}
          {currentType !== 'day_plan' && (
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => currentType && handleRequest(currentType)}
                disabled={isLoading || creditsExhausted}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {t('aiCredits.regenerate')}
              </Button>
            </div>
          )}
          
          <AIResponseCard
            response={response}
            eventName={event.name}
            participantCount={participantCount || undefined}
            budget={topBudget}
            requestType={currentType || undefined}
            onAddToPlanner={handleAddToPlanner}
            onAddTimeBlock={handleAddTimeBlock}
            onAddDay={handleAddDay}
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
        onSuccess={() => {
          setSelectedActivity(null);
        }}
      />

      {/* No Stats Warning */}
      {!stats && (
        <GlassCard className="p-6 border-warning/30">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <h4 className="font-bold text-warning">{t('dashboard.ai.noData')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.ai.noDataDesc')}
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
