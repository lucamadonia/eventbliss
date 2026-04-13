/**
 * NativeResponsesTab — Epic responses/answers tab for the Event Dashboard.
 * Glassmorphism cards, animated stats, category grouping,
 * visual bar charts, participant filtering, pull-to-refresh.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  BarChart3,
  CheckCircle,
  HelpCircle,
  XCircle,
  Users,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Inbox,
  TrendingUp,
  MapPin,
  Dumbbell,
  Wine,
  Car,
  CalendarDays,
  DollarSign,
  Heart,
  MessageSquare,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem, liquidTap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NativeResponsesTabProps {
  eventId: string;
  participantCount: number;
}

interface ResponseRow {
  id: string;
  participant: string;
  attendance: string;
  budget: string;
  destination: string;
  duration_pref: string;
  travel_pref: string;
  fitness_level: string;
  alcohol: string | null;
  restrictions: string | null;
  suggestions: string | null;
  partial_days: string | null;
  preferences: string[];
  date_blocks: string[];
  de_city: string | null;
  created_at: string;
  updated_at: string;
}

type AttendanceFilter = "alle" | "yes" | "maybe" | "no";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Count occurrences of each value in an array */
function countValues(arr: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  arr.forEach((v) => {
    const key = v.trim();
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

const ATTENDANCE_CONFIG = {
  yes: {
    icon: CheckCircle,
    label: "Zusage",
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    gradient: "from-emerald-500 to-teal-600",
  },
  maybe: {
    icon: HelpCircle,
    label: "Vielleicht",
    dot: "bg-amber-500",
    text: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    gradient: "from-amber-500 to-orange-600",
  },
  no: {
    icon: XCircle,
    label: "Absage",
    dot: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    gradient: "from-red-500 to-rose-600",
  },
} as const;

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-indigo-500 to-violet-600",
  "from-fuchsia-500 to-pink-600",
  "from-sky-500 to-cyan-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Category analysis config                                           */
/* ------------------------------------------------------------------ */

interface CategoryDef {
  key: keyof ResponseRow;
  label: string;
  icon: typeof MapPin;
  gradient: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: "attendance",    label: "Teilnahme",       icon: CheckCircle,  gradient: "from-emerald-500 to-teal-600" },
  { key: "budget",        label: "Budget",          icon: DollarSign,   gradient: "from-amber-500 to-orange-600" },
  { key: "destination",   label: "Reiseziel",       icon: MapPin,       gradient: "from-cyan-500 to-blue-600" },
  { key: "duration_pref", label: "Dauer",           icon: CalendarDays, gradient: "from-violet-500 to-purple-600" },
  { key: "travel_pref",   label: "Anreise",         icon: Car,          gradient: "from-pink-500 to-rose-600" },
  { key: "fitness_level", label: "Fitness",         icon: Dumbbell,     gradient: "from-indigo-500 to-violet-600" },
  { key: "alcohol",       label: "Alkohol",         icon: Wine,         gradient: "from-fuchsia-500 to-pink-600" },
];

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({ value, duration: dur = 1.2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctrl = animate(prevValue.current, value, {
      duration: dur,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v).toString();
      },
    });
    prevValue.current = value;
    return () => ctrl.stop();
  }, [value, dur]);

  return <span ref={ref}>0</span>;
}

/* ------------------------------------------------------------------ */
/*  Horizontal Bar Chart                                               */
/* ------------------------------------------------------------------ */

