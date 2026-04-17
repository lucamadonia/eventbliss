import { useTranslation } from "react-i18next";
import {
  Megaphone, Eye, MousePointerClick, Percent, Wallet, TrendingUp, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart as RePieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { useAIAdStatsAdmin } from "@/hooks/useAIAdStatsAdmin";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  enterprise: "#f59e0b",
  professional: "#a855f7",
  starter: "#6b7280",
  unknown: "#4b5563",
};

const REQUEST_TYPE_COLORS = ["#a855f7", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6b7280"];

function KpiCard({
  icon: Icon,
  label,
  value,
  subLabel,
  gradient,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  subLabel?: string;
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden p-5 border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02]">
      <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-30 bg-gradient-to-br", gradient)} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md", gradient)}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="text-3xl font-black tabular-nums text-foreground">{value}</div>
        {subLabel && <div className="text-xs text-muted-foreground mt-1">{subLabel}</div>}
      </div>
    </Card>
  );
}

function formatEuro(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default function AdminAIAdvertisingTab() {
  const { t } = useTranslation();
  const {
    overview,
    topAgencies,
    topServices,
    timeline,
    requestBreakdown,
    tierCtr,
    recentEvents,
  } = useAIAdStatsAdmin(30);

  const ov = overview.data;

  return (
    <div className="space-y-6">
      {/* ───── Hero ───── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/15 p-6 md:p-7 bg-gradient-to-br from-purple-600/20 via-pink-600/15 to-amber-500/15">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.25),transparent_60%)]" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-xl shadow-pink-500/40">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-300 mb-1">
              {t("admin.aiAds.hero.badge", "Last 30 days")}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {t("admin.aiAds.hero.title", "KI-Werbung Performance")}
            </h2>
            <p className="text-sm text-white/70 mt-1">
              {t("admin.aiAds.hero.subtitle", "Wie viele AI-gestützte Service-Empfehlungen werden ausgespielt, geklickt und in Buchungen konvertiert.")}
            </p>
          </div>
        </div>
      </div>

      {/* ───── KPIs ───── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          icon={Eye}
          label={t("admin.aiAds.kpi.impressions", "Impressions")}
          value={ov ? ov.impressions.toLocaleString() : "—"}
          gradient="from-purple-600 to-pink-600"
        />
        <KpiCard
          icon={MousePointerClick}
          label={t("admin.aiAds.kpi.clicks", "Clicks")}
          value={ov ? ov.clicks.toLocaleString() : "—"}
          gradient="from-cyan-500 to-blue-600"
        />
        <KpiCard
          icon={Percent}
          label={t("admin.aiAds.kpi.ctr", "CTR")}
          value={ov ? formatPct(ov.ctr) : "—"}
          subLabel={ov ? `${ov.clicks} / ${ov.impressions}` : undefined}
          gradient="from-emerald-500 to-teal-600"
        />
        <KpiCard
          icon={Wallet}
          label={t("admin.aiAds.kpi.revenue", "Attribuierter Umsatz")}
          value={ov ? formatEuro(ov.attributedRevenueCents) : "—"}
          subLabel={ov ? t("admin.aiAds.kpi.bookings", "{{count}} Buchungen", { count: ov.attributedBookings }) : undefined}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* ───── Timeline ───── */}
      <Card className="p-5 border-white/10">
        <h3 className="flex items-center gap-2 font-black text-lg mb-4">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          {t("admin.aiAds.sections.timeline", "Verlauf 30 Tage")}
        </h3>
        {timeline.data && timeline.data.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeline.data}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <Tooltip contentStyle={{ background: "#1a0b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="impressions" stroke="#a855f7" strokeWidth={2} dot={false} name={t("admin.aiAds.kpi.impressions", "Impressions") as string} />
              <Line type="monotone" dataKey="clicks" stroke="#ec4899" strokeWidth={2} dot={false} name={t("admin.aiAds.kpi.clicks", "Clicks") as string} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("admin.aiAds.noData", "Noch keine Daten — sobald AI-Empfehlungen angezeigt werden, füllt sich diese Ansicht.")}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ───── Top Services ───── */}
        <Card className="p-5 border-white/10">
          <h3 className="flex items-center gap-2 font-black text-lg mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t("admin.aiAds.sections.topServices", "Top 10 Services")}
          </h3>
          <div className="space-y-2">
            {(topServices.data || []).map((s, i) => (
              <div key={s.service_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-6 text-xs font-black text-muted-foreground text-center">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.agency_name}
                    {" · "}
                    <span style={{ color: TIER_COLORS[s.agency_tier] || TIER_COLORS.unknown }}>
                      {s.agency_tier}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-foreground">{s.impressions}</div>
                  <div className="text-muted-foreground">{s.clicks} clicks · {formatPct(s.ctr)}</div>
                </div>
              </div>
            ))}
            {(topServices.data || []).length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">—</div>
            )}
          </div>
        </Card>

        {/* ───── Top Agencies ───── */}
        <Card className="p-5 border-white/10">
          <h3 className="flex items-center gap-2 font-black text-lg mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            {t("admin.aiAds.sections.topAgencies", "Top 10 Agenturen")}
          </h3>
          <div className="space-y-2">
            {(topAgencies.data || []).map((a, i) => (
              <div key={a.agency_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-6 text-xs font-black text-muted-foreground text-center">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{a.agency_name}</div>
                  <div className="text-xs text-muted-foreground">
                    <span style={{ color: TIER_COLORS[a.marketplace_tier] || TIER_COLORS.unknown }}>
                      {a.marketplace_tier}
                    </span>
                    {" · "}
                    {formatEuro(a.attributed_revenue_cents)} Umsatz
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-foreground">{a.impressions}</div>
                  <div className="text-muted-foreground">{a.clicks} · {formatPct(a.ctr)}</div>
                </div>
              </div>
            ))}
            {(topAgencies.data || []).length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">—</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ───── Request-type breakdown ───── */}
        <Card className="p-5 border-white/10">
          <h3 className="flex items-center gap-2 font-black text-lg mb-4">
            <Sparkles className="w-4 h-4 text-pink-400" />
            {t("admin.aiAds.sections.requestBreakdown", "Nach Request-Typ")}
          </h3>
          {requestBreakdown.data && requestBreakdown.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RePieChart>
                <Pie
                  data={requestBreakdown.data}
                  dataKey="impressions"
                  nameKey="request_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => entry.request_type}
                >
                  {requestBreakdown.data.map((_, i) => (
                    <Cell key={i} fill={REQUEST_TYPE_COLORS[i % REQUEST_TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a0b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">—</div>
          )}
        </Card>

        {/* ───── CTR by tier ───── */}
        <Card className="p-5 border-white/10">
          <h3 className="flex items-center gap-2 font-black text-lg mb-4">
            <Percent className="w-4 h-4 text-cyan-400" />
            {t("admin.aiAds.sections.tierCtr", "CTR nach Agentur-Tier")}
          </h3>
          {tierCtr.data && tierCtr.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tierCtr.data.map((t) => ({ ...t, ctrPct: Number((t.ctr * 100).toFixed(2)) }))}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="tier" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ background: "#1a0b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: any) => `${v}%`}
                />
                <Bar dataKey="ctrPct" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">—</div>
          )}
        </Card>
      </div>

      {/* ───── Recent events ───── */}
      <Card className="p-5 border-white/10">
        <h3 className="flex items-center gap-2 font-black text-lg mb-4">
          <Eye className="w-4 h-4 text-purple-400" />
          {t("admin.aiAds.sections.recentEvents", "Jüngste Ereignisse")}
        </h3>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {(recentEvents.data || []).map((e: any) => (
            <div
              key={e.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-xs transition-colors"
            >
              <Badge className={cn(
                "text-[9px] font-bold uppercase border-0",
                e.event_kind === "impression" && "bg-purple-500/20 text-purple-200",
                e.event_kind === "click" && "bg-pink-500/20 text-pink-200",
                e.event_kind === "booking_attributed" && "bg-emerald-500/20 text-emerald-200",
              )}>
                {e.event_kind}
              </Badge>
              <span className="text-muted-foreground">
                {e.request_type || "—"}
                {e.section_title && ` · ${e.section_title}`}
                {e.city_hint && ` · ${e.city_hint}`}
                {e.event_type_hint && ` · ${e.event_type_hint}`}
              </span>
              <span className="ml-auto text-muted-foreground/60 tabular-nums whitespace-nowrap">
                {new Date(e.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {(recentEvents.data || []).length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">—</div>
          )}
        </div>
      </Card>
    </div>
  );
}
