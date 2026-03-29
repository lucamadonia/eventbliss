import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, Receipt, Wallet, Loader2, Trash2, Users, PieChart, Filter, Download,
  Car, Home, Utensils, Wine, Gift, Sparkles, MoreVertical, Edit2,
  CheckCircle2, Circle, ChevronDown, ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { EventData, Participant } from "@/hooks/useEvent";

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paid_by_participant_id: string | null;
  expense_date: string;
  created_at: string;
  deleted_at: string | null;
}

interface ExpenseShare {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
}

interface ExpensesTabProps {
  event: EventData;
  participants: Participant[];
}

const CATEGORIES = [
  { key: "transport", icon: Car, color: "text-blue-400", bg: "bg-blue-500/20" },
  { key: "accommodation", icon: Home, color: "text-purple-400", bg: "bg-purple-500/20" },
  { key: "activities", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/20" },
  { key: "food", icon: Utensils, color: "text-orange-400", bg: "bg-orange-500/20" },
  { key: "drinks", icon: Wine, color: "text-pink-400", bg: "bg-pink-500/20" },
  { key: "gifts", icon: Gift, color: "text-green-400", bg: "bg-green-500/20" },
  { key: "other", icon: Receipt, color: "text-slate-400", bg: "bg-slate-500/20" },
];

const getCategoryConfig = (key: string) => CATEGORIES.find(c => c.key === key) || CATEGORIES[6];

export const ExpensesTab = ({ event, participants }: ExpensesTabProps) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shares, setShares] = useState<ExpenseShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [paidBy, setPaidBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const currency = event.currency || "EUR";

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-expenses?event_id=${event.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(session.data.session ? { "Authorization": `Bearer ${session.data.session.access_token}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (data.expenses) {
        setExpenses(data.expenses.filter((e: Expense) => !e.deleted_at) || []);
        setShares(data.shares || []);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (event?.id) fetchExpenses(); }, [event?.id]);

  // Computed stats
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const confirmedParticipants = useMemo(
    () => participants.filter(p => p.status === "confirmed" || p.role === "organizer"),
    [participants]
  );
  const perPerson = confirmedParticipants.length > 0 ? totalExpenses / confirmedParticipants.length : 0;

  // Payment tracking
  const totalPaid = useMemo(() => shares.filter(s => s.is_paid).reduce((sum, s) => sum + s.amount, 0), [shares]);
  const totalOpen = useMemo(() => shares.filter(s => !s.is_paid).reduce((sum, s) => sum + s.amount, 0), [shares]);
  const paidPercent = shares.length > 0 ? (shares.filter(s => s.is_paid).length / shares.length) * 100 : 0;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries())
      .map(([key, total]) => ({ key, total, percent: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, totalExpenses]);

  // Balances per person
  const balances = useMemo(() => {
    const paid = new Map<string, number>();
    const owes = new Map<string, number>();
    expenses.forEach(e => {
      if (e.paid_by_participant_id) paid.set(e.paid_by_participant_id, (paid.get(e.paid_by_participant_id) || 0) + e.amount);
    });
    shares.forEach(s => {
      owes.set(s.participant_id, (owes.get(s.participant_id) || 0) + s.amount);
    });
    return confirmedParticipants.map(p => {
      const paidAmount = paid.get(p.id) || 0;
      const owedAmount = owes.get(p.id) || (perPerson);
      const paidShares = shares.filter(s => s.participant_id === p.id && s.is_paid).length;
      const totalShares = shares.filter(s => s.participant_id === p.id).length;
      return { id: p.id, name: p.name, paid: paidAmount, owes: owedAmount, balance: paidAmount - owedAmount, paidShares, totalShares };
    }).sort((a, b) => b.balance - a.balance);
  }, [expenses, shares, confirmedParticipants, perPerson]);

  // Settlement transfers: who pays whom
  const settlements = useMemo(() => {
    const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b, remaining: Math.abs(b.balance) }));
    const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b, remaining: b.balance }));
    const transfers: { from: string; fromName: string; to: string; toName: string; amount: number; settled: boolean }[] = [];

    for (const debtor of debtors) {
      for (const creditor of creditors) {
        if (debtor.remaining <= 0 || creditor.remaining <= 0) continue;
        const amount = Math.min(debtor.remaining, creditor.remaining);
        if (amount < 0.01) continue;
        // Check if all shares from debtor are marked as paid
        const debtorShares = shares.filter(s => s.participant_id === debtor.id);
        const allPaid = debtorShares.length > 0 && debtorShares.every(s => s.is_paid);
        transfers.push({
          from: debtor.id, fromName: debtor.name,
          to: creditor.id, toName: creditor.name,
          amount: Math.round(amount * 100) / 100,
          settled: allPaid,
        });
        debtor.remaining -= amount;
        creditor.remaining -= amount;
      }
    }
    return transfers;
  }, [balances, shares]);

  const handleSettleTransfer = async (fromId: string, settle: boolean) => {
    // Mark all expense_shares of this person as paid/unpaid
    const personShares = shares.filter(s => s.participant_id === fromId);
    for (const share of personShares) {
      await supabase.from("expense_shares")
        .update({ is_paid: settle, paid_at: settle ? new Date().toISOString() : null } as any)
        .eq("id", share.id);
    }
    toast.success(settle ? t("expenses.transferSettled", "Transfer marked as paid") : t("expenses.transferUnsettled", "Transfer marked as unpaid"));
    fetchExpenses();
  };

  const filteredExpenses = useMemo(
    () => filterCategory === "all" ? expenses : expenses.filter(e => e.category === filterCategory),
    [expenses, filterCategory]
  );

  const getSharesForExpense = (expenseId: string) => shares.filter(s => s.expense_id === expenseId);

  const handleMarkPaid = async (shareId: string, isPaid: boolean) => {
    const { error } = await supabase.from("expense_shares")
      .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null } as any)
      .eq("id", shareId);
    if (error) { toast.error(error.message); return; }
    toast.success(isPaid ? t("expenses.markedPaid", "Marked as paid") : t("expenses.markedUnpaid", "Marked as unpaid"));
    fetchExpenses();
  };

  const openAddDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setPaidBy(expense.paid_by_participant_id || "");
    } else {
      setEditingExpense(null);
      setDescription(""); setAmount(""); setCategory("other"); setPaidBy("");
    }
    setAddDialogOpen(true);
  };

  const handleSave = async () => {
    if (!description.trim() || !amount || !user) return;
    setSaving(true);
    try {
      if (editingExpense) {
        const { error } = await supabase.from("expenses").update({
          description: description.trim(), amount: parseFloat(amount), category,
          paid_by_participant_id: paidBy || null,
        } as any).eq("id", editingExpense.id);
        if (error) throw error;
        toast.success(t("expenses.updated", "Expense updated"));
      } else {
        const parsedAmount = parseFloat(amount);
        const { data: newExpense, error } = await supabase.from("expenses").insert({
          event_id: event.id, description: description.trim(), amount: parsedAmount,
          currency, category, paid_by_participant_id: paidBy || null, split_type: "equal",
        } as any).select().single();
        if (error) throw error;
        // Auto-create expense_shares for all confirmed participants
        if (newExpense && confirmedParticipants.length > 0) {
          const shareAmount = parsedAmount / confirmedParticipants.length;
          const shareRows = confirmedParticipants.map(p => ({
            expense_id: newExpense.id,
            participant_id: p.id,
            amount: Math.round(shareAmount * 100) / 100,
            is_paid: p.id === paidBy, // Auto-mark payer as paid
          }));
          await supabase.from("expense_shares").insert(shareRows as any);
        }
        toast.success(t("expenses.added", "Expense added"));
      }
      setAddDialogOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses")
      .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("expenses.deleted", "Expense deleted"));
    fetchExpenses();
  };

  const getParticipantName = (id: string | null) => {
    if (!id) return "—";
    return participants.find(p => p.id === id)?.name || "Unknown";
  };
  const getCategoryLabel = (cat: string) => t(`expenses.categories.${cat}`, cat);

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("expenses.totalExpenses", "Total"), value: totalExpenses, icon: Wallet, color: "violet", glow: "bg-violet-500/10" },
          { label: t("expenses.perPerson", "Per Person"), value: perPerson, icon: Users, color: "cyan", glow: "bg-cyan-500/10", sub: `${confirmedParticipants.length} ${t("expenses.participants", "Teilnehmer")}` },
          { label: t("expenses.openAmount", "Open"), value: totalOpen, icon: Circle, color: "amber", glow: "bg-amber-500/10", sub: `${(100 - paidPercent).toFixed(0)}% ${t("expenses.open", "offen")}` },
          { label: t("expenses.paidAmount", "Paid"), value: totalPaid, icon: CheckCircle2, color: "green", glow: "bg-green-500/10", sub: `${paidPercent.toFixed(0)}% ${t("expenses.settled", "beglichen")}` },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.glow} rounded-full blur-2xl -translate-y-8 translate-x-8`} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-xl bg-${stat.color}-500/20`}><stat.icon className={`h-4 w-4 text-${stat.color}-400`} /></div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{stat.value.toLocaleString("de-DE", { minimumFractionDigits: 2 })} <span className="text-sm text-slate-400">{currency}</span></p>
                {stat.sub && <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Payment Progress Bar */}
      {totalExpenses > 0 && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">{t("expenses.paymentProgress", "Payment Progress")}</span>
            <span className="text-sm font-medium text-slate-200">{paidPercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full bg-white/5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${paidPercent}%` }} transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{t("expenses.paidAmount", "Bezahlt")}: {totalPaid.toFixed(2)} {currency}</span>
            <span>{t("expenses.openAmount", "Offen")}: {totalOpen.toFixed(2)} {currency}</span>
          </div>
        </GlassCard>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">{t("expenses.breakdown", "Category Breakdown")}</h3>
          <div className="h-4 rounded-full overflow-hidden flex bg-white/5 mb-4">
            {categoryBreakdown.map((cat, i) => {
              const colors = ["bg-violet-500", "bg-cyan-500", "bg-amber-500", "bg-orange-500", "bg-pink-500", "bg-green-500", "bg-slate-500"];
              return (
                <motion.div key={cat.key} initial={{ width: 0 }} animate={{ width: `${cat.percent}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                  className={`${colors[i % colors.length]} first:rounded-l-full last:rounded-r-full`} />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {categoryBreakdown.map((cat, i) => {
              const config = getCategoryConfig(cat.key);
              const Icon = config.icon;
              const colors = ["bg-violet-500", "bg-cyan-500", "bg-amber-500", "bg-orange-500", "bg-pink-500", "bg-green-500", "bg-slate-500"];
              return (
                <button key={cat.key} onClick={() => setFilterCategory(filterCategory === cat.key ? "all" : cat.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${filterCategory === cat.key ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                  <Icon className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-300">{getCategoryLabel(cat.key)}</span>
                  <span className="text-slate-500">{cat.total.toFixed(0)} {currency}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Settlement Transfers — Who Pays Whom */}
      {settlements.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">{t("expenses.settlement", "Ausgleich")}</h3>
          <div className="space-y-3">
            {settlements.map((transfer, i) => (
              <motion.div key={`${transfer.from}-${transfer.to}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${transfer.settled ? "bg-green-500/5 border border-green-500/20" : "bg-white/[0.03] border border-white/[0.06]"}`}>
                {/* From avatar */}
                <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-300 flex-shrink-0">
                  {transfer.fromName.charAt(0)}
                </div>
                {/* Arrow */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-[10px] text-slate-500">{t("expenses.owes", "schuldet")}</span>
                  <svg width="24" height="12" viewBox="0 0 24 12" className="text-slate-500"><path d="M0 6h20m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                </div>
                {/* To avatar */}
                <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-300 flex-shrink-0">
                  {transfer.toName.charAt(0)}
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className={`font-medium ${transfer.settled ? "text-slate-500 line-through" : "text-slate-200"}`}>{transfer.fromName}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className={`font-medium ${transfer.settled ? "text-slate-500 line-through" : "text-slate-200"}`}>{transfer.toName}</span>
                  </p>
                  <p className={`text-lg font-bold tabular-nums ${transfer.settled ? "text-green-400/60 line-through" : "text-white"}`}>
                    {transfer.amount.toFixed(2)} {currency}
                  </p>
                </div>
                {/* Settle button */}
                {user && (
                  <Button
                    variant={transfer.settled ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleSettleTransfer(transfer.from, !transfer.settled)}
                    className={`flex-shrink-0 cursor-pointer gap-1.5 ${transfer.settled ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : ""}`}
                  >
                    {transfer.settled ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    {transfer.settled ? t("expenses.settled", "Bezahlt") : t("expenses.markPaid", "Bezahlt")}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {user && <GradientButton onClick={() => openAddDialog()} icon={<Plus className="h-4 w-4" />}>{t("expenses.addExpense", "Add Expense")}</GradientButton>}
          {filterCategory !== "all" && (
            <Button variant="outline" size="sm" onClick={() => setFilterCategory("all")} className="gap-1 cursor-pointer">
              <Filter className="h-3 w-3" />{getCategoryLabel(filterCategory)}<span className="text-xs text-muted-foreground">×</span>
            </Button>
          )}
        </div>
      </div>

      {/* Expenses List with Payment Tracking */}
      {filteredExpenses.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4"><Receipt className="h-8 w-8 text-slate-500" /></div>
          <p className="text-slate-400 font-medium">{t("expenses.noExpenses", "No expenses yet")}</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredExpenses.map((expense, i) => {
              const config = getCategoryConfig(expense.category);
              const Icon = config.icon;
              const expenseShares = getSharesForExpense(expense.id);
              const paidCount = expenseShares.filter(s => s.is_paid).length;
              const isExpanded = expandedExpense === expense.id;
              return (
                <motion.div key={expense.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.02 }} layout>
                  <GlassCard className="overflow-hidden">
                    {/* Main Row */}
                    <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}>
                      <div className={`p-2.5 rounded-xl ${config.bg} flex-shrink-0`}><Icon className={`h-5 w-5 ${config.color}`} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200 truncate">{expense.description}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10 text-slate-400">{getCategoryLabel(expense.category)}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {getParticipantName(expense.paid_by_participant_id)}
                          {expenseShares.length > 0 && ` · ${paidCount}/${expenseShares.length} ${t("expenses.settled", "bezahlt")}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-semibold text-white tabular-nums">
                          {expense.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                          <span className="text-xs text-slate-400 ml-1">{expense.currency}</span>
                        </p>
                        {expenseShares.length > 0 && (
                          <div className="h-1 w-16 rounded-full bg-white/5 mt-1 ml-auto">
                            <div className="h-full rounded-full bg-green-500/60" style={{ width: `${(paidCount / expenseShares.length) * 100}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                        {user && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openAddDialog(expense)} className="cursor-pointer"><Edit2 className="h-4 w-4 mr-2" />{t("common.edit", "Edit")}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-red-400 cursor-pointer"><Trash2 className="h-4 w-4 mr-2" />{t("common.delete", "Delete")}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {/* Expanded: Payment Tracking per Person */}
                    <AnimatePresence>
                      {isExpanded && expenseShares.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">{t("expenses.paymentStatus", "Payment Status")}</p>
                            {expenseShares.map(share => (
                              <div key={share.id} className="flex items-center justify-between py-1.5">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => user && handleMarkPaid(share.id, !share.is_paid)}
                                    className={`cursor-pointer transition-colors ${!user ? "cursor-default" : ""}`}
                                    disabled={!user}
                                  >
                                    {share.is_paid
                                      ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                                      : <Circle className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                                    }
                                  </button>
                                  <span className={`text-sm ${share.is_paid ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                    {getParticipantName(share.participant_id)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm tabular-nums ${share.is_paid ? "text-green-400" : "text-slate-300"}`}>
                                    {share.amount.toFixed(2)} {currency}
                                  </span>
                                  {share.is_paid && share.paid_at && (
                                    <span className="text-[10px] text-slate-500">{new Date(share.paid_at).toLocaleDateString("de-DE")}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? t("expenses.editExpense", "Edit") : t("expenses.addExpense", "Add Expense")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t("expenses.description", "Description")}</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder={t("expenses.descriptionPlaceholder", "e.g., Restaurant, Taxi...")} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t("expenses.amount", "Amount")} ({currency})</Label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t("expenses.category", "Category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => {
                      const CatIcon = c.icon;
                      return <SelectItem key={c.key} value={c.key}><span className="flex items-center gap-2"><CatIcon className={`h-3.5 w-3.5 ${c.color}`} />{getCategoryLabel(c.key)}</span></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t("expenses.paidBy", "Paid by")}</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger><SelectValue placeholder={t("expenses.selectPerson", "Select person")} /></SelectTrigger>
                <SelectContent>{participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={!description.trim() || !amount || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingExpense ? t("common.save", "Save") : t("expenses.addExpense", "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
