import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Package,
  Plus,
  Edit2,
  Check,
  X,
  Star,
  Zap,
  Crown,
  Sparkles,
  Search as SearchIcon,
  TrendingUp,
  Users,
  Link,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface PlanConfig {
  id: string;
  tier: string;
  display_name: string;
  max_listings: number;
  commission_rate_percent: number;
  price_cents: number;
  features: string[];
  has_profile_page: boolean;
  has_featured_listings: boolean;
  has_ai_integration: boolean;
  search_boost_factor: number;
  is_custom: boolean;
}

interface AgencyOnTier {
  agency_id: string;
  agency_name: string;
  tier: string;
}

const TIER_VISUAL: Record<string, { icon: typeof Star; gradient: string; color: string; border: string }> = {
  starter: { icon: Star, gradient: "from-slate-400 to-slate-600", color: "bg-slate-500", border: "border-slate-300 dark:border-slate-600" },
  professional: { icon: Zap, gradient: "from-blue-400 to-blue-600", color: "bg-blue-500", border: "border-blue-300 dark:border-blue-600" },
  enterprise: { icon: Crown, gradient: "from-purple-400 to-purple-600", color: "bg-purple-500", border: "border-purple-300 dark:border-purple-600" },
  custom: { icon: Sparkles, gradient: "from-amber-400 to-orange-600", color: "bg-amber-500", border: "border-amber-300 dark:border-amber-600" },
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

const emptyPlan: Omit<PlanConfig, "id"> = {
  tier: "",
  display_name: "",
  max_listings: 5,
  commission_rate_percent: 15,
  price_cents: 0,
  features: [],
  has_profile_page: false,
  has_featured_listings: false,
  has_ai_integration: false,
  search_boost_factor: 1.0,
  is_custom: false,
};

export default function AdminPackageManager() {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [newPlan, setNewPlan] = useState<Omit<PlanConfig, "id">>(emptyPlan);
  const [featureInput, setFeatureInput] = useState("");
  const [newFeatureInput, setNewFeatureInput] = useState("");
  const [assignAgencyId, setAssignAgencyId] = useState("");
  const [assignTier, setAssignTier] = useState("");

  // ─── Fetch Plan Configs ────────────────────────────────────────────
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-plan-configs"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_plan_configs")
        .select("*")
        .order("price_cents", { ascending: true });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        features: p.features || [],
        is_custom: p.is_custom || false,
      })) as PlanConfig[];
    },
  });

  // ─── Fetch Agencies on each tier ───────────────────────────────────
  const { data: agenciesOnTiers = [] } = useQuery({
    queryKey: ["admin-agencies-on-tiers"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_marketplace_subscriptions")
        .select("agency_id, tier");
      if (error) throw error;

      const enriched: AgencyOnTier[] = await Promise.all(
        (data || []).map(async (sub: any) => {
          const { data: agency } = await (supabase.from as any)("agencies")
            .select("name")
            .eq("id", sub.agency_id)
            .maybeSingle();
          return {
            agency_id: sub.agency_id,
            agency_name: agency?.name || "Unbekannt",
            tier: sub.tier,
          };
        })
      );
      return enriched;
    },
  });

  // ─── Fetch all agencies for assign dropdown ────────────────────────
  const { data: allAgencies = [] } = useQuery({
    queryKey: ["admin-all-agencies-list"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agencies")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return (data || []) as { id: string; name: string }[];
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: PlanConfig) => {
      const { id, ...rest } = plan;
      const { error } = await (supabase.from as any)("marketplace_plan_configs")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plan-configs"] });
      toast.success("Paket erfolgreich aktualisiert");
      setEditOpen(false);
    },
    onError: () => toast.error("Fehler beim Speichern"),
  });

  const createPlanMutation = useMutation({
    mutationFn: async (plan: Omit<PlanConfig, "id">) => {
      const { error } = await (supabase.from as any)("marketplace_plan_configs")
        .insert(plan);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plan-configs"] });
      toast.success("Neues Paket erstellt");
      setCreateOpen(false);
      setNewPlan(emptyPlan);
    },
    onError: (err: any) => toast.error(`Fehler: ${err.message}`),
  });

  const assignTierMutation = useMutation({
    mutationFn: async ({ agencyId, tier }: { agencyId: string; tier: string }) => {
      const { error } = await (supabase.from as any)("agency_marketplace_subscriptions")
        .upsert({ agency_id: agencyId, tier }, { onConflict: "agency_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies-on-tiers"] });
      toast.success("Paket zugewiesen");
      setAssignOpen(false);
      setAssignAgencyId("");
      setAssignTier("");
    },
    onError: () => toast.error("Fehler bei der Zuweisung"),
  });

  // ─── Feature Helpers ───────────────────────────────────────────────
  const addFeature = (list: string[], input: string, setter: (features: string[]) => void, clearInput: () => void) => {
    const trimmed = input.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
      clearInput();
    }
  };

  const removeFeature = (list: string[], idx: number, setter: (features: string[]) => void) => {
    setter(list.filter((_, i) => i !== idx));
  };

  // ─── Visual Tier Comparison Cards ──────────────────────────────────
  const standardPlans = plans.filter((p) => !p.is_custom);

  return (
    <div className="space-y-6">
      {/* ── Tier Comparison Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {standardPlans.map((plan) => {
          const visual = TIER_VISUAL[plan.tier] || TIER_VISUAL.custom;
          const TierIcon = visual.icon;
          const agenciesOnThis = agenciesOnTiers.filter((a) => a.tier === plan.tier);

          return (
            <Card key={plan.id} className={`relative overflow-hidden border-2 ${visual.border}`}>
              {/* Gradient header bar */}
              <div className={`h-2 bg-gradient-to-r ${visual.gradient}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${visual.gradient} flex items-center justify-center`}>
                      <TierIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.display_name}</CardTitle>
                      <p className="text-2xl font-bold">{formatPrice(plan.price_cents)}<span className="text-sm font-normal text-muted-foreground">/Monat</span></p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingPlan({ ...plan });
                      setFeatureInput("");
                      setEditOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Max Listings</p>
                    <p className="font-semibold">{plan.max_listings === -1 ? "Unbegrenzt" : plan.max_listings}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Provision</p>
                    <p className="font-semibold">{plan.commission_rate_percent}%</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Suchboost</p>
                    <p className="font-semibold">{plan.search_boost_factor}x</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Agenturen</p>
                    <p className="font-semibold">{agenciesOnThis.length}</p>
                  </div>
                </div>

                {/* Feature flags */}
                <div className="flex flex-wrap gap-1.5">
                  {plan.has_profile_page && (
                    <Badge variant="secondary" className="text-xs">Profilseite</Badge>
                  )}
                  {plan.has_featured_listings && (
                    <Badge variant="secondary" className="text-xs">Hervorgehoben</Badge>
                  )}
                  {plan.has_ai_integration && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" /> KI
                    </Badge>
                  )}
                </div>

                {/* Features list */}
                {plan.features.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Agencies on this tier */}
                {agenciesOnThis.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Agenturen auf diesem Tier:</p>
                    <div className="flex flex-wrap gap-1">
                      {agenciesOnThis.slice(0, 5).map((a) => (
                        <Badge key={a.agency_id} variant="outline" className="text-xs">
                          {a.agency_name}
                        </Badge>
                      ))}
                      {agenciesOnThis.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{agenciesOnThis.length - 5} weitere
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Action Buttons ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => { setNewPlan({ ...emptyPlan, is_custom: true }); setNewFeatureInput(""); setCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Neues Paket erstellen
        </Button>
        <Button variant="outline" onClick={() => setAssignOpen(true)} className="gap-2">
          <Link className="h-4 w-4" />
          Paket einer Agentur zuweisen
        </Button>
      </div>

      {/* ── All Plans Table ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Alle Pakete ({plans.length})
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
                    <TableHead>Paket</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Preis</TableHead>
                    <TableHead className="text-center">Max Listings</TableHead>
                    <TableHead className="text-center">Provision</TableHead>
                    <TableHead className="text-center">Suchboost</TableHead>
                    <TableHead className="text-center">Profil</TableHead>
                    <TableHead className="text-center">Featured</TableHead>
                    <TableHead className="text-center">KI</TableHead>
                    <TableHead className="text-center">Agenturen</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const visual = TIER_VISUAL[plan.tier] || TIER_VISUAL.custom;
                    const agenciesCount = agenciesOnTiers.filter((a) => a.tier === plan.tier).length;

                    return (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{plan.display_name}</p>
                            {plan.is_custom && (
                              <Badge variant="outline" className="text-xs mt-0.5">Benutzerdefiniert</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${visual.color} text-white`}>{plan.tier}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(plan.price_cents)}
                        </TableCell>
                        <TableCell className="text-center">
                          {plan.max_listings === -1 ? "∞" : plan.max_listings}
                        </TableCell>
                        <TableCell className="text-center">{plan.commission_rate_percent}%</TableCell>
                        <TableCell className="text-center">{plan.search_boost_factor}x</TableCell>
                        <TableCell className="text-center">
                          {plan.has_profile_page ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {plan.has_featured_listings ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {plan.has_ai_integration ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{agenciesCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPlan({ ...plan });
                              setFeatureInput("");
                              setEditOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {plans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        Keine Pakete konfiguriert.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Plan Dialog ───────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {editingPlan && (
            <>
              <DialogHeader>
                <DialogTitle>Paket bearbeiten — {editingPlan.display_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Anzeigename</Label>
                    <Input
                      value={editingPlan.display_name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, display_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tier-Schlüssel</Label>
                    <Input
                      value={editingPlan.tier}
                      onChange={(e) => setEditingPlan({ ...editingPlan, tier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preis (Cent)</Label>
                    <Input
                      type="number"
                      value={editingPlan.price_cents}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price_cents: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Listings (-1 = unbegrenzt)</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_listings}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_listings: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provision (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={editingPlan.commission_rate_percent}
                      onChange={(e) => setEditingPlan({ ...editingPlan, commission_rate_percent: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Suchboost-Faktor</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingPlan.search_boost_factor}
                      onChange={(e) => setEditingPlan({ ...editingPlan, search_boost_factor: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Label>Profilseite</Label>
                    <Switch
                      checked={editingPlan.has_profile_page}
                      onCheckedChange={(v) => setEditingPlan({ ...editingPlan, has_profile_page: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Hervorgehobene Listings</Label>
                    <Switch
                      checked={editingPlan.has_featured_listings}
                      onCheckedChange={(v) => setEditingPlan({ ...editingPlan, has_featured_listings: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>KI-Integration</Label>
                    <Switch
                      checked={editingPlan.has_ai_integration}
                      onCheckedChange={(v) => setEditingPlan({ ...editingPlan, has_ai_integration: v })}
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Feature hinzufügen..."
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature(
                            editingPlan.features,
                            featureInput,
                            (features) => setEditingPlan({ ...editingPlan, features }),
                            () => setFeatureInput("")
                          );
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        addFeature(
                          editingPlan.features,
                          featureInput,
                          (features) => setEditingPlan({ ...editingPlan, features }),
                          () => setFeatureInput("")
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editingPlan.features.map((f, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {f}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() =>
                            removeFeature(
                              editingPlan.features,
                              i,
                              (features) => setEditingPlan({ ...editingPlan, features })
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditOpen(false)}>Abbrechen</Button>
                <Button
                  onClick={() => updatePlanMutation.mutate(editingPlan)}
                  disabled={updatePlanMutation.isPending}
                >
                  {updatePlanMutation.isPending ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create Plan Dialog ─────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Paket erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Anzeigename *</Label>
                <Input
                  placeholder="z.B. Premium Plus"
                  value={newPlan.display_name}
                  onChange={(e) => setNewPlan({ ...newPlan, display_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tier-Schlüssel *</Label>
                <Input
                  placeholder="z.B. premium-plus"
                  value={newPlan.tier}
                  onChange={(e) => setNewPlan({ ...newPlan, tier: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preis (Cent)</Label>
                <Input
                  type="number"
                  value={newPlan.price_cents}
                  onChange={(e) => setNewPlan({ ...newPlan, price_cents: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Listings</Label>
                <Input
                  type="number"
                  value={newPlan.max_listings}
                  onChange={(e) => setNewPlan({ ...newPlan, max_listings: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provision (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={newPlan.commission_rate_percent}
                  onChange={(e) => setNewPlan({ ...newPlan, commission_rate_percent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Suchboost-Faktor</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newPlan.search_boost_factor}
                  onChange={(e) => setNewPlan({ ...newPlan, search_boost_factor: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <Label>Profilseite</Label>
                <Switch
                  checked={newPlan.has_profile_page}
                  onCheckedChange={(v) => setNewPlan({ ...newPlan, has_profile_page: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Hervorgehobene Listings</Label>
                <Switch
                  checked={newPlan.has_featured_listings}
                  onCheckedChange={(v) => setNewPlan({ ...newPlan, has_featured_listings: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>KI-Integration</Label>
                <Switch
                  checked={newPlan.has_ai_integration}
                  onCheckedChange={(v) => setNewPlan({ ...newPlan, has_ai_integration: v })}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Feature hinzufügen..."
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature(
                        newPlan.features,
                        newFeatureInput,
                        (features) => setNewPlan({ ...newPlan, features }),
                        () => setNewFeatureInput("")
                      );
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    addFeature(
                      newPlan.features,
                      newFeatureInput,
                      (features) => setNewPlan({ ...newPlan, features }),
                      () => setNewFeatureInput("")
                    )
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {newPlan.features.map((f, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {f}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() =>
                        removeFeature(
                          newPlan.features,
                          i,
                          (features) => setNewPlan({ ...newPlan, features })
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() => createPlanMutation.mutate(newPlan)}
              disabled={!newPlan.display_name || !newPlan.tier || createPlanMutation.isPending}
            >
              {createPlanMutation.isPending ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Package Dialog ──────────────────────────────── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paket einer Agentur zuweisen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Agentur auswählen</Label>
              <Select value={assignAgencyId} onValueChange={setAssignAgencyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Agentur wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {allAgencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label>Paket / Tier auswählen</Label>
              <Select value={assignTier} onValueChange={setAssignTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Paket wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.tier}>
                      {p.display_name} ({formatPrice(p.price_cents)}/Monat)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() => assignTierMutation.mutate({ agencyId: assignAgencyId, tier: assignTier })}
              disabled={!assignAgencyId || !assignTier || assignTierMutation.isPending}
            >
              {assignTierMutation.isPending ? "Wird zugewiesen..." : "Zuweisen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
