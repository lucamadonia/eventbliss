import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEvent } from "@/hooks/useEvent";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// New expense components
import { StatsHero } from "@/components/expenses/StatsHero";
import { ExpenseCharts } from "@/components/expenses/ExpenseCharts";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { SettlementList } from "@/components/expenses/SettlementCard";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { ExpenseFilters, FilterType, SortType } from "@/components/expenses/ExpenseFilters";

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paid_by: string;
  paid_by_participant_id: string | null;
  created_at: string;
  expense_date: string | null;
  is_planned?: boolean;
}

const EventExpenses = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { event, participants, isLoading: eventLoading, error } = useEvent(slug);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("date-desc");

  // Fetch expenses from database
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!event?.id) return;
      
      setIsLoadingExpenses(true);
      try {
        const { data: expensesData, error: expensesError } = await supabase
          .from("expenses")
          .select("*")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false });

        if (expensesError) throw expensesError;

        const { data: activitiesData, error: activitiesError } = await supabase
          .from("schedule_activities")
          .select("id, title, estimated_cost, currency, category, day_date")
          .eq("event_id", event.id)
          .not("estimated_cost", "is", null);

        if (activitiesError) throw activitiesError;

        const mappedExpenses: Expense[] = (expensesData || []).map(exp => {
          const paidByParticipant = participants.find(p => p.id === exp.paid_by_participant_id);
          return {
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            currency: exp.currency,
            category: exp.category,
            paid_by: paidByParticipant?.name || t('expenses.unknown'),
            paid_by_participant_id: exp.paid_by_participant_id,
            created_at: exp.created_at,
            expense_date: exp.expense_date,
            is_planned: false,
          };
        });

        const plannedExpenses: Expense[] = (activitiesData || [])
          .filter(act => act.estimated_cost && act.estimated_cost > 0)
          .map(act => ({
            id: `planned-${act.id}`,
            description: act.title,
            amount: act.estimated_cost!,
            currency: act.currency || 'EUR',
            category: mapActivityCategoryToExpense(act.category),
            paid_by: t('expenses.planned'),
            paid_by_participant_id: null,
            created_at: new Date().toISOString(),
            expense_date: act.day_date,
            is_planned: true,
          }));

        setExpenses([...mappedExpenses, ...plannedExpenses]);
      } catch (err) {
        console.error("Error fetching expenses:", err);
        toast({
          title: t('common.error'),
          description: t('expenses.loadError'),
          variant: "destructive",
        });
      } finally {
        setIsLoadingExpenses(false);
      }
    };

    fetchExpenses();
  }, [event?.id, participants, t]);

  const mapActivityCategoryToExpense = (activityCategory: string | null): string => {
    const mapping: Record<string, string> = {
      activity: 'activities',
      food: 'food',
      transport: 'transport',
      accommodation: 'accommodation',
      party: 'drinks',
      sightseeing: 'activities',
      relaxation: 'activities',
      other: 'other',
    };
    return mapping[activityCategory || 'other'] || 'other';
  };

  // Calculate totals
  const actualExpenses = useMemo(() => expenses.filter(e => !e.is_planned), [expenses]);
  const plannedExpenses = useMemo(() => expenses.filter(e => e.is_planned), [expenses]);
  const totalActualExpenses = useMemo(() => actualExpenses.reduce((sum, e) => sum + e.amount, 0), [actualExpenses]);
  const totalPlannedExpenses = useMemo(() => plannedExpenses.reduce((sum, e) => sum + e.amount, 0), [plannedExpenses]);
  const totalExpenses = totalActualExpenses + totalPlannedExpenses;
  const perPerson = totalExpenses / Math.max(participants.length, 1);

  // Calculate balances
  const balances = useMemo(() => {
    return participants.map((p) => {
      const paid = actualExpenses
        .filter((e) => e.paid_by_participant_id === p.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const owes = totalActualExpenses / Math.max(participants.length, 1);
      const balance = paid - owes;
      return { ...p, paid, owes, balance };
    });
  }, [participants, actualExpenses, totalActualExpenses]);

  // Calculate settlements
  const settlements = useMemo(() => {
    const debtors = balances.filter((b) => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    const result: { from: string; to: string; amount: number }[] = [];
    let i = 0, j = 0;
    const debtorsCopy = debtors.map((d) => ({ ...d, remaining: Math.abs(d.balance) }));
    const creditorsCopy = creditors.map((c) => ({ ...c, remaining: c.balance }));

    while (i < debtorsCopy.length && j < creditorsCopy.length) {
      const amount = Math.min(debtorsCopy[i].remaining, creditorsCopy[j].remaining);
      if (amount > 0.01) {
        result.push({
          from: debtorsCopy[i].name,
          to: creditorsCopy[j].name,
          amount: Math.round(amount * 100) / 100,
        });
      }
      debtorsCopy[i].remaining -= amount;
      creditorsCopy[j].remaining -= amount;
      if (debtorsCopy[i].remaining < 0.01) i++;
      if (creditorsCopy[j].remaining < 0.01) j++;
    }
    return result;
  }, [balances]);

  // Filtered and sorted expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    
    if (filter === "paid") {
      filtered = filtered.filter(e => !e.is_planned);
    } else if (filter === "planned") {
      filtered = filtered.filter(e => e.is_planned);
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [expenses, filter, sort]);

  const handleAddExpense = async (data: {
    description: string;
    amount: number;
    category: string;
    paid_by_participant_id: string;
  }) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .insert([{
          event_id: event!.id,
          description: data.description,
          amount: data.amount,
          currency: event!.currency || "EUR",
          category: data.category as any,
          paid_by_participant_id: data.paid_by_participant_id,
        }]);

      if (error) throw error;

      // Refresh expenses
      const { data: refreshedData } = await supabase
        .from("expenses")
        .select("*")
        .eq("event_id", event!.id)
        .order("created_at", { ascending: false });

      if (refreshedData) {
        const mappedExpenses: Expense[] = refreshedData.map(exp => {
          const paidByParticipant = participants.find(p => p.id === exp.paid_by_participant_id);
          return {
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            currency: exp.currency,
            category: exp.category,
            paid_by: paidByParticipant?.name || t('expenses.unknown'),
            paid_by_participant_id: exp.paid_by_participant_id,
            created_at: exp.created_at,
            expense_date: exp.expense_date,
            is_planned: false,
          };
        });
        setExpenses([...mappedExpenses, ...plannedExpenses]);
      }

      toast({ title: t('common.success'), description: t('expenses.added') });
    } catch (err) {
      console.error("Error adding expense:", err);
      toast({
        title: t('common.error'),
        description: t('expenses.addError'),
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id);

      if (error) throw error;

      setExpenses(prev => prev.filter(e => e.id !== expense.id));
      toast({ title: t('common.success'), description: t('expenses.deleted') });
    } catch (err) {
      console.error("Error deleting expense:", err);
      toast({
        title: t('common.error'),
        description: t('expenses.deleteError'),
        variant: "destructive",
      });
    }
  };

  if (eventLoading || isLoadingExpenses) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </motion.div>
        </div>
      </AnimatedBackground>
    );
  }

  if (error || !event) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center px-4">
          <GlassCard className="p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">{t('expenses.notFound')}</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <GradientButton onClick={() => navigate("/")}>{t('common.back')}</GradientButton>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  const currency = event.currency || "€";

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border/50">
          <div className="container max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/e/${slug}/dashboard`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="font-display text-xl font-bold flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    {t('expenses.title')}
                  </h1>
                  <p className="text-sm text-muted-foreground">{event.name}</p>
                </div>
              </div>

              <GradientButton size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddingExpense(true)}>
                {t('common.add')}
              </GradientButton>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container max-w-5xl mx-auto px-4 py-6 space-y-8">
          {/* Stats Hero */}
          <StatsHero
            totalExpenses={totalExpenses}
            actualExpenses={totalActualExpenses}
            plannedExpenses={totalPlannedExpenses}
            perPerson={perPerson}
            participantCount={participants.length}
            currency={currency}
          />

          {/* Charts */}
          {actualExpenses.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t("expenses.analytics")}
              </h2>
              <ExpenseCharts
                expenses={expenses}
                participants={participants}
                currency={currency}
              />
            </motion.section>
          )}

          {/* Settlements */}
          {settlements.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  {t("expenses.settlements")}
                </h2>
                <SettlementList settlements={settlements} currency={currency} />
              </GlassCard>
            </motion.section>
          )}

          {/* Expense List */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6">
              <h2 className="font-display text-lg font-semibold mb-4">{t("expenses.allExpenses")}</h2>
              
              <ExpenseFilters
                filter={filter}
                sort={sort}
                onFilterChange={setFilter}
                onSortChange={setSort}
                counts={{
                  all: expenses.length,
                  paid: actualExpenses.length,
                  planned: plannedExpenses.length,
                }}
              />

              <div className="divide-y divide-border/30">
                <AnimatePresence mode="popLayout">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense, index) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        index={index}
                        onDelete={!expense.is_planned ? handleDeleteExpense : undefined}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center"
                    >
                      <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">{t("expenses.noExpenses")}</p>
                      <GradientButton
                        size="sm"
                        className="mt-4"
                        onClick={() => setIsAddingExpense(true)}
                        icon={<Plus className="w-4 h-4" />}
                      >
                        {t("expenses.addFirst")}
                      </GradientButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.section>
        </main>

        {/* Add Expense Dialog */}
        <AddExpenseDialog
          open={isAddingExpense}
          onOpenChange={setIsAddingExpense}
          participants={participants}
          currency={currency}
          onAdd={handleAddExpense}
        />
      </div>
    </AnimatedBackground>
  );
};

export default EventExpenses;
