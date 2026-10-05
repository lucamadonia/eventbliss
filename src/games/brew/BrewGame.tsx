import { usePausableTasks } from '../bottlespin/pausable-tasks';
import OnlineWaiting from '../multiplayer/OnlineWaiting';
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
import { useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { useDrinkingMode } from "@/hooks/useDrinkingMode";
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useTVContext } from "@/contexts/TVBroadcastContext";
import { useBackGuard } from "@/lib/back-guard";
import { useInitialRoster } from "../ui/useInitialRoster";
import { getPlayerColor } from "../ui/PlayerAvatars";
import { ResultScreen } from "../ui/ResultScreen";
import type { OnlineGameProps } from "../multiplayer/OnlineGameTypes";
import { GLASS_SHAPES, glassMouthT, shapeForRecipe } from "./glass-shapes";
import { BREW_PALETTES } from "./brew-palette";
import { POUR_BEATS, pourDuration } from "./BrewFX";
import { PourFlight, type PourPlan } from "./PourFlight";
import { DrawReveal, drawRevealDuration, type DrawnCard } from "./DrawReveal";
import { BrewAtmosphere } from "./BrewAtmosphere";
import {
  INGREDIENTS,
  preloadIngredients,
  ingredientKey,
  type IngredientId,
  type RecipeLength,
  type Skin,
} from "./brew-content";
import { dealRecipes, buildDeck, insertBusts, drawCard, missingFor, isComplete, splitTray, ownPlayer, type DeckCard, type DealtRecipe } from "./deck";
import { scoreFor } from "./scoring";
import { bonusForPour, cappedBrewBonus, chainLevelFor, riskTierFor, type BrewRiskTier } from "./brew-gameplay";
import { useBrewAudio, type BrewCue } from "./brew-audio";
import { removeBrewPlayers } from "./removal";
import { useRemovedPlayers } from "../multiplayer/useRemovedPlayers";
import { useSyncedPhase } from "../multiplayer/useSyncedPhase";
import { PartyTurnRibbon } from "../ui/PartyTurnRibbon";
import { BrewSetup } from "./BrewSetup";
import { BrewTopBar } from "./BrewTopBar";
import { BrewHeroStage } from "./BrewHeroStage";
import { BrewTrayCounter } from "./BrewTrayCounter";
import { BrewActionBar } from "./BrewActionBar";
import { BrewLeaveDialog, BrewPenaltyOverlay, type Penalty } from "./BrewOverlays";
import { useBrewHandover } from "./useBrewHandover";
import { brewActiveSeat, brewIsMyTurn, brewSenderOwnsTurn, brewTvPlayers, brewViewerId } from "./guest-turns";

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
  const gameTasks = usePausableTasks(online?.isConnected !== false);
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
  const [withTray, setWithTray] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [turnToken, setTurnToken] = useState('');
  const consumedActions = useRef(new Set<string>());
  // Alle Geraete + TV wechseln Phase UND Zug im selben Moment; Eingaben erst nach dem Takt (Design §9).
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, turnToken]);
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
    if (finishTimerRef.current) gameTasks.clearTimeout(finishTimerRef.current);
    pourTimersRef.current.forEach((id) => gameTasks.clearTimeout(id));
  }, []);

  const penaltyTasks = useMemo(() => {
    const raw = t("games.brew.penaltyTasks", { returnObjects: true });
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const active = players[activeIdx] as PlayerState | undefined;
  /** Offline immer wahr — online nur, wenn dieses Geraet tatsaechlich dran ist. */
  // 🔁-Gaeste spielen ihren Zug am Host-Handy, nach der Weitergabe (guest-turns.ts).
  const handover = useBrewHandover(online, brewActiveSeat(phase, players, activeIdx), phase === "gameOver");
  const isMyTurn = brewIsMyTurn(isOnline, active?.id, myId, handover.activeGuest);
  /**
   * Wessen Rezept unter "Dein Rezept" steht.
   *
   * Offline wandert das Telefon, "ich" bin also immer der aktive Spieler.
   * ONLINE NICHT: dort sass hier frueher ebenfalls `active`, und damit sah
   * JEDER Gast das Rezept der aktiven Person, ueberschrieben mit "Dein
   * Rezept" — der Bezugspunkt des ganzen Bildschirms war falsch.
   */
  const me = ownPlayer(players, isOnline ? brewViewerId(myId, handover.activeGuest) : null, active) ?? active;
  const roster = useInitialRoster({ onlinePlayers: online?.players }) ?? [];

  // Zurück abfangen: der native Zurück-Button liegt über dem Pfeil im Kopf.
  useBackGuard(() => {
    if (phase === "setup" || phase === "gameOver") return false;
    if (confirmExit) { setConfirmExit(false); return true; }
    setConfirmExit(true);
    return true;
  });

  // --- Rundenstart -----------------------------------------------------
  const handleStart = useCallback((cfg: { players: { id: string; name: string }[]; length: RecipeLength; withTray: boolean }) => {
    gameTasks.clear();
    pourTimersRef.current = [];
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
    setWithTray(cfg.withTray);
    // buildDeck mischt bereits — insertBusts verteilt die Bust-Karten gezielt
    // gleichmäßig hinein, ein erneutes Mischen würde das wieder zunichtemachen.
    setDrawPile(insertBusts(buildDeck(recipes)));
    setDiscardPile([]);
    setCounter([]);
    setTray([]);
    setActiveIdx(0);
    setTurnToken(crypto.randomUUID());
    consumedActions.current.clear();
    setCounterTaken(false);
    setPenalty(null);
    setWinnerId(null);
    // Ein noch laufender Sieges-Timer wuerde die frische Runde sofort wieder
    // auf den Ergebnisschirm werfen.
    if (finishTimerRef.current) { gameTasks.clearTimeout(finishTimerRef.current); finishTimerRef.current = null; }
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
  }, [localSkin, gameTasks]);

  const playAgainLocal = useCallback(() => {
    // Online nur, wer noch im Raum ist — Gekickte bekommen kein neues Rezept.
    const stay = online ? players.filter((p) => online.players.some((o) => o.id === p.id)) : players;
    if (stay.length === 0) return;
    handleStart({ players: stay.map((p) => ({ id: p.id, name: p.name })), length: ingredientCount, withTray });
  }, [online, players, ingredientCount, withTray, handleStart]);

  // --- Zug -------------------------------------------------------------
  // Ueber eine Ref: ein verzoegerter Zugwechsel (nach dem Guss) darf nicht mit
  // der Spielerzahl von damals rechnen, falls inzwischen jemand entfernt wurde.
  const playerCountRef = useRef(0);
  playerCountRef.current = players.length;
  const advanceTurn = useCallback(() => {
    setTurnToken(crypto.randomUUID());
    consumedActions.current.clear();
    setActiveIdx((i) => (playerCountRef.current ? (i + 1) % playerCountRef.current : 0));
    setCounterTaken(false);
  }, []);

  // Laeuft nur beim Gastgeber. `recordDrink()` steht hier bewusst NICHT — das
  // macht jedes Geraet fuer sich, siehe den Effekt weiter unten.
  const triggerPenalty = useCallback(() => {
    // Die Bust-Karte bleibt bis hier als Aktionssperre im Zustand. Ohne das
    // gab es zwischen Reveal-Ende und Sperrstunde ein kurzes Zeitfenster, in
    // dem bereits die naechste Zutat gezogen werden konnte und dann vor dem
    // Strafdialog liegen blieb.
    setDrawnCard(null);
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
      gameTasks.setTimeout(() => emitCue("bust"), reduceMotion ? 80 : 330);
      gameTasks.setTimeout(triggerPenalty, drawRevealDuration(true, !!reduceMotion) + (reduceMotion ? 0 : 700));
    } else {
      void haptics.light();
      setDrawPile(nextDraw);
      setDiscardPile(nextDiscard);
      const directSplit = active ? splitTray(active.recipe, active.glass, [card.id]) : { used: [], leftover: [card.id] };
      const beforeHits = active ? splitTray(active.recipe, active.glass, tray).used.length : 0;
      const afterHits = active ? splitTray(active.recipe, active.glass, [...tray, card.id]).used.length : beforeHits;
      const hit = withTray ? afterHits > beforeHits : directSplit.used.length > 0;
      const drawSeq = Date.now();
      setDrawnCard({ id: card.id, seq: drawSeq, outcome: hit ? "hit" : "miss" });
      // Der Gastgeber kann waehrend eines Gastzugs den Uebergabe-Bildschirm
      // sehen. Dann ist DrawReveal nicht gemountet und sein onDone feuert nie.
      gameTasks.setTimeout(() => setDrawnCard((cur) => cur?.seq === drawSeq ? null : cur), drawRevealDuration(false, !!reduceMotion));
      gameTasks.setTimeout(() => {
        emitCue(hit ? "hit" : "miss");
        if (hit) void haptics.medium();
      }, reduceMotion ? 80 : 360);
      if (withTray) {
        setTray((prev) => [...prev, card.id]);
      } else if (active) {
        // Ohne Reserve ist jede Karte unmittelbar sicher oder geht offen auf
        // die Theke. Der Zug laeuft weiter, bis jemand stoppt oder ein Bust kommt.
        const newGlass = sortGlassOrder([...active.glass, ...directSplit.used]);
        const { score } = scoreFor({ name: active.name, recipe: active.recipe, glass: newGlass, brewBonus: active.brewBonus });
        setPlayers((prev) => prev.map((p, i) => i === activeIdx ? { ...p, glass: newGlass, score } : p));
        if (directSplit.leftover.length) setCounter((prev) => [...prev, ...directSplit.leftover]);
        if (isComplete(active.recipe, newGlass)) {
          setWinnerId(active.id);
          finishTimerRef.current = gameTasks.setTimeout(() => {
            emitCue("finish");
            void haptics.celebrate();
            setPhase("gameOver");
          }, drawRevealDuration(false, !!reduceMotion) + FINISH_HOLD_MS);
        }
      }
    }

    if (reshuffled) {
      const msg = t("games.brew.reshuffled");
      setToast(msg);
      gameTasks.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1600);
      setReshuffleSeq((n) => n + 1);
    }
  }, [phase, penalty, winnerId, pourPlan, drawnCard, drawPile, discardPile, tray, active, activeIdx, withTray, reduceMotion, haptics, triggerPenalty, emitCue, t]);

  const doTakeFromCounter = useCallback((id: IngredientId, index: number) => {
    if (phase !== "playing" || penalty || counterTaken || winnerId || pourPlan || drawnCard) return;
    // Der Index kommt online aus dem LETZTEN Schnappschuss des Gastes. Hat
    // zwischenzeitlich jemand eingegossen, haengt `leftover` an der Theke und
    // der Index zeigt auf eine andere Karte. Deshalb gegen die Kennung pruefen
    // und im Zweifel neu suchen — findet sich die Karte nicht mehr, faellt die
    // Aktion ersatzlos aus, statt die falsche Zutat zu nehmen.
    const at = counter[index] === id ? index : counter.indexOf(id);
    if (at < 0) return;
    if (!withTray && active && splitTray(active.recipe, active.glass, [id]).used.length === 0) return;
    void haptics.light();
    setCounter((prev) => prev.filter((_, i) => i !== at));
    if (withTray) {
      setTray((prev) => [...prev, id]);
    } else if (active) {
      const { used } = splitTray(active.recipe, active.glass, [id]);
      const newGlass = sortGlassOrder([...active.glass, ...used]);
      const { score } = scoreFor({ name: active.name, recipe: active.recipe, glass: newGlass, brewBonus: active.brewBonus });
      setPlayers((prev) => prev.map((p, i) => i === activeIdx ? { ...p, glass: newGlass, score } : p));
      if (isComplete(active.recipe, newGlass)) {
        setWinnerId(active.id);
        finishTimerRef.current = gameTasks.setTimeout(() => {
          emitCue("finish");
          void haptics.celebrate();
          setPhase("gameOver");
        }, FINISH_HOLD_MS);
      }
    }
    setCounterTaken(true);
  }, [phase, penalty, winnerId, pourPlan, drawnCard, counterTaken, counter, withTray, active, activeIdx, gameTasks, emitCue, haptics]);

  const doEndTurn = useCallback(() => {
    if (withTray || phase !== "playing" || penalty || winnerId || drawnCard || pourPlan) return;
    advanceTurn();
  }, [withTray, phase, penalty, winnerId, drawnCard, pourPlan, advanceTurn]);

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
      pourTimersRef.current.push(gameTasks.setTimeout(() => {
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
      pourTimersRef.current.push(gameTasks.setTimeout(() => {
        emitCue("finish");
        void haptics.celebrate();
      }, reduceMotion ? 220 : pourDuration(used.length, leftover.length, false)));
      finishTimerRef.current = gameTasks.setTimeout(
        () => setPhase("gameOver"),
        pourDuration(used.length, leftover.length, !!reduceMotion) + FINISH_HOLD_MS,
      );
    } else {
      // Der Zugwechsel MUSS warten: das grosse Glas gehoert der aktiven Person.
      // Wechselt der Zug sofort, wechselt mitten im Flug das Ziel — die Karten
      // floegen sichtbar ins Glas der naechsten Person.
      pourTimersRef.current.push(gameTasks.setTimeout(
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
        online!.broadcast("brew-action", { type, pid: myId, ...payload, turnToken, actionId: crypto.randomUUID() });
        return;
      }
      run();
    },
    [isOnline, isHost, online, myId, turnToken],
  );

  const applyAction = useCallback((data: Record<string, unknown>) => {
    if (online?.isConnected === false || data.turnToken !== turnToken || typeof data.actionId !== 'string' || consumedActions.current.has(data.actionId)) return;
    consumedActions.current.add(data.actionId);
    const pid = typeof data.__senderId === "string" ? data.__senderId : undefined;
    // Besitzpruefung: alle sehen dieselbe Theke, also koennte sonst jemand
    // ziehen, waehrend ein anderer dran ist — die Karte landete auf dem fremden
    // Tablett. Die `tray.length === 0`-Wache in doPourIn allein reicht nicht.
    // Ein 🔁-Gast handelt ueber das Geraet, das seinen Platz spielt (controlledBy).
    const ownsTurn = brewSenderOwnsTurn(players[activeIdx]?.id, pid, online?.players ?? []);
    switch (data.type) {
      case "start":
        if (phase === "setup" && pid === online?.myPlayerId) {
          const raw = Array.isArray(data.players) ? (data.players as { id: string; name: string }[]) : [];
          if (raw.length >= 2) handleStart({ players: raw, length: data.length as RecipeLength, withTray: data.withTray !== false });
        }
        break;
      case "draw": if (ownsTurn) doDraw(); break;
      case "take": if (ownsTurn) doTakeFromCounter(data.id as IngredientId, Number(data.index)); break;
      case "pour": if (ownsTurn) doPourIn(); break;
      case "end": if (ownsTurn) doEndTurn(); break;
      case "penalty": if (ownsTurn && penalty) confirmPenalty(); break;
      case "again": if (phase === "gameOver" && players.some(p => p.id === pid)) playAgainLocal(); break;
      default: break;
    }
  }, [online, players, activeIdx, phase, penalty, turnToken, handleStart, doDraw, doTakeFromCounter, doPourIn, doEndTurn, confirmPenalty, playAgainLocal]);

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast("brew-action", (d) => applyAction(d));
  }, [online, isHost, applyAction]);

  // Gastgeber: Gekickte/Gegangene verlassen die Runde (Logik in removal.ts).
  // War die Person dran, enden ihre offenen Eingaben und Timer, und der Zug
  // geht sofort weiter. Der Schnappschuss unten verteilt das an alle.
  useRemovedPlayers(online, (ids) => {
    if (phase !== "playing") return;
    const r = removeBrewPlayers({ players, activeIdx, tray, discardPile, winnerId }, ids, online?.players.map((p) => p.id));
    if (!r) return;
    if (r.activeRemoved) {
      gameTasks.clear();
      pourTimersRef.current = [];
      setPenalty(null);
      setSipDisclaimer(null);
      setDrawnCard(null);
      setPourPlan(null);
      setPourFreeze(null);
      setToast(null);
      setCounterTaken(false);
      setTurnToken(crypto.randomUUID());
      consumedActions.current.clear();
    }
    setPlayers(r.players);
    setActiveIdx(r.activeIdx);
    setTray(r.tray);
    setDiscardPile(r.discardPile);
  });

  // Gastgeber spiegelt den Zustand. `drawPile`/`discardPile` sind bewusst NICHT
  // dabei — nur `deckCount`.
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast("brew-state", {
      snapshot: JSON.parse(JSON.stringify({
        phase,
        phaseStartsAt,
        skin,
        ingredientCount,
        withTray,
        activeIdx,
        turnToken,
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
  }, [online, isHost, phase, phaseStartsAt, skin, ingredientCount, withTray, activeIdx, turnToken, counter, tray, counterTaken,
      drawPile, discardPile, penalty, penaltySeq, bustTrayCount, bustSeq, pourPlan, pourSeq,
      drawnCard, audioCue, audioCueSeq, reshuffleSeq, winnerId, players]);

  // Gast uebernimmt den Zustand.
  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast("brew-state", (d) => {
      const s = (d as { snapshot?: Record<string, unknown> }).snapshot;
      if (!s) return;
      setPhase(s.phase as Phase);
      receivePhaseStart(s.phaseStartsAt);
      setRoundSkin((s.skin as Skin) ?? null);
      setIngredientCount(s.ingredientCount as RecipeLength);
      setWithTray(s.withTray !== false);
      setActiveIdx(s.activeIdx as number);
      setTurnToken(s.turnToken as string);
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
  }, [online, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

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
    pourTimersRef.current.push(gameTasks.setTimeout(
      () => setPourFreeze(null),
      // Ohne Flug traegt allein die Lesepause die Erklaerung — sie waechst
      // deshalb von 300 auf 700 ms, statt einfach zu entfallen.
      reduceMotion ? POUR_BEATS.reducedHold : POUR_BEATS.depart,
    ));
    pourTimersRef.current.push(gameTasks.setTimeout(() => {
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
    gameTasks.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1600);
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
  const tvHandoverKey = JSON.stringify(handover.tv);
  const tvPayload = useMemo(() => ({
    phase,
    phaseStartsAt,
    // Oeffentlich: „Max spielt am Host-Handy“ + Fortschritt — nie Stapel oder Karte.
    handover: handover.tv,
    skin,
    withTray,
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
    players: brewTvPlayers(players.map((p) => ({
      id: p.id, name: p.name, color: p.color, score: p.score, brewBonus: p.brewBonus,
      glass: p.glass, recipeId: p.recipe.id, recipeNeeds: p.recipe.needs,
    })), roster),
  }), [phase, phaseStartsAt, tvHandoverKey, roster.length, skin, withTray, activeIdx, active, winnerId, counter, tray, cardsRemaining, bustSeq,
    bustTrayCount, pourSeq, pourPlan, riskTier, trayHits, chainLevel, pourPreview.awarded,
    audioCue, audioCueSeq, drawnCard, players]);

  // Ein einziger Host-Pfad fuer Offline- und Online-TV. Die Bruecke kennt den
  // aktiven Raum bereits ueber GamesHub; ein zusaetzlicher direkter Broadcast
  // lieferte denselben Zustand zweimal an den Fernseher.
  useTVGameBridge("brew", tvPayload, [tvPayload], !online || isHost);

  // =========================================================================
  if (view === "setup" && online && !isHost) return <OnlineWaiting />;
  if (view === "setup") {
    return (
      <BrewSetup
        // Ein Gast darf NICHT lokal starten (er wuerfelte eigene Rezepte) —
        // act() schickt die Bitte an den Gastgeber und wartet auf dessen Runde.
        onStart={(cfg) => act("start", { players: cfg.players, length: cfg.length, withTray: cfg.withTray }, () => handleStart(cfg))}
        skin={skin}
        onlinePlayers={online?.players}
      />
    );
  }

  // Handy unterwegs zu einem Gast: nur der deckende Weitergabe-Bildschirm.
  if (handover.overlay) return handover.overlay;

  if (view === "gameOver") {
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
  const activeSeat = roster.find((p) => p.id === active.id);
  const glassProgress = missingFor(me.recipe, me.glass).length;

  /**
   * Eine Zeile, die den Zustand liest.
   *
   * Vorher sperrten drei Bedingungen die Knoepfe kommentarlos, und nichts sagte
   * einem Erstspieler, was der richtige erste Zug ist.
   */
  /** Solange nichts Brauchbares auf dem Tablett liegt, fuehrt "Ziehen". */
  const drawLeads = !withTray || trayHits === 0;
  const hint = !isMyTurn
    ? t("games.brew.hintWait", { name: active.name })
    : tray.length === 0
      ? (counter.length > 0 && !counterTaken
          ? t("games.brew.hintCounter")
          : t(withTray ? "games.brew.hintDraw" : "games.brew.directDrawHint"))
      : trayHits > 0
        ? t("games.brew.hintPour", { count: trayHits })
        : t("games.brew.hintNoHit");

  return (
    <div className="min-h-[100dvh] relative" data-testid="brew-playing" data-with-tray={String(withTray)}
      data-tray-count={tray.length} data-counter-count={counter.length} data-glass-count={active.glass.length}
      data-active-id={active.id} style={{ background: theme.bg, color: theme.text }}>
      <BrewAtmosphere skin={skin} variant="phone" />{blocker}
      <BrewTopBar onLeave={() => setConfirmExit(true)} onToggleSound={() => setSoundEnabled(!soundEnabled)} soundEnabled={soundEnabled}
        theme={theme} accent={accent} activeName={active.name} cardsRemaining={cardsRemaining} players={players} activeIdx={activeIdx} skin={skin} pourPlan={pourPlan} />
      {isOnline && (
        <div className="relative z-10 px-4 pt-1 pb-2">
          <PartyTurnRibbon player={{ id: active.id, name: active.name, avatar: activeSeat?.avatar, color: activeSeat?.color ?? active.color }}
            kind={isMyTurn ? "me" : "other"}
            line={isMyTurn ? undefined : t("games.brew.partyWatch", "Schau mit – was nicht ins Glas passt, landet auf der Theke.")} />
        </div>
      )}
      <BrewHeroStage me={me} skin={skin} theme={theme} accent={accent} reduceMotion={!!reduceMotion} chainLevel={chainLevel} trayHits={trayHits}
        pourAwarded={pourPreview.awarded} glassProgress={glassProgress} drawnCard={drawnCard} pourSeq={pourSeq} pourPlan={pourPlan} glassBoxRef={glassBoxRef} />

      <BrewTrayCounter skin={skin} theme={theme} accent={accent} riskTier={riskTier} withTray={withTray} tray={tray} pourFreeze={pourFreeze} pourPlan={pourPlan}
        trayMarks={trayMarks} onTrayGeometry={(r) => { trayGeoRef.current = r; }} bustTrayCount={bustTrayCount} bustTrigger={bustTrigger}
        counter={counter} counterMarks={counterMarks} counterTaken={counterTaken} counterBoxRef={counterBoxRef}
        onTake={(id, index) => act("take", { id, index }, () => doTakeFromCounter(id, index))} isMyTurn={isMyTurn} drawnCard={drawnCard} />

      <BrewActionBar hint={hint} theme={theme} accent={accent} drawLeads={drawLeads} withTray={withTray} cardsRemaining={cardsRemaining} isMyTurn={isMyTurn}
        hasPenalty={!!penalty} blocked={!!drawnCard || !!pourPlan} trayCount={tray.length} trayHits={trayHits} reduceMotion={!!reduceMotion}
        onDraw={() => act("draw", {}, doDraw)} onPour={() => act(withTray ? "pour" : "end", {}, withTray ? doPourIn : doEndTurn)} />

      {/* Punktestand */}
      <div className="relative z-10 px-4 pb-10 flex flex-wrap gap-2 justify-center">
        {[...players].sort((a, b) => b.score - a.score).map((p) => (
          <div key={p.id} className="px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: theme.surface, color: '#fff', boxShadow: `inset 0 0 0 1px ${p.color}99` }}>
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
        onDone={() => {
          if (drawnCard?.outcome !== "bust") setDrawnCard(null);
        }}
      />

      {/*
        Bust / Strafe. Das Portal ist hier funktional: PageTransition setzt
        `transform` und wuerde ein normales fixed-Overlay unter der nativen
        Navigation festhalten. Direkt aushaengen statt AnimatePresence, damit
        "Weiter" die klickfangende Flaeche garantiert im selben Render entfernt.
      */}
      <BrewPenaltyOverlay penalty={penalty} visible={isMyTurn || isHost} skin={skin} withTray={withTray} theme={theme} accent={accent} reduceMotion={!!reduceMotion}
        penaltyTasks={penaltyTasks} sipDisclaimer={sipDisclaimer} onContinue={() => act("penalty", {}, confirmPenalty)} onLeave={() => setConfirmExit(true)} />

      {/* "Wird gemischt" — nur wenn drawCard() den Ablagestapel nachmischen musste. */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl text-sm font-bold"
          style={{ background: theme.surface, color: theme.text }}>
          {toast}
        </div>
      )}

      {/* Verlassen bestätigen */}
      <BrewLeaveDialog open={confirmExit} theme={theme} accent={accent} onStay={() => setConfirmExit(false)}
        onLeave={() => { setConfirmExit(false); navigate("/games"); }} />
    </div>
  );
}
