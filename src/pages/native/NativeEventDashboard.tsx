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
import NativeResponsesTab from "@/components/native/NativeResponsesTab";
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
  Loader2,
  AlertCircle,
  Activity,
  ShoppingBag,
  Package,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { useEvent, type EventData, type Participant } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { AIAssistantTab } from "@/components/dashboard/AIAssistantTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { FormBuilderTab } from "@/components/dashboard/FormBuilderTab";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  useEventBookings,
  useCancelBooking,
  type MarketplaceBooking,
} from "@/hooks/useMarketplaceBookings";

const EVENT_TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  bachelor:    { emoji: "\uD83C\uDF89", label: "Junggesellenabschied", color: "from-violet-500 to-purple-600" },
  bachelorette:{ emoji: "\uD83D\uDC51", label: "Junggesellinnenabschied", color: "from-pink-500 to-rose-600" },
  birthday:    { emoji: "\uD83C\uDF82", label: "Geburtstag", color: "from-amber-500 to-orange-600" },
  wedding:     { emoji: "\uD83D\uDC8D", label: "Hochzeit", color: "from-cyan-500 to-blue-600" },
  other:       { emoji: "\uD83C\uDF1F", label: "Event", color: "from-teal-500 to-emerald-600" },
};

interface ActivityEntry {
  id: string;
  text: string;
  icon: typeof Check;
  time: string;
  color: string;
}

const ACTION_META: Record<string, { icon: typeof Check; color: string; label: (data?: Record<string, unknown>) => string }> = {
  rsvp_confirmed:    { icon: Check,       color: "text-emerald-400", label: (d) => `${d?.name || "Gast"} hat zugesagt` },
  rsvp_declined:     { icon: AlertCircle, color: "text-red-400",     label: (d) => `${d?.name || "Gast"} hat abgesagt` },
  survey_response:   { icon: Vote,        color: "text-violet-400",  label: (d) => `${d?.name || "Gast"} hat abgestimmt` },
  expense_created:   { icon: Receipt,     color: "text-amber-400",   label: (d) => `Ausgabe: ${d?.title || "Neue Ausgabe"}` },
  budget_updated:    { icon: TrendingUp,  color: "text-cyan-400",    label: () => "Budget aktualisiert" },
  guest_invited:     { icon: UserPlus,    color: "text-blue-400",    label: (d) => `${d?.name || "Gast"} eingeladen` },
  schedule_updated:  { icon: Calendar,    color: "text-orange-400",  label: () => "Zeitplan aktualisiert" },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function useEventActivities(eventId: string | undefined): ActivityEntry[] {
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
        const meta = ACTION_META[row.action_type] || {
          icon: Activity,
          color: "text-muted-foreground",
          label: () => row.action_type.replace(/_/g, " "),
        };
        const actionData = (row.action_data ?? {}) as Record<string, unknown>;
        return {
          id: row.id,
          text: meta.label(actionData),
          icon: meta.icon,
          time: formatRelativeTime(row.created_at),
          color: meta.color,
        };
      });

      setActivities(mapped);
    };

    fetchActivities();
  }, [eventId]);

  return activities;
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

type TabId = "uebersicht" | "gaeste" | "zeitplan" | "ausgaben" | "dienstleister" | "formular" | "antworten" | "ki" | "einstellungen";

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof LayoutDashboard;
}

