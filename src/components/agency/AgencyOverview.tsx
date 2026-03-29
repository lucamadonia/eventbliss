import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Calendar, Users, DollarSign, Plus, Contact, FileText, Clock, CheckCircle2,
  AlertCircle, ArrowRight, AlertTriangle, CloudSun, Gauge, ChevronRight, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { GlassCard } from "./ui/GlassCard";
import { StatCard } from "./ui/StatCard";
import { ActivityFeed } from "./ui/ActivityFeed";
import { ProgressRing } from "./ui/ProgressRing";

interface AgencyOverviewProps {
  onNavigate: (section: string) => void;
}

interface EventRow {
  id: string;
  name: string;
  status: string | null;
  event_phase: string | null;
  planned_budget: number | null;
  actual_budget: number | null;
}

interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  assignee_name: string | null;
  priority: string | null;
  events?: { name: string } | null;
}

export function AgencyOverview({ onNavigate }: AgencyOverviewProps) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [deadlineView, setDeadlineView] = useState<"week" | "month">("week");

  // Real data state
  const [events, setEvents] = useState<EventRow[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<TaskRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      // Fetch events and tasks in parallel
      const [eventsRes, tasksRes] = await Promise.all([
        supabase.from("events").select("id, name, status, event_phase, planned_budget, actual_budget").eq("created_by", user.id),
        (supabase.from as any)("event_tasks")
          .select("id, title, due_date, assignee_name, priority, events(name)")
          .gte("due_date", new Date().toISOString().split("T")[0])
          .order("due_date")
          .limit(10),
      ]);
      setEvents(eventsRes.data || []);
      setUpcomingTasks(tasksRes.data || []);
      setIsLoading(false);
    })();
  }, [user]);

  // Compute KPIs from real data
  const activeCount = events.filter((e) => e.status === "active" || e.event_phase === "active").length;
  const planningCount = events.filter((e) => e.status === "draft" || e.event_phase === "planning").length;
  const completedCount = events.filter((e) => e.status === "completed" || e.event_phase === "archived").length;
  const totalPlannedBudget = events.reduce((s, e) => s + (e.planned_budget || 0), 0);
  const totalActualBudget = events.reduce((s, e) => s + (e.actual_budget || 0), 0);
  const budgetPct = totalPlannedBudget > 0 ? Math.round((totalActualBudget / totalPlannedBudget) * 100) : 0;

  const kpis = [
    { label: "Aktive Events", value: activeCount, icon: Calendar, trend: 0, variant: "purple" as const, sparkData: [0, 0, 0, activeCount] },
    { label: "In Planung", value: planningCount, icon: Clock, trend: 0, variant: "cyan" as const, sparkData: [0, 0, 0, planningCount] },
    { label: "Abgeschlossen", value: completedCount, icon: CheckCircle2, trend: 0, variant: "green" as const, sparkData: [0, 0, 0, completedCount] },
    { label: "Budget (gesamt)", value: totalActualBudget, prefix: "\u20AC", icon: DollarSign, trend: 0, variant: "amber" as const, sparkData: [0, 0, 0, totalActualBudget] },
  ];

  // Upcoming deadlines from real tasks
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const deadlines = upcomingTasks.map((task) => {
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    const isThisWeek = dueDate ? dueDate <= weekEnd : false;
    const isUrgent = dueDate ? (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 2 : false;
    return {
      event: (task as any).events?.name || "-",
      task: task.title,
      date: dueDate ? dueDate.toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) : "-",
      assignee: task.assignee_name || "-",
      urgent: isUrgent,
      isThisWeek,
    };
  });

  const filteredDeadlines = deadlineView === "week" ? deadlines.filter((d) => d.isThisWeek) : deadlines;

  // Budget health per event
  const budgetHealthEvents = events
    .filter((e) => (e.planned_budget || 0) > 0)
    .map((e) => ({
      name: e.name,
      planned: e.planned_budget || 0,
      actual: e.actual_budget || 0,
      pct: Math.round(((e.actual_budget || 0) / (e.planned_budget || 1)) * 100),
    }))
    .slice(0, 5);

  // Mock activity (would need an activity log table for real data)
  const mockActivityItems = [
    { id: "1", user: user?.email?.split("@")[0] || "User", action: "hat die Uebersicht geoeffnet", entity: "", type: "updated" as const, time: "gerade", fullDate: new Date().toLocaleDateString("de-DE") },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 bg-white/5" />
          <Skeleton className="h-28 bg-white/5" />
          <Skeleton className="h-28 bg-white/5" />
          <Skeleton className="h-28 bg-white/5" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              prefix={kpi.prefix}
              trend={kpi.trend}
              icon={kpi.icon}
              variant={kpi.variant}
              sparkData={kpi.sparkData}
              delay={i * 0.06}
            />
          ))}
        </div>
      )}

      {/* Event Lifecycle Phases */}
      <GlassCard className="p-5" delay={0.15} hoverGlow>
        <h3 className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Event-Lebenszyklus
        </h3>
        {isLoading ? (
          <Skeleton className="h-12 bg-white/5" />
        ) : (
          <div className="flex items-center gap-1">
            {[
              { key: "draft", label: "Entwurf", count: events.filter((e) => e.event_phase === "draft" || e.status === "draft").length, color: "bg-white/30" },
              { key: "planning", label: "Planung", count: planningCount, color: "bg-cyan-400" },
              { key: "active", label: "Aktiv", count: activeCount, color: "bg-emerald-400" },
              { key: "completed", label: "Abgeschlossen", count: completedCount, color: "bg-amber-400" },
            ].map((phase, i, arr) => (
              <div key={phase.key} className="flex-1 group relative">
                <div className={`h-2 rounded-full ${phase.color} ${phase.key === "active" ? "animate-pulse" : ""}`} />
                <div className="mt-2 text-center">
                  <p className="text-[10px] text-slate-500">{phase.label}</p>
                  <p className="text-sm font-bold text-slate-50">{phase.count}</p>
                </div>
                {i < arr.length - 1 && <ChevronRight className="absolute right-[-8px] top-[-2px] w-3.5 h-3.5 text-white/10" />}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard className="p-5" delay={0.2} hoverGlow>
        <h3 className="text-sm font-medium text-slate-500 mb-3">Schnellaktionen</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-violet-500/20 hover:border-violet-500/30 transition-all duration-200 cursor-pointer" onClick={() => onNavigate("events")}>
            <Plus className="w-5 h-5 text-violet-400" /><span className="text-xs text-slate-300">Event erstellen</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200 cursor-pointer" onClick={() => onNavigate("contacts")}>
            <Contact className="w-5 h-5 text-cyan-400" /><span className="text-xs text-slate-300">Kontakt hinzufuegen</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200 cursor-pointer" onClick={() => onNavigate("runofshow")}>
            <Calendar className="w-5 h-5 text-emerald-400" /><span className="text-xs text-slate-300">Run of Show</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-amber-500/20 hover:border-amber-500/30 transition-all duration-200 cursor-pointer" onClick={() => onNavigate("templates")}>
            <FileText className="w-5 h-5 text-amber-400" /><span className="text-xs text-slate-300">Neue Vorlage</span>
          </Button>
        </div>
      </GlassCard>

      {/* Deadlines + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <GlassCard className="p-5" delay={0.3} hoverGlow>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-50">Anstehende Deadlines</h3>
            <div className="flex gap-1">
              <button onClick={() => setDeadlineView("week")} className={`text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${deadlineView === "week" ? "bg-violet-600/20 text-violet-300" : "text-slate-500 hover:text-slate-300"}`}>Diese Woche</button>
              <button onClick={() => setDeadlineView("month")} className={`text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${deadlineView === "month" ? "bg-violet-600/20 text-violet-300" : "text-slate-500 hover:text-slate-300"}`}>Alle</button>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 bg-white/5" /><Skeleton className="h-12 bg-white/5" /></div>
          ) : filteredDeadlines.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Keine anstehenden Deadlines</p>
          ) : (
            <div className="space-y-2">
              {filteredDeadlines.map((dl, i) => (
                <motion.div
                  key={`${dl.task}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-default"
                >
                  <div className="relative">
                    {dl.urgent && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    <div className={`w-1.5 h-8 rounded-full ${dl.urgent ? "bg-red-500" : "bg-white/20"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{dl.task}</p>
                    <p className="text-xs text-slate-500">{dl.event}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-300">{dl.date}</p>
                    <p className="text-xs text-slate-500">{dl.assignee}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard className="p-5" delay={0.35} hoverGlow>
          <h3 className="font-semibold text-slate-50 mb-4">Letzte Aktivitaeten</h3>
          <ActivityFeed items={mockActivityItems} onViewAll={() => {}} />
        </GlassCard>
      </div>

      {/* Budget Health Summary */}
      <GlassCard className="p-5" delay={0.4} gradient>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-50">Budget-Gesundheit (alle Events)</h3>
          <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 gap-1 cursor-pointer" onClick={() => onNavigate("budgetengine")}>
            Details <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        {isLoading ? (
          <Skeleton className="h-32 bg-white/5" />
        ) : (
          <>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
              <ProgressRing value={budgetPct} size={80} strokeWidth={6} color="#8B5CF6" label="gesamt" />
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Geplant</p>
                  <p className="text-lg font-bold text-slate-50">{"\u20AC"}{totalPlannedBudget.toLocaleString("de-DE")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Ausgegeben</p>
                  <p className="text-lg font-bold text-emerald-400">{"\u20AC"}{totalActualBudget.toLocaleString("de-DE")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Verbleibend</p>
                  <p className="text-lg font-bold text-cyan-400">{"\u20AC"}{(totalPlannedBudget - totalActualBudget).toLocaleString("de-DE")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {budgetHealthEvents.map((evt, i) => {
                const healthColor = evt.pct <= 60 ? "#10B981" : evt.pct <= 85 ? "#F59E0B" : "#EF4444";
                return (
                  <motion.div key={evt.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-36 truncate">{evt.name}</span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${evt.pct}%` }} transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: healthColor }} />
                    </div>
                    <span className="text-[10px] text-slate-500 w-10 text-right">{evt.pct}%</span>
                    <span className="text-[10px] text-slate-600 w-28 text-right">
                      {"\u20AC"}{evt.actual.toLocaleString("de-DE")} / {"\u20AC"}{evt.planned.toLocaleString("de-DE")}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
