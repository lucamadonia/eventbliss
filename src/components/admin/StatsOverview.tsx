import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Calendar, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  totalEvents: number;
  totalVouchers: number;
  vouchersRedeemed: number;
}

export function StatsOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    premiumUsers: 0,
    totalEvents: 0,
    totalVouchers: 0,
    vouchersRedeemed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch subscriptions count
        const { count: subsCount } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true });

        // Fetch premium subscriptions
        const { count: premiumCount } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("plan", "premium");

        // Fetch events count
        const { count: eventsCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });

        // Fetch vouchers count
        const { count: vouchersCount } = await supabase
          .from("vouchers")
          .select("*", { count: "exact", head: true });

        // Fetch voucher redemptions count
        const { count: redemptionsCount } = await supabase
          .from("voucher_redemptions")
          .select("*", { count: "exact", head: true });

        setStats({
          totalUsers: subsCount || 0,
          premiumUsers: premiumCount || 0,
          totalEvents: eventsCount || 0,
          totalVouchers: vouchersCount || 0,
          vouchersRedeemed: redemptionsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: t("admin.stats.totalUsers", "Registrierte Nutzer"),
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t("admin.stats.premiumUsers", "Premium-Abonnenten"),
      value: stats.premiumUsers,
      icon: CreditCard,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: t("admin.stats.totalEvents", "Erstellte Events"),
      value: stats.totalEvents,
      icon: Calendar,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: t("admin.stats.vouchersRedeemed", "Eingelöste Voucher"),
      value: `${stats.vouchersRedeemed} / ${stats.totalVouchers}`,
      icon: Ticket,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("admin.stats.title", "Dashboard")}</h2>
        <p className="text-muted-foreground">
          {t("admin.stats.subtitle", "Übersicht aller wichtigen Metriken")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
