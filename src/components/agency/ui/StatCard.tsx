import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniChart } from "./MiniChart";

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: number;
  icon: LucideIcon;
  sparkData?: number[];
  variant?: "purple" | "cyan" | "green" | "amber";
  delay?: number;
}

const variantStyles: Record<string, { icon: string; bg: string; glow: string; chart: string }> = {
  purple: {
    icon: "text-violet-400",
    bg: "bg-violet-500/10",
    glow: "shadow-violet-500/5",
    chart: "#8B5CF6",
  },
  cyan: {
    icon: "text-cyan-400",
    bg: "bg-cyan-500/10",
    glow: "shadow-cyan-500/5",
    chart: "#06B6D4",
  },
  green: {
    icon: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/5",
    chart: "#10B981",
  },
  amber: {
    icon: "text-amber-400",
    bg: "bg-amber-500/10",
    glow: "shadow-amber-500/5",
    chart: "#F59E0B",
  },
};

function useCountUp(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = ref.current;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = from + (target - from) * eased;
      setCurrent(val);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        ref.current = target;
      }
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return current;
}

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  trend,
  icon: Icon,
  sparkData = [3, 5, 4, 7, 6, 8, 9],
  variant = "purple",
  delay = 0,
}: StatCardProps) {
  const style = variantStyles[variant];
  const animatedValue = useCountUp(value);
  const isPositive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5",
        "hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300",
        `hover:${style.glow}`
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", style.bg)}>
          <Icon className={cn("w-5 h-5", style.icon)} />
        </div>
        <MiniChart data={sparkData} width={56} height={24} color={style.chart} />
      </div>
      <p className="text-2xl font-bold text-slate-50 tracking-tight">
        {prefix && <span className="text-lg font-semibold text-slate-300">{prefix}</span>}
        {Number.isInteger(value)
          ? Math.round(animatedValue).toLocaleString("de-DE")
          : animatedValue.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
        {suffix && <span className="text-lg font-semibold text-slate-300 ml-0.5">{suffix}</span>}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
            {isPositive ? "+" : ""}
            {trend}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
