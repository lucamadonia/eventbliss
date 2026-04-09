/**
 * AdminScreen — native admin dashboard.
 * Epic card grid for all admin functions. Accessible from ProfileScreen.
 *
 * Each card opens the corresponding admin tab component in a modal-style
 * sub-view via state (no extra route needed).
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Users,
  CreditCard,
  Ticket,
  Sparkles,
  Handshake,
  Coins,
  Banknote,
  TrendingUp,
  Building2,
  Settings,
  Gamepad2,
  Shield,
  ChevronLeft,
  X,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { MobileHeader } from "@/components/native/MobileHeader";
import { cn } from "@/lib/utils";

// Lazy imports for admin tab components
import { lazy, Suspense } from "react";
import PageLoader from "@/components/ui/PageLoader";

const StatsOverview = lazy(() => import("@/components/admin/StatsOverview").then(m => ({ default: m.StatsOverview })));
const UsersTab = lazy(() => import("@/components/admin/UsersTab").then(m => ({ default: m.UsersTab })));
const SubscriptionsTab = lazy(() => import("@/components/admin/SubscriptionsTab").then(m => ({ default: m.SubscriptionsTab })));
const VouchersTab = lazy(() => import("@/components/admin/VouchersTab").then(m => ({ default: m.VouchersTab })));
const CreditsTab = lazy(() => import("@/components/admin/CreditsTab").then(m => ({ default: m.CreditsTab })));
const AffiliatesTab = lazy(() => import("@/components/admin/AffiliatesTab").then(m => ({ default: m.AffiliatesTab })));
const CommissionsTab = lazy(() => import("@/components/admin/CommissionsTab").then(m => ({ default: m.CommissionsTab })));
const PayoutsTab = lazy(() => import("@/components/admin/PayoutsTab").then(m => ({ default: m.PayoutsTab })));
const AgencyAnalyticsTab = lazy(() => import("@/components/admin/AgencyAnalyticsTab").then(m => ({ default: m.AgencyAnalyticsTab })));
const AgencyAffiliateManager = lazy(() => import("@/components/admin/AgencyAffiliateManager").then(m => ({ default: m.AgencyAffiliateManager })));
const PlanSettingsTab = lazy(() => import("@/components/admin/PlanSettingsTab").then(m => ({ default: m.PlanSettingsTab })));

interface AdminCard {
  id: string;
  label: string;
  icon: typeof BarChart3;
  gradient: string;
  description: string;
}

const ADMIN_CARDS: AdminCard[] = [
  { id: "stats",         label: "Dashboard",       icon: BarChart3,    gradient: "from-violet-500 to-fuchsia-500",  description: "Users, Events, Revenue" },
  { id: "users",         label: "Users",           icon: Users,        gradient: "from-cyan-500 to-blue-500",      description: "Rollen & Passwörter" },
  { id: "credits",       label: "AI Credits",      icon: Sparkles,     gradient: "from-amber-500 to-orange-500",   description: "Limits & Adjustments" },
  { id: "subscriptions", label: "Subscriptions",   icon: CreditCard,   gradient: "from-emerald-500 to-teal-500",   description: "Pläne verwalten" },
  { id: "vouchers",      label: "Gutscheine",      icon: Ticket,       gradient: "from-pink-500 to-rose-500",      description: "Codes & Rabatte" },
  { id: "affiliates",    label: "Affiliates",      icon: Handshake,    gradient: "from-indigo-500 to-violet-500",  description: "Partner-Programm" },
  { id: "commissions",   label: "Provisionen",     icon: Coins,        gradient: "from-yellow-500 to-amber-500",   description: "Status & Auszahlung" },
  { id: "payouts",       label: "Auszahlungen",    icon: Banknote,     gradient: "from-green-500 to-emerald-500",  description: "Pending & History" },
  { id: "analytics",     label: "Agency Analytics", icon: TrendingUp,  gradient: "from-sky-500 to-blue-500",       description: "Interaktionen" },
  { id: "agencies",      label: "Agency Affiliates", icon: Building2,  gradient: "from-slate-500 to-gray-600",     description: "Multi-Agency" },
  { id: "settings",      label: "Plan Settings",   icon: Settings,     gradient: "from-purple-500 to-violet-500",  description: "Features & Preise" },
];

function getTabComponent(id: string) {
  switch (id) {
    case "stats":         return <StatsOverview />;
    case "users":         return <UsersTab />;
    case "credits":       return <CreditsTab />;
    case "subscriptions": return <SubscriptionsTab />;
    case "vouchers":      return <VouchersTab />;
    case "affiliates":    return <AffiliatesTab />;
    case "commissions":   return <CommissionsTab />;
    case "payouts":       return <PayoutsTab />;
    case "analytics":     return <AgencyAnalyticsTab />;
    case "agencies":      return <AgencyAffiliateManager />;
    case "settings":      return <PlanSettingsTab />;
    default:              return null;
  }
}

export default function AdminScreen() {
  const haptics = useHaptics();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const activeCard = ADMIN_CARDS.find((c) => c.id === activeTab);

  const openTab = (id: string) => {
    haptics.medium();
    setActiveTab(id);
  };

  const closeTab = () => {
    haptics.light();
    setActiveTab(null);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <MobileHeader title="Admin" showBack />

      {/* Main grid */}
      <div className="flex-1 overflow-y-auto native-scroll overflow-x-hidden pb-tabbar">
        {/* Hero */}
        <motion.div
          className="px-5 pt-4 pb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">
                {ADMIN_CARDS.length} Bereiche
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          className="px-5 grid grid-cols-2 gap-3 pb-8"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {ADMIN_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                variants={staggerItem}
                whileTap={{ scale: 0.96 }}
                transition={spring.snappy}
                onClick={() => openTab(card.id)}
                className="aspect-[4/3] rounded-3xl p-4 flex flex-col justify-between items-start text-left bg-gradient-to-br from-foreground/[0.08] to-foreground/[0.02] border border-border relative overflow-hidden group"
              >
                {/* Gradient accent dot */}
                <div className={cn(
                  "absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-xl bg-gradient-to-br",
                  card.gradient
                )} />

                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                  card.gradient
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div>
                  <p className="text-sm font-display font-bold text-foreground leading-tight">
                    {card.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {card.description}
                  </p>
                </div>

                {/* Hover/active glow */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-transparent group-active:ring-primary/40 transition-all pointer-events-none" />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Tab detail overlay — slides up like a modal */}
      <AnimatePresence>
        {activeTab && activeCard && (
          <motion.div
            key={activeTab}
            className="fixed inset-0 z-50 flex flex-col bg-background"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring.soft}
          >
            {/* Header */}
            <div className="safe-top bg-background/85 backdrop-blur-2xl border-b border-border/50 sticky top-0 z-10">
              <div className="flex items-center justify-between px-4 h-14">
                <button
                  onClick={closeTab}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/80"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="font-display font-semibold text-foreground text-base">
                  {activeCard.label}
                </h2>
                <button
                  onClick={closeTab}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto native-scroll overflow-x-hidden p-4">
              <Suspense fallback={<PageLoader />}>
                {getTabComponent(activeTab)}
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