const TABS: TabDef[] = [
  { id: "uebersicht",    label: "Übersicht",    icon: LayoutDashboard },
  { id: "gaeste",        label: "Gäste",         icon: Users },
  { id: "zeitplan",      label: "Zeitplan",       icon: Calendar },
  { id: "ausgaben",      label: "Ausgaben",       icon: Wallet },
  { id: "dienstleister", label: "Services",       icon: ShoppingBag },
  { id: "formular",     label: "Formular",       icon: FileEdit },
  { id: "antworten",    label: "Antworten",      icon: ClipboardCheck },
  { id: "ki",            label: "KI",             icon: Sparkles },
  { id: "einstellungen", label: "Einstellungen",  icon: Settings },
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
    { label: "Gäste einladen",    icon: UserPlus, gradient: "from-violet-500 to-purple-600", tab: "gaeste" as TabId },
    { label: "Aktivität planen",  icon: Calendar, gradient: "from-cyan-500 to-blue-600",     tab: "zeitplan" as TabId },
    { label: "Ausgabe erfassen",   icon: Receipt,  gradient: "from-emerald-500 to-green-600",  tab: "ausgaben" as TabId },
    { label: "KI-Assistent",       icon: Sparkles, gradient: "from-amber-500 to-orange-600",   tab: "ki" as TabId },
  ], []);

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
              <p className="text-sm text-muted-foreground">Ehrengast: {event.honoree_name}</p>
            </div>
            <span className="text-2xl">{typeMeta.emoji}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {event.event_date ? formatDate(event.event_date) : "Kein Datum"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs">{typeMeta.emoji}</span>
              {typeMeta.label}
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
          <p className="text-[10px] text-muted-foreground leading-tight">Teilnehmer</p>
        </div>

        {/* Zusagen */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">{yesCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Zusagen</p>
        </div>

        {/* Budget */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">{maybeCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Vielleicht</p>
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
            {days === 0 ? "Heute!" : days === 1 ? "Morgen!" : `In ${days} Tagen`}
          </p>
          <p className="text-sm text-muted-foreground">
            {yesCount} von {participantCount} haben zugesagt
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
          Letzte Aktivitäten
        </h3>
        <div className="space-y-2">
          {activities.length === 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">Noch keine Aktivitäten</p>
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
/*  Services Tab (inline)                                              */
/* ------------------------------------------------------------------ */

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-foreground/10 text-muted-foreground border-border",
  cancelled_by_customer: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled_by_agency: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Ausstehend",
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
  cancelled_by_customer: "Storniert",
  cancelled_by_agency: "Storniert",
};

function NativeServicesTab({ eventId, eventSlug }: { eventId: string; eventSlug: string }) {
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
            <p className="text-sm font-semibold text-white">Marketplace öffnen</p>
            <p className="text-xs text-white/70">Services für dein Event entdecken & buchen</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60" />
        </motion.button>
      </motion.div>

      {/* Booked Services */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Gebuchte Dienstleistungen
        </h3>

        {isLoading ? (
          <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : bookingList.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-6 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Noch keine Dienstleistungen gebucht</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookingList.map((booking) => {
              const statusColor = STATUS_BADGE_COLORS[booking.status] || STATUS_BADGE_COLORS.completed;
              const statusLabel = STATUS_LABELS[booking.status] || booking.status;
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
                        Details
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
                        Stornieren
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
  const haptics = useHaptics();
  const [activeTab, setActiveTab] = useState<TabId>("uebersicht");
  const { event, participants, responseCount, isLoading, refetch } = useEvent(slug);
  const activities = useEventActivities(event?.id);

  // Build stats from responses — for now pass null, AI will work with basic context
  const stats = null;

  const daysUntilEvent = event?.event_date
    ? Math.max(0, Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86400000))
    : 0;

  const statusBadge = useMemo(() => {
    switch (event?.status) {
      case "active":   return { label: "Aktiv",   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "planning": return { label: "Planung", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      default:         return { label: "Entwurf", color: "bg-foreground/10 text-muted-foreground border-border" };
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
        <p className="text-sm text-muted-foreground">Dashboard wird geladen...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center bg-background safe-top px-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-lg font-display font-bold text-foreground mb-1">Event nicht gefunden</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Das Event konnte nicht geladen werden.</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="px-5 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium"
        >
          Zurück
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
          {daysUntilEvent === 0 ? "Heute" : daysUntilEvent === 1 ? "Morgen" : `In ${daysUntilEvent} Tagen`}
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
                  {tab.label}
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
