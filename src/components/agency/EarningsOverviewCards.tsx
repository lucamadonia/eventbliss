import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, Users, Star,
  Calendar, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import {
  useAgencyEarnings, useAgencyTopServices, useAgencyMonthlyEarnings,
} from "@/hooks/useAgencyEarnings";

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format(cents / 100);
}

function monthShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", { month: "short" });
  } catch { return iso.slice(5, 7); }
}

interface Props {
  agencyId: string;
}

export function EarningsOverviewCards({ agencyId }: Props) {
  const { t } = useTranslation();
  const { data: earnings, isLoading: loadingEarnings } = useAgencyEarnings(agencyId);
  const { data: topServices = [], isLoading: loadingTop } = useAgencyTopServices(agencyId, 3);
  const { data: monthly = [], isLoading: loadingMonthly } = useAgencyMonthlyEarnings(agencyId);

  const mtd = earnings?.earnings_mtd_cents ?? 0;
  const lastMonth = earnings?.earnings_last_month_cents ?? 0;
  const trend = lastMonth === 0 ? 0 : ((mtd - lastMonth) / lastMonth) * 100;
  const trendLabel = trend > 0 ? `+${trend.toFixed(0)}%` : trend < 0 ? `${trend.toFixed(0)}%` : "0%";
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
  const trendClass = trend > 0 ? "text-emerald-400" : trend < 0 ? "text-red-400" : "text-slate-400";

  const maxEarn = Math.max(1, ...monthly.map((m) => m.earnings_cents));

  const kpis = [
    {
      label: t("agency.earnings.pending", "Neue Anfragen"),
      value: earnings?.pending_count ?? 0,
      sub: t("agency.earnings.pendingSub", "warten auf Bestätigung"),
      icon: Clock,
      accent: "from-cyan-500 to-blue-600",
      highlight: (earnings?.pending_count ?? 0) > 0,
    },
    {
      label: t("agency.earnings.confirmed", "Bestätigt"),
      value: earnings?.confirmed_count ?? 0,
      sub: t("agency.earnings.confirmedSub", "bevorstehende Events"),
      icon: CheckCircle2,
      accent: "from-emerald-500 to-teal-600",
    },
    {
      label: t("agency.earnings.revenueMonth", "Umsatz diesen Monat"),
      value: formatEUR(mtd),
      sub: t("agency.earnings.revenueMonthSub", "nach 10% Provision"),
      icon: DollarSign,
      accent: "from-violet-500 to-pink-600",
      trendValue: trendLabel,
      TrendIcon,
      trendClass,
    },
    {
      label: t("agency.earnings.revenueTotal", "Umsatz gesamt"),
      value: formatEUR(earnings?.earnings_total_cents ?? 0),
      sub: `${earnings?.paid_bookings_count ?? 0} ${t("agency.earnings.paidBookings", "bezahlte Buchungen")}`,
      icon: TrendingUp,
      accent: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {t("agency.earnings.title", "Marketplace-Umsatz")}
          </h3>
          <span className="text-xs text-slate-500">{t("agency.earnings.liveBadge", "Live aus Supabase")}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-4 overflow-hidden transition-colors",
                  kpi.highlight ? "border-cyan-500/40" : "border-white/[0.08]",
                )}
              >
                <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 bg-gradient-to-br", kpi.accent)} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", kpi.accent)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    {kpi.trendValue && kpi.TrendIcon && (
                      <div className={cn("flex items-center gap-0.5 text-xs font-bold", kpi.trendClass)}>
                        <kpi.TrendIcon className="w-3 h-3" />
                        {kpi.trendValue}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-50 leading-tight">
                    {loadingEarnings ? "—" : kpi.value}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                    {kpi.label}
                  </div>
                  {kpi.sub && (
                    <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                      {kpi.sub}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Monthly chart + Top services */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Monthly bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-50">{t("agency.earnings.chartTitle", "Umsatz-Verlauf")}</h4>
              <p className="text-[11px] text-slate-500">{t("agency.earnings.chartSub", "letzte 6 Monate")}</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          {loadingMonthly ? (
            <div className="h-32 bg-white/5 rounded-lg animate-pulse" />
          ) : monthly.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-600 text-sm">
              {t("agency.earnings.chartEmpty", "Noch keine Daten — deine erste Buchung taucht hier auf.")}
            </div>
          ) : (
            <div className="h-32 flex items-end justify-between gap-2">
              {monthly.map((m) => {
                const pct = (m.earnings_cents / maxEarn) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group cursor-default">
                    <div className="flex-1 w-full flex items-end justify-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-600/60 to-pink-500/60 border border-white/10 group-hover:from-violet-500 group-hover:to-pink-400 transition-colors relative"
                        style={{ minHeight: "3px" }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-mono text-white/90">
                          {formatEUR(m.earnings_cents)}
                        </div>
                      </motion.div>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">
                      {monthShort(m.month)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-white/[0.05] grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">{t("agency.earnings.bookingsThis", "Buchungen")}</div>
              <div className="text-sm font-bold text-slate-50">
                {monthly.reduce((s, m) => s + m.bookings_count, 0)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">{t("agency.earnings.participantsTotal", "Teilnehmer")}</div>
              <div className="text-sm font-bold text-slate-50">
                {monthly.reduce((s, m) => s + m.participants, 0)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">{t("agency.earnings.avgBooking", "Ø Buchung")}</div>
              <div className="text-sm font-bold text-slate-50">
                {monthly.reduce((s, m) => s + m.bookings_count, 0) > 0
                  ? formatEUR(
                      monthly.reduce((s, m) => s + m.earnings_cents, 0) /
                      Math.max(monthly.reduce((s, m) => s + m.bookings_count, 0), 1)
                    )
                  : formatEUR(0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top services */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-50">{t("agency.earnings.topServicesTitle", "Top Services")}</h4>
              <p className="text-[11px] text-slate-500">{t("agency.earnings.topServicesSub", "nach Umsatz")}</p>
            </div>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          {loadingTop ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : topServices.length === 0 ? (
            <div className="text-center py-6 text-slate-600 text-sm">
              {t("agency.earnings.topServicesEmpty", "Noch keine Service-Buchungen.")}
            </div>
          ) : (
            <div className="space-y-2">
              {topServices.map((s, i) => (
                <div key={s.service_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                    i === 0 ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" :
                    i === 1 ? "bg-gradient-to-br from-slate-400 to-slate-600 text-white" :
                    "bg-gradient-to-br from-amber-700 to-orange-800 text-white"
                  )}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {s.service_title || t("agency.earnings.unknownService", "Unbenannter Service")}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>{s.booking_count} {t("agency.earnings.bookingsLabel", "Buchungen")}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" /> {s.participants_total}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-black text-emerald-400 shrink-0">
                    {formatEUR(s.revenue_cents)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
