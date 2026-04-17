import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Users, Send, MessageSquare, Star, CheckCircle2, XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOutreachPipeline } from "@/hooks/useOutreachPipeline";
import { useOutreachCampaigns } from "@/hooks/useOutreachCampaigns";

interface Props {
  onOpenAgency: (id: number) => void;
}

const KPI_CARDS = [
  { key: "total", statusKeys: ["none", "contacted", "follow_up_1", "follow_up_2", "responded", "interested", "onboarded", "rejected"], labelKey: "admin.akquise.kpiTotal", defaultLabel: "Pipeline gesamt", icon: Users, gradient: "from-purple-600 to-pink-600" },
  { key: "contacted", statusKeys: ["contacted"], labelKey: "admin.akquise.kpiContacted", defaultLabel: "Kontaktiert", icon: Send, gradient: "from-blue-500 to-cyan-500" },
  { key: "responded", statusKeys: ["responded"], labelKey: "admin.akquise.kpiResponded", defaultLabel: "Antworten", icon: MessageSquare, gradient: "from-emerald-500 to-green-500" },
  { key: "interested", statusKeys: ["interested"], labelKey: "admin.akquise.kpiInterested", defaultLabel: "Interessiert", icon: Star, gradient: "from-amber-500 to-yellow-500" },
  { key: "onboarded", statusKeys: ["onboarded"], labelKey: "admin.akquise.kpiOnboarded", defaultLabel: "Onboarded", icon: CheckCircle2, gradient: "from-green-500 to-emerald-500" },
  { key: "rejected", statusKeys: ["rejected"], labelKey: "admin.akquise.kpiRejected", defaultLabel: "Abgelehnt", icon: XCircle, gradient: "from-red-500 to-rose-500" },
] as const;

function sumKeys(counts: Record<string, number>, keys: readonly string[]): number {
  if (keys.length === 1 && keys[0] === "none") {
    // "none" status not counted for contacted etc — for total we sum everything
    return 0;
  }
  return keys.reduce((sum, k) => sum + (counts[k] || 0), 0);
}

function getTotal(counts: Record<string, number>): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export default function AkquiseDashboard({ onOpenAgency }: Props) {
  const { t } = useTranslation();
  const { counts, isLoading } = useOutreachPipeline();
  const { data: campaigns } = useOutreachCampaigns();

  const activeCampaigns = (campaigns || []).filter((c) => c.status === "active" || c.status === "paused");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {KPI_CARDS.map((kpi, i) => {
          const value = kpi.key === "total" ? getTotal(counts) : sumKeys(counts, kpi.statusKeys);
          const Icon = kpi.icon;

          return (
            <Card
              key={kpi.key}
              className="relative overflow-hidden p-5 border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02]"
            >
              <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-30 bg-gradient-to-br", kpi.gradient)} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md", kpi.gradient)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(kpi.labelKey, kpi.defaultLabel)}
                  </span>
                </div>
                <div className="text-3xl font-black tabular-nums text-foreground">
                  {isLoading ? "..." : value}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Campaign quick-status */}
      <div>
        <h3 className="text-lg font-black text-foreground mb-3">
          {t("admin.akquise.activeCampaigns", "Aktive Kampagnen")}
        </h3>
        {activeCampaigns.length === 0 ? (
          <Card className="p-6 border-white/10 bg-white/[0.04] text-center text-muted-foreground">
            {t("admin.akquise.noCampaigns", "Noch keine Kampagnen erstellt. Starte eine neue Kampagne im Kampagnen-Tab.")}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCampaigns.map((campaign) => {
              const total = campaign.stats_contacted + campaign.stats_responded + campaign.stats_converted;
              const progress = campaign.drip_rate > 0 ? Math.min(100, Math.round((campaign.stats_contacted / campaign.drip_rate) * 100)) : 0;

              return (
                <Card key={campaign.id} className="p-4 border-white/10 bg-white/[0.04] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate">{campaign.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        campaign.status === "active"
                          ? "border-green-500/50 text-green-400"
                          : "border-yellow-500/50 text-yellow-400"
                      )}
                    >
                      {campaign.status === "active" ? "Aktiv" : "Pausiert"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{campaign.stats_contacted} kontaktiert</span>
                      <span>{campaign.stats_responded} Antworten</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {campaign.sender_email} &middot; Drip: {campaign.drip_rate}/Tag
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
