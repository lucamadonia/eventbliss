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
  FileText,
  Download,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type ParsedDayPlan, type ParsedDay, type ParsedTimeBlock } from "@/lib/ai-response-parser";
import { CATEGORY_CONFIG } from "@/lib/category-config";
import { cn } from "@/lib/utils";
import { openDayPlanPrint, downloadDayPlanHTML } from "@/lib/day-plan-pdf-export";

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

export const DayPlanCard = ({
  dayPlan,
  eventName,
  participantCount,
  onAddTimeBlock,
  onAddDay,
}: DayPlanCardProps) => {
  const { t, i18n } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleDay = (index: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleBlock = (id: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyTimeBlock = async (block: ParsedTimeBlock, id: string) => {
    const text = `${block.time} - ${block.emoji} ${block.title}\n${block.location ? `📍 ${block.location}\n` : ''}${block.description}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedId(null), 2000);
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
    toast.success(t('dashboard.ai.printOpened', 'Druckvorschau geöffnet'));
  };

  const handleDownload = () => {
    downloadDayPlanHTML(dayPlan, { 
      name: eventName || 'Event', 
      participantCount 
    }, i18n.language);
    toast.success(t('dashboard.ai.downloaded', 'Download gestartet'));
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;
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
              {t('dashboard.ai.dayPlan', 'Detaillierter Tagesplan')}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {eventName && (
                <Badge variant="secondary" className="text-xs">
                  {eventName}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                📅 {dayPlan.days.length} {t('dashboard.ai.days', 'Tage')}
              </Badge>
              {participantCount && (
                <Badge variant="outline" className="text-xs">
                  👥 {participantCount}
                </Badge>
              )}
            </div>
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
                    TAG {tagNumber}
                  </span>
                </div>
                
                {/* Day Info */}
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-white text-lg uppercase tracking-wide">
                    {day.dayName}
                  </h4>
                  <p className="text-white/80 text-sm">
                    {day.title} • {day.timeBlocks.length} {t('dashboard.ai.activities', 'Aktivitäten')}
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
                      {t('dashboard.ai.addDay', 'Tag hinzufügen')}
                    </Button>
                  )}
                  {expandedDays.has(dayIndex) ? (
                    <ChevronUp className="w-5 h-5 text-white/80" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/80" />
                  )}
                </div>
              </button>

              {/* Time Blocks */}
              <AnimatePresence>
                {expandedDays.has(dayIndex) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-2 space-y-3">
                      {/* Timeline */}
                      <div className="relative">
                        {day.timeBlocks.map((block, blockIndex) => {
                          const blockId = `${dayIndex}-${blockIndex}`;
                          const isExpanded = expandedBlocks.has(blockId);
                          const categoryConfig = getCategoryConfig(block.category);

                          return (
                            <div key={blockIndex} className="relative pl-6 pb-4 last:pb-0">
                              {/* Timeline line */}
                              {blockIndex < day.timeBlocks.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
                              )}
                              
                              {/* Timeline dot */}
                              <div 
                                className={cn(
                                  "absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                  categoryConfig.bgClass,
                                  categoryConfig.colorClass
                                )}
                              >
                                {categoryConfig.emoji}
                              </div>

                              {/* Time Block Card */}
                              <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors group">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {/* Time & Title */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="text-xs font-mono">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {block.time}
                                      </Badge>
                                      <span className="text-lg">{block.emoji}</span>
                                      <span className="font-semibold text-foreground">
                                        {block.title}
                                      </span>
                                    </div>

                                    {/* Quick info badges */}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {block.location && (
                                        <Badge variant="secondary" className="text-xs">
                                          <MapPin className="w-3 h-3 mr-1" />
                                          {block.location.slice(0, 30)}{block.location.length > 30 ? '...' : ''}
                                        </Badge>
                                      )}
                                      {block.transport && (
                                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                                          <Car className="w-3 h-3 mr-1" />
                                          {block.transport.slice(0, 25)}{block.transport.length > 25 ? '...' : ''}
                                        </Badge>
                                      )}
                                      {block.cost && (
                                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                          💰 {block.cost}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Expandable details */}
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="mt-3 space-y-2"
                                        >
                                          {block.description && (
                                            <p className="text-sm text-muted-foreground">
                                              {block.description}
                                            </p>
                                          )}

                                          {block.tips.length > 0 && (
                                            <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                                              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                              <div className="text-xs text-amber-200">
                                                {block.tips.map((tip, i) => (
                                                  <p key={i}>{tip}</p>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {block.warnings.length > 0 && (
                                            <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                                              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                              <div className="text-xs text-red-200">
                                                {block.warnings.map((warning, i) => (
                                                  <p key={i}>{warning}</p>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => copyTimeBlock(block, blockId)}
                                    >
                                      {copiedId === blockId ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </Button>
                                    {onAddTimeBlock && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs text-primary"
                                        onClick={() => onAddTimeBlock(block, day.dayName)}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">{t('dashboard.ai.addToPlanner', 'Planer')}</span>
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Expand toggle */}
                                {(block.description || block.tips.length > 0 || block.warnings.length > 0) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-6 text-xs text-muted-foreground w-full justify-center"
                                    onClick={() => toggleBlock(blockId)}
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3 h-3 mr-1" />
                                        {t('dashboard.ai.hideDetails', 'Weniger')}
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3 mr-1" />
                                        {t('dashboard.ai.showDetails', 'Details')}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
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

      {/* General Tips */}
      {dayPlan.generalTips.length > 0 && (
        <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-400 mb-2">
                {t('dashboard.ai.budgetTip', 'Tipps')}
              </h4>
              <ul className="space-y-1">
                {dayPlan.generalTips.map((tip, index) => (
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
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          {t('dashboard.ai.download', 'Download')}
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <FileText className="w-4 h-4 mr-2" />
          {t('dashboard.ai.print', 'PDF Drucken')}
        </Button>
        <Button variant="outline" size="sm" onClick={copyAll}>
          <Copy className="w-4 h-4 mr-2" />
          {t('dashboard.ai.copyAll', 'Alles kopieren')}
        </Button>
        {onAddDay && dayPlan.days.length > 0 && (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => {
              dayPlan.days.forEach(day => onAddDay(day));
              toast.success(t('dashboard.ai.allDaysAdded', 'Alle Tage hinzugefügt'));
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.ai.addAllDays', 'Alle Tage hinzufügen')}
          </Button>
        )}
      </div>
    </div>
  );
};
