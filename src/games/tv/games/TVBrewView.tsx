/**
 * GEBRAEU auf dem Fernseher.
 *
 * ANDERS ALS JEDE ANDERE TV-ANSICHT: Hier ist der Fernseher nicht nur Anzeige,
 * sondern Spielmaterial. Wer die offene Theke sieht, entscheidet anders —
 * ziehen oder von dort nehmen? Deshalb bekommt die Theke den meisten Platz
 * und die groessten Karten, noch vor Namen oder Punkten.
 *
 * VIER PFLICHTEN, IN DIESER REIHENFOLGE WICHTIG:
 *  1. Die Theke, offen und gross, mit kurzem Aufblitzen fuer neue Karten.
 *  2. Alle Glaeser nebeneinander (das gemeinsame `Glass` aus brew/Glass.tsx —
 *     KEIN zweites Glas hier, zwei Wahrheiten laufen auseinander).
 *  3. Alle Rezepte sichtbar, damit niemand raet, wem er mit Ablegen hilft.
 *  4. Der Bust-Moment: Tablett kippt, Karten fallen — das Glas daneben bleibt
 *     unberuehrt sichtbar. Deshalb lebt die Bust-Animation NUR in der
 *     Tablett-Zone, nie als Vollbild-Overlay, das die Glaeser verdecken wuerde.
 *
 * WAS AM UMBAU ANDERS IST:
 *  - Das Glas war fest 56x72 px. Auf einem 4K-Fernseher war das Hero-Objekt
 *    des Spiels eine Briefmarke. Jetzt skaliert es mit dem Bild.
 *  - Rezeptanzeige und Bust benutzten ROHE EMOJI, obwohl das Spiel 32
 *    Artworks mitbringt. Jetzt ueberall dieselbe `IngredientCard`.
 *  - Der aktive Spieler wurde ueber den NAMEN erkannt. Zwei gleichnamige
 *    Gaeste bekamen beide den Ring.
 *
 * Defensiv destrukturiert und gegen unbekannte Zutaten-Kennungen gewappnet:
 * Ein Fernseher kann sich jederzeit verbinden und bekommt dann einen
 * unvollstaendigen Zustand. Ein Absturz hier macht den ganzen Bildschirm
 * schwarz — das ist in diesem Projekt schon passiert.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FlaskConical, Martini } from 'lucide-react';
import { Glass } from '@/games/brew/Glass';
import { IngredientCard } from '@/games/brew/IngredientCard';
import { BrewAtmosphere } from '@/games/brew/BrewAtmosphere';
import { BREW_PALETTES, brewRadius } from '@/games/brew/brew-palette';
import { shapeForRecipe } from '@/games/brew/glass-shapes';
import {
  INGREDIENTS,
  preloadIngredients,
  recipeKey,
  type IngredientId,
  type Skin,
} from '@/games/brew/brew-content';
import { tvPanel, tvType } from '../tv-tokens';

interface Props {
  gameState: Record<string, unknown>;
}

interface BrewPlayerState {
  id: string;
  name: string;
  color: string | null;
  score: number;
  glass: string[];
  recipe: string[];
  recipeId: string;
  have: number;
  done: boolean;
  brewBonus: number;
}

function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Typ-Wache: nur Kennungen, die `INGREDIENTS` wirklich kennt, duerfen weiter —
 * sonst wirft ein Zugriff auf `undefined` und reisst die ganze Ansicht mit. */
function isKnownIngredient(id: string): id is IngredientId {
  return Object.prototype.hasOwnProperty.call(INGREDIENTS, id);
}

/**
 * `Glass` sortiert selbst nicht — Index 0 in `filled` zeichnet es ganz unten
 * und geht davon aus, dass dort die Basis-Zutat steht. Kommt der tv-state
 * anders sortiert an, wuerde die Basis mitten im Glas schweben.
 */
function withBaseFirst(ids: IngredientId[]): IngredientId[] {
  const baseIdx = ids.findIndex((id) => INGREDIENTS[id].isBase);
  if (baseIdx <= 0) return ids;
  return [ids[baseIdx], ...ids.slice(0, baseIdx), ...ids.slice(baseIdx + 1)];
}

