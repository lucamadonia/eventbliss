/**
 * Die Produkt-Tour — acht Module und alle 22 Spiele, mit echten Bildschirmen.
 *
 * WIRD AN ZWEI STELLEN GEZEIGT: im Token-Bereich /creators/<token> und im
 * angemeldeten Portal /influencer. Deshalb ein Bauteil und nicht zwei Kopien —
 * die beiden Seiten waren schon einmal auseinandergelaufen.
 *
 * DIE ZWEI TONLAGEN. Der Token-Bereich hat eine fest dunkle Huelle, das
 * Portal folgt dem Farbschema des Nutzers. Statt zwei Fassungen des ganzen
 * Bauteils schaltet `tone` eine Handvoll Klassen um.
 *
 * DIE SPIELE KOMMEN AUS DER APP, nicht aus einer Liste hier: `playableGames`
 * liefert die 22 Eintraege, die Namen und Beschreibungen stehen in i18n unter
 * native.gameNames.* / native.gameDescs.*. Damit stimmt die Uebersicht auch
 * noch, wenn ein Spiel dazukommt oder umbenannt wird.
 *
 * ACHTUNG, SPRACHFASSUNG NACHLADEN. Die Sprachdateien werden erst bei Bedarf
 * geholt. `getFixedT` liefert fuer eine noch nicht geladene Sprache still den
 * englischen Text — ein tuerkischer Influencer saehe englische Spielnamen
 * unter tuerkischer Ueberschrift, und niemand merkte es. Deshalb `loadLocale`.
 */
import { useEffect, useState } from "react";
import { CheckCircle2, Clapperboard, Users } from "lucide-react";
import i18n, { loadLocale } from "@/i18n";
import { cn } from "@/lib/utils";
import { playableGames } from "@/lib/playable-games";
import { creatorTour, tourShotLang } from "@/lib/creator-tour";

type Tone = "dark" | "app";

const TONES = {
  dark: {
    card: "border-white/10 bg-white/[0.03]",
    body: "text-white/75",
    muted: "text-white/50",
    frame: "border-white/10 bg-black/40",
    idea: "border-emerald-500/25 bg-emerald-500/5",
    ideaLabel: "text-emerald-300",
    step: "bg-white/10 text-white/60",
    tagFree: "bg-emerald-500/15 text-emerald-300",
    tagPremium: "bg-amber-500/15 text-amber-300",
  },
  app: {
    card: "border bg-card",
    body: "text-foreground/80",
    muted: "text-muted-foreground",
    frame: "border bg-muted/40",
    idea: "border-emerald-500/30 bg-emerald-500/5",
    ideaLabel: "text-emerald-600 dark:text-emerald-400",
    step: "bg-muted text-muted-foreground",
    tagFree: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    tagPremium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
} as const;

/**
 * Uebersetzer fuer eine bestimmte Sprache — erst nachdem deren Sprachdatei da
 * ist. Bis dahin bleibt die Spieleliste leer, statt kurz englisch aufzublitzen.
 */
function useFixedT(lang: string) {
  const [ready, setReady] = useState(
    () => lang === "en" || i18n.hasResourceBundle(lang, "translation"),
  );

  useEffect(() => {
    let cancelled = false;
    void loadLocale(lang).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return ready ? i18n.getFixedT(lang) : null;
}

export function CreatorTourView({
  lang,
  tone = "dark",
}: {
  lang: string | null | undefined;
  tone?: Tone;
}) {
  const tour = creatorTour(lang);
  const shotLang = tourShotLang(lang);
  const t = useFixedT(shotLang);
  const c = TONES[tone];
  // Arabisch ist die einzige Sprache von rechts nach links; ohne das steht der
  // Text zwar arabisch da, aber linksbuendig — und liest sich falsch herum.
  const rtl = shotLang === "ar";

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="space-y-10">
      <div>
        <h2 className="text-2xl font-black">{tour.title}</h2>
        <p className={cn("mt-2 leading-relaxed max-w-2xl", c.body)}>{tour.intro}</p>
      </div>

      {/* ── Die acht Module ──────────────────────────────────────── */}
      <div className="space-y-6">
        {tour.chapters.map((ch, i) => (
          <section key={ch.shot} className={cn("rounded-2xl border p-5 md:p-6", c.card)}>
            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
              {/*
                Oben ausgerichtet und angeschnitten: die Kopfzeile eines
                Bildschirms sagt in einem Blick, worum es geht — die Mitte
                einer Liste nicht.
              */}
              <div className={cn("overflow-hidden rounded-xl border", c.frame)}>
                <img
                  src={`/tour/${shotLang}/${ch.shot}.webp`}
                  alt={ch.title}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover object-top"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      c.step,
                    )}
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-bold">{ch.title}</h3>
                </div>

                <p className={cn("mt-2.5 leading-relaxed", c.body)}>{ch.body}</p>

                <div className={cn("mt-4 rounded-xl border p-4", c.idea)}>
                  <div
                    className={cn(
                      "text-xs font-bold uppercase tracking-wide flex items-center gap-1.5",
                      c.ideaLabel,
                    )}
                  >
                    <Clapperboard className="h-3.5 w-3.5" />
                    {tour.ideaLabel}
                  </div>
                  <p className={cn("mt-1.5 text-sm leading-relaxed", c.body)}>{ch.idea}</p>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── Alle 22 Spiele ───────────────────────────────────────── */}
      <section>
        <h3 className="text-xl font-black">{tour.gamesTitle}</h3>
        <p className={cn("mt-1.5 max-w-2xl", c.body)}>{tour.gamesIntro}</p>

        {t && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {playableGames.map((game) => (
              <div key={game.id} className={cn("overflow-hidden rounded-xl border", c.card)}>
                <img src={game.image} alt="" loading="lazy" className="h-28 w-full object-cover" />
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold leading-tight">{t(game.nameKey)}</h4>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                        game.tier === "free" ? c.tagFree : c.tagPremium,
                      )}
                    >
                      {game.tier === "free" ? tour.gamesFree : tour.gamesPremium}
                    </span>
                  </div>
                  <p className={cn("mt-1 text-sm leading-snug", c.muted)}>{t(game.descKey)}</p>
                  <div className={cn("mt-2 flex items-center gap-1.5 text-xs", c.muted)}>
                    <Users className="h-3.5 w-3.5" />
                    {tour.gamesPlayers(game.minPlayers, game.maxPlayers)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className={cn("mt-4 text-sm flex items-start gap-2", c.muted)}>
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          {tour.gamesNote}
        </p>
      </section>
    </div>
  );
}

export default CreatorTourView;
