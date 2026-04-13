import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ChevronRight, ChevronDown, CheckCircle2, Clock, TrendingUp, TrendingDown,
  SlidersHorizontal, BarChart3, Link2, Download, AlertTriangle, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useBudgetItems, BudgetItem } from "@/hooks/useBudgetItems";

function formatCurrency(val: number): string {
  return "\u20AC" + val.toLocaleString("de-DE");
}

function getDiffColor(diff: number): string {
  if (diff > 0) return "text-emerald-400";
  if (diff < 0) return "text-red-400";
  return "text-white/40";
}

function getHealthColor(pct: number): string {
  if (pct <= 70) return "text-emerald-400";
  if (pct <= 90) return "text-amber-400";
  return "text-red-400";
}

export function AgencyBudgetEngine() {
  const { t } = useTranslation();
  const { user } = useAuthContext();

  // Event selector
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setEventsLoading(true);
      const { data } = await supabase.from("events").select("id, name").eq("created_by", user.id).order("created_at", { ascending: false });
      setEvents(data || []);
      if (data && data.length > 0 && !selectedEventId) setSelectedEventId(data[0].id);
      setEventsLoading(false);
    })();
  }, [user]);

  const { items, summary, isLoading, createItem, updateItem, deleteItem, approveItem } = useBudgetItems(selectedEventId);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [guestCount, setGuestCount] = useState([200]);
  const [showScenario, setShowScenario] = useState(false);

  // Add Item dialog
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({ category: "", description: "", planned_amount: "", quoted_amount: "", actual_amount: "", notes: "" });

  const handleCreateItem = async () => {
    if (!newItem.category || !newItem.planned_amount) return;
    await createItem({
      category: newItem.category,
      description: newItem.description || undefined,
      planned_amount: parseFloat(newItem.planned_amount),
      quoted_amount: newItem.quoted_amount ? parseFloat(newItem.quoted_amount) : undefined,
      actual_amount: newItem.actual_amount ? parseFloat(newItem.actual_amount) : undefined,
      notes: newItem.notes || undefined,
    });
    setNewItem({ category: "", description: "", planned_amount: "", quoted_amount: "", actual_amount: "", notes: "" });
    setAddItemOpen(false);
  };

  // Group items by category
  const categoryGroups = useMemo(() => {
    const groups: Record<string, BudgetItem[]> = {};
    for (const item of items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [items]);

  const budgetUsedPct = summary.totalPlanned > 0 ? Math.round((summary.totalActual / summary.totalPlanned) * 100) : 0;
  const budgetQuotedPct = summary.totalPlanned > 0 ? Math.round((summary.totalQuoted / summary.totalPlanned) * 100) : 0;
  const scaleFactor = guestCount[0] / 200;

  const toggleCategory = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-4">
      {/* Event Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-full max-w-xs bg-white/5 border-white/10 text-white">
            <SelectValue placeholder={eventsLoading ? "Loading..." : "Event wählen..."} />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </motion.div>

      {!selectedEventId ? (
        <div className="text-center py-12 text-white/40">Bitte wähle ein Event aus.</div>
      ) : (
        <>
          {/* Summary Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5">
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Gesamtbudget</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalPlanned)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Angeboten</p>
                <p className="text-2xl font-bold text-cyan-400">{formatCurrency(summary.totalQuoted)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Bezahlt</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.totalActual)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Verbleibend</p>
                <p className={`text-2xl font-bold ${getHealthColor(budgetUsedPct)}`}>{formatCurrency(summary.totalPlanned - summary.totalActual)}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white/60 gap-1.5" onClick={() => setShowScenario(!showScenario)}>
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Szenario
                </Button>
                <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"><Plus className="w-3.5 h-3.5" /> Position</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
                    <DialogHeader><DialogTitle>Budget-Position hinzufügen</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-2">
                      <div><Label className="text-white/60 text-xs">Kategorie</Label>
                        <Select value={newItem.category} onValueChange={(v) => setNewItem((p) => ({ ...p, category: v }))}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Kategorie..." /></SelectTrigger>
                          <SelectContent>
                            {["Venue / Location", "Catering", "Technik", "Personal", "Marketing", "Sonstiges"].map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-white/60 text-xs">Beschreibung</Label><Input value={newItem.description} onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label className="text-white/60 text-xs">Geplant</Label><Input type="number" value={newItem.planned_amount} onChange={(e) => setNewItem((p) => ({ ...p, planned_amount: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                        <div><Label className="text-white/60 text-xs">Angeboten</Label><Input type="number" value={newItem.quoted_amount} onChange={(e) => setNewItem((p) => ({ ...p, quoted_amount: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                        <div><Label className="text-white/60 text-xs">Bezahlt</Label><Input type="number" value={newItem.actual_amount} onChange={(e) => setNewItem((p) => ({ ...p, actual_amount: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                      </div>
                      <div><Label className="text-white/60 text-xs">Notizen</Label><Textarea value={newItem.notes} onChange={(e) => setNewItem((p) => ({ ...p, notes: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={2} /></div>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreateItem}>Hinzufügen</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>Bezahlt ({budgetUsedPct}%)</span>
                <span>Angeboten ({budgetQuotedPct}%)</span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-cyan-500/40 rounded-full transition-all" style={{ width: `${budgetQuotedPct}%` }} />
                <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all" style={{ width: `${budgetUsedPct}%` }} />
              </div>
            </div>
          </motion.div>

          {/* Scenario Planning */}
          {showScenario && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-violet-500/5 backdrop-blur-lg border border-violet-500/20 rounded-xl p-5">
              <h4 className="text-sm font-medium text-violet-300 mb-3 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Szenarioplanung</h4>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-2">Gästezahl anpassen: <span className="text-white font-medium">{guestCount[0]} Gäste</span></p>
                  <Slider value={guestCount} onValueChange={setGuestCount} min={50} max={500} step={10} className="w-full" />
                  <div className="flex justify-between text-[10px] text-white/30 mt-1">
                    <span>50</span><span>200 (aktuell)</span><span>500</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center min-w-[140px]">
                  <p className="text-[10px] text-white/40">Hochgerechnetes Budget</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(Math.round(summary.totalPlanned * scaleFactor))}</p>
                  <p className={`text-xs ${scaleFactor > 1 ? "text-red-400" : "text-emerald-400"}`}>
                    {scaleFactor > 1 ? "+" : ""}{formatCurrency(Math.round(summary.totalPlanned * scaleFactor - summary.totalPlanned))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Budget by Category */}
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-20 bg-white/5" /><Skeleton className="h-20 bg-white/5" /></div>
          ) : Object.keys(categoryGroups).length === 0 ? (
            <div className="text-center py-12 text-white/40">Keine Budget-Positionen. Fuege die erste Position hinzu.</div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
              {Object.entries(categoryGroups).map(([category, catItems]) => {
                const catPlanned = catItems.reduce((s, i) => s + (i.planned_amount || 0), 0);
                const catQuoted = catItems.reduce((s, i) => s + (i.quoted_amount || 0), 0);
                const catActual = catItems.reduce((s, i) => s + (i.actual_amount || 0), 0);
                const isOpen = expanded[category];
                const catDiff = catPlanned - catActual;
                const catPct = catPlanned > 0 ? Math.round((catActual / catPlanned) * 100) : 0;

                return (
                  <div key={category} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                    <button onClick={() => toggleCategory(category)} className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">{category.charAt(0)}</div>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
                      <span className="text-sm font-medium text-white flex-1 text-left">{category}</span>
                      <div className="hidden sm:flex items-center gap-6 text-xs">
                        <span className="text-white/50 w-24 text-right">{formatCurrency(catPlanned)}</span>
                        <span className="text-cyan-400 w-24 text-right">{formatCurrency(catQuoted)}</span>
                        <span className="text-white w-24 text-right">{formatCurrency(catActual)}</span>
                        <span className={`w-24 text-right ${getDiffColor(catDiff)}`}>{catDiff >= 0 ? "+" : ""}{formatCurrency(catDiff)}</span>
                      </div>
                      <div className="w-20"><Progress value={catPct} className="h-1.5 bg-white/10" /></div>
                    </button>
                    {isOpen && (
                      <div className="bg-white/[0.02] border-t border-white/5">
                        {catItems.map((item) => {
                          const itemDiff = (item.planned_amount || 0) - (item.actual_amount || 0);
                          return (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 pl-16 border-t border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.is_approved ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <button onClick={() => approveItem(item.id)} className="hover:text-emerald-400 text-amber-400">
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <span className="text-xs text-white/60 flex-1">{item.description || item.category}</span>
                              <div className="hidden sm:flex items-center gap-6 text-[11px]">
                                <span className="text-white/40 w-24 text-right">{formatCurrency(item.planned_amount)}</span>
                                <span className="text-cyan-400/70 w-24 text-right">{formatCurrency(item.quoted_amount || 0)}</span>
                                <span className="text-white/60 w-24 text-right">{formatCurrency(item.actual_amount || 0)}</span>
                                <span className={`w-24 text-right ${getDiffColor(itemDiff)}`}>{itemDiff >= 0 ? "+" : ""}{formatCurrency(itemDiff)}</span>
                              </div>
                              <div className="w-20" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
