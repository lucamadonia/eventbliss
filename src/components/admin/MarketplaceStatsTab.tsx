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

const MONTHLY_REVENUE = [
  { month: "Mai '25", revenue: 185000 },
  { month: "Jun '25", revenue: 220000 },
  { month: "Jul '25", revenue: 310000 },
  { month: "Aug '25", revenue: 280000 },
  { month: "Sep '25", revenue: 350000 },
  { month: "Okt '25", revenue: 420000 },
  { month: "Nov '25", revenue: 390000 },
  { month: "Dez '25", revenue: 510000 },
  { month: "Jan '26", revenue: 280000 },
  { month: "Feb '26", revenue: 340000 },
  { month: "Mar '26", revenue: 460000 },
  { month: "Apr '26", revenue: 490000 },
];

const TOP_SERVICES = [
  { name: "DJ Party Paket", bookings: 34, revenue: 2036600 },
  { name: "Private Chef Dinner", bookings: 28, revenue: 249200 },
  { name: "Cocktail Workshop Berlin", bookings: 25, revenue: 97500 },
  { name: "Wine Tasting Premium", bookings: 22, revenue: 107800 },
  { name: "Escape Room Adventure", bookings: 19, revenue: 47500 },
];

const TOP_AGENCIES = [
  { name: "Berlin Events GmbH", tier: "professional", revenue: 2250000, bookings: 58 },
  { name: "Gourmet Events", tier: "enterprise", revenue: 890000, bookings: 50 },
  { name: "Fun Factory", tier: "starter", revenue: 320000, bookings: 32 },
  { name: "Speed Events", tier: "professional", revenue: 280000, bookings: 24 },
  { name: "Zen Space", tier: "starter", revenue: 195000, bookings: 18 },
];

const CATEGORY_BREAKDOWN = [
  { category: "Catering", percentage: 28, color: "bg-amber-500" },
  { category: "Musik", percentage: 24, color: "bg-blue-500" },
  { category: "Workshop", percentage: 20, color: "bg-violet-500" },
  { category: "Entertainment", percentage: 14, color: "bg-pink-500" },
  { category: "Sport", percentage: 8, color: "bg-red-500" },
  { category: "Wellness", percentage: 6, color: "bg-green-500" },
];

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "bg-gray-500" },
  professional: { label: "Professional", color: "bg-blue-500" },
  enterprise: { label: "Enterprise", color: "bg-purple-500" },
};

export default function MarketplaceStatsTab() {
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((m) => m.revenue));

  const kpiCards = [
    { label: "Gesamtumsatz", value: formatCurrency(4835000), icon: Euro, color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-900/20" },
    { label: "Platform-Gebuehren", value: formatCurrency(483500), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", valueColor: "text-green-600" },
    { label: "Aktive Services", value: "42", icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Agenturen", value: "18", icon: Building2, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Durchschn. Bewertung", value: "4.7", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", suffix: "\u2605" },
    { label: "Conversion Rate", value: "12.3%", icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={card.bg}>
            <CardContent className="p-4">
              <card.icon className={`h-6 w-6 ${card.color} mb-2`} />
              <p className={`text-xl font-bold ${card.valueColor || ""}`}>
                {card.value}{card.suffix || ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monatlicher Umsatz (letzte 12 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {MONTHLY_REVENUE.map((month) => {
              const heightPercent = (month.revenue / maxRevenue) * 100;
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatCurrency(month.revenue)}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-t-md transition-all hover:from-primary hover:to-primary/90"
                    style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                  />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
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
            <CardTitle>Top 5 Services (nach Buchungen)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TOP_SERVICES.map((service, index) => (
                <div key={service.name} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.bookings} Buchungen &middot; {formatCurrency(service.revenue)}
                    </p>
                  </div>
                  <Badge variant="secondary">{service.bookings}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Agencies */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Agenturen (nach Umsatz)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TOP_AGENCIES.map((agency, index) => {
                const tierCfg = TIER_CONFIG[agency.tier] || { label: agency.tier, color: "bg-gray-500" };
                return (
                  <div key={agency.name} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{agency.name}</p>
                        <Badge className={`${tierCfg.color} text-white text-xs`}>{tierCfg.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agency.bookings} Buchungen &middot; {formatCurrency(agency.revenue)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(agency.revenue * 0.1)}
                    </span>
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
                <span className="text-sm font-medium w-28">{cat.category}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full transition-all flex items-center justify-end pr-2`}
                    style={{ width: `${cat.percentage}%` }}
                  >
                    {cat.percentage >= 10 && (
                      <span className="text-xs font-bold text-white">{cat.percentage}%</span>
                    )}
                  </div>
                </div>
                {cat.percentage < 10 && (
                  <span className="text-xs font-medium text-muted-foreground w-10">{cat.percentage}%</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
