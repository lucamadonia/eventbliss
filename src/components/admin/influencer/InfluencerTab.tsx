/**
 * Influencer im Adminbereich — Verzeichnis, Detail, Probe-Abo, CSV-Import.
 *
 * BEWUSST GETRENNT VON DER AGENTUR-AKQUISE. Beide Programme laufen nach
 * demselben Muster, aber mit anderen Groessen: eine Agentur hat eine Stadt und
 * ein Angebot, ein Influencer hat eine Plattform und eine Reichweite. Eine
 * gemeinsame Liste haette bei jedem Eintrag die Haelfte der Spalten leer.
 *
 * Alle Auswahlwerte stammen aus src/lib/influencer-status.ts — derselben
 * Datei, aus der die CHECK-Klauseln der Migration abgeschrieben sind. Genau
 * hier lief heute dreimal derselbe Fehler auf: eine Oberflaeche, die Werte
 * anbot, die die Spalte nicht kennt.
 */
import { useMemo, useState } from "react";
import {
  Award, Copy, Download, Instagram, Search, Sparkles, Upload, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  INFLUENCER_PLATFORMS, INFLUENCER_PLATFORM_LABEL, INFLUENCER_PRIORITIES,
  INFLUENCER_PRIORITY_LABEL, INFLUENCER_STATUSES, INFLUENCER_STATUS_LABEL,
  formatReach, type InfluencerPlatform, type InfluencerStatus,
} from "@/lib/influencer-status";
import { isValidTrialMonths, TRIAL_MONTHS_MAX, TRIAL_MONTHS_MIN } from "@/lib/subscription-plans";
import {
  useGrantInfluencerTrial, useImportInfluencers, useInfluencers, useUpdateInfluencer,
  type Influencer,
} from "@/hooks/useInfluencers";

