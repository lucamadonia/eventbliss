import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Search,
  Users,
  ShoppingBag,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Plus,
  Power,
  PowerOff,
  Crown,
  Pencil,
  Trash2,
  Star,
  Zap,
  Euro,
  MapPin,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  UserPlus,
} from "lucide-react";
import {
  useAgencyDirectory,
  useAgencyDirectoryCountries,
  useCreateDirectoryAgency,
  useInviteDirectoryAgency,
  useDeleteDirectoryAgency,
  type DirectoryAgency,
} from "@/hooks/useAgencyDirectory";
import { AgencyServiceEditor } from "@/components/agency/AgencyServiceEditor";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type AgencyTier = "starter" | "professional" | "enterprise";
type AgencyStatus = "active" | "disabled";

interface Agency {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  tier: AgencyTier;
  status: AgencyStatus;
  member_count: number;
  service_count: number;
  total_bookings: number;
  revenue_cents: number;
  created_at: string;
}

interface AgencyService {
  id: string;
  title: string;
  category: string;
  price_cents: number;
  status: string;
}

interface AgencyMember {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
}

const TIER_CONFIG: Record<AgencyTier, { label: string; color: string; icon: typeof Star; gradient: string }> = {
  starter: { label: "Starter", color: "bg-slate-500", icon: Star, gradient: "from-slate-400 to-slate-600" },
  professional: { label: "Professional", color: "bg-blue-500", icon: Zap, gradient: "from-blue-400 to-blue-600" },
  enterprise: { label: "Enterprise", color: "bg-purple-500", icon: Crown, gradient: "from-purple-400 to-purple-600" },
};

