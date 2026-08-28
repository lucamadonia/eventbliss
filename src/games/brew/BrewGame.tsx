/**
 * GEBRÄU — Push-your-luck-Sammelspiel um ein offen liegendes Rezept.
 *
 * Wer dran ist, nimmt sich pro Zug HÖCHSTENS eine Karte risikofrei von der
 * offenen "Theke" und darf beliebig oft vom verdeckten Stapel ziehen. Jede
 * gezogene Zutat landet auf dem "Tablett" — kommt die BUST-Karte, ist das
 * Tablett futsch und es gibt eine Strafe. "Eingießen" sichert alle Zutaten,
 * die das eigene Rezept noch braucht, für immer im Glas und beendet den Zug;
 * der Rest landet offen auf der Theke für die nächste Person. Wer zuerst
 * sein Rezept voll hat, gewinnt die Runde.
 *
 * ZWEI GEWÄNDER, EINE MECHANIK (siehe brew-content.ts): Ohne Trinkmodus ist
 * es ein Zaubertrank und die Strafe eine kleine Aufgabe; mit Trinkmodus wird
 * daraus ein Cocktail und die Strafe ein Schluck. `useDrinkingMode()` ist die
 * einzige Stelle, die das entscheidet — dieselbe Wahl wie in TruthDareGame.
 *
 * `deck.ts`/`scoring.ts` baut parallel ein anderer Agent. Wichtig aus deren
 * Kommentaren: `buildDeck` liefert bereits gemischte Zutatenkarten OHNE
 * Bust-Karten — die kommen erst durch `insertBusts` gleichmäßig verteilt
 * hinein. Ein zweites Mischen danach würde genau diese Verteilung wieder
 * zerstören, darum wird der fertige Stapel hier nicht erneut gemischt.
 *
 * NACHMISCHEN STATT AUFBLAEHEN: Der Ziehstapel hat keinen großen Puffer mehr
 * — läuft er leer, mischt `drawCard` den Ablagestapel neu und der wird zum
 * Ziehstapel. Ein Bust legt darum das GANZE Tablett UND die gezogene
 * Bust-Karte selbst auf die Ablage; fehlte die Bust-Karte, wäre die zweite
 * Hälfte einer langen Partie gefahrlos. `drawPile`/`discardPile` sind darum
 * zwei getrennte Zustände statt einem einzigen Stapel.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FlaskConical, Martini, ArrowLeft, Volume2, VolumeX, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useDrinkingMode } from "@/hooks/useDrinkingMode";
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useTVContext } from "@/contexts/TVBroadcastContext";
import { useBackGuard } from "@/lib/back-guard";
import { NativeOverlayPortal } from "@/components/native/NativeOverlayPortal";
import { PlayerSetup, type PlayerSetupPlayer } from "../ui/PlayerSetup";
import { useInitialRoster } from "../ui/useInitialRoster";
import { getPlayerColor } from "../ui/PlayerAvatars";
import { GameSetupBackLink } from "../ui/GameSetupBackLink";
import { hasShellBackButton } from "../ui/shell-back";
import { ResultScreen } from "../ui/ResultScreen";
import type { OnlineGameProps } from "../multiplayer/OnlineGameTypes";
import { Glass } from "./Glass";
import { BrewStageFX } from "./BrewStageFX";
import { GLASS_SHAPES, glassMouthT, shapeForRecipe } from "./glass-shapes";
import { BREW_PALETTES } from "./brew-palette";
import { TrayCards } from "./TrayCards";
import { ingredientPlate, POUR_BEATS, pourDuration } from "./BrewFX";
import { PourFlight, type PourPlan } from "./PourFlight";
import { DrawReveal, drawRevealDuration, type DrawnCard } from "./DrawReveal";
import { IngredientIcon } from "./IngredientIcon";
import { TrayTip } from "./BrewFX";
import { BrewAtmosphere } from "./BrewAtmosphere";
import {
  INGREDIENTS,
  preloadIngredients,
  ingredientKey,
  recipeKey,
  type IngredientId,
  type RecipeLength,
  type Skin,
} from "./brew-content";
import { dealRecipes, buildDeck, insertBusts, drawCard, missingFor, isComplete, splitTray, ownPlayer, type DeckCard, type DealtRecipe } from "./deck";
import { scoreFor } from "./scoring";
import { bonusForPour, cappedBrewBonus, chainLevelFor, riskTierFor, type BrewRiskTier } from "./brew-gameplay";
import { useBrewAudio, type BrewCue } from "./brew-audio";

type Phase = "setup" | "playing" | "gameOver";

/**
 * Wie lange das fertige Glas stehen bleibt, bevor der Ergebnisschirm kommt.
 * Deckt die Schichtfederung (~600 ms) plus `FinishSparkle` ab.
 */
const FINISH_HOLD_MS = 1400;

interface PlayerState {
  id: string;
  name: string;
  color: string;
  recipe: DealtRecipe;
  /** Gesicherte Zutaten, Basis zuerst — für immer sicher, das nimmt der Bust nicht mehr. */
  glass: IngredientId[];
  score: number;
  brewBonus: number;
}

/**
 * Der Trink-Disclaimer steckt BEWUSST NICHT hier drin: `recordDrink()` zaehlt im
 * localStorage des jeweiligen Geraets. Waere er Teil der Strafe, wuerde der
 * Gastgeber online die Schlucke aller anderen sammeln und "50 Runden!" erschiene
 * auf dem falschen Bildschirm. Die Strafe reist, der Zaehler bleibt zu Hause.
 */
type Penalty =
  | { kind: "task"; taskIndex: number }
  | { kind: "sip" };

/** Basis-Zutat immer zuerst — Glass.tsx zeichnet Index 0 als unterste Schicht. */
function sortGlassOrder(ids: IngredientId[]): IngredientId[] {
  const base = ids.filter((id) => INGREDIENTS[id].isBase);
  const rest = ids.filter((id) => !INGREDIENTS[id].isBase);
  return [...base, ...rest];
}

