/**
 * NativeEventDashboard — full native event dashboard shell + Overview screen.
 * Replaces the desktop EventDashboard for native mobile.
 * Route: /e/:slug/dashboard
 *
 * Design: glassmorphism cards, spring animations, haptics,
 * horizontal pill tab navigation with layoutId morphing.
 */
import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NativeEventGuests from "./NativeEventGuests";
import NativeEventSchedule from "./NativeEventSchedule";
import NativeEventExpenses from "./NativeEventExpenses";
import NativeResponsesTab from "@/components/native/responses";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  Sparkles,
  Settings,
  Check,
  UserPlus,
  Receipt,
  Clock,
  TrendingUp,
  Vote,
  FileEdit,
  ClipboardCheck,
  Store,
  Loader2,
  AlertCircle,
  Activity,
  ShoppingBag,
  Package,
  ChevronRight,
  XCircle,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHaptics } from "@/hooks/useHaptics";
import { useEvent, type EventData, type Participant } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { AIAssistantTab } from "@/components/dashboard/AIAssistantTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { FormBuilderTab } from "@/components/dashboard/FormBuilderTab";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useMarketplaceServices } from "@/hooks/useMarketplaceServices";
import {
  useEventBookings,
  useCancelBooking,
  type MarketplaceBooking,
} from "@/hooks/useMarketplaceBookings";

const EVENT_TYPE_META: Record<string, { emoji: string; labelKey: string; color: string }> = {
  bachelor:    { emoji: "\uD83C\uDF89", labelKey: "nativeDashboard.eventTypes.bachelor", color: "from-violet-500 to-purple-600" },
  bachelorette:{ emoji: "\uD83D\uDC51", labelKey: "nativeDashboard.eventTypes.bachelorette", color: "from-pink-500 to-rose-600" },
  birthday:    { emoji: "\uD83C\uDF82", labelKey: "nativeDashboard.eventTypes.birthday", color: "from-amber-500 to-orange-600" },
  wedding:     { emoji: "\uD83D\uDC8D", labelKey: "nativeDashboard.eventTypes.wedding", color: "from-cyan-500 to-blue-600" },
  other:       { emoji: "\uD83C\uDF1F", labelKey: "nativeDashboard.eventTypes.other", color: "from-teal-500 to-emerald-600" },
};

interface ActivityEntry {
  id: string;
  text: string;
  icon: typeof Check;
  time: string;
  color: string;
}

const ACTION_META: Record<string, { icon: typeof Check; color: string; labelKey: string }> = {
  rsvp_confirmed:    { icon: Check,       color: "text-emerald-400", labelKey: "nativeDashboard.activity.rsvpConfirmed" },
  rsvp_declined:     { icon: AlertCircle, color: "text-red-400",     labelKey: "nativeDashboard.activity.rsvpDeclined" },
  survey_response:   { icon: Vote,        color: "text-violet-400",  labelKey: "nativeDashboard.activity.surveyResponse" },
  expense_created:   { icon: Receipt,     color: "text-amber-400",   labelKey: "nativeDashboard.activity.expenseCreated" },
  budget_updated:    { icon: TrendingUp,  color: "text-cyan-400",    labelKey: "nativeDashboard.activity.budgetUpdated" },
  guest_invited:     { icon: UserPlus,    color: "text-blue-400",    labelKey: "nativeDashboard.activity.guestInvited" },
  schedule_updated:  { icon: Calendar,    color: "text-orange-400",  labelKey: "nativeDashboard.activity.scheduleUpdated" },
};

