import { useState, useEffect } from "react";
import { MapPin, Plane, DollarSign, Activity, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/ui/GlassCard";
import type { EventData } from "@/hooks/useEvent";

interface ResponseStats {
  destinations: Record<string, number>;
  budgets: Record<string, number>;
  activities: Record<string, number>;
  attendance: { yes: number; maybe: number; no: number };
}

interface DestinationTabProps {
  event: EventData;
  stats: ResponseStats | null;
  isLoading: boolean;
}

export const DestinationTab = ({ event, stats, isLoading }: DestinationTabProps) => {
  const { t } = useTranslation();
  const [sortedDestinations, setSortedDestinations] = useState<[string, number][]>([]);
  const [sortedBudgets, setSortedBudgets] = useState<[string, number][]>([]);
  const [sortedActivities, setSortedActivities] = useState<[string, number][]>([]);

  const getDestinationLabel = (key: string) => {
    const labels: Record<string, string> = {
      de_city: t('dashboard.destination.destinations.deCity'),
      barcelona: t('dashboard.destination.destinations.barcelona'),
      lisbon: t('dashboard.destination.destinations.lisbon'),
      either: t('dashboard.destination.destinations.either'),
    };
    return labels[key] || key;
  };

  const getBudgetLabel = (key: string) => {
    const labels: Record<string, string> = {
      "80-150": "80–150 €",
      "150-250": "150–250 €",
      "250-400": "250–400 €",
      "400+": "400+ €",
    };
    return labels[key] || key;
  };

  const getActivityLabel = (key: string) => {
    const labels: Record<string, string> = {
      karting: t('dashboard.destination.activities.karting'),
      escape_room: t('dashboard.destination.activities.escapeRoom'),
      lasertag: t('dashboard.destination.activities.lasertag'),
      axe_throwing: t('dashboard.destination.activities.axeThrowing'),
      vr_simracing: t('dashboard.destination.activities.vrSimracing'),
      climbing: t('dashboard.destination.activities.climbing'),
      bubble_soccer: t('dashboard.destination.activities.bubbleSoccer'),
      outdoor: t('dashboard.destination.activities.outdoor'),
      wellness: t('dashboard.destination.activities.wellness'),
      food: t('dashboard.destination.activities.food'),
      mixed: t('dashboard.destination.activities.mixed'),
    };
    return labels[key] || key;
  };

  useEffect(() => {
    if (!stats) return;

    setSortedDestinations(
      Object.entries(stats.destinations || {}).sort((a, b) => b[1] - a[1])
    );
    setSortedBudgets(
      Object.entries(stats.budgets || {}).sort((a, b) => b[1] - a[1])
    );
    setSortedActivities(
      Object.entries(stats.activities || {}).sort((a, b) => b[1] - a[1])
    );
  }, [stats]);

  if (isLoading) {
    return (
      <GlassCard className="p-8 text-center">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">{t('dashboard.destination.loading')}</p>
      </GlassCard>
    );
  }

  if (!stats || sortedDestinations.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-xl font-bold mb-2">{t('dashboard.destination.noData')}</h3>
        <p className="text-muted-foreground">
          {t('dashboard.destination.noDataDesc')}
        </p>
      </GlassCard>
    );
  }

  const totalVotes = stats.attendance.yes + stats.attendance.maybe;
  const topDestination = sortedDestinations[0];

  return (
    <div className="space-y-6">
      {/* Top Destination */}
      {topDestination && (
        <GlassCard className="p-6 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.destination.topDestination')}</p>
              <h3 className="font-display text-2xl font-bold">
                {getDestinationLabel(topDestination[0])}
              </h3>
            </div>
          </div>
          <p className="text-muted-foreground">
            {t('dashboard.destination.votesOf', { 
              votes: topDestination[1], 
              total: totalVotes, 
              percent: Math.round((topDestination[1] / totalVotes) * 100) 
            })}
          </p>
        </GlassCard>
      )}

      {/* Destinations Grid */}
      <GlassCard className="p-6">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Plane className="w-5 h-5" />
          {t('dashboard.destination.voting')}
        </h4>
        <div className="space-y-3">
          {sortedDestinations.map(([dest, count], idx) => (
            <div key={dest} className="flex items-center gap-3">
              <div className="w-8 text-center font-bold text-muted-foreground">
                {idx + 1}.
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    {getDestinationLabel(dest)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {count} ({Math.round((count / totalVotes) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      idx === 0 ? "bg-gradient-primary" : "bg-secondary/60"
                    }`}
                    style={{ width: `${(count / totalVotes) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Budget Distribution */}
      <GlassCard className="p-6">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          {t('dashboard.destination.budgetDistribution')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sortedBudgets.map(([budget, count]) => (
            <div
              key={budget}
              className="p-4 rounded-lg bg-background/30 text-center border border-border"
            >
              <p className="text-2xl font-bold text-primary">{count}</p>
              <p className="text-sm text-muted-foreground">
                {getBudgetLabel(budget)}
              </p>
            </div>
          ))}
        </div>
        {sortedBudgets.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              <strong>{t('dashboard.destination.recommendation')}:</strong>{" "}
              {t('dashboard.destination.recommendationText', { budget: getBudgetLabel(sortedBudgets[0][0]) })}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Activities Tag Cloud */}
      <GlassCard className="p-6">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {t('dashboard.destination.popularActivities')}
        </h4>
        <div className="flex flex-wrap gap-2">
          {sortedActivities.slice(0, 10).map(([activity, count], idx) => (
            <span
              key={activity}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                idx === 0
                  ? "bg-primary text-primary-foreground"
                  : idx < 3
                  ? "bg-secondary/30 text-secondary-foreground border border-secondary/50"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {getActivityLabel(activity)} ({count})
            </span>
          ))}
        </div>
        {sortedActivities.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            {t('dashboard.destination.noActivities')}
          </p>
        )}
      </GlassCard>
    </div>
  );
};
