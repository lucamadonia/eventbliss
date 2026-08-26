/**
 * Das Influencer-Portal — /influencer, mit Login.
 *
 * UNTERSCHIED ZUM TOKEN-BEREICH: /creators/<token> ist der Weg VOR der Zusage
 * — ohne Konto, ohne Login, an einen Token gebunden. Dieses Portal ist der Weg
 * DANACH: es haengt an einem echten Konto, zeigt den Fortschritt in der Bibel
 * und wird mit der Zusammenarbeit weiterwachsen.
 *
 * Beide zeigen teils dasselbe (Deal, Briefing, Aufgaben). Damit sie nicht
 * auseinanderlaufen, teilen sie sich Media-Kit und Feldlisten; die Anzeige ist
 * hier bewusst eigenstaendig, weil ein angemeldeter Mensch andere Fragen hat
 * als ein Angeschriebener.
 *
 * WER NOCH KEIN VERZEICHNIS-EINTRAG HAT, sieht eine ehrliche Auskunft statt
 * einer leeren Seite: das Konto gehoert zu keinem Influencer.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, CalendarClock, CheckCircle2, ChevronRight, Gift, Image as ImageIcon,
  LayoutDashboard, Percent, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/useSEO";
import { describeSubscription } from "@/lib/subscription-plans";
import { creatorMediaKit } from "@/lib/creator-media-kit";
import {
  useBible, useBibleProgress, useMarkPageRead, useMyBriefing, useMyDeal,
  useMyInfluencer, useMySubscription, useMyTasks, useSubmitProof,
} from "@/hooks/useMyInfluencer";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

const NAV = [
  { key: "overview", label: "Übersicht", icon: LayoutDashboard },
  { key: "bible", label: "Bibel", icon: BookOpen },
  { key: "tasks", label: "Aufgaben", icon: CalendarClock },
  { key: "briefing", label: "Briefing", icon: Send },
  { key: "material", label: "Material", icon: ImageIcon },
] as const;

type NavKey = (typeof NAV)[number]["key"];

export default function InfluencerPortal() {
  const [tab, setTab] = useState<NavKey>("overview");
  const { data: me, isLoading } = useMyInfluencer();
  const { data: deal } = useMyDeal(me?.id);
  const { data: tasks = [] } = useMyTasks(me?.id);
  const { data: subscription } = useMySubscription();

  useSEO({
    title: "Influencer-Bereich — EventBliss",
    description: "Dein Bereich: Vereinbarung, Aufgaben, Briefing, Material und die Bibel.",
    robots: "noindex,nofollow",
  });

  if (isLoading) {
    return <Shell><p className="text-muted-foreground">Lade…</p></Shell>;
  }

  if (!me) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Kein Influencer-Zugang</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Dieses Konto ist keinem Influencer zugeordnet. Wenn du mit uns zusammenarbeitest und
              hier nichts siehst, haben wir dein Konto noch nicht verknüpft — schreib uns kurz.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="mailto:svitlana@event-bliss.com">svitlana@event-bliss.com</a>
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const openTasks = tasks.filter((t: { status: string }) => t.status === "open");
  const nextDue = openTasks
    .map((t: { due_at: string | null }) => t.due_at)
    .filter(Boolean)
    .sort()[0] as string | undefined;
  const planInfo = describeSubscription(subscription);

  return (
    <Shell>
      <div className="flex flex-wrap gap-2 mb-6">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === n.key ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
              {n.key === "tasks" && openTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1">{openTasks.length}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Dein Zugang" value={planInfo.label} />
            <Stat label="Offene Aufgaben" value={String(openTasks.length)} />
            <Stat
              label="Nächste Frist"
              value={nextDue ? new Date(nextDue).toLocaleDateString("de-DE") : "—"}
            />
            <Stat label="Reichweite" value={me.followers ? me.followers.toLocaleString("de-DE") : "—"} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gift className="h-4 w-4" />Was du bekommst</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!deal && (
                <p className="text-sm text-muted-foreground">
                  Es ist noch nichts vereinbart. Sobald wir uns einig sind, steht es hier.
                </p>
              )}
              {deal && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {deal.unlimited && <Badge>Premium, unbegrenzt</Badge>}
                    {!deal.unlimited && deal.trial_months && <Badge>{deal.trial_months} Monate Premium</Badge>}
                    {deal.commission_rate != null && (
                      <Badge variant="secondary"><Percent className="h-3 w-3 mr-1" />{deal.commission_rate} % Provision</Badge>
                    )}
                    {deal.reward_kinds?.includes("fee") && <Badge variant="secondary">Honorar vereinbart</Badge>}
                  </div>
                  {deal.ends_at && !deal.unlimited && (
                    <p className="text-sm text-muted-foreground">
                      Läuft bis {new Date(deal.ends_at).toLocaleDateString("de-DE")}.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Neu hier?</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Die Bibel erklärt in fünfzehn Kapiteln, wie das Programm funktioniert — von der
                Kennzeichnungspflicht bis zu den ersten drei Sekunden eines Reels.
              </p>
              <Button size="sm" onClick={() => setTab("bible")}>
                Bibel öffnen
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "bible" && <BibleReader />}
      {tab === "tasks" && <TaskList tasks={tasks} />}
      {tab === "briefing" && <BriefingView influencerId={me.id} />}
      {tab === "material" && <MaterialView />}
    </Shell>
  );
}

/* ── Bibel ───────────────────────────────────────────────────────────── */