export default function BrewGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const drinkingMode = useDrinkingMode();
  const isDrinkingMode = drinkingMode.isDrinkingMode;
  const localSkin: Skin = isDrinkingMode ? "bar" : "brew";
  const reduceMotion = useReducedMotion();
  const { enabled: soundEnabled, setEnabled: setSoundEnabled, play: playSound } = useBrewAudio();
  const tvContext = useTVContext();

  // --- Online: Rollen ----------------------------------------------------
  // Offline verhaelt sich das Spiel wie ein Gastgeber ohne Gaeste: isHost bleibt
  // true, isMyTurn immer true. Damit laeuft jeder Pfad unten unveraendert weiter.
  const isOnline = !!online;
  const isHost = !online || online.isHost;
  const myId = online?.myPlayerId ?? null;

  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [ingredientCount, setIngredientCount] = useState<RecipeLength>(5);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tray, setTray] = useState<IngredientId[]>([]);
  const [counter, setCounter] = useState<IngredientId[]>([]);
  // Zwei getrennte Stapel statt einem: `drawCard` (deck.ts) mischt den
  // Ablagestapel selbst neu, sobald der Ziehstapel leerläuft.
  const [drawPile, setDrawPile] = useState<DeckCard[]>([]);
  const [discardPile, setDiscardPile] = useState<DeckCard[]>([]);
  const [counterTaken, setCounterTaken] = useState(false);
  const [penalty, setPenalty] = useState<Penalty | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  // Für TrayTip (BrewFX): wie viele Karten beim letzten Bust verloren gingen,
  // und ein Zähler, der bei jedem Bust weiterspringt und die Kipp-Animation auslöst.
  const [bustTrayCount, setBustTrayCount] = useState(0);
  const [bustTrigger, setBustTrigger] = useState(0);
  // Kurzer "wird gemischt"-Hinweis, wenn drawCard() nachmischen musste.
  const [toast, setToast] = useState<string | null>(null);
  const [audioCue, setAudioCue] = useState<BrewCue | null>(null);
  const [audioCueSeq, setAudioCueSeq] = useState(0);

  const emitCue = useCallback((cue: BrewCue) => {
    setAudioCue(cue);
    setAudioCueSeq((n) => n + 1);
    // Online spielt nur der Host Audio. Sonst wuerden acht Telefone denselben
    // Treffer zeitversetzt wiedergeben.
    if ((!online || isHost) && !tvContext?.isActive) playSound(cue);
  }, [online, isHost, playSound, tvContext?.isActive]);

  // --- Online: gespiegelter Zustand --------------------------------------
  // Das Gewand bestimmt der Gastgeber fuer die ganze Runde. Ohne das spielte er
  // "Cocktail mit Schluck", waehrend ein Gast "Zaubertrank mit Aufgabe" saehe —
  // zwei Strafarten am selben Tisch. BEWUSST IN KAUF GENOMMEN: ein Geraet ohne
  // freigeschaltetes 18+-Easter-Egg bekommt dann Alkohol-Texte zu sehen.
  const [roundSkin, setRoundSkin] = useState<Skin | null>(null);
  const skin: Skin = roundSkin ?? localSkin;
  // EINE Farbwahrheit: dieselbe Palette, die Glas, Karten, Atmosphaere und
  // der Fernseher benutzen. Vorher standen hier eigene THEME/ACCENT-Konstanten
  // in Blauschwarz — die Bar sah dadurch aus wie das Labor mit anderen Emoji.
  const theme = BREW_PALETTES[skin];
  // Der Ziehstapel verlaesst den Gastgeber NIE — er verraet, wo die Bust-Karten
  // liegen, und damit waere das Push-your-luck tot. Gaeste bekommen nur die Zahl.
  const [remoteDeckCount, setRemoteDeckCount] = useState(0);
  // Zaehler statt Booleans: ein `true` bliebe im naechsten Schnappschuss stehen
  // und der Hinweis liefe endlos neu an.
  const [bustSeq, setBustSeq] = useState(0);
  const [penaltySeq, setPenaltySeq] = useState(0);
  const [reshuffleSeq, setReshuffleSeq] = useState(0);
  const [sipDisclaimer, setSipDisclaimer] = useState<{ message: string; emoji: string } | null>(null);
  // `null` heisst "noch nie synchronisiert". Beim ersten Schnappschuss wird der
  // Stand nur GEMERKT, nicht abgespielt — sonst kippt bei einem spaet
  // verbundenen Gast sofort das Tablett und es regnet Strafen aus der Vergangenheit.
  const lastBustRef = useRef<number | null>(null);
  const lastPenaltyRef = useRef<number | null>(null);
  const lastReshuffleRef = useRef<number | null>(null);
  const lastDrawRef = useRef<number | null>(null);
  const lastAudioCueRef = useRef<number | null>(null);
  // --- Eingiess-Choreografie ---------------------------------------------
  // Die WAHRHEIT wechselt sofort (Glas, Theke, Tablett), nur die DARSTELLUNG
  // laeuft nach — dasselbe Muster wie beim Bust, wo `TrayTip` 700 ms lang
  // nachspielt, was schon nicht mehr da ist. Ein verlorener Schnappschuss kann
  // damit nie das Spiel verklemmen.
  /**
   * Die zuletzt gezogene Karte — fuer den Aufdeckmoment.
   *
   * Das Ziehen ist der Nervenkitzel dieses Spiels und hatte bis hierher gar
   * keine Buehne: die Karte erschien einfach auf dem Tablett.
   */
  const [drawnCard, setDrawnCard] = useState<DrawnCard | null>(null);
  const [pourPlan, setPourPlan] = useState<PourPlan | null>(null);
  const [pourSeq, setPourSeq] = useState(0);
  /** Das Tablett bleibt kurz stehen, damit man die Sortierung ablesen kann. */
  const [pourFreeze, setPourFreeze] = useState<IngredientId[] | null>(null);
  const lastPourRef = useRef<number | null>(null);
  /** Letzte gezeichnete Kartenpositionen — nach dem Guss ist die Reihe leer. */
  const trayGeoRef = useRef<DOMRect[]>([]);
  const glassBoxRef = useRef<HTMLDivElement | null>(null);
  const counterBoxRef = useRef<HTMLDivElement | null>(null);
  // Stabil, damit der Flug-Effekt nicht bei jedem Rendern neu anlaeuft.
  const readGlassBox = useCallback(() => glassBoxRef.current?.getBoundingClientRect() ?? null, []);
  const readCounterBox = useCallback(() => counterBoxRef.current?.getBoundingClientRect() ?? null, []);
  /** Alle laufenden Guss-Timer, damit das Verlassen sie abraeumt. */
  const pourTimersRef = useRef<number[]>([]);

  /** Traegt den verzoegerten Wechsel zum Ergebnisschirm — beim Verlassen loeschen. */
  const finishTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    pourTimersRef.current.forEach((id) => window.clearTimeout(id));
  }, []);

  const penaltyTasks = useMemo(() => {
    const raw = t("games.brew.penaltyTasks", { returnObjects: true });
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const active = players[activeIdx] as PlayerState | undefined;
  /** Offline immer wahr — online nur, wenn dieses Geraet tatsaechlich dran ist. */
  const isMyTurn = !isOnline || (!!myId && active?.id === myId);
  /**
   * Wessen Rezept unter "Dein Rezept" steht.
   *
   * Offline wandert das Telefon, "ich" bin also immer der aktive Spieler.
   * ONLINE NICHT: dort sass hier frueher ebenfalls `active`, und damit sah
   * JEDER Gast das Rezept der aktiven Person, ueberschrieben mit "Dein
   * Rezept" — der Bezugspunkt des ganzen Bildschirms war falsch.
   */
  const me = ownPlayer(players, isOnline ? myId : null, active) ?? active;

  // Zurück abfangen: der native Zurück-Button liegt über dem Pfeil im Kopf.
  useBackGuard(() => {
    if (phase === "setup" || phase === "gameOver") return false;
    if (confirmExit) { setConfirmExit(false); return true; }
    setConfirmExit(true);
    return true;
  });

  // --- Rundenstart -----------------------------------------------------
  const handleStart = useCallback((cfg: { players: { id: string; name: string }[]; length: RecipeLength }) => {
    const recipes = dealRecipes(cfg.players.length, cfg.length);
    const ps: PlayerState[] = cfg.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      color: getPlayerColor(i),
      recipe: recipes[i],
      glass: [],
      score: 0,
      brewBonus: 0,
    }));
    setPlayers(ps);
    setIngredientCount(cfg.length);
    // buildDeck mischt bereits — insertBusts verteilt die Bust-Karten gezielt
    // gleichmäßig hinein, ein erneutes Mischen würde das wieder zunichtemachen.
    setDrawPile(insertBusts(buildDeck(recipes)));
    setDiscardPile([]);
    setCounter([]);
    setTray([]);
    setActiveIdx(0);
    setCounterTaken(false);
    setPenalty(null);
    setWinnerId(null);
    // Ein noch laufender Sieges-Timer wuerde die frische Runde sofort wieder
    // auf den Ergebnisschirm werfen.
    if (finishTimerRef.current) { window.clearTimeout(finishTimerRef.current); finishTimerRef.current = null; }
    // Das Gewand des Gastgebers gilt ab jetzt fuer alle.
    setRoundSkin(localSkin);
    // Zaehler und Wachposten zuruecksetzen, sonst blockiert ein alter Stand die
    // erste Bust-Animation der neuen Runde.
    setBustSeq(0);
    setPenaltySeq(0);
    setReshuffleSeq(0);
    setAudioCue(null);
    setAudioCueSeq(0);
    lastBustRef.current = null;
    lastPenaltyRef.current = null;
    lastReshuffleRef.current = null;
    lastDrawRef.current = null;
    lastAudioCueRef.current = null;
    // NICHT null: der Wachposten deutet null als "noch nie gesehen" und wuerde
    // den ersten Guss jeder Runde verschlucken. Der Zaehler faengt bei 0 an,
    // also ist 0 der richtige Startwert.
    lastPourRef.current = 0;
    setPourPlan(null);
    setPourFreeze(null);
    setDrawnCard(null);
    setPourSeq(0);
    setSipDisclaimer(null);
    setPhase("playing");
  }, [localSkin]);

  const playAgainLocal = useCallback(() => {
    if (players.length === 0) return;
    handleStart({ players: players.map((p) => ({ id: p.id, name: p.name })), length: ingredientCount });
  }, [players, ingredientCount, handleStart]);

  // --- Zug -------------------------------------------------------------
  const advanceTurn = useCallback(() => {
    setActiveIdx((i) => (players.length ? (i + 1) % players.length : 0));
    setCounterTaken(false);
  }, [players.length]);

  // Laeuft nur beim Gastgeber. `recordDrink()` steht hier bewusst NICHT — das
  // macht jedes Geraet fuer sich, siehe den Effekt weiter unten.
  const triggerPenalty = useCallback(() => {
    if (skin === "bar") {
      setPenalty({ kind: "sip" });
    } else {
      const idx = penaltyTasks.length ? Math.floor(Math.random() * penaltyTasks.length) : 0;
      setPenalty({ kind: "task", taskIndex: idx });
    }
    setPenaltySeq((n) => n + 1);
  }, [skin, penaltyTasks]);

  const doDraw = useCallback(() => {
    if (phase !== "playing" || penalty || winnerId || pourPlan || drawnCard) return;
    const result = drawCard(drawPile, discardPile);
    // Laut Regeln darf das nie vorkommen (jede Zutat steckt immer irgendwo),
    // aber `drawCard` ist eine reine Funktion und wirft dafür nicht — also
    // hier defensiv abfangen statt blind auf eine Karte zu vertrauen.
    if (!result) return;
    const { card, drawPile: nextDraw, discardPile: nextDiscard, reshuffled } = result;
    emitCue("draw");

    if (card.kind === "bust") {
      void haptics.error();
      // Tablett UND die gezogene Bust-Karte selbst wandern auf die Ablage —
      // fehlte die Bust-Karte, wäre die zweite Hälfte einer langen Partie
      // gefahrlos, weil alle Busts schon aus dem ersten Durchgang verbraucht wären.
      const trayAsCards: DeckCard[] = tray.map((id) => ({ kind: "ingredient", id }));
      setDrawPile(nextDraw);
      setDiscardPile([...nextDiscard, ...trayAsCards, card]);
      // TrayTip (BrewFX) zeigt das kippende Tablett zuerst — die Strafe kommt
      // erst danach, sonst würde die Vollbild-Strafe die Animation sofort
      // zudecken und "nur das Ungesicherte geht verloren" wäre nicht zu sehen.
      setBustTrayCount(tray.length);
      setBustTrigger((n) => n + 1);
      setBustSeq((n) => n + 1);
      setTray([]);
      // Erst die Unglueckskarte zeigen, DANN kippen und strafen. Ohne die
      // Wartezeit ueberholt die Vollbild-Strafe den Schreckmoment.
      setDrawnCard({ id: null, seq: Date.now(), outcome: "bust" });
      window.setTimeout(() => emitCue("bust"), reduceMotion ? 80 : 330);
      window.setTimeout(triggerPenalty, drawRevealDuration(true, !!reduceMotion) + (reduceMotion ? 0 : 700));
    } else {
      void haptics.light();
      setDrawPile(nextDraw);
      setDiscardPile(nextDiscard);
      const beforeHits = active ? splitTray(active.recipe, active.glass, tray).used.length : 0;
      const afterHits = active ? splitTray(active.recipe, active.glass, [...tray, card.id]).used.length : beforeHits;
      const hit = afterHits > beforeHits;
      setDrawnCard({ id: card.id, seq: Date.now(), outcome: hit ? "hit" : "miss" });
      window.setTimeout(() => {
        emitCue(hit ? "hit" : "miss");
        if (hit) void haptics.medium();
      }, reduceMotion ? 80 : 360);
      setTray((prev) => [...prev, card.id]);
    }

    if (reshuffled) {
      const msg = t("games.brew.reshuffled");
      setToast(msg);
      window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1600);
      setReshuffleSeq((n) => n + 1);
    }
  }, [phase, penalty, winnerId, pourPlan, drawnCard, drawPile, discardPile, tray, active, reduceMotion, haptics, triggerPenalty, emitCue, t]);

  const doTakeFromCounter = useCallback((id: IngredientId, index: number) => {
    if (phase !== "playing" || penalty || counterTaken || winnerId || pourPlan || drawnCard) return;
    // Der Index kommt online aus dem LETZTEN Schnappschuss des Gastes. Hat
    // zwischenzeitlich jemand eingegossen, haengt `leftover` an der Theke und
    // der Index zeigt auf eine andere Karte. Deshalb gegen die Kennung pruefen
    // und im Zweifel neu suchen — findet sich die Karte nicht mehr, faellt die
    // Aktion ersatzlos aus, statt die falsche Zutat zu nehmen.
    const at = counter[index] === id ? index : counter.indexOf(id);
    if (at < 0) return;
    void haptics.light();
    setCounter((prev) => prev.filter((_, i) => i !== at));
    setTray((prev) => [...prev, id]);
    setCounterTaken(true);
  }, [phase, penalty, winnerId, pourPlan, drawnCard, counterTaken, counter, haptics]);

  const doPourIn = useCallback(() => {
    if (phase !== "playing" || penalty || tray.length === 0 || !active || winnerId || pourPlan || drawnCard) return;
    const { used, leftover } = splitTray(active.recipe, active.glass, tray);
    const newGlass = sortGlassOrder([...active.glass, ...used]);
    const done = isComplete(active.recipe, newGlass);
    const bonus = bonusForPour(used, leftover);
    const nextBonus = cappedBrewBonus(active.brewBonus ?? 0, bonus.awarded);
    const { score } = scoreFor({ name: active.name, recipe: active.recipe, glass: newGlass, brewBonus: nextBonus });
    const updated = players.map((p, i) =>
      i === activeIdx ? { ...p, glass: newGlass, score, brewBonus: nextBonus } : p
    );
    setPlayers(updated);
    setCounter((prev) => [...prev, ...leftover]);
    setTray([]);
    // Das Tablett bleibt fuer die Sortierphase sichtbar stehen — genau hier
    // liest man ab, WAS ins Glas geht und was auf die Theke.
    setPourFreeze(tray);
    setPourPlan({ pid: active.id, used, leftover });
    setPourSeq((n) => n + 1);
    void haptics.light();
    emitCue("pour");
    if (bonus.perfect) {
      pourTimersRef.current.push(window.setTimeout(() => {
        emitCue("perfect");
        void haptics.success();
      }, reduceMotion ? 140 : POUR_BEATS.depart + POUR_BEATS.flight));
    }
    if (done) {
      // Sieger sofort merken, Ergebnisschirm aber SPAETER: vorher uebernahm
      // `ResultScreen` im selben Augenblick, in dem die letzte Schicht ins Glas
      // lief — den schoensten Moment des Spiels sah dadurch nie jemand.
      // `winnerId` sperrt derweil jede weitere Aktion (siehe die Waechter oben).
      setWinnerId(active.id);
      pourTimersRef.current.push(window.setTimeout(() => {
        emitCue("finish");
        void haptics.celebrate();
      }, reduceMotion ? 220 : pourDuration(used.length, leftover.length, false)));
      finishTimerRef.current = window.setTimeout(
        () => setPhase("gameOver"),
        pourDuration(used.length, leftover.length, !!reduceMotion) + FINISH_HOLD_MS,
      );
    } else {
      // Der Zugwechsel MUSS warten: das grosse Glas gehoert der aktiven Person.
      // Wechselt der Zug sofort, wechselt mitten im Flug das Ziel — die Karten
      // floegen sichtbar ins Glas der naechsten Person.
      pourTimersRef.current.push(window.setTimeout(
        advanceTurn,
        pourDuration(used.length, leftover.length, !!reduceMotion),
      ));
    }
  }, [phase, penalty, winnerId, pourPlan, drawnCard, tray, active, players, activeIdx, advanceTurn, haptics, reduceMotion, emitCue]);

  const confirmPenalty = useCallback(() => {
    setPenalty(null);
    setSipDisclaimer(null);
    advanceTurn();
  }, [advanceTurn]);

  // Karten "im Umlauf" für die Anzeige — Zieh- UND Ablagestapel, denn die
  // Ablage kommt jederzeit per Nachmischen zurück. Der reine Ziehstapel allein
  // würde kurz vor einem Nachmischen fälschlich "fast leer" wirken.
  // Ein Gast kennt die Stapel nicht (siehe remoteDeckCount) — er nimmt die Zahl,
  // die der Gastgeber mitschickt.
  const cardsRemaining = isOnline && !isHost
    ? remoteDeckCount
    : drawPile.length + discardPile.length;

  // =========================================================================
  // Online
  //
  // Host-autoritativ wie OHNE WORTE und NAH DRAN: alle vier Zufallsquellen
  // (dealRecipes, buildDeck, insertBusts, drawCard) laufen ausschliesslich beim
  // Gastgeber. Ein Gast, der `handleStart` lokal aufriefe, wuerfelte eigene
  // Rezepte und einen eigenen Stapel und spielte eine Geisterpartie gegen sich
  // selbst — bei OHNE WORTE faellt das nicht auf, weil ein gemischter Wortstapel
  // gleich aussieht; hier saehe man sofort ein anderes Rezept.
  //
  // `broadcast` sendet ohne `self: true` — der Absender sieht seine eigene
  // Nachricht also NICHT. Genau darauf beruht `act()`: Gastgeber fuehrt direkt
  // aus, Gast schickt und wartet auf den Schnappschuss.
  // =========================================================================
  const act = useCallback(
    (type: string, payload: Record<string, unknown>, run: () => void) => {
      if (isOnline && !isHost) {
        online!.broadcast("brew-action", { type, pid: myId, ...payload });
        return;
      }
      run();
    },
    [isOnline, isHost, online, myId],
  );

  const applyAction = useCallback((data: Record<string, unknown>) => {
    const pid = typeof data.pid === "string" ? data.pid : undefined;
    // Besitzpruefung: alle sehen dieselbe Theke, also koennte sonst jemand
    // ziehen, waehrend ein anderer dran ist — die Karte landete auf dem fremden
    // Tablett. Die `tray.length === 0`-Wache in doPourIn allein reicht nicht.
    const ownsTurn = !!pid && players[activeIdx]?.id === pid;
    switch (data.type) {
      case "start":
        if (phase === "setup") {
          const raw = Array.isArray(data.players) ? (data.players as { id: string; name: string }[]) : [];
          if (raw.length >= 2) handleStart({ players: raw, length: data.length as RecipeLength });
        }
        break;
      case "draw": if (ownsTurn) doDraw(); break;
      case "take": if (ownsTurn) doTakeFromCounter(data.id as IngredientId, Number(data.index)); break;
      case "pour": if (ownsTurn) doPourIn(); break;
      case "penalty": if (ownsTurn && penalty) confirmPenalty(); break;
      case "again": if (phase === "gameOver") playAgainLocal(); break;
      default: break;
    }
  }, [players, activeIdx, phase, penalty, handleStart, doDraw, doTakeFromCounter, doPourIn, confirmPenalty, playAgainLocal]);

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast("brew-action", (d) => applyAction(d));
  }, [online, isHost, applyAction]);

  // Gastgeber spiegelt den Zustand. `drawPile`/`discardPile` sind bewusst NICHT
  // dabei — nur `deckCount`.
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast("brew-state", {
      snapshot: JSON.parse(JSON.stringify({
        phase,
        skin,
        ingredientCount,
        activeIdx,
        counter,
        tray,
        counterTaken,
        deckCount: drawPile.length + discardPile.length,
        penalty,
        penaltySeq,
        bustTrayCount,
        bustSeq,
        pourPlan,
        pourSeq,
        drawnCard,
        audioCue,
        audioCueSeq,
        reshuffleSeq,
        winnerId,
        players: players.map((p) => ({
          id: p.id, name: p.name, color: p.color, score: p.score, brewBonus: p.brewBonus,
          glass: p.glass, recipe: p.recipe,
        })),
      })),
    });
  }, [online, isHost, phase, skin, ingredientCount, activeIdx, counter, tray, counterTaken,
      drawPile, discardPile, penalty, penaltySeq, bustTrayCount, bustSeq, pourPlan, pourSeq,
      drawnCard, audioCue, audioCueSeq, reshuffleSeq, winnerId, players]);

  // Gast uebernimmt den Zustand.
  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast("brew-state", (d) => {
      const s = (d as { snapshot?: Record<string, unknown> }).snapshot;
      if (!s) return;
      setPhase(s.phase as Phase);
      setRoundSkin((s.skin as Skin) ?? null);
      setIngredientCount(s.ingredientCount as RecipeLength);
      setActiveIdx(s.activeIdx as number);
      setCounter((s.counter as IngredientId[]) ?? []);
      setTray((s.tray as IngredientId[]) ?? []);
      setCounterTaken(Boolean(s.counterTaken));
      setRemoteDeckCount((s.deckCount as number) ?? 0);
      setPenalty((s.penalty as Penalty | null) ?? null);
      setPenaltySeq((s.penaltySeq as number) ?? 0);
      setBustTrayCount((s.bustTrayCount as number) ?? 0);
      setBustSeq((s.bustSeq as number) ?? 0);
      setPourPlan((s.pourPlan as PourPlan | null) ?? null);
      setPourSeq((s.pourSeq as number) ?? 0);
      const incomingDraw = (s.drawnCard as DrawnCard | null) ?? null;
      const incomingDrawSeq = incomingDraw?.seq ?? 0;
      if (lastDrawRef.current === null) lastDrawRef.current = incomingDrawSeq;
      else if (incomingDraw && incomingDrawSeq > lastDrawRef.current) {
        lastDrawRef.current = incomingDrawSeq;
        setDrawnCard(incomingDraw);
      }
      const incomingCueSeq = Number(s.audioCueSeq ?? 0);
      if (lastAudioCueRef.current === null) lastAudioCueRef.current = incomingCueSeq;
      else if (incomingCueSeq > lastAudioCueRef.current) lastAudioCueRef.current = incomingCueSeq;
      setReshuffleSeq((s.reshuffleSeq as number) ?? 0);
      setWinnerId((s.winnerId as string | null) ?? null);
      setPlayers(((s.players as PlayerState[]) ?? []).map((p) => ({ ...p, brewBonus: p.brewBonus ?? 0 })));
    });
  }, [online, isHost]);

  // --- Drei Wachposten gegen Nachbeben ------------------------------------
  // Alle drei folgen demselben Muster: beim ERSTEN Schnappschuss wird der Stand
  // nur gemerkt, nicht abgespielt. Ohne das kippt bei einem spaet verbundenen
  // Gast sofort das Tablett, es regnet Strafen aus der Vergangenheit und der
  // Trinkzaehler springt um alles, was er verpasst hat.

  useEffect(() => {
    if (!isOnline || isHost) return;
    if (lastBustRef.current === null) { lastBustRef.current = bustSeq; return; }
    if (bustSeq > lastBustRef.current) {
      lastBustRef.current = bustSeq;
      // Lokaler Zaehler, nicht bustSeq selbst: `useTriggerPulse` (BrewFX) feuert
      // bei jeder Aenderung, und ein doppelt eintreffender Schnappschuss soll
      // genau EINEN Puls ausloesen.
      setBustTrigger((n) => n + 1);
    }
  }, [isOnline, isHost, bustSeq]);

  useEffect(() => {
    if (lastPenaltyRef.current === null) { lastPenaltyRef.current = penaltySeq; return; }
    if (penaltySeq <= lastPenaltyRef.current) return;
    lastPenaltyRef.current = penaltySeq;
    // Nur wer wirklich trinkt, zaehlt — sonst zaehlte JEDES Geraet bei jedem
    // Bust einen Schluck mit, bei acht Spielern also acht.
    if (!isMyTurn || penalty?.kind !== "sip") return;
    setSipDisclaimer(drinkingMode.recordDrink());
  }, [penaltySeq, isMyTurn, penalty, drinkingMode]);

  /**
   * Der Guss laeuft bei ALLEN Geraeten aus dem Zustand, nicht aus dem Klick.
   *
   * Der Gast tippt nie selbst auf "Eingiessen" — bei ihm leert derselbe
   * Schnappschuss das Tablett, der den Guss ankuendigt. Und wie bei `bustSeq`
   * gilt: Beim ERSTEN Schnappschuss wird der Stand nur gemerkt, nicht
   * abgespielt, sonst spielt ein spaet verbundener Gast einen Guss aus der
   * Vergangenheit nach.
   */
  useEffect(() => {
    if (lastPourRef.current === null) { lastPourRef.current = pourSeq; return; }
    if (pourSeq <= lastPourRef.current) return;
    lastPourRef.current = pourSeq;
    // Das Tablett des Gastes ist durch den Schnappschuss schon leer — die
    // eingefrorene Reihe hier nachzureichen ginge nicht, weil er die Karten nie
    // gesehen hat. Er bekommt die Fluege, nicht die Sortierphase.
    const plan = pourPlan;
    if (!plan) return;
    // KEIN clearPourTimers() hier: doPourIn hat den Zugwechsel-Timer soeben
    // gesetzt, und der Wachposten laeuft danach — er wuerde ihn mit loeschen.
    pourTimersRef.current.push(window.setTimeout(
      () => setPourFreeze(null),
      // Ohne Flug traegt allein die Lesepause die Erklaerung — sie waechst
      // deshalb von 300 auf 700 ms, statt einfach zu entfallen.
      reduceMotion ? POUR_BEATS.reducedHold : POUR_BEATS.depart,
    ));
    pourTimersRef.current.push(window.setTimeout(() => {
      setPourPlan(null);
      void haptics.success();
    }, pourDuration(plan.used.length, plan.leftover.length, !!reduceMotion)));
  }, [pourSeq, pourPlan, haptics, reduceMotion]);

  useEffect(() => {
    if (!isOnline || isHost) return;
    if (lastReshuffleRef.current === null) { lastReshuffleRef.current = reshuffleSeq; return; }
    if (reshuffleSeq <= lastReshuffleRef.current) return;
    lastReshuffleRef.current = reshuffleSeq;
    const msg = t("games.brew.reshuffled");
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1600);
  }, [isOnline, isHost, reshuffleSeq, t]);

  // Zutatenbilder des gewaehlten Gewands vorwaermen, sobald die Runde laeuft.
  useEffect(() => { if (phase === "playing") preloadIngredients(skin); }, [phase, skin]);

  /**
   * Was die aktive Person noch braucht — Grundlage der Kartenmarkierung, und
   * wie viele Tablettkarten wirklich ins Glas wandern wuerden.
   *
   * MUSS OBERHALB DER FRUEHEN `return`s STEHEN. Standen sie weiter unten neben
   * dem Rendern, liefen sie im Aufbau- und Ergebnisbildschirm nicht mit — React
   * zaehlte unterschiedlich viele Hooks pro Rendern und warf
   * "Rendered more hooks than during the previous render".
   */
  const activeNeeds = useMemo(
    () => (active ? new Set(missingFor(active.recipe, active.glass)) : new Set<IngredientId>()),
    [active],
  );
  /**
   * Welche Tablettkarte wirklich ins Glas wandert — EINE Quelle, `splitTray`.
   * Damit koennen Markierung, Knopfbeschriftung und das tatsaechliche
   * Eingiessen nie auseinanderlaufen.
   */
  const trayMarks = useMemo(() => {
    if (!active) return [] as boolean[];
    const { used } = splitTray(active.recipe, active.glass, tray);
    const rest = [...used];
    return tray.map((id) => {
      const at = rest.indexOf(id);
      if (at < 0) return false;
      rest.splice(at, 1);
      return true;
    });
  }, [active, tray]);
  const trayHits = trayMarks.filter(Boolean).length;
  const riskTier: BrewRiskTier = riskTierFor(tray.length);
  const chainLevel = chainLevelFor(trayHits);
  const pourPreview = useMemo(() => {
    if (!active) return { multi: false, perfect: false, awarded: 0 };
    const split = splitTray(active.recipe, active.glass, tray);
    return bonusForPour(split.used, split.leftover);
  }, [active, tray]);
  /**
   * Theke: jede Karte fuer sich beurteilen. Man nimmt nur EINE, sie
   * konkurrieren also nicht — anders als auf dem Tablett.
   */
  const counterMarks = useMemo(
    () => counter.map((id) => activeNeeds.has(id)),
    [counter, activeNeeds],
  );

  // --- TV / Party --------------------------------------------------------
  const tvPayload = useMemo(() => ({
    phase,
    skin,
    activeIdx,
    activeName: active?.name ?? "",
    // ADDITIV: Der Fernseher erkannte den aktiven Spieler bisher am NAMEN.
    // Zwei gleichnamige Gaeste bekamen beide den Ring. Die Kennung ist die
    // Wahrheit; `activeName` bleibt fuer die Beschriftung und als Rueckfall.
    activeId: active?.id ?? "",
    winnerId,
    counter,
    tray,
    deckCount: cardsRemaining,
    // Zaehler statt Boolean: ein `lastCardWasBust: true` bliebe im naechsten
    // Payload stehen, der Fernseher haette seine Flanke schon verbraucht und
    // wuerde den NAECHSTEN Bust verschlucken.
    bustSeq,
    bustTrayCount,
    pourSeq,
    pourPlan,
    riskTier,
    trayHits,
    chainLevel,
    bonusPreview: pourPreview.awarded,
    audioCue,
    audioCueSeq,
    drawnCard,
    players: players.map((p) => ({
      id: p.id, name: p.name, color: p.color, score: p.score, brewBonus: p.brewBonus,
      glass: p.glass, recipeId: p.recipe.id, recipeNeeds: p.recipe.needs,
    })),
  }), [phase, skin, activeIdx, active, winnerId, counter, tray, cardsRemaining, bustSeq,
    bustTrayCount, pourSeq, pourPlan, riskTier, trayHits, chainLevel, pourPreview.awarded,
    audioCue, audioCueSeq, drawnCard, players]);

  // Online sendet NUR der Gastgeber an den Fernseher — acht Geraete haetten
  // sonst acht widersprüchliche Stroeme. Das ist ein anderer Kanal als
  // useTVGameBridge darunter; die beiden ueberschneiden sich nicht.
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast("tv-state", { game: "brew", ...tvPayload });
  }, [online, isHost, tvPayload]);

  useTVGameBridge("brew", tvPayload, [phase, activeIdx, tray.length, counter.length, cardsRemaining, audioCueSeq]);

  // =========================================================================
  if (phase === "setup") {
    return (
      <BrewSetup
        // Ein Gast darf NICHT lokal starten (er wuerfelte eigene Rezepte) —
        // act() schickt die Bitte an den Gastgeber und wartet auf dessen Runde.
        onStart={(cfg) => act("start", { players: cfg.players, length: cfg.length }, () => handleStart(cfg))}
        skin={skin}
        onlinePlayers={online?.players}
      />
    );
  }

  if (phase === "gameOver") {
    // Wer sein Rezept zuerst vollhatte, steht oben — auch bei Punktgleichstand.
    // Ohne das entschiede die Sortierstabilitaet statt des echten Siegers.
    const sorted = [...players].sort((a, b) =>
      (b.id === winnerId ? 1 : 0) - (a.id === winnerId ? 1 : 0) || b.score - a.score
    );
    return (
      <ResultScreen
        players={sorted.map((p) => ({ name: p.name, score: p.score, streak: 0 }))}
        gameTitle={skin === "brew" ? t("games.brew.titleBrew") : t("games.brew.titleBar")}
        onPlayAgain={() => act("again", {}, playAgainLocal)}
        onBackToHub={() => navigate("/games")}
        gameId="brew"
      />
    );
  }

  // Online kann ein Gast einen Schnappschuss bekommen, dessen Spielerliste noch
  // leer ist. `return null` waere ein schwarzer Bildschirm ohne Ausweg.
  if (!active) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: theme.bg, color: theme.dim }}>
        <button onClick={() => navigate("/games")} className="flex items-center gap-2 text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> {t("games.brew.backToGames")}
        </button>
      </div>
    );
  }

  const accent = theme.accent;
  const glassProgress = missingFor(me.recipe, me.glass).length;

  /**
   * Eine Zeile, die den Zustand liest.
   *
   * Vorher sperrten drei Bedingungen die Knoepfe kommentarlos, und nichts sagte
   * einem Erstspieler, was der richtige erste Zug ist.
   */
  /** Solange nichts Brauchbares auf dem Tablett liegt, fuehrt "Ziehen". */
  const drawLeads = trayHits === 0;
  const hint = !isMyTurn
    ? t("games.brew.hintWait", { name: active.name })
    : tray.length === 0
      ? (counter.length > 0 && !counterTaken
          ? t("games.brew.hintCounter")
          : t("games.brew.hintDraw"))
      : trayHits > 0
        ? t("games.brew.hintPour", { count: trayHits })
        : t("games.brew.hintNoHit");

  return (
    <div className="min-h-[100dvh] relative" style={{ background: theme.bg, color: theme.text }}>
      <BrewAtmosphere skin={skin} variant="phone" />
      {/* Kopf */}
      <div className="relative z-10 px-4 pt-14 pb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          onClick={() => setConfirmExit(true)}
          className={cn("flex items-center gap-1 text-xs font-bold", hasShellBackButton() && "invisible pointer-events-none")}
          aria-hidden={hasShellBackButton()}
          tabIndex={hasShellBackButton() ? -1 : undefined}
          style={{ color: theme.dim }}
        >
          <ArrowLeft className="w-4 h-4" /> {t("games.brew.leave")}
        </button>
        <div className="text-xs font-bold" style={{ color: theme.dim }}>
          {t("games.brew.turnOf", { name: active.name })}
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="text-xs font-bold" style={{ color: accent }}>
            {t("games.brew.deckCount", { count: cardsRemaining })}
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={t(soundEnabled ? "games.brew.soundOff" : "games.brew.soundOn")}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/20"
            style={{ color: theme.dim }}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mini-Gläser aller Mitspieler:innen */}
      <div className="relative z-10 px-4 flex gap-3 overflow-x-auto pb-2">
        {players.map((p, i) => (
          <div key={p.id} className="flex flex-col items-center shrink-0" style={{ opacity: i === activeIdx ? 1 : 0.55 }}>
            <div
              className="rounded-2xl p-1"
              style={{ border: i === activeIdx ? `2px solid ${p.color}` : "2px solid transparent" }}
            >
              <Glass
                recipeNeeds={p.recipe.needs}
                filled={p.glass}
                skin={skin}
                shape={shapeForRecipe(p.recipe.id, skin)}
                size="sm"
                height={skin === "bar" ? 74 : undefined}
                quality="compact"
                active={i === activeIdx}
                // Dieselbe Verzoegerung wie das grosse Glas — sonst fuellt sich
                // das Miniglas derselben Person 720 ms zu frueh.
                arrivalDelay={pourPlan?.pid === p.id ? POUR_BEATS.depart + POUR_BEATS.flight : 0}
                layerStagger={POUR_BEATS.stagger}
              />
            </div>
            <span className="text-[10px] font-bold mt-1 truncate max-w-[64px]" style={{ color: p.color }}>
              {p.name}
            </span>
          </div>
        ))}
      </div>

      {/* Aktive Person: Rezept + Glas */}
      <motion.div
        className="relative z-10 mt-2 min-h-[430px] overflow-hidden border-y px-4 pb-5 pt-4"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${accent}26 0%, transparent 34%), linear-gradient(180deg, rgba(5,7,16,.22), ${theme.surface} 72%, rgba(3,4,10,.82))`,
          borderColor: `${accent}42`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.1), inset 0 -30px 70px rgba(0,0,0,.24), 0 30px 80px -52px ${accent}`,
        }}
        animate={reduceMotion ? undefined : { boxShadow: chainLevel >= 2
          ? [`inset 0 1px 0 rgba(255,255,255,.08), 0 18px 48px -34px ${accent}`,
             `inset 0 1px 0 rgba(255,255,255,.08), 0 26px 70px -25px ${accent}`,
             `inset 0 1px 0 rgba(255,255,255,.08), 0 18px 48px -34px ${accent}`]
          : `inset 0 1px 0 rgba(255,255,255,.08), 0 24px 60px -42px ${accent}` }}
        transition={{ duration: 1.8, repeat: chainLevel >= 2 ? Infinity : 0, ease: "easeInOut" }}
      >
        <BrewStageFX
          drawnCard={drawnCard}
          pourSeq={pourSeq}
          pouring={!!pourPlan}
          accent={accent}
          danger={theme.bad}
          reduced={!!reduceMotion}
        />
        <div aria-hidden className="absolute inset-0 opacity-60"
          style={{ backgroundImage: `linear-gradient(${accent}0d 1px, transparent 1px), linear-gradient(90deg, ${accent}0d 1px, transparent 1px)`, backgroundSize: "28px 28px", maskImage: "radial-gradient(circle at 50% 44%, black, transparent 72%)" }} />
        <div aria-hidden className="absolute left-1/2 top-[44%] h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ borderColor: `${accent}30`, boxShadow: `inset 0 0 50px ${accent}12, 0 0 70px ${accent}16` }} />
        <motion.div aria-hidden className="absolute left-1/2 top-[44%] h-[238px] w-[238px] rounded-full border border-dashed"
          style={{ x: "-50%", y: "-50%", borderColor: `${accent}65` }}
          animate={reduceMotion ? undefined : { rotate: chainLevel > 0 ? 360 : 90, scale: chainLevel >= 2 ? [1, 1.035, 1] : 1 }}
          transition={{ rotate: { duration: Math.max(7, 15 - chainLevel * 2), repeat: Infinity, ease: "linear" }, scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } }}
        />
        {[0, 1, 2, 3].map((i) => (
          <motion.span key={i} aria-hidden className="absolute left-1/2 top-[44%] h-2 w-2 rounded-full"
            style={{ background: i < chainLevel ? accent : `${accent}48`, boxShadow: `0 0 16px ${accent}`, x: "-50%", y: "-50%" }}
            animate={reduceMotion ? undefined : { x: [Math.cos(i * Math.PI / 2) * 132, Math.cos(i * Math.PI / 2 + Math.PI) * 132, Math.cos(i * Math.PI / 2) * 132], y: [Math.sin(i * Math.PI / 2) * 132, Math.sin(i * Math.PI / 2 + Math.PI) * 132, Math.sin(i * Math.PI / 2) * 132], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 5.5 + i * 0.4, repeat: Infinity, ease: "linear" }} />
        ))}
        <p className="relative text-center text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: accent }}>
          {t("games.brew.yourRecipe")} · {t(recipeKey(me.recipe.id, skin))}
        </p>
        <div className="relative flex flex-col items-center">
          <div ref={glassBoxRef} className="relative z-10 mt-1 inline-flex h-[300px] items-end justify-center">
            <motion.div aria-hidden className="absolute bottom-[2%] left-1/2 h-28 w-56 -translate-x-1/2 rounded-full"
              style={{ background: `radial-gradient(ellipse, ${accent}70, ${accent}18 42%, transparent 72%)` }}
              animate={reduceMotion ? undefined : { opacity: [0.42, 0.95, 0.42], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: Math.max(0.8, 2 - chainLevel * 0.28), repeat: Infinity, ease: "easeInOut" }} />
            <Glass
              recipeNeeds={me.recipe.needs}
              filled={me.glass}
              skin={skin}
              shape={shapeForRecipe(me.recipe.id, skin)}
              bubbles
              width={skin === "brew" ? "clamp(190px, 56vw, 260px)" : undefined}
              height={skin === "bar" ? "clamp(230px, 38dvh, 292px)" : undefined}
              quality="hero"
              active
              intensity={chainLevel}
              arrivalDelay={pourPlan?.pid === me.id ? POUR_BEATS.depart + POUR_BEATS.flight : 0}
              layerStagger={POUR_BEATS.stagger}
            />
          </div>
          <div className="relative z-10 mt-1 flex w-full justify-center gap-1.5 overflow-x-auto pb-1">
            {me.recipe.needs.map((id) => {
              const owned = me.glass.includes(id);
              return (
                <div
                  key={id}
                  title={t(ingredientKey(id, skin))}
                  className={cn(
                    // Gleiche Karte wie auf Tablett und Theke — mit NAMEN.
                    // Vorher: 44-px-Kachel mit 32-px-Motiv, und wenn die Zutat
                    // fehlte, ein gestrichelter Umriss. Der liess den ganzen
                    // Bildschirm wie einen unfertigen Entwurf wirken.
                    "w-[58px] shrink-0 rounded-xl flex flex-col items-center gap-0.5 pt-1.5 pb-1 px-1 transition-opacity",
                    // Fehlende Zutat tritt zurueck — ueber Saettigung, nicht
                    // ueber eine gestrichelte Linie.
                    !owned && "opacity-45 saturate-[0.35]",
                  )}
                  style={ingredientPlate(INGREDIENTS[id].color)}
                >
                  <IngredientIcon id={id} skin={skin} className="h-9 w-9" emojiSize="1.55rem" />
                  <span
                    className="w-full text-[8px] leading-tight font-bold text-center line-clamp-1 break-words"
                    style={{ color: "rgba(255,255,255,0.92)" }}
                  >
                    {t(ingredientKey(id, skin))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {glassProgress > 0 && (
          <p className="text-[11px] mt-2" style={{ color: theme.dim }}>
            {t("games.brew.missingCount", { count: glassProgress })}
          </p>
        )}
        {chainLevel > 0 && (
          <motion.div initial={false} animate={{ opacity: [0, 1], y: [5, 0] }}
            className="mt-3 flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
            style={{ borderColor: `${accent}45`, color: accent, background: `${accent}12` }}>
            <Sparkles className="h-3.5 w-3.5" />
            {t("games.brew.chain", { count: trayHits })}
            {pourPreview.awarded > 0 && <span>· +{pourPreview.awarded}</span>}
          </motion.div>
        )}
      </motion.div>

      {/* Tablett — bewusst als eigener Behaelter mit warnfarbenem Rand.
          Vorher sahen Rezept, Tablett und Theke aus wie dreimal dieselbe
          Kartenreihe, obwohl sie Ziel, Risiko und Angebot bedeuten. */}
      <div className="relative z-10 px-4 mt-4">
        <p className="text-[11px] font-black uppercase tracking-wide mb-2 flex items-center gap-2" style={{ color: theme.dim }}>
          {t("games.brew.trayLabel")}
          <span className="font-bold normal-case tracking-normal" style={{ color: theme.bad }}>
            {t("games.brew.trayNote")}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px]"
            style={{ color: riskTier === "critical" ? theme.bad : accent, background: `${riskTier === "critical" ? theme.bad : accent}12` }}>
            <Flame className="h-3 w-3" /> {t(`games.brew.risk.${riskTier}`)}
          </span>
        </p>
        <div className="relative rounded-2xl p-2" style={{ border: `1px dashed ${theme.bad}55`, background: "rgba(251,113,133,0.04)" }}>
          <TrayCards
            // Waehrend der Sortierphase bleibt die alte Reihe stehen — die
            // Wahrheit ist bereits gewechselt, nur das Bild wartet.
            ids={pourFreeze ?? tray}
            skin={skin}
            marks={pourFreeze && pourPlan
              ? pourFreeze.map((_, i) => i < pourPlan.used.length)
              : trayMarks}
            onGeometry={(r) => { trayGeoRef.current = r; }}
            emptyLabel={t("games.brew.trayEmpty")}
          />
          {/* Bust: das Tablett kippt sichtbar, bevor die Strafe erscheint. */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-4">
            <TrayTip cards={bustTrayCount} trigger={bustTrigger} skin={skin} size={0.7} />
          </div>

        </div>
      </div>

      {/* Theke */}
      <div className="relative z-10 px-4 mt-4">
        <p className="text-[11px] font-black uppercase tracking-wide mb-2 flex items-baseline gap-2" style={{ color: theme.dim }}>
          {skin === "brew" ? t("games.brew.counterLabelBrew") : t("games.brew.counterLabelBar")}
          <span className="font-bold normal-case tracking-normal" style={{ color: theme.dim }}>
            {t("games.brew.counterNote")}
          </span>
        </p>
        <div ref={counterBoxRef} className="min-h-[3.5rem]">
        <TrayCards
          ids={counter}
          skin={skin}
          onTake={(id, index) => act("take", { id, index }, () => doTakeFromCounter(id, index))}
          disabled={counterTaken || !isMyTurn || !!drawnCard || !!pourPlan}
          marks={counterMarks}
          emptyLabel={t("games.brew.counterEmpty")}
        />
        </div>
        {counterTaken && counter.length > 0 && (
          <p className="text-[11px] mt-1" style={{ color: theme.dim }}>{t("games.brew.counterUsed")}</p>
        )}
      </div>

      {/* Aktionen */}
      <div className="sticky bottom-2 z-30 mx-3 mt-5 rounded-3xl border border-white/10 bg-black/55 px-3 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl">
        {/* Sagt, was jetzt dran ist — und warum ein Knopf gesperrt ist. */}
        <p className="text-[12px] mb-2 text-center min-h-[1.2em]" style={{ color: theme.dim }}>{hint}</p>
        <div className="flex gap-2">
          {/*
            Die Rangfolge folgt dem Zustand, nicht der Reihenfolge im Code.
            Vorher war "Eingiessen" als einziger Knopf farbig gefuellt — und zu
            Zugbeginn gesperrt, waehrend "Ziehen", der einzige erlaubte Zug, wie
            ein Nebenknopf aussah. Die Oberflaeche zeigte also am staerksten auf
            das, was man gerade nicht tun kann.
          */}
          <motion.button
            onClick={() => act("draw", {}, doDraw)}
            disabled={cardsRemaining === 0 || !isMyTurn || !!penalty || !!drawnCard || !!pourPlan}
            className="relative flex-1 h-14 rounded-2xl font-black disabled:opacity-40"
            style={
              drawLeads
                ? { background: accent, color: theme.bg }
                : { background: theme.surface, color: theme.text, border: `1px solid ${accent}55` }
            }
            // Der Einsatz wird spuerbar, nicht berechenbar: je voller das
            // Tablett, desto unruhiger der Knopf. Die Kartenzahl steht daneben,
            // die Bewegung traegt also keine Information allein.
            // NUR `scale`. Frueher pulsierte hier zusaetzlich `boxShadow` — eine
            // Farb-Eigenschaft, die der Browser JEDES BILD neu zeichnet, und das
            // in einer Endlosschleife ueber die ganze Partie. Der Hauptthread
            // haengt dadurch sekundenlang: gemessen feuerte ein 60-ms-Zeitgeber
            // nur noch einmal pro Sekunde, und die Eingiess-Choreografie lief
            // gar nicht erst an (die Flugkarte trug bei 520 ms noch
            // `transform: none`). Der Schein liegt jetzt auf einer eigenen
            // Ebene und wird ueber `opacity` geblendet — beides im Compositor.
            animate={
              reduceMotion || tray.length === 0 || !isMyTurn
                ? { scale: 1 }
                : { scale: [1, 1 + Math.min(tray.length, 6) * 0.004, 1] }
            }
            transition={{ duration: Math.max(0.7, 1.8 - tray.length * 0.16), repeat: Infinity, ease: "easeInOut" }}
          >
            {!reduceMotion && tray.length > 0 && isMyTurn && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: `0 0 ${8 + Math.min(tray.length, 6) * 4}px 0 ${accent}` }}
                animate={{ opacity: [0, tray.length > 3 ? 0.4 : 0.2, 0] }}
                transition={{ duration: Math.max(0.7, 1.8 - tray.length * 0.16), repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span className="relative">
              {cardsRemaining === 0 ? t("games.brew.deckEmpty") : t("games.brew.drawFromDeck")}
            </span>
          </motion.button>
          <button
            onClick={() => act("pour", {}, doPourIn)}
            disabled={tray.length === 0 || !isMyTurn || !!drawnCard || !!pourPlan}
            className="relative flex-1 h-14 rounded-2xl font-black disabled:opacity-40"
            style={
              drawLeads
                ? { background: theme.surface, color: theme.text, border: `1px solid ${accent}55` }
                : { background: accent, color: theme.bg }
            }
          >
            {trayHits > 0
              ? t("games.brew.pourInCount", { count: trayHits })
              : t("games.brew.pourIn")}
          </button>
        </div>
      </div>

      {/* Punktestand */}
      <div className="relative z-10 px-4 pb-10 flex flex-wrap gap-2 justify-center">
        {[...players].sort((a, b) => b.score - a.score).map((p) => (
          <div key={p.id} className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: theme.surface, color: p.color }}>
            {p.name} · {p.score}{p.brewBonus > 0 ? ` · ✦${p.brewBonus}` : ""}
          </div>
        ))}
      </div>

      {/* Der Guss liegt BEWUSST hier, als stabiles letztes Kind des
          Spielbildschirms — nicht im Tablett-Block. Dort wechselt `TrayCards`
          waehrend des Gusses zwischen Kartenreihe und Leertext, und ein
          Geschwister, das seine Form aendert, riskiert das Neumounten der
          Nachbarn mitten in der Animation.
          BEWEGUNGSARMUT HEISST EINFACHER, NICHT NICHTS. Hier stand
          `{!reduceMotion && <PourFlight/>}` — und damit fiel bei aktivierter
          Systemeinstellung "Bewegung reduzieren" die GANZE Choreografie aus,
          nicht nur ihre Verzierung. Auf dem iPhone des Nutzers bewegte sich
          dadurch gar nichts. Das verletzt die eigene Regel dieses Spiels: kein
          Effekt traegt allein eine Information — und diese Choreografie IST
          die Erklaerung der wichtigsten Regel. Sie laeuft jetzt immer, nur
          kuerzer und auf gerader Bahn. */}
      <PourFlight
        plan={pourPlan}
        from={trayGeoRef.current}
        glassBox={readGlassBox}
        counterBox={readCounterBox}
        mouthT={glassMouthT(GLASS_SHAPES[shapeForRecipe(me?.recipe.id ?? "", skin)])}
        skin={skin}
        reduced={!!reduceMotion}
      />

      {/* Der Ziehmoment — grosse aufgedeckte Karte in der Bildmitte. */}
      <DrawReveal
        card={drawnCard}
        skin={skin}
        reduced={!!reduceMotion}
        label={drawnCard?.id
          ? t(ingredientKey(drawnCard.id, skin))
          : (skin === "brew" ? t("games.brew.bustTitleBrew") : t("games.brew.bustTitleBar"))}
        verdictLabel={drawnCard?.outcome === "hit"
          ? t("games.brew.drawHit")
          : drawnCard?.outcome === "miss" ? t("games.brew.drawMiss") : undefined}
        onDone={() => setDrawnCard(null)}
      />

      {/*
        Bust / Strafe. Das Portal ist hier funktional: PageTransition setzt
        `transform` und wuerde ein normales fixed-Overlay unter der nativen
        Navigation festhalten. Direkt aushaengen statt AnimatePresence, damit
        "Weiter" die klickfangende Flaeche garantiert im selben Render entfernt.
      */}
      <NativeOverlayPortal>
        {penalty && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:items-center"
            style={{ background: "rgba(11,15,26,0.88)" }}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="brew-penalty-title"
          >
            <motion.div
              className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xs overflow-y-auto overscroll-contain rounded-3xl p-5 text-center"
              style={{ background: theme.surface }}
              initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <button
                type="button"
                onClick={() => setConfirmExit(true)}
                className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border"
                style={{ borderColor: `${theme.dim}66`, color: theme.text, background: `${theme.bg}cc` }}
                aria-label={t("games.brew.leave")}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <p id="brew-penalty-title" className="px-9 text-2xl font-black">
                {skin === "brew" ? t("games.brew.bustTitleBrew") : t("games.brew.bustTitleBar")}
              </p>
              <p className="text-sm mt-1" style={{ color: theme.dim }}>
                {skin === "brew" ? t("games.brew.bustBodyBrew") : t("games.brew.bustBodyBar")}
              </p>

              {penalty.kind === "task" ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wide mt-4" style={{ color: theme.dim }}>
                    {t("games.brew.penaltyIntro")}
                  </p>
                  <p className="font-bold mt-1">{penaltyTasks[penalty.taskIndex] ?? ""}</p>
                </>
              ) : (
                <>
                  <p className="font-bold mt-4">{t("games.brew.sipPenalty")}</p>
                  {sipDisclaimer && (
                    <p className="text-xs mt-2" style={{ color: theme.dim }}>
                      {sipDisclaimer.emoji} {sipDisclaimer.message}
                    </p>
                  )}
                </>
              )}

              {/* Weiter darf nur, wer die Strafe hat — sonst klickt ein Zuschauer
                  den Zug der anderen weg. */}
              {(isMyTurn || isHost) && (
                <button
                  onClick={() => act("penalty", {}, confirmPenalty)}
                  className="mt-5 w-full h-12 rounded-2xl font-black"
                  style={{ background: accent, color: theme.bg }}
                >
                  {t("games.brew.bustContinue")}
                </button>
              )}

              <button
                type="button"
                onClick={() => setConfirmExit(true)}
                className={`${isMyTurn || isHost ? "mt-2" : "mt-5"} h-11 w-full rounded-2xl border font-bold`}
                style={{ borderColor: `${theme.dim}80`, color: theme.text }}
              >
                {t("games.brew.leave")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </NativeOverlayPortal>

      {/* "Wird gemischt" — nur wenn drawCard() den Ablagestapel nachmischen musste. */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl text-sm font-bold"
          style={{ background: theme.surface, color: theme.text }}>
          {toast}
        </div>
      )}

      {/* Verlassen bestätigen */}
      <NativeOverlayPortal>
        {confirmExit && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto px-6 py-4" style={{ background: "rgba(11,15,26,0.85)" }}>
            <div className="w-full max-w-xs rounded-3xl p-5 text-center" style={{ background: theme.surface }}>
              <p className="font-black">{t("games.brew.leaveTitle")}</p>
              <p className="text-xs mt-1" style={{ color: theme.dim }}>{t("games.brew.leaveBody")}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setConfirmExit(false)} className="flex-1 h-11 rounded-2xl font-bold" style={{ background: accent, color: theme.bg }}>
                  {t("games.brew.leaveStay")}
                </button>
                <button onClick={() => { setConfirmExit(false); navigate("/games"); }} className="flex-1 h-11 rounded-2xl font-bold" style={{ border: `1px solid ${theme.dim}`, color: theme.dim }}>
                  {t("games.brew.leaveGo")}
                </button>
              </div>
            </div>
          </div>
        )}
      </NativeOverlayPortal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
function BrewSetup({ onStart, skin, onlinePlayers }: {
  onStart: (cfg: { players: { id: string; name: string }[]; length: RecipeLength }) => void;
  skin: Skin;
  onlinePlayers?: { id: string; name: string }[];
}) {
  const { t } = useTranslation();
  const theme = BREW_PALETTES[skin];
  const navigate = useNavigate();
  // Party-Besetzung übernehmen, statt mit zwei leeren Platzhaltern zu starten.
  const roster = useInitialRoster({ onlinePlayers, min: 2 });

  // Online sind die Namen gesetzt und die IDs muessen die des Raums sein —
  // nur dann trifft `active.id === myPlayerId` und die Zugerkennung greift.
  // Der Raum laesst 12 Leute zu, GEBRAEU spielt sich zu acht: abschneiden.
  const [list, setList] = useState<PlayerSetupPlayer[]>(
    onlinePlayers?.length
      ? onlinePlayers.slice(0, 8).map((p) => ({ id: p.id, name: p.name, readOnly: true }))
      : roster?.map((p) => ({ id: p.id, name: p.name })) ?? [{ id: "p1", name: "" }, { id: "p2", name: "" }],
  );
  const [length, setLength] = useState<RecipeLength>(5);

  const isBrew = skin === "brew";
  const accent = theme.accent;

  const named = list.map((p, i) => ({
    id: p.id,
    name: p.name.trim() || t("games.setup.playerN", { n: i + 1 }),
  }));
  const canStart = named.length >= 2;

  return (
    <div className="min-h-[100dvh] relative" style={{ background: theme.bg, color: theme.text }}>
      <BrewAtmosphere skin={skin} variant="phone" />
      <main className="relative z-10 pt-14 px-5 max-w-2xl mx-auto pb-16">
        <GameSetupBackLink onClick={() => navigate("/games")} className="mb-5" style={{ color: theme.dim }}>
          ← {t("games.brew.backToGames")}
        </GameSetupBackLink>

        <h1 className="text-3xl font-black flex items-center gap-2">
          {isBrew
            ? <FlaskConical className="w-7 h-7" style={{ color: accent }} />
            : <Martini className="w-7 h-7" style={{ color: accent }} />}
          {isBrew ? t("games.brew.titleBrew") : t("games.brew.titleBar")}
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.dim }}>
          {isBrew ? t("games.brew.taglineBrew") : t("games.brew.taglineBar")}
        </p>

        <div className="mt-6">
          <PlayerSetup
            players={list}
            onAdd={() => setList((p) => [...p, { id: `p${Date.now()}`, name: "" }])}
            onRemove={(id) => setList((p) => p.filter((x) => x.id !== id))}
            onRename={(id, name) => setList((p) => p.map((x) => (x.id === id ? { ...x, name } : x)))}
            min={2}
            max={8}
            accent={accent}
            label={t("games.brew.playersLabel")}
            onImportNames={(names) =>
              setList((prev) => {
                const room = Math.max(0, 8 - prev.length);
                const fresh = names.slice(0, room).map((n, i) => ({ id: `ev${Date.now()}-${i}`, name: n }));
                const filled = prev.map((p) => p);
                let take = 0;
                for (let i = 0; i < filled.length && take < fresh.length; i++) {
                  if (!filled[i].name.trim() && !filled[i].readOnly) {
                    filled[i] = { ...filled[i], name: fresh[take].name };
                    take++;
                  }
                }
                return [...filled, ...fresh.slice(take)].slice(0, 8);
              })
            }
          />
        </div>

        <p className="mt-7 mb-2 text-xs font-black uppercase tracking-wide" style={{ color: theme.dim }}>
          {t("games.brew.ingredientCountLabel")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([5, 6, 7] as const).map((n) => (
            <button
              key={n}
              onClick={() => setLength(n)}
              aria-pressed={length === n}
              className="p-3 rounded-2xl text-sm font-black"
              style={{
                background: length === n ? accent : theme.surface,
                color: length === n ? theme.bg : theme.text,
              }}
            >
              {t("games.brew.ingredientCountOption", { count: n })}
            </button>
          ))}
        </div>

        <button
          disabled={!canStart}
          onClick={() => onStart({ players: named, length })}
          className="mt-8 w-full h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: accent, color: theme.bg }}
        >
          {t("games.brew.start")}
        </button>
      </main>
    </div>
  );
}
