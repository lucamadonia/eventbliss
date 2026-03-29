import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  DollarSign,
  Clock,
  Users,
  Building2,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "budget" | "deadline" | "team" | "vendor" | "registration" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  group: "today" | "yesterday" | "earlier";
  read: boolean;
}

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  budget: { icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/15" },
  deadline: { icon: Clock, color: "text-red-400", bg: "bg-red-500/15" },
  team: { icon: Users, color: "text-blue-400", bg: "bg-blue-500/15" },
  vendor: { icon: Building2, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  registration: { icon: UserPlus, color: "text-violet-400", bg: "bg-violet-500/15" },
  system: { icon: Bell, color: "text-slate-400", bg: "bg-slate-500/15" },
};

const groupLabels: Record<string, string> = {
  today: "Heute",
  yesterday: "Gestern",
  earlier: "Frueher",
};

const mockNotifications: Notification[] = [
  { id: "1", type: "deadline", title: "Deadline morgen", description: "Catering fuer Hochzeit Mueller bestaetigen", time: "vor 10 Min.", group: "today", read: false },
  { id: "2", type: "budget", title: "Budget-Warnung", description: "Firmenfeier SAP hat 85% des Budgets erreicht", time: "vor 1 Std.", group: "today", read: false },
  { id: "3", type: "registration", title: "Neue Anmeldung", description: "3 neue Gaeste fuer Konferenz 2026 registriert", time: "vor 2 Std.", group: "today", read: false },
  { id: "4", type: "vendor", title: "Vendor-Antwort", description: "Fotograf Schulz hat Angebot bestaetigt", time: "vor 5 Std.", group: "yesterday", read: true },
  { id: "5", type: "team", title: "Team-Update", description: "Anna S. wurde dem JGA Hamburg zugewiesen", time: "vor 1 Tag", group: "yesterday", read: true },
  { id: "6", type: "system", title: "System-Update", description: "Neue Berichtsfunktionen verfuegbar", time: "vor 3 Tagen", group: "earlier", read: true },
];

export function AgencyNotifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

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
              <h3 className="text-sm font-semibold text-slate-50">Benachrichtigungen</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
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
                  const groupItems = notifications.filter((n) => n.group === group);
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={group}>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 pt-3 pb-1">
                        {groupLabels[group]}
                      </p>
                      {groupItems.map((item, i) => {
                        const config = typeConfig[item.type];
                        const Icon = config.icon;
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group"
                          >
                            <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", config.bg)}>
                              <Icon className={cn("w-4 h-4", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-100 truncate">
                                  {item.title}
                                </p>
                                {!item.read && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-1">{item.time}</p>
                            </div>
                            <button
                              onClick={() => dismiss(item.id)}
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
