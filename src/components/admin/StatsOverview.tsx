import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, CreditCard, Calendar, Ticket, Building2, TrendingUp,
  DollarSign, Sparkles, UserPlus, ShoppingBag, Crown, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Stats {
  // Users
  totalUsers: number;
  newUsers24h: number;
  newUsers7d: number;
  activeUsers30d: number;
  // Subscriptions
  totalSubs: number;
  premiumUsers: number;
  monthlyRecurringRevenue: number;
  // Agencies
  totalAgencies: number;
  proAgencies: number;
  enterpriseAgencies: number;
  // Marketplace
  totalServices: number;
  pendingServices: number;
  totalBookings: number;
  bookings30d: number;
  // Events
  totalEvents: number;
  // Vouchers
  totalVouchers: number;
  vouchersRedeemed: number;
}

const EMPTY_STATS: Stats = {
  totalUsers: 0, newUsers24h: 0, newUsers7d: 0, activeUsers30d: 0,
  totalSubs: 0, premiumUsers: 0, monthlyRecurringRevenue: 0,
  totalAgencies: 0, proAgencies: 0, enterpriseAgencies: 0,
  totalServices: 0, pendingServices: 0, totalBookings: 0, bookings30d: 0,
  totalEvents: 0, totalVouchers: 0, vouchersRedeemed: 0,
};

