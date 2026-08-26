/**
 * Das Verzeichnis: Liste, Filter, Anlegen, Einlesen.
 *
 * DER KNOPF "HINZUFUEGEN" FEHLTE. Die erste Fassung hatte nur den CSV-Import —
 * wer einen einzelnen Influencer erfassen wollte, musste sich eine
 * Tabellenzeile bauen. Der Hook zum Anlegen existierte bereits und wurde von
 * nirgendwo aufgerufen; genau so entstehen Oberflaechen, die auf dem Papier
 * vollstaendig sind und in der Hand nicht.
 */
import { useMemo, useState } from "react";
import { Plus, Search, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  INFLUENCER_PLATFORMS, INFLUENCER_PLATFORM_LABEL, INFLUENCER_PRIORITIES,
  INFLUENCER_PRIORITY_LABEL, INFLUENCER_STATUSES, INFLUENCER_STATUS_LABEL,
  formatReach, type InfluencerPlatform, type InfluencerPriority, type InfluencerStatus,
} from "@/lib/influencer-status";
import {
  useCreateInfluencer, useImportInfluencers, useInfluencerGroups, useInfluencers,
  type Influencer,
} from "@/hooks/useInfluencers";
import InfluencerDetail from "./InfluencerDetail";

export default function InfluencerDirectory() {
  const { data: influencers = [], isLoading } = useInfluencers();
  const { data: groups = [] } = useInfluencerGroups();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return influencers.filter((i) => {
      const matchesSearch =
        !q ||
        i.handle.toLowerCase().includes(q) ||
        (i.display_name || "").toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        (i.niche || []).some((n) => n.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || i.outreach_status === statusFilter;
      const matchesPlatform = platformFilter === "all" || i.platform === platformFilter;
      const matchesGroup =
        groupFilter === "all" ||
        (groupFilter === "none" ? !i.group_id : String(i.group_id) === groupFilter);
      return matchesSearch && matchesStatus && matchesPlatform && matchesGroup;
    });
  }, [influencers, search, statusFilter, platformFilter, groupFilter]);

  const selected = influencers.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">
              Verzeichnis
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {filtered.length} von {influencers.length}
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                CSV einlesen
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Influencer hinzufügen
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Handle, Name, E-Mail oder Nische suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {INFLUENCER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{INFLUENCER_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Plattform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Plattformen</SelectItem>
                {INFLUENCER_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{INFLUENCER_PLATFORM_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Gruppe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Gruppen</SelectItem>
                <SelectItem value="none">Ohne Gruppe</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Handle</TableHead>
                  <TableHead>Plattform</TableHead>
                  <TableHead className="text-right">Reichweite</TableHead>
                  <TableHead>Nische</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zugang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Lade…</TableCell></TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      {influencers.length === 0
                        ? "Noch niemand erfasst — „Influencer hinzufügen“ oder eine Liste einlesen."
                        : "Keine Treffer."}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((i) => (
                  <TableRow key={i.id} className="cursor-pointer" onClick={() => setSelectedId(i.id)}>
                    <TableCell>
                      <div className="font-medium">{i.handle}</div>
                      <div className="text-xs text-muted-foreground">{i.display_name || i.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{INFLUENCER_PLATFORM_LABEL[i.platform]}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{formatReach(i.followers)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(i.niche || []).slice(0, 2).map((n) => (
                          <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                        ))}
                        {(i.niche || []).length > 2 && (
                          <span className="text-xs text-muted-foreground">+{(i.niche || []).length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(i.outreach_status)}>
                        {INFLUENCER_STATUS_LABEL[i.outreach_status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {i.user_id
                        ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25">Konto</Badge>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selected && <InfluencerDetail influencer={selected} onClose={() => setSelectedId(null)} />}
      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

function statusVariant(s: InfluencerStatus): "default" | "secondary" | "outline" | "destructive" {
  if (["accepted", "onboarded", "delivering", "delivered", "completed"].includes(s)) return "default";
  if (["declined", "ghosted", "cancelled"].includes(s)) return "destructive";
  if (s === "new") return "outline";
  return "secondary";
}

/* ── Anlegen ─────────────────────────────────────────────────────────── */

function CreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useCreateInfluencer();
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [platform, setPlatform] = useState<InfluencerPlatform>("instagram");
  const [followers, setFollowers] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [country, setCountry] = useState("DE");
  const [language, setLanguage] = useState("de");
  const [priority, setPriority] = useState<InfluencerPriority>("normal");
  const [niche, setNiche] = useState("");

  const valid = handle.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  const reset = () => {
    setHandle(""); setEmail(""); setDisplayName(""); setPlatform("instagram");
    setFollowers(""); setProfileUrl(""); setCountry("DE"); setLanguage("de");
    setPriority("normal"); setNiche("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Influencer hinzufügen</DialogTitle>
          <DialogDescription>Handle und E-Mail genügen — alles andere lässt sich später ergänzen.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Handle *</Label>
              <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="feier.laune" />
            </div>
            <div className="space-y-2">
              <Label>Plattform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as InfluencerPlatform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INFLUENCER_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{INFLUENCER_PLATFORM_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>E-Mail *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Follower</Label>
              <Input type="number" value={followers} onChange={(e) => setFollowers(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priorität</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as InfluencerPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INFLUENCER_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{INFLUENCER_PRIORITY_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profil-Link</Label>
            <Input value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="https://instagram.com/…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Land</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))} />
            </div>
            <div className="space-y-2">
              <Label>Sprache</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value.toLowerCase().slice(0, 2))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nische</Label>
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="JGA, Reise, Party — mit Komma trennen" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button
            disabled={!valid || create.isPending}
            onClick={() =>
              create.mutate(
                {
                  handle: handle.trim(),
                  email: email.trim().toLowerCase(),
                  display_name: displayName.trim() || null,
                  platform,
                  followers: followers ? parseInt(followers, 10) : null,
                  profile_url: profileUrl.trim() || null,
                  country_code: country || "DE",
                  language: language || "de",
                  priority,
                  niche: niche.split(",").map((n) => n.trim()).filter(Boolean),
                },
                { onSuccess: () => { reset(); onOpenChange(false); } },
              )
            }
          >
            {create.isPending ? "Lege an…" : "Anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── CSV-Import ──────────────────────────────────────────────────────── */

const CSV_HEADER = "handle,email,platform,followers,profile_url,country_code,language";

/**
 * Bewusst ein Textfeld statt eines Datei-Uploads: Listen entstehen in
 * Tabellenprogrammen, und der Weg dorthin ist Kopieren, nicht Speichern.
 */
function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [raw, setRaw] = useState("");
  const importer = useImportInfluencers();

  const rows = useMemo(() => parseCsv(raw), [raw]);
  const usable = rows.filter((r) => r.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Influencer einlesen</DialogTitle>
          <DialogDescription>
            Eine Zeile je Influencer. Erste Zeile sind die Spaltennamen; erkannt werden{" "}
            <code className="text-xs">{CSV_HEADER}</code>. Bekannte E-Mail-Adressen werden aktualisiert, nicht doppelt angelegt.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          rows={10}
          className="font-mono text-xs"
          placeholder={`${CSV_HEADER}\nfeier.laune,mail@example.com,instagram,18400,https://instagram.com/feier.laune,DE,de`}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />

        <p className="text-sm text-muted-foreground">
          {rows.length > 0 ? `${rows.length} Zeile(n) erkannt` : "Noch nichts erkannt"}
          {rows.length > usable.length && `, ${rows.length - usable.length} ohne E-Mail werden übersprungen`}.
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button
            disabled={usable.length === 0 || importer.isPending}
            onClick={() => importer.mutate(usable, { onSuccess: () => { setRaw(""); onOpenChange(false); } })}
          >
            {importer.isPending ? "Lese ein…" : "Einlesen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Genuegsamer CSV-Leser: Komma oder Semikolon, Anfuehrungszeichen weg,
 * unbekannte Spalten werden ignoriert statt abgelehnt. Eine Liste, die an
 * einer unbekannten Spalte scheitert, kostet mehr Zeit als eine, die zu wenig
 * uebernimmt.
 */
function parseCsv(raw: string): Partial<Influencer>[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const cols = lines[0].split(sep).map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const get = (name: string) => {
      const idx = cols.indexOf(name);
      return idx >= 0 ? (cells[idx] ?? "") : "";
    };
    const platform = get("platform").toLowerCase();
    const followers = parseInt(get("followers").replace(/[^0-9]/g, ""), 10);
    const priority = get("priority").toLowerCase();

    return {
      handle: get("handle") || get("email").split("@")[0],
      email: get("email").toLowerCase(),
      display_name: get("display_name") || null,
      platform: (INFLUENCER_PLATFORMS as readonly string[]).includes(platform)
        ? (platform as InfluencerPlatform)
        : "instagram",
      followers: Number.isFinite(followers) ? followers : null,
      profile_url: get("profile_url") || null,
      country_code: (get("country_code") || "DE").toUpperCase().slice(0, 2),
      language: (get("language") || "de").toLowerCase().slice(0, 2),
      priority: (INFLUENCER_PRIORITIES as readonly string[]).includes(priority)
        ? (priority as InfluencerPriority)
        : "normal",
    } as Partial<Influencer>;
  });
}
