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
 * ZWEI GEWAENDER: `skin` steuert nur Emoji/Namen (siehe brew-content.ts) und
 * das Glas-Leuchten (Sache von `Glass`) — die Mechanik hier ist identisch.
 *
 * Defensiv destrukturiert und gegen unbekannte Zutaten-Kennungen gewappnet:
 * Ein Fernseher kann sich jederzeit verbinden und bekommt dann einen
 * unvollstaendigen Zustand. Ein Absturz hier macht den ganzen Bildschirm
 * schwarz — das ist in diesem Projekt schon passiert.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Glass } from '@/games/brew/Glass';
import { IngredientIcon } from '@/games/brew/IngredientIcon';
import { ingredientPlate } from '@/games/brew/BrewFX';
import { BrewAtmosphere } from '@/games/brew/BrewAtmosphere';
import {
  INGREDIENTS,
  emojiFor,
  preloadIngredients,
  ingredientKey,
  type IngredientId,
  type Skin,
} from '@/games/brew/brew-content';
import { tvPanel, tvType, tvActiveRing } from '../tv-tokens';

interface Props {
  gameState: Record<string, unknown>;
}

interface BrewPlayerState {
  id: string;
  name: string;
  score: number;
  glass: string[];
  recipe: string[];
  done: boolean;
}

const PALETTE = ['#df8eff', '#8ff5ff', '#ffd23f', '#ff6e84', '#7af5a8', '#ffa552', '#a78bfa', '#4dd4ff'];

function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Typ-Wache: nur Kennungen, die `INGREDIENTS` wirklich kennt, duerfen an
 * `emojiFor`/`INGREDIENTS[id]` weiter — sonst wirft dort ein Zugriff auf
 * `undefined` und reisst die ganze Ansicht mit. */
function isKnownIngredient(id: string): id is IngredientId {
  return Object.prototype.hasOwnProperty.call(INGREDIENTS, id);
}

function safeEmoji(id: string, skin: Skin): string {
  return isKnownIngredient(id) ? emojiFor(id, skin) : '❔';
}

function safeColor(id: string): string {
  return isKnownIngredient(id) ? INGREDIENTS[id].color : '#2a2438';
}

/** Kartenplatte — Definition liegt in BrewFX, damit Telefon und TV nie auseinanderlaufen. */
function cardPlate(id: string) {
  return ingredientPlate(safeColor(id));
}

