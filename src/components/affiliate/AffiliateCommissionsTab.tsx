import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Coins, 
  Search,
  Calendar,
  Filter,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAffiliateCommissions } from "@/hooks/useAffiliate";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export function AffiliateCommissionsTab() {
  const { t } = useTranslation();
  const { data: commissions, isLoading } = useAffiliateCommissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCommissions = useMemo(() => {
    if (!commissions) return [];
    
    return commissions.filter((commission: any) => {
      const matchesStatus = statusFilter === "all" || commission.status === statusFilter;
      const matchesSearch = !searchQuery || 
        commission.voucher?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commission.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [commissions, statusFilter, searchQuery]);

  const totals = useMemo(() => {
    if (!filteredCommissions) return { total: 0, pending: 0, approved: 0, paid: 0 };
    
    return filteredCommissions.reduce((acc: any, c: any) => {
      const amount = Number(c.commission_amount);
      acc.total += amount;
      if (c.status === "pending") acc.pending += amount;
      if (c.status === "approved") acc.approved += amount;
      if (c.status === "paid") acc.paid += amount;
      return acc;
    }, { total: 0, pending: 0, approved: 0, paid: 0 });
  }, [filteredCommissions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "badge-success";
      case "pending": return "badge-warning";
      case "paid": return "badge-primary";
      case "cancelled": return "badge-destructive";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return "✓";
      case "pending": return "⏳";
      case "paid": return "💰";
      case "cancelled": return "✗";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-4 h-16 shimmer" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card p-4 h-20 shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Coins className="w-4 h-4" />
            <span className="text-sm">{t("common.all", "Gesamt")}</span>
          </div>
          <p className="text-2xl font-bold">€{totals.total.toFixed(2)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 text-warning mb-1">
            <span className="text-sm">{t("affiliate.commissions.pending", "Ausstehend")}</span>
          </div>
          <p className="text-2xl font-bold text-warning">€{totals.pending.toFixed(2)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 text-success mb-1">
            <span className="text-sm">{t("affiliate.commissions.approved", "Genehmigt")}</span>
          </div>
          <p className="text-2xl font-bold text-success">€{totals.approved.toFixed(2)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 text-primary mb-1">
            <span className="text-sm">{t("affiliate.commissions.paid", "Ausgezahlt")}</span>
          </div>
          <p className="text-2xl font-bold text-primary">€{totals.paid.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("affiliate.commissions.searchPlaceholder", "Suche nach Gutschein oder E-Mail...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("common.filter", "Filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all", "Alle")}</SelectItem>
              <SelectItem value="pending">{t("affiliate.commissions.pending", "Ausstehend")}</SelectItem>
              <SelectItem value="approved">{t("affiliate.commissions.approved", "Genehmigt")}</SelectItem>
              <SelectItem value="paid">{t("affiliate.commissions.paid", "Ausgezahlt")}</SelectItem>
              <SelectItem value="cancelled">{t("affiliate.commissions.cancelled", "Storniert")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Commissions List */}
      {filteredCommissions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Coins className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t("affiliate.commissions.noCommissions", "Keine Provisionen gefunden")}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? t("affiliate.commissions.noResults", "Keine Ergebnisse für diese Filter")
              : t("affiliate.commissions.noCommissionsYet", "Sobald Provisionen anfallen, siehst du sie hier.")}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredCommissions.map((commission: any, index: number) => (
            <motion.div
              key={commission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">€{Number(commission.commission_amount).toFixed(2)}</p>
                      <Badge className={getStatusColor(commission.status)}>
                        {getStatusIcon(commission.status)} {String(t(`affiliate.commissions.${commission.status}`, commission.status))}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(commission.created_at), "dd. MMM yyyy", { locale: de })}
                      </span>
                      {commission.voucher?.code && (
                        <span className="text-primary font-mono">
                          {commission.voucher.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("affiliate.commissions.orderAmount", "Bestellwert")}
                    </p>
                    <p className="font-medium">€{Number(commission.order_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("affiliate.commissions.rate", "Rate")}
                    </p>
                    <p className="font-medium">
                      {commission.commission_type === "percentage" 
                        ? `${commission.commission_rate}%` 
                        : `€${commission.commission_rate}`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