function BibleReader() {
  const { data: chapters = [], isLoading } = useBible();
  const { data: read = new Set<number>() } = useBibleProgress();
  const markRead = useMarkPageRead();
  const [openId, setOpenId] = useState<number | null>(null);

  if (isLoading) return <p className="text-muted-foreground">Lade…</p>;

  const totalPages = chapters.reduce((n, c) => n + c.pages.length, 0);
  const readCount = chapters.reduce(
    (n, c) => n + c.pages.filter((p) => read.has(p.id)).length,
    0,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gelesen</span>
            <span className="font-medium">{readCount} von {totalPages} Seiten</span>
          </div>
          <div className="mt-2 h-2 rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: totalPages ? `${(readCount / totalPages) * 100}%` : "0%" }}
            />
          </div>
        </CardContent>
      </Card>

      {chapters.map((c) => {
        const open = openId === c.id;
        const chapterRead = c.pages.length > 0 && c.pages.every((p) => read.has(p.id));
        return (
          <Card key={c.id}>
            <button
              className="w-full text-left p-4 flex items-start gap-3"
              onClick={() => setOpenId(open ? null : c.id)}
            >
              <span className="text-sm font-bold text-muted-foreground w-6 shrink-0">{c.sort_order}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold">{c.title}</span>
                {c.summary && <span className="block text-sm text-muted-foreground">{c.summary}</span>}
              </span>
              {chapterRead && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />}
            </button>

            {open && (
              <CardContent className="pt-0 space-y-6">
                {c.pages.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <h4 className="font-semibold">{p.title}</h4>
                    {/* Absaetze aus Leerzeilen — der Text kommt als Klartext aus der Datenbank. */}
                    {p.body.split(/\n\s*\n/).map((para, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                    <Button
                      size="sm"
                      variant={read.has(p.id) ? "ghost" : "outline"}
                      onClick={() => markRead.mutate(p.id)}
                      disabled={read.has(p.id)}
                    >
                      {read.has(p.id) ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />Gelesen</>
                      ) : (
                        "Als gelesen markieren"
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ── Aufgaben ────────────────────────────────────────────────────────── */

interface TaskRow {
  id: number;
  title: string;
  due_at: string | null;
  status: string;
  proof_url: string | null;
}

function TaskList({ tasks }: { tasks: TaskRow[] }) {
  const submit = useSubmitProof();
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Aufgaben.</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <Card key={t.id}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{t.title}</div>
                {t.due_at && (
                  <div className="text-xs text-muted-foreground">
                    fällig {new Date(t.due_at).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
              <Badge variant={t.status === "approved" ? "default" : t.status === "open" ? "outline" : "secondary"}>
                {t.status === "approved" ? "Freigegeben" : t.status === "submitted" ? "Eingereicht" : "Offen"}
              </Badge>
            </div>

            {t.status !== "approved" && (
              <div className="flex gap-2">
                <Input
                  placeholder="Link zum Beitrag"
                  value={drafts[t.id] ?? t.proof_url ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  disabled={!(drafts[t.id] || t.proof_url) || submit.isPending}
                  onClick={() => submit.mutate({ taskId: t.id, proofUrl: drafts[t.id] ?? t.proof_url ?? "" })}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Einreichen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Briefing ────────────────────────────────────────────────────────── */

function BriefingView({ influencerId }: { influencerId: number }) {
  const { data: b } = useMyBriefing(influencerId);

  if (!b) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Noch kein Briefing hinterlegt.</p>;
  }

  return (
    <div className="space-y-4">
      {b.headline && <h2 className="text-xl font-bold">{b.headline}</h2>}
      {b.core_message && (
        <Card><CardContent className="pt-6 whitespace-pre-line text-sm">{b.core_message}</CardContent></Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {b.dos?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base text-emerald-600">Bitte so</CardTitle></CardHeader>
            <CardContent><ul className="space-y-1.5 text-sm">{b.dos.map((d: string) => <li key={d}>• {d}</li>)}</ul></CardContent>
          </Card>
        )}
        {b.donts?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base text-destructive">Bitte nicht</CardTitle></CardHeader>
            <CardContent><ul className="space-y-1.5 text-sm">{b.donts.map((d: string) => <li key={d}>• {d}</li>)}</ul></CardContent>
          </Card>
        )}
      </div>

      {b.disclosure_required && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm">
            Bitte als „{b.disclosure_text}" kennzeichnen — das ist Pflicht.
            {b.approval_required && " Und vor der Veröffentlichung kurz mit uns abstimmen."}
          </CardContent>
        </Card>
      )}

      {(b.mention_handles?.length > 0 || b.hashtags?.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {[...(b.mention_handles || []), ...(b.hashtags || [])].map((tag: string) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Material ────────────────────────────────────────────────────────── */

function MaterialView() {
  const k = creatorMediaKit("de");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{k.intro}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {k.assets.map((a) => (
          <a
            key={a.url}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
          >
            <div className="text-sm font-medium">{a.label}</div>
            <div className="text-xs text-muted-foreground">{a.hint}</div>
          </a>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Vollständiges Media-Kit mit Beispieltexten und Hashtags: im persönlichen Link, den du von uns bekommen hast.
      </p>
    </div>
  );
}

/* ── Rahmen ──────────────────────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-1 truncate">{value}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={eventBlissLogo} alt="EventBliss" className="h-9 w-auto" />
            <span className="font-bold">Influencer</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">{children}</main>
    </div>
  );
}
