import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const categories = [
  { value: "transport", label: "Transport", icon: Car, emoji: "🚗" },
  { value: "accommodation", label: "Accommodation", icon: Home, emoji: "🏨" },
  { value: "activities", label: "Activities", icon: Target, emoji: "🎯" },
  { value: "food", label: "Food", icon: Utensils, emoji: "🍔" },
  { value: "drinks", label: "Drinks", icon: Beer, emoji: "🍻" },
  { value: "gifts", label: "Gifts", icon: Gift, emoji: "🎁" },
  { value: "other", label: "Other", icon: Wallet, emoji: "💰" },
];

// Mock expenses for demo - in production these come from DB
const mockExpenses = [
  {
    id: "1",
    description: "Car rental",
    amount: 250,
    currency: "EUR",
    category: "transport",
    paid_by: "Luca",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    description: "Airbnb apartment",
    amount: 480,
    currency: "EUR",
    category: "accommodation",
    paid_by: "Daniel",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    description: "Beer & drinks",
    amount: 85,
    currency: "EUR",
    category: "drinks",
    paid_by: "Marc",
    created_at: new Date().toISOString(),
  },
];

const EventExpenses = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event, participants, isLoading, error } = useEvent(slug);
  const [expenses, setExpenses] = useState(mockExpenses);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "other",
    paid_by: "",
  });

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading expenses...</p>
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
            <h1 className="font-display text-2xl font-bold mb-2">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <GradientButton onClick={() => navigate("/")}>Go Home</GradientButton>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = totalExpenses / Math.max(participants.length, 1);

  // Calculate balances
  const balances = participants.map((p) => {
    const paid = expenses.filter((e) => e.paid_by === p.name).reduce((sum, e) => sum + e.amount, 0);
    const owes = perPerson;
    const balance = paid - owes;
    return { ...p, paid, owes, balance };
  });

  // Calculate settlements (simplified)
  const debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);

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

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paid_by) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      currency: event.currency || "EUR",
      category: newExpense.category,
      paid_by: newExpense.paid_by,
      created_at: new Date().toISOString(),
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({ description: "", amount: "", category: "other", paid_by: "" });
    setIsAddingExpense(false);
    toast({ title: "Expense added!", description: `${expense.description} - €${expense.amount}` });
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
                  <h1 className="font-display text-xl font-bold">Expenses</h1>
                  <p className="text-sm text-muted-foreground">{event.name}</p>
                </div>
              </div>

              <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
                <DialogTrigger asChild>
                  <GradientButton size="sm" icon={<Plus className="w-4 h-4" />}>
                    Add
                  </GradientButton>
                </DialogTrigger>
                <DialogContent className="glass-card border-border/50">
                  <DialogHeader>
                    <DialogTitle className="font-display">Add Expense</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g., Car rental"
                        value={newExpense.description}
                        onChange={(e) =>
                          setNewExpense({ ...newExpense, description: e.target.value })
                        }
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label>Amount (€)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
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
                              {cat.emoji} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Paid by</Label>
                      <Select
                        value={newExpense.paid_by}
                        onValueChange={(v) => setNewExpense({ ...newExpense, paid_by: v })}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                        <SelectContent>
                          {participants.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <GradientButton className="w-full" onClick={handleAddExpense}>
                      Add Expense
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold text-gradient-primary">
                €{totalExpenses.toFixed(2)}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Per Person</p>
              <p className="text-2xl font-bold">€{perPerson.toFixed(2)}</p>
            </GlassCard>
            <GlassCard className="p-4 col-span-2 md:col-span-1">
              <p className="text-sm text-muted-foreground mb-1">Participants</p>
              <p className="text-2xl font-bold">{participants.length}</p>
            </GlassCard>
          </div>

          {/* Balances */}
          <GlassCard className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">Balances</h3>
            <div className="space-y-3">
              {balances.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">Paid €{b.paid.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`flex items-center gap-1 font-bold ${
                        b.balance > 0
                          ? "text-green-400"
                          : b.balance < 0
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {b.balance > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : b.balance < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Equal className="w-4 h-4" />
                      )}
                      €{Math.abs(b.balance).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {b.balance > 0 ? "gets back" : b.balance < 0 ? "owes" : "settled"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Settlements */}
          {settlements.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-bold mb-4">Settle Up</h3>
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
            <h3 className="font-display text-lg font-bold mb-4">All Expenses</h3>
            <div className="space-y-3">
              {expenses.map((expense) => {
                const cat = getCategoryInfo(expense.category);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.emoji}</span>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Paid by {expense.paid_by}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold">€{expense.amount.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </main>
      </div>
    </AnimatedBackground>
  );
};

export default EventExpenses;
