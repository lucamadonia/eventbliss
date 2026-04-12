import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Contact,
  FileText,
  Users,
  FolderOpen,
  BarChart3,
  ArrowLeft,
  Menu,
  X,
  Building2,
  ChevronRight,
  Plus,
  Search,
  Radio,
  Wallet,
  Store,
  CreditCard,
  CalendarCheck,
  PanelLeftClose,
  PanelLeft,
  CalendarDays,
  ClipboardList,
  UserPlus,
  Command,
  ChevronDown,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgency";
import { cn } from "@/lib/utils";

import { AgencyOverview } from "@/components/agency/AgencyOverview";
import { AgencyContacts } from "@/components/agency/AgencyContacts";
import { AgencyEventPlanner } from "@/components/agency/AgencyEventPlanner";
import { AgencyTeamManager } from "@/components/agency/AgencyTeamManager";
import { AgencyTemplates } from "@/components/agency/AgencyTemplates";
import { AgencyReports } from "@/components/agency/AgencyReports";
import { AgencyFileLibrary } from "@/components/agency/AgencyFileLibrary";
import { AgencyRunOfShow } from "@/components/agency/AgencyRunOfShow";
import { AgencyBudgetEngine } from "@/components/agency/AgencyBudgetEngine";
import { AgencyCalendarView } from "@/components/agency/AgencyCalendarView";
import { AgencyNotifications } from "@/components/agency/AgencyNotifications";
import { AgencyOnboarding } from "@/components/agency/AgencyOnboarding";
import { AgencySettings } from "@/components/agency/AgencySettings";
import AgencyMarketplace from "@/components/agency/AgencyMarketplace";
import AgencyBookingsManager from "@/components/agency/AgencyBookingsManager";
import AgencyStripeConnect from "@/components/agency/AgencyStripeConnect";

type Section =
  | "dashboard"
  | "events"
  | "contacts"
  | "templates"
  | "team"
  | "files"
  | "reports"
  | "runofshow"
  | "budgetengine"
  | "calendar"
  | "marketplace"
  | "bookings"
  | "stripe"
  | "settings";

interface NavItem {
  id: Section;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Uebersicht", icon: LayoutDashboard },
  { id: "events", label: "Events", icon: Calendar, badge: "12" },
  { id: "calendar", label: "Kalender", icon: CalendarDays },
  { id: "contacts", label: "Kontakte", icon: Contact },
  { id: "templates", label: "Vorlagen", icon: FileText },
  { id: "team", label: "Team", icon: Users, badge: "6" },
  { id: "runofshow", label: "Run of Show", icon: Radio, badge: "Live" },
  { id: "budgetengine", label: "Budget Engine", icon: Wallet },
  { id: "files", label: "Dateien", icon: FolderOpen },
  { id: "reports", label: "Berichte", icon: BarChart3 },
  { id: "marketplace", label: "Marketplace", icon: Store },
  { id: "bookings", label: "Buchungen", icon: CalendarCheck },
  { id: "stripe", label: "Zahlungen", icon: CreditCard },
  { id: "settings", label: "Einstellungen", icon: Settings },
];

const sectionLabels: Record<Section, string> = {
  dashboard: "Uebersicht",
  events: "Events",
  calendar: "Kalender",
  contacts: "Kontakte",
  templates: "Vorlagen",
  team: "Team",
  runofshow: "Run of Show",
  budgetengine: "Budget Engine",
  files: "Dateien",
  reports: "Berichte",
  marketplace: "Marketplace",
  bookings: "Buchungen",
  stripe: "Zahlungen",
  settings: "Einstellungen",
};

// Mock events list for the events section
const mockEvents = [
  { id: "1", name: "Hochzeit Mueller", date: "15. Jun 2026", type: "Hochzeit", status: "active", guests: 120, progress: 65 },
  { id: "2", name: "Firmenfeier SAP", date: "22. Apr 2026", type: "Corporate", status: "active", guests: 200, progress: 40 },
  { id: "3", name: "JGA Hamburg", date: "05. Mai 2026", type: "JGA", status: "active", guests: 12, progress: 80 },
  { id: "4", name: "Geburtstag 50er", date: "10. Jul 2026", type: "Geburtstag", status: "planning", guests: 60, progress: 20 },
  { id: "5", name: "Konferenz 2026", date: "15. Sep 2026", type: "Konferenz", status: "planning", guests: 350, progress: 10 },
  { id: "6", name: "Sommerfest 2026", date: "20. Aug 2026", type: "Sonstiges", status: "planning", guests: 80, progress: 5 },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  planning: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  completed: "bg-white/10 text-white/50 border-white/20",
};

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  planning: "Planung",
  completed: "Abgeschlossen",
};

