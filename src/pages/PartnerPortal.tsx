import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Ticket, 
  Coins, 
  Banknote, 
  Settings,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAffiliateStats } from "@/hooks/useAffiliate";
import { supabase } from "@/integrations/supabase/client";
import { AffiliateDashboardTab } from "@/components/affiliate/AffiliateDashboardTab";
import { AffiliateVouchersTab } from "@/components/affiliate/AffiliateVouchersTab";
import { AffiliateCommissionsTab } from "@/components/affiliate/AffiliateCommissionsTab";
import { AffiliatePayoutsTab } from "@/components/affiliate/AffiliatePayoutsTab";
import { AffiliateSettingsTab } from "@/components/affiliate/AffiliateSettingsTab";

export default function PartnerPortal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: stats } = useAffiliateStats();
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const checkAffiliateStatus = async () => {
      if (!user?.id) {
        setIsAffiliate(false);
        return;
      }

      const { data } = await supabase
        .from("affiliates")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      setIsAffiliate(!!data);
    };

    if (!authLoading) {
      checkAffiliateStatus();
    }
  }, [user?.id, authLoading]);

  const tierColors: Record<string, string> = {
    bronze: "from-amber-600 to-amber-400",
    silver: "from-gray-400 to-gray-200",
    gold: "from-yellow-500 to-amber-300",
    platinum: "from-violet-500 to-purple-300",
  };

  // Loading state
  if (authLoading || isAffiliate === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background gradient-mesh">
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {t("affiliate.notAffiliate.loginRequired", "Anmeldung erforderlich")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("affiliate.notAffiliate.loginDesc", "Bitte melde dich an, um auf das Partner-Portal zuzugreifen.")}
            </p>
            <Button onClick={() => navigate("/auth")} className="btn-glow">
              {t("auth.login", "Anmelden")}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not an affiliate - show "become a partner" page
  if (!isAffiliate) {
    return (
      <div className="min-h-screen bg-background gradient-mesh">
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back", "Zurück")}
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center relative overflow-hidden"
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-pink-500/10 to-accent/10" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg pulse-glow">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-4xl font-bold mb-4">
                {t("affiliate.notAffiliate.title", "Partner werden")}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                {t("affiliate.notAffiliate.description", "Du bist noch kein Partner. Möchtest du Teil unseres Affiliate-Programms werden und Provisionen verdienen?")}
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-xl bg-muted/50"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">
                    {t("affiliate.notAffiliate.benefits.commission", "Bis zu 25% Provision")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("affiliate.notAffiliate.benefits.commissionDesc", "Verdiene bei jeder erfolgreichen Empfehlung")}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-muted/50"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-accent to-cyan-400 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">
                    {t("affiliate.notAffiliate.benefits.tracking", "Echtzeit-Tracking")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("affiliate.notAffiliate.benefits.trackingDesc", "Behalte alle Conversions im Blick")}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-muted/50"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">
                    {t("affiliate.notAffiliate.benefits.support", "Persönlicher Support")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("affiliate.notAffiliate.benefits.supportDesc", "Direkter Kontakt zu unserem Team")}
                  </p>
                </motion.div>
              </div>

              <Button className="btn-glow gap-2 text-lg px-8 py-6">
                <Zap className="w-5 h-5" />
                {t("affiliate.notAffiliate.cta", "Jetzt bewerben")}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Partner Portal
  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {t("affiliate.portal.title", "Partner-Portal")}
              </h1>
              <p className="text-muted-foreground">
                {t("affiliate.portal.welcome", "Willkommen zurück")}
              </p>
            </div>
          </div>
          
          <Badge 
            className={`text-sm font-bold px-4 py-2 bg-gradient-to-r ${tierColors[stats?.tier || "bronze"]} text-white border-0`}
          >
            {t(`affiliate.tiers.${stats?.tier || "bronze"}`, (stats?.tier || "bronze").toUpperCase())}
          </Badge>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TabsList className="glass-card p-1 w-full md:w-auto grid grid-cols-5 md:inline-flex h-auto">
              <TabsTrigger 
                value="dashboard" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("affiliate.portal.tabs.dashboard", "Übersicht")}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="vouchers"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Ticket className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("affiliate.portal.tabs.vouchers", "Gutscheine")}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="commissions"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Coins className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("affiliate.portal.tabs.commissions", "Provisionen")}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="payouts"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Banknote className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("affiliate.portal.tabs.payouts", "Auszahlungen")}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("affiliate.portal.tabs.settings", "Einstellungen")}
                </span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="dashboard" className="mt-6">
            <AffiliateDashboardTab 
              onRequestPayout={() => setActiveTab("payouts")}
              onShareVoucher={() => setActiveTab("vouchers")}
            />
          </TabsContent>

          <TabsContent value="vouchers" className="mt-6">
            <AffiliateVouchersTab />
          </TabsContent>

          <TabsContent value="commissions" className="mt-6">
            <AffiliateCommissionsTab />
          </TabsContent>

          <TabsContent value="payouts" className="mt-6">
            <AffiliatePayoutsTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <AffiliateSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
