import { lazy, Suspense } from "react";
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

const MarketplaceListingsTab = lazy(() => import("@/components/admin/MarketplaceListingsTab"));
const MarketplaceBookingsTab = lazy(() => import("@/components/admin/MarketplaceBookingsTab"));
const MarketplaceStatsTab = lazy(() => import("@/components/admin/MarketplaceStatsTab"));
const AdminAgencyManager = lazy(() => import("@/components/admin/AdminAgencyManager"));
const AdminPackageManager = lazy(() => import("@/components/admin/AdminPackageManager"));
const FeatureFlagsTab = lazy(() => import("@/components/admin/FeatureFlagsTab"));
const AuditLogTab = lazy(() => import("@/components/admin/AuditLogTab"));
const SystemSettingsTab = lazy(() => import("@/components/admin/SystemSettingsTab"));
const AdminAIAdvertisingTab = lazy(() => import("@/components/admin/AdminAIAdvertisingTab"));
const AdminAkquiseTab = lazy(() => import("@/components/admin/AdminAkquiseTab"));
const AgencyRiskMonitor = lazy(() => import("@/components/admin/AgencyRiskMonitor"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

interface AdminContentProps {
  activeTab: string;
}

export function AdminContent({ activeTab }: AdminContentProps) {
  switch (activeTab) {
    case "stats":
      return <StatsOverview />;
    case "credits":
      return <CreditsTab />;
    case "users":
      return <UsersTab />;
    case "subscriptions":
      return <SubscriptionsTab />;
    case "vouchers":
      return <VouchersTab />;
    case "affiliates":
      return <AffiliatesTab />;
    case "commissions":
      return <CommissionsTab />;
    case "payouts":
      return <PayoutsTab />;
    case "agency-analytics":
      return <AgencyAnalyticsTab />;
    case "agency-affiliates":
      return <AgencyAffiliateManager />;
    case "settings":
      return <PlanSettingsTab />;
    case "marketplace-listings":
      return <Suspense fallback={<LoadingSpinner />}><MarketplaceListingsTab /></Suspense>;
    case "marketplace-bookings":
      return <Suspense fallback={<LoadingSpinner />}><MarketplaceBookingsTab /></Suspense>;
    case "marketplace-stats":
      return <Suspense fallback={<LoadingSpinner />}><MarketplaceStatsTab /></Suspense>;
    case "agencies":
      return <Suspense fallback={<LoadingSpinner />}><AdminAgencyManager /></Suspense>;
    case "packages":
      return <Suspense fallback={<LoadingSpinner />}><AdminPackageManager /></Suspense>;
    case "feature-flags":
      return <Suspense fallback={<LoadingSpinner />}><FeatureFlagsTab /></Suspense>;
    case "audit-log":
      return <Suspense fallback={<LoadingSpinner />}><AuditLogTab /></Suspense>;
    case "system-settings":
      return <Suspense fallback={<LoadingSpinner />}><SystemSettingsTab /></Suspense>;
    case "marketplace-ai-ads":
      return <Suspense fallback={<LoadingSpinner />}><AdminAIAdvertisingTab /></Suspense>;
    case "agency-akquise":
      return <Suspense fallback={<LoadingSpinner />}><AdminAkquiseTab /></Suspense>;
    case "agency-risk":
      return <Suspense fallback={<LoadingSpinner />}><AgencyRiskMonitor /></Suspense>;
    default:
      return <StatsOverview />;
  }
}
