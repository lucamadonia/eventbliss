import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface MonthlyData {
  month: string;
  earnings: number;
  conversions: number;
}

interface AffiliatePerformanceChartProps {
  data: MonthlyData[];
}

export function AffiliatePerformanceChart({ data }: AffiliatePerformanceChartProps) {
  const { t } = useTranslation();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <p className="text-sm text-primary">
            {t("affiliate.stats.earnings", "Einnahmen")}: €{payload[0]?.value?.toFixed(2)}
          </p>
          <p className="text-sm text-accent">
            {t("affiliate.stats.conversions", "Conversions")}: {payload[1]?.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold mb-6">
        {t("affiliate.portal.performanceChart", "Performance der letzten 12 Monate")}
      </h3>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 72%, 56%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(174, 72%, 56%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="earnings"
              stroke="hsl(262, 83%, 58%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEarnings)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="conversions"
              stroke="hsl(174, 72%, 56%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConversions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">
            {t("affiliate.stats.earnings", "Einnahmen")} (€)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">
            {t("affiliate.stats.conversions", "Conversions")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
