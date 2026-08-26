/**
 * Der persoenliche Bereich eines Influencers — /creators/<token>.
 *
 * KEIN LOGIN, SONDERN EIN TOKEN. Wer eine Kaltansprache bekommt, legt sich
 * kein Konto an, um nachzusehen, worum es geht. Die Seite haengt deshalb am
 * `invite_token` aus dem Verzeichnis, so wie die Agentur-Demoseite auch.
 *
 * DAS IST AUCH DER "ANSEHEN WIE"-BEREICH DES ADMINS. Ein echtes
 * Fremd-Einloggen gibt es bewusst nicht: dafuer muesste der Server eine fremde
 * Sitzung ausstellen, und das ist eine Sicherheitsfunktion mit eigenem
 * Kapitel, kein Nebenprodukt einer Detailansicht.
 *
 * ZUGRIFF: Die Tabellen haben KEINE oeffentliche Leseregel (personenbezogene
 * Daten). Gelesen wird ueber die Edge Function `creator-view`, die mit
 * Dienstschluessel arbeitet und eine ausdrueckliche Feldliste herausgibt —
 * `internal_notes` steht nicht darin.
 *
 * WARUM REITER STATT EINER LANGEN SEITE: die Seite ist von "Vereinbarung und
 * Aufgaben" auf Briefing, alle Vorlagen, das ganze Media-Kit und Bildmaterial
 * gewachsen. Untereinander ergab das eine Seite, auf der niemand mehr etwas
 * findet. Fuenf Reiter, jeder fuer sich lesbar.
 *
 * WARUM DER START-REITER MIT DEM THEMA ANFAENGT und nicht mit der Verguetung:
 * siehe die Begruendung in `creator-copy.ts`. Kurz — die Verguetung ist
 * austauschbar, das Thema traegt.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheck, CalendarClock, CheckCircle2, Copy, Download, FileText, Gift,
  Image as ImageIcon, LayoutTemplate, Link2, Package, Percent, Send, Smartphone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";
import type { PortalBriefing } from "@/lib/influencer-briefing";
import { creatorCopy, type CreatorCopy } from "@/lib/creator-copy";
import { creatorMediaKit, storyTileUrl } from "@/lib/creator-media-kit";
import { CreatorTourView } from "@/components/creator/CreatorTourView";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

interface CreatorTask {
  id: number;
  kind: string;
  title: string;
  due_at: string | null;
  status: string;
  proof_url: string | null;
}

interface CreatorAsset {
  id: number;
  file_name: string;
  url: string | null;
}

interface CreatorView {
  handle: string;
  display_name: string | null;
  language: string | null;
  deal: {
    reward_kinds: string[];
    trial_months: number | null;
    unlimited: boolean;
    commission_rate: number | null;
    ends_at: string | null;
    voucher_code: string | null;
  } | null;
  briefing: PortalBriefing | null;
  /** Alle Vorlagen — auch ohne aktiven Deal sichtbar. */
  templates: (Partial<PortalBriefing> & { id: number; name: string })[];
  assets: CreatorAsset[];
  tasks: CreatorTask[];
}

type TabKey = "start" | "app" | "briefing" | "tasks" | "material" | "templates";

/**
 * Die Bilder zu den drei Blickwinkeln im Start-Reiter.
 *
 * ECHTE BILDSCHIRME, KEINE WERBEZEICHNUNGEN. Die Bilder unter /press/ zeigen
 * gemalte Symbole; wer hier ueberlegt, ob er das Thema bespielt, will die App
 * sehen. Diese Aufnahmen stammen aus dem Store-Lauf, liegen in der Sprache des
 * Bereichs vor und werden von scripts/generate-tour-shots.mjs erzeugt.
 *
 * Sie liegen unter /tour/, weil gebuendelte Assets bei jedem Build eine neue
 * Adresse mit Hash bekommen. Ein Bereich, den jemand in vier Wochen wieder
 * aufruft, braucht Adressen, die dann noch gelten.
 */
const THEME_SHOTS = ["schedule", "expenses", "games"];

