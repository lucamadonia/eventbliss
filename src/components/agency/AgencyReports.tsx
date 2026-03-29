import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const eventsPerMonth = [
  { month: "Jan", events: 3 },
  { month: "Feb", events: 4 },
  { month: "M\u00E4r", events: 6 },
  { month: "Apr", events: 5 },
  { month: "Mai", events: 8 },
  { month: "Jun", events: 10 },
  { month: "Jul", events: 7 },
  { month: "Aug", events: 4 },
  { month: "Sep", events: 6 },
  { month: "Okt", events: 8 },
  { month: "Nov", events: 5 },
  { month: "Dez", events: 3 },
];

const revenueTrend = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 15000 },
  { month: "M\u00E4r", revenue: 22000 },
  { month: "Apr", revenue: 18000 },
  { month: "Mai", revenue: 28000 },
  { month: "Jun", revenue: 35000 },
  { month: "Jul", revenue: 24000 },
  { month: "Aug", revenue: 16000 },
  { month: "Sep", revenue: 21000 },
  { month: "Okt", revenue: 30000 },
  { month: "Nov", revenue: 19000 },
  { month: "Dez", revenue: 14000 },
];

const eventTypes = [
  { name: "Hochzeit", value: 28 },
  { name: "Corporate", value: 22 },
  { name: "JGA", value: 18 },
  { name: "Geburtstag", value: 15 },
  { name: "Konferenz", value: 10 },
  { name: "Sonstiges", value: 7 },
];

const PIE_COLORS = ["#8B5CF6", "#06B6D4", "#A78BFA", "#F59E0B", "#10B981", "#64748B"];

const budgetAccuracy = [
  { event: "Hochzeit A", planned: 35000, actual: 32000 },
  { event: "Firmenfeier B", planned: 25000, actual: 27500 },
  { event: "JGA C", planned: 5000, actual: 4800 },
  { event: "Konferenz D", planned: 45000, actual: 43000 },
  { event: "Geburtstag E", planned: 12000, actual: 11500 },
  { event: "Sommerfest F", planned: 8000, actual: 9200 },
];

const kpis = [
  { label: "Events gesamt", value: "69", icon: Calendar, color: "text-violet-400", bg: "bg-violet-500/10" },
  { label: "Gesamtumsatz", value: "\u20AC254.000", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "\u00D8 Budget/Event", value: "\u20AC3.680", icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { label: "Kundenbindung", value: "78%", icon: Users, color: "text-amber-400", bg: "bg-amber-500/10" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1625] border border-white/10 rounded-lg p-3 text-sm">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-white" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.value > 999
            ? `\u20AC${entry.value.toLocaleString("de-DE")}`
            : entry.value}
        </p>
      ))}
    </div>
  );
};

export function AgencyReports() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState("year");

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
          <p className="text-sm text-white/40">Leistungs\u00FCbersicht deiner Agentur</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Letzter Monat</SelectItem>
              <SelectItem value="quarter">Letztes Quartal</SelectItem>
              <SelectItem value="year">Letztes Jahr</SelectItem>
              <SelectItem value="all">Gesamtzeitraum</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10">
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
        {/* Events per Month */}
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

        {/* Revenue Trend */}
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
              <Line
                type="monotone"
                dataKey="revenue"
                name="Umsatz"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={{ fill: "#06B6D4", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Types Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
        >
          <h4 className="font-semibold text-white mb-4">Event-Typen Verteilung</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={eventTypes}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {eventTypes.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-white/60">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Budget Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
        >
          <h4 className="font-semibold text-white mb-4">Budget-Genauigkeit (Geplant vs. Tats\u00E4chlich)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={budgetAccuracy}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="event" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span className="text-xs text-white/60">{value}</span>} />
              <Bar dataKey="planned" name="Geplant" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Tats\u00E4chlich" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
