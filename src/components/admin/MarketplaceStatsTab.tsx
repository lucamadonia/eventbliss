import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Euro,
  TrendingUp,
  Package,
  Building2,
  Star,
  BarChart3,
  Loader2,
} from "lucide-react";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "bg-gray-500" },
  professional: { label: "Professional", color: "bg-blue-500" },
  enterprise: { label: "Enterprise", color: "bg-purple-500" },
};

const CATEGORY_COLORS: Record<string, string> = {
  workshop: "from-violet-500 to-violet-400",
  entertainment: "from-pink-500 to-pink-400",
  catering: "from-amber-500 to-amber-400",
  music: "from-blue-500 to-blue-400",
  sport: "from-red-500 to-red-400",
  wellness: "from-green-500 to-green-400",
};

const MONTH_NAMES = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface TopService {
  name: string;
  bookings: number;
  revenue: number;
}

interface TopAgency {
  name: string;
  tier: string;
  revenue: number;
  fee: number;
}

interface CategoryBreakdown {
  category: string;
  percentage: number;
  color: string;
}

interface StatsData {
  totalRevenue: number;
  platformFees: number;
  activeServices: number;
  agencyCount: number;
  monthlyRevenue: MonthlyRevenue[];
  topServices: TopService[];
  topAgencies: TopAgency[];
  categoryBreakdown: CategoryBreakdown[];
}

async function fetchStatsData(): Promise<StatsData> {
  const [bookingsRes, servicesRes, agenciesRes, translationsRes] = await Promise.all([
    (supabase.from as any)("marketplace_bookings").select("id, service_id, agency_id, total_price_cents, platform_fee_cents, created_at, status"),
    (supabase.from as any)("marketplace_services").select("id, category, agency_id, status"),
    (supabase.from as any)("agencies").select("id, name, marketplace_tier"),
    (supabase.from as any)("marketplace_service_translations").select("service_id, locale, title").in("locale", ["de", "en"]),
  ]);

  const bookings = bookingsRes.data || [];
  const services = servicesRes.data || [];
  const agencies = agenciesRes.data || [];
  const translations = translationsRes.data || [];

  // Build title map (prefer DE)
  const titleMap: Record<string, string> = {};
  for (const t of translations) {
    if (!titleMap[t.service_id] || t.locale === "de") {
      titleMap[t.service_id] = t.title;
    }
  }

  // Build agency name map
  const agencyMap: Record<string, { name: string; tier: string }> = {};
  for (const a of agencies) {
    agencyMap[a.id] = { name: a.name, tier: a.marketplace_tier || "starter" };
  }

  // Total revenue & fees
  const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.total_price_cents || 0), 0);
  const platformFees = bookings.reduce((sum: number, b: any) => sum + (b.platform_fee_cents || 0), 0);

  // Active services count
  const activeServices = services.filter((s: any) => s.status === "approved").length;

  // Agency count
  const agencyCount = agencies.length;

  // Monthly revenue (last 12 months)
  const monthMap: Record<string, number> = {};
  for (const b of bookings) {
    if (!b.created_at) continue;
    const d = new Date(b.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + (b.platform_fee_cents || 0);
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const last12 = sortedMonths.slice(-12);
  const monthlyRevenue: MonthlyRevenue[] = last12.map((key) => {
    const [year, month] = key.split("-");
    const shortYear = year.slice(2);
    const monthName = MONTH_NAMES[parseInt(month, 10) - 1];
    return { month: `${monthName} '${shortYear}`, revenue: monthMap[key] };
  });

  // Top services by bookings
  const serviceBookings: Record<string, { count: number; revenue: number }> = {};
  for (const b of bookings) {
    if (!b.service_id) continue;
    if (!serviceBookings[b.service_id]) serviceBookings[b.service_id] = { count: 0, revenue: 0 };
    serviceBookings[b.service_id].count++;
    serviceBookings[b.service_id].revenue += b.total_price_cents || 0;
  }
  const topServices: TopService[] = Object.entries(serviceBookings)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([id, data]) => ({
      name: titleMap[id] || id.slice(0, 12),
      bookings: data.count,
      revenue: data.revenue,
    }));

  // Top agencies by revenue
  const agencyRevenue: Record<string, { revenue: number; fee: number }> = {};
  for (const b of bookings) {
    if (!b.agency_id) continue;
    if (!agencyRevenue[b.agency_id]) agencyRevenue[b.agency_id] = { revenue: 0, fee: 0 };
    agencyRevenue[b.agency_id].revenue += b.total_price_cents || 0;
    agencyRevenue[b.agency_id].fee += b.platform_fee_cents || 0;
  }
  const topAgencies: TopAgency[] = Object.entries(agencyRevenue)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(([id, data]) => ({
      name: agencyMap[id]?.name || "Unbekannt",
      tier: agencyMap[id]?.tier || "starter",
      revenue: data.revenue,
      fee: data.fee,
    }));

  // Category breakdown
  const catCount: Record<string, number> = {};
  for (const s of services) {
    const cat = s.category || "Andere";
    catCount[cat] = (catCount[cat] || 0) + 1;
  }
  const totalServices = services.length || 1;
  const categoryBreakdown: CategoryBreakdown[] = Object.entries(catCount)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      percentage: Math.round((count / totalServices) * 100),
      color: CATEGORY_COLORS[cat] || "from-gray-500 to-gray-400",
    }));

  return {
    totalRevenue,
    platformFees,
    activeServices,
    agencyCount,
    monthlyRevenue,
    topServices,
    topAgencies,
    categoryBreakdown,
  };
}

