/**
 * Der Trichter: wo stehen die Influencer gerade, und was ist ueberfaellig.
 *
 * Bewusst kein Kanban mit Ziehen und Fallenlassen. Der Status wandert im
 * Detail eines Influencers, nicht durch Herumschieben von Karten — und eine
 * Balkenreihe beantwortet die eigentliche Frage ("wo klemmt es?") schneller
 * als zwoelf Spalten, die man seitwaerts scrollen muss.
 */
import { useMemo } from "react";
import { AlertTriangle, Instagram, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  INFLUENCER_CLOSED, INFLUENCER_PIPELINE, INFLUENCER_STATUS_LABEL, formatReach,
} from "@/lib/influencer-status";
import { useDeliverables, useInfluencers } from "@/hooks/useInfluencers";

export default function InfluencerOverview({ onJump }: { onJump: () => void }) {
  const { data: influencers = [] } = useInfluencers();
  const { data: deliverables = [] } = useDeliverables();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of influencers) map.set(i.outreach_status, (map.get(i.outreach_status) || 0) + 1);
    return map;
  }, [influencers]);

  const max = Math.max(1, ...INFLUENCER_PIPELINE.map((s) => counts.get(s) || 0));

  const now = Date.now();
  const overdue = deliverables.filter(
    (d) => d.status === "open" && d.due_at && new Date(d.due_at).getTime() < now,
  );
  const openTasks = deliverables.filter((d) => d.status === "open" || d.status === "submitted");
  const reachDelivered = deliverables
    .filter((d) => d.status === "approved")
    .reduce((sum, d) => sum + (d.reach || 0), 0);

  const totalReach = influencers.reduce((sum, i) => sum + (i.followers || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Influencer" value={String(influencers.length)} icon={Users} />
        <Stat label="Offene Aufgaben" value={String(openTasks.length)} icon={TrendingUp} />
        <Stat
          label="Überfällig"
          value={String(overdue.length)}
          icon={AlertTriangle}
          tone={overdue.length > 0 ? "warn" : undefined}
        />
        <Stat label="Reichweite gesamt" value={formatReach(totalReach)} icon={Instagram} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trichter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {influencers.length === 0 && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Noch niemand erfasst. Der Trichter füllt sich, sobald der erste Influencer angelegt ist.
              </p>
              <Button size="sm" onClick={onJump}>Zum Verzeichnis</Button>
            </div>
          )}
          {influencers.length > 0 && INFLUENCER_PIPELINE.map((s) => {
            const n = counts.get(s) || 0;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-sm text-muted-foreground">
                  {INFLUENCER_STATUS_LABEL[s]}
                </div>
                <div className="flex-1 h-6 rounded bg-muted/50 overflow-hidden">
                  <div
                    className="h-full bg-primary/70 transition-all"
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-right tabular-nums text-sm font-medium">{n}</div>
              </div>
            );
          })}

          {influencers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t mt-3">
              {INFLUENCER_CLOSED.map((s) => (
                <Badge key={s} variant="outline" className="text-muted-foreground">
                  {INFLUENCER_STATUS_LABEL[s]}: {counts.get(s) || 0}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {reachDelivered > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Was geliefert wurde</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Freigegebene Beiträge erreichten zusammen{" "}
              <span className="font-semibold text-foreground">{formatReach(reachDelivered)}</span> Menschen.
              Gezählt wird nur, was auch eingetragen wurde — fehlende Zahlen fehlen hier ebenfalls.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  tone?: "warn";
}) {
  return (
    <div className={`rounded-lg border p-4 ${tone === "warn" ? "border-amber-500/40 bg-amber-500/5" : "bg-muted/30"}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