export default function InfluencerTab() {
  const { data: influencers = [], isLoading } = useInfluencers();
  const update = useUpdateInfluencer();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Influencer | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return influencers.filter((i) => {
      const matchesSearch =
        !q ||
        i.handle.toLowerCase().includes(q) ||
        (i.display_name || "").toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || i.outreach_status === statusFilter;
      const matchesPlatform = platformFilter === "all" || i.platform === platformFilter;
      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [influencers, search, statusFilter, platformFilter]);

  const totalReach = useMemo(
    () => influencers.reduce((sum, i) => sum + (i.followers || 0), 0),
    [influencers],
  );
  const openCount = influencers.filter((i) => i.outreach_status === "new").length;
  const activeCount = influencers.filter((i) =>
    ["accepted", "onboarded", "delivering", "delivered"].includes(i.outreach_status),
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Influencer
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Wen haben wir angeschrieben, was ist vereinbart, wer hat Zugang.
              </p>
            </div>
            <Button onClick={() => setImportOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              CSV einlesen
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Gesamt" value={String(influencers.length)} icon={Users} />
            <Stat label="Unbearbeitet" value={String(openCount)} icon={Search} />
            <Stat label="Zugesagt / aktiv" value={String(activeCount)} icon={Award} />
            <Stat label="Reichweite gesamt" value={formatReach(totalReach)} icon={Instagram} />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Handle, Name oder E-Mail suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[190px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {INFLUENCER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{INFLUENCER_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plattform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Plattformen</SelectItem>
                {INFLUENCER_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{INFLUENCER_PLATFORM_LABEL[p]}</SelectItem>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Zugang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Lade…</TableCell></TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      {influencers.length === 0
                        ? "Noch keine Influencer erfasst — mit \"CSV einlesen\" geht es los."
                        : "Keine Treffer."}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((i) => (
                  <TableRow key={i.id} className="cursor-pointer" onClick={() => setSelected(i)}>
                    <TableCell>
                      <div className="font-medium">{i.handle}</div>
                      <div className="text-xs text-muted-foreground">{i.display_name || i.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{INFLUENCER_PLATFORM_LABEL[i.platform]}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatReach(i.followers)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(i.outreach_status)}>
                        {INFLUENCER_STATUS_LABEL[i.outreach_status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {i.user_id
                        ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25">Konto verknüpft</Badge>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <InfluencerDetail
          influencer={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(status) => {
            update.mutate({ id: selected.id, patch: { outreach_status: status } });
            setSelected({ ...selected, outreach_status: status });
          }}
          onNotes={(notes) => {
            update.mutate({ id: selected.id, patch: { notes } });
            setSelected({ ...selected, notes });
          }}
        />
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function statusVariant(s: InfluencerStatus): "default" | "secondary" | "outline" | "destructive" {
  if (["accepted", "onboarded", "delivering", "delivered", "completed"].includes(s)) return "default";
  if (["declined", "ghosted", "cancelled"].includes(s)) return "destructive";
  if (s === "new") return "outline";
  return "secondary";
}

/* ─────────────────────────────────────────────────────────────────────
   Detail
   ───────────────────────────────────────────────────────────────────── */

function InfluencerDetail({
  influencer, onClose, onStatusChange, onNotes,
}: {
  influencer: Influencer;
  onClose: () => void;
  onStatusChange: (s: InfluencerStatus) => void;
  onNotes: (n: string) => void;
}) {
  const grant = useGrantInfluencerTrial();
  const [months, setMonths] = useState("3");
  const [notes, setNotes] = useState(influencer.notes || "");
  const [lastCode, setLastCode] = useState<string | null>(null);

  const monthsNum = parseInt(months, 10);
  const monthsOk = isValidTrialMonths(monthsNum);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{influencer.handle}</DialogTitle>
          <DialogDescription>
            {[influencer.display_name, influencer.email].filter(Boolean).join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Field label="Plattform" value={INFLUENCER_PLATFORM_LABEL[influencer.platform]} />
            <Field label="Follower" value={formatReach(influencer.followers)} />
            <Field label="Ø Views" value={formatReach(influencer.avg_views)} />
            <Field label="Priorität" value={INFLUENCER_PRIORITY_LABEL[influencer.priority]} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={influencer.outreach_status} onValueChange={(v) => onStatusChange(v as InfluencerStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INFLUENCER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{INFLUENCER_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/*
            Probe-Abo. Ein Influencer hat zu diesem Zeitpunkt meist noch kein
            Konto — ein Abo braucht aber eine user_id. Deshalb entsteht hier ein
            persoenlicher Code, den er beim Anmelden einloest; das Abo legt dann
            redeem-voucher mit dem richtigen Ablaufdatum an.
          */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Award className="h-4 w-4" />
              Probe-Abo vergeben
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={TRIAL_MONTHS_MIN}
                max={TRIAL_MONTHS_MAX}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">Monate</span>
              <Button
                size="sm"
                disabled={!monthsOk || grant.isPending}
                onClick={() =>
                  grant.mutate(
                    { influencer, months: monthsNum },
                    { onSuccess: ({ code }) => setLastCode(code) },
                  )
                }
              >
                Code erzeugen
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={grant.isPending}
                onClick={() =>
                  grant.mutate(
                    { influencer, months: 0, unlimited: true },
                    { onSuccess: ({ code }) => setLastCode(code) },
                  )
                }
              >
                Unbegrenzt
              </Button>
            </div>

            {lastCode && (
              <div className="flex items-center gap-2 rounded-md bg-background border px-3 py-2">
                <code className="font-mono text-sm flex-1">{lastCode}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(lastCode);
                    toast.success("Code kopiert");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Der Code ist 60 Tage einlösbar. Die Laufzeit des Zugangs beginnt erst mit der Einlösung.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notizen</Label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button size="sm" variant="outline" onClick={() => onNotes(notes)}>Notiz speichern</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CSV-Import
   ───────────────────────────────────────────────────────────────────── */

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
            <code className="text-xs">{CSV_HEADER}</code>. E-Mail ist Pflicht — bekannte Adressen werden aktualisiert, nicht doppelt angelegt.
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
            onClick={() =>
              importer.mutate(usable, {
                onSuccess: () => { setRaw(""); onOpenChange(false); },
              })
            }
          >
            <Download className="h-4 w-4 mr-2" />
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
        ? (priority as Influencer["priority"])
        : "normal",
    } as Partial<Influencer>;
  });
}
