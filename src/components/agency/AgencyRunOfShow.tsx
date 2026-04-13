import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Play, CheckCircle2, SkipForward, AlertTriangle, Timer, Users, Radio,
  ChevronDown, ChevronUp, ShieldAlert, MessageSquarePlus, Megaphone, Wrench,
  ChefHat, Clapperboard, Diamond, Send, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useRunSheet, RunSheetItem } from "@/hooks/useRunSheet";

type RoleFilter = "all" | "moderator" | "technik" | "catering" | "crew";
type Stage = "main" | "breakout1" | "breakout2";

interface IncidentEntry {
  id: string;
  time: string;
  description: string;
  reporter: string;
}

const emergencyProtocols = [
  { title: "Feueralarm", steps: "Alle Ausgänge öffnen, Teilnehmer zum Sammelplatz leiten, Feuerwehr rufen" },
  { title: "Medizinischer Notfall", steps: "Ersthelfer informieren, Notruf 112, Bereich räumen" },
  { title: "Stromausfall", steps: "Ruhe bewahren, Notbeleuchtung aktivieren, Techniker kontaktieren" },
  { title: "Sprecher fällt aus", steps: "Backup-Programm starten, Pause einlegen, Moderator informieren" },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Anstehend", color: "text-blue-300", bgColor: "bg-blue-500/20 border-blue-500/30" },
  upcoming: { label: "Anstehend", color: "text-blue-300", bgColor: "bg-blue-500/20 border-blue-500/30" },
  active: { label: "Aktiv", color: "text-emerald-300", bgColor: "bg-emerald-500/20 border-emerald-500/30" },
  completed: { label: "Erledigt", color: "text-white/40", bgColor: "bg-white/10 border-white/20" },
  delayed: { label: "Verspätet", color: "text-amber-300", bgColor: "bg-amber-500/20 border-amber-500/30" },
  skipped: { label: "Übersprungen", color: "text-red-300", bgColor: "bg-red-500/20 border-red-500/30" },
};

const roleIcons: Record<RoleFilter, typeof Users> = {
  all: Users,
  moderator: Megaphone,
  technik: Wrench,
  catering: ChefHat,
  crew: Clapperboard,
};

