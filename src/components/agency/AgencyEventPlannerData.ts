import { Crown, Shield, UserPlus, Eye } from "lucide-react";

export const mockEvent = {
  name: "Hochzeit Mueller",
  date: "15. Juni 2026",
  location: "Schloss Rosenstein, Stuttgart",
  guests: 120,
  status: "active" as const,
  progress: 65,
  budget: { planned: 35000, actual: 22400 },
};

export const mockTimeline = [
  { id: "1", time: "14:00", endTime: "15:00", title: "Gaeste-Empfang", responsible: "Lisa M.", status: "done", notes: "Sektempfang im Garten", workstream: "Logistik", isMilestone: false, isCritical: false, dependsOn: null as string | null },
  { id: "2", time: "15:00", endTime: "16:00", title: "Trauung", responsible: "Pastor Schmidt", status: "done", notes: "Kapelle im Schloss", workstream: "Content", isMilestone: true, isCritical: true, dependsOn: "1" },
  { id: "3", time: "16:00", endTime: "17:00", title: "Gruppenfotos", responsible: "Hans Schulz", status: "in-progress", notes: "Im Schlossgarten", workstream: "Content", isMilestone: false, isCritical: true, dependsOn: "2" },
  { id: "4", time: "17:30", endTime: "20:00", title: "Dinner", responsible: "Catering Weber", status: "pending", notes: "3-Gang-Menue", workstream: "Catering", isMilestone: false, isCritical: true, dependsOn: "3" },
  { id: "5", time: "20:00", endTime: "20:30", title: "Eroeffnungstanz", responsible: "DJ Beat Master", status: "pending", notes: "Walzer", workstream: "Content", isMilestone: true, isCritical: false, dependsOn: "4" },
  { id: "6", time: "20:30", endTime: "23:00", title: "Party & Tanz", responsible: "DJ Beat Master", status: "pending", notes: "", workstream: "Content", isMilestone: false, isCritical: false, dependsOn: "5" },
  { id: "7", time: "23:00", endTime: "00:00", title: "Mitternachtssnack", responsible: "Catering Weber", status: "pending", notes: "Burger-Station", workstream: "Catering", isMilestone: false, isCritical: false, dependsOn: null },
];

export const mockTasks = {
  todo: [
    { id: "t1", title: "Tischplan finalisieren", assignee: "Lisa M.", due: "01. Apr", priority: "high" },
    { id: "t2", title: "Menuekarten drucken", assignee: "Anna S.", due: "05. Apr", priority: "medium" },
    { id: "t3", title: "Blumenschmuck bestaetigen", assignee: "Lisa M.", due: "10. Apr", priority: "medium" },
  ],
  inProgress: [
    { id: "t4", title: "Sitzordnung abstimmen", assignee: "Lisa M.", due: "28. Maer", priority: "high" },
    { id: "t5", title: "DJ-Playlist abstimmen", assignee: "Tom K.", due: "30. Maer", priority: "low" },
  ],
  done: [
    { id: "t6", title: "Location buchen", assignee: "Lisa M.", due: "01. Jan", priority: "high" },
    { id: "t7", title: "Catering buchen", assignee: "Lisa M.", due: "15. Jan", priority: "high" },
    { id: "t8", title: "Fotograf buchen", assignee: "Tom K.", due: "01. Feb", priority: "medium" },
  ],
};

export const mockBudgetCategories = [
  { category: "Location", planned: 8000, quoted: 8000, actual: 8000, vendor: "Schloss Rosenstein", contingencyPct: 5, contingencyUsed: 0 },
  { category: "Catering", planned: 9600, quoted: 8500, actual: 7200, vendor: "Catering Weber", contingencyPct: 15, contingencyUsed: 20 },
  { category: "Fotografie", planned: 3500, quoted: 3500, actual: 3500, vendor: "Schulz Fotografie", contingencyPct: 5, contingencyUsed: 0 },
  { category: "Musik/DJ", planned: 2500, quoted: 2200, actual: 1800, vendor: "BeatMaster Events", contingencyPct: 10, contingencyUsed: 0 },
  { category: "Blumen/Deko", planned: 4000, quoted: 3800, actual: 1900, vendor: "Rossi Blumen", contingencyPct: 10, contingencyUsed: 30 },
  { category: "Einladungen", planned: 1200, quoted: 1100, actual: 0, vendor: "-", contingencyPct: 5, contingencyUsed: 0 },
  { category: "Sonstiges", planned: 6200, quoted: 0, actual: 0, vendor: "-", contingencyPct: 20, contingencyUsed: 0 },
];

