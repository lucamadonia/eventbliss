import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAgency } from "@/hooks/useAgency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Globe, Code2, Copy, Check, ExternalLink, Sparkles, Eye, MonitorSmartphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://event-bliss.com";

export default function AgencyEmbedCenter() {
  const { t } = useTranslation();
  const { agency } = useAgency();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [locale, setLocale] = useState("de");
  const [hideHeader, setHideHeader] = useState(true);
  const [height, setHeight] = useState(1200);
  const [copied, setCopied] = useState<string | null>(null);

  const publicUrl = useMemo(() => {
    if (!agency?.slug) return "";
    return `${ORIGIN}/marketplace/agency/${agency.slug}`;
  }, [agency?.slug]);

  const embedUrl = useMemo(() => {
    if (!agency?.slug) return "";
    const params = new URLSearchParams();
    if (theme !== "dark") params.set("theme", theme);
    if (locale !== "de") params.set("lang", locale);
    if (!hideHeader) params.set("header", "1");
    const qs = params.toString();
    return `${ORIGIN}/embed/agency/${agency.slug}${qs ? `?${qs}` : ""}`;
  }, [agency?.slug, theme, locale, hideHeader]);

  const embedSnippet = useMemo(() => {
    if (!embedUrl) return "";
    return `<iframe
  src="${embedUrl}"
  style="width:100%;max-width:1200px;height:${height}px;border:0;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.1);"
  title="${agency?.name ?? "Agentur"} — Buchungen"
  loading="lazy"
  allow="fullscreen"
></iframe>`;
  }, [embedUrl, height, agency?.name]);

  const scriptSnippet = useMemo(() => {
    if (!embedUrl) return "";
    return `<!-- EventBliss Agency Embed -->
<div id="eventbliss-agency-${agency?.slug ?? "widget"}"></div>
<script>
  (function() {
    var d = document.getElementById('eventbliss-agency-${agency?.slug ?? "widget"}');
    if (!d) return;
    var i = document.createElement('iframe');
    i.src = '${embedUrl}';
    i.style.cssText = 'width:100%;height:${height}px;border:0;border-radius:16px;';
    i.title = '${agency?.name ?? "Agentur"}';
    i.loading = 'lazy';
    d.appendChild(i);
  })();
</script>`;
  }, [embedUrl, agency, height]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success(t("agency.embed.copied", "In Zwischenablage kopiert"));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("common.error", "Fehler"));
    }
  };

  if (!agency) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        {t("agency.embed.noAgency", "Keine Agentur gefunden.")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl md:text-3xl font-black">
            {t("agency.embed.title", "Einbettung & Öffentliche Seite")}
          </h2>
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 font-bold">
            <Sparkles className="w-3 h-3 mr-1" />
            Enterprise
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("agency.embed.subtitle", "Teile deine Services und den Buchungskalender — auf deiner Website oder als öffentliche EventBliss-Seite.")}
        </p>
      </div>

      {/* Public URL card */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4" />
            {t("agency.embed.publicUrlTitle", "Deine öffentliche EventBliss-Seite")}
          </CardTitle>
          <CardDescription>
            {t("agency.embed.publicUrlDesc", "Falls du keine eigene Website hast — teile diesen Link direkt mit Kunden, auf Social Media, in E-Mail-Signaturen etc.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Input value={publicUrl} readOnly className="font-mono text-xs" />
            <Button size="sm" variant="outline" onClick={() => copy(publicUrl, "public")} className="gap-1.5">
              {copied === "public" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {t("common.copy", "Kopieren")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(publicUrl, "_blank")}
              className="gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("agency.embed.open", "Öffnen")}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {t("agency.embed.publicUrlHint", "QR-Code-tauglich, responsiv, SEO-optimiert. Kunden können direkt Services buchen.")}
          </div>
        </CardContent>
      </Card>

      {/* Embed tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code2 className="w-4 h-4" />
            {t("agency.embed.embedTitle", "Auf deiner Website einbetten")}
          </CardTitle>
          <CardDescription>
            {t("agency.embed.embedDesc", "Füge deine Services + Buchungs-Kalender direkt in deine bestehende Website ein.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Config */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("agency.embed.theme", "Theme")}</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as "dark" | "light")}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">{t("agency.embed.themeDark", "Dark (empfohlen)")}</SelectItem>
                  <SelectItem value="light">{t("agency.embed.themeLight", "Light")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("agency.embed.language", "Sprache")}</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar"].map((l) => (
                    <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("agency.embed.height", "Höhe (px)")}</Label>
              <Input
                type="number"
                min={600}
                max={3000}
                step={50}
                value={height}
                onChange={(e) => setHeight(Math.max(600, Math.min(3000, Number(e.target.value) || 1200)))}
                className="h-8"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs flex items-center gap-1.5">
                  <MonitorSmartphone className="w-3.5 h-3.5" />
                  {t("agency.embed.hideChrome", "App-Header ausblenden")}
                </Label>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {t("agency.embed.hideChromeHint", "Empfohlen für saubere Einbettung")}
                </div>
              </div>
              <Switch checked={hideHeader} onCheckedChange={setHideHeader} />
            </div>
          </div>

          <Tabs defaultValue="iframe">
            <TabsList>
              <TabsTrigger value="iframe">iframe HTML</TabsTrigger>
              <TabsTrigger value="script">JavaScript Snippet</TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="iframe" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("agency.embed.iframeLabel", "Einfaches iframe")}</Label>
                <Button size="sm" variant="outline" onClick={() => copy(embedSnippet, "iframe")} className="h-7 gap-1.5">
                  {copied === "iframe" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {t("common.copy", "Kopieren")}
                </Button>
              </div>
              <Textarea
                value={embedSnippet}
                readOnly
                rows={7}
                className="font-mono text-[11px] bg-muted/30"
              />
              <p className="text-xs text-muted-foreground">
                {t("agency.embed.iframeHint", "Einfach kopieren und in deine Website einfügen — z. B. in WordPress als HTML-Block.")}
              </p>
            </TabsContent>

            <TabsContent value="script" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("agency.embed.scriptLabel", "Script-Snippet (Vanilla JS)")}</Label>
                <Button size="sm" variant="outline" onClick={() => copy(scriptSnippet, "script")} className="h-7 gap-1.5">
                  {copied === "script" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {t("common.copy", "Kopieren")}
                </Button>
              </div>
              <Textarea
                value={scriptSnippet}
                readOnly
                rows={11}
                className="font-mono text-[11px] bg-muted/30"
              />
            </TabsContent>

            <TabsContent value="preview">
              <div className="rounded-lg border overflow-hidden bg-white/[0.03]">
                <div className="px-3 py-1.5 border-b bg-muted/30 text-[11px] font-mono text-muted-foreground flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400/70" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/70" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className="truncate">{embedUrl}</span>
                </div>
                <iframe
                  src={embedUrl}
                  title="Embed preview"
                  style={{ width: "100%", height: "600px", border: 0 }}
                  loading="lazy"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 text-sm">
            <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground mb-1">
                {t("agency.embed.tipTitle", "Profi-Tipp")}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("agency.embed.tipBody", "Für WordPress gibt es das Plugin \"Advanced iframe\". Für Webflow/Framer/Wix die eigenen Embed-Blöcke nutzen. Bei eigener React/Next.js-Site das Script-Snippet verwenden — dann lädt der iframe lazy beim Scrollen.")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