export function AgencyRunOfShow() {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [activeStage, setActiveStage] = useState<Stage>("main");
  const [showEmergency, setShowEmergency] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidents, setIncidents] = useState<IncidentEntry[]>([]);
  const [incidentText, setIncidentText] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  const { items, isLoading, createItem, updateItem, markActive, markComplete, skipItem, addDelay } = useRunSheet(selectedEventId);

  // Add Cue dialog
  const [addCueOpen, setAddCueOpen] = useState(false);
  const [newCue, setNewCue] = useState({
    title: "", start_time: "", end_time: "", responsible_name: "", responsible_role: "crew",
    stage: "main", cue_notes: "", is_milestone: false,
  });

  const handleCreateCue = async () => {
    if (!newCue.title.trim()) return;
    await createItem({
      title: newCue.title,
      start_time: newCue.start_time || undefined,
      end_time: newCue.end_time || undefined,
      responsible_name: newCue.responsible_name || undefined,
      responsible_role: newCue.responsible_role || undefined,
      stage: newCue.stage || undefined,
      cue_notes: newCue.cue_notes || undefined,
    });
    setNewCue({ title: "", start_time: "", end_time: "", responsible_name: "", responsible_role: "crew", stage: "main", cue_notes: "", is_milestone: false });
    setAddCueOpen(false);
  };

  const activeCue = items.find((c) => c.status === "active");

  useEffect(() => {
    if (!activeCue) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [activeCue?.id]);

  useEffect(() => { setElapsedSeconds(0); }, [activeCue?.id]);

  const filteredCues = useMemo(() => {
    return items.filter((c) => {
      const matchesRole = roleFilter === "all" || c.responsible_role === roleFilter;
      const matchesStage = !c.stage || c.stage === activeStage || c.stage === "main";
      return matchesRole && (activeStage === "main" ? true : matchesStage);
    });
  }, [items, roleFilter, activeStage]);

  const addIncident = () => {
    if (!incidentText.trim()) return;
    setIncidents((prev) => [{ id: `inc-${Date.now()}`, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), description: incidentText, reporter: user?.email?.split("@")[0] || "User" }, ...prev]);
    setIncidentText("");
    setShowIncidentForm(false);
  };

  const completedCount = items.filter((c) => c.status === "completed").length;
  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;

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
        <Dialog open={addCueOpen} onOpenChange={setAddCueOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white"><Plus className="w-3.5 h-3.5 mr-1" /> Cue</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1625] border-white/10 text-white max-w-md">
            <DialogHeader><DialogTitle>Neuer Cue-Punkt</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label className="text-white/60 text-xs">Titel</Label><Input value={newCue.title} onChange={(e) => setNewCue((p) => ({ ...p, title: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" placeholder="z.B. Keynote" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-white/60 text-xs">Start</Label><Input type="time" value={newCue.start_time} onChange={(e) => setNewCue((p) => ({ ...p, start_time: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                <div><Label className="text-white/60 text-xs">Ende</Label><Input type="time" value={newCue.end_time} onChange={(e) => setNewCue((p) => ({ ...p, end_time: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-white/60 text-xs">Verantwortlich</Label><Input value={newCue.responsible_name} onChange={(e) => setNewCue((p) => ({ ...p, responsible_name: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
                <div><Label className="text-white/60 text-xs">Rolle</Label>
                  <Select value={newCue.responsible_role} onValueChange={(v) => setNewCue((p) => ({ ...p, responsible_role: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="technik">Technik</SelectItem>
                      <SelectItem value="catering">Catering</SelectItem>
                      <SelectItem value="crew">Crew</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-white/60 text-xs">Buehne</Label>
                <Select value={newCue.stage} onValueChange={(v) => setNewCue((p) => ({ ...p, stage: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Hauptbuehne</SelectItem>
                    <SelectItem value="breakout1">Breakout 1</SelectItem>
                    <SelectItem value="breakout2">Breakout 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-white/60 text-xs">Notizen</Label><Textarea value={newCue.cue_notes} onChange={(e) => setNewCue((p) => ({ ...p, cue_notes: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={2} /></div>
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreateCue}>Erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {!selectedEventId ? (
        <div className="text-center py-12 text-white/40">Bitte waehle ein Event aus.</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar with countdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 lg:w-72 shrink-0">
            <h3 className="text-sm font-medium text-white/50 mb-2">{events.find((e) => e.id === selectedEventId)?.name || "Event"}</h3>
            <p className="text-xs text-white/40 mb-3">{completedCount} / {items.length} Punkte erledigt</p>
            <div className="bg-white/5 rounded-lg p-4 text-center mb-3">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Aktiver Cue</p>
              <p className="text-lg font-bold text-emerald-400 mb-1">{activeCue?.title || "Kein aktiver Cue"}</p>
              <p className="text-3xl font-mono font-bold text-white">
                {String(elapsedMin).padStart(2, "0")}:{String(elapsedSec).padStart(2, "0")}
              </p>
              <p className="text-[10px] text-white/30 mt-1">Vergangene Zeit</p>
            </div>
            {activeCue && activeCue.delay_minutes > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center mb-3">
                <p className="text-xs text-amber-300">+{activeCue.delay_minutes} Min. Verspaetung</p>
              </div>
            )}
            <Button variant="destructive" size="sm" className="w-full bg-red-600/80 hover:bg-red-600 gap-2" onClick={() => setShowEmergency(!showEmergency)}>
              <ShieldAlert className="w-4 h-4" /> Notfallprotokoll
            </Button>
          </motion.div>

          <div className="flex-1 space-y-4">
            {/* Controls */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-3 items-center">
              <Tabs value={activeStage} onValueChange={(v) => setActiveStage(v as Stage)}>
                <TabsList className="bg-white/5 border border-white/10 p-1">
                  <TabsTrigger value="main" className="text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white">Hauptbuehne</TabsTrigger>
                  <TabsTrigger value="breakout1" className="text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white">Breakout 1</TabsTrigger>
                  <TabsTrigger value="breakout2" className="text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white">Breakout 2</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex gap-1">
                {(["all", "moderator", "technik", "catering", "crew"] as RoleFilter[]).map((role) => {
                  const Icon = roleIcons[role];
                  return (
                    <Button key={role} variant="ghost" size="sm" onClick={() => setRoleFilter(role)} className={`text-xs gap-1.5 ${roleFilter === role ? "bg-violet-600/20 text-violet-300" : "text-white/40 hover:text-white/70"}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{role === "all" ? "Alle" : role.charAt(0).toUpperCase() + role.slice(1)}</span>
                    </Button>
                  );
                })}
              </div>
              <Button size="sm" variant="outline" className="ml-auto bg-white/5 border-white/10 text-white/60 gap-1.5" onClick={() => setShowIncidentForm(!showIncidentForm)}>
                <MessageSquarePlus className="w-3.5 h-3.5" /> Vorfall
              </Button>
            </motion.div>

            {/* Incident form */}
            <AnimatePresence>
              {showIncidentForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 overflow-hidden">
                  <div className="flex gap-3">
                    <Textarea value={incidentText} onChange={(e) => setIncidentText(e.target.value)} placeholder="Vorfall beschreiben..." className="bg-white/5 border-white/10 text-white text-sm min-h-[60px] resize-none flex-1" />
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white self-end" onClick={addIncident}><Send className="w-4 h-4" /></Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline */}
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-20 bg-white/5" /><Skeleton className="h-20 bg-white/5" /><Skeleton className="h-20 bg-white/5" /></div>
            ) : filteredCues.length === 0 ? (
              <div className="text-center py-12 text-white/40">Keine Cue-Punkte. Fuege den ersten Cue hinzu.</div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
                <div className="absolute left-[70px] top-0 bottom-0 w-0.5 bg-white/5 z-0" />
                <div className="space-y-2">
                  {filteredCues.map((cue) => {
                    const config = statusConfig[cue.status] || statusConfig.pending;
                    const isActive = cue.status === "active";
                    return (
                      <div key={cue.id} className={`relative flex gap-4 p-4 rounded-xl transition-all ${isActive ? "bg-emerald-500/5 border border-emerald-500/20 ring-1 ring-emerald-500/10" : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]"} ${cue.status === "skipped" ? "opacity-50" : ""}`}>
                        <div className="w-[55px] shrink-0 text-right">
                          <p className="text-sm font-mono text-white/60">{cue.start_time || "--:--"}</p>
                          <p className="text-[10px] font-mono text-white/30">{cue.end_time || "--:--"}</p>
                          {cue.delay_minutes > 0 && <p className="text-[10px] font-mono text-amber-400 mt-0.5">+{cue.delay_minutes}m</p>}
                        </div>
                        <div className="flex items-start pt-1 shrink-0">
                          <div className={`w-3 h-3 rounded-full border-2 mt-0.5 ${isActive ? "border-emerald-400 bg-emerald-400 animate-pulse" : cue.status === "completed" ? "border-white/20 bg-white/20" : cue.status === "skipped" ? "border-red-400 bg-red-400/30" : "border-white/20 bg-transparent"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${cue.status === "skipped" ? "line-through text-white/40" : "text-white"}`}>{cue.title}</h4>
                            <Badge variant="outline" className={`text-[10px] ${config.bgColor}`}>{config.label}</Badge>
                          </div>
                          {cue.cue_notes && <p className="text-xs text-white/40 mb-2">{cue.cue_notes}</p>}
                          <div className="flex items-center gap-3">
                            {cue.responsible_name && (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="w-5 h-5"><AvatarFallback className="text-[8px] bg-violet-500/20 text-violet-300">{cue.responsible_name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                <span className="text-xs text-white/50">{cue.responsible_name}</span>
                              </div>
                            )}
                            {isActive && <span className="text-xs text-emerald-400 flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" /> Live</span>}
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 shrink-0">
                          {(cue.status === "pending" || cue.status === "upcoming") && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10" onClick={() => markActive(cue.id)}>
                                <Play className="w-3 h-3 mr-1" /> Start
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10" onClick={() => skipItem(cue.id)}>
                                <SkipForward className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {(cue.status === "active" || cue.status === "delayed") && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-white/50 hover:bg-white/10" onClick={() => addDelay(cue.id, 5)}>
                                <Timer className="w-3 h-3 mr-1" /> +5m
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10" onClick={() => markComplete(cue.id)}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Fertig
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Panel */}
      <AnimatePresence>
        {showEmergency && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-950/30 backdrop-blur-lg border border-red-500/20 rounded-xl p-5">
            <h3 className="font-semibold text-red-300 mb-3 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Notfallprotokolle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emergencyProtocols.map((proto) => (
                <div key={proto.title} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-300 mb-1">{proto.title}</h4>
                  <p className="text-xs text-white/50">{proto.steps}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incident Log */}
      {incidents.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Vorfallprotokoll</h3>
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="flex gap-3 p-2 rounded-lg bg-white/[0.03] text-sm">
                <span className="text-xs font-mono text-white/40 w-12 shrink-0">{inc.time}</span>
                <span className="text-white/70 flex-1">{inc.description}</span>
                <span className="text-xs text-white/40 shrink-0">{inc.reporter}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