export default function CreatorPortal() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<CreatorView | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "unknown">("loading");
  const [tab, setTab] = useState<TabKey>("start");

  const c = creatorCopy(view?.language);

  useSEO({
    title: c.metaTitle,
    description: c.metaDescription,
    // Ein persoenlicher Bereich gehoert nicht in eine Suchmaschine.
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("creator-view", { body: { token } });
      if (cancelled) return;
      if (error || !data?.creator) setState("unknown");
      else { setView(data.creator as CreatorView); setState("ok"); }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (state === "loading") return <Shell><p className="text-white/50">…</p></Shell>;
  if (state === "unknown" || !view) return <Shell><p className="text-white/70">{c.invalid}</p></Shell>;

  const openTasks = view.tasks.filter((t) => t.status === "open");

  const nav: { key: TabKey; label: string; icon: typeof Sparkles; badge?: number }[] = [
    { key: "start", label: c.tabStart, icon: Sparkles },
    // Direkt hinter "Start": wer gerade gelesen hat, WARUM das Thema traegt,
    // will als Naechstes sehen, WAS die App kann — nicht das Briefing.
    { key: "app", label: c.tabApp, icon: Smartphone },
    { key: "briefing", label: c.tabBriefing, icon: FileText },
    { key: "tasks", label: c.tabTasks, icon: CalendarClock, badge: openTasks.length || undefined },
    { key: "material", label: c.tabMaterial, icon: Package },
    { key: "templates", label: c.tabTemplates, icon: LayoutTemplate },
  ];

  return (
    <Shell>
      <div className="mb-8">
        <Badge className="bg-white/10 text-white/80 border-white/15 hover:bg-white/10">
          <Sparkles className="h-3 w-3 mr-1" />
          EventBliss
        </Badge>
        <h1 className="mt-4 text-3xl md:text-4xl font-black">
          {c.greeting(view.display_name || view.handle)}
        </h1>
        <p className="mt-3 text-white/70 leading-relaxed max-w-2xl">{c.greetingSub}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                tab === n.key
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
              {n.badge != null && (
                <span className="ml-0.5 rounded-full bg-black/15 px-1.5 text-xs">{n.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {tab === "start" && <StartTab c={c} view={view} />}
        {/*
          Die Tour spricht SEINE Sprache, auch wenn die Huelle nur Deutsch und
          Englisch kann — er soll das Produkt verstehen, nicht uebersetzen.
        */}
        {tab === "app" && <CreatorTourView lang={view.language} tone="dark" />}
        {tab === "briefing" && <BriefingTab c={c} view={view} />}
        {tab === "tasks" && <TasksTab c={c} view={view} token={token} onChange={setView} />}
        {tab === "material" && <MaterialTab c={c} view={view} />}
        {tab === "templates" && <TemplatesTab c={c} view={view} />}
      </motion.div>

      <p className="mt-12 text-sm text-white/45">
        {c.contact} <a href="mailto:svitlana@event-bliss.com" className="underline">svitlana@event-bliss.com</a>
      </p>
    </Shell>
  );
}

/* ══ Start ══════════════════════════════════════════════════════════ */

/**
 * Die Dramaturgie: erst das Thema, dann die Naehe, dann die Verguetung.
 * Wer hier oben aufhoert zu lesen, soll trotzdem verstanden haben, WARUM das
 * Thema funktioniert — das ist mehr wert als die Konditionen.
 */
function StartTab({ c, view }: { c: CreatorCopy; view: CreatorView }) {
  const deal = view.deal;
  const lang = view.language === "de" ? "de" : "en";
  const locale = view.language === "de" ? "de-DE" : "en-GB";

  return (
    <div className="space-y-14">
      {/* 1 — Das Thema */}
      <section>
        <Kicker>{c.themeKicker}</Kicker>
        <h2 className="mt-2 text-2xl md:text-3xl font-black leading-tight">{c.themeTitle}</h2>
        <div className="mt-4 space-y-3 max-w-2xl">
          {c.themeBody.map((p) => (
            <p key={p.slice(0, 24)} className="text-white/75 leading-relaxed">{p}</p>
          ))}
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {c.themePoints.map((point, i) => (
            <div
              key={point.title}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              {/*
                Oben ausgerichtet: die Kopfzeile eines Bildschirms sagt in
                einem Blick, worum es geht — die Mitte einer Liste nicht.
              */}
              <img
                src={`/tour/${lang}/${THEME_SHOTS[i]}.webp`}
                alt=""
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-top"
              />
              <div className="p-4">
                <h3 className="font-bold">{point.title}</h3>
                <p className="mt-1.5 text-sm text-white/65 leading-relaxed">{point.body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-white/85 font-medium max-w-2xl">{c.themeClose}</p>
      </section>

      {/* 2 — Die Naehe */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-emerald-500/10 p-6 md:p-8">
        <Kicker>{c.closeKicker}</Kicker>
        <h2 className="mt-2 text-2xl md:text-3xl font-black leading-tight">{c.closeTitle}</h2>
        <div className="mt-4 space-y-3 max-w-2xl">
          {c.closeBody.map((p) => (
            <p key={p.slice(0, 24)} className="text-white/75 leading-relaxed">{p}</p>
          ))}
        </div>
      </section>

      {/* 3 — Was du bekommst */}
      <section>
        <Kicker>{c.rewardKicker}</Kicker>
        <h2 className="mt-2 text-2xl md:text-3xl font-black leading-tight flex items-center gap-2">
          <Gift className="h-6 w-6 text-white/40" />
          {c.rewardTitle}
        </h2>
        <p className="mt-3 text-white/70 max-w-2xl">{c.rewardIntro}</p>

        {!deal && <p className="mt-5 text-sm text-white/55">{c.noDeal}</p>}

        {deal && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {deal.unlimited && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{c.unlimited}</Badge>
              )}
              {!deal.unlimited && deal.trial_months && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{c.trial(deal.trial_months)}</Badge>
              )}
              {deal.commission_rate != null && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Percent className="h-3 w-3 mr-1" />
                  {c.commission(deal.commission_rate)}
                </Badge>
              )}
              {deal.reward_kinds.includes("fee") && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">{c.fee}</Badge>
              )}
            </div>

            {/*
              Ohne Code heisst NICHT ohne Zugang: ist ein Konto verknuepft,
              wird das Abo direkt gesetzt. Stuende hier nur der Code-Block,
              saehe der Influencer in genau diesem Fall — dem besseren — gar
              nichts.
            */}
            {!deal.voucher_code && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-400" />
                  {c.accessActive}
                </div>
                <p className="mt-1 text-sm text-white/70">
                  {deal.unlimited
                    ? c.accessUnlimited
                    : deal.ends_at
                      ? c.accessUntil(new Date(deal.ends_at).toLocaleDateString(locale))
                      : c.accessActive}
                </p>
              </div>
            )}

            {deal.voucher_code && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  {c.codeTitle}
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-lg tracking-wide">{deal.voucher_code}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(deal.voucher_code as string);
                      toast.success(c.copied);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-white/50">{c.codeHint}</p>
                <Button asChild className="bg-white text-black hover:bg-white/90">
                  <a href="https://event-bliss.com/auth" target="_blank" rel="noreferrer">
                    <Link2 className="h-4 w-4 mr-2" />
                    {c.redeem}
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/* ══ Briefing ═══════════════════════════════════════════════════════ */

function BriefingTab({ c, view }: { c: CreatorCopy; view: CreatorView }) {
  const brief = view.briefing;

  if (!brief) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-bold">{c.briefingTitle}</h2>
        <p className="mt-2 text-sm text-white/60">{c.briefingEmpty}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black flex items-center gap-2">
          <FileText className="h-6 w-6 text-white/40" />
          {c.briefingTitle}
        </h2>
        {brief.headline && <p className="mt-1 text-white/55">{brief.headline}</p>}
      </div>

      {brief.core_message && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white/60">{c.message}</h3>
          <p className="mt-2 text-white/85 leading-relaxed whitespace-pre-line">{brief.core_message}</p>
          {brief.tone && <p className="mt-3 text-sm text-white/50">{brief.tone}</p>}
        </div>
      )}

      {(brief.dos.length > 0 || brief.donts.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {brief.dos.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
              <h3 className="text-sm font-semibold text-emerald-300">{c.dos}</h3>
              <ul className="mt-3 space-y-2">
                {brief.dos.map((d) => (
                  <li key={d} className="text-sm text-white/80 flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {brief.donts.length > 0 && (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5">
              <h3 className="text-sm font-semibold text-red-300">{c.donts}</h3>
              <ul className="mt-3 space-y-2">
                {brief.donts.map((d) => (
                  <li key={d} className="text-sm text-white/80 flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(brief.mention_handles.length > 0 || brief.hashtags.length > 0 || brief.discount_code) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white/60">{c.linking}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...brief.mention_handles, ...brief.hashtags].map((tag) => (
              <button
                key={tag}
                onClick={() => { navigator.clipboard.writeText(tag); toast.success(c.copied); }}
                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm hover:bg-white/10 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
          {brief.discount_code && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <code className="font-mono text-lg">{brief.discount_code}</code>
              {brief.discount_note && <p className="text-xs text-white/50 mt-1">{brief.discount_note}</p>}
            </div>
          )}
        </div>
      )}

      {/* Kennzeichnung steht hervorgehoben: sie ist Pflicht, nicht Kür. */}
      {brief.disclosure_required && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h3 className="text-sm font-semibold text-amber-300">{c.disclosure}</h3>
          <p className="mt-1.5 text-sm text-white/85">{c.disclosureHint(brief.disclosure_text)}</p>
          {brief.approval_required && <p className="mt-2 text-sm text-white/70">{c.approval}</p>}
        </div>
      )}

      {(brief.publish_from || brief.publish_until) && (
        <p className="text-sm text-white/60">
          {c.window}: {brief.publish_from ? new Date(brief.publish_from).toLocaleDateString() : "—"}
          {" – "}
          {brief.publish_until ? new Date(brief.publish_until).toLocaleDateString() : "—"}
        </p>
      )}

      {brief.extra && <p className="text-sm text-white/70 whitespace-pre-line">{brief.extra}</p>}
    </section>
  );
}

/* ══ Aufgaben ═══════════════════════════════════════════════════════ */

function TasksTab({
  c, view, token, onChange,
}: {
  c: CreatorCopy;
  view: CreatorView;
  token: string | undefined;
  onChange: React.Dispatch<React.SetStateAction<CreatorView | null>>;
}) {
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const locale = view.language === "de" ? "de-DE" : "en-GB";

  return (
    <section>
      <h2 className="text-2xl font-black flex items-center gap-2">
        <CalendarClock className="h-6 w-6 text-white/40" />
        {c.tasksTitle}
      </h2>
      <p className="mt-2 text-white/65 max-w-2xl">{c.tasksIntro}</p>

      {view.tasks.length === 0 && <p className="mt-5 text-sm text-white/55">{c.noTasks}</p>}

      <div className="mt-5 space-y-3">
        {view.tasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{task.title}</div>
                {task.due_at && (
                  <div className="text-xs text-white/45">
                    {c.due} {new Date(task.due_at).toLocaleDateString(locale)}
                  </div>
                )}
              </div>
              {task.status === "approved" && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />{c.approved}
                </Badge>
              )}
              {task.status === "submitted" && <Badge variant="secondary">{c.submitted}</Badge>}
            </div>

            {task.status !== "approved" && (
              <div className="flex gap-2">
                <Input
                  value={drafts[task.id] ?? task.proof_url ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
                  placeholder={c.proofPlaceholder}
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
                />
                <Button
                  size="sm"
                  disabled={!(drafts[task.id] || task.proof_url)}
                  onClick={async () => {
                    const url = drafts[task.id] ?? task.proof_url;
                    const { error } = await supabase.functions.invoke("creator-view", {
                      body: { token, submit: { taskId: task.id, proofUrl: url } },
                    });
                    if (error) {
                      toast.error(error.message);
                      return;
                    }
                    toast.success(c.thanks);
                    onChange((v) =>
                      v
                        ? {
                            ...v,
                            tasks: v.tasks.map((x) =>
                              x.id === task.id ? { ...x, status: "submitted", proof_url: url ?? null } : x,
                            ),
                          }
                        : v,
                    );
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {c.submit}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══ Material ═══════════════════════════════════════════════════════ */

function MaterialTab({ c, view }: { c: CreatorCopy; view: CreatorView }) {
  const lang = view.language === "de" ? "de" : "en";
  const k = creatorMediaKit(view.language);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(k.copy);
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Package className="h-6 w-6 text-white/40" />
          {c.materialTitle}
        </h2>
        <p className="mt-2 text-white/65 leading-relaxed max-w-2xl">{c.materialIntro}</p>
      </div>

      {/*
        STORY-KACHELN ZUERST: das ist das Einzige, was man ohne einen Handgriff
        hochladen kann. Alles andere darunter ist Rohmaterial.
      */}
      <section>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-white/40" />
          {c.storyTilesTitle}
        </h3>
        <p className="mt-1 text-sm text-white/55 max-w-2xl">{c.storyTilesHint}</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {k.storyTiles.map((tile) => (
            <a
              key={tile.key}
              href={storyTileUrl(lang, tile.key)}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-2xl border border-white/10 bg-black/30 hover:border-white/25 transition-colors"
            >
              <img
                src={storyTileUrl(lang, tile.key)}
                alt={tile.label}
                loading="lazy"
                className="aspect-[9/16] w-full object-cover"
              />
              <div className="p-3">
                <div className="text-sm font-semibold truncate">{tile.label}</div>
                <div className="text-xs text-white/45 flex items-center gap-1 mt-0.5">
                  <Download className="h-3 w-3" />
                  1080 × 1920
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Texte zum Kopieren */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold">{k.captionsTitle}</h3>
        <p className="text-sm text-white/55 max-w-2xl">{k.captionsHint}</p>
        {k.captions.map((cap) => (
          <button
            key={cap.text.slice(0, 24)}
            onClick={() => copy(cap.text)}
            className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60">
                {cap.format}
              </span>
              <span className="text-xs text-white/40">{cap.hint}</span>
              <Copy className="h-3.5 w-3.5 ml-auto text-white/30" />
            </div>
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{cap.text}</p>
          </button>
        ))}
      </section>

      {/* Beschreibung */}
      <section className="space-y-2">
        <h3 className="text-lg font-bold">{k.boilerplateTitle}</h3>
        {[k.boilerplateShort, k.boilerplateLong].map((text) => (
          <button
            key={text.slice(0, 24)}
            onClick={() => copy(text)}
            className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80 leading-relaxed hover:bg-white/[0.06] transition-colors"
          >
            {text}
            <span className="ml-2 text-xs text-white/35">⧉</span>
          </button>
        ))}
      </section>

      {/* Zahlen */}
      <section>
        <h3 className="text-lg font-bold">{k.factsTitle}</h3>
        <ul className="mt-3 space-y-2">
          {k.facts.map((f) => (
            <li key={f} className="text-sm text-white/75 flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
              {f}
            </li>
          ))}
        </ul>
      </section>

      {/* Hashtags */}
      <section>
        <h3 className="text-lg font-bold">{k.hashtagsTitle}</h3>
        <div className="mt-3 space-y-2">
          {k.hashtagSets.map((set) => (
            <div key={set.label} className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/40 w-24 shrink-0">{set.label}</span>
              <button
                onClick={() => copy(set.tags.join(" "))}
                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm hover:bg-white/10 transition-colors"
              >
                {set.tags.join(" ")}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Bilder */}
      <section>
        <h3 className="text-lg font-bold">{k.assetsTitle}</h3>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {k.assets.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
            >
              <Download className="h-4 w-4 shrink-0 text-white/45" />
              <span className="min-w-0">
                <span className="block text-sm truncate">{a.label}</span>
                <span className="block text-xs text-white/40 truncate">{a.hint}</span>
              </span>
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/45 max-w-2xl">
          <strong className="text-white/60">{k.screenshotTitle}:</strong> {k.screenshotHint}
        </p>
      </section>

      {/* Persoenliche Dateien aus dem Briefing — nur wenn welche hinterlegt sind. */}
      {view.assets.length > 0 && (
        <section>
          <h3 className="text-lg font-bold">{k.personalTitle}</h3>
          <div className="mt-3 space-y-2">
            {view.assets.map((a) => (
              <a
                key={a.id}
                href={a.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
              >
                <Download className="h-4 w-4 text-white/50" />
                <span className="text-sm truncate">{a.file_name}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Farben */}
      <section>
        <h3 className="text-lg font-bold">{k.brandTitle}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {k.brandColors.map((col) => (
            <button
              key={col.value}
              onClick={() => copy(col.value)}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 hover:bg-white/5 transition-colors"
            >
              <span className="h-4 w-4 rounded" style={{ background: col.value }} />
              <span className="text-xs text-white/70">{col.label}</span>
              <code className="text-xs text-white/40">{col.value}</code>
            </button>
          ))}
        </div>
      </section>

      {/* Links */}
      <section>
        <h3 className="text-lg font-bold">{k.linksTitle}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {k.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm hover:bg-white/10 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </section>

      {/* Was wir uns wünschen */}
      <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
        <h3 className="text-lg font-bold">{k.rulesTitle}</h3>
        <ul className="mt-3 space-y-2">
          {k.rules.map((r) => (
            <li key={r} className="text-sm text-white/75 flex gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-white/30" />
              {r}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ══ Vorlagen ═══════════════════════════════════════════════════════ */

/**
 * ALLE VORLAGEN — auch ohne Deal. Wer angeschrieben wird, soll sehen koennen,
 * was moeglich ist, bevor etwas vereinbart ist. Die internen Vermerke der
 * Vorlagen bleiben draussen (Feldliste in creator-view).
 */
function TemplatesTab({ c, view }: { c: CreatorCopy; view: CreatorView }) {
  if (view.templates.length === 0) {
    return <p className="text-sm text-white/55">{c.templatesHint}</p>;
  }

  return (
    <section>
      <h2 className="text-2xl font-black flex items-center gap-2">
        <LayoutTemplate className="h-6 w-6 text-white/40" />
        {c.templatesTitle}
      </h2>
      <p className="mt-2 text-white/65 max-w-2xl">{c.templatesHint}</p>

      <div className="mt-5 space-y-3">
        {view.templates.map((tpl) => (
          <details key={tpl.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold">
              {tpl.name}
              {tpl.headline && <span className="text-white/50 font-normal"> — {tpl.headline}</span>}
            </summary>
            <div className="mt-3 space-y-3 text-sm">
              {tpl.core_message && <p className="text-white/80 whitespace-pre-line leading-relaxed">{tpl.core_message}</p>}
              {tpl.tone && <p className="text-white/50">{tpl.tone}</p>}
              {(tpl.dos?.length || tpl.donts?.length) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {tpl.dos && tpl.dos.length > 0 && (
                    <ul className="space-y-1">
                      {tpl.dos.map((d) => (
                        <li key={d} className="flex gap-2 text-white/75">
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />{d}
                        </li>
                      ))}
                    </ul>
                  )}
                  {tpl.donts && tpl.donts.length > 0 && (
                    <ul className="space-y-1">
                      {tpl.donts.map((d) => (
                        <li key={d} className="flex gap-2 text-white/60">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />{d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {tpl.hashtags && tpl.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tpl.hashtags.map((h) => (
                    <span key={h} className="rounded border border-white/10 px-2 py-0.5 text-xs text-white/60">{h}</span>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ══ Rahmen ═════════════════════════════════════════════════════════ */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{children}</span>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <img src={eventBlissLogo} alt="EventBliss" className="h-9 w-auto" />
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
            EventBliss
          </span>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12 max-w-4xl">{children}</main>
    </div>
  );
}
