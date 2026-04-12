import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Euro,
  TrendingUp,
  Package,
  Building2,
  Star,
  BarChart3,
} from "lucide-react";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

/* ---------- Data ---------- */

const MONTHLY_REVENUE = [
  { month: "Apr '25", revenue: 120000 },
  { month: "Mai '25", revenue: 180000 },
  { month: "Jun '25", revenue: 240000 },
  { month: "Jul '25", revenue: 310000 },
  { month: "Aug '25", revenue: 280000 },
  { month: "Sep '25", revenue: 350000 },
  { month: "Okt '25", revenue: 420000 },
  { month: "Nov '25", revenue: 380000 },
  { month: "Dez '25", revenue: 410000 },
  { month: "Jan '26", revenue: 450000 },
  { month: "Feb '26", revenue: 483500 },
  { month: "Mar '26", revenue: 520000 },
];

const TOP_SERVICES = [
  { name: "DJ Party Paket", bookings: 34, revenue: 2036600 },
  { name: "Private Chef Dinner", bookings: 28, revenue: 1246000 },
  { name: "Cocktail Workshop", bookings: 25, revenue: 390000 },
  { name: "Wine Tasting Premium", bookings: 22, revenue: 539000 },
  { name: "Escape Room", bookings: 19, revenue: 190000 },
];

const TOP_AGENCIES = [
  { name: "Berlin Events GmbH", tier: "enterprise", revenue: 2250000, fee: 225000 },
  { name: "Gourmet Events", tier: "professional", revenue: 890000, fee: 89000 },
  { name: "Fun Factory", tier: "starter", revenue: 320000, fee: 32000 },
  { name: "Speed Events", tier: "professional", revenue: 280000, fee: 28000 },
  { name: "Zen Space", tier: "starter", revenue: 195000, fee: 19500 },
];

const CATEGORY_BREAKDOWN = [
  { category: "Workshop", percentage: 28, color: "from-violet-500 to-violet-400" },
  { category: "Entertainment", percentage: 22, color: "from-pink-500 to-pink-400" },
  { category: "Catering", percentage: 20, color: "from-amber-500 to-amber-400" },
  { category: "Music", percentage: 12, color: "from-blue-500 to-blue-400" },
  { category: "Sport", percentage: 8, color: "from-red-500 to-red-400" },
  { category: "Wellness", percentage: 5, color: "from-green-500 to-green-400" },
  { category: "Andere", percentage: 5, color: "from-gray-500 to-gray-400" },
];

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "bg-gray-500" },
  professional: { label: "Professional", color: "bg-blue-500" },
  enterprise: { label: "Enterprise", color: "bg-purple-500" },
};

/* ---------- Component ---------- */

export default function MarketplaceStatsTab() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((m) => m.revenue));
  const maxServiceBookings = Math.max(...TOP_SERVICES.map((s) => s.bookings));
  const maxAgencyRevenue = Math.max(...TOP_AGENCIES.map((a) => a.revenue));

  const kpiCards = [
    {
      label: "Gesamtumsatz",
      value: formatCurrency(4835000),
      icon: Euro,
      iconColor: "text-gray-600 dark:text-gray-400",
      bg: "bg-white dark:bg-gray-900/40 border",
    },
    {
      label: "Platform-Gebuehren",
      value: formatCurrency(483500),
      icon: TrendingUp,
      iconColor: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
      valueColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Aktive Services",
      value: "42",
      icon: Package,
      iconColor: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800",
      valueColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Agenturen",
      value: "18",
      icon: Building2,
      iconColor: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800",
      valueColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Durchschn. Bewertung",
      value: "4.7",
      suffix: " \u2605",
      icon: Star,
      iconColor: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
      valueColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Conversion Rate",
      value: "12.3%",
      icon: BarChart3,
      iconColor: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
      valueColor: "text-green-600 dark:text-green-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards - 3x2 Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`${card.bg} shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className={`text-2xl font-bold tracking-tight ${card.valueColor || ""}`}>
                {card.value}
                {card.suffix || ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monatlicher Umsatz (Apr 2025 - Maer 2026)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1.5 sm:gap-2 h-56">
            {MONTHLY_REVENUE.map((month, idx) => {
              const heightPercent = (month.revenue / maxRevenue) * 100;
              const isHovered = hoveredBar === idx;
              return (
                <div
                  key={month.month}
                  className="flex-1 flex flex-col items-center gap-1 relative"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Hover tooltip */}
                  {isHovered && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-2 py-1 rounded whitespace-nowrap z-10">
                      {formatCurrency(month.revenue)}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all duration-200 ${
                      isHovered
                        ? "bg-gradient-to-t from-primary to-primary/70 scale-x-110"
                        : "bg-gradient-to-t from-primary/80 to-primary/50"
                    }`}
                    style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                  />
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap leading-tight">
                    {month.month}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top 5 Services */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TOP_SERVICES.map((service, index) => {
                const barWidth = (service.bookings / maxServiceBookings) * 100;
                return (
                  <div key={service.name} className="flex items-center gap-3">
                    <span className="text-xl font-bold text-muted-foreground/50 w-7 text-right tabular-nums">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{service.name}</p>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {service.bookings} Buchungen
                          </span>
                          <span className="text-xs font-medium">
                            {formatCurrency(service.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Agenturen */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Agenturen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TOP_AGENCIES.map((agency, index) => {
                const tierCfg = TIER_CONFIG[agency.tier] || {
                  label: agency.tier,
                  color: "bg-gray-500",
                };
                const barWidth = (agency.revenue / maxAgencyRevenue) * 100;
                return (
                  <div key={agency.name} className="flex items-center gap-3">
                    <span className="text-xl font-bold text-muted-foreground/50 w-7 text-right tabular-nums">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-medium text-sm truncate">{agency.name}</p>
                          <Badge
                            className={`${tierCfg.color} text-white text-[10px] px-1.5 py-0 shrink-0`}
                          >
                            {tierCfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="text-xs font-medium">
                            {formatCurrency(agency.revenue)}
                          </span>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(agency.fee)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500/70 to-cyan-500 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Kategorie-Verteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CATEGORY_BREAKDOWN.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-sm font-medium w-28 shrink-0">{cat.category}</span>
                <div className="flex-1 h-7 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${cat.color} rounded-full transition-all flex items-center justify-end pr-2`}
                    style={{ width: `${cat.percentage}%`, minWidth: cat.percentage >= 8 ? undefined : "2rem" }}
                  >
                    {cat.percentage >= 10 && (
                      <span className="text-xs font-bold text-white">{cat.percentage}%</span>
                    )}
                  </div>
                </div>
                {cat.percentage < 10 && (
                  <span className="text-xs font-semibold text-muted-foreground w-10 shrink-0">
                    {cat.percentage}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
