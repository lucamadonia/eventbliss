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
  Building2,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AffiliateVouchersTab } from "@/components/affiliate/AffiliateVouchersTab";
import { AffiliateCommissionsTab } from "@/components/affiliate/AffiliateCommissionsTab";
import { AffiliatePayoutsTab } from "@/components/affiliate/AffiliatePayoutsTab";
import { AffiliateSettingsTab } from "@/components/affiliate/AffiliateSettingsTab";
import { GlassCard } from "@/components/ui/GlassCard";

interface AgencyAffiliateData {
  id: string;
  agency_id: string;
  agency_name: string;
  agency_city: string;
  agency_country: string;
  affiliate_id: string | null;
  commission_rate: number;
  status: string;
  total_referrals: number;
  total_bookings: number;
  total_commission: number;
}

export default function AgencyPortal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [agencyData, setAgencyData] = useState<AgencyAffiliateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const checkAgencyStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // First, get the affiliate ID for this user
        const { data: affiliateData } = await supabase
          .from("affiliates")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (affiliateData?.id) {
          // Check if there's an agency affiliate linked to this affiliate
          const { data: agency } = await supabase
            .from("agency_affiliates" as never)
            .select("*")
            .eq("affiliate_id", affiliateData.id as never)
            .maybeSingle();

          if (agency) {
            setAgencyData(agency as AgencyAffiliateData);
          }
        }
      } catch (error) {
        console.error("Error checking agency status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      checkAgencyStatus();
    }
  }, [user?.id, authLoading]);

  // Loading state
  if (authLoading || isLoading) {
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
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {t("agencyPortal.loginRequired", "Anmeldung erforderlich")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("agencyPortal.loginDesc", "Bitte melde dich an, um auf das Agentur-Portal zuzugreifen.")}
            </p>
            <Button
              onClick={() => navigate(`/auth?redirect=${encodeURIComponent("/agency-portal")}`)}
              className="btn-glow"
            >
              {t("auth.login", "Anmelden")}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not an agency partner or pending
  if (!agencyData || agencyData.status !== "active") {
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
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-pink-500/10 to-accent/10" />
            
            <div className="relative z-10">
              {agencyData?.status === "pending" ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                  
                  <h1 className="text-4xl font-bold mb-4">
                    {t("agencyPortal.pending.title", "Bewerbung in Bearbeitung")}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4 max-w-lg mx-auto">
                    {t("agencyPortal.pending.description", "Deine Bewerbung als Agentur-Partner wird derzeit geprüft.")}
                  </p>
                  <p className="text-sm text-muted-foreground mb-8">
                    {t("agencyPortal.pending.notice", "Wir melden uns innerhalb von 48 Stunden bei dir.")}
                  </p>
                  
                  <GlassCard className="p-6 max-w-md mx-auto text-left">
                    <h3 className="font-semibold mb-2">{agencyData.agency_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {agencyData.agency_city}, {agencyData.agency_country}
                    </p>
                  </GlassCard>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg pulse-glow">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  
                  <h1 className="text-4xl font-bold mb-4">
                    {t("agencyPortal.notAgency.title", "Agentur-Partner werden")}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                    {t("agencyPortal.notAgency.description", "Du bist noch kein Agentur-Partner. Registriere deine Agentur und verdiene Provisionen.")}
                  </p>

                  <Button 
                    className="btn-glow gap-2 text-lg px-8 py-6"
                    onClick={() => navigate("/agency-apply")}
                  >
                    <Sparkles className="w-5 h-5" />
                    {t("agencyPortal.notAgency.cta", "Jetzt bewerben")}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Agency Portal
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
                {t("agencyPortal.title", "Agentur-Portal")}
              </h1>
              <p className="text-muted-foreground">
                {agencyData.agency_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="text-sm font-bold px-4 py-2 bg-gradient-to-r from-primary to-pink-500 text-white border-0">
              {t("agencyPortal.activePartner", "Aktiver Partner")}
            </Badge>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{agencyData.total_referrals}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("agencyPortal.stats.referrals", "Empfehlungen")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{agencyData.total_bookings}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("agencyPortal.stats.bookings", "Buchungen")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Coins className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{agencyData.total_commission.toFixed(2)}€</p>
                  <p className="text-sm text-muted-foreground">
                    {t("agencyPortal.stats.commission", "Provisionen")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TabsList className="glass-card p-1 w-full md:w-auto grid grid-cols-5 md:inline-flex h-auto">
              <TabsTrigger 
                value="dashboard" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("agencyPortal.tabs.dashboard", "Übersicht")}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="vouchers"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Ticket className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("agencyPortal.tabs.vouchers", "Gutscheine")}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="commissions"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Coins className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("agencyPortal.tabs.commissions", "Provisionen")}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="payouts"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Banknote className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("agencyPortal.tabs.payouts", "Auszahlungen")}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("agencyPortal.tabs.settings", "Einstellungen")}
                </span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("agencyPortal.dashboard.welcome", "Willkommen zurück!")}</CardTitle>
                  <CardDescription>
                    {t("agencyPortal.dashboard.subtitle", "Hier siehst du eine Übersicht deiner Partner-Aktivitäten.")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <GlassCard className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {t("agencyPortal.dashboard.agencyInfo", "Agentur-Info")}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">{t("agencyPortal.dashboard.name", "Name")}:</span> {agencyData.agency_name}</p>
                        <p><span className="text-muted-foreground">{t("agencyPortal.dashboard.location", "Standort")}:</span> {agencyData.agency_city}, {agencyData.agency_country}</p>
                        <p><span className="text-muted-foreground">{t("agencyPortal.dashboard.commissionRate", "Provisionssatz")}:</span> {agencyData.commission_rate}%</p>
                      </div>
                    </GlassCard>
                    
                    <GlassCard className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-success" />
                        {t("agencyPortal.dashboard.performance", "Performance")}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">{t("agencyPortal.dashboard.conversionRate", "Konversionsrate")}:</span> {agencyData.total_referrals > 0 ? ((agencyData.total_bookings / agencyData.total_referrals) * 100).toFixed(1) : 0}%</p>
                        <p><span className="text-muted-foreground">{t("agencyPortal.dashboard.avgCommission", "Ø Provision")}:</span> {agencyData.total_bookings > 0 ? (agencyData.total_commission / agencyData.total_bookings).toFixed(2) : 0}€</p>
                      </div>
                    </GlassCard>
                  </div>
                </CardContent>
              </Card>
            </div>
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