/**
 * `Glass` sortiert selbst nicht — Index 0 in `filled` zeichnet es ganz unten
 * und geht davon aus, dass dort die Basis-Zutat steht (siehe Glass.tsx-Kopf).
 * Kommt der tv-state anders sortiert an, als das eigentliche Spiel es haelt
 * (z. B. weil die Uebertragung ueber Set/Map lief), wuerde die Basis sonst
 * mitten im Glas schweben statt unten zu liegen. Billige Absicherung statt
 * blindem Vertrauen in die Reihenfolge, die von aussen ankommt.
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
  // Die Feldnamen kommen aus `tvPayload` in BrewGame.tsx — wer hier umbenennt,
  // muss dort nachziehen, sonst bleibt der Fernseher stumm und leer.
  const activePlayerName = s.activeName ? String(s.activeName) : null;
  const counter = useMemo(() => toStringArray(s.counter), [s.counter]);
  const tray = useMemo(() => toStringArray(s.tray), [s.tray]);
  const deckCount = Number(s.deckCount ?? 0);
  const bustSeq = Number(s.bustSeq ?? 0);
  const pourSeq = Number(s.pourSeq ?? 0);
  const pourPlan = (s.pourPlan ?? null) as { pid?: string; used?: string[]; leftover?: string[] } | null;

  const players = useMemo<BrewPlayerState[]>(() => {
    const raw = Array.isArray(s.players) ? s.players : [];
    return raw.map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      const glass = toStringArray(q.glass);
      const recipe = toStringArray(q.recipeNeeds);
      return {
        // Die Kennung ist die Wahrheit, nicht die Position: ein
        // zusammengefasster Schnappschuss koennte beides gleichzeitig tragen.
        id: String(q.id ?? ''),
        name: String(q.name ?? ''),
        score: Number(q.score ?? 0),
        glass,
        recipe,
        // Abgeleitet statt gesendet: "fertig" ist genau dann wahr, wenn jede
        // Zutat des Rezepts im Glas steckt. Ein eigenes Feld dafuer koennte
        // gegenueber glass/recipe auseinanderlaufen.
        done: recipe.length > 0 && recipe.every((id) => glass.includes(id)),
      };
    });
  }, [s.players]);

  // Theke: neu hinzugekommene Karten kurz aufblitzen lassen. Das ist die
  // Information, wegen der alle hinsehen, sobald jemand zieht oder ablegt.
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
  // bliebe im naechsten Payload stehen, die Flanke waere verbraucht und der
  // NAECHSTE Bust wuerde verschluckt. `null` heisst "noch nie gesehen" — beim
  // ersten Payload wird der Stand nur gemerkt, sonst spielt ein frisch
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

  // Die 16 Bilder des Gewands still vorladen — auf dem Fernseher waere ein
  // nachploppendes Icon aus drei Metern sichtbar.
  useEffect(() => { preloadIngredients(skin); }, [skin]);

  /**
   * Der Guss auf dem Fernseher: KEIN Bogenflug.
   *
   * Auf drei Metern ist eine 48-Pixel-Karte auf Bogenbahn quer ueber 55 Zoll
   * nicht lesbar — man saehe einen Streifen und wuesste nicht, woher er kam.
   * Lesbar sind Farbe, Groesse und Gruppierung. Also SPALTET sich die
   * Tablettzeile sichtbar: Passendes nach links und groesser, Ballast nach
   * rechts und entsaettigt. Dieselbe `null`-Wache wie beim Bust, damit ein
   * frisch verbundener Fernseher keinen Guss aus der Vergangenheit nachspielt.
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

  const cols = Math.max(1, players.length);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ color: '#F1F5F9' }}>
      <BrewAtmosphere skin={skin} variant="tv" />
      {/* Kopfzeile */}
      <div className="relative z-10 flex items-center justify-between px-[3vw] pt-[2vh] shrink-0 gap-[2vw]">
        <span style={{ fontSize: tvType.label, color: '#a8abb3' }}>
          {t(skin === 'bar' ? 'games.brew.titleBar' : 'games.brew.titleBrew')}
          {' · '}
          {deckCount > 0 ? t('games.brew.deckCount', { count: deckCount }) : t('games.brew.deckEmpty')}
        </span>
        <AnimatePresence mode="wait">
          {activePlayerName && (
            <motion.span
              key={activePlayerName}
              initial={reduce ? false : { y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-black text-right truncate"
              style={{ fontSize: tvType.title, color: '#FDE047' }}
            >
              {t('games.brew.turnOf', { name: activePlayerName })}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Theke — offen, gross, gemeinsame Entscheidungsgrundlage */}
      <div className="relative z-10 px-[3vw] pt-[1.4vh] shrink-0">
        <p className="uppercase tracking-[0.18em]" style={{ fontSize: tvType.micro, color: '#a8abb3' }}>
          {t('games.brew.counterLabel')}
        </p>
        <div className={`${tvPanel} mt-[0.6vh] flex flex-wrap content-start gap-[1vh] p-[1.4vh]`} style={{ minHeight: '11vh' }}>
          {counter.length === 0 && (
            <span className="self-center" style={{ fontSize: tvType.body, color: '#6b6480' }}>
              {t('games.brew.counterEmpty')}
            </span>
          )}
          {counter.map((id, i) => {
            const isFresh = freshCount > 0 && i >= counter.length - freshCount;
            return (
              <motion.div
                key={`${id}-${i}`}
                layout
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center rounded-2xl shrink-0"
                style={{
                  width: 'clamp(3rem,4.6vw,4.8rem)',
                  height: 'clamp(3rem,4.6vw,4.8rem)',
                  ...cardPlate(id),
                  ...(isFresh
                    ? { boxShadow: '0 0 0 3px rgba(255,255,255,0.9), 0 0 30px -4px rgba(255,255,255,0.9)' }
                    : {}),
                }}
              >
                {isKnownIngredient(id)
                  ? <IngredientIcon id={id} skin={skin} style={{ width: '62%', height: '62%' }} emojiSize="clamp(1.5rem,2.4vw,2.4rem)" />
                  : <span style={{ fontSize: 'clamp(1.5rem,2.4vw,2.4rem)' }}>{safeEmoji(id, skin)}</span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tablett — die Bust-Animation lebt AUSSCHLIESSLICH hier, nie als
          Vollbild-Overlay, damit die Glaeser darunter sichtbar bleiben. */}
      <div className="relative z-10 px-[3vw] pt-[1.2vh] shrink-0">
        <p className="uppercase tracking-[0.18em]" style={{ fontSize: tvType.micro, color: '#a8abb3' }}>
          {t('games.brew.trayLabel')}
        </p>
        <div className="mt-[0.6vh] flex items-center" style={{ minHeight: '7vh' }}>
          <AnimatePresence mode="wait">
            {showPour && pourPlan ? (
              // Die Spaltung IST die Erklaerung: links geht ins Glas, rechts
              // auf die Theke. Grosse Formen, klare Richtung, keine Bogenbahn.
              <motion.div key="pour" className="flex items-center gap-[3vw] w-full justify-center">
                <motion.div
                  className="flex items-center gap-[1vh]"
                  initial={reduce ? false : { x: 0, scale: 1 }}
                  animate={reduce ? {} : { x: '-2vw', scale: 1.25 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {(pourPlan.used ?? []).slice(0, 7).map((id, i) => (
                    <div
                      key={`u${i}-${id}`}
                      className="flex items-center justify-center rounded-xl shrink-0"
                      style={{
                        width: 'clamp(2.4rem,3.6vw,3.4rem)',
                        height: 'clamp(2.4rem,3.6vw,3.4rem)',
                        ...cardPlate(id),
                        outline: '2px solid rgba(255,255,255,0.85)',
                      }}
                    >
                      {isKnownIngredient(id)
                        ? <IngredientIcon id={id} skin={skin} style={{ width: '62%', height: '62%' }} emojiSize="clamp(1.1rem,1.8vw,1.6rem)" />
                        : <span style={{ fontSize: 'clamp(1.1rem,1.8vw,1.6rem)' }}>{safeEmoji(id, skin)}</span>}
                    </div>
                  ))}
                </motion.div>
                <motion.div
                  className="flex items-center gap-[1vh]"
                  initial={reduce ? false : { x: 0, opacity: 1 }}
                  animate={reduce ? { opacity: 0.45 } : { x: '2vw', opacity: 0.45, filter: 'saturate(0.4)' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {(pourPlan.leftover ?? []).slice(0, 7).map((id, i) => (
                    <div
                      key={`l${i}-${id}`}
                      className="flex items-center justify-center rounded-xl shrink-0"
                      style={{
                        width: 'clamp(2rem,3vw,2.8rem)',
                        height: 'clamp(2rem,3vw,2.8rem)',
                        ...cardPlate(id),
                      }}
                    >
                      {isKnownIngredient(id)
                        ? <IngredientIcon id={id} skin={skin} style={{ width: '62%', height: '62%' }} emojiSize="clamp(1rem,1.6vw,1.4rem)" />
                        : <span style={{ fontSize: 'clamp(1rem,1.6vw,1.4rem)' }}>{safeEmoji(id, skin)}</span>}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            ) : showBust ? (
              <motion.div
                key="bust"
                className="flex items-center gap-[1.4vh]"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.span
                  style={{ fontSize: 'clamp(2.2rem,4vw,3.4rem)' }}
                  initial={reduce ? false : { rotate: 0 }}
                  animate={{ rotate: -55 }}
                  transition={{ duration: 0.4 }}
                >
                  🍽️
                </motion.span>
                <div className="relative" style={{ width: '9vw', height: '4.2vh' }}>
                  {tray.slice(0, 6).map((id, i) => (
                    <motion.span
                      key={`${id}-${i}`}
                      className="absolute"
                      style={{ fontSize: 'clamp(1.3rem,2.2vw,2rem)', left: `${i * 15}%`, top: 0 }}
                      initial={{ y: 0, opacity: 1, rotate: 0 }}
                      animate={
                        reduce
                          ? { opacity: 0 }
                          : { y: '6vh', opacity: 0, rotate: i % 2 ? 50 : -50 }
                      }
                      transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeIn' }}
                    >
                      {safeEmoji(id, skin)}
                    </motion.span>
                  ))}
                </div>
                <span className="font-black" style={{ fontSize: tvType.title, color: '#ff6e84' }}>
                  {t(skin === 'bar' ? 'games.brew.bustTitleBar' : 'games.brew.bustTitleBrew')}
                </span>
              </motion.div>
            ) : tray.length > 0 ? (
              <motion.div key="tray" layout className="flex items-center gap-[1vh]">
                {tray.map((id, i) => (
                  <motion.div
                    key={`${id}-${i}`}
                    layout
                    initial={reduce ? false : { y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-center rounded-xl shrink-0"
                    style={{
                      width: 'clamp(2.4rem,3.6vw,3.4rem)',
                      height: 'clamp(2.4rem,3.6vw,3.4rem)',
                      ...cardPlate(id),
                    }}
                  >
                    {isKnownIngredient(id)
                      ? <IngredientIcon id={id} skin={skin} style={{ width: '62%', height: '62%' }} emojiSize="clamp(1.1rem,1.8vw,1.6rem)" />
                      : <span style={{ fontSize: 'clamp(1.1rem,1.8vw,1.6rem)' }}>{safeEmoji(id, skin)}</span>}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.span key="empty" style={{ fontSize: tvType.body, color: '#6b6480' }}>
                {t('games.brew.trayEmpty')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Glaeser nebeneinander — bis zu 8 Spieler, per Grid statt Flex-Wrap,
          damit niemand aus dem Bild laeuft: jede Spalte bekommt exakt 1/n. */}
      <div className="relative z-10 flex-1 min-h-0 px-[3vw] pb-[2vh] pt-[1.2vh]">
        <div
          className="grid h-full gap-[0.8vw]"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {players.map((p, i) => {
            const isActive = activePlayerName != null && p.name === activePlayerName;
            const color = PALETTE[i % PALETTE.length];
            const knownGlass = p.glass.filter(isKnownIngredient);

            return (
              <div
                key={`${p.name}-${i}`}
                className={`${tvPanel} flex flex-col items-center justify-end gap-[0.6vh] p-[0.8vh] min-w-0 overflow-hidden`}
                style={isActive ? tvActiveRing(color) : undefined}
              >
                <span
                  className="font-bold truncate w-full text-center"
                  style={{ fontSize: tvType.label, color: isActive ? color : '#F1F5F9' }}
                >
                  {p.name}
                </span>

                {/* Rezept — Farbe = besorgt, blass = fehlt noch. Damit muss
                    niemand raten, wem er mit dem Ablegen hilft. */}
                <div className="flex flex-wrap justify-center gap-[0.25vh]" style={{ maxWidth: '100%' }}>
                  {p.recipe.map((id, ri) => {
                    const have = p.glass.includes(id);
                    return (
                      <span
                        key={`${id}-${ri}`}
                        title={isKnownIngredient(id) ? t(ingredientKey(id, skin)) : undefined}
                        className="flex items-center justify-center rounded-md shrink-0"
                        style={{
                          width: 'clamp(1.1rem,1.5vw,1.6rem)',
                          height: 'clamp(1.1rem,1.5vw,1.6rem)',
                          background: have ? safeColor(id) : 'rgba(255,255,255,0.06)',
                          opacity: have ? 1 : 0.4,
                          fontSize: 'clamp(0.7rem,1vw,1rem)',
                        }}
                      >
                        {safeEmoji(id, skin)}
                      </span>
                    );
                  })}
                </div>

                {/* `recipeNeeds` bestimmt nur die Bandbreite/Anzahl der Schichten
                    im Glas — unbekannte Kennungen darin werden nie in
                    INGREDIENTS nachgeschlagen, deshalb reicht hier eine
                    Typ-Zusicherung statt Filtern (Filtern wuerde die
                    Rezeptlaenge verfaelschen). `filled` dagegen wird direkt
                    nachgeschlagen, deshalb ist `knownGlass` dort Pflicht. */}
                <Glass
                  recipeNeeds={p.recipe as IngredientId[]}
                  filled={withBaseFirst(knownGlass)}
                  skin={skin}
                  size="sm"
                  className="mt-[0.3vh]"
                  // Nur die giessende Spalte wartet — die anderen Glaeser
                  // duerfen sich nicht grundlos verzoegert fuellen.
                  arrivalDelay={showPour && pourPlan?.pid === p.id ? 500 : 0}
                />

                <span className="font-mono tabular-nums truncate w-full text-center" style={{ fontSize: tvType.micro, color: '#b3a8c9' }}>
                  {p.score}
                  {p.done ? ` · ${t('games.brew.tv.done')}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
