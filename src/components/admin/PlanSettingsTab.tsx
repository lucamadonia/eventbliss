import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Settings, Pencil, Sparkles, Euro, Clock, RefreshCw, Plus } from "lucide-react";
import type { PlanConfig } from "@/hooks/usePlanConfigs";

const AVAILABLE_FEATURES = [
  { key: "basic_planning", label: "Basic Planning" },
  { key: "ai_assistant", label: "AI Assistant" },
  { key: "expense_tracking", label: "Expense Tracking" },
  { key: "team_management", label: "Team Management" },
  { key: "priority_support", label: "Priority Support" },
  { key: "lifetime_updates", label: "Lifetime Updates" },
  { key: "advanced_analytics", label: "Advanced Analytics" },
  { key: "custom_branding", label: "Custom Branding" },
];

export function PlanSettingsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState<{ open: boolean; plan: PlanConfig | null }>({ 
    open: false, 
    plan: null 
  });
  const [formData, setFormData] = useState<Partial<PlanConfig>>({});

  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ["admin-plan-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_configs")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        features: Array.isArray(item.features) ? item.features : []
      })) as PlanConfig[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PlanConfig> & { id: string }) => {
      const { error } = await supabase
        .from("plan_configs")
        .update({
          display_name: data.display_name,
          ai_credits_monthly: data.ai_credits_monthly,
          price_cents: data.price_cents,
          price_currency: data.price_currency,
          billing_interval: data.billing_interval,
          stripe_price_id: data.stripe_price_id,
          features: data.features,
          is_active: data.is_active,
          sort_order: data.sort_order,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("admin.settings.planUpdated", "Plan aktualisiert"));
      queryClient.invalidateQueries({ queryKey: ["admin-plan-configs"] });
      queryClient.invalidateQueries({ queryKey: ["plan-configs"] });
      setEditDialog({ open: false, plan: null });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<PlanConfig>) => {
      const { error } = await supabase
        .from("plan_configs")
        .insert({
          plan_key: data.plan_key,
          display_name: data.display_name || data.plan_key,
          ai_credits_monthly: data.ai_credits_monthly || 0,
          price_cents: data.price_cents || 0,
          price_currency: data.price_currency || "EUR",
          billing_interval: data.billing_interval,
          stripe_price_id: data.stripe_price_id,
          features: data.features || [],
          is_active: data.is_active ?? true,
          sort_order: (plans?.length || 0) + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("admin.settings.planCreated", "Plan erstellt"));
      queryClient.invalidateQueries({ queryKey: ["admin-plan-configs"] });
      queryClient.invalidateQueries({ queryKey: ["plan-configs"] });
      setEditDialog({ open: false, plan: null });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openEditDialog = (plan: PlanConfig | null) => {
    if (plan) {
      setFormData({ ...plan });
    } else {
      setFormData({
        plan_key: "",
        display_name: "",
        ai_credits_monthly: 0,
        price_cents: 0,
        price_currency: "EUR",
        billing_interval: null,
        stripe_price_id: null,
        features: [],
        is_active: true,
      });
    }
    setEditDialog({ open: true, plan });
  };

  const handleSave = () => {
    if (editDialog.plan) {
      updateMutation.mutate({ ...formData, id: editDialog.plan.id } as PlanConfig & { id: string });
    } else {
      if (!formData.plan_key) {
        toast.error(t("admin.settings.planKeyRequired", "Plan-Key ist erforderlich"));
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const toggleFeature = (featureKey: string) => {
    const currentFeatures = formData.features || [];
    if (currentFeatures.includes(featureKey)) {
      setFormData({ ...formData, features: currentFeatures.filter(f => f !== featureKey) });
    } else {
      setFormData({ ...formData, features: [...currentFeatures, featureKey] });
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency,
    }).format(cents / 100);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t("admin.settings.planConfig", "Plan-Konfiguration")}
              </CardTitle>
              <CardDescription>
                {t("admin.settings.planConfigDesc", "Verwalte AI-Credits, Preise und Features pro Plan")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => openEditDialog(null)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.settings.newPlan", "Neuer Plan")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.settings.plan", "Plan")}</TableHead>
                    <TableHead>{t("admin.settings.credits", "AI Credits/Monat")}</TableHead>
                    <TableHead>{t("admin.settings.price", "Preis")}</TableHead>
                    <TableHead>{t("admin.settings.interval", "Intervall")}</TableHead>
                    <TableHead>{t("admin.settings.features", "Features")}</TableHead>
                    <TableHead>{t("admin.settings.status", "Status")}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans?.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.display_name}</div>
                          <code className="text-xs text-muted-foreground">{plan.plan_key}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">{plan.ai_credits_monthly}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          {formatPrice(plan.price_cents, plan.price_currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.billing_interval ? (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {plan.billing_interval === "month" ? "Monatlich" : 
                             plan.billing_interval === "year" ? "Jährlich" : plan.billing_interval}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Einmalig</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {plan.features.slice(0, 3).map((f) => (
                            <Badge key={f} variant="secondary" className="text-xs">
                              {f.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {plan.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{plan.features.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(plan)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, plan: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editDialog.plan 
                ? t("admin.settings.editPlan", "Plan bearbeiten")
                : t("admin.settings.newPlan", "Neuer Plan")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {!editDialog.plan && (
              <div className="space-y-2">
                <Label>{t("admin.settings.planKey", "Plan-Key")} *</Label>
                <Input
                  value={formData.plan_key || ""}
                  onChange={(e) => setFormData({ ...formData, plan_key: e.target.value })}
                  placeholder="z.B. enterprise"
                />
                <p className="text-xs text-muted-foreground">
                  Eindeutiger Identifier (lowercase, keine Leerzeichen)
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>{t("admin.settings.displayName", "Anzeigename")}</Label>
              <Input
                value={formData.display_name || ""}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="z.B. Enterprise"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.settings.aiCredits", "AI Credits / Monat")}</Label>
                <Input
                  type="number"
                  value={formData.ai_credits_monthly || 0}
                  onChange={(e) => setFormData({ ...formData, ai_credits_monthly: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.settings.sortOrder", "Sortierung")}</Label>
                <Input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.settings.priceCents", "Preis (Cents)")}</Label>
                <Input
                  type="number"
                  value={formData.price_cents || 0}
                  onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.price_cents ? formatPrice(formData.price_cents, formData.price_currency || "EUR") : "—"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.settings.currency", "Währung")}</Label>
                <Select 
                  value={formData.price_currency || "EUR"} 
                  onValueChange={(v) => setFormData({ ...formData, price_currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("admin.settings.billingInterval", "Abrechnungsintervall")}</Label>
              <Select 
                value={formData.billing_interval || "none"} 
                onValueChange={(v) => setFormData({ ...formData, billing_interval: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Einmalig (Lifetime)</SelectItem>
                  <SelectItem value="month">Monatlich</SelectItem>
                  <SelectItem value="year">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("admin.settings.stripePriceId", "Stripe Price ID")}</Label>
              <Input
                value={formData.stripe_price_id || ""}
                onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value || null })}
                placeholder="price_..."
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.settings.features", "Features")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_FEATURES.map((feature) => (
                  <div
                    key={feature.key}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                      (formData.features || []).includes(feature.key)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => toggleFeature(feature.key)}
                  >
                    <Switch
                      checked={(formData.features || []).includes(feature.key)}
                      onCheckedChange={() => toggleFeature(feature.key)}
                    />
                    <span className="text-sm">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded border">
              <div>
                <Label>{t("admin.settings.isActive", "Plan aktiv")}</Label>
                <p className="text-xs text-muted-foreground">
                  Inaktive Pläne werden nicht angezeigt
                </p>
              </div>
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, plan: null })}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending || createMutation.isPending}
            >
              {t("common.save", "Speichern")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
