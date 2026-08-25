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
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FlaskConical, Martini, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useDrinkingMode } from "@/hooks/useDrinkingMode";
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useBackGuard } from "@/lib/back-guard";
import { PlayerSetup, type PlayerSetupPlayer } from "../ui/PlayerSetup";
import { useInitialRoster } from "../ui/useInitialRoster";
import { getPlayerColor } from "../ui/PlayerAvatars";
import { GameSetupBackLink } from "../ui/GameSetupBackLink";
import { hasShellBackButton } from "../ui/shell-back";
import { ResultScreen } from "../ui/ResultScreen";
import type { OnlineGameProps } from "../multiplayer/OnlineGameTypes";
import { Glass } from "./Glass";
import { TrayCards } from "./TrayCards";
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
import { dealRecipes, buildDeck, insertBusts, drawCard, missingFor, isComplete, type DeckCard, type DealtRecipe } from "./deck";
import { scoreFor } from "./scoring";

const THEME = {
  bg: "#0B0F1A",
  elevated: "#141B2E",
  surface: "#1B2440",
  text: "#F1F5F9",
  dim: "#94A3B8",
  bad: "#FB7185",
} as const;

// Zwei Akzentfarben statt einer — das Gewand soll sich auch in der
// Bedienoberfläche anfühlen, nicht nur in Emoji und Text.
const ACCENT: Record<Skin, string> = { brew: "#8B5CF6", bar: "#F59E0B" };

type Phase = "setup" | "playing" | "gameOver";

interface PlayerState {
  id: string;
  name: string;
  color: string;
  recipe: DealtRecipe;
  /** Gesicherte Zutaten, Basis zuerst — für immer sicher, das nimmt der Bust nicht mehr. */
  glass: IngredientId[];
  score: number;
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

  // --- Online: gespiegelter Zustand --------------------------------------
  // Das Gewand bestimmt der Gastgeber fuer die ganze Runde. Ohne das spielte er
  // "Cocktail mit Schluck", waehrend ein Gast "Zaubertrank mit Aufgabe" saehe —
  // zwei Strafarten am selben Tisch. BEWUSST IN KAUF GENOMMEN: ein Geraet ohne
  // freigeschaltetes 18+-Easter-Egg bekommt dann Alkohol-Texte zu sehen.
  const [roundSkin, setRoundSkin] = useState<Skin | null>(null);
  const skin: Skin = roundSkin ?? localSkin;
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

