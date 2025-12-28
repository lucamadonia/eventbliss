import { Users, TrendingUp, Clock, Calendar, Wallet, MessageSquare, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import type { EventData, Participant } from "@/hooks/useEvent";

interface OverviewTabProps {
  event: EventData;
  participants: Participant[];
  responseCount: number;
  slug: string;
  onTabChange: (tab: string) => void;
}

export const OverviewTab = ({ event, participants, responseCount, slug, onTabChange }: OverviewTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{participants.length}</p>
              <p className="text-sm text-muted-foreground">Teilnehmer</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{responseCount}</p>
              <p className="text-sm text-muted-foreground">Antworten</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round((responseCount / Math.max(participants.length, 1)) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Rücklauf</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{event.status}</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Missing Responses Alert */}
      {participants.length > responseCount && (
        <GlassCard className="p-4 border-warning/50 bg-warning/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h4 className="font-semibold text-warning">Ausstehende Antworten</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {participants.length - responseCount} Teilnehmer haben noch nicht geantwortet.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Participants List */}
      <GlassCard className="p-6">
        <h3 className="font-display text-xl font-bold mb-4">Teilnehmer</h3>
        <div className="space-y-3">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {p.role === "organizer" ? "Organisator" : "Gast"}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  p.status === "confirmed"
                    ? "bg-green-500/20 text-green-400"
                    : p.status === "declined"
                    ? "bg-red-500/20 text-red-400"
                    : p.status === "maybe"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {p.status === "confirmed" ? "Dabei" : 
                 p.status === "declined" ? "Abgesagt" : 
                 p.status === "maybe" ? "Vielleicht" : "Eingeladen"}
              </span>
            </div>
          ))}
          {participants.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Noch keine Teilnehmer hinzugefügt.
            </p>
          )}
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard
          className="p-6 cursor-pointer hover:bg-background/30 transition-colors"
          onClick={() => navigate(`/e/${slug}/expenses`)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-bold">Kosten teilen</h4>
              <p className="text-sm text-muted-foreground">Ausgaben tracken</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          className="p-6 cursor-pointer hover:bg-background/30 transition-colors"
          onClick={() => onTabChange("messages")}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary/20">
              <MessageSquare className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h4 className="font-bold">Nachrichten</h4>
              <p className="text-sm text-muted-foreground">WhatsApp Templates</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          className="p-6 cursor-pointer hover:bg-background/30 transition-colors"
          onClick={() => onTabChange("ai")}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/20">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h4 className="font-bold">KI-Assistent</h4>
              <p className="text-sm text-muted-foreground">Trip-Ideen & Tipps</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
