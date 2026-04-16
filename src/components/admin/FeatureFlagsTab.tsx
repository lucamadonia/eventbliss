import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Flag, Plus, Percent, Loader2, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_tiers: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function FeatureFlagsTab() {
  const { t } = useTranslation();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: "", name: "", description: "" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`${t("common.error", "Fehler")}: ${error.message}`);
    } else {
      setFlags((data as FeatureFlag[]) ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleFlag = async (flag: FeatureFlag) => {
    setToggling(flag.id);
    const { error } = await supabase
      .from("feature_flags")
      .update({ is_enabled: !flag.is_enabled })
      .eq("id", flag.id);
    if (error) {
      toast.error(`${t("common.error", "Fehler")}: ${error.message}`);
    } else {
      await supabase.rpc("log_admin_action", {
        p_action: "feature_flag.toggle",
        p_target_type: "feature_flag",
        p_target_id: flag.id,
        p_metadata: { key: flag.key, new_state: !flag.is_enabled },
      });
      toast.success(t("admin.flags.toggled", "Flag aktualisiert"));
      await load();
    }
    setToggling(null);
  };

  const updateRollout = async (flag: FeatureFlag, percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    const { error } = await supabase
      .from("feature_flags")
      .update({ rollout_percentage: clamped })
      .eq("id", flag.id);
    if (!error) {
      await supabase.rpc("log_admin_action", {
        p_action: "feature_flag.rollout",
        p_target_type: "feature_flag",
        p_target_id: flag.id,
        p_metadata: { key: flag.key, rollout: clamped },
      });
      await load();
    }
  };

  const createFlag = async () => {
    if (!newFlag.key || !newFlag.name) return;
    setCreating(true);
    const { error } = await supabase.from("feature_flags").insert({
      key: newFlag.key,
      name: newFlag.name,
      description: newFlag.description || null,
      is_enabled: false,
      rollout_percentage: 100,
    });
    if (error) {
      toast.error(`${t("common.error", "Fehler")}: ${error.message}`);
    } else {
      await supabase.rpc("log_admin_action", {
        p_action: "feature_flag.create",
        p_target_type: "feature_flag",
        p_metadata: { key: newFlag.key },
      });
      toast.success(t("admin.flags.created", "Flag erstellt"));
      setDialogOpen(false);
      setNewFlag({ key: "", name: "", description: "" });
      await load();
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black mb-1">{t("admin.flags.title", "Feature Flags")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.flags.subtitle", "Features zur Laufzeit an-/ausschalten oder stufenweise ausrollen")}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{t("admin.flags.new", "Neues Flag")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.flags.newTitle", "Neues Feature Flag")}</DialogTitle>
              <DialogDescription>
                {t("admin.flags.newDescription", "Erstelle ein neues Feature Flag. Der Key wird im Code referenziert.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="flag-key">{t("admin.flags.key", "Key")} <span className="text-muted-foreground font-mono text-xs">(snake_case)</span></Label>
                <Input id="flag-key" placeholder="e.g. new_onboarding_flow" value={newFlag.key} onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} />
              </div>
              <div>
                <Label htmlFor="flag-name">{t("admin.flags.name", "Name")}</Label>
                <Input id="flag-name" placeholder="New Onboarding Flow" value={newFlag.name} onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="flag-desc">{t("admin.flags.description", "Beschreibung")}</Label>
                <Textarea id="flag-desc" placeholder={t("admin.flags.descriptionPlaceholder", "Was macht dieses Flag?")} value={newFlag.description} onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel", "Abbrechen")}</Button>
              <Button onClick={createFlag} disabled={!newFlag.key || !newFlag.name || creating}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.flags.create", "Erstellen")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Flag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t("admin.flags.empty", "Noch keine Feature Flags angelegt")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {flags.map((flag) => (
            <Card key={flag.id} className={cn("transition-colors", flag.is_enabled ? "border-emerald-500/30" : "border-white/10")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CardTitle className="text-base">{flag.name}</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs">{flag.key}</Badge>
                      <Badge className={cn(flag.is_enabled ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : "bg-slate-500/15 text-slate-500 border-slate-500/30")}>
                        {flag.is_enabled ? t("admin.flags.enabled", "Aktiv") : t("admin.flags.disabled", "Inaktiv")}
                      </Badge>
                    </div>
                    {flag.description && (
                      <CardDescription>{flag.description}</CardDescription>
                    )}
                  </div>
                  <Switch
                    checked={flag.is_enabled}
                    disabled={toggling === flag.id}
                    onCheckedChange={() => toggleFlag(flag)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor={`rollout-${flag.id}`} className="text-xs text-muted-foreground">{t("admin.flags.rollout", "Rollout")}:</Label>
                    <Input
                      id={`rollout-${flag.id}`}
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={flag.rollout_percentage}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (Number.isFinite(v) && v !== flag.rollout_percentage) updateRollout(flag, v);
                      }}
                      className="w-20 h-8"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  {flag.target_tiers && flag.target_tiers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UsersIcon className="w-3.5 h-3.5" />
                      {flag.target_tiers.join(", ")}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground ml-auto">
                    {t("admin.flags.updated", "Aktualisiert")}: {new Date(flag.updated_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
