import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  DollarSign,
  Clock,
  Users,
  Building2,
  CheckSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAgencyNotifications,
  AgencyNotification,
} from "@/hooks/useAgencyNotifications";

type NotificationType = AgencyNotification["type"];

const typeConfig: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  deadline: { icon: Clock, color: "text-red-400", bg: "bg-red-500/15" },
  task: { icon: CheckSquare, color: "text-blue-400", bg: "bg-blue-500/15" },
  budget: { icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/15" },
  team: { icon: Users, color: "text-green-400", bg: "bg-green-500/15" },
  vendor: { icon: Building2, color: "text-purple-400", bg: "bg-purple-500/15" },
  system: { icon: Bell, color: "text-slate-400", bg: "bg-slate-500/15" },
};

function getGroup(dateStr: string): "today" | "yesterday" | "earlier" {
  const now = new Date();
  const date = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (date >= todayStart) return "today";
  if (date >= yesterdayStart) return "yesterday";
  return "earlier";
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? "en" : ""}`;
}

const groupLabels: Record<string, string> = {
  today: "Heute",
  yesterday: "Gestern",
  earlier: "Frueher",
};

export function AgencyNotifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useAgencyNotifications();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const groups = ["today", "yesterday", "earlier"] as const;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-[#1a1625]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-slate-50">
                Benachrichtigungen
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                >
                  Alle gelesen
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Keine Benachrichtigungen
                </p>
              ) : (
                groups.map((group) => {
                  const groupItems = notifications.filter(
                    (n) => getGroup(n.created_at) === group,
                  );
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={group}>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 pt-3 pb-1">
                        {groupLabels[group]}
                      </p>
                      {groupItems.map((item, i) => {
                        const config =
                          typeConfig[item.type] || typeConfig.system;
                        const Icon = config.icon;
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => {
                              if (!item.is_read) markAsRead(item.id);
                            }}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                          >
                            <div
                              className={cn(
                                "p-2 rounded-lg shrink-0 mt-0.5",
                                config.bg,
                              )}
                            >
                              <Icon
                                className={cn("w-4 h-4", config.color)}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-100 truncate">
                                  {item.title}
                                </p>
                                {!item.is_read && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-600 mt-1">
                                {formatRelativeTime(item.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(item.id);
                              }}
                              className="p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
