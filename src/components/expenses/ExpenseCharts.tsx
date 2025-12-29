import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paid_by: string;
  paid_by_participant_id: string | null;
  expense_date: string | null;
  created_at: string;
  is_planned?: boolean;
}

interface Participant {
  id: string;
  name: string;
}

interface ExpenseChartsProps {
  expenses: Expense[];
  participants: Participant[];
  currency: string;
  balances?: { id: string; name: string; paid: number; owes: number; balance: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  transport: "hsl(217, 91%, 60%)",
  accommodation: "hsl(262, 83%, 58%)",
  activities: "hsl(330, 81%, 60%)",
  food: "hsl(25, 95%, 53%)",
  drinks: "hsl(45, 93%, 47%)",
  gifts: "hsl(142, 71%, 45%)",
  other: "hsl(240, 5%, 64%)",
};

const CATEGORY_LABELS: Record<string, string> = {
  transport: "🚗 Transport",
  accommodation: "🏨 Unterkunft",
  activities: "🎯 Aktivitäten",
  food: "🍔 Essen",
  drinks: "🍻 Getränke",
  gifts: "🎁 Geschenke",
  other: "💰 Sonstiges",
};

export const CategoryDonutChart = ({ expenses, currency }: { expenses: Expense[]; currency: string }) => {
  const { t } = useTranslation();
  const actualExpenses = expenses.filter((e) => !e.is_planned);

  const categoryData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    actualExpenses.forEach((exp) => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    });
    return Object.entries(byCategory)
      .map(([category, amount]) => ({
        name: t(`expenses.categories.${category}`, { defaultValue: CATEGORY_LABELS[category] || category }),
        value: amount,
        category,
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [actualExpenses, t]);

  const total = actualExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (categoryData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        {t("expenses.noData")}
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="glass-card p-2 text-sm">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-muted-foreground">
                      {currency}
                      {data.value.toFixed(2)} ({((data.value / total) * 100).toFixed(0)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-2xl font-bold">
            {currency}
            {total.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">{t("expenses.total")}</p>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {categoryData.slice(0, 4).map((item) => (
          <div key={item.category} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-muted-foreground">{item.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PayerBarChart = ({ expenses, participants, currency }: ExpenseChartsProps) => {
  const { t } = useTranslation();
  const actualExpenses = expenses.filter((e) => !e.is_planned);

  const payerData = useMemo(() => {
    const byPayer: Record<string, number> = {};
    actualExpenses.forEach((exp) => {
      if (exp.paid_by_participant_id) {
        byPayer[exp.paid_by_participant_id] = (byPayer[exp.paid_by_participant_id] || 0) + exp.amount;
      }
    });
    return participants
      .map((p) => ({
        name: p.name.split(" ")[0],
        fullName: p.name,
        amount: byPayer[p.id] || 0,
        initial: p.name.charAt(0).toUpperCase(),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [actualExpenses, participants]);

  if (payerData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        {t("expenses.noData")}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={payerData} layout="vertical" margin={{ left: 0, right: 20 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          width={60}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="glass-card p-2 text-sm">
                  <p className="font-medium">{data.fullName}</p>
                  <p className="text-muted-foreground">
                    {currency}
                    {data.amount.toFixed(2)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="amount" fill="url(#barGradient)" radius={[0, 6, 6, 0]} />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
            <stop offset="100%" stopColor="hsl(330, 81%, 60%)" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
};

// NEW: Person Balance Chart - Shows paid vs owes per person
export const PersonBalanceChart = ({
  balances,
  currency,
}: {
  balances: { id: string; name: string; paid: number; owes: number; balance: number }[];
  currency: string;
}) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    return balances.map((b) => ({
      name: b.name.split(" ")[0],
      fullName: b.name,
      paid: b.paid,
      owes: b.owes,
      balance: b.balance,
    }));
  }, [balances]);

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        {t("expenses.noData")}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <YAxis hide />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="glass-card p-3 text-sm space-y-1">
                  <p className="font-medium">{data.fullName}</p>
                  <p className="text-green-500">
                    {t("expenses.paidTotal")}: {currency}
                    {data.paid.toFixed(2)}
                  </p>
                  <p className="text-orange-500">
                    {t("expenses.owesTotal")}: {currency}
                    {data.owes.toFixed(2)}
                  </p>
                  <p className={data.balance >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                    {t("expenses.balance")}: {data.balance >= 0 ? "+" : ""}
                    {currency}
                    {data.balance.toFixed(2)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) => (value === "paid" ? t("expenses.paid") : t("expenses.owes"))}
        />
        <Bar dataKey="paid" name="paid" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="owes" name="owes" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const TimelineAreaChart = ({ expenses, currency }: { expenses: Expense[]; currency: string }) => {
  const { t } = useTranslation();
  const actualExpenses = expenses.filter((e) => !e.is_planned);

  const timelineData = useMemo(() => {
    const byDate: Record<string, number> = {};
    actualExpenses.forEach((exp) => {
      const date = exp.expense_date || exp.created_at?.split("T")[0];
      if (date) {
        byDate[date] = (byDate[date] || 0) + exp.amount;
      }
    });

    const sortedDates = Object.keys(byDate).sort();
    let cumulative = 0;
    return sortedDates.map((date) => {
      cumulative += byDate[date];
      return {
        date: new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }),
        fullDate: date,
        amount: byDate[date],
        cumulative,
      };
    });
  }, [actualExpenses]);

  if (timelineData.length < 2) {
    return (
      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
        {t("expenses.needMoreData")}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={timelineData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
        />
        <YAxis hide />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="glass-card p-2 text-sm">
                  <p className="font-medium">{data.date}</p>
                  <p className="text-muted-foreground">
                    +{currency}
                    {data.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-primary">
                    {t("expenses.total")}: {currency}
                    {data.cumulative.toFixed(2)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="hsl(262, 83%, 58%)"
          strokeWidth={2}
          fill="url(#areaGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const ExpenseCharts = ({ expenses, participants, currency, balances }: ExpenseChartsProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <h3 className="font-display font-semibold mb-4">{t("expenses.byCategory")}</h3>
        <CategoryDonutChart expenses={expenses} currency={currency} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5"
      >
        <h3 className="font-display font-semibold mb-4">{t("expenses.whoPaid")}</h3>
        <PayerBarChart expenses={expenses} participants={participants} currency={currency} />
      </motion.div>

      {/* NEW: Person Balance Chart */}
      {balances && balances.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 md:col-span-2"
        >
          <h3 className="font-display font-semibold mb-4">{t("expenses.expensesPerPerson")}</h3>
          <PersonBalanceChart balances={balances} currency={currency} />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5 md:col-span-2"
      >
        <h3 className="font-display font-semibold mb-4">{t("expenses.timeline")}</h3>
        <TimelineAreaChart expenses={expenses} currency={currency} />
      </motion.div>
    </div>
  );
};
