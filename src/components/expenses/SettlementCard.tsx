import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Send, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Balance {
  id: string;
  name: string;
  paid: number;
  owes: number;
  balance: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromBalance?: Balance;
  toBalance?: Balance;
}

interface SettlementCardProps {
  settlement: Settlement;
  currency: string;
  index?: number;
  onMarkPaid?: (settlement: Settlement) => void;
}

export const SettlementCard = ({ settlement, currency, index = 0, onMarkPaid }: SettlementCardProps) => {
  const { t } = useTranslation();

  const handleShare = () => {
    const message = `💸 ${t("expenses.settlementMessage", {
      from: settlement.from,
      to: settlement.to,
      amount: `${currency}${settlement.amount.toFixed(2)}`,
    })}`;

    if (navigator.share) {
      navigator.share({
        text: message,
      }).catch(() => {
        // User cancelled
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(message);
      toast({
        title: t("common.copied"),
        description: t("expenses.settlementCopied"),
      });
    }
  };

  const formatBalance = (balance: Balance | undefined) => {
    if (!balance) return null;
    return t("expenses.balanceTooltip", {
      name: balance.name,
      paid: `${currency}${balance.paid.toFixed(2)}`,
      owes: `${currency}${balance.owes.toFixed(2)}`,
      balance: `${balance.balance >= 0 ? "+" : ""}${currency}${balance.balance.toFixed(2)}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-border/50 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* From avatar with tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative cursor-help">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  {settlement.from.charAt(0).toUpperCase()}
                </div>
              </div>
            </TooltipTrigger>
            {settlement.fromBalance && (
              <TooltipContent className="max-w-xs">
                <p>{formatBalance(settlement.fromBalance)}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Arrow */}
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* To avatar with tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative cursor-help">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                  {settlement.to.charAt(0).toUpperCase()}
                </div>
              </div>
            </TooltipTrigger>
            {settlement.toBalance && (
              <TooltipContent className="max-w-xs">
                <p>{formatBalance(settlement.toBalance)}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Names and amount */}
        <div className="ml-2">
          <p className="font-medium">
            <span className="text-red-400">{settlement.from}</span>
            <span className="text-muted-foreground mx-1">→</span>
            <span className="text-green-400">{settlement.to}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {t("expenses.owes")} <span className="font-bold text-foreground">{currency}{settlement.amount.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="text-muted-foreground hover:text-foreground"
        >
          <Send className="w-4 h-4" />
        </Button>
        {onMarkPaid && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkPaid(settlement)}
            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            <Check className="w-4 h-4 mr-1" />
            {t("expenses.paid")}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

interface SettlementListProps {
  settlements: Settlement[];
  currency: string;
  balances?: Balance[];
  onMarkPaid?: (settlement: Settlement) => void;
}

export const SettlementList = ({ settlements, currency, balances, onMarkPaid }: SettlementListProps) => {
  const { t } = useTranslation();

  if (settlements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <p className="font-medium text-green-400">{t("expenses.allSettled")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("expenses.noSettlementsNeeded")}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement, index) => (
        <SettlementCard
          key={`${settlement.from}-${settlement.to}-${settlement.amount}`}
          settlement={settlement}
          currency={currency}
          index={index}
          onMarkPaid={onMarkPaid}
        />
      ))}
    </div>
  );
};
