import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bus, Utensils, Home, Gamepad2, Wine, Gift, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const DemoExpenses = () => {
  const { t } = useTranslation();
  const [displayTotal, setDisplayTotal] = useState(0);
  const targetTotal = 478.50;

  useEffect(() => {
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

    return () => clearInterval(timer);
  }, []);

  const mockExpenses = [
    { description: t("landing.demo.live.expenses.bus", "Busfahrt nach Hamburg"), amount: 89.00, category: "transport", paidBy: "Sarah", icon: Bus, color: "bg-primary/20 text-primary" },
    { description: t("landing.demo.live.expenses.escapeRoom", "Escape Room"), amount: 120.00, category: "activities", paidBy: "Michael", icon: Gamepad2, color: "bg-accent/20 text-accent" },
    { description: t("landing.demo.live.expenses.dinner", "Abendessen Restaurant"), amount: 156.50, category: "food", paidBy: "Anna", icon: Utensils, color: "bg-warning/20 text-warning" },
    { description: t("landing.demo.live.expenses.drinks", "Getränke Bar"), amount: 78.00, category: "drinks", paidBy: "Tom", icon: Wine, color: "bg-neon-pink/20 text-neon-pink" },
    { description: t("landing.demo.live.expenses.gift", "Überraschungsgeschenk"), amount: 35.00, category: "gifts", paidBy: "Sarah", icon: Gift, color: "bg-success/20 text-success" },
  ];

  const participantCount = 8;
  const perPerson = targetTotal / participantCount;

  return (
    <div className="h-full flex flex-col gap-3 p-2">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg p-3 text-center border border-primary/30"
        >
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
            {t("landing.demo.live.expenses.total", "Gesamt")}
          </div>
          <div className="font-bold text-lg text-primary">
            €{displayTotal.toFixed(2)}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 rounded-lg p-3 text-center border border-border/50"
        >
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            {t("landing.demo.live.expenses.perPerson", "Pro Person")}
          </div>
          <div className="font-bold text-lg">
            €{perPerson.toFixed(2)}
          </div>
        </motion.div>
      </div>

      {/* Expense List */}
      <div className="flex-1 overflow-hidden">
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
          {t("landing.demo.live.expenses.recentExpenses", "Letzte Ausgaben")}
        </h4>
        <div className="space-y-1.5">
          {mockExpenses.map((expense, index) => (
            <motion.div
              key={expense.description}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-card/30 rounded-lg p-2 flex items-center gap-2 border border-border/30"
            >
              <div className={`p-1.5 rounded-md ${expense.color}`}>
                <expense.icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{expense.description}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t("landing.demo.live.expenses.paidBy", "bezahlt von")} {expense.paidBy}
                </div>
              </div>
              <div className="text-xs font-bold text-right">
                €{expense.amount.toFixed(2)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category Summary */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-1 justify-center flex-wrap"
      >
        {[
          { icon: Bus, color: "bg-primary/20 text-primary" },
          { icon: Utensils, color: "bg-warning/20 text-warning" },
          { icon: Gamepad2, color: "bg-accent/20 text-accent" },
          { icon: Wine, color: "bg-neon-pink/20 text-neon-pink" },
          { icon: Gift, color: "bg-success/20 text-success" },
        ].map((cat, i) => (
          <div key={i} className={`p-1 rounded ${cat.color}`}>
            <cat.icon className="w-3 h-3" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export { DemoExpenses };