function formatRelativeTime(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("nativeDashboard.timeAgo.justNow");
  if (mins < 60) return t("nativeDashboard.timeAgo.minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("nativeDashboard.timeAgo.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t("nativeDashboard.timeAgo.yesterday");
  if (days < 7) return t("nativeDashboard.timeAgo.daysAgo", { count: days });
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function useEventActivities(eventId: string | undefined, t: (key: string, opts?: Record<string, unknown>) => string): ActivityEntry[] {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (!eventId) return;

    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("id, action_type, action_data, created_at")
        .eq("user_id", eventId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !data) return;

      const mapped: ActivityEntry[] = data.map((row) => {
        const meta = ACTION_META[row.action_type];
        const actionData = (row.action_data ?? {}) as Record<string, unknown>;
        const text = meta
          ? t(meta.labelKey, { name: (actionData.name as string) || t("nativeDashboard.guest"), title: (actionData.title as string) || "" })
          : row.action_type.replace(/_/g, " ");
        return {
          id: row.id,
          text,
          icon: meta?.icon || Activity,
          time: formatRelativeTime(row.created_at, t),
          color: meta?.color || "text-muted-foreground",
        };
      });

      setActivities(mapped);
    };

    fetchActivities();
  }, [eventId, t]);

  return activities;
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

type TabId = "uebersicht" | "gaeste" | "zeitplan" | "ausgaben" | "marketplace" | "dienstleister" | "formular" | "antworten" | "ki" | "einstellungen";

interface TabDef {
  id: TabId;
  labelKey: string;
  icon: typeof LayoutDashboard;
}

const TABS: TabDef[] = [
  { id: "uebersicht",    labelKey: "nativeDashboard.tabs.overview",    icon: LayoutDashboard },
  { id: "gaeste",        labelKey: "nativeDashboard.tabs.guests",       icon: Users },
  { id: "zeitplan",      labelKey: "nativeDashboard.tabs.schedule",     icon: Calendar },
  { id: "ausgaben",      labelKey: "nativeDashboard.tabs.expenses",     icon: Wallet },
  { id: "marketplace",   labelKey: "nativeDashboard.tabs.marketplace",  icon: Store },
  { id: "dienstleister", labelKey: "nativeDashboard.tabs.services",     icon: ShoppingBag },
  { id: "formular",     labelKey: "nativeDashboard.tabs.form",         icon: FileEdit },
  { id: "antworten",    labelKey: "nativeDashboard.tabs.responses",    icon: ClipboardCheck },
  { id: "ki",            labelKey: "nativeDashboard.tabs.ai",           icon: Sparkles },
  { id: "einstellungen", labelKey: "nativeDashboard.tabs.settings",     icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Circular progress ring SVG */
function ProgressRing({ progress, size = 72, stroke = 5 }: { progress: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-foreground/10"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ring-gradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={spring.soft}
      />
      <defs>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab content: slide animation variants                              */
/* ------------------------------------------------------------------ */

const tabContentVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: spring.snappy },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.15 } },
};

/* ------------------------------------------------------------------ */
/*  Overview Tab (inline)                                              */
/* ------------------------------------------------------------------ */

