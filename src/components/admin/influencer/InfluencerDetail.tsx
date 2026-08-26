/**
 * Alles zu einem Influencer: Stammdaten, Ansprache, Deal, Aufgaben, Zugang.
 *
 * Die erste Fassung zeigte vier Werte und ein Notizfeld — zu wenig, um damit
 * zu arbeiten. Hier ist jedes Feld der Tabelle erreichbar und aenderbar, und
 * die drei Dinge, die man wirklich TUT (Status setzen, Deal aktivieren,
 * Zugang vergeben), stehen als eigene Bloecke da, nicht versteckt in einem
 * Formular.
 *
 * ZUM "ANSEHEN WIE": Ein echtes Fremd-Einloggen gibt es hier bewusst nicht.
 * Dafuer muesste der Server eine fremde Sitzung ausstellen — das ist eine
 * Sicherheitsfunktion mit eigenem Angriffsflaechen-Kapitel, kein Nebenprodukt
 * einer Detailansicht. Stattdessen oeffnet der Knopf die personalisierte Seite
 * dieses Influencers (/creators/<token>) in einem neuen Tab: dieselbe Seite,
 * die er selbst aus der Einladung heraus sieht.
 */
import { useEffect, useState } from "react";
import { Award, Check, Copy, ExternalLink, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { de as deLocale } from "date-fns/locale";
import {
  INFLUENCER_PLATFORMS, INFLUENCER_PLATFORM_LABEL, INFLUENCER_PRIORITIES,
  INFLUENCER_PRIORITY_LABEL, INFLUENCER_REWARDS, INFLUENCER_REWARD_LABEL,
  INFLUENCER_STATUSES, INFLUENCER_STATUS_LABEL, formatReach,
  type InfluencerPlatform, type InfluencerPriority, type InfluencerReward,
  type InfluencerStatus,
} from "@/lib/influencer-status";
import { isValidTrialMonths, TRIAL_MONTHS_MAX, TRIAL_MONTHS_MIN } from "@/lib/subscription-plans";
import {
  useActivateDeal, useDeleteInfluencer, useDeliverables, useInfluencerDeals,
  useInfluencerGroups, useInfluencerPackages, useUpdateInfluencer,
  type Influencer, type InfluencerDeal,
} from "@/hooks/useInfluencers";
import { logInfluencerActivity } from "@/hooks/useInfluencerBriefing";
import { AccountPanel, BriefingPanel, HistoryPanel } from "./InfluencerPanels";

const SITE = "https://event-bliss.com";

export default function InfluencerDetail({
  influencer, onClose,
}: {
  influencer: Influencer;
  onClose: () => void;
}) {
  const update = useUpdateInfluencer();
  const remove = useDeleteInfluencer();
  const { data: deals = [] } = useInfluencerDeals(influencer.id);
  const { data: tasks = [] } = useDeliverables(influencer.id);
  const { data: groups = [] } = useInfluencerGroups();

  const [form, setForm] = useState(influencer);
  useEffect(() => setForm(influencer), [influencer]);

  const dirty = JSON.stringify(form) !== JSON.stringify(influencer);
  const activeDeal = deals.find((d) => d.status === "active") ?? null;
  const personalLink = influencer.invite_token ? `${SITE}/creators/${influencer.invite_token}` : null;

  const set = <K extends keyof Influencer>(key: K, value: Influencer[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {influencer.handle}
            <Badge variant="outline">{INFLUENCER_PLATFORM_LABEL[influencer.platform]}</Badge>
            <Badge variant="secondary">{INFLUENCER_STATUS_LABEL[influencer.outreach_status]}</Badge>
          </DialogTitle>
          <DialogDescription>
            {[influencer.display_name, influencer.email, `${formatReach(influencer.followers)} Follower`]
              .filter(Boolean).join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="data">Stammdaten</TabsTrigger>
            <TabsTrigger value="briefing">Briefing</TabsTrigger>
            <TabsTrigger value="outreach">Ansprache</TabsTrigger>
            <TabsTrigger value="deal">Deal & Zugang</TabsTrigger>
            <TabsTrigger value="tasks">Aufgaben ({tasks.length})</TabsTrigger>
            <TabsTrigger value="history">Verlauf</TabsTrigger>
          </TabsList>

          {/* ── Stammdaten ─────────────────────────────────────────── */}
          <TabsContent value="data" className="space-y-4 pt-4">
            <AccountPanel influencer={influencer} />

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Handle">
                <Input value={form.handle} onChange={(e) => set("handle", e.target.value)} />
              </Field>
              <Field label="Name">
                <Input value={form.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} />
              </Field>
              <Field label="E-Mail">
                <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Plattform">
                <Select value={form.platform} onValueChange={(v) => set("platform", v as InfluencerPlatform)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INFLUENCER_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>{INFLUENCER_PLATFORM_LABEL[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Profil-Link">
                <Input value={form.profile_url ?? ""} onChange={(e) => set("profile_url", e.target.value)} />
              </Field>
              <Field label="Gruppe">
                <Select
                  value={form.group_id ? String(form.group_id) : "none"}
                  onValueChange={(v) => set("group_id", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ohne Gruppe</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Follower">
                <Input type="number" value={form.followers ?? ""} onChange={(e) => set("followers", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Field label="Ø Views">
                <Input type="number" value={form.avg_views ?? ""} onChange={(e) => set("avg_views", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Field label="Interaktion %">
                <Input type="number" step="0.1" value={form.engagement_rate ?? ""} onChange={(e) => set("engagement_rate", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Field label="Priorität">
                <Select value={form.priority} onValueChange={(v) => set("priority", v as InfluencerPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INFLUENCER_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{INFLUENCER_PRIORITY_LABEL[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Land">
                <Input value={form.country_code ?? ""} onChange={(e) => set("country_code", e.target.value.toUpperCase().slice(0, 2))} />
              </Field>
              <Field label="Sprache">
                <Input value={form.language ?? ""} onChange={(e) => set("language", e.target.value.toLowerCase().slice(0, 2))} />
              </Field>
              <Field label="Nische" className="col-span-2">
                <Input
                  value={(form.niche || []).join(", ")}
                  onChange={(e) => set("niche", e.target.value.split(",").map((n) => n.trim()).filter(Boolean))}
                />
              </Field>
            </div>

            <Field label="Schlagworte">
              <Input
                value={(form.tags || []).join(", ")}
                onChange={(e) => set("tags", e.target.value.split(",").map((n) => n.trim()).filter(Boolean))}
              />
            </Field>

            <Field label="Notizen">
              <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
            </Field>

            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => remove.mutate(influencer.id, { onSuccess: onClose })}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Entfernen
              </Button>
              <Button
                disabled={!dirty || update.isPending}
                onClick={() =>
                  update.mutate(
                    { id: influencer.id, patch: form },
                    { onSuccess: () => toast.success("Gespeichert") },
                  )
                }
              >
                {update.isPending ? "Speichere…" : dirty ? "Änderungen speichern" : "Gespeichert"}
              </Button>
            </div>
          </TabsContent>

          {/* ── Ansprache ──────────────────────────────────────────── */}
          <TabsContent value="outreach" className="space-y-4 pt-4">
            <Field label="Status">
              <Select
                value={form.outreach_status}
                onValueChange={(v) => {
                  const next = v as InfluencerStatus;
                  set("outreach_status", next);
                  update.mutate({ id: influencer.id, patch: { outreach_status: next } });
                  void logInfluencerActivity(influencer.id, "status_changed", {
                    von: INFLUENCER_STATUS_LABEL[influencer.outreach_status],
                    nach: INFLUENCER_STATUS_LABEL[next],
                  });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INFLUENCER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{INFLUENCER_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Info label="Zuletzt angeschrieben" value={fmt(influencer.last_outreach_at)} />
              <Info label="Antwort am" value={fmt(influencer.last_response_at)} />
            </div>

            <Field label="Letzte Antwort">
              <Textarea
                rows={3}
                value={form.last_response ?? ""}
                onChange={(e) => set("last_response", e.target.value)}
                placeholder="Was hat er oder sie geschrieben?"
              />
            </Field>

            <Field label="Eindruck">
              <Select
                value={form.response_sentiment ?? "none"}
                onValueChange={(v) => set("response_sentiment", v === "none" ? null : (v as Influencer["response_sentiment"]))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="positive">Positiv</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negativ</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Button
              size="sm"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  id: influencer.id,
                  patch: {
                    last_response: form.last_response,
                    response_sentiment: form.response_sentiment,
                    last_response_at: form.last_response ? new Date().toISOString() : null,
                  },
                }, { onSuccess: () => toast.success("Antwort vermerkt") })
              }
            >
              Antwort vermerken
            </Button>

            {/*
              Der personalisierte Bereich. Kein Fremd-Einloggen: die Seite zeigt
              genau das, was der Influencer selbst sieht, und ist an seinen
              Token gebunden.
            */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Persönlicher Bereich
              </h4>
              {personalLink ? (
                <>
                  <div className="flex items-center gap-2 rounded-md bg-background border px-3 py-2">
                    <code className="font-mono text-xs flex-1 truncate">{personalLink}</code>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(personalLink); toast.success("Link kopiert"); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={personalLink} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ansehen wie {influencer.handle}
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Dieselbe Seite, die er aus der Einladung heraus sieht: Konditionen, Aufgaben, Zugangscode.
                    Kein Fremd-Einloggen — die Seite hängt am Token, nicht an einer Sitzung.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Noch kein Token vergeben.</p>
              )}
            </div>
          </TabsContent>

          {/* ── Briefing ───────────────────────────────────────────── */}
          <TabsContent value="briefing" className="pt-4">
            <BriefingPanel influencer={influencer} />
          </TabsContent>

          {/* ── Verlauf ────────────────────────────────────────────── */}
          <TabsContent value="history" className="pt-4">
            <HistoryPanel influencer={influencer} />
          </TabsContent>

          {/* ── Deal & Zugang ──────────────────────────────────────── */}
          <TabsContent value="deal" className="pt-4">
            <DealPanel influencer={influencer} activeDeal={activeDeal} />
          </TabsContent>

          {/* ── Aufgaben ───────────────────────────────────────────── */}
          <TabsContent value="tasks" className="space-y-2 pt-4">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Noch keine Aufgaben — sie entstehen beim Aktivieren eines Deals mit Paket.
              </p>
            )}
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <Badge variant={t.status === "approved" ? "default" : t.status === "open" ? "outline" : "secondary"}>
                  {t.status}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    fällig {fmt(t.due_at)}
                    {t.reach ? ` · ${formatReach(t.reach)} erreicht` : ""}
                  </div>
                </div>
                {t.proof_url && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={t.proof_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ── Deal ────────────────────────────────────────────────────────────── */

function DealPanel({
  influencer, activeDeal,
}: {
  influencer: Influencer;
  activeDeal: InfluencerDeal | null;
}) {
  const activate = useActivateDeal();
  const { data: groups = [] } = useInfluencerGroups();
  const { data: packages = [] } = useInfluencerPackages();

  const group = groups.find((g) => g.id === influencer.group_id);

  // Die Gruppe liefert die Vorgabe, der Deal ueberschreibt sie feldweise.
  const [rewards, setRewards] = useState<InfluencerReward[]>(["trial"]);
  const [months, setMonths] = useState(String(group?.default_trial_months ?? 3));
  const [commission, setCommission] = useState(group?.default_commission_rate?.toString() ?? "");
  const [fee, setFee] = useState(group?.default_fee_amount?.toString() ?? "");
  const [packageId, setPackageId] = useState(group?.default_package_id ? String(group.default_package_id) : "none");
  const [notes, setNotes] = useState("");
  const [code, setCode] = useState<string | null>(null);

  const monthsNum = parseInt(months, 10);
  const wantsTrial = rewards.includes("trial");
  const unlimited = rewards.includes("unlimited");
  const monthsOk = !wantsTrial || unlimited || isValidTrialMonths(monthsNum);
  const pkg = packages.find((p) => String(p.id) === packageId);

  if (activeDeal) {
    return (
      <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/30 p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-500" />
          Deal läuft
        </h4>
        <div className="flex flex-wrap gap-2">
          {activeDeal.reward_kinds.map((r) => (
            <Badge key={r} variant="secondary">{INFLUENCER_REWARD_LABEL[r]}</Badge>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Info label="Start" value={fmt(activeDeal.starts_at)} />
          <Info label="Ende" value={activeDeal.unlimited ? "unbegrenzt" : fmt(activeDeal.ends_at)} />
          <Info label="Provision" value={activeDeal.commission_rate ? `${activeDeal.commission_rate} %` : "—"} />
        </div>
        {activeDeal.notes && <p className="text-sm text-muted-foreground">{activeDeal.notes}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <Award className="h-4 w-4" />
        Deal aktivieren
      </h4>

      {group && (
        <p className="text-xs text-muted-foreground">
          Vorgaben aus Gruppe „{group.name}“ sind vorbelegt und lassen sich hier überschreiben.
        </p>
      )}

      <div className="space-y-2">
        <Label>Gegenleistung</Label>
        <div className="flex flex-wrap gap-2">
          {INFLUENCER_REWARDS.map((r) => {
            const on = rewards.includes(r);
            return (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={on ? "default" : "outline"}
                onClick={() => setRewards((cur) => (on ? cur.filter((x) => x !== r) : [...cur, r]))}
              >
                {on && <Check className="h-3 w-3 mr-1" />}
                {INFLUENCER_REWARD_LABEL[r]}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Mehrere gleichzeitig sind möglich — Gratis-Premium und Provision schließen sich nicht aus.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {wantsTrial && !unlimited && (
          <Field label="Probe-Monate">
            <Input type="number" min={TRIAL_MONTHS_MIN} max={TRIAL_MONTHS_MAX} value={months} onChange={(e) => setMonths(e.target.value)} />
          </Field>
        )}
        {rewards.includes("commission") && (
          <Field label="Provision %">
            <Input type="number" step="0.5" value={commission} onChange={(e) => setCommission(e.target.value)} />
          </Field>
        )}
        {rewards.includes("fee") && (
          <Field label="Honorar €">
            <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
          </Field>
        )}
      </div>

      <Field label="Leistungspaket">
        <Select value={packageId} onValueChange={setPackageId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ohne Paket</SelectItem>
            {packages.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name} ({p.items?.length ?? 0} Posten)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Vermerk">
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Was genau wurde besprochen?" />
      </Field>

      <Button
        disabled={rewards.length === 0 || !monthsOk || activate.isPending}
        onClick={() =>
          activate.mutate(
            {
              influencer,
              rewardKinds: rewards,
              trialMonths: wantsTrial && !unlimited ? monthsNum : null,
              unlimited,
              commissionRate: commission ? Number(commission) : null,
              feeAmount: fee ? Number(fee) : null,
              packageId: pkg ? pkg.id : null,
              packageItems: pkg?.items ?? [],
              notes,
            },
            { onSuccess: ({ code: c }) => setCode(c) },
          )
        }
      >
        {activate.isPending ? "Aktiviere…" : "Deal aktivieren"}
      </Button>

      {code && (
        <div className="flex items-center gap-2 rounded-md bg-background border px-3 py-2">
          <code className="font-mono text-sm flex-1">{code}</code>
          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(code); toast.success("Code kopiert"); }}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Beim Aktivieren entstehen: der Zugangscode (60 Tage einlösbar), die Aufgaben aus dem Paket und der Status „Zugesagt“.
      </p>
    </div>
  );
}

/* ── Kleinteile ──────────────────────────────────────────────────────── */

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(new Date(iso), "dd.MM.yyyy", { locale: deLocale });
}