  const penaltyTasks = useMemo(() => {
    const raw = t("games.brew.penaltyTasks", { returnObjects: true });
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const active = players[activeIdx] as PlayerState | undefined;
  /** Offline immer wahr — online nur, wenn dieses Geraet tatsaechlich dran ist. */
  const isMyTurn = !isOnline || (!!myId && active?.id === myId);

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
    // Das Gewand des Gastgebers gilt ab jetzt fuer alle.
    setRoundSkin(localSkin);
    // Zaehler und Wachposten zuruecksetzen, sonst blockiert ein alter Stand die
    // erste Bust-Animation der neuen Runde.
    setBustSeq(0);
    setPenaltySeq(0);
    setReshuffleSeq(0);
    lastBustRef.current = null;
    lastPenaltyRef.current = null;
    lastReshuffleRef.current = null;
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
    if (phase !== "playing" || penalty) return;
    const result = drawCard(drawPile, discardPile);
    // Laut Regeln darf das nie vorkommen (jede Zutat steckt immer irgendwo),
    // aber `drawCard` ist eine reine Funktion und wirft dafür nicht — also
    // hier defensiv abfangen statt blind auf eine Karte zu vertrauen.
    if (!result) return;
    const { card, drawPile: nextDraw, discardPile: nextDiscard, reshuffled } = result;

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
      window.setTimeout(triggerPenalty, reduceMotion ? 0 : 700);
    } else {
      void haptics.light();
      setDrawPile(nextDraw);
      setDiscardPile(nextDiscard);
      setTray((prev) => [...prev, card.id]);
    }

    if (reshuffled) {
      const msg = t("games.brew.reshuffled");
      setToast(msg);
      window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1600);
      setReshuffleSeq((n) => n + 1);
    }
  }, [phase, penalty, drawPile, discardPile, tray, reduceMotion, haptics, triggerPenalty, t]);

  const doTakeFromCounter = useCallback((id: IngredientId, index: number) => {
    if (phase !== "playing" || penalty || counterTaken) return;
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
  }, [phase, penalty, counterTaken, counter, haptics]);

  const doPourIn = useCallback(() => {
    if (phase !== "playing" || penalty || tray.length === 0 || !active) return;
    const needed = new Set(missingFor(active.recipe, active.glass));
    const used: IngredientId[] = [];
    const leftover: IngredientId[] = [];
    for (const id of tray) {
      if (needed.has(id)) { used.push(id); needed.delete(id); }
      else leftover.push(id);
    }
    const newGlass = sortGlassOrder([...active.glass, ...used]);
    const done = isComplete(active.recipe, newGlass);
    const { score } = scoreFor({ name: active.name, recipe: active.recipe, glass: newGlass });
    const updated = players.map((p, i) =>
      i === activeIdx ? { ...p, glass: newGlass, score } : p
    );
    setPlayers(updated);
    setCounter((prev) => [...prev, ...leftover]);
    setTray([]);
    void haptics.success();
    if (done) {
      setWinnerId(active.id);
      setPhase("gameOver");
    } else {
      advanceTurn();
    }
  }, [phase, penalty, tray, active, players, activeIdx, advanceTurn, haptics]);

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
        reshuffleSeq,
        winnerId,
        players: players.map((p) => ({
          id: p.id, name: p.name, color: p.color, score: p.score,
          glass: p.glass, recipe: p.recipe,
        })),
      })),
    });
  }, [online, isHost, phase, skin, ingredientCount, activeIdx, counter, tray, counterTaken,
      drawPile, discardPile, penalty, penaltySeq, bustTrayCount, bustSeq, reshuffleSeq, winnerId, players]);

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
      setReshuffleSeq((s.reshuffleSeq as number) ?? 0);
      setWinnerId((s.winnerId as string | null) ?? null);
      setPlayers((s.players as PlayerState[]) ?? []);
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

  // --- TV / Party --------------------------------------------------------
  const tvPayload = useMemo(() => ({
    phase,
    skin,
    activeIdx,
    activeName: active?.name ?? "",
    winnerId,
    counter,
    tray,
    deckCount: cardsRemaining,
    // Zaehler statt Boolean: ein `lastCardWasBust: true` bliebe im naechsten
    // Payload stehen, der Fernseher haette seine Flanke schon verbraucht und
    // wuerde den NAECHSTEN Bust verschlucken.
    bustSeq,
    bustTrayCount,
    players: players.map((p) => ({
      id: p.id, name: p.name, color: p.color, score: p.score,
      glass: p.glass, recipeId: p.recipe.id, recipeNeeds: p.recipe.needs,
    })),
  }), [phase, skin, activeIdx, active, winnerId, counter, tray, cardsRemaining, bustSeq, bustTrayCount, players]);

  // Online sendet NUR der Gastgeber an den Fernseher — acht Geraete haetten
  // sonst acht widersprüchliche Stroeme. Das ist ein anderer Kanal als
  // useTVGameBridge darunter; die beiden ueberschneiden sich nicht.
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast("tv-state", { game: "brew", ...tvPayload });
  }, [online, isHost, tvPayload]);

  useTVGameBridge("brew", tvPayload, [phase, activeIdx, tray.length, counter.length, cardsRemaining]);

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
      <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: THEME.bg, color: THEME.dim }}>
        <button onClick={() => navigate("/games")} className="flex items-center gap-2 text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> {t("games.brew.backToGames")}
        </button>
      </div>
    );
  }

  const accent = ACCENT[skin];
  const glassProgress = missingFor(active.recipe, active.glass).length;

  return (
    <div className="min-h-[100dvh] relative" style={{ background: THEME.bg, color: THEME.text }}>
      <BrewAtmosphere skin={skin} variant="phone" />
      {/* Kopf */}
      <div className="relative z-10 px-4 pt-14 pb-3 flex items-center justify-between">
        <button
          onClick={() => setConfirmExit(true)}
          className={cn("flex items-center gap-1 text-xs font-bold", hasShellBackButton() && "invisible pointer-events-none")}
          aria-hidden={hasShellBackButton()}
          tabIndex={hasShellBackButton() ? -1 : undefined}
          style={{ color: THEME.dim }}
        >
          <ArrowLeft className="w-4 h-4" /> {t("games.brew.leave")}
        </button>
        <div className="text-xs font-bold" style={{ color: THEME.dim }}>
          {t("games.brew.turnOf", { name: active.name })}
        </div>
        <div className="text-xs font-bold" style={{ color: accent }}>
          {t("games.brew.deckCount", { count: cardsRemaining })}
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
              <Glass recipeNeeds={p.recipe.needs} filled={p.glass} skin={skin} size="sm" />
            </div>
            <span className="text-[10px] font-bold mt-1 truncate max-w-[64px]" style={{ color: p.color }}>
              {p.name}
            </span>
          </div>
        ))}
      </div>

      {/* Aktive Person: Rezept + Glas */}
      <div className="relative z-10 px-4 mt-3 rounded-3xl p-4" style={{ background: THEME.elevated }}>
        <p className="text-[11px] font-black uppercase tracking-wide mb-2" style={{ color: THEME.dim }}>
          {t("games.brew.yourRecipe")} · {t(recipeKey(active.recipe.id, skin))}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2 flex-1">
            {active.recipe.needs.map((id) => {
              const owned = active.glass.includes(id);
              return (
                <div
                  key={id}
                  title={t(ingredientKey(id, skin))}
                  className={cn("w-11 h-11 rounded-2xl flex items-center justify-center text-xl border transition-opacity", !owned && "opacity-35 grayscale")}
                  style={{ background: THEME.surface, borderColor: owned ? INGREDIENTS[id].color : "transparent" }}
                >
                  {/* opacity-35 grayscale am Elternteil wirkt ueber CSS auch auf
                      das <img> — "fehlende Zutat ist ausgegraut" bleibt also. */}
                  <IngredientIcon id={id} skin={skin} className="w-8 h-8" emojiSize="1.25rem" />
                </div>
              );
            })}
          </div>
          <Glass recipeNeeds={active.recipe.needs} filled={active.glass} skin={skin} size="md" />
        </div>
        {glassProgress > 0 && (
          <p className="text-[11px] mt-2" style={{ color: THEME.dim }}>
            {t("games.brew.missingCount", { count: glassProgress })}
          </p>
        )}
      </div>

      {/* Tablett */}
      <div className="relative z-10 px-4 mt-4">
        <p className="text-[11px] font-black uppercase tracking-wide mb-2" style={{ color: THEME.dim }}>
          {t("games.brew.trayLabel")}
        </p>
        <div className="relative">
          <TrayCards ids={tray} skin={skin} emptyLabel={t("games.brew.trayEmpty")} />
          {/* Bust: das Tablett kippt sichtbar, bevor die Strafe erscheint. */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-4">
            <TrayTip cards={bustTrayCount} trigger={bustTrigger} skin={skin} size={0.7} />
          </div>
        </div>
      </div>

      {/* Theke */}
      <div className="relative z-10 px-4 mt-4">
        <p className="text-[11px] font-black uppercase tracking-wide mb-2" style={{ color: THEME.dim }}>
          {t("games.brew.counterLabel")}
        </p>
        <TrayCards
          ids={counter}
          skin={skin}
          onTake={(id, index) => act("take", { id, index }, () => doTakeFromCounter(id, index))}
          disabled={counterTaken || !isMyTurn}
          emptyLabel={t("games.brew.counterEmpty")}
        />
        {counterTaken && counter.length > 0 && (
          <p className="text-[11px] mt-1" style={{ color: THEME.dim }}>{t("games.brew.counterUsed")}</p>
        )}
      </div>

      {/* Aktionen */}
      <div className="relative z-10 px-4 mt-5 pb-10 flex gap-2">
        <button
          onClick={() => act("draw", {}, doDraw)}
          disabled={cardsRemaining === 0 || !isMyTurn || !!penalty}
          className="flex-1 h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: THEME.surface, color: THEME.text, border: `1px solid ${accent}55` }}
        >
          {cardsRemaining === 0 ? t("games.brew.deckEmpty") : t("games.brew.drawFromDeck")}
        </button>
        <button
          onClick={() => act("pour", {}, doPourIn)}
          disabled={tray.length === 0 || !isMyTurn}
          className="flex-1 h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: accent, color: THEME.bg }}
        >
          {t("games.brew.pourIn")}
        </button>
      </div>

      {/* Punktestand */}
      <div className="relative z-10 px-4 pb-10 flex flex-wrap gap-2 justify-center">
        {[...players].sort((a, b) => b.score - a.score).map((p) => (
          <div key={p.id} className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: THEME.surface, color: p.color }}>
            {p.name} · {p.score}
          </div>
        ))}
      </div>

      {/* Bust / Strafe */}
      <AnimatePresence>
        {penalty && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(11,15,26,0.88)" }}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xs rounded-3xl p-6 text-center"
              style={{ background: THEME.surface }}
              initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <p className="text-2xl font-black">
                {skin === "brew" ? t("games.brew.bustTitleBrew") : t("games.brew.bustTitleBar")}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.dim }}>
                {skin === "brew" ? t("games.brew.bustBodyBrew") : t("games.brew.bustBodyBar")}
              </p>

              {penalty.kind === "task" ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wide mt-4" style={{ color: THEME.dim }}>
                    {t("games.brew.penaltyIntro")}
                  </p>
                  <p className="font-bold mt-1">{penaltyTasks[penalty.taskIndex] ?? ""}</p>
                </>
              ) : (
                <>
                  <p className="font-bold mt-4">{t("games.brew.sipPenalty")}</p>
                  {sipDisclaimer && (
                    <p className="text-xs mt-2" style={{ color: THEME.dim }}>
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
                  style={{ background: accent, color: THEME.bg }}
                >
                  {t("games.brew.bustContinue")}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Wird gemischt" — nur wenn drawCard() den Ablagestapel nachmischen musste. */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl text-sm font-bold"
          style={{ background: THEME.surface, color: THEME.text }}>
          {toast}
        </div>
      )}

      {/* Verlassen bestätigen */}
      {confirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(11,15,26,0.85)" }}>
          <div className="w-full max-w-xs rounded-3xl p-5 text-center" style={{ background: THEME.surface }}>
            <p className="font-black">{t("games.brew.leaveTitle")}</p>
            <p className="text-xs mt-1" style={{ color: THEME.dim }}>{t("games.brew.leaveBody")}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmExit(false)} className="flex-1 h-11 rounded-2xl font-bold" style={{ background: accent, color: THEME.bg }}>
                {t("games.brew.leaveStay")}
              </button>
              <button onClick={() => { setConfirmExit(false); navigate("/games"); }} className="flex-1 h-11 rounded-2xl font-bold" style={{ border: `1px solid ${THEME.dim}`, color: THEME.dim }}>
                {t("games.brew.leaveGo")}
              </button>
            </div>
          </div>
        </div>
      )}
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
  const accent = ACCENT[skin];

  const named = list.map((p, i) => ({
    id: p.id,
    name: p.name.trim() || t("games.setup.playerN", { n: i + 1 }),
  }));
  const canStart = named.length >= 2;

  return (
    <div className="min-h-[100dvh] relative" style={{ background: THEME.bg, color: THEME.text }}>
      <BrewAtmosphere skin={skin} variant="phone" />
      <main className="relative z-10 pt-14 px-5 max-w-2xl mx-auto pb-16">
        <GameSetupBackLink onClick={() => navigate("/games")} className="mb-5" style={{ color: THEME.dim }}>
          ← {t("games.brew.backToGames")}
        </GameSetupBackLink>

        <h1 className="text-3xl font-black flex items-center gap-2">
          {isBrew
            ? <FlaskConical className="w-7 h-7" style={{ color: accent }} />
            : <Martini className="w-7 h-7" style={{ color: accent }} />}
          {isBrew ? t("games.brew.titleBrew") : t("games.brew.titleBar")}
        </h1>
        <p className="text-sm mt-1" style={{ color: THEME.dim }}>
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

        <p className="mt-7 mb-2 text-xs font-black uppercase tracking-wide" style={{ color: THEME.dim }}>
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
                background: length === n ? accent : THEME.surface,
                color: length === n ? THEME.bg : THEME.text,
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
          style={{ background: accent, color: THEME.bg }}
        >
          {t("games.brew.start")}
        </button>
      </main>
    </div>
  );
}
