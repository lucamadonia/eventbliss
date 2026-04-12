/**
 * NativeEventDashboard — full native event dashboard shell + Overview screen.
 * Replaces the desktop EventDashboard for native mobile.
 * Route: /e/:slug/dashboard
 *
 * Design: glassmorphism cards, spring animations, haptics,
 * horizontal pill tab navigation with layoutId morphing.
 */
import { useState, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NativeEventGuests from "./NativeEventGuests";
import NativeEventSchedule from "./NativeEventSchedule";
import NativeEventExpenses from "./NativeEventExpenses";
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
  MessageCircle,
  TrendingUp,
  Vote,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Mock data — will be replaced with real hooks later                 */
/* ------------------------------------------------------------------ */

const MOCK_EVENT = {
  name: "Luca's JGA",
  honoree: "Luca",
  date: "2026-05-15",
  type: "bachelor",
  status: "active" as const,
  participantCount: 12,
  yesCount: 8,
  maybeCount: 3,
  noCount: 1,
  avgBudget: "150-250",
};

const EVENT_TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  bachelor:    { emoji: "\uD83C\uDF89", label: "Junggesellenabschied", color: "from-violet-500 to-purple-600" },
  bachelorette:{ emoji: "\uD83D\uDC51", label: "Junggesellinnenabschied", color: "from-pink-500 to-rose-600" },
  birthday:    { emoji: "\uD83C\uDF82", label: "Geburtstag", color: "from-amber-500 to-orange-600" },
  wedding:     { emoji: "\uD83D\uDC8D", label: "Hochzeit", color: "from-cyan-500 to-blue-600" },
  other:       { emoji: "\uD83C\uDF1F", label: "Event", color: "from-teal-500 to-emerald-600" },
};

const MOCK_ACTIVITIES = [
  { id: "1", text: "Sarah hat zugesagt", icon: Check, time: "vor 2 Std.", color: "text-emerald-400" },
  { id: "2", text: "Max hat abgestimmt", icon: Vote, time: "vor 5 Std.", color: "text-violet-400" },
  { id: "3", text: "Budget aktualisiert", icon: TrendingUp, time: "gestern", color: "text-cyan-400" },
];

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

type TabId = "uebersicht" | "gaeste" | "zeitplan" | "ausgaben" | "ki" | "einstellungen";

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof LayoutDashboard;
}

const TABS: TabDef[] = [
  { id: "uebersicht",    label: "Uebersicht",    icon: LayoutDashboard },
  { id: "gaeste",        label: "Gaeste",         icon: Users },
  { id: "zeitplan",      label: "Zeitplan",       icon: Calendar },
  { id: "ausgaben",      label: "Ausgaben",       icon: Wallet },
  { id: "ki",            label: "KI",             icon: Sparkles },
  { id: "einstellungen", label: "Einstellungen",  icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

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

function OverviewTab({ event, onSwitchTab }: { event: typeof MOCK_EVENT; onSwitchTab: (tab: TabId) => void }) {
  const haptics = useHaptics();
  const days = daysUntil(event.date);
  const typeMeta = EVENT_TYPE_META[event.type] || EVENT_TYPE_META.other;
  const totalResponses = event.yesCount + event.maybeCount + event.noCount;
  const responseProgress = totalResponses / event.participantCount;

  const quickActions = useMemo(() => [
    { label: "Gaeste einladen",    icon: UserPlus, gradient: "from-violet-500 to-purple-600", tab: "gaeste" as TabId },
    { label: "Aktivitaet planen",  icon: Calendar, gradient: "from-cyan-500 to-blue-600",     tab: "zeitplan" as TabId },
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
              <p className="text-sm text-muted-foreground">Ehrengast: {event.honoree}</p>
            </div>
            <span className="text-2xl">{typeMeta.emoji}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(event.date)}
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
          <p className="text-lg font-display font-bold text-foreground">{event.participantCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Teilnehmer</p>
        </div>

        {/* Zusagen */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">{event.yesCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Zusagen</p>
        </div>

        {/* Budget */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">{event.avgBudget}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Budget</p>
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
            {event.yesCount} von {event.participantCount} haben zugesagt
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
          Letzte Aktivitaeten
        </h3>
        <div className="space-y-2">
          {MOCK_ACTIVITIES.map((activity) => {
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
/*  Placeholder tab content                                            */
/* ------------------------------------------------------------------ */

function PlaceholderTab({ label, icon: Icon }: { label: string; icon: typeof LayoutDashboard }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
        <Icon className="w-7 h-7 text-violet-400" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-display font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">Kommt bald</p>
      </div>
    </div>
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

  // Mock data — will be replaced by useEvent(slug) later
  const event = MOCK_EVENT;
  const days = daysUntil(event.date);

  const statusBadge = useMemo(() => {
    switch (event.status) {
      case "active":   return { label: "Aktiv",   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "planning": return { label: "Planung", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      default:         return { label: "Entwurf", color: "bg-foreground/10 text-muted-foreground border-border" };
    }
  }, [event.status]);

  const switchTab = (tab: TabId) => {
    haptics.select();
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "uebersicht":
        return <OverviewTab event={event} onSwitchTab={switchTab} />;
      case "gaeste":
        return <NativeEventGuests eventSlug={slug} />;
      case "zeitplan":
        return <NativeEventSchedule eventSlug={slug} />;
      case "ausgaben":
        return <NativeEventExpenses eventSlug={slug} />;
      case "ki":
        return <PlaceholderTab label="KI-Assistent" icon={Sparkles} />;
      case "einstellungen":
        return <PlaceholderTab label="Einstellungen" icon={Settings} />;
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
              Ehrengast: {event.honoree}
            </p>
          </div>
        </div>
      </div>

      {/* Event Status Bar */}
      <div className="px-5 pb-3 flex items-center gap-2.5">
        {/* Countdown chip */}
        <div className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-foreground/5 border border-border text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {days === 0 ? "Heute" : days === 1 ? "Morgen" : `In ${days} Tagen`}
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
          {event.participantCount}
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
