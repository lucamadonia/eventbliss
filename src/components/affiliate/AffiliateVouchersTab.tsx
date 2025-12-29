import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Ticket, 
  Copy, 
  Share2, 
  TrendingUp,
  Users,
  Wallet,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAffiliateVouchers } from "@/hooks/useAffiliate";
import { useState } from "react";
import { toast } from "sonner";

export function AffiliateVouchersTab() {
  const { t } = useTranslation();
  const { data: vouchers, isLoading } = useAffiliateVouchers();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(t("common.copied", "Kopiert!"));
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error(t("common.error", "Fehler beim Kopieren"));
    }
  };

  const shareVoucher = async (code: string, discountValue: number, discountType: string) => {
    const discountText = discountType === "percentage" ? `${discountValue}%` : `€${discountValue}`;
    const message = t("affiliate.vouchers.shareMessage", 
      `🎉 Sichere dir ${discountText} Rabatt mit dem Code: ${code}\n\n👉 Jetzt auf EventBliss einlösen!`
    );
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "EventBliss Rabattcode",
          text: message,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(message);
      toast.success(t("affiliate.vouchers.messageCopied", "Nachricht kopiert!"));
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 h-64 shimmer" />
        ))}
      </div>
    );
  }

  if (!vouchers || vouchers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Ticket className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {t("affiliate.vouchers.noVouchers", "Noch keine Gutscheine zugewiesen")}
        </h3>
        <p className="text-muted-foreground">
          {t("affiliate.vouchers.noVouchersDesc", "Sobald dir Gutscheine zugewiesen werden, siehst du sie hier.")}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vouchers.map((voucherData: any, index: number) => {
        const voucher = voucherData.voucher;
        if (!voucher) return null;
        
        const discountText = voucher.discount_type === "percentage" 
          ? `${voucher.discount_value}%` 
          : `€${voucher.discount_value}`;

        return (
          <motion.div
            key={voucher.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="glass-card-hover p-6 relative overflow-hidden group"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-primary to-pink-500" />
            
            {/* Ticket Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <Badge variant={voucher.is_active ? "default" : "secondary"}>
                {voucher.is_active ? t("common.active", "Aktiv") : t("common.inactive", "Inaktiv")}
              </Badge>
            </div>

            {/* Code Display */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t("affiliate.vouchers.code", "Gutscheincode")}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-bold tracking-wider text-primary">
                  {voucher.code}
                </code>
              </div>
              <p className="text-lg font-semibold mt-1 text-gradient-primary">
                {discountText} {t("affiliate.vouchers.discount", "Rabatt")}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 py-4 border-y border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                </div>
                <p className="text-xl font-bold">{voucher.used_count || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {t("affiliate.vouchers.redemptions", "Einlösungen")}
                </p>
              </div>
              <div className="text-center border-x border-border">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Wallet className="w-3 h-3" />
                </div>
                <p className="text-xl font-bold">€0</p>
                <p className="text-xs text-muted-foreground">
                  {t("affiliate.vouchers.generated", "Generiert")}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <p className="text-xl font-bold">0%</p>
                <p className="text-xs text-muted-foreground">
                  {t("affiliate.vouchers.convRate", "Conv. Rate")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => copyCode(voucher.code)}
              >
                {copiedCode === voucher.code ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {t("common.copyCode", "Code kopieren")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => shareVoucher(voucher.code, voucher.discount_value, voucher.discount_type)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
