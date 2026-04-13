/**
 * NativeResponsesTab — orchestrator for the native responses/answers tab.
 * Stats, attendance breakdown, highlight sections, category analysis,
 * preferences, and individual response cards — all fully i18n.
 */
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, CheckCircle, TrendingUp, Clock, RefreshCw,
  Loader2, Search, X,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

import {
  type ResponseRow, type AttendanceFilter,
  ATTENDANCE_CONFIG, CATEGORIES, timeAgo,
} from "./responseHelpers";
import {
  AnimatedCounter, ResponsesSkeleton, EmptyState,
  ResponseCard, CategoryCard, PreferencesChart,
} from "./ResponseSubComponents";
import {
  SuggestionsSection, RestrictionsSection, PartialAvailabilitySection,
} from "./ResponseHighlightSections";

// ─── Props ───────────────────────────────────────────────────────

interface NativeResponsesTabProps {
  eventId: string;
  participantCount: number;
}

// ─── Filter config ───────────────────────────────────────────────

const FILTER_KEYS: { key: AttendanceFilter; i18nKey: string }[] = [
  { key: "alle", i18nKey: "filterAll" },
  { key: "yes", i18nKey: "filterYes" },
  { key: "maybe", i18nKey: "filterMaybe" },
  { key: "no", i18nKey: "filterNo" },
];

// ─── Main Component ──────────────────────────────────────────────

export default function NativeResponsesTab({ eventId, participantCount }: NativeResponsesTabProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const [filter, setFilter] = useState<AttendanceFilter>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Data fetching
  const { data: responses = [], isLoading, refetch, isRefetching } = useQuery({
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

  // Stats
  const stats = useMemo(() => {
    const total = responses.length;
    const rate = participantCount > 0 ? Math.round((total / participantCount) * 100) : 0;
    const latest = responses.length > 0 ? responses[0].created_at : null;
    const attendanceCounts = {
      yes: responses.filter((r) => r.attendance === "yes").length,
      maybe: responses.filter((r) => r.attendance === "maybe").length,
      no: responses.filter((r) => r.attendance === "no").length,
    };
    return { total, rate, latest, attendanceCounts };
  }, [responses, participantCount]);

  // Filtered responses for individual cards
  const filtered = useMemo(() => {
    let result = responses;
    if (filter !== "alle") result = result.filter((r) => r.attendance === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        r.participant.toLowerCase().includes(q) ||
        (r.de_city && r.de_city.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [responses, filter, searchQuery]);

  const handleRefresh = useCallback(() => {
    haptics.medium();
    refetch();
  }, [haptics, refetch]);

  if (isLoading) return <ResponsesSkeleton />;
  if (responses.length === 0) return <EmptyState />;

  return (
    <motion.div className="space-y-4" variants={stagger} initial="initial" animate="animate">
      {/* Refresh */}
      <motion.div variants={staggerItem} className="flex justify-end">
        <motion.button whileTap={{ scale: 0.9, rotate: 180 }} transition={spring.snappy}
          onClick={handleRefresh} disabled={isRefetching}
          className="w-8 h-8 rounded-xl bg-foreground/5 border border-border flex items-center justify-center">
          {isRefetching
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
            : <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />}
        </motion.button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground"><AnimatedCounter value={stats.total} /></p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t("nativeResponses.stats.responses")}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-display font-bold text-foreground">
            <AnimatedCounter value={stats.rate} /><span className="text-xs text-muted-foreground">%</span>
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t("nativeResponses.stats.responseRate")}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-3 text-center space-y-1">
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs font-display font-bold text-foreground leading-tight mt-1">
            {stats.latest ? timeAgo(stats.latest, t) : "---"}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">{t("nativeResponses.stats.latestResponse")}</p>
        </div>
      </motion.div>

      {/* Attendance Breakdown */}
      <motion.div variants={staggerItem}
        className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 backdrop-blur border border-border p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("nativeResponses.attendanceOverview")}
        </p>
        <div className="flex gap-2">
          {(Object.entries(ATTENDANCE_CONFIG) as [keyof typeof ATTENDANCE_CONFIG, typeof ATTENDANCE_CONFIG["yes"]][]).map(
            ([key, cfg]) => {
              const count = stats.attendanceCounts[key];
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const Icon = cfg.icon;
              return (
                <div key={key} className={cn("flex-1 rounded-xl border p-3 text-center space-y-1", cfg.bg, cfg.border)}>
                  <Icon className={cn("w-4 h-4 mx-auto", cfg.text)} />
                  <p className={cn("text-lg font-display font-bold", cfg.text)}>{count}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {pct}% {t(`nativeResponses.attendance.${cfg.i18nKey}`)}
                  </p>
                </div>
              );
            },
          )}
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-foreground/5 overflow-hidden flex">
          {stats.total > 0 && (
            <>
              <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }}
                animate={{ width: `${(stats.attendanceCounts.yes / stats.total) * 100}%` }} transition={spring.soft} />
              <motion.div className="h-full bg-amber-500" initial={{ width: 0 }}
                animate={{ width: `${(stats.attendanceCounts.maybe / stats.total) * 100}%` }} transition={{ ...spring.soft, delay: 0.1 }} />
              <motion.div className="h-full bg-red-500" initial={{ width: 0 }}
                animate={{ width: `${(stats.attendanceCounts.no / stats.total) * 100}%` }} transition={{ ...spring.soft, delay: 0.2 }} />
            </>
          )}
        </div>
      </motion.div>

      {/* ── Highlight Sections (NEW — always visible) ── */}
      <SuggestionsSection responses={responses} />
      <RestrictionsSection responses={responses} />
      <PartialAvailabilitySection responses={responses} />

      {/* Category Analysis */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {t("nativeResponses.categoryAnalysis")}
        </h3>
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.key} category={cat} responses={responses} />
        ))}
        <PreferencesChart responses={responses} />
      </motion.div>

      {/* Individual Responses */}
      <motion.div variants={staggerItem} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("nativeResponses.individualResponses")}
            <span className="ml-2 text-foreground font-bold">{filtered.length}</span>
          </h3>
          <motion.button whileTap={{ scale: 0.9 }} transition={spring.snappy}
            onClick={() => { haptics.light(); setShowSearch(!showSearch); }}
            className="w-7 h-7 rounded-lg bg-foreground/5 border border-border flex items-center justify-center">
            {showSearch ? <X className="w-3.5 h-3.5 text-muted-foreground" /> : <Search className="w-3.5 h-3.5 text-muted-foreground" />}
          </motion.button>
        </div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={spring.snappy}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/5 border border-border">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input type="text" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("nativeResponses.searchParticipants")}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {FILTER_KEYS.map((f) => {
            const active = filter === f.key;
            return (
              <button key={f.key}
                onClick={() => { haptics.select(); setFilter(f.key); }}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                  active
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-transparent shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    : "bg-foreground/5 text-muted-foreground border-border",
                )}>
                {t(`nativeResponses.${f.i18nKey}`)}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-foreground/[0.08] to-foreground/5 border border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("nativeResponses.noFilterResults")}</p>
          </div>
        ) : (
          <motion.div className="space-y-2" variants={stagger} initial="initial" animate="animate"
            key={`${filter}-${searchQuery}`}>
            {filtered.map((r, i) => (
              <ResponseCard key={r.id} response={r} index={i} />
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
