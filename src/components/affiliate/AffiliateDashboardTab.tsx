import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Wallet, 
  TrendingUp, 
  Percent, 
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AffiliateStatsCard } from "./AffiliateStatsCard";
import { AffiliatePerformanceChart } from "./AffiliatePerformanceChart";
import { useAffiliateStats, useAffiliateCommissions } from "@/hooks/useAffiliate";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface AffiliateDashboardTabProps {
  onRequestPayout: () => void;
  onShareVoucher: () => void;
}

export function AffiliateDashboardTab({ onRequestPayout, onShareVoucher }: AffiliateDashboardTabProps) {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useAffiliateStats();
  const { data: commissions } = useAffiliateCommissions();

  const tierColors: Record<string, string> = {
    bronze: "from-amber-600 to-amber-400",
    silver: "from-gray-400 to-gray-200",
    gold: "from-yellow-500 to-amber-300",
    platinum: "from-violet-500 to-purple-300",
  };

  const currentTier = stats?.affiliate?.tier || "bronze";
  const tierGradient = tierColors[currentTier] || tierColors.bronze;

  // Get stats from the API response
  const totalEarnings = stats?.commissions?.totalEarnings || stats?.affiliate?.total_earnings || 0;
  const pendingBalance = stats?.affiliate?.pending_balance || 0;
  const conversionRate = stats?.vouchers?.totalRedemptions 
    ? Math.round((stats.vouchers.totalRedemptions / (stats.vouchers.count || 1)) * 100) 
    : 0;

  // Generate mock monthly data for chart (would come from API in production)
  const monthlyData = stats?.monthlyStats || [
    { month: "Jan", earnings: 0, conversions: 0 },
    { month: "Feb", earnings: 0, conversions: 0 },
    { month: "Mär", earnings: 0, conversions: 0 },
    { month: "Apr", earnings: 0, conversions: 0 },
    { month: "Mai", earnings: 0, conversions: 0 },
    { month: "Jun", earnings: 0, conversions: 0 },
    { month: "Jul", earnings: 0, conversions: 0 },
    { month: "Aug", earnings: 0, conversions: 0 },
    { month: "Sep", earnings: 0, conversions: 0 },
    { month: "Okt", earnings: 0, conversions: 0 },
    { month: "Nov", earnings: 0, conversions: 0 },
    { month: "Dez", earnings: 0, conversions: 0 },
  ];

  const recentCommissions = commissions?.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "badge-success";
      case "pending": return "badge-warning";
      case "paid": return "badge-primary";
      default: return "badge-destructive";
    }
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 h-36 shimmer" />
          ))}
        </div>
        <div className="glass-card p-6 h-[400px] shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AffiliateStatsCard
          title={String(t("affiliate.stats.totalEarnings", "Gesamteinnahmen"))}
          value={totalEarnings}
          prefix="€"
          icon={Wallet}
          gradient="bg-gradient-to-br from-primary to-pink-500"
          delay={0}
        />
        <AffiliateStatsCard
          title={String(t("affiliate.stats.pendingBalance", "Offener Betrag"))}
          value={pendingBalance}
          prefix="€"
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-accent to-cyan-400"
          delay={0.1}
        />
        <AffiliateStatsCard
          title={String(t("affiliate.stats.conversionRate", "Conversion Rate"))}
          value={conversionRate}
          suffix="%"
          icon={Percent}
          gradient="bg-gradient-to-br from-success to-emerald-400"
          delay={0.2}
        />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card-hover p-6 relative overflow-hidden group"
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${tierGradient}`} />
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierGradient} flex items-center justify-center mb-4 shadow-lg`}>
            <Award className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">
            {String(t("affiliate.stats.tier", "Tier-Status"))}
          </p>
          <Badge className={`text-lg font-bold px-3 py-1 bg-gradient-to-r ${tierGradient} text-white border-0`}>
            {String(t(`affiliate.tiers.${currentTier}`, currentTier.toUpperCase()))}
          </Badge>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap gap-4"
      >
        <Button 
          onClick={onRequestPayout}
          className="btn-glow gap-2"
          disabled={pendingBalance < 50}
        >
          <Wallet className="w-4 h-4" />
          {String(t("affiliate.payouts.requestPayout", "Auszahlung anfordern"))}
          {pendingBalance >= 50 && <ArrowRight className="w-4 h-4" />}
        </Button>
        <Button 
          onClick={onShareVoucher}
          variant="outline"
          className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
        >
          <Sparkles className="w-4 h-4" />
          {t("affiliate.vouchers.share", "Gutschein teilen")}
        </Button>
      </motion.div>

      {/* Performance Chart */}
      <AffiliatePerformanceChart data={monthlyData} />

      {/* Recent Commissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">
          {t("affiliate.commissions.recent", "Letzte Provisionen")}
        </h3>
        
        {recentCommissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t("affiliate.commissions.noCommissions", "Noch keine Provisionen")}
          </p>
        ) : (
          <div className="space-y-3">
            {recentCommissions.map((commission: any, index: number) => (
              <motion.div
                key={commission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">€{Number(commission.commission_amount).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(commission.created_at), "dd. MMM yyyy", { locale: de })}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(commission.status)}>
                  {String(t(`affiliate.commissions.${commission.status}`, commission.status))}
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