const STATUS_CONFIG: Record<AgencyStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: "Aktiv", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  disabled: { label: "Deaktiviert", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function AdminAgencyManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<AgencyTier | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AgencyStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [serviceEditorAgencyId, setServiceEditorAgencyId] = useState("");
  const [editingService, setEditingService] = useState<{
    id: string; title: string; category: string; price: number; priceType: string;
    shortDescription?: string; description?: string; includes?: string[]; requirements?: string[];
    minParticipants?: number; maxParticipants?: number; locationType?: string;
    locationAddress?: string; locationCity?: string; leadTimeDays?: number;
    cancellationPolicy?: string; autoConfirm?: boolean;
  } | null>(null);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [newTier, setNewTier] = useState<AgencyTier>("starter");

  // Directory state
  const [dirSearch, setDirSearch] = useState("");
  const [dirCountry, setDirCountry] = useState<string>("all");
  const [dirVisible, setDirVisible] = useState(20);
  const [addDirOpen, setAddDirOpen] = useState(false);
  const [newDirAgency, setNewDirAgency] = useState({ name: "", city: "", country: "Deutschland", country_code: "DE", website: "", phone: "", email: "", description: "" });

  // Directory DB hooks
  const { data: dirAgencies = [], isLoading: dirLoading } = useAgencyDirectory({ country: dirCountry, search: dirSearch });
  const { data: dirCountries = [] } = useAgencyDirectoryCountries();
  const createDirAgency = useCreateDirectoryAgency();
  const inviteDirAgency = useInviteDirectoryAgency();
  const deleteDirAgency = useDeleteDirectoryAgency();

  // Form state for creating agency
  const [newAgency, setNewAgency] = useState({
    name: "",
    slug: "",
    city: "",
  });

  // ─── Fetch Agencies ───────────────────────────────────────────────
  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agencies")
        .select("id, name, slug, city, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich each agency with counts
      const enriched: Agency[] = await Promise.all(
        (data || []).map(async (agency: any) => {
          // Get member count
          const { count: memberCount } = await (supabase.from as any)("agency_members")
            .select("id", { count: "exact", head: true })
            .eq("agency_id", agency.id);

          // Get service count
          const { count: serviceCount } = await (supabase.from as any)("marketplace_services")
            .select("id", { count: "exact", head: true })
            .eq("agency_id", agency.id);

          // Get subscription tier
          const { data: sub } = await (supabase.from as any)("agency_marketplace_subscriptions")
            .select("tier")
            .eq("agency_id", agency.id)
            .maybeSingle();

          // Get booking count & revenue
          const { data: bookings } = await (supabase.from as any)("marketplace_bookings")
            .select("id, total_price_cents")
            .eq("agency_id", agency.id);

          const totalBookings = bookings?.length || 0;
          const revenueCents = (bookings || []).reduce(
            (sum: number, b: any) => sum + (b.total_price_cents || 0),
            0
          );

          return {
            id: agency.id,
            name: agency.name,
            slug: agency.slug,
            city: agency.city,
            tier: (sub?.tier as AgencyTier) || "starter",
            status: "active" as AgencyStatus,
            member_count: memberCount || 0,
            service_count: serviceCount || 0,
            total_bookings: totalBookings,
            revenue_cents: revenueCents,
            created_at: agency.created_at,
          };
        })
      );

      return enriched;
    },
  });

  // ─── Fetch Services for expanded agency ────────────────────────────
  const { data: expandedServices = [] } = useQuery({
    queryKey: ["admin-agency-services", expandedId],
    enabled: !!expandedId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_services")
        .select("id, category, price_cents, price_type, status, min_participants, max_participants, location_type, location_address, location_city, advance_booking_days, cancellation_policy, auto_confirm")
        .eq("agency_id", expandedId);
      if (error) throw error;
      if (!data?.length) return [] as AgencyService[];

      // Fetch full translations
      const ids = data.map((s: any) => s.id);
      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("service_id, title, short_description, description, includes, requirements")
        .in("service_id", ids)
        .eq("locale", "de");
      const txMap = new Map<string, any>();
      for (const tx of translations || []) txMap.set(tx.service_id, tx);

      return data.map((s: any): AgencyService => {
        const tx = txMap.get(s.id);
        return {
          ...s,
          title: tx?.title || "Ohne Titel",
          short_description: tx?.short_description || "",
          description: tx?.description || "",
          includes: tx?.includes || [],
          requirements: tx?.requirements || [],
        };
      });
    },
  });

  // ─── Fetch Members for expanded agency ─────────────────────────────
  const { data: expandedMembers = [] } = useQuery({
    queryKey: ["admin-agency-members", expandedId],
    enabled: !!expandedId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_members")
        .select("id, role, user_id")
        .eq("agency_id", expandedId);
      if (error) throw error;

      // Fetch profile info for each member
      const members: AgencyMember[] = await Promise.all(
        (data || []).map(async (m: any) => {
          const { data: profile } = await (supabase.from as any)("profiles")
            .select("email, full_name")
            .eq("id", m.user_id)
            .maybeSingle();
          return {
            id: m.id,
            email: profile?.email || "—",
            role: m.role,
            full_name: profile?.full_name || null,
          };
        })
      );
      return members;
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────
  const changeTierMutation = useMutation({
    mutationFn: async ({ agencyId, tier }: { agencyId: string; tier: AgencyTier }) => {
      // Upsert subscription
      const { error } = await (supabase.from as any)("agency_marketplace_subscriptions")
        .upsert({ agency_id: agencyId, tier }, { onConflict: "agency_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
      toast.success("Tier erfolgreich geändert");
      setTierDialogOpen(false);
    },
    onError: () => toast.error("Fehler beim Ändern des Tiers"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ agencyId, status }: { agencyId: string; status: AgencyStatus }) => {
      // Note: agencies table has no status column yet — this is a no-op placeholder
      void agencyId; void status;
      toast.info("Status-Spalte wird in der nächsten Migration hinzugefügt");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    },
    onError: () => toast.error("Fehler beim Ändern des Status"),
  });

  const createAgencyMutation = useMutation({
    mutationFn: async (agency: { name: string; slug: string; city: string }) => {
      const { error } = await (supabase.from as any)("agencies")
        .insert({
          name: agency.name,
          slug: agency.slug,
          city: agency.city || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
      toast.success("Agentur erfolgreich erstellt");
      setCreateOpen(false);
      setNewAgency({ name: "", slug: "", city: "" });
    },
    onError: (err: any) => toast.error(`Fehler: ${err.message}`),
  });

  // ─── Delete Service ────────────────────────────────────────────────
  const deleteServiceMutation = useMutation({
    mutationFn: async ({ id, agencyId }: { id: string; agencyId: string }) => {
      const { error } = await (supabase.from as any)("marketplace_services").delete().eq("id", id);
      if (error) throw error;
      return { agencyId };
    },
    onSuccess: (d) => {
      toast.success("Service gelöscht");
      queryClient.invalidateQueries({ queryKey: ["admin-agency-services", d.agencyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });

  // ─── Filtering ─────────────────────────────────────────────────────
  const filtered = agencies.filter((a) => {
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      (a.city || "").toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || a.tier === tierFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  // ─── Stats ─────────────────────────────────────────────────────────
  const totalAgencies = agencies.length;
  const tierBreakdown = {
    starter: agencies.filter((a) => a.tier === "starter").length,
    professional: agencies.filter((a) => a.tier === "professional").length,
    enterprise: agencies.filter((a) => a.tier === "enterprise").length,
  };
  const totalRevenue = agencies.reduce((sum, a) => sum + a.revenue_cents, 0);
  const activeCount = agencies.filter((a) => a.status === "active").length;

  const statsCards = [
    { label: "Agenturen gesamt", value: totalAgencies, icon: Building2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Aktive Agenturen", value: activeCount, icon: Power, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Gesamtumsatz", value: formatPrice(totalRevenue), icon: Euro, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Starter", value: tierBreakdown.starter, icon: Star, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-900/20" },
    { label: "Professional", value: tierBreakdown.professional, icon: Zap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Enterprise", value: tierBreakdown.enterprise, icon: Crown, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((card) => (
          <Card key={card.label} className={card.bg}>
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={`h-7 w-7 ${card.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{card.value}</p>
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search & Filters ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Name, Slug oder Stadt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as AgencyTier | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tier filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Tiers</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AgencyStatus | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="disabled">Deaktiviert</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agentur erstellen
        </Button>
      </div>

      {/* ── Agencies Table ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Agenturen ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Agentur</TableHead>
                    <TableHead>Stadt</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-center">Mitglieder</TableHead>
                    <TableHead className="text-center">Services</TableHead>
                    <TableHead className="text-center">Buchungen</TableHead>
                    <TableHead className="text-right">Umsatz</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((agency) => {
                    const isExpanded = expandedId === agency.id;
                    const tierCfg = TIER_CONFIG[agency.tier];
                    const statusCfg = STATUS_CONFIG[agency.status];
                    const TierIcon = tierCfg.icon;

                    return (
                      <>
                        <TableRow
                          key={agency.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedId(isExpanded ? null : agency.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{agency.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">/{agency.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {agency.city ? (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {agency.city}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${tierCfg.color} text-white gap-1`}>
                              <TierIcon className="h-3 w-3" />
                              {tierCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {agency.member_count}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                              {agency.service_count}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {agency.total_bookings}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(agency.revenue_cents)}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}>
                              {statusCfg.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Tier ändern"
                                onClick={() => {
                                  setSelectedAgency(agency);
                                  setNewTier(agency.tier);
                                  setTierDialogOpen(true);
                                }}
                              >
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={agency.status === "active" ? "Deaktivieren" : "Aktivieren"}
                                className={agency.status === "active" ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                                onClick={() =>
                                  toggleStatusMutation.mutate({
                                    agencyId: agency.id,
                                    status: agency.status === "active" ? "disabled" : "active",
                                  })
                                }
                              >
                                {agency.status === "active" ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <TableRow key={`${agency.id}-expanded`}>
                            <TableCell colSpan={10} className="bg-muted/30 p-0">
                              <div className="p-4 space-y-4">
                                {/* Services */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                      <ShoppingBag className="h-4 w-4" />
                                      Services ({expandedServices.length})
                                    </h4>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => {
                                        setServiceEditorAgencyId(agency.id);
                                        setServiceEditorOpen(true);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Service erstellen
                                    </Button>
                                  </div>
                                  {expandedServices.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {expandedServices.map((svc) => (
                                        <div
                                          key={svc.id}
                                          className="flex items-center justify-between p-2 rounded-md bg-background border text-sm group hover:border-primary/30 transition-colors"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate">{svc.title}</p>
                                            <p className="text-xs text-muted-foreground">{svc.category}</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="text-right">
                                              <p className="font-medium">{formatPrice(svc.price_cents)}</p>
                                              <Badge variant="outline" className="text-xs">
                                                {svc.status}
                                              </Badge>
                                            </div>
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                title="Bearbeiten"
                                                onClick={() => {
                                                  setServiceEditorAgencyId(agency.id);
                                                  setEditingService({
                                                    id: svc.id,
                                                    title: svc.title,
                                                    category: svc.category,
                                                    price: svc.price_cents / 100,
                                                    priceType: (svc as any).price_type || "per_person",
                                                    shortDescription: (svc as any).short_description || "",
                                                    description: (svc as any).description || "",
                                                    includes: (svc as any).includes || [],
                                                    requirements: (svc as any).requirements || [],
                                                    minParticipants: (svc as any).min_participants,
                                                    maxParticipants: (svc as any).max_participants,
                                                    locationType: (svc as any).location_type,
                                                    locationAddress: (svc as any).location_address,
                                                    locationCity: (svc as any).location_city,
                                                    leadTimeDays: (svc as any).advance_booking_days,
                                                    cancellationPolicy: (svc as any).cancellation_policy,
                                                    autoConfirm: (svc as any).auto_confirm,
                                                  });
                                                  setServiceEditorOpen(true);
                                                }}
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                title="Löschen"
                                                onClick={() => {
                                                  if (confirm(`"${svc.title}" wirklich löschen?`)) {
                                                    deleteServiceMutation.mutate({ id: svc.id, agencyId: agency.id });
                                                  }
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Noch keine Services. Klicke "Service erstellen" um loszulegen.</p>
                                  )}
                                </div>

                                {/* Members */}
                                <div>
                                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Teammitglieder ({expandedMembers.length})
                                  </h4>
                                  {expandedMembers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {expandedMembers.map((member) => (
                                        <div
                                          key={member.id}
                                          className="flex items-center justify-between p-2 rounded-md bg-background border text-sm"
                                        >
                                          <div>
                                            <p className="font-medium">{member.full_name || member.email}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                          </div>
                                          <Badge variant="secondary" className="text-xs capitalize">
                                            {member.role}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Keine Mitglieder vorhanden.</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {isLoading ? "Laden..." : "Keine Agenturen gefunden."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Change Tier Dialog ──────────────────────────────────── */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tier ändern — {selectedAgency?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              {(["starter", "professional", "enterprise"] as AgencyTier[]).map((tier) => {
                const cfg = TIER_CONFIG[tier];
                const TIcon = cfg.icon;
                const isSelected = newTier === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setNewTier(tier)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                      <TIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-sm">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTierDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (selectedAgency) {
                  changeTierMutation.mutate({ agencyId: selectedAgency.id, tier: newTier });
                }
              }}
              disabled={changeTierMutation.isPending}
            >
              {changeTierMutation.isPending ? "Wird gespeichert..." : "Tier speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Agentur-Verzeichnis (aus DB) ────────────────────────── */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Agentur-Verzeichnis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {dirAgencies.length} JGA-Agenturen{dirCountries.length > 0 ? ` aus ${dirCountries.length} Ländern` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name oder Stadt..."
                  value={dirSearch}
                  onChange={(e) => { setDirSearch(e.target.value); setDirVisible(20); }}
                  className="pl-9 w-[180px]"
                />
              </div>
              <Select value={dirCountry} onValueChange={(v) => { setDirCountry(v); setDirVisible(20); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Land" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Länder</SelectItem>
                  {dirCountries.map(c => (
                    <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setAddDirOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dirLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {dirAgencies.length} {dirAgencies.length === 1 ? "Agentur" : "Agenturen"} gefunden
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Stadt</TableHead>
                      <TableHead>Land</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dirAgencies.slice(0, dirVisible).map((ag: DirectoryAgency) => {
                      const statusColors: Record<string, string> = {
                        active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        invited: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        partner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                        inactive: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                      };
                      const statusLabels: Record<string, string> = {
                        active: "Aktiv",
                        invited: "Eingeladen",
                        partner: "Partner",
                        inactive: "Inaktiv",
                      };
                      return (
                        <TableRow key={ag.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{ag.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">{ag.description}</div>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {ag.city}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{ag.country_code}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ag.status] || statusColors.active}`}>
                              {statusLabels[ag.status] || ag.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {ag.website && (
                                <a href={ag.website.startsWith("http") ? ag.website : `https://${ag.website}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" title="Website">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {ag.phone && (
                                <a href={`tel:${ag.phone}`} className="text-muted-foreground hover:text-primary" title={ag.phone}>
                                  <Phone className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {ag.email && (
                                <a href={`mailto:${ag.email}`} className="text-muted-foreground hover:text-primary" title={ag.email}>
                                  <Mail className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {ag.status === "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  disabled={inviteDirAgency.isPending}
                                  onClick={() => inviteDirAgency.mutate(ag.id)}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Einladen
                                </Button>
                              )}
                              {ag.status === "invited" && (
                                <Badge variant="outline" className="text-xs text-blue-500">Eingeladen</Badge>
                              )}
                              {ag.status === "partner" && (
                                <Badge variant="outline" className="text-xs text-purple-500">Partner ✓</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (confirm(`"${ag.name}" wirklich löschen?`)) {
                                    deleteDirAgency.mutate(ag.id);
                                  }
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {dirAgencies.length === 0 && !dirLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Keine Agenturen gefunden. Klicke "Hinzufügen" oder führe das Seed-Script aus.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {dirVisible < dirAgencies.length && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => setDirVisible(v => v + 20)}>
                    Mehr laden ({dirAgencies.length - dirVisible} weitere)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Add Directory Agency Dialog ─────────────────────────── */}
      <Dialog open={addDirOpen} onOpenChange={setAddDirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agentur zum Verzeichnis hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input placeholder="JGA Berlin GmbH" value={newDirAgency.name} onChange={(e) => setNewDirAgency(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Stadt *</Label>
                <Input placeholder="Berlin" value={newDirAgency.city} onChange={(e) => setNewDirAgency(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Land</Label>
                <Input placeholder="Deutschland" value={newDirAgency.country} onChange={(e) => setNewDirAgency(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Ländercode</Label>
                <Input placeholder="DE" maxLength={2} value={newDirAgency.country_code} onChange={(e) => setNewDirAgency(p => ({ ...p, country_code: e.target.value.toUpperCase() }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Website</Label>
              <Input placeholder="https://www.example.com" value={newDirAgency.website} onChange={(e) => setNewDirAgency(p => ({ ...p, website: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Telefon</Label>
                <Input placeholder="+49 30 123456" value={newDirAgency.phone} onChange={(e) => setNewDirAgency(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>E-Mail</Label>
                <Input placeholder="info@example.com" value={newDirAgency.email} onChange={(e) => setNewDirAgency(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Beschreibung</Label>
              <Input placeholder="Kurzbeschreibung der Agentur..." value={newDirAgency.description} onChange={(e) => setNewDirAgency(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDirOpen(false)}>Abbrechen</Button>
            <Button
              disabled={!newDirAgency.name || !newDirAgency.city || createDirAgency.isPending}
              onClick={() => {
                createDirAgency.mutate(newDirAgency, {
                  onSuccess: () => {
                    setAddDirOpen(false);
                    setNewDirAgency({ name: "", city: "", country: "Deutschland", country_code: "DE", website: "", phone: "", email: "", description: "" });
                  },
                });
              }}
            >
              {createDirAgency.isPending ? "Wird erstellt..." : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Agency Dialog ────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Agentur erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="z.B. Berlin Events GmbH"
                value={newAgency.name}
                onChange={(e) => setNewAgency((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="berlin-events-gmbh"
                  value={newAgency.slug}
                  onChange={(e) =>
                    setNewAgency((p) => ({
                      ...p,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stadt</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="z.B. Berlin"
                  value={newAgency.city}
                  onChange={(e) => setNewAgency((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => createAgencyMutation.mutate(newAgency)}
              disabled={!newAgency.name || !newAgency.slug || createAgencyMutation.isPending}
            >
              {createAgencyMutation.isPending ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Service Editor (für Admin) ────────────────────────── */}
      <AgencyServiceEditor
        open={serviceEditorOpen}
        onClose={() => { setServiceEditorOpen(false); setEditingService(null); }}
        agencyId={serviceEditorAgencyId}
        service={editingService}
      />
    </div>
  );
}
