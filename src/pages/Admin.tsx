import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CreditCard, Ticket, BarChart3, ArrowLeft, Shield, UserPlus, Handshake, Coins, Banknote, Building2, TrendingUp, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembersTab } from "@/components/admin/MembersTab";
import { SubscriptionsTab } from "@/components/admin/SubscriptionsTab";
import { VouchersTab } from "@/components/admin/VouchersTab";
import { StatsOverview } from "@/components/admin/StatsOverview";
import { UsersTab } from "@/components/admin/UsersTab";
import { AffiliatesTab } from "@/components/admin/AffiliatesTab";
import { CommissionsTab } from "@/components/admin/CommissionsTab";
import { PayoutsTab } from "@/components/admin/PayoutsTab";
import { AgencyAnalyticsTab } from "@/components/admin/AgencyAnalyticsTab";
import { AgencyAffiliateManager } from "@/components/admin/AgencyAffiliateManager";
import { CreditsTab } from "@/components/admin/CreditsTab";
import { PlanSettingsTab } from "@/components/admin/PlanSettingsTab";

const Admin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  useEffect(() => {
    // Nur redirecten wenn Auth UND Admin-Check beide fertig sind
    if (authLoading || adminLoading) return;

    if (!user) {
      navigate("/auth", { replace: true });
    } else if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{t("admin.title", "Admin Portal")}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 lg:w-auto lg:inline-flex">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.stats", "Statistiken")}</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.credits", "Credits")}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.users", "Benutzer")}</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.members", "Mitglieder")}</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.subscriptions", "Abos")}</span>
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.vouchers", "Voucher")}</span>
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="gap-2">
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.affiliates", "Partner")}</span>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.commissions", "Provisionen")}</span>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="gap-2">
              <Banknote className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.payouts", "Auszahlungen")}</span>
            </TabsTrigger>
            <TabsTrigger value="agency-analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.agencyAnalytics", "Agentur-Stats")}</span>
            </TabsTrigger>
            <TabsTrigger value="agency-affiliates" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.agencyAffiliates", "Agentur-Partner")}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.tabs.settings", "Einstellungen")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsOverview />
          </TabsContent>

          <TabsContent value="credits">
            <CreditsTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="vouchers">
            <VouchersTab />
          </TabsContent>

          <TabsContent value="affiliates">
            <AffiliatesTab />
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionsTab />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutsTab />
          </TabsContent>

          <TabsContent value="agency-analytics">
            <AgencyAnalyticsTab />
          </TabsContent>

          <TabsContent value="agency-affiliates">
            <AgencyAffiliateManager />
          </TabsContent>

          <TabsContent value="settings">
            <PlanSettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