export function StatsOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [
          usersTotal, users24h, users7d, activeUsers30dRes,
          subsTotal, premiumSubs,
          agenciesTotal, agencyTiersRes,
          servicesTotal, servicesPending, bookingsTotal, bookings30dRes,
          eventsTotal, vouchersTotal, vouchersRedeemedRes,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", h24),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", d7),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", d30),
          supabase.from("subscriptions").select("*", { count: "exact", head: true }),
          supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan", "premium"),
          supabase.from("agencies").select("*", { count: "exact", head: true }),
          supabase.from("agency_marketplace_subscriptions").select("tier").eq("is_active", true),
          supabase.from("marketplace_services").select("*", { count: "exact", head: true }),
          supabase.from("marketplace_services").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
          supabase.from("marketplace_bookings").select("*", { count: "exact", head: true }),
          supabase.from("marketplace_bookings").select("*", { count: "exact", head: true }).gte("created_at", d30),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("vouchers").select("*", { count: "exact", head: true }),
          supabase.from("vouchers").select("*", { count: "exact", head: true }).eq("status", "redeemed"),
        ]);

        const tiers = agencyTiersRes.data ?? [];
        const proCount = tiers.filter((t) => t.tier === "professional").length;
        const entCount = tiers.filter((t) => t.tier === "enterprise").length;
        const mrr = proCount * 49 + entCount * 149;

        setStats({
          totalUsers: usersTotal.count ?? 0,
          newUsers24h: users24h.count ?? 0,
          newUsers7d: users7d.count ?? 0,
          activeUsers30d: activeUsers30dRes.count ?? 0,
          totalSubs: subsTotal.count ?? 0,
          premiumUsers: premiumSubs.count ?? 0,
          monthlyRecurringRevenue: mrr,
          totalAgencies: agenciesTotal.count ?? 0,
          proAgencies: proCount,
          enterpriseAgencies: entCount,
          totalServices: servicesTotal.count ?? 0,
          pendingServices: servicesPending.count ?? 0,
          totalBookings: bookingsTotal.count ?? 0,
          bookings30d: bookings30dRes.count ?? 0,
          totalEvents: eventsTotal.count ?? 0,
          totalVouchers: vouchersTotal.count ?? 0,
          vouchersRedeemed: vouchersRedeemedRes.count ?? 0,
        });
      } catch (err) {
        console.error("Stats fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const conversionRate = stats.totalUsers > 0
    ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)
    : "0.0";

  const kpiGroups: Array<{
    title: string;
    subtitle?: string;
    cards: Array<{ label: string; value: string | number; sub?: string; icon: typeof Users; accent: string }>;
  }> = [
    {
      title: t("admin.stats.groupGrowth", "Wachstum"),
      subtitle: t("admin.stats.groupGrowthSub", "Nutzer und Aktivität"),
      cards: [
        { label: t("admin.stats.totalUsers", "Gesamt-Nutzer"), value: stats.totalUsers, sub: `+${stats.newUsers7d} ${t("admin.stats.thisWeek", "diese Woche")}`, icon: Users, accent: "from-violet-500 to-purple-600" },
        { label: t("admin.stats.new24h", "Neu (24h)"), value: stats.newUsers24h, icon: UserPlus, accent: "from-cyan-500 to-blue-600" },
        { label: t("admin.stats.activeUsers", "Aktiv (30 Tage)"), value: stats.activeUsers30d, sub: `${Math.round((stats.activeUsers30d / Math.max(stats.totalUsers, 1)) * 100)}%`, icon: TrendingUp, accent: "from-emerald-500 to-teal-600" },
        { label: t("admin.stats.events", "Events"), value: stats.totalEvents, icon: Calendar, accent: "from-pink-500 to-rose-600" },
      ],
    },
    {
      title: t("admin.stats.groupRevenue", "Umsatz"),
      subtitle: t("admin.stats.groupRevenueSub", "Abos und MRR"),
      cards: [
        { label: t("admin.stats.mrr", "MRR (Agenturen)"), value: `${stats.monthlyRecurringRevenue.toLocaleString("de-DE")} €`, sub: t("admin.stats.mrrSub", "Professional + Enterprise"), icon: DollarSign, accent: "from-emerald-500 to-green-600" },
        { label: t("admin.stats.premium", "Premium-Nutzer"), value: stats.premiumUsers, sub: `${conversionRate}% Conversion`, icon: Crown, accent: "from-amber-500 to-orange-600" },
        { label: t("admin.stats.totalSubs", "Aktive Abos"), value: stats.totalSubs, icon: CreditCard, accent: "from-violet-500 to-pink-600" },
        { label: t("admin.stats.vouchersRedeemed", "Eingelöste Voucher"), value: `${stats.vouchersRedeemed} / ${stats.totalVouchers}`, icon: Ticket, accent: "from-pink-500 to-purple-600" },
      ],
    },
    {
      title: t("admin.stats.groupAgencies", "Agenturen"),
      subtitle: t("admin.stats.groupAgenciesSub", "B2B Plattform"),
      cards: [
        { label: t("admin.stats.totalAgencies", "Gesamt-Agenturen"), value: stats.totalAgencies, icon: Building2, accent: "from-violet-500 to-indigo-600" },
        { label: t("admin.stats.proAgencies", "Professional"), value: stats.proAgencies, sub: `${stats.proAgencies * 49} €/Mo`, icon: Zap, accent: "from-violet-500 to-pink-600" },
        { label: t("admin.stats.enterpriseAgencies", "Enterprise"), value: stats.enterpriseAgencies, sub: `${stats.enterpriseAgencies * 149} €/Mo`, icon: Crown, accent: "from-amber-500 to-red-600" },
        { label: t("admin.stats.starterAgencies", "Starter (Free)"), value: stats.totalAgencies - stats.proAgencies - stats.enterpriseAgencies, icon: Sparkles, accent: "from-slate-500 to-slate-700" },
      ],
    },
    {
      title: t("admin.stats.groupMarketplace", "Marketplace"),
      subtitle: t("admin.stats.groupMarketplaceSub", "Services und Buchungen"),
      cards: [
        { label: t("admin.stats.totalServices", "Aktive Services"), value: stats.totalServices, icon: ShoppingBag, accent: "from-cyan-500 to-blue-600" },
        { label: t("admin.stats.pendingServices", "Zu prüfen"), value: stats.pendingServices, sub: stats.pendingServices > 0 ? t("admin.stats.reviewNeeded", "Review erforderlich") : "", icon: Ticket, accent: stats.pendingServices > 0 ? "from-amber-500 to-orange-600" : "from-slate-500 to-slate-700" },
        { label: t("admin.stats.totalBookings", "Buchungen gesamt"), value: stats.totalBookings, icon: Calendar, accent: "from-emerald-500 to-teal-600" },
        { label: t("admin.stats.bookings30d", "Buchungen (30 Tage)"), value: stats.bookings30d, icon: TrendingUp, accent: "from-pink-500 to-rose-600" },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-28 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl md:text-3xl font-black mb-1">
          {t("admin.stats.title", "Platform Overview")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.stats.subtitle", "Die wichtigsten KPIs auf einen Blick — live aus der Datenbank.")}
        </p>
      </div>

      {kpiGroups.map((group) => (
        <section key={group.title}>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60">
              {group.title}
            </h3>
            {group.subtitle && (
              <span className="text-xs text-muted-foreground">{group.subtitle}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {group.cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="group relative overflow-hidden hover:border-foreground/20 transition-colors">
                  <div className={cn("absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br", card.accent)} />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {card.label}
                      </CardTitle>
                      <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm", card.accent)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-black tracking-tight">
                      {card.value}
                    </div>
                    {card.sub && (
                      <div className="text-xs text-muted-foreground mt-1.5">
                        {card.sub}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {stats.pendingServices > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold">{t("admin.stats.alertPendingTitle", "Review erforderlich")}</div>
              <div className="text-sm text-muted-foreground">
                {t("admin.stats.alertPendingBody", "{{count}} Marketplace-Services warten auf Freigabe.", { count: stats.pendingServices })}
              </div>
            </div>
            <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-200 font-bold">
              {stats.pendingServices}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
