/**
 * Drei Bereiche der Influencer-Detailansicht: Konto, Briefing, Verlauf.
 *
 * Zusammen in einer Datei, weil sie sich dieselben Hilfsteile teilen und
 * einzeln zu klein fuer eigene Dateien waeren — aber ausdruecklich NICHT in
 * InfluencerDetail.tsx, das sonst ueber tausend Zeilen ginge.
 */
import { useEffect, useState } from "react";
import {
  Check, Download, FileUp, Link2, Megaphone, Phone, StickyNote, Trash2, Unlink, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { de as deLocale } from "date-fns/locale";
import {
  EMPTY_BRIEFING, fromTemplate, hasBriefingContent, toLines, toList,
  type BriefingFields,
} from "@/lib/influencer-briefing";
import {
  describeSubscription, isValidTrialMonths, TRIAL_MONTHS_MAX, TRIAL_MONTHS_MIN,
} from "@/lib/subscription-plans";
import type { Influencer } from "@/hooks/useInfluencers";
import {
  signedAssetUrl, useAddActivityNote, useBriefing, useBriefingAssets, useBriefingTemplates,
  useDeleteAsset, useGrantTrialToLinkedUser, useInfluencerActivity, useLinkableProfiles,
  useLinkedSubscription, useLinkUser, useSaveBriefing, useUploadAsset,
} from "@/hooks/useInfluencerBriefing";

/* ═══════════════════════════════════════════════════════════════════════
   Konto
   ═══════════════════════════════════════════════════════════════════════ */

export function AccountPanel({ influencer }: { influencer: Influencer }) {
  const link = useLinkUser();
  const grant = useGrantTrialToLinkedUser();
  const [search, setSearch] = useState("");
  const { data: profiles = [] } = useLinkableProfiles(search);
  const { data: subscription } = useLinkedSubscription(influencer.user_id);
  const [alsoRole, setAlsoRole] = useState(true);
  const [months, setMonths] = useState("3");

  const monthsNum = parseInt(months, 10);
  const linked = profiles.find((p) => p.id === influencer.user_id);
  // Gleiche Adresse heisst fast immer dieselbe Person — aber eben nur fast.
  // Deshalb ein Vorschlag zum Bestaetigen, keine automatische Verknuepfung.
  const suggestion = !influencer.user_id
    ? profiles.find((p) => p.email?.toLowerCase() === influencer.email.toLowerCase())
    : undefined;
  const planInfo = describeSubscription(subscription);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        <UserCheck className="h-4 w-4" />
        Verknüpftes Konto
      </h4>

      {influencer.user_id ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25">
              {linked?.email ?? influencer.user_id.slice(0, 8)}
            </Badge>
            <Badge variant="outline">{planInfo.label}</Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => link.mutate({ influencerId: influencer.id, userId: null })}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Lösen
            </Button>
          </div>

          {/*
            Mit Konto braucht es keinen Gutschein: das Abo kann direkt gesetzt
            werden. Der Code bleibt der Weg fuer alle OHNE Konto.
          */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Input
              type="number"
              min={TRIAL_MONTHS_MIN}
              max={TRIAL_MONTHS_MAX}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">Monate</span>
            <Button
              size="sm"
              disabled={!isValidTrialMonths(monthsNum) || grant.isPending || planInfo.isPaid}
              onClick={() =>
                grant.mutate({
                  influencerId: influencer.id,
                  userId: influencer.user_id as string,
                  months: monthsNum,
                })
              }
            >
              Probe-Abo direkt vergeben
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={grant.isPending || planInfo.isPaid}
              onClick={() =>
                grant.mutate({
                  influencerId: influencer.id,
                  userId: influencer.user_id as string,
                  months: 0,
                  unlimited: true,
                })
              }
            >
              Unbegrenzt
            </Button>
          </div>
          {planInfo.isPaid && (
            <p className="text-xs text-destructive">
              Dieses Konto hat ein bezahltes Abo ({subscription?.provider}) — hier nichts überschreiben.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Noch kein Konto verknüpft. Ohne Konto läuft der Zugang über einen Gutscheincode.
          </p>

          {suggestion && (
            <div className="rounded-md border bg-background px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-sm">
                Gleiche E-Mail gefunden: <strong>{suggestion.email}</strong>
              </span>
              <Button
                size="sm"
                onClick={() => link.mutate({ influencerId: influencer.id, userId: suggestion.id, alsoRole })}
              >
                <Check className="h-4 w-4 mr-2" />Verknüpfen
              </Button>
            </div>
          )}

          <Input
            placeholder="Nutzer nach E-Mail oder Namen suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search.trim().length > 1 && (
            <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
              {profiles.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Kein Treffer.</p>
              )}
              {profiles.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                  onClick={() => link.mutate({ influencerId: influencer.id, userId: p.id, alsoRole })}
                >
                  <div className="text-sm font-medium">{p.email ?? p.id.slice(0, 8)}</div>
                  {p.full_name && <div className="text-xs text-muted-foreground">{p.full_name}</div>}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch checked={alsoRole} onCheckedChange={setAlsoRole} id="alsoRole" />
            <Label htmlFor="alsoRole" className="text-sm font-normal">
              Rolle „influencer“ mitvergeben
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Die Rolle gibt kein Premium — der Zugang kommt aus dem Abo. Sie ist nur der spätere Portal-Schlüssel.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Briefing
   ═══════════════════════════════════════════════════════════════════════ */

export function BriefingPanel({ influencer }: { influencer: Influencer }) {
  const { data: stored } = useBriefing(influencer.id);
  const { data: templates = [] } = useBriefingTemplates();
  const save = useSaveBriefing();
  const { data: assets = [] } = useBriefingAssets(influencer.id);
  const upload = useUploadAsset();
  const removeAsset = useDeleteAsset();

  const [b, setB] = useState<BriefingFields>(EMPTY_BRIEFING);
  const [templateId, setTemplateId] = useState<number | null>(null);

  useEffect(() => {
    if (stored) {
      setB(fromTemplate(stored));
      setTemplateId(stored.template_id);
    }
  }, [stored]);

  const set = <K extends keyof BriefingFields>(k: K, v: BriefingFields[K]) =>
    setB((cur) => ({ ...cur, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Vorlage übernehmen */}
      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Aus Vorlage übernehmen</Label>
          <Select
            value={templateId ? String(templateId) : "none"}
            onValueChange={(v) => {
              if (v === "none") return;
              const tpl = templates.find((t) => String(t.id) === v);
              if (!tpl) return;
              // KOPIEREN, nicht verweisen: eine spaetere Aenderung an der
              // Vorlage darf dieses Briefing nicht mehr anfassen.
              setB(fromTemplate(tpl));
              setTemplateId(tpl.id);
              toast.success(`Vorlage „${tpl.name}“ übernommen — jetzt anpassen und speichern`);
            }}
          >
            <SelectTrigger><SelectValue placeholder="Vorlage wählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!hasBriefingContent(stored) && (
          <p className="text-xs text-muted-foreground flex-1">Noch kein Briefing hinterlegt.</p>
        )}
      </div>

      {/* Botschaft */}
      <Section title="Botschaft" icon={Megaphone}>
        <F label="Titel der Kampagne">
          <Input value={b.headline} onChange={(e) => set("headline", e.target.value)} placeholder="Sommerkampagne JGA" />
        </F>
        <F label="Kernbotschaft">
          <Textarea rows={3} value={b.core_message} onChange={(e) => set("core_message", e.target.value)} />
        </F>
        <F label="Tonfall">
          <Input value={b.tone} onChange={(e) => set("tone", e.target.value)} placeholder="locker, ehrlich, kein Werbesprech" />
        </F>
        <div className="grid sm:grid-cols-2 gap-3">
          <F label="Do's (eine Zeile je Punkt)">
            <Textarea rows={4} value={b.dos.join("\n")} onChange={(e) => set("dos", toLines(e.target.value))} />
          </F>
          <F label="Don'ts (eine Zeile je Punkt)">
            <Textarea rows={4} value={b.donts.join("\n")} onChange={(e) => set("donts", toLines(e.target.value))} />
          </F>
        </div>
      </Section>

      {/* Verlinkung */}
      <Section title="Verlinkung" icon={Link2}>
        <div className="grid sm:grid-cols-2 gap-3">
          <F label="Markierungen">
            <Input value={b.mention_handles.join(", ")} onChange={(e) => set("mention_handles", toList(e.target.value))} />
          </F>
          <F label="Hashtags">
            <Input value={b.hashtags.join(", ")} onChange={(e) => set("hashtags", toList(e.target.value))} />
          </F>
          <F label="Link">
            <Input value={b.link_url} onChange={(e) => set("link_url", e.target.value)} />
          </F>
          <F label="Rabattcode für die Community">
            <Input value={b.discount_code} onChange={(e) => set("discount_code", e.target.value)} placeholder="JGA10" />
          </F>
        </div>
        <F label="Hinweis zum Code">
          <Input value={b.discount_note} onChange={(e) => set("discount_note", e.target.value)} placeholder="10 % auf Premium, 3 Monate gültig" />
        </F>
      </Section>

      {/* Pflichten */}
      <Section title="Kennzeichnung und Freigabe" icon={Check}>
        <div className="flex items-center gap-3">
          <Switch checked={b.disclosure_required} onCheckedChange={(v) => set("disclosure_required", v)} id="disc" />
          <Label htmlFor="disc" className="font-normal">Werbekennzeichnung verpflichtend</Label>
        </div>
        {b.disclosure_required && (
          <F label="Kennzeichnung">
            <Input value={b.disclosure_text} onChange={(e) => set("disclosure_text", e.target.value)} />
          </F>
        )}
        <div className="flex items-center gap-3">
          <Switch checked={b.approval_required} onCheckedChange={(v) => set("approval_required", v)} id="appr" />
          <Label htmlFor="appr" className="font-normal">Freigabe durch uns vor Veröffentlichung</Label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <F label="Veröffentlichen ab">
            <Input type="date" value={b.publish_from?.slice(0, 10) ?? ""} onChange={(e) => set("publish_from", e.target.value || null)} />
          </F>
          <F label="Veröffentlichen bis">
            <Input type="date" value={b.publish_until?.slice(0, 10) ?? ""} onChange={(e) => set("publish_until", e.target.value || null)} />
          </F>
        </div>
        <p className="text-xs text-muted-foreground">
          Vergütete Beiträge sind kennzeichnungspflichtig — die Vorgabe steht deshalb von sich aus auf „ja“.
        </p>
      </Section>

      {/* Materialien */}
      <Section title="Materialien" icon={FileUp}>
        <input
          type="file"
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate({ influencerId: influencer.id, file });
            e.target.value = "";
          }}
        />
        <div className="space-y-2">
          {assets.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Dateien.</p>}
          {assets.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <span className="flex-1 text-sm truncate">{a.file_name}</span>
              <span className="text-xs text-muted-foreground">
                {a.size_bytes ? `${Math.round(a.size_bytes / 1024)} KB` : ""}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const url = await signedAssetUrl(a.storage_path);
                  if (url) window.open(url, "_blank");
                  else toast.error("Link konnte nicht erzeugt werden");
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => removeAsset.mutate(a)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Der Ablageort ist privat — Links entstehen erst beim Abruf und laufen nach zehn Minuten ab.
        </p>
      </Section>

      {/* Sonstiges */}
      <Section title="Sonstiges" icon={StickyNote}>
        <F label="Weitere Hinweise (sichtbar für den Influencer)">
          <Textarea rows={3} value={b.extra} onChange={(e) => set("extra", e.target.value)} />
        </F>
        <F label="Interner Vermerk (NICHT sichtbar)">
          <Textarea
            rows={2}
            value={b.internal_notes}
            onChange={(e) => set("internal_notes", e.target.value)}
            placeholder="Nur für uns — erscheint nie im persönlichen Bereich."
          />
        </F>
      </Section>

      <Button
        disabled={save.isPending}
        onClick={() => save.mutate({ influencerId: influencer.id, fields: b, templateId })}
      >
        {save.isPending ? "Speichere…" : "Briefing speichern"}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Verlauf
   ═══════════════════════════════════════════════════════════════════════ */

const ACTION_LABEL: Record<string, string> = {
  note: "Vermerk",
  status_changed: "Status geändert",
  deal_activated: "Deal aktiviert",
  voucher_created: "Code vergeben",
  account_linked: "Konto verknüpft",
  account_unlinked: "Verknüpfung gelöst",
  briefing_saved: "Briefing gespeichert",
  asset_added: "Datei hinzugefügt",
  subscription_granted: "Abo vergeben",
  proof_submitted: "Nachweis eingereicht",
  deliverable_reviewed: "Aufgabe geprüft",
};

export function HistoryPanel({ influencer }: { influencer: Influencer }) {
  const { data: entries = [], isLoading } = useInfluencerActivity(influencer.id);
  const addNote = useAddActivityNote();
  const [kind, setKind] = useState("call");
  const [text, setText] = useState("");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Vermerk hinzufügen
        </h4>
        <div className="flex gap-2">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Anruf</SelectItem>
              <SelectItem value="mail">E-Mail</SelectItem>
              <SelectItem value="note">Notiz</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Was ist passiert?"
            className="flex-1"
          />
          <Button
            disabled={!text.trim() || addNote.isPending}
            onClick={() =>
              addNote.mutate(
                { influencerId: influencer.id, kind, text: text.trim() },
                { onSuccess: () => setText("") },
              )
            }
          >
            Speichern
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Lade…</p>}
      {!isLoading && entries.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Noch nichts passiert. Statuswechsel, Deals und vergebene Codes landen hier automatisch.
        </p>
      )}

      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="flex gap-3 rounded-lg border px-3 py-2">
            <div className="w-28 shrink-0 text-xs text-muted-foreground pt-0.5">
              {format(new Date(e.created_at), "dd.MM.yy HH:mm", { locale: deLocale })}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{ACTION_LABEL[e.action] ?? e.action}</div>
              {e.details && Object.keys(e.details).length > 0 && (
                <div className="text-xs text-muted-foreground break-words">{describeDetails(e.details)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Aus dem JSON eine lesbare Zeile machen, statt rohes JSON anzuzeigen. */
function describeDetails(d: Record<string, unknown>): string {
  if (typeof d.text === "string") return d.text;
  return Object.entries(d)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
    .join(" · ");
}

/* ── Kleinteile ──────────────────────────────────────────────────────── */

function Section({
  title, icon: Icon, children,
}: {
  title: string;
  icon: typeof Check;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title}
      </h4>
      {children}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
