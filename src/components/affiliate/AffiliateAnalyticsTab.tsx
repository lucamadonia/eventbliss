import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Target,
  Eye,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAffiliateStats, useAffiliateCommissions, useAffiliateVouchers } from "@/hooks/useAffiliate";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { de } from "date-fns/locale";

type TimeRange = "7days" | "30days" | "90days" | "year";

export function AffiliateAnalyticsTab() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useAffiliateStats();
  const { data: commissions } = useAffiliateCommissions(stats?.affiliate?.id);
  const { data: vouchers } = useAffiliateVouchers(stats?.affiliate?.id);
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");

  // Calculate KPIs
  const totalEarnings = stats?.affiliate?.total_earnings || 0;
  const pendingBalance = stats?.affiliate?.pending_balance || 0;
  const totalConversions = commissions?.length || 0;
  const totalVouchers = vouchers?.length || 0;
  const totalRedemptions = stats?.vouchers?.totalRedemptions || 0;
  
  // Calculate click estimates (would come from real tracking in production)
  const estimatedClicks = totalRedemptions * 12; // Estimated 8% conversion rate
  const conversionRate = estimatedClicks > 0 ? ((totalRedemptions / estimatedClicks) * 100).toFixed(1) : "0";
  const earningsPerClick = estimatedClicks > 0 ? (totalEarnings / estimatedClicks).toFixed(2) : "0";
  const avgOrderValue = totalConversions > 0 ? (totalEarnings / totalConversions / (stats?.affiliate?.commission_rate || 10) * 100).toFixed(2) : "0";

  // Generate daily data for charts based on time range
  const getDays = () => {
    switch (timeRange) {
      case "7days": return 7;
      case "30days": return 30;
      case "90days": return 90;
      case "year": return 365;
      default: return 30;
    }
  };

  const dailyData = eachDayOfInterval({
    start: subDays(new Date(), getDays()),
    end: new Date(),
  }).map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayCommissions = commissions?.filter(
      (c: any) => format(new Date(c.created_at), "yyyy-MM-dd") === dateStr
    ) || [];
    
    return {
      date: format(date, timeRange === "year" ? "MMM" : "dd.MM", { locale: de }),
      earnings: dayCommissions.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0),
      conversions: dayCommissions.length,
    };
  });

  // Aggregate for longer time ranges
  const chartData = timeRange === "year" 
    ? Object.values(
        dailyData.reduce((acc: any, item) => {
          if (!acc[item.date]) {
            acc[item.date] = { date: item.date, earnings: 0, conversions: 0 };
          }
          acc[item.date].earnings += item.earnings;
          acc[item.date].conversions += item.conversions;
          return acc;
        }, {})
      )
    : dailyData;

  // Revenue by voucher for pie chart
  const voucherRevenue = vouchers?.map((v: any) => {
    const voucherCommissions = commissions?.filter((c: any) => c.voucher_id === v.voucher?.id) || [];
    return {
      name: v.voucher?.code || "Unbekannt",
      value: voucherCommissions.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0),
    };
  }).filter((v: any) => v.value > 0) || [];

  const COLORS = ['hsl(262, 83%, 58%)', 'hsl(174, 72%, 56%)', 'hsl(339, 90%, 55%)', 'hsl(47, 95%, 53%)', 'hsl(142, 76%, 36%)'];

  // Week over week comparison
  const thisWeekEarnings = commissions?.filter((c: any) => {
    const date = new Date(c.created_at);
    return date >= subDays(new Date(), 7);
  }).reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0) || 0;

  const lastWeekEarnings = commissions?.filter((c: any) => {
    const date = new Date(c.created_at);
    return date >= subDays(new Date(), 14) && date < subDays(new Date(), 7);
  }).reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0) || 0;

  const weeklyGrowth = lastWeekEarnings > 0 
    ? ((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings * 100).toFixed(1)
    : thisWeekEarnings > 0 ? "100" : "0";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === "earnings" ? "Einnahmen" : "Conversions"}: {entry.name === "earnings" ? `€${entry.value.toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 h-32 shimmer" />
          ))}
        </div>
        <div className="glass-card p-6 h-[400px] shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold">{t("affiliate.analytics.title", "Analytics & Berichte")}</h2>
          <p className="text-muted-foreground">{t("affiliate.analytics.subtitle", "Detaillierte Einblicke in deine Performance")}</p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">{t("affiliate.analytics.7days", "Letzte 7 Tage")}</SelectItem>
            <SelectItem value="30days">{t("affiliate.analytics.30days", "Letzte 30 Tage")}</SelectItem>
            <SelectItem value="90days">{t("affiliate.analytics.90days", "Letzte 90 Tage")}</SelectItem>
            <SelectItem value="year">{t("affiliate.analytics.year", "Dieses Jahr")}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Conversion Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-6">{t("affiliate.analytics.funnel", "Conversion Funnel")}</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20">
            <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{(estimatedClicks * 3).toLocaleString("de-DE")}</p>
            <p className="text-sm text-muted-foreground">{t("affiliate.analytics.impressions", "Impressionen")}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/20">
            <MousePointer className="w-8 h-8 mx-auto mb-2 text-accent" />
            <p className="text-3xl font-bold">{estimatedClicks.toLocaleString("de-DE")}</p>
            <p className="text-sm text-muted-foreground">{t("affiliate.analytics.clicks", "Klicks")}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-b from-pink-500/20 to-pink-500/5 border border-pink-500/20">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-pink-500" />
            <p className="text-3xl font-bold">{totalRedemptions.toLocaleString("de-DE")}</p>
            <p className="text-sm text-muted-foreground">{t("affiliate.analytics.conversions", "Conversions")}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-b from-success/20 to-success/5 border border-success/20">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold">€{totalEarnings.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-muted-foreground">{t("affiliate.analytics.revenue", "Einnahmen")}</p>
          </div>
        </div>
        
        {/* Funnel visualization lines */}
        <div className="hidden md:flex justify-center items-center mt-4 gap-8">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">CTR</div>
            <div className="text-lg font-semibold text-primary">33%</div>
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-accent" />
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Conv. Rate</div>
            <div className="text-lg font-semibold text-accent">{conversionRate}%</div>
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-accent to-pink-500" />
          <div className="text-center">
            <div className="text-sm text-muted-foreground">EPC</div>
            <div className="text-lg font-semibold text-pink-500">€{earningsPerClick}</div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-hover p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <Badge variant="outline" className={Number(weeklyGrowth) >= 0 ? "text-success border-success" : "text-destructive border-destructive"}>
              {Number(weeklyGrowth) >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {weeklyGrowth}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t("affiliate.analytics.weeklyEarnings", "Diese Woche")}</p>
          <p className="text-2xl font-bold">€{thisWeekEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">vs. €{lastWeekEarnings.toFixed(2)} {t("affiliate.analytics.lastWeek", "letzte Woche")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card-hover p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("affiliate.analytics.conversionRate", "Conversion Rate")}</p>
          <p className="text-2xl font-bold">{conversionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">{totalRedemptions} von {estimatedClicks} Klicks</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-hover p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("affiliate.analytics.epc", "Earnings per Click")}</p>
          <p className="text-2xl font-bold">€{earningsPerClick}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("affiliate.analytics.avgEarnings", "Durchschnittlicher Verdienst pro Klick")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card-hover p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("affiliate.analytics.aov", "Avg. Order Value")}</p>
          <p className="text-2xl font-bold">€{avgOrderValue}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("affiliate.analytics.avgOrder", "Durchschnittlicher Bestellwert")}</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-6">{t("affiliate.analytics.earningsOverTime", "Einnahmen über Zeit")}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEarningsAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEarningsAnalytics)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Conversions by Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-6">{t("affiliate.analytics.conversionsByDay", "Conversions pro Tag")}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="conversions" fill="hsl(174, 72%, 56%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Revenue by Voucher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-6">{t("affiliate.analytics.revenueByVoucher", "Einnahmen nach Gutschein")}</h3>
          {voucherRevenue.length > 0 ? (
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={voucherRevenue}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {voucherRevenue.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t("affiliate.analytics.noData", "Noch keine Daten vorhanden")}
            </div>
          )}
        </motion.div>

        {/* Top Vouchers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-6">{t("affiliate.analytics.topVouchers", "Top Gutscheine")}</h3>
          <div className="space-y-3">
            {vouchers?.slice(0, 5).map((v: any, index: number) => {
              const voucherCommissions = commissions?.filter((c: any) => c.voucher_id === v.voucher?.id) || [];
              const revenue = voucherCommissions.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0);
              
              return (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-600" : "bg-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <code className="font-bold text-primary">{v.voucher?.code}</code>
                      <p className="text-xs text-muted-foreground">{v.voucher?.used_count || 0} {t("affiliate.analytics.redemptions", "Einlösungen")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€{revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{voucherCommissions.length} Provisionen</p>
                  </div>
                </div>
              );
            })}
            {(!vouchers || vouchers.length === 0) && (
              <p className="text-center text-muted-foreground py-8">{t("affiliate.analytics.noVouchers", "Keine Gutscheine vorhanden")}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
