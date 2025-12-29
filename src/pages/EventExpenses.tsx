import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Wallet,
  Car,
  Home,
  Utensils,
  Beer,
  Gift,
  Target,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Equal,
  Calendar,
} from "lucide-react";
import { useEvent } from "@/hooks/useEvent";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  { value: "transport", label: "Transport", icon: Car, emoji: "🚗" },
  { value: "accommodation", label: "Accommodation", icon: Home, emoji: "🏨" },
  { value: "activities", label: "Activities", icon: Target, emoji: "🎯" },
  { value: "food", label: "Food", icon: Utensils, emoji: "🍔" },
  { value: "drinks", label: "Drinks", icon: Beer, emoji: "🍻" },
  { value: "gifts", label: "Gifts", icon: Gift, emoji: "🎁" },
  { value: "other", label: "Other", icon: Wallet, emoji: "💰" },
];

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
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "other",
    paid_by: "",
  });

  // Fetch expenses from database
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!event?.id) return;
      
      setIsLoadingExpenses(true);
      try {
        // Fetch expenses from expenses table
        const { data: expensesData, error: expensesError } = await supabase
          .from("expenses")
          .select("*")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false });

        if (expensesError) throw expensesError;

        // Fetch planned costs from schedule_activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("schedule_activities")
          .select("id, title, estimated_cost, currency, category, day_date")
          .eq("event_id", event.id)
          .not("estimated_cost", "is", null);

        if (activitiesError) throw activitiesError;

        // Map expenses with participant names
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

        // Add planned activities as separate entries (marked as planned)
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

  // Separate actual vs planned expenses
  const actualExpenses = expenses.filter(e => !e.is_planned);
  const plannedExpenses = expenses.filter(e => e.is_planned);
  
  const totalActualExpenses = actualExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPlannedExpenses = plannedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = totalActualExpenses + totalPlannedExpenses;
  const perPerson = totalExpenses / Math.max(participants.length, 1);

  // Calculate balances based on actual expenses only
  const balances = participants.map((p) => {
    const paid = actualExpenses
      .filter((e) => e.paid_by_participant_id === p.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const owes = totalActualExpenses / Math.max(participants.length, 1);
    const balance = paid - owes;
    return { ...p, paid, owes, balance };
  });

  // Calculate settlements (simplified)
  const debtors = balances.filter((b) => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

  const settlements: { from: string; to: string; amount: number }[] = [];
  let i = 0,
    j = 0;
  const debtorsCopy = debtors.map((d) => ({ ...d, remaining: Math.abs(d.balance) }));
  const creditorsCopy = creditors.map((c) => ({ ...c, remaining: c.balance }));

  while (i < debtorsCopy.length && j < creditorsCopy.length) {
    const amount = Math.min(debtorsCopy[i].remaining, creditorsCopy[j].remaining);
    if (amount > 0.01) {
      settlements.push({
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

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paid_by) {
      toast({
        title: t('expenses.missingFields'),
        description: t('expenses.fillRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("expenses")
        .insert([{
          event_id: event.id,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          currency: event.currency || "EUR",
          category: newExpense.category as any,
          paid_by_participant_id: newExpense.paid_by,
        }]);

      if (error) throw error;

      // Refresh expenses
      const { data: refreshedData } = await supabase
        .from("expenses")
        .select("*")
        .eq("event_id", event.id)
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

      setNewExpense({ description: "", amount: "", category: "other", paid_by: "" });
      setIsAddingExpense(false);
      toast({ title: t('common.success'), description: t('expenses.added') });
    } catch (err) {
      console.error("Error adding expense:", err);
      toast({
        title: t('common.error'),
        description: t('expenses.addError'),
        variant: "destructive",
      });
    }
  };

  const getCategoryInfo = (category: string) => {
    return categories.find((c) => c.value === category) || categories[6];
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border/50">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/e/${slug}/dashboard`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="font-display text-xl font-bold">{t('expenses.title')}</h1>
                  <p className="text-sm text-muted-foreground">{event.name}</p>
                </div>
              </div>

              <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
                <DialogTrigger asChild>
                  <GradientButton size="sm" icon={<Plus className="w-4 h-4" />}>
                    {t('common.add')}
                  </GradientButton>
                </DialogTrigger>
                <DialogContent className="glass-card border-border/50">
                  <DialogHeader>
                    <DialogTitle className="font-display">{t('expenses.addExpense')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>{t('expenses.description')}</Label>
                      <Input
                        placeholder={t('expenses.descriptionPlaceholder')}
                        value={newExpense.description}
                        onChange={(e) =>
                          setNewExpense({ ...newExpense, description: e.target.value })
                        }
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label>{t('expenses.amount')} ({event.currency || 'EUR'})</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label>{t('expenses.category')}</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.emoji} {t(`expenses.categories.${cat.value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('expenses.paidBy')}</Label>
                      <Select
                        value={newExpense.paid_by}
                        onValueChange={(v) => setNewExpense({ ...newExpense, paid_by: v })}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder={t('expenses.selectPerson')} />
                        </SelectTrigger>
                        <SelectContent>
                          {participants.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <GradientButton className="w-full" onClick={handleAddExpense}>
                      {t('expenses.addExpense')}
                    </GradientButton>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('expenses.totalAmount')}</p>
              <p className="text-2xl font-bold text-gradient-primary">
                €{totalExpenses.toFixed(2)}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('expenses.actualPaid')}</p>
              <p className="text-2xl font-bold text-green-500">
                €{totalActualExpenses.toFixed(2)}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('expenses.plannedCosts')}</p>
              <p className="text-2xl font-bold text-orange-500">
                €{totalPlannedExpenses.toFixed(2)}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('expenses.perPerson')}</p>
              <p className="text-2xl font-bold">€{perPerson.toFixed(2)}</p>
            </GlassCard>
          </div>

          {/* Balances */}
          {balances.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-bold mb-4">{t('expenses.balances')}</h3>
              <div className="space-y-3">
                {balances.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{b.name}</p>
                        <p className="text-sm text-muted-foreground">{t('expenses.paid')} €{b.paid.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`flex items-center gap-1 font-bold ${
                          b.balance > 0.01
                            ? "text-green-400"
                            : b.balance < -0.01
                            ? "text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {b.balance > 0.01 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : b.balance < -0.01 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <Equal className="w-4 h-4" />
                        )}
                        €{Math.abs(b.balance).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {b.balance > 0.01 ? t('expenses.getsBack') : b.balance < -0.01 ? t('expenses.owes') : t('expenses.settled')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Settlements */}
          {settlements.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-bold mb-4">{t('expenses.settleUp')}</h3>
              <div className="space-y-3">
                {settlements.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{s.to}</span>
                    </div>
                    <span className="font-bold text-primary">€{s.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Expenses List */}
          <GlassCard className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">{t('expenses.allExpenses')}</h3>
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('expenses.noExpenses')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => {
                  const cat = getCategoryInfo(expense.category);
                  return (
                    <div
                      key={expense.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        expense.is_planned ? "bg-orange-500/10 border border-orange-500/20" : "bg-background/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{expense.description}</p>
                            {expense.is_planned && (
                              <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {t('expenses.planned')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {expense.is_planned 
                              ? expense.expense_date 
                              : `${t('expenses.paidBy')} ${expense.paid_by}`}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold ${expense.is_planned ? 'text-orange-500' : ''}`}>
                        €{expense.amount.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </main>
      </div>
    </AnimatedBackground>
  );
};

export default EventExpenses;
