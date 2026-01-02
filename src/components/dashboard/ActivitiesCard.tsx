import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  Copy,
  Check,
  Lightbulb,
  Sparkles,
  Dumbbell,
  Download,
  FileText,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type ParsedActivitiesResponse, type ParsedActivityExtended } from "@/lib/ai-response-parser";
import { openActivitiesPrint, downloadActivitiesHTML } from "@/lib/activities-pdf-export";

interface ActivitiesCardProps {
  activitiesData: ParsedActivitiesResponse;
  eventName?: string;
  participantCount?: number;
  budget?: string;
  onAddToPlanner?: (activity: ParsedActivityExtended) => void;
}

// Premium activity styles with category-based gradients
const ACTIVITY_STYLES = {
  action: {
    gradient: 'from-red-600 via-red-500 to-orange-500',
    bgLight: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  food: {
    gradient: 'from-orange-600 via-orange-500 to-amber-500',
    bgLight: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  wellness: {
    gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  party: {
    gradient: 'from-pink-600 via-pink-500 to-rose-500',
    bgLight: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  },
  sightseeing: {
    gradient: 'from-blue-600 via-blue-500 to-indigo-500',
    bgLight: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  adventure: {
    gradient: 'from-violet-600 via-violet-500 to-purple-500',
    bgLight: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  },
  other: {
    gradient: 'from-slate-600 via-slate-500 to-zinc-500',
    bgLight: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  },
};

type StyleKey = keyof typeof ACTIVITY_STYLES;

export const ActivitiesCard = ({
  activitiesData,
  eventName,
  participantCount,
  budget,
  onAddToPlanner,
}: ActivitiesCardProps) => {
  const { t, i18n } = useTranslation();
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleActivity = (index: number) => {
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

  const getStyle = (category: string): typeof ACTIVITY_STYLES.other => {
    const key = category.toLowerCase() as StyleKey;
    return ACTIVITY_STYLES[key] || ACTIVITY_STYLES.other;
  };

  const copyActivity = async (activity: ParsedActivityExtended, id: string) => {
    const text = `${activity.emoji} ${activity.title}\n⏱️ ${activity.duration}\n💰 ${activity.cost}\n💪 ${activity.fitness}\n\n${activity.description}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(activitiesData.rawResponse);
    toast.success(t('common.copied'));
  };

  const normalizedLocale = (i18n.language || 'en').toLowerCase().split(/[-_]/)[0];

  const handlePrint = () => {
    openActivitiesPrint(activitiesData, {
      name: eventName || 'Event',
      participantCount,
      budget,
    }, normalizedLocale);
    toast.success(t('dashboard.ai.printOpened'));
  };

  const handleDownload = () => {
    downloadActivitiesHTML(activitiesData, {
      name: eventName || 'Event',
      participantCount,
      budget,
    }, normalizedLocale);
    toast.success(t('dashboard.ai.downloaded'));
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg">
              {t('dashboard.ai.activitySuggestions')}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {eventName && (
                <Badge variant="secondary" className="text-xs">
                  {eventName}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                🎯 {activitiesData.activities.length} {t('dashboard.ai.activities')}
              </Badge>
              {participantCount && (
                <Badge variant="outline" className="text-xs">
                  👥 {participantCount}
                </Badge>
              )}
              {budget && (
                <Badge variant="outline" className="text-xs">
                  💰 {budget}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-8" onClick={handlePrint}>
              <FileText className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Intro */}
      {activitiesData.intro && (
        <GlassCard className="p-4">
          <p className="text-muted-foreground leading-relaxed text-sm">
            {activitiesData.intro}
          </p>
        </GlassCard>
      )}

      {/* Activity Cards */}
      <div className="space-y-4">
        {activitiesData.activities.map((activity, index) => {
          const style = getStyle(activity.category);
          const activityNumber = index + 1;
          const activityId = `activity-${index}`;
          const isExpanded = expandedActivities.has(index);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className={cn("p-0 overflow-hidden border-2", style.border)}>
                {/* Premium Activity Header */}
                <button
                  onClick={() => toggleActivity(index)}
                  className={cn(
                    "w-full p-4 flex items-center gap-4",
                    "bg-gradient-to-r",
                    style.gradient,
                    "hover:opacity-95 transition-opacity text-left"
                  )}
                >
                  {/* Activity Number Badge */}
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-white font-black text-sm tracking-wider">
                      {t('dashboard.ai.activityLabel')} {activityNumber}
                    </span>
                  </div>

                  {/* Activity Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-lg truncate">
                      {activity.title}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {activity.duration && (
                        <span className="text-white/80 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {activity.duration}
                        </span>
                      )}
                      {activity.cost && (
                        <span className="text-white/80 text-sm">
                          💰 {activity.cost}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Emoji & Actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activity.emoji}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/80" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/80" />
                    )}
                  </div>
                </button>

                {/* Expandable Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {/* Metadata Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getFitnessColor(activity.fitness)}>
                            <Dumbbell className="w-3 h-3 mr-1" />
                            {getFitnessLabel(activity.fitness)}
                          </Badge>
                          {activity.location && (
                            <Badge variant="outline" className="bg-muted/30">
                              <MapPin className="w-3 h-3 mr-1" />
                              {activity.location}
                            </Badge>
                          )}
                          <Badge variant="outline" className={style.badge}>
                            {activity.category}
                          </Badge>
                        </div>

                        {/* Description */}
                        {activity.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {activity.description}
                          </p>
                        )}

                        {/* Highlights */}
                        {activity.highlights && activity.highlights.length > 0 && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                            <h5 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                              ✅ {t('dashboard.ai.highlights')}
                            </h5>
                            <ul className="space-y-1">
                              {activity.highlights.map((highlight, i) => (
                                <li key={i} className="text-sm text-emerald-300/80 flex items-start gap-2">
                                  <span className="text-emerald-400">•</span>
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyActivity(activity, activityId);
                            }}
                          >
                            {copiedId === activityId ? (
                              <Check className="w-3 h-3 text-emerald-400 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {t('common.copy')}
                          </Button>
                          {onAddToPlanner && (
                            <Button
                              size="sm"
                              variant="default"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToPlanner(activity);
                                toast.success(t('dashboard.ai.addedToPlanner'));
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              {t('dashboard.ai.addToPlanner')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Tips Section */}
      {activitiesData.tips.length > 0 && (
        <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-400 mb-2">
                {t('dashboard.ai.budgetTips')}
              </h4>
              <ul className="space-y-1">
                {activitiesData.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={copyAll}>
          <Copy className="w-4 h-4 mr-2" />
          {t('dashboard.ai.copyAll')}
        </Button>
        {onAddToPlanner && activitiesData.activities.length > 1 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              activitiesData.activities.forEach(activity => onAddToPlanner(activity));
              toast.success(t('dashboard.ai.allAdded'));
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.ai.addAllToPlanner')}
          </Button>
        )}
      </div>
    </div>
  );
};
