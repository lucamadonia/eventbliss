import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target, Wallet } from "lucide-react";

interface StatsHeroProps {
  totalExpenses: number;
  actualExpenses: number;
  plannedExpenses: number;
  perPerson: number;
  participantCount: number;
  currency: string;
  budgetLimit?: number;
}

// Animated number component
const AnimatedNumber = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}{displayValue.toFixed(2)}{suffix}
    </span>
  );
};

export const StatsHero = ({
  totalExpenses,
  actualExpenses,
  plannedExpenses,
  perPerson,
  participantCount,
  currency,
  budgetLimit,
}: StatsHeroProps) => {
  const { t } = useTranslation();
  const budgetPercentage = budgetLimit ? Math.min((totalExpenses / budgetLimit) * 100, 100) : null;

  const stats = [
    {
      label: t("expenses.totalAmount"),
      value: totalExpenses,
      icon: Wallet,
      color: "from-primary to-pink-500",
      highlight: true,
    },
    {
      label: t("expenses.actualPaid"),
      value: actualExpenses,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-400",
    },
    {
      label: t("expenses.plannedCosts"),
      value: plannedExpenses,
      icon: Target,
      color: "from-orange-500 to-amber-400",
    },
    {
      label: t("expenses.perPerson"),
      value: perPerson,
      icon: Users,
      color: "from-blue-500 to-cyan-400",
      subtitle: `${participantCount} ${t("expenses.participants")}`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl glass-card border-0"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-pink-500/10 to-transparent" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/30 to-transparent rounded-full blur-3xl" />
      
      <div className="relative p-6 md:p-8">
        {/* Main stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${stat.highlight ? "col-span-2 lg:col-span-1" : ""}`}
            >
              <div className={`p-4 rounded-2xl ${stat.highlight ? "bg-background/40 backdrop-blur-sm" : "bg-background/20"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className={`font-display font-bold ${stat.highlight ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>
                    <AnimatedNumber value={stat.value} prefix={currency} />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Budget progress bar */}
        {budgetPercentage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">{t("expenses.budgetUsed")}</span>
              <span className={`font-medium ${budgetPercentage > 80 ? "text-orange-400" : "text-green-400"}`}>
                {budgetPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-background/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  budgetPercentage > 80
                    ? "bg-gradient-to-r from-orange-500 to-red-500"
                    : "bg-gradient-to-r from-green-500 to-emerald-400"
                }`}
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
