import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Bell,
  X,
  Check,
  Wallet,
  Ticket,
  TrendingUp,
  Gift,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAffiliateCommissions, useAffiliatePayouts } from "@/hooks/useAffiliate";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Notification {
  id: string;
  type: "commission" | "payout" | "voucher" | "tier";
  title: string;
  description: string;
  amount?: number;
  timestamp: Date;
  read: boolean;
  icon: typeof Wallet;
  color: string;
}

interface AffiliateNotificationsProps {
  affiliateId?: string;
}

export function AffiliateNotifications({ affiliateId }: AffiliateNotificationsProps) {
  const { t } = useTranslation();
  const { data: commissions } = useAffiliateCommissions(affiliateId);
  const { data: payouts } = useAffiliatePayouts(affiliateId);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  // Generate notifications from recent commissions and payouts
  const notifications: Notification[] = [];

  // Add recent commissions (last 7 days)
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 7);

  commissions?.filter((c: any) => new Date(c.created_at) > recentDate).forEach((c: any) => {
    notifications.push({
      id: `commission-${c.id}`,
      type: "commission",
      title: t("affiliate.notifications.newCommission", "Neue Provision"),
      description: `€${Number(c.commission_amount).toFixed(2)} ${t("affiliate.notifications.earned", "verdient")}`,
      amount: Number(c.commission_amount),
      timestamp: new Date(c.created_at),
      read: readNotifications.has(`commission-${c.id}`),
      icon: Wallet,
      color: "from-primary to-pink-500",
    });
  });

  // Add recent payouts
  payouts?.filter((p: any) => new Date(p.created_at) > recentDate).forEach((p: any) => {
    const statusText = {
      pending: t("affiliate.notifications.payoutPending", "Auszahlung beantragt"),
      processing: t("affiliate.notifications.payoutProcessing", "Auszahlung in Bearbeitung"),
      completed: t("affiliate.notifications.payoutCompleted", "Auszahlung abgeschlossen"),
      failed: t("affiliate.notifications.payoutFailed", "Auszahlung fehlgeschlagen"),
    }[p.status] || p.status;

    notifications.push({
      id: `payout-${p.id}`,
      type: "payout",
      title: statusText,
      description: `€${Number(p.amount).toFixed(2)}`,
      amount: Number(p.amount),
      timestamp: new Date(p.created_at),
      read: readNotifications.has(`payout-${p.id}`),
      icon: p.status === "completed" ? CheckCircle : Clock,
      color: p.status === "completed" ? "from-success to-emerald-400" : "from-accent to-cyan-400",
    });
  });

  // Sort by timestamp descending
  notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setReadNotifications((prev) => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadNotifications(allIds);
  };

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true, locale: de });
    }
    if (isYesterday(date)) {
      return t("affiliate.notifications.yesterday", "Gestern") + " " + format(date, "HH:mm", { locale: de });
    }
    return format(date, "dd.MM. HH:mm", { locale: de });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">{t("affiliate.notifications.title", "Benachrichtigungen")}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1" />
              {t("affiliate.notifications.markAllRead", "Alle lesen")}
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t("affiliate.notifications.noNotifications", "Keine neuen Benachrichtigungen")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.slice(0, 10).map((notification, index) => {
                const Icon = notification.icon;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${notification.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {notifications.length > 10 && (
          <div className="p-3 border-t border-border text-center">
            <Button variant="ghost" size="sm" className="text-primary">
              {t("affiliate.notifications.viewAll", "Alle anzeigen")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
