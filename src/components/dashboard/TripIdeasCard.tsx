import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Lightbulb,
  Plane,
  Star,
  Target,
  Download,
  FileText,
  Calendar,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type ParsedTripIdeasResponse, type ParsedTripIdea } from "@/lib/ai-response-parser";
import { openTripIdeasPrint, downloadTripIdeasHTML } from "@/lib/trip-ideas-pdf-export";

interface TripIdeasCardProps {
  tripIdeasData: ParsedTripIdeasResponse;
  eventName?: string;
  participantCount?: number;
  onSetDestination?: (tripIdea: ParsedTripIdea) => void;
}

// Premium trip idea styles
const IDEA_STYLES = [
  {
    gradient: 'from-amber-600 via-amber-500 to-yellow-500',
    bgLight: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    isTopPick: true,
  },
  {
    gradient: 'from-cyan-600 via-cyan-500 to-blue-500',
    bgLight: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    isTopPick: false,
  },
  {
    gradient: 'from-violet-600 via-violet-500 to-purple-500',
    bgLight: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    isTopPick: false,
  },
  {
    gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    isTopPick: false,
  },
  {
    gradient: 'from-rose-600 via-rose-500 to-pink-500',
    bgLight: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    isTopPick: false,
  },
];

export const TripIdeasCard = ({
  tripIdeasData,
  eventName,
  participantCount,
  onSetDestination,
}: TripIdeasCardProps) => {
  const { t, i18n } = useTranslation();
  const [expandedIdeas, setExpandedIdeas] = useState<Set<number>>(new Set([0])); // First one expanded by default
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleIdea = (index: number) => {
    setExpandedIdeas(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getStyle = (index: number) => {
    return IDEA_STYLES[index % IDEA_STYLES.length];
  };

  const copyIdea = async (idea: ParsedTripIdea, id: string) => {
    const text = `${idea.emoji} ${idea.title}\n📍 ${idea.destination}\n💰 ${idea.cost}\n\n${idea.description}\n\n✅ Warum perfekt:\n${idea.whyPerfect.map(w => `• ${w}`).join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(tripIdeasData.rawResponse);
    toast.success(t('common.copied'));
  };

  const handlePrint = () => {
    openTripIdeasPrint(tripIdeasData, {
      name: eventName || 'Event',
      participantCount,
    }, i18n.language);
    toast.success(t('dashboard.ai.printOpened', 'Druckvorschau geöffnet'));
  };

  const handleDownload = () => {
    downloadTripIdeasHTML(tripIdeasData, {
      name: eventName || 'Event',
      participantCount,
    }, i18n.language);
    toast.success(t('dashboard.ai.downloaded', 'Download gestartet'));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg">
              {t('dashboard.ai.tripIdeas', 'Reiseideen')}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {eventName && (
                <Badge variant="secondary" className="text-xs">
                  {eventName}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                🌍 {tripIdeasData.ideas.length} {t('dashboard.ai.ideas', 'Ideen')}
              </Badge>
              {participantCount && (
                <Badge variant="outline" className="text-xs">
                  👥 {participantCount}
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
      {tripIdeasData.intro && (
        <GlassCard className="p-4">
          <p className="text-muted-foreground leading-relaxed text-sm">
            {tripIdeasData.intro}
          </p>
        </GlassCard>
      )}

      {/* Trip Idea Cards */}
      <div className="space-y-4">
        {tripIdeasData.ideas.map((idea, index) => {
          const style = getStyle(index);
          const ideaNumber = index + 1;
          const ideaId = `idea-${index}`;
          const isExpanded = expandedIdeas.has(index);
          const isTopPick = index === 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className={cn("p-0 overflow-hidden border-2", style.border)}>
                {/* Premium Idea Header */}
                <button
                  onClick={() => toggleIdea(index)}
                  className={cn(
                    "w-full p-4 flex items-center gap-4",
                    "bg-gradient-to-r",
                    style.gradient,
                    "hover:opacity-95 transition-opacity text-left"
                  )}
                >
                  {/* Idea Number Badge */}
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-white font-black text-sm tracking-wider">
                      {t('dashboard.ai.ideaLabel', 'IDEE')} {ideaNumber}
                    </span>
                  </div>

                  {/* Idea Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-lg truncate">
                        {idea.title}
                      </h4>
                      {isTopPick && (
                        <Badge className="bg-white/30 text-white border-0 text-xs">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Top Pick
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-white/90 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {idea.destination}
                      </span>
                      {idea.cost && (
                        <span className="text-white/80 text-sm">
                          💰 {idea.cost}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Emoji & Actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{idea.emoji}</span>
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
                        {/* Travel Info Badges */}
                        {idea.travelTime && (
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-muted/30">
                              <Calendar className="w-3 h-3 mr-1" />
                              {idea.travelTime}
                            </Badge>
                          </div>
                        )}

                        {/* Description */}
                        {idea.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {idea.description}
                          </p>
                        )}

                        {/* Why Perfect Section */}
                        {idea.whyPerfect && idea.whyPerfect.length > 0 && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                            <h5 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                              💡 {t('dashboard.ai.whyPerfect', 'Warum perfekt')}
                            </h5>
                            <ul className="space-y-1">
                              {idea.whyPerfect.map((reason, i) => (
                                <li key={i} className="text-sm text-emerald-300/80 flex items-start gap-2">
                                  <span className="text-emerald-400">✓</span>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Highlights */}
                        {idea.highlights && idea.highlights.length > 0 && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <h5 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                              🎯 {t('dashboard.ai.highlights', 'Highlights')}
                            </h5>
                            <ul className="space-y-1">
                              {idea.highlights.map((highlight, i) => (
                                <li key={i} className="text-sm text-blue-300/80 flex items-start gap-2">
                                  <span className="text-blue-400">•</span>
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
                              copyIdea(idea, ideaId);
                            }}
                          >
                            {copiedId === ideaId ? (
                              <Check className="w-3 h-3 text-emerald-400 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {t('common.copy', 'Kopieren')}
                          </Button>
                          {onSetDestination && (
                            <Button
                              size="sm"
                              variant="default"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetDestination(idea);
                                toast.success(t('dashboard.ai.destinationSet', 'Als Reiseziel festgelegt'));
                              }}
                            >
                              <Target className="w-3 h-3 mr-1" />
                              {t('dashboard.ai.setAsDestination', 'Als Ziel festlegen')}
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
      {tripIdeasData.tips.length > 0 && (
        <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-400 mb-2">
                {t('dashboard.ai.travelTips', 'Reisetipps')}
              </h4>
              <ul className="space-y-1">
                {tripIdeasData.tips.map((tip, index) => (
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
          {t('dashboard.ai.copyAll', 'Alles kopieren')}
        </Button>
      </div>
    </div>
  );
};
