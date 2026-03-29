import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Building2, Palette, Globe, CreditCard, Trash2, Upload, Check,
  ExternalLink, AlertTriangle, Crown, Zap, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { GlassCard } from "./ui/GlassCard";
import { useAgency } from "@/hooks/useAgency";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/* ─── Color Presets ──────────────────────────────────── */
const COLOR_PRESETS = [
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Rose", hex: "#f43f5e" },
];

/* ─── Plan Tiers ─────────────────────────────────────── */
const PLANS = [
  { id: "starter", label: "Starter", icon: Zap, members: 3, events: 10, storageGb: 1, features: ["3 Teammitglieder", "10 Events", "1 GB Speicher", "E-Mail Support"] },
  { id: "professional", label: "Professional", icon: Crown, members: 15, events: 100, storageGb: 25, features: ["15 Teammitglieder", "100 Events", "25 GB Speicher", "Custom Domain", "Priority Support"] },
  { id: "enterprise", label: "Enterprise", icon: Rocket, members: -1, events: -1, storageGb: 100, features: ["Unbegrenzte Mitglieder", "Unbegrenzte Events", "100 GB Speicher", "Custom Domain", "SSO & API", "Dedizierter Support"] },
];

/* ─── Color Picker ───────────────────────────────────── */
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState("");

  return (
    <div className="space-y-2">
      <Label className="text-xs text-slate-400">{label}</Label>
      <div className="flex items-center gap-2 flex-wrap">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            className={cn(
              "w-8 h-8 rounded-lg border-2 transition-all cursor-pointer hover:scale-110",
              value === c.hex ? "border-white shadow-lg scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
        <div className="flex items-center gap-1.5 ml-1">
          <Input
            placeholder="#hex"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={() => { if (/^#[0-9a-fA-F]{6}$/.test(custom)) onChange(custom); }}
            onKeyDown={(e) => { if (e.key === "Enter" && /^#[0-9a-fA-F]{6}$/.test(custom)) onChange(custom); }}
            className="w-20 h-8 text-xs bg-white/[0.04] border-white/[0.08] text-slate-200"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: value }} />
        <span className="text-[11px] text-slate-500 font-mono">{value}</span>
      </div>
    </div>
  );
}

/* ─── Section Wrapper ────────────────────────────────── */
function Section({ icon: Icon, title, children, delay = 0 }: { icon: typeof Building2; title: string; children: React.ReactNode; delay?: number }) {
  return (
    <GlassCard className="p-6" delay={delay}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-violet-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-50">{title}</h3>
      </div>
      {children}
    </GlassCard>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export function AgencySettings() {
  const { agency, members, isOwner, updateAgency, fetchAgency } = useAgency();

  // Profile state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  // Branding state
  const [primaryColor, setPrimaryColor] = useState("#8b5cf6");
  const [accentColor, setAccentColor] = useState("#06b6d4");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Domain state
  const [domain, setDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<"configured" | "pending" | "not_set">("not_set");

  // Saving indicators
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Hydrate from agency
  useEffect(() => {
    if (!agency) return;
    const a = agency as any;
    setName(a.name || "");
    setSlug(a.slug || "");
    setEmail(a.email || "");
    setPhone(a.phone || "");
    setWebsite(a.website || "");
    setAddress(a.address || "");
    setCity(a.city || "");
    setCountry(a.country || "");
    setPrimaryColor(a.primary_color || "#8b5cf6");
    setAccentColor(a.accent_color || "#06b6d4");
    setLogoUrl(a.logo_url || null);
    setDomain(a.custom_domain || "");
    setDomainStatus(a.custom_domain ? (a.domain_verified ? "configured" : "pending") : "not_set");
  }, [agency]);

  const autoSlug = (val: string) => val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const save = async (section: string, updates: Record<string, any>) => {
    await (supabase.from("agencies" as any).update(updates as any).eq("id", agency?.id) as any);
    await fetchAgency();
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agency) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `agency-logos/${agency.id}.${ext}`;
      const { error } = await supabase.storage.from("agency-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("agency-assets").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      await updateAgency({ logo_url: urlData.publicUrl } as any);
    } catch (err) {
      console.error("Logo upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!agency) return;
    await (supabase.from("agency_members" as any).delete().eq("agency_id", agency.id) as any);
    await (supabase.from("agencies" as any).delete().eq("id", agency.id) as any);
    setDeleteOpen(false);
    window.location.reload();
  };

  const currentPlan = ((agency as any)?.plan as string) || "starter";
  const plan = PLANS.find((p) => p.id === currentPlan) || PLANS[0];
  const activeMembers = members.filter((m) => m.status === "active").length;

  if (!agency) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Keine Agentur gefunden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-semibold text-slate-50">Einstellungen</h2>
        <p className="text-sm text-slate-500 mt-0.5">Agentur-Profil, Branding und Abonnement verwalten</p>
      </motion.div>

      {/* Agency Profile */}
      <Section icon={Building2} title="Agentur-Profil" delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Agenturname</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setSlug(autoSlug(e.target.value)); }} className="bg-white/[0.04] border-white/[0.08] text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(autoSlug(e.target.value))} className="bg-white/[0.04] border-white/[0.08] text-slate-100 font-mono text-sm" />
            <p className="text-[10px] text-slate-600">eventbliss.vercel.app/agency/<span className="text-violet-400">{slug || "..."}</span></p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">E-Mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Land</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-slate-100" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-slate-400">Adresse, Stadt</Label>
            <div className="flex gap-3">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Strasse" className="flex-1 bg-white/[0.04] border-white/[0.08] text-slate-100" />
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Stadt" className="w-40 bg-white/[0.04] border-white/[0.08] text-slate-100" />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={() => save("profile", { name, slug, email, phone, website, address, city, country } as any)} className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer gap-2">
            {savedSection === "profile" ? <><Check className="w-4 h-4" /> Gespeichert</> : "Speichern"}
          </Button>
        </div>
      </Section>

      {/* Branding / White-Label */}
      <Section icon={Palette} title="Branding / White-Label" delay={0.1}>
        <div className="space-y-5">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="border-white/[0.08] text-slate-300 hover:bg-white/[0.06] cursor-pointer gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? "Hochladen..." : "Logo hochladen"}
                </Button>
                <p className="text-[10px] text-slate-600 mt-1">PNG, JPG, SVG. Max 2 MB.</p>
              </div>
            </div>
          </div>

          <ColorPicker label="Primaerfarbe" value={primaryColor} onChange={setPrimaryColor} />
          <ColorPicker label="Akzentfarbe" value={accentColor} onChange={setAccentColor} />

          {/* Preview Card */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Vorschau</Label>
            <div className="rounded-xl border border-white/[0.08] p-4 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
                  {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : <Building2 className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{name || "Deine Agentur"}</p>
                  <p className="text-[10px]" style={{ color: accentColor }}>eventbliss.vercel.app/agency/{slug || "..."}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-7 rounded-lg px-3 flex items-center text-xs text-white font-medium" style={{ backgroundColor: primaryColor }}>Primaer</div>
                <div className="h-7 rounded-lg px-3 flex items-center text-xs text-white font-medium" style={{ backgroundColor: accentColor }}>Akzent</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={() => save("branding", { primary_color: primaryColor, accent_color: accentColor } as any)} className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer gap-2">
            {savedSection === "branding" ? <><Check className="w-4 h-4" /> Gespeichert</> : "Speichern"}
          </Button>
        </div>
      </Section>

      {/* Custom Domain */}
      <Section icon={Globe} title="Custom Domain" delay={0.15}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Domain</Label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="events.deineagentur.de" className="bg-white/[0.04] border-white/[0.08] text-slate-100" />
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 space-y-2">
            <p className="text-xs text-slate-300 font-medium">DNS-Konfiguration</p>
            <p className="text-[11px] text-slate-500">Erstelle einen CNAME-Record, der auf <span className="text-violet-400 font-mono">cname.vercel-dns.com</span> zeigt.</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={cn("text-[10px]",
                domainStatus === "configured" ? "border-emerald-500/30 text-emerald-300" :
                domainStatus === "pending" ? "border-amber-500/30 text-amber-300" :
                "border-white/[0.08] text-slate-600"
              )}>
                {domainStatus === "configured" ? "Konfiguriert" : domainStatus === "pending" ? "Ausstehend" : "Nicht gesetzt"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={() => { setDomainStatus(domain ? "pending" : "not_set"); save("domain", { custom_domain: domain || null } as any); }} className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer gap-2">
            {savedSection === "domain" ? <><Check className="w-4 h-4" /> Gespeichert</> : "Speichern"}
          </Button>
        </div>
      </Section>

      {/* Subscription Plan */}
      <Section icon={CreditCard} title="Abonnement" delay={0.2}>
        <div className="space-y-5">
          {/* Current plan */}
          <div className="flex items-center gap-3">
            <plan.icon className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-sm font-semibold text-slate-100">{plan.label}</p>
              <p className="text-[11px] text-slate-500">Aktueller Plan</p>
            </div>
          </div>

          {/* Usage meters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Mitglieder", used: activeMembers, max: plan.members, suffix: "" },
              { label: "Events", used: 12, max: plan.events, suffix: "" },
              { label: "Speicher", used: 0.3, max: plan.storageGb, suffix: " GB" },
            ].map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{m.label}</span>
                  <span className="text-slate-500">{m.used}{m.suffix} / {m.max < 0 ? "Unbegrenzt" : `${m.max}${m.suffix}`}</span>
                </div>
                <Progress value={m.max < 0 ? 5 : (m.used / m.max) * 100} className="h-1.5 bg-white/[0.06]" />
              </div>
            ))}
          </div>

          {/* Feature comparison */}
          <div className="grid grid-cols-3 gap-3">
            {PLANS.map((p) => (
              <div key={p.id} className={cn("rounded-xl border p-3 space-y-2 transition-all",
                p.id === currentPlan ? "border-violet-500/40 bg-violet-500/5" : "border-white/[0.06] bg-white/[0.02]"
              )}>
                <div className="flex items-center gap-2">
                  <p.icon className="w-4 h-4 text-violet-400" />
                  <p className="text-xs font-semibold text-slate-100">{p.label}</p>
                </div>
                <ul className="space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {p.id !== currentPlan && (
                  <Button variant="outline" size="sm" className="w-full text-[10px] h-7 border-white/[0.08] text-slate-300 hover:bg-white/[0.06] cursor-pointer mt-1">
                    Upgrade
                  </Button>
                )}
                {p.id === currentPlan && (
                  <Badge className="text-[9px] bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/20">Aktiv</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <GlassCard className="p-6 border-red-500/20" delay={0.25}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
            <Trash2 className="w-[18px] h-[18px] text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-50">Gefahrenzone</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Die Agentur und alle zugehoerigen Daten werden unwiderruflich geloescht.
        </p>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer gap-2">
              <Trash2 className="w-4 h-4" />
              Agentur loeschen
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1625] border-white/[0.08]">
            <DialogHeader>
              <DialogTitle className="text-slate-50 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Agentur loeschen?
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Diese Aktion kann nicht rueckgaengig gemacht werden. Alle Events, Kontakte und Dateien werden geloescht.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="text-slate-400 cursor-pointer">
                Abbrechen
              </Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer gap-2">
                <Trash2 className="w-4 h-4" />
                Endgueltig loeschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GlassCard>
    </div>
  );
}