export const mockTeam = [
  { name: "Lisa Mueller", role: "owner", email: "lisa@agentur.de", events: 3, active: true, workload: 85, recentAction: "Budget aktualisiert vor 5 Min." },
  { name: "Tom Krause", role: "co-organizer", email: "tom@agentur.de", events: 2, active: true, workload: 60, recentAction: "Vendor hinzugefuegt vor 23 Min." },
  { name: "Anna Schmidt", role: "planner", email: "anna@agentur.de", events: 1, active: true, workload: 40, recentAction: "Aufgabe erledigt vor 1 Std." },
  { name: "Max Bauer", role: "viewer", email: "max@kunde.de", events: 0, active: false, workload: 0, recentAction: "Hat Dashboard angesehen vor 2 Std." },
];

export const roleConfig: Record<string, { label: string; color: string; icon: typeof Crown; description: string }> = {
  owner: { label: "Owner", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: Crown, description: "Voller Zugriff, kann Team verwalten" },
  "co-organizer": { label: "Co-Organizer", color: "bg-violet-500/20 text-violet-300 border-violet-500/30", icon: Shield, description: "Bearbeiten, aber kein Team-Management" },
  planner: { label: "Planner", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", icon: UserPlus, description: "Aufgaben & Vendors verwalten" },
  viewer: { label: "Viewer", color: "bg-white/10 text-white/50 border-white/20", icon: Eye, description: "Nur Lesezugriff" },
};

export const teamActivityLog = [
  { user: "Lisa M.", action: "Budget fuer Catering aktualisiert", time: "vor 5 Min." },
  { user: "Tom K.", action: "Vendor 'Rossi Blumen' Vertrag hochgeladen", time: "vor 23 Min." },
  { user: "Anna S.", action: "Aufgabe 'Menuekarten' erstellt", time: "vor 1 Std." },
  { user: "Lisa M.", action: "Timeline-Eintrag verschoben", time: "vor 2 Std." },
  { user: "Tom K.", action: "DJ-Absprache Notiz hinzugefuegt", time: "vor 3 Std." },
];

export const mockVendors = [
  {
    name: "Schulz Fotografie", service: "Fotografie", price: 3500, deposit: { paid: true, amount: 1000 },
    contractStatus: "signed" as const, rating: 5, availability: "available" as const,
    ratings: { quality: 5, punctuality: 5, pricePerformance: 4, communication: 5, flexibility: 4 },
    pastEvents: ["Hochzeit Braun (Okt 2025)", "Gala Schmidt (Jun 2025)"],
  },
  {
    name: "Catering Weber", service: "Catering", price: 9600, deposit: { paid: true, amount: 2500 },
    contractStatus: "active" as const, rating: 4, availability: "available" as const,
    ratings: { quality: 4, punctuality: 4, pricePerformance: 5, communication: 4, flexibility: 3 },
    pastEvents: ["Firmenfeier SAP (Mar 2026)", "Hochzeit Braun (Okt 2025)", "Sommerfest 2025"],
  },
  {
    name: "BeatMaster Events", service: "DJ/Musik", price: 2500, deposit: { paid: false, amount: 500 },
    contractStatus: "pending" as const, rating: 4, availability: "tentative" as const,
    ratings: { quality: 5, punctuality: 3, pricePerformance: 4, communication: 4, flexibility: 5 },
    pastEvents: ["JGA Hamburg (Mai 2026)"],
  },
  {
    name: "Rossi Blumen", service: "Floristik", price: 4000, deposit: { paid: false, amount: 800 },
    contractStatus: "pending" as const, rating: 4, availability: "available" as const,
    ratings: { quality: 5, punctuality: 4, pricePerformance: 3, communication: 4, flexibility: 4 },
    pastEvents: ["Hochzeit Braun (Okt 2025)"],
  },
];

export const contractStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Ausstehend", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  signed: { label: "Unterschrieben", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  active: { label: "Aktiv", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  completed: { label: "Abgeschlossen", color: "bg-white/10 text-white/50 border-white/20" },
};

export const availabilityConfig: Record<string, { label: string; color: string }> = {
  available: { label: "Verfuegbar", color: "text-emerald-400" },
  tentative: { label: "Vorbehaltlich", color: "text-amber-400" },
  unavailable: { label: "Nicht verfuegbar", color: "text-red-400" },
};

export const priorityColors = {
  high: "bg-red-500/20 text-red-300 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export const workstreamColors: Record<string, string> = {
  Logistik: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Content: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Marketing: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Catering: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export const ratingLabels: Record<string, string> = {
  quality: "Qualitaet",
  punctuality: "Puenktlichkeit",
  pricePerformance: "Preis-Leistung",
  communication: "Kommunikation",
  flexibility: "Flexibilitaet",
};
