import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const PIE_COLORS = ["#8B5CF6", "#06B6D4", "#A78BFA", "#F59E0B", "#10B981", "#64748B", "#EC4899", "#F97316"];

type DateRange = "month" | "quarter" | "year" | "all";

function getCutoffDate(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "month") return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  if (range === "quarter") return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1625] border border-white/10 rounded-lg p-3 text-sm">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.value > 999
            ? `\u20AC${entry.value.toLocaleString("de-DE")}`
            : entry.value}
        </p>
      ))}
    </div>
  );
};

export function AgencyReports() {
  const { user } = useAuthContext();
  const [dateRange, setDateRange] = useState<DateRange>("year");
  const [events, setEvents] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [evRes, biRes] = await Promise.all([
        supabase
          .from("events")
          .select("id, name, created_at, event_type, status, planned_budget, actual_budget")
          .eq("created_by", user!.id),
        (supabase.from as any)("budget_items")
          .select("planned_amount, actual_amount, category, event_id"),
      ]);
      if (!cancelled) {
        setEvents(evRes.data ?? []);
        setBudgetItems(biRes.data ?? []);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    const cutoff = getCutoffDate(dateRange);
    if (!cutoff) return events;
    return events.filter((e) => new Date(e.created_at) >= cutoff);
  }, [events, dateRange]);

  const eventsPerMonth = useMemo(() => {
    const counts: Record<number, number> = {};
    filtered.forEach((e) => { const m = new Date(e.created_at).getMonth(); counts[m] = (counts[m] || 0) + 1; });
    return MONTH_LABELS.map((label, i) => ({ month: label, events: counts[i] || 0 }));
  }, [filtered]);

  const revenueTrend = useMemo(() => {
    const sums: Record<number, number> = {};
    filtered.forEach((e) => {
      const m = new Date(e.created_at).getMonth();
      sums[m] = (sums[m] || 0) + (Number(e.planned_budget) || 0);
    });
    return MONTH_LABELS.map((label, i) => ({ month: label, revenue: sums[i] || 0 }));
  }, [filtered]);

  const eventTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((e) => {
      const t = e.event_type || "other";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const budgetAccuracy = useMemo(() => {
    return filtered
      .filter((e) => e.planned_budget || e.actual_budget)
      .slice(0, 8)
      .map((e) => ({
        event: (e.name || "Event").slice(0, 16),
        planned: Number(e.planned_budget) || 0,
        actual: Number(e.actual_budget) || 0,
      }));
  }, [filtered]);

  const totalEvents = filtered.length;
  const totalRevenue = filtered.reduce((s, e) => s + (Number(e.planned_budget) || 0), 0);
  const avgBudget = totalEvents > 0 ? Math.round(totalRevenue / totalEvents) : 0;
  const activeEvents = filtered.filter((e) => e.status === "active" || e.status === "planning").length;

  const kpis = [
    { label: "Events gesamt", value: String(totalEvents), icon: Calendar, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Gesamtumsatz", value: `\u20AC${totalRevenue.toLocaleString("de-DE")}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "\u00D8 Budget/Event", value: `\u20AC${avgBudget.toLocaleString("de-DE")}`, icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Aktive Events", value: String(activeEvents), icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  function exportCSV() {
    const header = "Name,Typ,Status,Erstellt,Geplantes Budget,Tatsaechliches Budget\n";
    const rows = filtered.map((e) =>
      [e.name, e.event_type, e.status, e.created_at, e.planned_budget ?? "", e.actual_budget ?? ""].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eventbliss-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-lg font-semibold text-white">Berichte & Analysen</h3>
          <p className="text-sm text-white/40">Leistungsübersicht deiner Agentur</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Letzte 30 Tage</SelectItem>
              <SelectItem value="quarter">Letzte 3 Monate</SelectItem>
              <SelectItem value="year">Letzte 12 Monate</SelectItem>
              <SelectItem value="all">Gesamtzeitraum</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            onClick={exportCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV Export
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
          >
            <div className={`p-2.5 rounded-lg ${kpi.bg} w-fit mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-sm text-white/50">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
        >
          <h4 className="font-semibold text-white mb-4">Events pro Monat</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={eventsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="events" name="Events" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
        >
          <h4 className="font-semibold text-white mb-4">Umsatzentwicklung</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" name="Umsatz" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
        >
          <h4 className="font-semibold text-white mb-4">Event-Typen Verteilung</h4>
          {eventTypes.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-16">Keine Event-Daten vorhanden</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={eventTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {eventTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span className="text-xs text-white/60">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
        >
          <h4 className="font-semibold text-white mb-4">Budget-Genauigkeit (Geplant vs. Tatsaechlich)</h4>
          {budgetAccuracy.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-16">Keine Budget-Daten vorhanden</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={budgetAccuracy}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="event" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span className="text-xs text-white/60">{value}</span>} />
                <Bar dataKey="planned" name="Geplant" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Tatsaechlich" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
