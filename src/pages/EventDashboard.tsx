import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  MapPin,
  Lightbulb,
  Settings,
  MessageSquare,
  Wallet,
  Loader2,
  AlertCircle,
  Sparkles,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import { useEvent } from "@/hooks/useEvent";
import { useParticipantPermissions } from "@/hooks/useParticipantPermissions";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { ScheduleTab } from "@/components/dashboard/ScheduleTab";
import { DestinationTab } from "@/components/dashboard/DestinationTab";
import { IdeasTab } from "@/components/dashboard/IdeasTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { MessagesTab } from "@/components/dashboard/MessagesTab";
import { AIAssistantTab } from "@/components/dashboard/AIAssistantTab";
import { FormBuilderTab } from "@/components/dashboard/FormBuilderTab";
import { AgenciesTab } from "@/components/dashboard/AgenciesTab";
import { PlannerTab } from "@/components/dashboard/PlannerTab";
import { ResponsesTab } from "@/components/dashboard/ResponsesTab";
import { ExpensesTab } from "@/components/dashboard/ExpensesTab";
import { FileEdit, Building2, LogIn } from "lucide-react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "overview", labelKey: "dashboard.tabs.overview", icon: LayoutDashboard },
  { id: "planner", labelKey: "dashboard.tabs.planner", icon: ClipboardList },
  { id: "expenses", labelKey: "dashboard.tabs.expenses", icon: Wallet },
  { id: "responses", labelKey: "dashboard.tabs.responses", icon: ClipboardCheck },
  { id: "formbuilder", labelKey: "dashboard.tabs.form", icon: FileEdit },
  { id: "schedule", labelKey: "dashboard.tabs.schedule", icon: Calendar },
  { id: "destination", labelKey: "dashboard.tabs.destination", icon: MapPin },
  { id: "ideas", labelKey: "dashboard.tabs.ideas", icon: Lightbulb },
  { id: "agencies", labelKey: "dashboard.tabs.agencies", icon: Building2 },
  { id: "ai", labelKey: "dashboard.tabs.ai", icon: Sparkles },
  { id: "messages", labelKey: "dashboard.tabs.messages", icon: MessageSquare },
  { id: "settings", labelKey: "dashboard.tabs.settings", icon: Settings },
];

interface ResponseStats {
  total_responses: number;
  attendance: { yes: number; maybe: number; no: number };
  date_blocks: Record<string, { yes: number; maybe: number; total: number }>;
  budgets: Record<string, number>;
  destinations: Record<string, number>;
  activities: Record<string, number>;
  fitness_levels: Record<string, number>;
}

interface Response {
  id: string;
  participant: string;
  attendance: string;
  budget: string;
  destination: string;
  duration_pref: string;
  travel_pref: string;
  fitness_level: string;
  alcohol: string | null;
  restrictions: string | null;
  suggestions: string | null;
  partial_days: string | null;
  preferences: string[];
  date_blocks: string[];
  created_at: string;
}

const EventDashboard = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { event, participants, responseCount, isLoading, error, refetch } = useEvent(slug);
  const { user } = useAuthContext();
  const { allowedTabs } = useParticipantPermissions(event, participants);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<ResponseStats | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const requireAuth = () => {
    if (!user) {
      setLoginPromptOpen(true);
      return true;
    }
    return false;
  };

  // Reset active tab if it's no longer allowed
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [allowedTabs, activeTab]);

  // Fetch responses and stats
  useEffect(() => {
    if (!event?.id) return;

    const fetchResponses = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-responses?event_id=${event.id}`,
          {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setResponses(data.responses || []);
        }
      } catch (err) {
        console.error("Failed to fetch responses:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchResponses();
  }, [event?.id]);

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Dashboard wird geladen...</p>
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
            <h1 className="font-display text-2xl font-bold mb-2">Event nicht gefunden</h1>
            <p className="text-muted-foreground mb-6">{error || "Event konnte nicht geladen werden."}</p>
            <GradientButton onClick={() => navigate("/")}>Zur Startseite</GradientButton>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            event={event}
            participants={participants}
            responseCount={responseCount}
            slug={slug!}
            onTabChange={setActiveTab}
          />
        );
      case "expenses":
        return <ExpensesTab event={event} participants={participants} />;
      case "responses":
        return <ResponsesTab event={event} responses={responses} isLoading={statsLoading} />;
      case "formbuilder":
        return <FormBuilderTab event={event} onUpdate={refetch} />;
      case "schedule":
        return <ScheduleTab event={event} stats={stats} isLoading={statsLoading} />;
      case "destination":
        return <DestinationTab event={event} stats={stats} isLoading={statsLoading} />;
      case "ideas":
        return <IdeasTab responses={responses} isLoading={statsLoading} />;
      case "planner":
        return <PlannerTab event={event} participants={participants} />;
      case "agencies":
        return <AgenciesTab event={event} participants={participants} />;
      case "ai":
        return <AIAssistantTab event={event} stats={stats} />;
      case "messages":
        return <MessagesTab event={event} slug={slug!} participants={participants} responseCount={responseCount} />;
      case "settings":
        return <SettingsTab event={event} participants={participants} onUpdate={refetch} />;
      default:
        return null;
    }
  };

  return (
    <>
    <AnimatedBackground>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 pt-[env(safe-area-inset-top)] glass-card border-b border-border/50">
          <div className="container max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/e/${slug}`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="font-display text-xl font-bold">{event.name}</h1>
                  <p className="text-sm text-muted-foreground">Dashboard</p>
                </div>
              </div>

{/* Expenses button removed — now integrated as Kosten tab */}
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="sticky top-[73px] z-40 glass-card border-b border-border/50 overflow-x-auto">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex gap-1 py-2">
              {tabs.filter(tab => allowedTabs.includes(tab.id)).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="container max-w-6xl mx-auto px-4 py-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </main>
      </div>
    </AnimatedBackground>

    {/* Login Prompt for Anonymous Users */}
    <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            {t('dashboard.loginRequired', 'Login Required')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.loginRequiredDesc', 'You need to register or log in to make changes. Viewing is free!')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setLoginPromptOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => navigate("/auth")}>
            <LogIn className="h-4 w-4 mr-2" />
            {t('auth.login', 'Log In / Register')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default EventDashboard;
