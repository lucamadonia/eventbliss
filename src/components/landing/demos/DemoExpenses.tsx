import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, Utensils, Home, Gamepad2, Wine, Gift, Users, ArrowRight, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  icon: typeof Bus;
  color: string;
  isNew?: boolean;
}

const DemoExpenses = () => {
  const { t } = useTranslation();
  const [displayTotal, setDisplayTotal] = useState(0);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const targetTotal = 478.50;
  const newExpenseAmount = 45.00;

  const initialExpenses: Expense[] = [
    { id: 1, description: t("landing.demo.live.expenses.bus", "Busfahrt Hamburg"), amount: 89.00, category: "transport", paidBy: "Sarah", icon: Bus, color: "bg-primary/20 text-primary" },
    { id: 2, description: t("landing.demo.live.expenses.escapeRoom", "Escape Room"), amount: 120.00, category: "activities", paidBy: "Michael", icon: Gamepad2, color: "bg-accent/20 text-accent" },
    { id: 3, description: t("landing.demo.live.expenses.dinner", "Restaurant"), amount: 156.50, category: "food", paidBy: "Anna", icon: Utensils, color: "bg-warning/20 text-warning" },
    { id: 4, description: t("landing.demo.live.expenses.drinks", "Bar & Getränke"), amount: 78.00, category: "drinks", paidBy: "Tom", icon: Wine, color: "bg-neon-pink/20 text-neon-pink" },
  ];

  const newExpense = { 
    id: 5, 
    description: t("landing.demo.live.expenses.gift", "Geschenk 🎁"), 
    amount: newExpenseAmount, 
    category: "gifts", 
    paidBy: "Julia", 
    icon: Gift, 
    color: "bg-success/20 text-success",
    isNew: true 
  };

  useEffect(() => {
    // Initialize expenses
    setExpenses(initialExpenses);
    
    // Animate total
    const duration = 1500;
    const steps = 60;
    const increment = targetTotal / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetTotal) {
        setDisplayTotal(targetTotal);
        clearInterval(timer);
      } else {
        setDisplayTotal(current);
      }
    }, duration / steps);

    // Add new expense after 2.5s
    const newExpenseTimer = setTimeout(() => {
      setShowNewExpense(true);
      setExpenses(prev => [newExpense, ...prev.slice(0, 3)]);
      // Animate to new total
      let newTotal = targetTotal;
      const animateNewTotal = setInterval(() => {
        newTotal += (newExpenseAmount / 20);
        if (newTotal >= targetTotal + newExpenseAmount) {
          setDisplayTotal(targetTotal + newExpenseAmount);
          clearInterval(animateNewTotal);
        } else {
          setDisplayTotal(newTotal);
        }
      }, 30);
    }, 2500);

    return () => {
      clearInterval(timer);
      clearTimeout(newExpenseTimer);
    };
  }, []);

  const participantCount = 8;
  const perPerson = displayTotal / participantCount;

  // Category totals for chart
  const categories = [
    { name: t("landing.demo.live.expenses.catTransport", "Transport"), amount: 89, icon: Bus, color: "bg-primary", percent: 18 },
    { name: t("landing.demo.live.expenses.catFood", "Essen"), amount: 156.50, icon: Utensils, color: "bg-warning", percent: 33 },
    { name: t("landing.demo.live.expenses.catActivities", "Aktivitäten"), amount: 120, icon: Gamepad2, color: "bg-accent", percent: 25 },
    { name: t("landing.demo.live.expenses.catDrinks", "Getränke"), amount: 78, icon: Wine, color: "bg-neon-pink", percent: 16 },
  ];

  // Settlement preview
  const settlements = [
    { from: "Michael", to: "Sarah", amount: 23.50 },
    { from: "Tom", to: "Anna", amount: 18.00 },
  ];

  return (
    <div className="h-full flex flex-col gap-2 p-2">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg p-2.5 text-center border border-primary/30 relative overflow-hidden"
        >
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">
            {t("landing.demo.live.expenses.total", "Gesamt")}
          </div>
          <motion.div 
            className="font-bold text-xl text-primary"
            key={displayTotal}
          >
            €{displayTotal.toFixed(2)}
          </motion.div>
          {showNewExpense && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-1 right-1 text-[8px] text-success flex items-center gap-0.5"
            >
              <TrendingUp className="w-2.5 h-2.5" />
              +€{newExpenseAmount.toFixed(2)}
            </motion.div>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 rounded-lg p-2.5 text-center border border-border/50"
        >
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center justify-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {t("landing.demo.live.expenses.perPerson", "Pro Person")}
          </div>
          <div className="font-bold text-xl">
            €{perPerson.toFixed(2)}
          </div>
        </motion.div>
      </div>

      {/* Category Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-card/30 rounded-lg p-2 border border-border/50"
      >
        <h4 className="text-[9px] font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">
          {t("landing.demo.live.expenses.categories", "Kategorien")}
        </h4>
        <div className="flex h-2 rounded-full overflow-hidden mb-1.5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ width: 0 }}
              animate={{ width: `${cat.percent}%` }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
              className={`${cat.color} first:rounded-l-full last:rounded-r-full`}
            />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className="text-center"
            >
              <cat.icon className={`w-3 h-3 mx-auto mb-0.5 ${cat.color.replace('bg-', 'text-')}`} />
              <div className="text-[8px] text-muted-foreground truncate">{cat.name}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Expense List */}
      <div className="flex-1 overflow-hidden">
        <h4 className="text-[9px] font-semibold mb-1 text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          {t("landing.demo.live.expenses.recentExpenses", "Letzte Ausgaben")}
          {showNewExpense && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-1 py-0.5 rounded-full bg-success/20 text-success text-[7px]"
            >
              +1 NEU
            </motion.span>
          )}
        </h4>
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {expenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                layout
                initial={expense.isNew ? { opacity: 0, x: -30, scale: 0.8 } : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: expense.isNew ? 0 : 0.4 + index * 0.1 }}
                className={`rounded-lg p-1.5 flex items-center gap-2 border ${
                  expense.isNew 
                    ? "bg-success/10 border-success/30" 
                    : "bg-card/30 border-border/30"
                }`}
              >
                <div className={`p-1 rounded-md ${expense.color}`}>
                  <expense.icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate flex items-center gap-1">
                    {expense.description}
                    {expense.isNew && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: 3, duration: 0.5 }}
                        className="text-[8px] text-success"
                      >
                        ✨
                      </motion.span>
                    )}
                  </div>
                  <div className="text-[8px] text-muted-foreground">
                    {expense.paidBy}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-right">
                  €{expense.amount.toFixed(2)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Settlement Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-2 border border-border/50"
      >
        <h4 className="text-[9px] font-semibold mb-1 text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          💸 {t("landing.demo.live.expenses.settlements", "Ausgleich")}
        </h4>
        <div className="space-y-1">
          {settlements.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.1 }}
              className="flex items-center gap-1 text-[9px]"
            >
              <span className="font-medium">{s.from}</span>
              <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="font-medium">{s.to}</span>
              <span className="ml-auto text-primary font-bold">€{s.amount.toFixed(2)}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export { DemoExpenses };
