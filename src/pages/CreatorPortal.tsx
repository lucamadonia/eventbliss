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
 * Kapitel, kein Nebenprodukt einer Detailansicht. Der Admin oeffnet dieselbe
 * Seite, die der Influencer sieht — mehr braucht es fuer "wie sieht er das?"
 * nicht.
 *
 * ZUGRIFF: Die Tabelle hat KEINE oeffentliche Leseregel (personenbezogene
 * Daten). Gelesen wird deshalb ueber die Edge Function `creator-view`, die mit
 * Dienstschluessel arbeitet und nur die Felder herausgibt, die auf dieser
 * Seite stehen — nicht die Notizen des Vertriebs, nicht die Bewertung des
 * Erstkontakts.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheck, CalendarClock, CheckCircle2, Copy, Gift, Link2, Percent, Send, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

interface CreatorTask {
  id: number;
  kind: string;
  title: string;
  due_at: string | null;
  status: string;
  proof_url: string | null;
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
  tasks: CreatorTask[];
}

const T = {
  de: {
    title: "Dein Bereich — EventBliss",
    hello: (name: string) => `Hallo ${name}`,
    lead: "Hier steht, was vereinbart ist, was ansteht und wie du deinen Zugang einlöst.",
    dealTitle: "Was du bekommst",
    noDeal: "Es ist noch nichts vereinbart. Sobald wir uns einig sind, steht es hier.",
    trial: (m: number) => `${m} Monate Premium`,
    unlimited: "Premium, unbegrenzt",
    commission: (r: number) => `${r} % Provision je Neukunde`,
    fee: "Honorar vereinbart",
    codeTitle: "Dein Zugangscode",
    codeHint: "Anmelden, Code eingeben, fertig. Die Laufzeit beginnt mit dem Einlösen.",
    redeem: "Jetzt einlösen",
    tasksTitle: "Was ansteht",
    noTasks: "Noch keine Aufgaben.",
    due: "fällig",
    submit: "Link einreichen",
    submitted: "Eingereicht",
    approved: "Freigegeben",
    proofPlaceholder: "Link zum Beitrag",
    thanks: "Danke — wir schauen es uns an.",
    contact: "Fragen? Schreib an",
    invalid: "Dieser Link ist nicht (mehr) gültig.",
  },
  en: {
    title: "Your area — EventBliss",
    hello: (name: string) => `Hi ${name}`,
    lead: "What we agreed, what is coming up, and how to redeem your access.",
    dealTitle: "What you get",
    noDeal: "Nothing agreed yet. Once we are, it will show up here.",
    trial: (m: number) => `${m} months of Premium`,
    unlimited: "Premium, unlimited",
    commission: (r: number) => `${r}% commission per new customer`,
    fee: "Fee agreed",
    codeTitle: "Your access code",
    codeHint: "Sign up, enter the code, done. The period starts when you redeem it.",
    redeem: "Redeem now",
    tasksTitle: "What is coming up",
    noTasks: "No tasks yet.",
    due: "due",
    submit: "Submit link",
    submitted: "Submitted",
    approved: "Approved",
    proofPlaceholder: "Link to the post",
    thanks: "Thank you — we will take a look.",
    contact: "Questions? Write to",
    invalid: "This link is no longer valid.",
  },
};

export default function CreatorPortal() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<CreatorView | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "unknown">("loading");
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const t = T[view?.language === "de" ? "de" : "en"];

  useSEO({
    title: t.title,
    description: t.lead,
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

  if (state === "loading") {
    return <Shell><p className="text-white/50">…</p></Shell>;
  }

  if (state === "unknown" || !view) {
    return <Shell><p className="text-white/70">{t.invalid}</p></Shell>;
  }

  const deal = view.deal;

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-10"
      >
        <div>
          <Badge className="bg-white/10 text-white/80 border-white/15 hover:bg-white/10">
            <Sparkles className="h-3 w-3 mr-1" />
            EventBliss
          </Badge>
          <h1 className="mt-4 text-3xl md:text-4xl font-black">
            {t.hello(view.display_name || view.handle)}
          </h1>
          <p className="mt-3 text-white/70 leading-relaxed max-w-2xl">{t.lead}</p>
        </div>

        {/* Was vereinbart ist */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t.dealTitle}
          </h2>

          {!deal && <p className="mt-3 text-sm text-white/60">{t.noDeal}</p>}

          {deal && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {deal.unlimited && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{t.unlimited}</Badge>
                )}
                {!deal.unlimited && deal.trial_months && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{t.trial(deal.trial_months)}</Badge>
                )}
                {deal.commission_rate != null && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Percent className="h-3 w-3 mr-1" />
                    {t.commission(deal.commission_rate)}
                  </Badge>
                )}
                {deal.reward_kinds.includes("fee") && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">{t.fee}</Badge>
                )}
              </div>

              {deal.voucher_code && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4" />
                    {t.codeTitle}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-lg tracking-wide">{deal.voucher_code}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(deal.voucher_code as string);
                        toast.success("OK");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-white/50">{t.codeHint}</p>
                  <Button asChild className="bg-white text-black hover:bg-white/90">
                    <a href="https://event-bliss.com/auth" target="_blank" rel="noreferrer">
                      <Link2 className="h-4 w-4 mr-2" />
                      {t.redeem}
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Aufgaben */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            {t.tasksTitle}
          </h2>

          {view.tasks.length === 0 && <p className="mt-3 text-sm text-white/60">{t.noTasks}</p>}

          <div className="mt-4 space-y-3">
            {view.tasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{task.title}</div>
                    {task.due_at && (
                      <div className="text-xs text-white/45">
                        {t.due} {new Date(task.due_at).toLocaleDateString(view.language === "de" ? "de-DE" : "en-GB")}
                      </div>
                    )}
                  </div>
                  {task.status === "approved" && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />{t.approved}
                    </Badge>
                  )}
                  {task.status === "submitted" && <Badge variant="secondary">{t.submitted}</Badge>}
                </div>

                {task.status !== "approved" && (
                  <div className="flex gap-2">
                    <Input
                      value={drafts[task.id] ?? task.proof_url ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
                      placeholder={t.proofPlaceholder}
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
                        toast.success(t.thanks);
                        setView((v) =>
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
                      {t.submit}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <p className="text-sm text-white/45">
          {t.contact} <a href="mailto:svitlana@event-bliss.com" className="underline">svitlana@event-bliss.com</a>
        </p>
      </motion.div>
    </Shell>
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
      <main className="container mx-auto px-4 py-12 max-w-3xl">{children}</main>
    </div>
  );
}
