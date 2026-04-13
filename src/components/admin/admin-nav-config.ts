import {
  BarChart3, Sparkles, Users, CreditCard, Ticket,
  Handshake, Coins, Banknote, TrendingUp, Building2,
  Settings, Store, ShoppingCart, PieChart, Package,
  Gamepad2, Landmark,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  key: string;
  labelKey: string;
  defaultLabel: string;
  icon: LucideIcon;
  href?: string;
}

export interface AdminNavGroup {
  groupLabelKey: string;
  defaultGroupLabel: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupLabelKey: "admin.nav.overview",
    defaultGroupLabel: "Übersicht",
    items: [
      { key: "stats", labelKey: "admin.tabs.stats", defaultLabel: "Dashboard", icon: BarChart3 },
    ],
  },
  {
    groupLabelKey: "admin.nav.usersAndSubs",
    defaultGroupLabel: "Benutzer & Abos",
    items: [
      { key: "users", labelKey: "admin.tabs.users", defaultLabel: "Benutzer", icon: Users },
      { key: "subscriptions", labelKey: "admin.tabs.subscriptions", defaultLabel: "Abos", icon: CreditCard },
      { key: "credits", labelKey: "admin.tabs.credits", defaultLabel: "Credits", icon: Sparkles },
    ],
  },
  {
    groupLabelKey: "admin.nav.partners",
    defaultGroupLabel: "Partner & Provisionen",
    items: [
      { key: "affiliates", labelKey: "admin.tabs.affiliates", defaultLabel: "Partner", icon: Handshake },
      { key: "commissions", labelKey: "admin.tabs.commissions", defaultLabel: "Provisionen", icon: Coins },
      { key: "payouts", labelKey: "admin.tabs.payouts", defaultLabel: "Auszahlungen", icon: Banknote },
      { key: "vouchers", labelKey: "admin.tabs.vouchers", defaultLabel: "Voucher", icon: Ticket },
    ],
  },
  {
    groupLabelKey: "admin.nav.agencies",
    defaultGroupLabel: "Agenturen",
    items: [
      { key: "agencies", labelKey: "admin.tabs.agencies", defaultLabel: "Agenturen", icon: Landmark },
      { key: "agency-affiliates", labelKey: "admin.tabs.agencyAffiliates", defaultLabel: "Agentur-Partner", icon: Building2 },
      { key: "agency-analytics", labelKey: "admin.tabs.agencyAnalytics", defaultLabel: "Agentur-Stats", icon: TrendingUp },
    ],
  },
  {
    groupLabelKey: "admin.nav.marketplace",
    defaultGroupLabel: "Marketplace",
    items: [
      { key: "marketplace-listings", labelKey: "admin.tabs.marketplace", defaultLabel: "Listings", icon: Store },
      { key: "marketplace-bookings", labelKey: "admin.tabs.bookings", defaultLabel: "Buchungen", icon: ShoppingCart },
      { key: "marketplace-stats", labelKey: "admin.tabs.mktStats", defaultLabel: "Statistiken", icon: PieChart },
      { key: "packages", labelKey: "admin.tabs.packages", defaultLabel: "Pakete", icon: Package },
    ],
  },
  {
    groupLabelKey: "admin.nav.system",
    defaultGroupLabel: "System",
    items: [
      { key: "settings", labelKey: "admin.tabs.settings", defaultLabel: "Einstellungen", icon: Settings },
      { key: "games", labelKey: "admin.tabs.games", defaultLabel: "Games Content", icon: Gamepad2, href: "/admin/games" },
    ],
  },
];
