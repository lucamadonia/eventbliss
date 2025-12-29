import { Lightbulb, AlertTriangle, MessageCircle, User, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/ui/GlassCard";

interface Response {
  id: string;
  participant: string;
  attendance: string;
  suggestions: string | null;
  restrictions: string | null;
  partial_days: string | null;
}

interface IdeasTabProps {
  responses: Response[];
  isLoading: boolean;
}

export const IdeasTab = ({ responses, isLoading }: IdeasTabProps) => {
  const { t } = useTranslation();

  const getAttendanceLabel = (attendance: string) => {
    const labels: Record<string, string> = {
      yes: t('dashboard.ideas.attendance.yes'),
      maybe: t('dashboard.ideas.attendance.maybe'),
      no: t('dashboard.ideas.attendance.no'),
    };
    return labels[attendance] || attendance;
  };

  if (isLoading) {
    return (
      <GlassCard className="p-8 text-center">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">{t('dashboard.ideas.loading')}</p>
      </GlassCard>
    );
  }

  const suggestions = responses.filter(r => r.suggestions && r.suggestions.trim());
  const restrictions = responses.filter(r => r.restrictions && r.restrictions.trim());
  const partialDays = responses.filter(r => r.partial_days && r.partial_days.trim());

  const hasContent = suggestions.length > 0 || restrictions.length > 0 || partialDays.length > 0;

  if (!hasContent) {
    return (
      <GlassCard className="p-8 text-center">
        <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-xl font-bold mb-2">{t('dashboard.ideas.noIdeas')}</h3>
        <p className="text-muted-foreground">
          {t('dashboard.ideas.noIdeasDesc')}
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <GlassCard className="p-6">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            {t('dashboard.ideas.suggestions')}
            <span className="ml-auto text-sm text-muted-foreground">
              {t('dashboard.ideas.entries', { count: suggestions.length })}
            </span>
          </h4>
          <div className="space-y-3">
            {suggestions.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-lg bg-background/30 border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{r.participant}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      r.attendance === "yes"
                        ? "bg-green-500/20 text-green-400"
                        : r.attendance === "maybe"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {getAttendanceLabel(r.attendance)}
                  </span>
                </div>
                <p className="text-muted-foreground">{r.suggestions}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Restrictions */}
      {restrictions.length > 0 && (
        <GlassCard className="p-6 border-warning/30">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            {t('dashboard.ideas.restrictions')}
            <span className="ml-auto text-sm text-muted-foreground">
              {t('dashboard.ideas.entries', { count: restrictions.length })}
            </span>
          </h4>
          <div className="space-y-3">
            {restrictions.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-lg bg-warning/5 border border-warning/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{r.participant}</span>
                </div>
                <p className="text-warning">{r.restrictions}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Partial Days */}
      {partialDays.length > 0 && (
        <GlassCard className="p-6">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-secondary" />
            {t('dashboard.ideas.partialAvailability')}
            <span className="ml-auto text-sm text-muted-foreground">
              {t('dashboard.ideas.entries', { count: partialDays.length })}
            </span>
          </h4>
          <div className="space-y-3">
            {partialDays.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-lg bg-background/30 border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{r.participant}</span>
                </div>
                <p className="text-muted-foreground">{r.partial_days}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Summary */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Lightbulb className="w-4 h-4" />
            <span>{t('dashboard.ideas.suggestionsCount', { count: suggestions.length })}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            <span>{t('dashboard.ideas.restrictionsCount', { count: restrictions.length })}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{t('dashboard.ideas.notesCount', { count: partialDays.length })}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
