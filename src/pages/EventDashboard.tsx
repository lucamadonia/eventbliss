import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useEvent } from "@/hooks/useEvent";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "destination", label: "Destination", icon: MapPin },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

const EventDashboard = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event, participants, responseCount, isLoading, error } = useEvent(slug);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
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
            <p className="text-muted-foreground mb-6">{error || "Unable to load this event."}</p>
            <GradientButton onClick={() => navigate("/")}>Go Home</GradientButton>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{participants.length}</p>
                    <p className="text-sm text-muted-foreground">Participants</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/20">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{responseCount}</p>
                    <p className="text-sm text-muted-foreground">Responses</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round((responseCount / Math.max(participants.length, 1)) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold capitalize">{event.status}</p>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Participants List */}
            <GlassCard className="p-6">
              <h3 className="font-display text-xl font-bold mb-4">Participants</h3>
              <div className="space-y-3">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{p.role}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.status === "confirmed"
                          ? "bg-green-500/20 text-green-400"
                          : p.status === "declined"
                          ? "bg-red-500/20 text-red-400"
                          : p.status === "maybe"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard
                className="p-6 cursor-pointer hover:bg-background/30 transition-colors"
                onClick={() => navigate(`/e/${slug}/expenses`)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold">Cost Splitting</h4>
                    <p className="text-sm text-muted-foreground">Track and split expenses</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                className="p-6 cursor-pointer hover:bg-background/30 transition-colors"
                onClick={() => setActiveTab("messages")}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary/20">
                    <MessageSquare className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold">Message Templates</h4>
                    <p className="text-sm text-muted-foreground">Send updates to the group</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        );

      case "messages":
        return (
          <div className="space-y-4">
            <GlassCard className="p-6">
              <h3 className="font-display text-xl font-bold mb-4">Message Templates</h3>
              <p className="text-muted-foreground mb-6">
                Pre-built templates for WhatsApp. Click to copy.
              </p>
              
              <div className="space-y-3">
                {[
                  { emoji: "🎉", title: "Kickoff", desc: "Initial invitation message" },
                  { emoji: "💸", title: "Budget Poll", desc: "Ask about budget preferences" },
                  { emoji: "🏨", title: "Accommodation", desc: "Hotel vs Airbnb voting" },
                  { emoji: "🧳", title: "Packing List", desc: "What to bring reminder" },
                  { emoji: "📢", title: "Countdown", desc: "3 days reminder" },
                  { emoji: "🧾", title: "Payment Request", desc: "Payment reminder" },
                ].map((template) => (
                  <GlassCard
                    key={template.title}
                    className="p-4 cursor-pointer hover:bg-background/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{template.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{template.title}</h4>
                        <p className="text-sm text-muted-foreground">{template.desc}</p>
                      </div>
                      <GradientButton size="sm" variant="outline">
                        Copy
                      </GradientButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </GlassCard>
          </div>
        );

      default:
        return (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab coming soon...
            </p>
          </GlassCard>
        );
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border/50">
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

              <GradientButton
                size="sm"
                onClick={() => navigate(`/e/${slug}/expenses`)}
                icon={<Wallet className="w-4 h-4" />}
              >
                Expenses
              </GradientButton>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="sticky top-[73px] z-40 glass-card border-b border-border/50 overflow-x-auto">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex gap-1 py-2">
              {tabs.map((tab) => {
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
                    <span className="hidden sm:inline">{tab.label}</span>
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
  );
};

export default EventDashboard;