function BarChart({
  data,
  maxValue,
  gradient,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  gradient: string;
}) {
  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/80 truncate max-w-[70%]">{item.label}</span>
            <span className="text-muted-foreground font-medium tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-foreground/5 overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
              initial={{ width: 0 }}
              animate={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              transition={{ ...spring.soft, delay: i * 0.06 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loader                                                    */
/* ------------------------------------------------------------------ */

function ResponsesSkeleton() {
  return (
    <motion.div
      className="space-y-4"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Stats skeleton */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border p-4 space-y-2"
          >
            <div className="h-4 w-10 rounded bg-foreground/10 animate-pulse" />
            <div className="h-7 w-14 rounded bg-foreground/10 animate-pulse" />
            <div className="h-3 w-16 rounded bg-foreground/10 animate-pulse" />
          </div>
        ))}
      </motion.div>

      {/* Chart skeleton */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border p-5 space-y-3"
      >
        <div className="h-5 w-32 rounded bg-foreground/10 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-foreground/10 animate-pulse" />
            <div className="h-2 w-full rounded-full bg-foreground/5">
              <div
                className="h-full rounded-full bg-foreground/10 animate-pulse"
                style={{ width: `${70 - i * 15}%` }}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Cards skeleton */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          variants={staggerItem}
          className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-foreground/10 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-foreground/10 animate-pulse" />
            <div className="h-3 w-40 rounded bg-foreground/10 animate-pulse" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring.soft}
    >
      <motion.div
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-6"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 3, -3, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Inbox className="w-9 h-9 text-violet-400" />
      </motion.div>
      <h3 className="text-lg font-display font-bold text-foreground mb-2">
        Noch keine Antworten
      </h3>
      <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
        Sobald Teilnehmer das Formular ausfuellen, erscheinen ihre Antworten hier.
      </p>

      {/* Animated dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Response Card (individual participant)                             */
/* ------------------------------------------------------------------ */

function ResponseCard({
  response,
  index,
}: {
  response: ResponseRow;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const haptics = useHaptics();
  const att = ATTENDANCE_CONFIG[response.attendance as keyof typeof ATTENDANCE_CONFIG];
  const AttIcon = att?.icon || HelpCircle;

  return (
    <motion.div
      variants={staggerItem}
      layout
      className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border overflow-hidden"
    >
      {/* Main row */}
      <motion.button
        className="w-full p-4 flex items-center gap-3 text-left"
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          haptics.light();
          setExpanded(!expanded);
        }}
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg",
            getAvatarColor(response.participant),
          )}
        >
          <span className="text-xs font-bold text-white">
            {getInitials(response.participant)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-display font-semibold text-foreground truncate">
              {response.participant}
            </p>
            {att && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  att.bg,
                  att.text,
                  att.border,
                )}
              >
                <AttIcon className="w-2.5 h-2.5" />
                {att.label}
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {timeAgo(response.created_at)}
            {response.de_city && ` \u00b7 ${response.de_city}`}
          </p>
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={spring.snappy}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.snappy}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
              {/* Grid of answers */}
              <div className="grid grid-cols-2 gap-2.5">
                <DetailPill label="Budget" value={response.budget} icon={DollarSign} />
                <DetailPill label="Reiseziel" value={response.destination} icon={MapPin} />
                <DetailPill label="Dauer" value={response.duration_pref} icon={CalendarDays} />
                <DetailPill label="Anreise" value={response.travel_pref} icon={Car} />
                <DetailPill label="Fitness" value={response.fitness_level} icon={Dumbbell} />
                <DetailPill label="Alkohol" value={response.alcohol || "k.A."} icon={Wine} />
              </div>

              {/* Preferences tags */}
              {response.preferences && response.preferences.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Praeferenzen
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {response.preferences.map((pref, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Restrictions */}
              {response.restrictions && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Einschraenkungen
                  </p>
                  <p className="text-xs text-foreground/80 bg-foreground/5 rounded-xl px-3 py-2">
                    {response.restrictions}
                  </p>
                </div>
              )}

              {/* Suggestions */}
              {response.suggestions && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Vorschlaege
                  </p>
                  <p className="text-xs text-foreground/80 bg-foreground/5 rounded-xl px-3 py-2 italic">
                    &ldquo;{response.suggestions}&rdquo;
                  </p>
                </div>
              )}

              {/* Date blocks */}
              {response.date_blocks && response.date_blocks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Verfuegbare Termine
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {response.date_blocks.map((d, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof MapPin;
}) {
  return (
    <div className="rounded-xl bg-foreground/5 px-3 py-2 space-y-0.5">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </p>
      <p className="text-xs font-medium text-foreground truncate">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category Analysis Card                                             */
/* ------------------------------------------------------------------ */

function CategoryCard({
  category,
  responses,
}: {
  category: CategoryDef;
  responses: ResponseRow[];
}) {
  const [open, setOpen] = useState(false);
  const haptics = useHaptics();
  const Icon = category.icon;

  const values = responses
    .map((r) => {
      const val = r[category.key];
      return typeof val === "string" ? val : null;
    })
    .filter(Boolean) as string[];

  const counts = countValues(values);
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const maxVal = sorted.length > 0 ? sorted[0].value : 0;
  const topAnswer = sorted.length > 0 ? sorted[0].label : "---";

  if (sorted.length === 0) return null;

  return (
    <motion.div
      layout
      className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border overflow-hidden"
    >
      <motion.button
        className="w-full p-4 flex items-center gap-3 text-left"
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          haptics.light();
          setOpen(!open);
        }}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
            category.gradient,
          )}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground">
            {category.label}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Top: {topAnswer}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {sorted.length} {sorted.length === 1 ? "Option" : "Optionen"}
          </span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={spring.snappy}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.snappy}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/50">
              <BarChart data={sorted} maxValue={maxVal} gradient={category.gradient} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Preferences Aggregate                                              */
/* ------------------------------------------------------------------ */

function PreferencesChart({ responses }: { responses: ResponseRow[] }) {
  const [open, setOpen] = useState(false);
  const haptics = useHaptics();

  const allPrefs = responses.flatMap((r) => r.preferences || []);
  const counts = countValues(allPrefs);
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  if (sorted.length === 0) return null;

  const maxVal = sorted[0].value;

  return (
    <motion.div
      layout
      className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border overflow-hidden"
    >
      <motion.button
        className="w-full p-4 flex items-center gap-3 text-left"
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          haptics.light();
          setOpen(!open);
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground">
            Aktivitaeten & Praeferenzen
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Top: {sorted[0]?.label || "---"}
          </p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring.snappy}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.snappy}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/50">
              <BarChart
                data={sorted.slice(0, 10)}
                maxValue={maxVal}
                gradient="from-rose-500 to-pink-600"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function NativeResponsesTab({
  eventId,
  participantCount,
}: NativeResponsesTabProps) {
  const haptics = useHaptics();
  const [filter, setFilter] = useState<AttendanceFilter>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  /* ---- Data fetching ---- */
  const {
    data: responses = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["native-responses", eventId],
    queryFn: async (): Promise<ResponseRow[]> => {
      const { data, error } = await supabase
        .from("responses")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ResponseRow[];
    },
    enabled: !!eventId,
  });

  /* ---- Derived stats ---- */
  const stats = useMemo(() => {
    const total = responses.length;
    const rate =
      participantCount > 0
        ? Math.round((total / participantCount) * 100)
        : 0;
    const latest = responses.length > 0 ? responses[0].created_at : null;

    const attendanceCounts = {
      yes: responses.filter((r) => r.attendance === "yes").length,
      maybe: responses.filter((r) => r.attendance === "maybe").length,
      no: responses.filter((r) => r.attendance === "no").length,
    };

    return { total, rate, latest, attendanceCounts };
  }, [responses, participantCount]);

  /* ---- Filtered responses ---- */
  const filtered = useMemo(() => {
    let result = responses;

    if (filter !== "alle") {
      result = result.filter((r) => r.attendance === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.participant.toLowerCase().includes(q) ||
          (r.de_city && r.de_city.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [responses, filter, searchQuery]);

  /* ---- Pull to refresh ---- */
  const handleRefresh = useCallback(() => {
    haptics.medium();
    refetch();
  }, [haptics, refetch]);

  /* ---- Loading ---- */
  if (isLoading) {
    return <ResponsesSkeleton />;
  }

  /* ---- Empty ---- */
  if (responses.length === 0) {
    return <EmptyState />;
  }

  return (
    <motion.div
      className="space-y-4"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Refresh button */}
      <motion.div variants={staggerItem} className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          transition={spring.snappy}
          onClick={handleRefresh}
          disabled={isRefetching}
          className="w-8 h-8 rounded-xl bg-foreground/5 border border-border flex items-center justify-center"
        >
          {isRefetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </motion.button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-2.5">
        {/* Total responses */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">
            <AnimatedCounter value={stats.total} />
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Antworten
          </p>
        </div>

        {/* Response rate */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">
            <AnimatedCounter value={stats.rate} />
            <span className="text-xs text-muted-foreground">%</span>
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Ruecklaufquote
          </p>
        </div>

        {/* Latest */}
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs font-display font-bold text-foreground leading-tight mt-1">
            {stats.latest ? timeAgo(stats.latest) : "---"}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Letzte Antwort
          </p>
        </div>
      </motion.div>

      {/* Attendance Breakdown */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-4 space-y-3"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Teilnahme-Uebersicht
        </p>
        <div className="flex gap-2">
          {(Object.entries(ATTENDANCE_CONFIG) as [keyof typeof ATTENDANCE_CONFIG, typeof ATTENDANCE_CONFIG["yes"]][]).map(
            ([key, cfg]) => {
              const count = stats.attendanceCounts[key];
              const pct =
                stats.total > 0
                  ? Math.round((count / stats.total) * 100)
                  : 0;
              const Icon = cfg.icon;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex-1 rounded-xl border p-3 text-center space-y-1",
                    cfg.bg,
                    cfg.border,
                  )}
                >
                  <Icon className={cn("w-4 h-4 mx-auto", cfg.text)} />
                  <p className={cn("text-lg font-display font-bold", cfg.text)}>
                    {count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {pct}% {cfg.label}
                  </p>
                </div>
              );
            },
          )}
        </div>

        {/* Combined progress bar */}
        <div className="h-2.5 w-full rounded-full bg-foreground/5 overflow-hidden flex">
          {stats.attendanceCounts.yes > 0 && (
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              initial={{ width: 0 }}
              animate={{
                width: `${(stats.attendanceCounts.yes / stats.total) * 100}%`,
              }}
              transition={spring.soft}
            />
          )}
          {stats.attendanceCounts.maybe > 0 && (
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{
                width: `${(stats.attendanceCounts.maybe / stats.total) * 100}%`,
              }}
              transition={{ ...spring.soft, delay: 0.1 }}
            />
          )}
          {stats.attendanceCounts.no > 0 && (
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-rose-500"
              initial={{ width: 0 }}
              animate={{
                width: `${(stats.attendanceCounts.no / stats.total) * 100}%`,
              }}
              transition={{ ...spring.soft, delay: 0.2 }}
            />
          )}
        </div>
      </motion.div>

      {/* Category Analysis Section */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Auswertung nach Kategorie
        </h3>

        <div className="space-y-2.5">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.key} category={cat} responses={responses} />
          ))}
          <PreferencesChart responses={responses} />
        </div>
      </motion.div>

      {/* Individual Responses Section */}
      <motion.div variants={staggerItem} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Einzelne Antworten ({filtered.length})
          </h3>

          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                haptics.light();
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery("");
              }}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center border transition-colors",
                showSearch
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-400"
                  : "bg-foreground/5 border-border text-muted-foreground",
              )}
            >
              {showSearch ? (
                <X className="w-3.5 h-3.5" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring.snappy}
              className="overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Teilnehmer suchen..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-foreground/5 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "alle", label: "Alle" },
              { id: "yes", label: "Zusagen" },
              { id: "maybe", label: "Vielleicht" },
              { id: "no", label: "Absagen" },
            ] as { id: AttendanceFilter; label: string }[]
          ).map((f) => {
            const active = filter === f.id;
            return (
              <motion.button
                key={f.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  haptics.select();
                  setFilter(f.id);
                }}
                className={cn(
                  "relative flex-shrink-0 px-4 h-8 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "text-white border-transparent"
                    : "bg-foreground/5 text-muted-foreground border-border",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="response-filter-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                    transition={spring.snappy}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Response cards */}
        <motion.div
          className="space-y-2.5"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Keine Antworten fuer diesen Filter
              </p>
            </div>
          ) : (
            filtered.map((response, i) => (
              <ResponseCard key={response.id} response={response} index={i} />
            ))
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
