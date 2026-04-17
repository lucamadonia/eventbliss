import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Eye,
  MousePointerClick,
  Wallet,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAIAdStatsAgency } from "@/hooks/useAIAdStatsAgency";
import { useAgency } from "@/hooks/useAgency";

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtCurrency(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function fmtPct(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AgencyAIPerformance() {
  const { t } = useTranslation();
  const { agency } = useAgency();
  const { overview, topServices, recentFeed, topKeywords } =
    useAIAdStatsAgency(30);

  const ov = overview.data;
  const services = topServices.data ?? [];
  const feed = recentFeed.data ?? [];
  const keywords = topKeywords.data ?? [];

  const maxKeywordCount = keywords.length > 0 ? keywords[0].count : 1;

  /* sparkline placeholder data built from per-service impressions */
  const sparkData = services.slice(0, 7).map((s) => ({
    name: s.title.slice(0, 12),
    impressions: s.impressions,
    clicks: s.clicks,
  }));

  /* ---- glass card helper classes ---- */
  const glass =
    "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md";
  const kpiCard =
    "flex flex-col gap-1 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]";

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/*  Hero Header                                                  */}
      {/* ============================================================ */}
      <div
        className={cn(
          glass,
          "p-6 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-transparent"
        )}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t("agency.aiPerformance.title", "KI-Performance")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "agency.aiPerformance.subtitle",
                "Hier siehst du wie deine Services \u00fcber die KI empfohlen und gebucht werden."
              )}
            </p>
          </div>
        </div>
        {agency && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("agency.aiPerformance.scopeLabel", "Agentur")}: {agency.name}
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/*  KPI Cards 2x2                                                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 gap-4">
        {/* Impressions */}
        <Card className={kpiCard}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4 text-purple-400" />
            <span className="text-xs">
              {t("agency.aiPerformance.impressions", "Impressions")}
            </span>
          </div>
          <span className="text-2xl font-bold text-foreground">
            {overview.isLoading ? "\u2026" : (ov?.impressions ?? 0).toLocaleString("de-DE")}
          </span>
        </Card>

        {/* Clicks */}
        <Card className={kpiCard}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="h-4 w-4 text-pink-400" />
            <span className="text-xs">
              {t("agency.aiPerformance.clicks", "Clicks")}
            </span>
          </div>
          <span className="text-2xl font-bold text-foreground">
            {overview.isLoading ? "\u2026" : (ov?.clicks ?? 0).toLocaleString("de-DE")}
          </span>
        </Card>

        {/* CTR */}
        <Card className={kpiCard}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="h-4 w-4 text-cyan-400" />
            <span className="text-xs">
              {t("agency.aiPerformance.ctr", "CTR")} (%)
            </span>
          </div>
          <span className="text-2xl font-bold text-foreground">
            {overview.isLoading ? "\u2026" : fmtPct(ov?.ctr ?? 0)}
          </span>
        </Card>

        {/* Revenue */}
        <Card className={kpiCard}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span className="text-xs">
              {t("agency.aiPerformance.revenue", "Attribuierter Umsatz")}
            </span>
          </div>
          <span className="text-2xl font-bold text-foreground">
            {overview.isLoading
              ? "\u2026"
              : fmtCurrency(ov?.attributedRevenueCents ?? 0)}
          </span>
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  Sparkline Chart                                              */}
      {/* ============================================================ */}
      {sparkData.length > 0 && (
        <div className={cn(glass, "p-5")}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t(
              "agency.aiPerformance.impressionsPerService",
              "Impressions je Service"
            )}
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.85)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="#a855f7"
                fill="url(#aiGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Per-Service Table                                            */}
      {/* ============================================================ */}
      <div className={cn(glass, "p-5")}>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {t("agency.aiPerformance.perService", "Performance je Service")}
        </h3>
        {topServices.isLoading ? (
          <p className="text-xs text-muted-foreground">
            {t("agency.aiPerformance.loading", "Lade\u2026")}
          </p>
        ) : services.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t(
              "agency.aiPerformance.noData",
              "Noch keine KI-Empfehlungen vorhanden."
            )}
          </p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <div
                key={s.service_id}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-sm font-medium text-foreground truncate flex-1">
                  {s.title}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {s.impressions.toLocaleString("de-DE")} imp
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {s.clicks.toLocaleString("de-DE")} clicks
                </span>
                <Badge
                  className={cn(
                    "text-[10px]",
                    s.ctr >= 0.05
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-white/10 text-muted-foreground border-white/10"
                  )}
                >
                  {fmtPct(s.ctr)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Recent Activity Feed                                         */}
      {/* ============================================================ */}
      <div className={cn(glass, "p-5")}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("agency.aiPerformance.recentActivity", "Letzte KI-Empfehlungen")}
          </h3>
        </div>
        {recentFeed.isLoading ? (
          <p className="text-xs text-muted-foreground">
            {t("agency.aiPerformance.loading", "Lade\u2026")}
          </p>
        ) : feed.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("agency.aiPerformance.noFeed", "Noch keine Aktivit\u00e4ten.")}
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {feed.map((row, i) => (
              <div
                key={`${row.created_at}-${i}`}
                className="rounded-lg px-3 py-2 bg-white/[0.02] text-xs text-muted-foreground leading-relaxed"
              >
                {t("agency.aiPerformance.feedLine", {
                  defaultValue:
                    "Dein '{{section}}'-Service wurde am {{date}} in einem {{eventType}} Event{{city}} empfohlen (via {{requestType}})",
                  section: row.section_title ?? "?",
                  date: fmtDate(row.created_at),
                  eventType: row.event_type_hint ?? "?",
                  city: row.city_hint ? ` in ${row.city_hint}` : "",
                  requestType: row.request_type ?? "?",
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Top Keywords                                                 */}
      {/* ============================================================ */}
      <div className={cn(glass, "p-5")}>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {t("agency.aiPerformance.topKeywords", "Top Keywords")}
        </h3>
        {topKeywords.isLoading ? (
          <p className="text-xs text-muted-foreground">
            {t("agency.aiPerformance.loading", "Lade\u2026")}
          </p>
        ) : keywords.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t(
              "agency.aiPerformance.noKeywords",
              "Noch keine Keyword-Daten vorhanden."
            )}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => {
              const ratio = kw.count / maxKeywordCount;
              const sizeClass =
                ratio > 0.7
                  ? "text-sm px-3 py-1.5"
                  : ratio > 0.4
                    ? "text-xs px-2.5 py-1"
                    : "text-[10px] px-2 py-0.5";
              return (
                <Badge
                  key={kw.keyword}
                  className={cn(
                    sizeClass,
                    "bg-purple-500/15 text-purple-300 border-purple-500/20 hover:bg-purple-500/25 transition-colors"
                  )}
                >
                  {kw.keyword}
                  <span className="ml-1 opacity-60">{kw.count}</span>
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
