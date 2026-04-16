import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Mail, CreditCard, Shield, ServerCog, Lock, Save, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Setting {
  id: string;
  category: string;
  key: string;
  value: unknown;
  description: string | null;
  is_secret: boolean;
  updated_at: string;
}

const CATEGORY_ICON: Record<string, typeof Mail> = {
  email: Mail,
  billing: CreditCard,
  security: Shield,
  platform: ServerCog,
};

const CATEGORY_ACCENT: Record<string, string> = {
  email: "from-pink-500 to-rose-600",
  billing: "from-violet-500 to-purple-600",
  security: "from-red-500 to-orange-600",
  platform: "from-cyan-500 to-blue-600",
};

const CATEGORY_ORDER = ["platform", "email", "billing", "security"];

export default function SystemSettingsTab() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, unknown>>({});

  const load = async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true });
    if (error) toast.error(`${t("common.error", "Fehler")}: ${error.message}`);
    setSettings((data as Setting[]) ?? []);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSetting = async (setting: Setting, newValue: unknown) => {
    setSaving(setting.id);
    const { error } = await supabase
      .from("system_settings")
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq("id", setting.id);
    if (error) {
      toast.error(`${t("common.error", "Fehler")}: ${error.message}`);
    } else {
      await supabase.rpc("log_admin_action", {
        p_action: "system_setting.update",
        p_target_type: "system_setting",
        p_target_id: setting.id,
        p_metadata: { category: setting.category, key: setting.key, new_value: newValue },
      });
      toast.success(t("admin.settings.saved", "Gespeichert"));
      const { [setting.id]: _discarded, ...rest } = edits;
      setEdits(rest);
      await load();
    }
    setSaving(null);
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    settings: settings.filter((s) => s.category === cat),
  })).filter((g) => g.settings.length > 0);

  const renderEditor = (setting: Setting) => {
    const currentValue = edits[setting.id] !== undefined ? edits[setting.id] : setting.value;
    const isDirty = edits[setting.id] !== undefined;

    if (typeof currentValue === "boolean") {
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={currentValue as boolean}
            onCheckedChange={(checked) => saveSetting(setting, checked)}
            disabled={saving === setting.id}
          />
          <span className="text-sm text-muted-foreground">
            {currentValue ? t("admin.settings.on", "An") : t("admin.settings.off", "Aus")}
          </span>
        </div>
      );
    }

    if (typeof currentValue === "number" || typeof currentValue === "string") {
      return (
        <div className="flex items-center gap-2">
          <Input
            type={typeof currentValue === "number" ? "number" : "text"}
            value={String(currentValue)}
            onChange={(e) => {
              const v = typeof currentValue === "number" ? Number(e.target.value) : e.target.value;
              setEdits({ ...edits, [setting.id]: v });
            }}
            className={cn("h-9", setting.is_secret && "font-mono")}
          />
          <Button
            size="sm"
            disabled={!isDirty || saving === setting.id}
            onClick={() => saveSetting(setting, currentValue)}
            className="gap-1.5"
          >
            {saving === setting.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {t("admin.settings.save", "Speichern")}
          </Button>
        </div>
      );
    }

    return (
      <Input
        value={JSON.stringify(currentValue)}
        readOnly
        className="font-mono text-xs"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-black mb-1">{t("admin.settings.title", "System-Einstellungen")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.settings.subtitle", "Plattform-weite Konfiguration — Feature-Freischaltung, E-Mail-Defaults, Security.")}
        </p>
      </div>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <strong>{t("admin.settings.warningTitle", "Achtung")}:</strong>{" "}
            {t("admin.settings.warningBody", "Änderungen wirken sofort auf alle Nutzer. Teste kritische Settings zuerst im Staging. Secrets wie SMTP-Passwörter und Stripe-Keys werden NICHT hier gespeichert — die gehören in Supabase Secrets.")}
          </div>
        </CardContent>
      </Card>

      {grouped.map((group) => {
        const Icon = CATEGORY_ICON[group.category] ?? ServerCog;
        const accent = CATEGORY_ACCENT[group.category] ?? "from-slate-500 to-slate-700";
        return (
          <section key={group.category}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm", accent)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold capitalize">{group.category}</h3>
                <p className="text-xs text-muted-foreground">
                  {group.settings.length} {t("admin.settings.entries", "Einstellungen")}
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              {group.settings.map((setting) => (
                <Card key={setting.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-sm font-mono">{setting.key}</CardTitle>
                          {setting.is_secret && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Lock className="w-3 h-3" /> Secret
                            </Badge>
                          )}
                        </div>
                        {setting.description && (
                          <CardDescription className="mt-1">{setting.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderEditor(setting)}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {t("admin.settings.lastUpdated", "Zuletzt aktualisiert")}: {new Date(setting.updated_at).toLocaleString("de-DE")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {/* Danger Zone */}
      <Card className="border-red-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" /> {t("admin.settings.dangerTitle", "Danger Zone")}
          </CardTitle>
          <CardDescription>
            {t("admin.settings.dangerSubtitle", "Irreversible Operationen — nur wenn du weißt was du tust.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t("admin.settings.maintenanceToggle", "Wartungsmodus umschalten")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("admin.settings.maintenanceConfirm", "Wartungsmodus aktivieren?")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("admin.settings.maintenanceDesc", "Im Wartungsmodus sehen alle Nicht-Admin-User eine Maintenance-Seite. Kein neuer Signup, keine Bookings. Nur umschalten wenn WIRKLICH nötig.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel", "Abbrechen")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    const mm = settings.find((s) => s.category === "platform" && s.key === "maintenance_mode");
                    if (mm) await saveSetting(mm, !(mm.value as boolean));
                  }}
                >
                  {t("admin.settings.confirmToggle", "Ja, umschalten")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