function EventsSection({ onSelectEvent }: { onSelectEvent: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Events</h3>
          <p className="text-sm text-slate-500">{mockEvents.length} Events insgesamt</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Neues Event
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockEvents.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-violet-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 cursor-pointer group"
            onClick={() => onSelectEvent(event.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-50 group-hover:text-violet-300 transition-colors">
                  {event.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{event.date}</p>
              </div>
              <Badge variant="outline" className={cn("text-[10px]", statusColors[event.status])}>
                {statusLabels[event.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <span>{event.type}</span>
              <span>{event.guests} Gaeste</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${event.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.04, ease: "easeOut" }}
                  className="h-full bg-violet-500 rounded-full"
                />
              </div>
              <span className="text-[10px] text-slate-600">{event.progress}%</span>
            </div>
            <div className="flex items-center justify-end mt-3 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Quick Create FAB ────────────────────────────────── */
function QuickCreateFAB({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const [open, setOpen] = useState(false);

  const actions = [
    { label: "Neues Event", icon: Calendar, section: "events" as Section, color: "bg-violet-500" },
    { label: "Neuer Kontakt", icon: UserPlus, section: "contacts" as Section, color: "bg-cyan-500" },
    { label: "Neue Aufgabe", icon: ClipboardList, section: "runofshow" as Section, color: "bg-emerald-500" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-3">
      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25 transition-all duration-300 cursor-pointer",
          open
            ? "bg-slate-700 rotate-45"
            : "bg-gradient-to-br from-violet-600 to-violet-500"
        )}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Speed Dial Actions */}
      <AnimatePresence>
        {open && actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => { onNavigate(action.section); setOpen(false); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <span className="text-xs font-medium text-slate-300 bg-[#1a1625]/90 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {action.label}
            </span>
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
              action.color
            )}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Command Palette Search Bar ─────────────────────── */
function SearchBar({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("agency-search") as HTMLInputElement;
        input?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="hidden md:block relative">
      <div className={cn(
        "relative flex items-center transition-all duration-300",
        focused ? "w-80" : "w-72"
      )}>
        <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
        <Input
          id="agency-search"
          placeholder="Events, Kontakte, Vendors suchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setQuery(""); }}
          className={cn(
            "pl-10 pr-16 h-9 bg-white/[0.04] border-white/[0.08] text-slate-100 text-sm placeholder:text-slate-600 rounded-xl transition-all duration-300",
            focused && "bg-white/[0.06] border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
          )}
        />
        <kbd className="absolute right-3 flex items-center gap-0.5 text-[10px] text-slate-600 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5 pointer-events-none">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────── */
export default function AgencyDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { agency, members, isLoading: agencyLoading, createAgency } = useAgency();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center animate-pulse">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent" />
        </motion.div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-12 text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-50 mb-3">Anmeldung erforderlich</h1>
          <p className="text-slate-400 mb-6">
            Bitte melde dich an, um auf das Agency Dashboard zuzugreifen.
          </p>
          <Button
            onClick={() => navigate(`/auth?redirect=${encodeURIComponent("/agency")}`)}
            className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
          >
            Anmelden
          </Button>
        </motion.div>
      </div>
    );
  }

  // If no agency, show onboarding
  if (!agencyLoading && !agency && user) {
    return <AgencyOnboarding onCreateAgency={createAgency} />;
  }

  // If viewing a single event in the event planner
  if (selectedEventId) {
    return (
      <div className="min-h-screen bg-[#0f0a1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <AgencyEventPlanner onBack={() => setSelectedEventId(null)} />
        </div>
      </div>
    );
  }

  const handleNavigate = (section: Section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AgencyOverview onNavigate={(s) => handleNavigate(s as Section)} />;
      case "events":
        return <EventsSection onSelectEvent={(id) => setSelectedEventId(id)} />;
      case "calendar":
        return <AgencyCalendarView />;
      case "contacts":
        return <AgencyContacts />;
      case "templates":
        return <AgencyTemplates />;
      case "team":
        return <AgencyTeamManager />;
      case "runofshow":
        return <AgencyRunOfShow />;
      case "budgetengine":
        return <AgencyBudgetEngine />;
      case "files":
        return <AgencyFileLibrary />;
      case "reports":
        return <AgencyReports />;
      case "marketplace":
        return <AgencyMarketplace />;
      case "bookings":
        return <AgencyBookingsManager />;
      case "stripe":
        return <AgencyStripeConnect />;
      case "settings":
        return <AgencySettings />;
      default:
        return <AgencyOverview onNavigate={(s) => handleNavigate(s as Section)} />;
    }
  };

  const userName = user.email?.split("@")[0] || "Admin";
  const userInitial = user.email?.[0]?.toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#0f0a1e] flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-[#1a1625]/95 backdrop-blur-xl border-r border-white/[0.05] flex flex-col transition-all duration-300 lg:translate-x-0",
          sidebarCollapsed ? "w-[72px]" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn("border-b border-white/[0.05]", sidebarCollapsed ? "p-3" : "p-5")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0"
                style={{
                  background: agency?.primary_color && agency?.accent_color
                    ? `linear-gradient(135deg, ${agency.primary_color}, ${agency.accent_color})`
                    : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                }}
              >
                {agency?.logo_url ? (
                  <img src={agency.logo_url} alt={agency.name} className="w-5 h-5 rounded object-cover" />
                ) : (
                  <Building2 className="w-5 h-5 text-white" />
                )}
              </div>
              {!sidebarCollapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="text-sm font-bold text-slate-50">{agency?.name || "EventBliss"}</h2>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] text-slate-500">Agency Dashboard</p>
                    <Badge className="text-[8px] px-1 py-0 h-3.5 bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/20">
                      Agency
                    </Badge>
                  </div>
                </motion.div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-500 cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5", sidebarCollapsed ? "p-2" : "p-3")}>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl text-sm transition-all duration-200 cursor-pointer relative",
                  sidebarCollapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5",
                  isActive
                    ? "bg-violet-600/15 text-violet-300 font-medium"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
                )}
              >
                {/* Active left border accent */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-violet-500 rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-violet-400" : "")} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          isActive
                            ? "border-violet-500/30 text-violet-300"
                            : "border-white/[0.08] text-slate-600"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="hidden lg:block px-3 py-2 border-t border-white/[0.05]">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer text-xs"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Einklappen</span>
              </>
            )}
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className={cn("border-t border-white/[0.05]", sidebarCollapsed ? "p-2" : "p-4")}>
          <button
            className={cn(
              "flex items-center gap-3 w-full text-left cursor-pointer rounded-xl hover:bg-white/[0.04] transition-colors",
              sidebarCollapsed ? "justify-center p-2" : "p-2"
            )}
            onClick={() => navigate("/")}
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{userName}</p>
                <p className="text-[10px] text-slate-600">Zurueck zur Startseite</p>
              </div>
            )}
            {!sidebarCollapsed && <ArrowLeft className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0f0a1e]/80 backdrop-blur-2xl border-b border-white/[0.05]">
          <div className="flex items-center gap-4 px-4 sm:px-6 h-14">
            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-500 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-slate-600 hidden sm:inline">Agency</span>
              <ChevronRight className="w-3 h-3 text-slate-700 hidden sm:inline shrink-0" />
              <h1 className="text-sm font-semibold text-slate-100 truncate">
                {sectionLabels[activeSection]}
              </h1>
            </div>

            {/* Search Bar */}
            <SearchBar onNavigate={handleNavigate} />

            {/* Notification Bell */}
            <AgencyNotifications />

            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/")}>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs group-hover:bg-violet-500/30 transition-colors">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-xs font-medium text-slate-200 group-hover:text-slate-50 transition-colors">{userName}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-600 hidden lg:block" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Quick Create FAB */}
      <QuickCreateFAB onNavigate={handleNavigate} />
    </div>
  );
}
