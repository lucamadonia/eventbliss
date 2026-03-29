import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, CheckCircle2, Circle, AlertCircle, Plus, Users, DollarSign,
  StickyNote, Briefcase, LayoutList, ArrowLeft, MoreHorizontal, GripVertical,
  ArrowRight, Diamond, Download, Mail, Star as StarIcon, Eye, Activity, Send,
  ChevronDown, ChevronUp, Gauge, History, CalendarCheck, Pin, Trash2, Pencil,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEventTasks, EventTask } from "@/hooks/useEventTasks";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useEventVendors } from "@/hooks/useEventVendors";
import { useEventNotes } from "@/hooks/useEventNotes";
import {
  roleConfig, teamActivityLog, contractStatusConfig,
  availabilityConfig, priorityColors, ratingLabels, mockTeam,
} from "./AgencyEventPlannerData";
import { ShareClientLinkDialog } from "./ShareClientLinkDialog";

interface AgencyEventPlannerProps { onBack: () => void; }

function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} className={`${cls} ${i < value ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
      ))}
    </div>
  );
}

interface TaskColumnProps {
  title: string;
  tasks: EventTask[];
  color: string;
  onMove: (id: string, status: EventTask["status"]) => void;
  onDelete: (id: string) => void;
  targetStatuses: { label: string; value: EventTask["status"] }[];
}

function TaskColumn({ title, tasks, color, onMove, onDelete, targetStatuses }: TaskColumnProps) {
  return (
    <div className="flex-1 min-w-[250px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 ml-auto">{tasks.length}</Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:bg-white/[0.06] transition-colors group">
            <p className="text-sm text-white mb-1">{task.title}</p>
            {task.description && <p className="text-xs text-white/30 mb-2">{task.description}</p>}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {task.assignee_name && (
                  <>
                    <Avatar className="w-5 h-5"><AvatarFallback className="text-[8px] bg-violet-500/20 text-violet-300">{task.assignee_name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                    <span className="text-xs text-white/40">{task.assignee_name}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority as keyof typeof priorityColors] || ""}`}>{task.priority}</Badge>
                {task.due_date && <span className="text-[10px] text-white/30">{new Date(task.due_date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}</span>}
              </div>
            </div>
            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {targetStatuses.map((s) => (
                <Button key={s.value} variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-white/40 hover:text-white" onClick={() => onMove(task.id, s.value)}>{s.label}</Button>
              ))}
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 ml-auto" onClick={() => onDelete(task.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgencyEventPlanner({ onBack }: AgencyEventPlannerProps) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("tasks");
  const [inviteEmail, setInviteEmail] = useState("");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  // Event selector state
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [eventsLoading, setEventsLoading] = useState(true);

  // Fetch user's events
  useEffect(() => {
    if (!user) return;
    (async () => {
      setEventsLoading(true);
      const { data } = await supabase.from("events").select("id, name").eq("created_by", user.id).order("created_at", { ascending: false });
      setEvents(data || []);
      if (data && data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
      setEventsLoading(false);
    })();
  }, [user]);

  // Hook connections
  const { tasks, isLoading: tasksLoading, createTask, moveTask, deleteTask } = useEventTasks(selectedEventId);
  const { items: budgetItems, summary: budgetSummary, isLoading: budgetLoading, createItem: createBudgetItem, approveItem } = useBudgetItems(selectedEventId);
  const { eventVendors, isLoading: vendorsLoading, assignVendor, removeVendor } = useEventVendors(selectedEventId);
  const { notes, isLoading: notesLoading, createNote, deleteNote, togglePin } = useEventNotes(selectedEventId);

  // Add Task dialog
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" as EventTask["priority"], assignee_name: "", due_date: "" });

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    await createTask({
      title: newTask.title,
      description: newTask.description || undefined,
      priority: newTask.priority,
      assignee_name: newTask.assignee_name || undefined,
      due_date: newTask.due_date || undefined,
    });
    setNewTask({ title: "", description: "", priority: "medium", assignee_name: "", due_date: "" });
    setAddTaskOpen(false);
  };

  // Add Budget Item dialog
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: "", description: "", planned_amount: "", quoted_amount: "", actual_amount: "", notes: "" });

  const handleCreateBudget = async () => {
    if (!newBudget.category || !newBudget.planned_amount) return;
    await createBudgetItem({
      category: newBudget.category,
      description: newBudget.description || undefined,
      planned_amount: parseFloat(newBudget.planned_amount),
      quoted_amount: newBudget.quoted_amount ? parseFloat(newBudget.quoted_amount) : undefined,
      actual_amount: newBudget.actual_amount ? parseFloat(newBudget.actual_amount) : undefined,
      notes: newBudget.notes || undefined,
    });
    setNewBudget({ category: "", description: "", planned_amount: "", quoted_amount: "", actual_amount: "", notes: "" });
    setAddBudgetOpen(false);
  };

  // Add Vendor dialog
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ vendor_id: "", service_description: "", agreed_price: "", deposit_amount: "" });

  // Add Note
  const [noteText, setNoteText] = useState("");
  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await createNote(noteText, user?.email?.split("@")[0] || "User");
    setNoteText("");
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const budgetPct = budgetSummary.totalPlanned > 0 ? Math.round((budgetSummary.totalActual / budgetSummary.totalPlanned) * 100) : 0;
  const budgetHealth = budgetPct <= 60 ? "emerald" : budgetPct <= 85 ? "amber" : "red";

  return (
    <div className="space-y-4">
      {/* Event Selector + Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="text-white/50 hover:text-white shrink-0 mt-0.5" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-full max-w-xs bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder={eventsLoading ? "Loading events..." : "Event waehlen..."} />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Aktiv</Badge>
              {selectedEventId && user && (
                <ShareClientLinkDialog eventId={selectedEventId} agencyId={user.id} />
              )}
            </div>
            {selectedEvent && (
              <div className="flex flex-wrap gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{"\u20AC"}{budgetSummary.totalActual.toLocaleString("de-DE")} / {"\u20AC"}{budgetSummary.totalPlanned.toLocaleString("de-DE")}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />{tasks.done.length} / {tasks.todo.length + tasks.in_progress.length + tasks.done.length} Aufgaben</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {!selectedEventId ? (
        <div className="text-center py-12 text-white/40">Bitte waehle ein Event aus.</div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 p-1 w-full overflow-x-auto flex">
            {[
              { value: "tasks", icon: CheckCircle2, label: "Aufgaben" },
              { value: "budget", icon: DollarSign, label: "Budget" },
              { value: "team", icon: Users, label: "Team" },
              { value: "vendors", icon: Briefcase, label: "Vendors" },
              { value: "notes", icon: StickyNote, label: "Notizen" },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white whitespace-nowrap">
                <tab.icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4">
            <div className="flex justify-end mb-3">
              <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white"><Plus className="w-3.5 h-3.5 mr-1" /> Aufgabe</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
                  <DialogHeader><DialogTitle>Neue Aufgabe</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div><Label className="text-white/60 text-xs">Titel</Label><Input value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Aufgabe..." /></div>
                    <div><Label className="text-white/60 text-xs">Beschreibung</Label><Textarea value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={2} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-white/60 text-xs">Prioritaet</Label>
                        <Select value={newTask.priority} onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v as EventTask["priority"] }))}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                            <SelectItem value="urgent">Dringend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-white/60 text-xs">Zustaendig</Label><Input value={newTask.assignee_name} onChange={(e) => setNewTask((p) => ({ ...p, assignee_name: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Name" /></div>
                    </div>
                    <div><Label className="text-white/60 text-xs">Faellig am</Label><Input type="date" value={newTask.due_date} onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreateTask}>Erstellen</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {tasksLoading ? (
              <div className="flex gap-4"><Skeleton className="flex-1 h-48 bg-white/5" /><Skeleton className="flex-1 h-48 bg-white/5" /><Skeleton className="flex-1 h-48 bg-white/5" /></div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 overflow-x-auto pb-4">
                <TaskColumn title="Zu erledigen" tasks={tasks.todo} color="bg-white/40" onMove={moveTask} onDelete={deleteTask} targetStatuses={[{ label: "Start", value: "in_progress" }, { label: "Fertig", value: "done" }]} />
                <TaskColumn title="In Bearbeitung" tasks={tasks.in_progress} color="bg-amber-400" onMove={moveTask} onDelete={deleteTask} targetStatuses={[{ label: "Zurueck", value: "todo" }, { label: "Fertig", value: "done" }]} />
                <TaskColumn title="Erledigt" tasks={tasks.done} color="bg-emerald-400" onMove={moveTask} onDelete={deleteTask} targetStatuses={[{ label: "Zurueck", value: "todo" }]} />
              </motion.div>
            )}
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="mt-4 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Gauge className={`w-5 h-5 text-${budgetHealth}-400`} />
                  <span className="text-sm font-medium text-white">Budget-Gesundheit</span>
                  <Badge variant="outline" className={`text-[10px] bg-${budgetHealth}-500/20 text-${budgetHealth}-300 border-${budgetHealth}-500/30`}>{budgetPct}% verbraucht</Badge>
                </div>
                <Dialog open={addBudgetOpen} onOpenChange={setAddBudgetOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white"><Plus className="w-3.5 h-3.5 mr-1" /> Position</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
                    <DialogHeader><DialogTitle>Budget-Position hinzufuegen</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-2">
                      <div><Label className="text-white/60 text-xs">Kategorie</Label>
                        <Select value={newBudget.category} onValueChange={(v) => setNewBudget((p) => ({ ...p, category: v }))}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Kategorie..." /></SelectTrigger>
                          <SelectContent>
                            {["Location", "Catering", "Fotografie", "Musik/DJ", "Blumen/Deko", "Technik", "Personal", "Marketing", "Sonstiges"].map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-white/60 text-xs">Beschreibung</Label><Input value={newBudget.description} onChange={(e) => setNewBudget((p) => ({ ...p, description: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label className="text-white/60 text-xs">Geplant</Label><Input type="number" value={newBudget.planned_amount} onChange={(e) => setNewBudget((p) => ({ ...p, planned_amount: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                        <div><Label className="text-white/60 text-xs">Angeboten</Label><Input type="number" value={newBudget.quoted_amount} onChange={(e) => setNewBudget((p) => ({ ...p, quoted_amount: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                        <div><Label className="text-white/60 text-xs">Bezahlt</Label><Input type="number" value={newBudget.actual_amount} onChange={(e) => setNewBudget((p) => ({ ...p, actual_amount: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                      </div>
                      <div><Label className="text-white/60 text-xs">Notizen</Label><Textarea value={newBudget.notes} onChange={(e) => setNewBudget((p) => ({ ...p, notes: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={2} /></div>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreateBudget}>Hinzufuegen</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`absolute inset-y-0 left-0 bg-${budgetHealth}-500 rounded-full`} style={{ width: `${budgetPct}%` }} />
              </div>
            </motion.div>
            {budgetLoading ? (
              <Skeleton className="h-48 bg-white/5" />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium text-white/40 p-4">Kategorie</th>
                      <th className="text-left text-xs font-medium text-white/40 p-4">Beschreibung</th>
                      <th className="text-right text-xs font-medium text-white/40 p-4">Geplant</th>
                      <th className="text-right text-xs font-medium text-white/40 p-4">Angeboten</th>
                      <th className="text-right text-xs font-medium text-white/40 p-4">Bezahlt</th>
                      <th className="text-left text-xs font-medium text-white/40 p-4 w-12">OK</th>
                    </tr></thead>
                    <tbody>{budgetItems.map((item) => {
                      const diff = item.planned_amount - (item.actual_amount || 0);
                      return (
                        <tr key={item.id} className="border-b border-white/5">
                          <td className="p-4 text-sm text-white">{item.category}</td>
                          <td className="p-4 text-sm text-white/50">{item.description || "-"}</td>
                          <td className="p-4 text-sm text-white/60 text-right">{"\u20AC"}{item.planned_amount.toLocaleString("de-DE")}</td>
                          <td className="p-4 text-sm text-cyan-400 text-right">{"\u20AC"}{(item.quoted_amount || 0).toLocaleString("de-DE")}</td>
                          <td className="p-4 text-sm text-white text-right">{"\u20AC"}{(item.actual_amount || 0).toLocaleString("de-DE")}</td>
                          <td className="p-4">
                            {item.is_approved ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Button variant="ghost" size="sm" className="h-6 px-1 text-amber-400 hover:text-emerald-400" onClick={() => approveItem(item.id)}>
                                <Circle className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}</tbody>
                    <tfoot><tr className="border-t border-white/20">
                      <td className="p-4 text-sm font-bold text-white" colSpan={2}>Gesamt</td>
                      <td className="p-4 text-sm font-bold text-white text-right">{"\u20AC"}{budgetSummary.totalPlanned.toLocaleString("de-DE")}</td>
                      <td className="p-4 text-sm font-bold text-cyan-400 text-right">{"\u20AC"}{budgetSummary.totalQuoted.toLocaleString("de-DE")}</td>
                      <td className="p-4 text-sm font-bold text-white text-right">{"\u20AC"}{budgetSummary.totalActual.toLocaleString("de-DE")}</td>
                      <td className="p-4" />
                    </tr></tfoot>
                  </table>
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Team Tab - kept with existing mock data since it uses participants table */}
          <TabsContent value="team" className="mt-4 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-white">Event-Team</h3><Badge variant="outline" className="text-[10px] border-white/10 text-white/40">{mockTeam.length} Mitglieder</Badge></div>
              <div className="flex gap-2 mb-4 p-3 bg-white/[0.03] rounded-lg border border-dashed border-white/10">
                <Mail className="w-4 h-4 text-white/30 mt-2" />
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="E-Mail einladen..." className="bg-white/5 border-white/10 text-white text-sm" />
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1"><Send className="w-3.5 h-3.5" /> Einladen</Button>
              </div>
              <div className="space-y-3">{mockTeam.map((m) => { const rc = roleConfig[m.role]; const RoleIcon = rc?.icon || Eye; return (
                <div key={m.name} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03]">
                  <Avatar className="w-10 h-10"><AvatarFallback className="bg-violet-500/20 text-violet-300">{m.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium text-white">{m.name}</p>{m.active && <span className="w-2 h-2 rounded-full bg-emerald-400" />}</div><p className="text-xs text-white/40">{m.email}</p></div>
                  {m.workload > 0 && <div className="hidden md:flex items-center gap-2"><div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full ${m.workload > 80 ? "bg-red-500" : m.workload > 50 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${m.workload}%` }} /></div><span className="text-[10px] text-white/30">{m.workload}%</span></div>}
                  <Badge variant="outline" className={`gap-1 ${rc?.color}`}><RoleIcon className="w-3 h-3" /> {rc?.label}</Badge>
                </div>); })}</div>
            </motion.div>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="mt-4">
            <div className="flex justify-end mb-3">
              <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white"><Plus className="w-3.5 h-3.5 mr-1" /> Vendor</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
                  <DialogHeader><DialogTitle>Vendor hinzufuegen</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div><Label className="text-white/60 text-xs">Vendor ID (aus Kontakte)</Label><Input value={newVendor.vendor_id} onChange={(e) => setNewVendor((p) => ({ ...p, vendor_id: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="ID oder leer lassen" /></div>
                    <div><Label className="text-white/60 text-xs">Dienstleistung</Label><Input value={newVendor.service_description} onChange={(e) => setNewVendor((p) => ({ ...p, service_description: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="z.B. Catering, DJ..." /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-white/60 text-xs">Vereinbarter Preis</Label><Input type="number" value={newVendor.agreed_price} onChange={(e) => setNewVendor((p) => ({ ...p, agreed_price: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                      <div><Label className="text-white/60 text-xs">Anzahlung</Label><Input type="number" value={newVendor.deposit_amount} onChange={(e) => setNewVendor((p) => ({ ...p, deposit_amount: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                    </div>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={async () => {
                      if (!newVendor.vendor_id) return;
                      await assignVendor({
                        vendor_id: newVendor.vendor_id,
                        service_description: newVendor.service_description || undefined,
                        agreed_price: newVendor.agreed_price ? parseFloat(newVendor.agreed_price) : undefined,
                        deposit_amount: newVendor.deposit_amount ? parseFloat(newVendor.deposit_amount) : undefined,
                      });
                      setNewVendor({ vendor_id: "", service_description: "", agreed_price: "", deposit_amount: "" });
                      setAddVendorOpen(false);
                    }}>Hinzufuegen</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {vendorsLoading ? (
              <div className="space-y-3"><Skeleton className="h-20 bg-white/5" /><Skeleton className="h-20 bg-white/5" /></div>
            ) : eventVendors.length === 0 ? (
              <div className="text-center py-12 text-white/40">Keine Vendors zugewiesen. Fuege einen Vendor hinzu.</div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {eventVendors.map((v) => {
                  const isExp = expandedVendor === v.id;
                  const cs = contractStatusConfig[v.contract_status || "pending"] || contractStatusConfig.pending;
                  return (
                    <div key={v.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.03] transition-colors" onClick={() => setExpandedVendor(isExp ? null : v.id)}>
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300">
                          {(v.vendors?.name || "?").split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white">{v.vendors?.name || "Unknown Vendor"}</h4>
                          <p className="text-xs text-white/40">{v.service_description || v.vendors?.type || "-"}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                          {v.vendors?.rating && <StarRating value={Math.round(v.vendors.rating)} />}
                          <Badge variant="outline" className={`text-[10px] ${cs.color}`}>{cs.label}</Badge>
                          {v.agreed_price && <span className="text-sm font-medium text-white">{"\u20AC"}{v.agreed_price.toLocaleString("de-DE")}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 text-xs ${v.deposit_paid ? "text-emerald-400" : "text-amber-400"}`}>
                            {v.deposit_paid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {v.deposit_amount && <span className="hidden md:inline">{"\u20AC"}{v.deposit_amount}</span>}
                          </div>
                          {isExp ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                        </div>
                      </div>
                      <AnimatePresence>{isExp && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-0 border-t border-white/5">
                            <div className="flex items-center gap-2 mt-3">
                              <div className="flex-1 space-y-2 text-xs">
                                <div className="flex gap-2"><span className="text-white/50">Vertrag:</span><Badge variant="outline" className={`text-[10px] ${cs.color}`}>{cs.label}</Badge></div>
                                <div className="flex gap-2"><span className="text-white/50">Anzahlung:</span><span className={v.deposit_paid ? "text-emerald-400" : "text-amber-400"}>{"\u20AC"}{(v.deposit_amount || 0).toLocaleString("de-DE")} {v.deposit_paid ? "(bezahlt)" : "(ausstehend)"}</span></div>
                                {v.notes && <div className="flex gap-2"><span className="text-white/50">Notizen:</span><span className="text-white/70">{v.notes}</span></div>}
                              </div>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={(e) => { e.stopPropagation(); removeVendor(v.id); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}</AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Interne Notizen</h3>
              <div className="flex gap-2 mb-4">
                <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[80px] resize-y placeholder:text-white/30 flex-1" placeholder="Neue Notiz..." />
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white self-end" onClick={handleAddNote}><Plus className="w-4 h-4" /></Button>
              </div>
              {notesLoading ? (
                <div className="space-y-2"><Skeleton className="h-16 bg-white/5" /><Skeleton className="h-16 bg-white/5" /></div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-4">Keine Notizen vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className={`p-3 rounded-lg border transition-colors ${note.is_pinned ? "bg-violet-500/5 border-violet-500/20" : "bg-white/[0.03] border-white/5"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-white/80 whitespace-pre-wrap flex-1">{note.content}</p>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ${note.is_pinned ? "text-violet-400" : "text-white/20 hover:text-white/50"}`} onClick={() => togglePin(note.id)}>
                            <Pin className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/20 hover:text-red-400" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/30">{note.author_name || "Anonym"}</span>
                        <span className="text-[10px] text-white/20">{new Date(note.created_at).toLocaleString("de-DE")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
