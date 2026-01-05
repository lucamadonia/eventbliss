import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Car,
  ChevronDown,
  ChevronUp,
  Plus,
  Copy,
  Check,
  Lightbulb,
  AlertTriangle,
  Calendar,
  Download,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  type ParsedDayPlan, 
  type ParsedDay, 
  type ParsedTimeBlock,
  type TimeOfDay,
  groupTimeBlocksByPeriod,
} from "@/lib/ai-response-parser";
import { CATEGORY_CONFIG } from "@/lib/category-config";
import { cn } from "@/lib/utils";
import { openDayPlanPrint, downloadDayPlanHTML } from "@/lib/day-plan-pdf-export";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DayPlanCardProps {
  dayPlan: ParsedDayPlan;
  eventName?: string;
  participantCount?: number;
  onAddTimeBlock?: (timeBlock: ParsedTimeBlock, dayName: string) => void;
  onAddDay?: (day: ParsedDay) => void;
}

// Premium day colors with gradients
const DAY_STYLES = [
  { 
    gradient: 'from-indigo-600 via-indigo-500 to-blue-500',
    bgLight: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    dot: 'bg-indigo-500',
  },
  { 
    gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
  { 
    gradient: 'from-orange-600 via-orange-500 to-amber-500',
    bgLight: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
  },
  { 
    gradient: 'from-violet-600 via-violet-500 to-purple-500',
    bgLight: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    dot: 'bg-violet-500',
  },
  { 
    gradient: 'from-rose-600 via-rose-500 to-pink-500',
    bgLight: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
  },
  { 
    gradient: 'from-cyan-600 via-cyan-500 to-sky-500',
    bgLight: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    dot: 'bg-cyan-500',
  },
];

// Time period configuration with icons, colors, and emojis
const TIME_PERIOD_CONFIG: Record<TimeOfDay, {
  emoji: string;
  gradient: string;
  border: string;
  Icon: typeof Sunrise;
  iconColor: string;
}> = {
  morning: {
    emoji: '🌅',
    gradient: 'from-amber-500/15 to-orange-500/5',
    border: 'border-amber-500/30',
    Icon: Sunrise,
    iconColor: 'text-amber-500',
  },
  noon: {
    emoji: '☀️',
    gradient: 'from-yellow-500/15 to-amber-500/5',
    border: 'border-yellow-500/30',
    Icon: Sun,
    iconColor: 'text-yellow-500',
  },
  evening: {
    emoji: '🌆',
    gradient: 'from-orange-500/15 to-rose-500/5',
    border: 'border-orange-500/30',
    Icon: Sunset,
    iconColor: 'text-orange-500',
  },
  night: {
    emoji: '🌙',
    gradient: 'from-indigo-500/15 to-purple-500/5',
    border: 'border-indigo-500/30',
    Icon: Moon,
    iconColor: 'text-indigo-400',
  },
};

interface TimePeriodSectionProps {
  period: TimeOfDay;
  blocks: ParsedTimeBlock[];
  dayIndex: number;
  dayName: string;
  onAddTimeBlock?: (timeBlock: ParsedTimeBlock, dayName: string) => void;
}

const TimePeriodSection = ({ 
  period, 
  blocks, 
  dayIndex,
  dayName,
  onAddTimeBlock,
}: TimePeriodSectionProps) => {
  const { t } = useTranslation();
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const config = TIME_PERIOD_CONFIG[period];

  if (blocks.length === 0) return null;

  const toggleBlock = (id: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyTimeBlock = async (block: ParsedTimeBlock, id: string) => {
    const text = `${block.time} - ${block.emoji} ${block.title}\n${block.location ? `📍 ${block.location}\n` : ''}${block.cost ? `💰 ${block.cost}\n` : ''}${block.description}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;
  };

  return (
    <div className={cn(
      "rounded-xl border p-4 bg-gradient-to-br",
      config.gradient,
      config.border
    )}>
      {/* Period Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{config.emoji}</span>
        <config.Icon className={cn("w-5 h-5", config.iconColor)} />
        <h5 className="font-bold text-sm uppercase tracking-wider">
          {t(`dashboard.ai.timeOfDay.${period}`)}
        </h5>
        <Badge variant="outline" className="ml-auto text-xs">
          {blocks.length} {blocks.length === 1 ? t('dashboard.ai.activity') : t('dashboard.ai.activities')}
        </Badge>
      </div>

      {/* Time Blocks */}
      <div className="space-y-3">
        {blocks.map((block, blockIndex) => {
          const blockId = `${dayIndex}-${period}-${blockIndex}`;
          const isExpanded = expandedBlocks.has(blockId);
          const categoryConfig = getCategoryConfig(block.category);

          return (
            <motion.div
              key={blockId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: blockIndex * 0.05 }}
              className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50 hover:border-border transition-colors group"
            >
              {/* Block Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge 
                  variant="outline" 
                  className="font-mono text-xs bg-background/80"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {block.time}
                </Badge>
                <span className="text-2xl">{block.emoji}</span>
                <h6 className="font-semibold text-foreground flex-1 min-w-0">
                  {block.title}
                </h6>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", categoryConfig.bgClass, categoryConfig.colorClass)}
                >
                  {categoryConfig.emoji}
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {block.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">{block.location}</span>
                  </div>
                )}
                {block.cost && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-emerald-500 flex-shrink-0">💰</span>
                    <span className="truncate">{block.cost}</span>
                  </div>
                )}
                {block.transport && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Car className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{block.transport}</span>
                  </div>
                )}
                {block.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="truncate">{block.duration}</span>
                  </div>
                )}
              </div>

              {/* Expandable Description */}
              {(block.description || block.tips.length > 0 || block.warnings.length > 0) && (
                <Collapsible open={isExpanded} onOpenChange={() => toggleBlock(blockId)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 h-7 text-xs text-muted-foreground w-full justify-center hover:text-foreground"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          {t('dashboard.ai.hideDetails')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          {t('dashboard.ai.showDetails')}
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    {block.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {block.description}
                      </p>
                    )}

                    {block.tips.length > 0 && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                          {block.tips.map((tip, i) => (
                            <p key={i}>{tip}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.warnings.length > 0 && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          {block.warnings.map((warning, i) => (
                            <p key={i}>{warning}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => copyTimeBlock(block, blockId)}
                >
                  {copiedId === blockId ? (
                    <Check className="w-3 h-3 mr-1 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {t('common.copy')}
                </Button>
                {onAddTimeBlock && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-primary hover:text-primary"
                    onClick={() => onAddTimeBlock(block, dayName)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t('dashboard.ai.addToPlanner')}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const DayPlanCard = ({
  dayPlan,
  eventName,
  participantCount,
  onAddTimeBlock,
  onAddDay,
}: DayPlanCardProps) => {
  const { t, i18n } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

  const toggleDay = (index: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(dayPlan.rawResponse);
    toast.success(t('common.copied'));
  };

  const handlePrint = () => {
    openDayPlanPrint(dayPlan, { 
      name: eventName || 'Event', 
      participantCount 
    }, i18n.language);
    toast.success(t('dashboard.ai.printOpened'));
  };

  const handleDownload = () => {
    downloadDayPlanHTML(dayPlan, { 
      name: eventName || 'Event', 
      participantCount 
    }, i18n.language);
    toast.success(t('dashboard.ai.downloaded'));
  };

  const getDayStyle = (index: number) => {
    return DAY_STYLES[index % DAY_STYLES.length];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg">
              {t('dashboard.ai.dayPlan')}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {eventName && (
                <Badge variant="secondary" className="text-xs">
                  {eventName}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                📅 {dayPlan.days.length} {t('dashboard.ai.days')}
              </Badge>
              {participantCount && (
                <Badge variant="outline" className="text-xs">
                  👥 {participantCount}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyAll}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Intro */}
      {dayPlan.intro && (
        <GlassCard className="p-4">
          <p className="text-muted-foreground leading-relaxed text-sm">
            {dayPlan.intro}
          </p>
        </GlassCard>
      )}

      {/* Days */}
      <div className="space-y-6">
        {dayPlan.days.map((day, dayIndex) => {
          const dayStyle = getDayStyle(dayIndex);
          const tagNumber = dayIndex + 1;
          const blocksByPeriod = day.blocksByPeriod || groupTimeBlocksByPeriod(day.timeBlocks);
          const periods: TimeOfDay[] = ['morning', 'noon', 'evening', 'night'];

          return (
            <motion.div
              key={dayIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
            >
              <GlassCard className={cn("p-0 overflow-hidden border-2", dayStyle.border)}>
                {/* Premium Day Header with TAG number */}
                <button
                  onClick={() => toggleDay(dayIndex)}
                  className={cn(
                    "w-full p-4 flex items-center gap-4",
                    "bg-gradient-to-r",
                    dayStyle.gradient,
                    "hover:opacity-95 transition-opacity"
                  )}
                >
                  {/* TAG Badge */}
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-white font-black text-sm tracking-wider">
                      {t('dashboard.ai.tag')} {tagNumber}
                    </span>
                  </div>
                  
                  {/* Day Info */}
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-white text-lg uppercase tracking-wide">
                      {day.dayName}
                    </h4>
                    <p className="text-white/80 text-sm">
                      {day.title} • {day.timeBlocks.length} {t('dashboard.ai.activities')}
                    </p>
                  </div>

                  {/* Emoji & Actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{day.emoji}</span>
                    {onAddDay && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddDay(day);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {t('dashboard.ai.addDay')}
                      </Button>
                    )}
                    {expandedDays.has(dayIndex) ? (
                      <ChevronUp className="w-5 h-5 text-white/80" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/80" />
                    )}
                  </div>
                </button>

                {/* Time Period Sections */}
                <AnimatePresence>
                  {expandedDays.has(dayIndex) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {periods.map(period => (
                          <TimePeriodSection
                            key={period}
                            period={period}
                            blocks={blocksByPeriod[period]}
                            dayIndex={dayIndex}
                            dayName={day.dayName}
                            onAddTimeBlock={onAddTimeBlock}
                          />
                        ))}

                        {/* No activities fallback */}
                        {day.timeBlocks.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t('dashboard.ai.noActivities')}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* General Tips */}
      {dayPlan.generalTips.length > 0 && (
        <GlassCard className="p-4 bg-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-sm">{t('dashboard.ai.generalTips')}</h4>
          </div>
          <ul className="space-y-2">
            {dayPlan.generalTips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
};
