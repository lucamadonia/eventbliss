import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Wallet, 
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAffiliateStats, useAffiliatePayouts, useRequestPayout } from "@/hooks/useAffiliate";
import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

export function AffiliatePayoutsTab() {
  const { t } = useTranslation();
  const { data: stats } = useAffiliateStats();
  const { data: payouts, isLoading } = useAffiliatePayouts();
  const requestPayout = useRequestPayout();
  const [dialogOpen, setDialogOpen] = useState(false);

  const pendingBalance = stats?.affiliate?.pending_balance || 0;
  const minAmount = 50;
  const canRequestPayout = pendingBalance >= minAmount;

  const handleRequestPayout = async () => {
    try {
      await requestPayout.mutateAsync();
      toast.success(t("affiliate.payouts.requested", "Auszahlung erfolgreich angefordert!"));
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || t("common.error", "Fehler"));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "processing": return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case "pending": return <Clock className="w-5 h-5 text-warning" />;
      case "failed": return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "badge-success";
      case "processing": return "badge-primary";
      case "pending": return "badge-warning";
      case "failed": return "badge-destructive";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8 h-48 shimmer" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 h-20 shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-pink-500/10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("affiliate.payouts.availableBalance", "Verfügbarer Betrag")}
              </p>
              <motion.p 
                className="text-4xl font-bold text-gradient-primary"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                €{pendingBalance.toFixed(2)}
              </motion.p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="btn-glow gap-2"
                  disabled={!canRequestPayout || requestPayout.isPending}
                >
                  {requestPayout.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Banknote className="w-4 h-4" />
                  )}
                  {t("affiliate.payouts.requestPayout", "Auszahlung anfordern")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("affiliate.payouts.confirmTitle", "Auszahlung bestätigen")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("affiliate.payouts.confirmDesc", "Möchtest du eine Auszahlung über folgenden Betrag anfordern?")}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gradient-primary">
                      €{pendingBalance.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("affiliate.payouts.willBeTransferred", "wird auf dein hinterlegtes Konto überwiesen")}
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {t("common.cancel", "Abbrechen")}
                  </Button>
                  <Button 
                    onClick={handleRequestPayout}
                    disabled={requestPayout.isPending}
                    className="btn-glow"
                  >
                    {requestPayout.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {t("common.confirm", "Bestätigen")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <p className="text-sm text-muted-foreground">
              {canRequestPayout 
                ? t("affiliate.payouts.readyForPayout", "Bereit zur Auszahlung")
                : t("affiliate.payouts.minAmount", `Mindestbetrag: €${minAmount}`)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Payouts History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">
          {t("affiliate.payouts.history", "Auszahlungsverlauf")}
        </h3>

        {!payouts || payouts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Banknote className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("affiliate.payouts.noPayouts", "Noch keine Auszahlungen")}
            </h3>
            <p className="text-muted-foreground">
              {t("affiliate.payouts.noPayoutsDesc", "Deine Auszahlungshistorie erscheint hier.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout: any, index: number) => (
              <motion.div
                key={payout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payout.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">€{Number(payout.amount).toFixed(2)}</p>
                        <Badge className={getStatusColor(payout.status)}>
                          {String(t(`affiliate.payouts.${payout.status}`, payout.status))}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(payout.created_at), "dd. MMM yyyy", { locale: de })}
                        </span>
                        {payout.payout_reference && (
                          <span className="font-mono text-xs">
                            {t("affiliate.payouts.reference", "Ref")}: {payout.payout_reference}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {payout.payout_method === "bank_transfer" 
                        ? t("affiliate.settings.bankTransfer", "Banküberweisung")
                        : t("affiliate.settings.paypal", "PayPal")}
                    </p>
                    {payout.processed_at && (
                      <p className="text-xs text-muted-foreground">
                        {t("affiliate.payouts.processedAt", "Bearbeitet")}: {format(new Date(payout.processed_at), "dd.MM.yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
