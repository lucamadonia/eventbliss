import { useState, useEffect } from "react";
import { Calendar, Users, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/ui/GlassCard";
import type { EventData } from "@/hooks/useEvent";

interface ResponseStats {
  date_blocks: Record<string, { yes: number; maybe: number; total: number }>;
  attendance: { yes: number; maybe: number; no: number };
}

interface ScheduleTabProps {
  event: EventData;
  stats: ResponseStats | null;
  isLoading: boolean;
}

interface BlockScore {
  block: string;
  label: string;
  yesCount: number;
  maybeCount: number;
  totalScore: number;
  percentage: number;
}

export const ScheduleTab = ({ event, stats, isLoading }: ScheduleTabProps) => {
  const { t } = useTranslation();
  const [blockScores, setBlockScores] = useState<BlockScore[]>([]);

  useEffect(() => {
    if (!stats || !event.settings?.date_blocks) return;

    const dateBlocks = event.settings.date_blocks as Record<string, string>;
    const scores: BlockScore[] = [];
    const maxPossible = (stats.attendance.yes || 0) + (stats.attendance.maybe || 0);

    Object.entries(dateBlocks).forEach(([key, label]) => {
      const blockData = stats.date_blocks[key] || { yes: 0, maybe: 0, total: 0 };
      const totalScore = blockData.yes + (blockData.maybe * 0.5);
      
      scores.push({
        block: key,
        label: label as string,
        yesCount: blockData.yes,
        maybeCount: blockData.maybe,
        totalScore,
        percentage: maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0,
      });
    });

    // Sort by score descending
    scores.sort((a, b) => b.totalScore - a.totalScore);
    setBlockScores(scores);
  }, [stats, event]);

  if (isLoading) {
    return (
      <GlassCard className="p-8 text-center">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">{t('dashboard.schedule.loading')}</p>
      </GlassCard>
    );
  }

  if (!stats || blockScores.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-xl font-bold mb-2">{t('dashboard.schedule.noData')}</h3>
        <p className="text-muted-foreground">
          {t('dashboard.schedule.noDataDesc')}
        </p>
      </GlassCard>
    );
  }

  const lockedBlock = event.settings?.locked_block;
  const topBlocks = blockScores.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">{t('dashboard.schedule.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.schedule.activeVotes', { count: stats.attendance.yes + stats.attendance.maybe })}
            </p>
          </div>
        </div>

        {lockedBlock && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-medium">
              {t('dashboard.schedule.dateLocked', { block: lockedBlock })}
            </span>
          </div>
        )}
      </GlassCard>

      {/* Top Recommendations */}
      {topBlocks.length > 0 && !lockedBlock && (
        <GlassCard className="p-6 border-primary/30">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <span className="text-lg">🏆</span> {t('dashboard.schedule.topRecommendations')}
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {topBlocks.map((block, idx) => (
              <div
                key={block.block}
                className={`p-4 rounded-xl ${
                  idx === 0 
                    ? "bg-gradient-primary text-primary-foreground" 
                    : "bg-secondary/20 border border-secondary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{t('dashboard.schedule.block')} {block.block}</span>
                  <span className={`text-2xl font-bold ${idx === 0 ? "" : "text-secondary"}`}>
                    {block.percentage}%
                  </span>
                </div>
                <p className={`text-sm ${idx === 0 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {block.label}
                </p>
                <div className={`text-xs mt-2 ${idx === 0 ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {block.yesCount} {t('dashboard.schedule.yes')} • {block.maybeCount} {t('dashboard.schedule.maybe')}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* All Blocks List */}
      <GlassCard className="p-6">
        <h4 className="font-bold mb-4">{t('dashboard.schedule.allDates')}</h4>
        <div className="space-y-3">
          {blockScores.map((block, idx) => (
            <div
              key={block.block}
              className={`p-4 rounded-lg border transition-colors ${
                lockedBlock === block.block
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-border bg-background/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${idx === 0 && !lockedBlock ? "text-primary" : ""}`}>
                    {t('dashboard.schedule.block')} {block.block}
                  </span>
                  {lockedBlock === block.block && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                      {t('dashboard.schedule.locked')}
                    </span>
                  )}
                </div>
                <span className="font-bold">{block.percentage}%</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{block.label}</p>
              
              {/* Progress Bar */}
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${block.percentage}%` }}
                />
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  {block.yesCount} {t('dashboard.schedule.yes')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  {block.maybeCount} {t('dashboard.schedule.maybe')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Legend */}
      <GlassCard className="p-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            {t('dashboard.schedule.legend')}
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