export default function TVBrewView({ gameState }: Props) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const s = (gameState ?? {}) as Record<string, unknown>;

  const skin: Skin = s.skin === 'bar' ? 'bar' : 'brew';
  const p = BREW_PALETTES[skin];

  // Die Feldnamen kommen aus `tvPayload` in BrewGame.tsx — wer hier umbenennt,
  // muss dort nachziehen, sonst bleibt der Fernseher stumm und leer.
  const activePlayerName = s.activeName ? String(s.activeName) : null;
  const activeId = s.activeId ? String(s.activeId) : null;
  const activeIdx = Number.isFinite(Number(s.activeIdx)) ? Number(s.activeIdx) : -1;
  const counter = useMemo(() => toStringArray(s.counter), [s.counter]);
  const tray = useMemo(() => toStringArray(s.tray), [s.tray]);
  const deckCount = Number(s.deckCount ?? 0);
  const bustSeq = Number(s.bustSeq ?? 0);
  const pourSeq = Number(s.pourSeq ?? 0);
  const pourPlan = (s.pourPlan ?? null) as { pid?: string; used?: string[]; leftover?: string[] } | null;
  const riskTier = typeof s.riskTier === 'string' ? s.riskTier : 'calm';
  const chainLevel = Math.max(0, Math.min(3, Number(s.chainLevel ?? 0)));
  const bonusPreview = Math.max(0, Number(s.bonusPreview ?? 0));
  const drawnCard = (s.drawnCard ?? null) as { id?: string | null; seq?: number; outcome?: string } | null;

  const players = useMemo<BrewPlayerState[]>(() => {
    const raw = Array.isArray(s.players) ? s.players : [];
    return raw.map((q0) => {
      const q = (q0 ?? {}) as Record<string, unknown>;
      const glass = toStringArray(q.glass);
      const recipe = toStringArray(q.recipeNeeds);
      const have = recipe.filter((id) => glass.includes(id)).length;
      return {
        // Die Kennung ist die Wahrheit, nicht die Position.
        id: String(q.id ?? ''),
        name: String(q.name ?? ''),
        // Kommt seit jeher im Payload an und wurde bisher ignoriert.
        color: typeof q.color === 'string' ? q.color : null,
        score: Number(q.score ?? 0),
        glass,
        recipe,
        recipeId: String(q.recipeId ?? ''),
        have,
        // Abgeleitet statt gesendet: ein eigenes Feld koennte gegenueber
        // glass/recipe auseinanderlaufen.
        done: recipe.length > 0 && have === recipe.length,
        brewBonus: Math.max(0, Number(q.brewBonus ?? 0)),
      };
    });
  }, [s.players]);

  // Theke: neu hinzugekommene Karten kurz aufblitzen lassen.
  const prevCounterLen = useRef(0);
  const [freshCount, setFreshCount] = useState(0);
  useEffect(() => {
    const grew = counter.length - prevCounterLen.current;
    prevCounterLen.current = counter.length;
    if (grew > 0 && !reduce) {
      setFreshCount(grew);
      const id = setTimeout(() => setFreshCount(0), 900);
      return () => clearTimeout(id);
    }
    setFreshCount(0);
    return undefined;
  }, [counter.length, reduce]);

  // Bust-Moment ueber einen ZAEHLER, nicht ueber einen Boolean: ein `true`
  // bliebe im naechsten Payload stehen und der NAECHSTE Bust wuerde
  // verschluckt. `null` heisst "noch nie gesehen" — sonst spielt ein frisch
  // verbundener Fernseher einen Bust aus der Vergangenheit nach.
  const prevBust = useRef<number | null>(null);
  const [showBust, setShowBust] = useState(false);
  useEffect(() => {
    if (prevBust.current === null) { prevBust.current = bustSeq; return undefined; }
    if (bustSeq > prevBust.current) {
      prevBust.current = bustSeq;
      setShowBust(true);
      const id = setTimeout(() => setShowBust(false), reduce ? 250 : 1400);
      return () => clearTimeout(id);
    }
    prevBust.current = bustSeq;
    return undefined;
  }, [bustSeq, reduce]);

  useEffect(() => { preloadIngredients(skin); }, [skin]);

  /**
   * Der Guss auf dem Fernseher: KEIN Bogenflug. Auf drei Metern ist eine
   * kleine Karte auf Bogenbahn quer ueber 55 Zoll nicht lesbar. Lesbar sind
   * Farbe, Groesse und Gruppierung — also SPALTET sich die Tablettzeile.
   */
  const prevPour = useRef<number | null>(null);
  const [showPour, setShowPour] = useState(false);
  useEffect(() => {
    if (prevPour.current === null) { prevPour.current = pourSeq; return undefined; }
    if (pourSeq > prevPour.current) {
      prevPour.current = pourSeq;
      setShowPour(true);
      const id = setTimeout(() => setShowPour(false), reduce ? 300 : 900);
      return () => clearTimeout(id);
    }
    prevPour.current = pourSeq;
    return undefined;
  }, [pourSeq, reduce]);

  const prevDraw = useRef<number | null>(null);
  const [showDraw, setShowDraw] = useState<typeof drawnCard>(null);
  useEffect(() => {
    const seq = Number(drawnCard?.seq ?? 0);
    if (prevDraw.current === null) { prevDraw.current = seq; return undefined; }
    if (!drawnCard || seq <= prevDraw.current) return undefined;
    prevDraw.current = seq;
    setShowDraw(drawnCard);
    const id = setTimeout(() => setShowDraw(null), reduce ? 360 : 1050);
    return () => clearTimeout(id);
  }, [drawnCard, reduce]);

  const cols = Math.max(1, players.length);
  const Wortmarke = skin === 'bar' ? Martini : FlaskConical;
  /**
   * Ab sieben Glaesern werden die nicht-aktiven ohne Versatz gezeichnet. Acht
   * gleichzeitig morphende Pfadsaetze sind der teuerste Posten auf dem
   * Hauptthread, und in schmalen Spalten sieht man den Versatz ohnehin kaum.
   */
  const vieleSpieler = players.length > 6;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ color: p.text }}>
      <BrewAtmosphere skin={skin} variant="tv" />

      {/* ZONE A — Kopfleiste. Vorher loser Fliesstext ohne Flaeche. */}
      <div className="relative z-10 mx-[3vw] mt-[1.6vh] shrink-0">
        <div
          className={`${tvPanel} flex items-center justify-between gap-[2vw] px-[1.6vw] py-[1.1vh]`}
          style={{ background: p.surface }}
        >
          <div className="flex items-center gap-[1vw] min-w-0">
            <span
              className="font-mono tabular-nums shrink-0"
              style={{
                fontSize: tvType.micro, color: p.dim, background: p.surfaceRaised,
                borderRadius: 9999, padding: '0.3vh 0.9vw',
              }}
            >
              {deckCount > 0 ? t('games.brew.deckCount', { count: deckCount }) : t('games.brew.deckEmpty')}
            </span>
            <span className="font-black uppercase tracking-[0.18em]" style={{
              fontSize: tvType.micro,
              color: riskTier === 'critical' ? p.bad : p.accent,
            }}>
              {t(`games.brew.risk.${riskTier}`)}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activePlayerName && (
              <motion.div
                key={activePlayerName}
                className="flex items-center gap-[0.8vw] min-w-0"
                initial={reduce ? false : { y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="shrink-0" style={{
                  width: '0.9vw', height: '0.9vw', borderRadius: 9999,
                  background: p.accent, boxShadow: `0 0 14px -2px ${p.accent}`,
                }} />
                <span className="font-black truncate" style={{ fontSize: tvType.title, color: p.accent }}>
                  {t('games.brew.turnOf', { name: activePlayerName })}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wortmarke — das eine Neon im Bild. */}
          <div className="flex items-center gap-[0.6vw] shrink-0" style={{ color: p.wordmark }}>
            <Wortmarke style={{ width: '1.6vw', height: '1.6vw' }} />
            <span
              className="font-black uppercase"
              style={{
                fontSize: tvType.label, letterSpacing: '0.35em',
                textShadow: `0 0 24px ${p.wordmark}66, 0 0 60px ${p.wordmark}33`,
              }}
            >
              {t(skin === 'bar' ? 'games.brew.titleBar' : 'games.brew.titleBrew')}
            </span>
          </div>
        </div>
      </div>

      {/* ZONE B — Theke, offen und gross. */}
      <div className="relative z-10 px-[3vw] pt-[1.2vh] shrink-0">
        <p className="uppercase tracking-[0.28em] font-bold" style={{ fontSize: tvType.micro, color: p.dim }}>
          {t('games.brew.counterLabel')}
        </p>
        <div
          className={`${tvPanel} mt-[0.6vh] flex flex-wrap content-start p-[1.4vh]`}
          style={{ minHeight: '15vh', gap: 'clamp(0.5rem,0.9vw,1rem)', background: p.surfaceRaised, borderRadius: brewRadius.xl }}
        >
          {counter.length === 0 && (
            <span className="self-center" style={{ fontSize: tvType.body, color: p.dim }}>
              {t('games.brew.counterEmpty')}
            </span>
          )}
          {counter.map((id, i) => {
            const isFresh = freshCount > 0 && i >= counter.length - freshCount;
            if (!isKnownIngredient(id)) return null;
            return (
              <motion.div
                key={`${id}-${i}`}
                layout
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <IngredientCard id={id} skin={skin} variant="tv" showName
                  state={isFresh ? 'fresh' : 'idle'} palette={p} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ZONE C — Tablett. Die Bust-Animation lebt AUSSCHLIESSLICH hier. */}
      <div className="relative z-10 px-[3vw] pt-[1vh] shrink-0">
        <p className="uppercase tracking-[0.28em] font-bold" style={{ fontSize: tvType.micro, color: p.dim }}>
          {t('games.brew.trayLabel')}
        </p>
        <div
          className={`${tvPanel} mt-[0.6vh] flex items-center px-[1.2vw]`}
          style={{
            minHeight: '11vh', background: p.surface, borderRadius: brewRadius.xl,
            boxShadow: `inset 0 0 0 1px ${p.bad}38`,
          }}
        >
          <AnimatePresence mode="wait">
            {showPour && pourPlan ? (
              // Die Spaltung IST die Erklaerung: links geht ins Glas, rechts
              // auf die Theke. Grosse Formen, klare Richtung, keine Bogenbahn.
              <motion.div key="pour" className="flex items-center gap-[3vw] w-full justify-center">
                <motion.div
                  className="flex items-center gap-[0.7vw]"
                  initial={reduce ? false : { x: 0, scale: 1 }}
                  animate={reduce ? {} : { x: '-2vw', scale: 1.18 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {(pourPlan.used ?? []).slice(0, 7).filter(isKnownIngredient).map((id, i) => (
                    <IngredientCard key={`u${i}-${id}`} id={id} skin={skin} variant="tv"
                      state="wanted" palette={p} width="clamp(2.4rem,3.6vw,3.4rem)" />
                  ))}
                </motion.div>
                <motion.div
                  className="flex items-center gap-[0.7vw]"
                  initial={reduce ? false : { x: 0, opacity: 1 }}
                  animate={reduce ? { opacity: 0.45 } : { x: '2vw', opacity: 0.45 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {(pourPlan.leftover ?? []).slice(0, 7).filter(isKnownIngredient).map((id, i) => (
                    <IngredientCard key={`l${i}-${id}`} id={id} skin={skin} variant="tv"
                      state="muted" palette={p} width="clamp(2rem,3vw,2.8rem)" />
                  ))}
                </motion.div>
              </motion.div>
            ) : showBust ? (
              <motion.div
                key="bust"
                className="flex items-center gap-[1.6vw] w-full"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Gezeichnetes Tablett statt eines Emoji — das Geschirr-Emoji
                    war die optisch schwaechste Stelle des ganzen Bildes. */}
                <motion.div
                  style={{
                    width: '6vw', height: '0.9vh', borderRadius: 9999,
                    background: p.accent3, boxShadow: `0 0 20px -4px ${p.accent3}`,
                    transformOrigin: 'right center',
                  }}
                  initial={reduce ? false : { rotate: 0 }}
                  animate={{ rotate: -38 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="relative shrink-0" style={{ width: '16vw', height: '7vh' }}>
                  {tray.slice(0, 6).filter(isKnownIngredient).map((id, i) => (
                    <motion.div
                      key={`${id}-${i}`}
                      className="absolute"
                      style={{ left: `${i * 15}%`, top: 0 }}
                      initial={{ y: 0, opacity: 1, rotate: 0 }}
                      animate={reduce ? { opacity: 0 } : { y: '7vh', opacity: 0, rotate: i % 2 ? 50 : -50 }}
                      transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeIn' }}
                    >
                      <IngredientCard id={id} skin={skin} variant="tv" palette={p}
                        width="clamp(1.8rem,2.6vw,2.6rem)" />
                    </motion.div>
                  ))}
                </div>
                <span className="font-black" style={{ fontSize: tvType.title, color: p.bad }}>
                  {t(skin === 'bar' ? 'games.brew.bustTitleBar' : 'games.brew.bustTitleBrew')}
                </span>
              </motion.div>
            ) : tray.length > 0 ? (
              <motion.div key="tray" layout className="flex items-center gap-[0.7vw]">
                {tray.filter(isKnownIngredient).map((id, i) => (
                  <motion.div
                    key={`${id}-${i}`}
                    layout
                    initial={reduce ? false : { y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <IngredientCard id={id} skin={skin} variant="tv" palette={p}
                      width="clamp(2.4rem,3.6vw,3.4rem)" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.span key="empty" style={{ fontSize: tvType.body, color: p.dim }}>
                {t('games.brew.trayEmpty')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ZONE D — Spielerreihe. Grid statt Flex-Wrap, damit bei acht Spielern
          niemand aus dem Bild laeuft: jede Spalte bekommt exakt 1/n. */}
      <div className="relative z-10 flex-1 min-h-0 px-[3vw] pb-[2vh] pt-[1vh]">
        <div className="grid h-full gap-[0.8vw]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {players.map((pl, i) => {
            /**
             * Dreistufig, und die Rueckfaelle sind Pflicht: Online kann ein
             * Gast mit aelterem Buendel senden, dem `activeId` noch fehlt. Ein
             * Fernseher ganz ohne Ring ist schlimmer als ein falscher.
             */
            const isActive = activeId
              ? pl.id === activeId
              : activeIdx >= 0
                ? i === activeIdx
                : activePlayerName != null && pl.name === activePlayerName;
            const color = pl.color ?? p.players[i % p.players.length];
            const knownGlass = pl.glass.filter(isKnownIngredient);
            const anteil = pl.recipe.length > 0 ? pl.have / pl.recipe.length : 0;
            const form = shapeForRecipe(pl.recipeId, skin);

            return (
              <div
                key={pl.id || `${pl.name}-${i}`}
                className={`${tvPanel} flex flex-col items-center gap-[0.5vh] p-[0.9vh] min-w-0 overflow-hidden`}
                style={{
                  background: isActive ? p.surfaceRaised : p.surface,
                  borderRadius: brewRadius.xl,
                  boxShadow: isActive ? `0 0 0 2px ${color}, 0 0 40px -8px ${color}` : undefined,
                }}
              >
                {/* Kopf: Name links, Punkte rechts. */}
                <div className="flex items-baseline justify-between w-full gap-[0.4vw] px-[0.2vw]">
                  <span className="font-bold truncate" style={{ fontSize: tvType.label, color: isActive ? color : p.text }}>
                    {pl.name}
                  </span>
                  <span className="font-mono tabular-nums shrink-0" style={{ fontSize: tvType.micro, color: p.dim }}>
                    {pl.score}
                  </span>
                </div>

                {/* Glasbuehne: Ring HINTER dem Glas, Glas darauf. */}
                <div className="relative flex-1 min-h-0 w-full flex items-end justify-center">
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      bottom: '6%', left: '50%', width: '88%', aspectRatio: '1 / 1',
                      x: '-50%',
                      background: `radial-gradient(circle, ${color}55 0%, ${color}18 42%, transparent 68%)`,
                    }}
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  />
                  <Glass
                    recipeNeeds={pl.recipe as IngredientId[]}
                    filled={withBaseFirst(knownGlass)}
                    skin={skin}
                    shape={form}
                    palette={p}
                    width={skin === 'brew' ? 'clamp(56px, 7.4vw, 132px)' : undefined}
                    height={skin === 'bar'
                      ? (vieleSpieler ? 'min(16vh, 118px)' : 'min(22vh, 176px)')
                      : undefined}
                    className="relative"
                    quality="tv"
                    active={isActive}
                    intensity={isActive ? (chainLevel as 0 | 1 | 2 | 3) : 0}
                    // Nur die giessende Spalte wartet. Bei vielen Spielern
                    // bekommen die nicht-aktiven keinen Versatz mehr.
                    arrivalDelay={showPour && pourPlan?.pid === pl.id ? 500 : 0}
                    layerStagger={vieleSpieler && !isActive ? 0 : 70}
                  />
                </div>

                {/* Fortschritt: `scaleX` statt `width` — Hausregel
                    transform/opacity, sonst rechnet der Browser Layout. */}
                <div className="w-full px-[0.2vw]">
                  <div className="flex justify-end">
                  <span className="font-mono tabular-nums" style={{ fontSize: tvType.micro, color: isActive ? color : p.dim }}>
                      {pl.have}/{pl.recipe.length}{pl.brewBonus > 0 ? ` · ✦${pl.brewBonus}` : ''}
                    </span>
                  </div>
                  <div style={{ height: 'clamp(6px,0.6vh,10px)', borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <motion.div
                      style={{
                        height: '100%', width: '100%', transformOrigin: 'left',
                        background: `linear-gradient(90deg, ${color}, ${p.accent2})`,
                        boxShadow: `0 0 14px -2px ${color}`,
                      }}
                      initial={false}
                      animate={{ scaleX: anteil }}
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 18 }}
                    />
                  </div>
                </div>

                {/* Rezept als echte Karten — vorher rohe Emoji auf Vollfarbe,
                    auf der bei hellen Zutaten nichts mehr zu erkennen war. */}
                <div className="flex flex-wrap justify-center gap-[0.25vw]" style={{ maxWidth: '100%' }}>
                  {pl.recipe.filter(isKnownIngredient).map((id, ri) => (
                    <IngredientCard
                      key={`${id}-${ri}`}
                      id={id}
                      skin={skin}
                      variant="chip"
                      palette={p}
                      state={pl.glass.includes(id) ? 'owned' : 'muted'}
                    />
                  ))}
                </div>

                {/* Rezeptname — `recipeId` kam schon immer im Payload an und
                    wurde bisher nicht gelesen. */}
                <span className="truncate w-full text-center" style={{ fontSize: tvType.micro, color: p.dim }}>
                  {pl.recipeId ? t(recipeKey(pl.recipeId, skin)) : ''}
                  {pl.done ? ` · ${t('games.brew.tv.done')}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gemeinsamer Kinomoment: Der TV zeigt die gezogene Karte gross, waehrend
          die dauerhaften Spielzonen dahinter lesbar bleiben. */}
      <AnimatePresence mode="wait">
        {showDraw && (
          <motion.div
            key={showDraw.seq}
            className="pointer-events-none absolute inset-0 z-40 grid place-items-center"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: showDraw.outcome === 'bust' ? 'rgba(38,4,12,.66)' : 'rgba(7,5,18,.48)' }}
          >
            <motion.div
              initial={false}
              animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 1], scale: [0.62, 1.08, 1], rotateY: [180, 0] }}
              transition={{ duration: reduce ? 0.12 : 0.46, ease: 'easeOut' }}
              className="flex flex-col items-center gap-[1vh] rounded-[2vw] border border-white/20 bg-black/55 p-[2vw] shadow-2xl"
            >
              {showDraw.id && isKnownIngredient(showDraw.id) ? (
                <IngredientCard id={showDraw.id} skin={skin} variant="tv" showName palette={p} width="clamp(7rem,11vw,12rem)" />
              ) : (
                <span style={{ fontSize: 'clamp(5rem,10vw,11rem)' }}>{skin === 'brew' ? '🌋' : '🔔'}</span>
              )}
              <span className="font-black uppercase tracking-[0.22em]" style={{
                fontSize: tvType.title,
                color: showDraw.outcome === 'hit' ? '#86EFAC' : showDraw.outcome === 'bust' ? p.bad : p.text,
              }}>
                {showDraw.outcome === 'hit'
                  ? `${t('games.brew.drawHit')}${bonusPreview > 0 ? ` · +${bonusPreview}` : ''}`
                  : showDraw.outcome === 'bust'
                    ? t(skin === 'bar' ? 'games.brew.bustTitleBar' : 'games.brew.bustTitleBrew')
                    : t('games.brew.drawMiss')}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