/* ---------- Component ---------- */

export default function MarketplaceStatsTab() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-marketplace-stats"],
    queryFn: fetchStatsData,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const {
    totalRevenue,
    platformFees,
    activeServices,
    agencyCount,
    monthlyRevenue,
    topServices,
    topAgencies,
    categoryBreakdown,
  } = data;

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);
  const maxServiceBookings = Math.max(...topServices.map((s) => s.bookings), 1);
  const maxAgencyRevenue = Math.max(...topAgencies.map((a) => a.revenue), 1);

  const kpiCards = [
    {
      label: "Gesamtumsatz",
      value: formatCurrency(totalRevenue),
      icon: Euro,
      iconColor: "text-gray-600 dark:text-gray-400",
      bg: "bg-white dark:bg-gray-900/40 border",
    },
    {
      label: "Platform-Gebühren",
      value: formatCurrency(platformFees),
      icon: TrendingUp,
      iconColor: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
      valueColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Aktive Services",
      value: activeServices.toString(),
      icon: Package,
      iconColor: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800",
      valueColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Agenturen",
      value: agencyCount.toString(),
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

  const chartTitle = monthlyRevenue.length >= 2
    ? `Monatlicher Umsatz (${monthlyRevenue[0].month} - ${monthlyRevenue[monthlyRevenue.length - 1].month})`
    : "Monatlicher Umsatz";

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
          <CardTitle>{chartTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Noch keine Umsatzdaten vorhanden.</p>
          ) : (
            <div className="flex items-end gap-1.5 sm:gap-2 h-56">
              {monthlyRevenue.map((month, idx) => {
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
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top 5 Services */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Services</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Noch keine Buchungsdaten.</p>
            ) : (
              <div className="space-y-4">
                {topServices.map((service, index) => {
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
            )}
          </CardContent>
        </Card>

        {/* Top 5 Agenturen */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Agenturen</CardTitle>
          </CardHeader>
          <CardContent>
            {topAgencies.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Noch keine Umsatzdaten.</p>
            ) : (
              <div className="space-y-4">
                {topAgencies.map((agency, index) => {
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Kategorie-Verteilung</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Noch keine Services vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