function OverviewTab({ event, participants, activities, onSwitchTab }: { event: EventData; participants: Participant[]; activities: ActivityEntry[]; onSwitchTab: (tab: TabId) => void }) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const days = event.event_date
    ? Math.max(0, Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86400000))
    : 0;
  const typeMeta = EVENT_TYPE_META[event.event_type] || EVENT_TYPE_META.other;
  const yesCount = participants.filter(p => p.status === "confirmed").length;
  const maybeCount = participants.filter(p => p.status === "maybe").length;
  const participantCount = participants.length;
  const responseProgress = participantCount > 0 ? (yesCount + maybeCount) / participantCount : 0;

  const quickActions = useMemo(() => [
    { label: t("nativeDashboard.quickActions.inviteGuests"),    icon: UserPlus, gradient: "from-violet-500 to-purple-600", tab: "gaeste" as TabId },
    { label: t("nativeDashboard.quickActions.planActivity"),    icon: Calendar, gradient: "from-cyan-500 to-blue-600",     tab: "zeitplan" as TabId },
    { label: t("nativeDashboard.quickActions.addExpense"),      icon: Receipt,  gradient: "from-emerald-500 to-green-600",  tab: "ausgaben" as TabId },
    { label: t("nativeDashboard.quickActions.browseMarketplace"), icon: Store, gradient: "from-fuchsia-500 to-pink-600",  tab: "marketplace" as TabId },
  ], [t]);

  return (
    <motion.div
      className="space-y-4"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Event Card */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border"
      >
        {/* Gradient accent bar */}
        <div className={cn("h-1.5 w-full bg-gradient-to-r", typeMeta.color)} />

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-display font-bold text-foreground">{event.name}</h2>
              <p className="text-sm text-muted-foreground">{t("nativeDashboard.honoree")}: {event.honoree_name}</p>
            </div>
            <span className="text-2xl">{typeMeta.emoji}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {event.event_date ? formatDate(event.event_date) : t("nativeDashboard.noDate")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs">{typeMeta.emoji}</span>
              {t(typeMeta.labelKey)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-2.5">
        {/* Teilnehmer */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">{participantCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t("nativeDashboard.participants")}</p>
        </div>

        {/* Zusagen */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">{yesCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t("nativeDashboard.confirmed")}</p>
        </div>

        {/* Budget */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">{maybeCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t("nativeDashboard.maybe")}</p>
        </div>
      </motion.div>

      {/* Countdown Card */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-5 flex items-center gap-5"
      >
        <div className="relative flex-shrink-0">
          <ProgressRing progress={responseProgress} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-xl font-display font-bold text-foreground"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.bouncy}
            >
              {days}
            </motion.span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-base font-display font-semibold text-foreground">
            {days === 0 ? t("nativeDashboard.countdown.today") : days === 1 ? t("nativeDashboard.countdown.tomorrow") : t("nativeDashboard.countdown.inDays", { count: days })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("nativeDashboard.confirmedOf", { yes: yesCount, total: participantCount })}
          </p>
          <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${responseProgress * 100}%` }}
              transition={spring.soft}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid 2x2 */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-2.5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.96 }}
              transition={spring.snappy}
              onClick={() => {
                haptics.medium();
                onSwitchTab(action.tab);
              }}
              className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-4 flex flex-col items-center gap-2.5 text-center group"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                action.gradient,
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-medium text-foreground leading-tight">{action.label}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Activity Feed */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {t("nativeDashboard.recentActivity")}
        </h3>
        <div className="space-y-2">
          {activities.length === 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">{t("nativeDashboard.noActivity")}</p>
            </div>
          )}
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={activity.id}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3.5 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center flex-shrink-0">
                  <Icon className={cn("w-4 h-4", activity.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.text}</p>
                  <p className="text-[11px] text-muted-foreground">{activity.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Marketplace Embed Tab                                              */
/* ------------------------------------------------------------------ */

function NativeMarketplaceEmbed({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { key: "all", filter: "all" },
    { key: "workshop", filter: "workshop" },
    { key: "entertainment", filter: "entertainment" },
    { key: "catering", filter: "catering" },
    { key: "music", filter: "music" },
    { key: "photography", filter: "photography" },
    { key: "venue", filter: "venue" },
    { key: "wellness", filter: "wellness" },
  ];

  const filters = useMemo(() => ({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search.trim() || undefined,
  }), [activeCategory, search]);

  const { data, isLoading } = useMarketplaceServices(filters, 1, 20);
  const services = data?.services || [];

  return (
    <motion.div className="space-y-4" variants={stagger} initial="initial" animate="animate">
      {/* Hero CTA */}
      <motion.div variants={staggerItem}>
        <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-pink-600/5 border border-violet-500/20 p-5 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-display font-bold text-foreground">{t("nativeDashboard.tabs.marketplace")}</h3>
          <p className="text-xs text-muted-foreground">{t("nativeDashboard.services.openMarketplaceSub")}</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-foreground/[0.06] border border-border focus-within:border-primary/40 transition-colors">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("marketplace.searchPlaceholder")}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50 outline-none"
          />
        </div>
      </motion.div>

      {/* Category pills */}
      <motion.div variants={staggerItem} className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat.filter}
            onClick={() => { setActiveCategory(cat.filter); haptics.select(); }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
              activeCategory === cat.filter
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-foreground/[0.06] text-muted-foreground border-transparent",
            )}
          >
            {t(`marketplace.categories.${cat.key}`, cat.key)}
          </button>
        ))}
      </motion.div>

      {/* Service grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-foreground/[0.06] border border-border h-40 animate-pulse" />
          ))}
        </div>
      ) : services.length > 0 ? (
        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-2.5">
          {services.slice(0, 8).map((s) => (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptics.light(); navigate(`/marketplace/service/${s.slug}?event_id=${eventId}`); }}
              className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border overflow-hidden text-left"
            >
              <div className="h-20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 overflow-hidden">
                {s.cover_image_url && (
                  <img src={s.cover_image_url} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="p-2.5 space-y-1">
                <p className="text-xs font-semibold text-foreground line-clamp-1">{s.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{s.agency_name}</span>
                  <span className="text-xs font-bold text-foreground">{(s.price_cents / 100).toFixed(0)} €</span>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-2xl bg-foreground/[0.06] border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("marketplace.noResults")}</p>
        </div>
      )}

      {/* View all */}
      {services.length > 0 && (
        <motion.button
          variants={staggerItem}
          whileTap={{ scale: 0.97 }}
          onClick={() => { haptics.medium(); navigate(`/marketplace?event_id=${eventId}`); }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
        >
          <Store className="w-4 h-4" />
          {t("nativeDashboard.services.openMarketplace")}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Services Tab (inline)                                              */
/* ------------------------------------------------------------------ */

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-foreground/10 text-muted-foreground border-border",
  cancelled_by_customer: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled_by_agency: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending_payment: "nativeDashboard.services.statusPending",
  confirmed: "nativeDashboard.services.statusConfirmed",
  completed: "nativeDashboard.services.statusCompleted",
  cancelled_by_customer: "nativeDashboard.services.statusCancelled",
  cancelled_by_agency: "nativeDashboard.services.statusCancelled",
};

function NativeServicesTab({ eventId, eventSlug }: { eventId: string; eventSlug: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { data: bookings, isLoading } = useEventBookings(eventId);
  const cancelBooking = useCancelBooking();
  const bookingList = bookings || [];

  return (
    <motion.div
      className="space-y-4"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Open Marketplace CTA */}
      <motion.div variants={staggerItem}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={spring.snappy}
          onClick={() => {
            haptics.medium();
            navigate(`/marketplace?event_id=${eventId}`);
          }}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 p-4 flex items-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">{t("nativeDashboard.services.openMarketplace")}</p>
            <p className="text-xs text-white/70">{t("nativeDashboard.services.openMarketplaceSub")}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60" />
        </motion.button>
      </motion.div>

      {/* Booked Services */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {t("nativeDashboard.services.bookedServices")}
        </h3>

        {isLoading ? (
          <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : bookingList.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-6 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("nativeDashboard.services.noBookings")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookingList.map((booking) => {
              const statusColor = STATUS_BADGE_COLORS[booking.status] || STATUS_BADGE_COLORS.completed;
              const statusLabel = STATUS_LABEL_KEYS[booking.status] ? t(STATUS_LABEL_KEYS[booking.status]) : booking.status;
              const canCancel = booking.status === "pending_payment" || booking.status === "confirmed";

              return (
                <motion.div
                  key={booking.id}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {booking.service_title || "Service"}
                      </p>
                      {booking.agency_name && (
                        <p className="text-xs text-muted-foreground">von {booking.agency_name}</p>
                      )}
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0", statusColor)}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.booking_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {booking.booking_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {booking.participant_count}
                    </span>
                    <span className="font-medium text-foreground ml-auto">
                      {(booking.total_price_cents / 100).toFixed(2).replace(".", ",")} EUR
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {booking.service_slug && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          haptics.light();
                          navigate(`/marketplace/service/${booking.service_slug}`);
                        }}
                        className="flex-1 h-8 rounded-xl bg-foreground/10 text-xs font-medium text-foreground flex items-center justify-center"
                      >
                        {t("nativeDashboard.services.details")}
                      </motion.button>
                    )}
                    {canCancel && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          haptics.medium();
                          cancelBooking.mutate({ bookingId: booking.id, asAgency: false });
                        }}
                        disabled={cancelBooking.isPending}
                        className="h-8 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        {t("nativeDashboard.services.cancel")}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function NativeEventDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const [activeTab, setActiveTab] = useState<TabId>("uebersicht");
  const { event, participants, responseCount, isLoading, refetch } = useEvent(slug);
  const activities = useEventActivities(event?.id, t);

  // Build stats from responses — for now pass null, AI will work with basic context
  const stats = null;

  const daysUntilEvent = event?.event_date
    ? Math.max(0, Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86400000))
    : 0;

  const statusBadge = useMemo(() => {
    switch (event?.status) {
      case "active":   return { label: t("nativeDashboard.status.active"),   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "planning": return { label: t("nativeDashboard.status.planning"), color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      default:         return { label: t("nativeDashboard.status.draft"), color: "bg-foreground/10 text-muted-foreground border-border" };
    }
  }, [event?.status]);

  const switchTab = (tab: TabId) => {
    haptics.select();
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center bg-background safe-top">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-3" />
        <p className="text-sm text-muted-foreground">{t("nativeDashboard.loading")}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center bg-background safe-top px-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-lg font-display font-bold text-foreground mb-1">{t("nativeDashboard.notFound")}</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">{t("nativeDashboard.notFoundDesc")}</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="px-5 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium"
        >
          {t("nativeDashboard.back")}
        </motion.button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "uebersicht":
        return event ? <OverviewTab event={event} participants={participants} activities={activities} onSwitchTab={switchTab} /> : null;
      case "gaeste":
        return <NativeEventGuests eventSlug={slug!} participants={participants} accessCode={event?.access_code} onRefetch={refetch} />;
      case "zeitplan":
        return <NativeEventSchedule eventSlug={slug!} />;
      case "ausgaben":
        return <NativeEventExpenses eventSlug={slug!} />;
      case "marketplace":
        return event ? <NativeMarketplaceEmbed eventId={event.id} /> : null;
      case "dienstleister":
        return event ? <NativeServicesTab eventId={event.id} eventSlug={slug!} /> : null;
      case "formular":
        return event ? <FormBuilderTab event={event} onUpdate={refetch} /> : null;
      case "antworten":
        return event ? <NativeResponsesTab eventId={event.id} participantCount={participants.length} /> : null;
      case "ki":
        return event ? <AIAssistantTab event={event} stats={stats} /> : null;
      case "einstellungen":
        return event ? <SettingsTab event={event} participants={participants} onUpdate={refetch} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-background safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={spring.snappy}
            onClick={() => {
              haptics.light();
              navigate(-1);
            }}
            className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-display font-bold text-foreground truncate">
              {event.name}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Ehrengast: {event.honoree_name}
            </p>
          </div>
        </div>
      </div>

      {/* Event Status Bar */}
      <div className="px-5 pb-3 flex items-center gap-2.5">
        {/* Countdown chip */}
        <div className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-foreground/5 border border-border text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {daysUntilEvent === 0 ? t("nativeDashboard.countdown.today") : daysUntilEvent === 1 ? t("nativeDashboard.countdown.tomorrow") : t("nativeDashboard.countdown.inDays", { count: daysUntilEvent })}
        </div>

        {/* Status badge */}
        <div className={cn(
          "px-3 h-7 rounded-full border text-xs font-medium flex items-center",
          statusBadge.color,
        )}>
          {statusBadge.label}
        </div>

        {/* Participant count */}
        <div className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-foreground/5 border border-border text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          {participants.length}
        </div>
      </div>

      {/* Tab Navigation — horizontal scrollable pill tabs */}
      <div className="pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => switchTab(tab.id)}
                className={cn(
                  "relative flex-shrink-0 flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-medium border transition-colors",
                  active
                    ? "text-white border-transparent"
                    : "bg-foreground/5 text-muted-foreground border-border",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-dashboard-tab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                    transition={spring.snappy}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {t(tab.labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto native-scroll pb-tabbar">
        <div className="px-5 pt-1 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
