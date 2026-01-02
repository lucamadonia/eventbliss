import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  DollarSign,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Plus,
  Copy,
  Check,
  Sparkles,
  Lightbulb,
  Calendar,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  parseAIResponse, 
  parseDayPlan,
  parseActivitiesExtended,
  parseTripIdeas,
  detectResponseType,
  type ParsedActivity, 
  type ParsedAIResponse,
  type ParsedTimeBlock,
  type ParsedDay,
  type ParsedActivityExtended,
  type ParsedTripIdea,
} from "@/lib/ai-response-parser";
import { DayPlanCard } from "./DayPlanCard";
import { ActivitiesCard } from "./ActivitiesCard";
import { TripIdeasCard } from "./TripIdeasCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIResponseCardProps {
  response: string;
  eventName?: string;
  participantCount?: number;
  budget?: string;
  requestType?: 'trip_ideas' | 'activities' | 'day_plan' | 'budget_estimate' | 'chat';
  onAddToPlanner?: (activity: ParsedActivity | ParsedActivityExtended) => void;
  onAddTimeBlock?: (timeBlock: ParsedTimeBlock, dayName: string) => void;
  onAddDay?: (day: ParsedDay) => void;
  onSetDestination?: (tripIdea: ParsedTripIdea) => void;
}

export const AIResponseCard = ({
  response,
  eventName,
  participantCount,
  budget,
  requestType,
  onAddToPlanner,
  onAddTimeBlock,
  onAddDay,
  onSetDestination,
}: AIResponseCardProps) => {
  const { t } = useTranslation();
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Detect response type and parse accordingly
  const responseType = detectResponseType(response);
  const parsed: ParsedAIResponse = parseAIResponse(response);
  const dayPlan = responseType === 'day_plan' ? parseDayPlan(response) : null;
  
  const hasStructuredActivities = parsed.activities.length > 0;
  const hasDayPlan = dayPlan && dayPlan.days.length > 0;

  const toggleExpand = (index: number) => {
    setExpandedActivities(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const copyActivity = async (activity: ParsedActivity, index: number) => {
    const text = `${activity.emoji} ${activity.title}\n${activity.duration ? `⏱️ ${activity.duration}\n` : ''}${activity.cost ? `💰 ${activity.cost}\n` : ''}\n${activity.description}`;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(response);
    toast.success(t('common.copied'));
  };

  const getFitnessColor = (fitness: string) => {
    switch (fitness) {
      case 'easy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'challenging': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getFitnessLabel = (fitness: string) => {
    switch (fitness) {
      case 'easy': return t('dashboard.ai.fitnessEasy', 'Leicht');
      case 'challenging': return t('dashboard.ai.fitnessChallenging', 'Anspruchsvoll');
      default: return t('dashboard.ai.fitnessNormal', 'Normal');
    }
  };

  // If day plan detected, render DayPlanCard
  if (hasDayPlan && dayPlan) {
    return (
      <DayPlanCard
        dayPlan={dayPlan}
        eventName={eventName}
        participantCount={participantCount}
        onAddTimeBlock={onAddTimeBlock}
        onAddDay={onAddDay}
      />
    );
  }

  // If trip ideas request type, render TripIdeasCard
  if (requestType === 'trip_ideas') {
    const tripIdeasData = parseTripIdeas(response);
    if (tripIdeasData.ideas.length > 0) {
      return (
        <TripIdeasCard
          tripIdeasData={tripIdeasData}
          eventName={eventName}
          participantCount={participantCount}
          onSetDestination={onSetDestination}
        />
      );
    }
  }

  // If activities request type, ALWAYS try parseActivitiesExtended first (more robust for multilingual)
  if (requestType === 'activities') {
    const activitiesData = parseActivitiesExtended(response);
    if (activitiesData.activities.length > 0) {
      return (
        <ActivitiesCard
          activitiesData={activitiesData}
          eventName={eventName}
          participantCount={participantCount}
          budget={budget}
          onAddToPlanner={onAddToPlanner}
        />
      );
    }
  }

  // If no structured activities found, render as markdown
  if (!hasStructuredActivities) {
    return (
      <GlassCard className="p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h4 className="font-bold">{t('dashboard.ai.response')}</h4>
        </div>
        
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h3: ({ children }) => (
                <h3 className="text-lg font-bold text-foreground mt-6 mb-2 flex items-center gap-2">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="space-y-1 my-2">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="text-muted-foreground">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="text-foreground font-semibold">{children}</strong>
              ),
              p: ({ children }) => (
                <p className="text-muted-foreground mb-3 leading-relaxed">{children}</p>
              ),
            }}
          >
            {response}
          </ReactMarkdown>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" size="sm" onClick={copyAll}>
            <Copy className="w-4 h-4 mr-2" />
            {t('common.copy')}
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with context */}
      <GlassCard className="p-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg">
              {t('dashboard.ai.recommendations', 'AI-Empfehlungen')}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {eventName && (
                <Badge variant="secondary" className="text-xs">
                  {eventName}
                </Badge>
              )}
              {participantCount && (
                <Badge variant="outline" className="text-xs">
                  👥 {participantCount} {t('dashboard.overview.participants', 'Teilnehmer')}
                </Badge>
              )}
              {budget && (
                <Badge variant="outline" className="text-xs">
                  💰 {budget}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Intro text */}
      {parsed.intro && (
        <GlassCard className="p-4">
          <p className="text-muted-foreground leading-relaxed">
            {parsed.intro}
          </p>
        </GlassCard>
      )}

      {/* Activity cards */}
      <div className="space-y-3">
        {parsed.activities.map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-0 overflow-hidden hover:border-primary/30 transition-all group">
              {/* Activity header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{activity.emoji}</span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground truncate">
                        {activity.title}
                      </h4>
                      {/* Metadata badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activity.duration && (
                          <Badge variant="outline" className="text-xs bg-muted/30">
                            <Clock className="w-3 h-3 mr-1" />
                            {activity.duration}
                          </Badge>
                        )}
                        {activity.cost && (
                          <Badge variant="outline" className="text-xs bg-muted/30">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {activity.cost}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getFitnessColor(activity.fitness)}`}
                        >
                          <Dumbbell className="w-3 h-3 mr-1" />
                          {getFitnessLabel(activity.fitness)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick add button */}
                  {onAddToPlanner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => onAddToPlanner(activity)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">{t('dashboard.ai.addToPlanner', 'Zum Planer')}</span>
                    </Button>
                  )}
                </div>

                {/* Short description preview */}
                {activity.description && (
                  <p className={`text-sm text-muted-foreground mt-3 ${
                    !expandedActivities.has(index) ? 'line-clamp-2' : ''
                  }`}>
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Expandable details */}
              <AnimatePresence>
                {expandedActivities.has(index) && activity.description.length > 100 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/50"
                  >
                    <div className="p-4 pt-3 bg-muted/20">
                      <div className="text-sm text-muted-foreground prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {activity.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer actions */}
              <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-t border-border/30">
                {activity.description.length > 100 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => toggleExpand(index)}
                  >
                    {expandedActivities.has(index) ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        {t('dashboard.ai.hideDetails', 'Weniger')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        {t('dashboard.ai.showDetails', 'Mehr Details')}
                      </>
                    )}
                  </Button>
                ) : (
                  <div />
                )}
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => copyActivity(activity, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  {onAddToPlanner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary"
                      onClick={() => onAddToPlanner(activity)}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {t('dashboard.ai.addToPlanner', 'Zum Planer')}
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Tips section */}
      {parsed.tips.length > 0 && (
        <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-400 mb-2">
                {t('dashboard.ai.budgetTip', 'Budget-Tipp')}
              </h4>
              <ul className="space-y-1">
                {parsed.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={copyAll}>
          <Copy className="w-4 h-4 mr-2" />
          {t('dashboard.ai.copyAll', 'Alles kopieren')}
        </Button>
        {onAddToPlanner && parsed.activities.length > 1 && (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => {
              parsed.activities.forEach(activity => onAddToPlanner(activity));
              toast.success(t('dashboard.ai.allAdded', 'Alle Aktivitäten hinzugefügt'));
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.ai.addAllToPlanner', 'Alle hinzufügen')}
          </Button>
        )}
      </div>
    </div>
  );
};
