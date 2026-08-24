/**
 * PIXELJAGD — Verpixel-Ratespiel.
 *
 * Ein Motiv startet in groben Blöcken und wird pro Sekunde schärfer. Wer zuerst
 * richtig rät, bekommt die aktuell stehende Punktzahl (100 → 10); eine falsche
 * Antwort kostet Punkte und sperrt den Spieler für die laufende Runde.
 *
 * Läuft in drei Konstellationen — ein Handy, Online-Room, TV-Mode. Muster
 * durchgehend von OhrwurmGame übernommen: `act()` als einziger Eingabepfad,
 * Host besitzt die Wahrheit, Clients spiegeln.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Zap, Trophy, ChevronRight, X, Check } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useGameTimer } from '../engine/TimerSystem';
import { PlayerSetup, type PlayerSetupPlayer } from '../ui/PlayerSetup';
import { getPlayerColor } from '../ui/PlayerAvatars';
import { ResultScreen } from '../ui/ResultScreen';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import { useBackGuard } from '@/lib/back-guard';
import { GameSetupBackLink } from '../ui/GameSetupBackLink';
import { hasShellBackButton } from '../ui/shell-back';
import { saveSnapshot, loadSnapshot, clearSnapshot } from '../ui/useGameSnapshot';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { PixelCanvas } from './PixelCanvas';
import { stepsFor, pointsAt, FINAL_STEP } from './pixelate';
import { isCorrectAnswer } from './answer-match';
import {
  getPixelPuzzles,
  PIXEL_CATEGORIES,
  categoryLabelKey,
  type PixelCategory,
  type PixelPuzzle,
} from './pixeljagd-content';
import { loadExtraPuzzles } from './pixeljagd-extra';
import { useInitialRoster } from '@/games/ui/useInitialRoster';

// Design-Tokens — eigene Farbwelt, gleiche Struktur wie OW in OhrwurmGame.
const PJ = {
  primary: '#38BDF8',
  secondary: '#A78BFA',
  accent: '#FDE047',
  bg: '#0B1120',
  elevated: '#111C33',
  surface: '#16233F',
  text: '#F1F5F9',
  dim: '#94A3B8',
  bad: '#FB7185',
} as const;

type Phase = 'setup' | 'playing' | 'roundEnd' | 'gameOver';
type AnswerMode = 'buzzer' | 'text';
type ModeId = 'klassisch' | 'blitz' | 'profi';

interface ModeDef { id: ModeId; duration: number; startPx: number; penalty: number; }
const MODES: ModeDef[] = [
  { id: 'klassisch', duration: 30, startPx: 8,  penalty: 25 },
  { id: 'blitz',     duration: 15, startPx: 10, penalty: 15 },
  { id: 'profi',     duration: 45, startPx: 6,  penalty: 40 },
];

interface Player { id: string; name: string; color: string; score: number; locked: boolean; }

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function PixeljagdGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const isOnline = !!online;
  const isHost = !online || online.isHost;
  const myId = online?.myPlayerId ?? null;

  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<ModeId>('klassisch');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('buzzer');
  const [categories, setCategories] = useState<PixelCategory[]>([]);
  const [totalRounds, setTotalRounds] = useState(8);
  const [round, setRound] = useState(0);
  const [deck, setDeck] = useState<PixelPuzzle[]>([]);
  const [puzzle, setPuzzle] = useState<PixelPuzzle | null>(null);
  const [buzzedBy, setBuzzedBy] = useState<string | null>(null);
  // Die Loesung bleibt bis zum bewussten Aufdecken verdeckt — sonst koennte die
  // Gruppe nicht urteilen, ohne die Antwort vorher zu verraten.
  const [solutionShown, setSolutionShown] = useState(false);
  const [frozenPoints, setFrozenPoints] = useState<number | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [guess, setGuess] = useState('');
  const [contentReady, setContentReady] = useState(false);
  // Steht das Motiv schon auf der Zeichenflaeche? Die Runde darf erst dann
  // loslaufen — sonst tickt die Uhr gegen ein Bild, das noch niemand sieht.
  const [imageReady, setImageReady] = useState(false);

  const modeDef = useMemo(() => MODES.find((m) => m.id === mode) ?? MODES[0], [mode]);
  const steps = useMemo(() => stepsFor(modeDef.startPx, modeDef.duration), [modeDef]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }, []);

  // Admin-gepflegte Motive nachladen.
  useEffect(() => {
    void loadExtraPuzzles().finally(() => setContentReady(true));
  }, []);

  // --- Runde ---------------------------------------------------------------
  const handleTimeout = useCallback(() => {
    if (isOnline && !isHost) return;
    void haptics.warning();
    setBuzzedBy(null);
    setFrozenPoints(null);
    setWinnerId(null);
    setPhase('roundEnd');
  }, [isOnline, isHost, haptics]);

  const roundTimer = useGameTimer(modeDef.duration, handleTimeout);
  const roundTimerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);
  roundTimerRef.current = roundTimer;

  const elapsed = Math.max(0, modeDef.duration - roundTimer.timeLeft);
  // In der Auflösung immer scharf zeigen.
  const step = phase === 'roundEnd'
    ? FINAL_STEP
    : (steps[Math.min(elapsed, steps.length - 1)] ?? FINAL_STEP);
  const livePoints = frozenPoints ?? pointsAt(elapsed, modeDef.duration);

  const beginRound = useCallback((d: PixelPuzzle[], idx: number, ps: Player[]) => {
    const next = d[idx];
    setPuzzle(next ?? null);
    setRound(idx);
    setBuzzedBy(null);
    setFrozenPoints(null);
    setWinnerId(null);
    setGuess('');
    setPlayers(ps.map((p) => ({ ...p, locked: false })));
    roundTimerRef.current?.reset(modeDef.duration);
    setImageReady(false);
    setPhase('playing');
    // Kein start() hier: das uebernimmt der Effekt, sobald PixelCanvas
    // meldet, dass das Motiv geladen und gezeichnet ist.
  }, [modeDef.duration]);

  // --- Eingaben ------------------------------------------------------------
  const act = useCallback((type: string, payload: Record<string, unknown>, run: () => void) => {
    if (isOnline && !isHost) { online!.broadcast('pixeljagd-action', { type, ...payload }); return; }
    run();
  }, [isOnline, isHost, online]);

  const doBuzz = useCallback((pid: string) => {
    if (buzzedBy || phase !== 'playing') return;
    const p = players.find((x) => x.id === pid);
    if (!p || p.locked) return;
    void haptics.medium();
    // Uhr UND Punktezähler einfrieren — sonst verliert der Spieler Punkte,
    // während er die Antwort ausspricht.
    setFrozenPoints(pointsAt(elapsed, modeDef.duration));
    roundTimerRef.current?.pause();
    setBuzzedBy(pid);
  }, [buzzedBy, phase, players, haptics, elapsed, modeDef.duration]);

  const award = useCallback((pid: string, pts: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === pid ? { ...p, score: p.score + pts } : p)));
    setWinnerId(pid);
    roundTimerRef.current?.pause();
    void haptics.success();
    setPhase('roundEnd');
  }, [haptics]);

  const penalize = useCallback((pid: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === pid ? { ...p, score: p.score - modeDef.penalty, locked: true } : p)));
    setBuzzedBy(null);
    setFrozenPoints(null);
    void haptics.error();
    flash(t('games.pixeljagd.wrongToast', { points: modeDef.penalty }));
    // Enthüllung läuft weiter — die anderen sind noch im Rennen.
    const remaining = players.filter((p) => p.id !== pid && !p.locked);
    if (remaining.length === 0) { setPhase('roundEnd'); return; }
    roundTimerRef.current?.start();
  }, [modeDef.penalty, haptics, flash, t, players]);

  useEffect(() => { setSolutionShown(false); }, [buzzedBy, round]);

  const doJudge = useCallback((correct: boolean) => {
    if (!buzzedBy) return;
    if (correct) award(buzzedBy, frozenPoints ?? 10);
    else penalize(buzzedBy);
  }, [buzzedBy, frozenPoints, award, penalize]);

  const doTextGuess = useCallback((pid: string, text: string) => {
    if (phase !== 'playing' || !puzzle) return;
    const p = players.find((x) => x.id === pid);
    if (!p || p.locked) return;
    if (isCorrectAnswer(text, puzzle.answer, puzzle.aliases)) {
      award(pid, pointsAt(elapsed, modeDef.duration));
    } else {
      penalize(pid);
    }
  }, [phase, puzzle, players, award, penalize, elapsed, modeDef.duration]);

  const nextRound = useCallback(() => {
    const nextIdx = round + 1;
    if (nextIdx >= totalRounds || nextIdx >= deck.length) {
      roundTimerRef.current?.pause();
      setPhase('gameOver');
      return;
    }
    beginRound(deck, nextIdx, players);
  }, [round, totalRounds, deck, players, beginRound]);

  // Host wendet Client-Aktionen an.
  const applyAction = useCallback((data: Record<string, unknown>) => {
    switch (data.type) {
      case 'buzz': doBuzz(data.pid as string); break;
      case 'judge': doJudge(data.correct as boolean); break;
      case 'text': doTextGuess(data.pid as string, data.text as string); break;
      case 'next': nextRound(); break;
      default: break;
    }
  }, [doBuzz, doJudge, doTextGuess, nextRound]);

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast('pixeljagd-action', (d) => applyAction(d));
  }, [online, isHost, applyAction]);

  // Host → Snapshot. Ohne timeLeft (sonst 60 Nachrichten pro Runde).
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('pixeljagd-state', {
      snapshot: JSON.parse(JSON.stringify({
        phase, players, round, totalRounds, puzzle, buzzedBy, frozenPoints, winnerId,
        mode, answerMode, categories, deck,
      })),
    });
  }, [online, isHost, phase, players, round, totalRounds, puzzle, buzzedBy, frozenPoints, winnerId, mode, answerMode, categories, deck]);

  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast('pixeljagd-state', (d) => {
      const s = (d as { snapshot?: Record<string, unknown> }).snapshot;
      if (!s) return;
      setPhase(s.phase as Phase);
      setPlayers(s.players as Player[]);
      setRound(s.round as number);
      setTotalRounds(s.totalRounds as number);
      setPuzzle(s.puzzle as PixelPuzzle | null);
      setBuzzedBy(s.buzzedBy as string | null);
      setFrozenPoints(s.frozenPoints as number | null);
      setWinnerId(s.winnerId as string | null);
      setMode(s.mode as ModeId);
      setAnswerMode(s.answerMode as AnswerMode);
      setCategories(s.categories as PixelCategory[]);
      setDeck(s.deck as PixelPuzzle[]);
    });
  }, [online, isHost]);

  /**
   * Startschuss der Runde: erst wenn das Motiv steht.
   *
   * Vorher lief die Uhr 50 ms nach dem Rundenwechsel los, egal wie lange das
   * Bild noch brauchte. Beim ERSTEN Motiv ist das ein kalter Netzzugriff und
   * dauert mehrere Sekunden — die Enthuellung war da schon halb durch,
   * waehrend die Flaeche noch leer war. Ab dem zweiten Bild fiel es nicht
   * mehr auf, weil Verbindung und Zwischenspeicher warm sind.
   */
  useEffect(() => {
    if (isOnline && !isHost) return;
    if (phase !== 'playing' || !imageReady || buzzedBy) return;
    roundTimerRef.current?.start();
  }, [isOnline, isHost, phase, imageReady, buzzedBy]);

  /**
   * Das naechste Motiv im Voraus holen.
   *
   * Kostet nichts Sichtbares und nimmt der naechsten Runde genau die
   * Wartezeit, die oben abgefangen wird.
   */
  useEffect(() => {
    const next = deck[round + 1];
    if (!next?.image) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = next.image;
  }, [deck, round]);

  // Nicht-Host spiegelt die Uhr über EINEN Boolean (Muster aus OhrwurmGame).
  useEffect(() => {
    if (!isOnline || isHost) return;
    if (phase === 'playing' && !buzzedBy && imageReady) {
      roundTimerRef.current?.start();
    } else {
      roundTimerRef.current?.pause();
    }
  }, [isOnline, isHost, phase, buzzedBy, imageReady]);

  // TV: gleiche Nutzlast offline wie online. Die Antwort erst in der Auflösung.
  const tvPayload = useMemo(() => ({
    phase,
    players: players.map((p) => ({ id: p.id, name: p.name, color: p.color, score: p.score, locked: p.locked })),
    round: round + 1,
    totalRounds,
    image: puzzle?.image ?? '',
    step,
    timeLeft: roundTimer.timeLeft,
    totalTime: modeDef.duration,
    points: livePoints,
    buzzedName: players.find((p) => p.id === buzzedBy)?.name ?? null,
    reveal: phase === 'roundEnd' && puzzle
      ? { answer: puzzle.answer, credit: puzzle.credit, winner: players.find((p) => p.id === winnerId)?.name ?? null }
      : null,
  }), [phase, players, round, totalRounds, puzzle, step, roundTimer.timeLeft, modeDef.duration, livePoints, buzzedBy, winnerId]);

  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('tv-state', { game: 'pixeljagd', ...tvPayload });
  }, [online, isHost, tvPayload]);

  useTVGameBridge('pixeljagd', tvPayload, [phase, round, step, roundTimer.timeLeft, buzzedBy, winnerId]);

  // --- Persistenz (offline) ------------------------------------------------
  const restoredRef = useRef(false);
  useEffect(() => {
    if (isOnline || restoredRef.current) return;
    restoredRef.current = true;
    const s = loadSnapshot<Record<string, unknown>>('pixeljagd');
    if (s && s.phase && s.phase !== 'setup' && s.phase !== 'gameOver') {
      setPhase(s.phase as Phase);
      setPlayers(s.players as Player[]);
      setRound(s.round as number);
      setTotalRounds(s.totalRounds as number);
      setPuzzle(s.puzzle as PixelPuzzle | null);
      setMode(s.mode as ModeId);
      setAnswerMode(s.answerMode as AnswerMode);
      setCategories(s.categories as PixelCategory[]);
      setDeck(s.deck as PixelPuzzle[]);
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) return;
    if (phase === 'setup' || phase === 'gameOver') { clearSnapshot('pixeljagd'); return; }
    if (!restoredRef.current) return;
    saveSnapshot('pixeljagd', { phase, players, round, totalRounds, puzzle, mode, answerMode, categories, deck });
  }, [isOnline, phase, players, round, totalRounds, puzzle, mode, answerMode, categories, deck]);

  // Zurück abfangen (der native Button liegt über allem).
  useBackGuard(() => {
    if (phase === 'setup') return false;
    if (confirmExit) { setConfirmExit(false); return true; }
    setConfirmExit(true);
    return true;
  });

  // --- Start ---------------------------------------------------------------
  const handleStart = useCallback((cfg: {
    players: { id: string; name: string }[];
    mode: ModeId; answerMode: AnswerMode; categories: PixelCategory[]; rounds: number;
  }) => {
    const pool = shuffle(getPixelPuzzles(cfg.categories.length ? cfg.categories : undefined));
    if (pool.length === 0) { flash(t('games.pixeljagd.noImages')); return; }
    const ps: Player[] = cfg.players.map((p, i) => ({
      id: p.id, name: p.name, color: getPlayerColor(i), score: 0, locked: false,
    }));
    setMode(cfg.mode);
    setAnswerMode(cfg.answerMode);
    setCategories(cfg.categories);
    setTotalRounds(Math.min(cfg.rounds, pool.length));
    setDeck(pool);
    restoredRef.current = true;
    beginRound(pool, 0, ps);
  }, [beginRound, flash, t]);

  // =========================================================================
  if (phase === 'setup') {
    return (
      <PixeljagdSetup
        onStart={handleStart}
        onlinePlayers={online?.players}
        contentReady={contentReady}
        allowText={isOnline}
        toast={toast}
      />
    );
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (phase === 'gameOver') {
    return (
      <ResultScreen
        players={sorted.map((p) => ({ name: p.name, score: p.score, streak: 0 }))}
        gameTitle={t('games.pixeljagd.title')}
        onPlayAgain={() => handleStart({
          players: players.map((p) => ({ id: p.id, name: p.name })),
          mode, answerMode, categories, rounds: totalRounds,
        })}
        onBackToHub={() => { clearSnapshot('pixeljagd'); navigate('/games'); }}
        totalRounds={totalRounds}
        gameId="pixeljagd"
      />
    );
  }

  const meLocked = !!(myId && players.find((p) => p.id === myId)?.locked);

  return (
    <div className="min-h-[100dvh] relative" style={{ background: PJ.bg, color: PJ.text }}>
      {/* Kopf: Runde + Punkte */}
      <div className="relative z-10 px-4 pt-14 pb-3 flex items-center justify-between">
        {/* In der App löst der FloatingBackButton über den Back-Guard denselben
            Dialog aus — dort nur unsichtbar schalten, nicht entfernen, damit
            Runde und Punkte in der Kopfzeile stehen bleiben, wo sie waren. */}
        <button
          onClick={() => setConfirmExit(true)}
          className={`text-xs font-bold${hasShellBackButton() ? ' invisible pointer-events-none' : ''}`}
          aria-hidden={hasShellBackButton()}
          tabIndex={hasShellBackButton() ? -1 : undefined}
          style={{ color: PJ.dim }}
        >
          ← {t('games.pixeljagd.leave')}
        </button>
        <div className="text-xs font-bold" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.roundOf', { round: round + 1, total: totalRounds })}
        </div>
        <div className="flex items-center gap-1 text-sm font-black" style={{ color: PJ.accent }}>
          <Zap className="w-4 h-4" /> {livePoints}
        </div>
      </div>

      {/* Bild */}
      <div className="relative z-10 px-4">
        <div className="rounded-3xl overflow-hidden" style={{ background: PJ.elevated, border: `1px solid ${PJ.surface}` }}>
          {puzzle ? (
            <div className="relative">
              <PixelCanvas
                src={puzzle.image}
                step={step}
                className="w-full h-auto block"
                onError={() => { flash(t('games.pixeljagd.imageFailed')); nextRound(); }}
                onReady={() => setImageReady(true)}
              />
              {!imageReady && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: PJ.elevated }}>
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: PJ.primary, borderTopColor: 'transparent' }} />
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] flex items-center justify-center text-sm" style={{ color: PJ.dim }}>
              {t('games.pixeljagd.noImages')}
            </div>
          )}
        </div>
        {/* Fortschritt */}
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: PJ.surface }}>
          <div
            className="h-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${(elapsed / modeDef.duration) * 100}%`, background: PJ.primary }}
          />
        </div>
      </div>

      {/* Auflösung */}
      <AnimatePresence mode="wait">
        {phase === 'roundEnd' && puzzle && (
          <motion.div key="reveal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 px-4 mt-4">
            <div className="rounded-3xl p-5 text-center" style={{ background: PJ.surface }}>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: PJ.dim }}>
                {t('games.pixeljagd.solution')}
              </p>
              <p className="text-2xl font-black mt-1">{puzzle.answer}</p>
              {winnerId ? (
                <p className="text-sm mt-2" style={{ color: PJ.primary }}>
                  <Trophy className="w-4 h-4 inline mr-1" />
                  {t('games.pixeljagd.roundWinner', { name: players.find((p) => p.id === winnerId)?.name ?? '' })}
                </p>
              ) : (
                <p className="text-sm mt-2" style={{ color: PJ.dim }}>{t('games.pixeljagd.nobody')}</p>
              )}
              {/* Bildnachweis — immer sichtbar, sobald das Motiv aufgedeckt ist. */}
              <p className="text-[11px] mt-3 leading-snug" style={{ color: PJ.dim }}>
                {t('games.pixeljagd.credit')}:{' '}
                {puzzle.sourceUrl ? (
                  <a href={puzzle.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    {puzzle.credit}
                  </a>
                ) : puzzle.credit}
                {/* Aenderungshinweis ist Lizenzpflicht, nicht Hoeflichkeit:
                    CC-BY verlangt, Bearbeitungen kenntlich zu machen — und die
                    Verpixelung IST eine Bearbeitung. Ohne diesen Zusatz nutzen
                    wir die Bilder ausserhalb ihrer Lizenz. */}
                {' · '}{t('games.pixeljagd.modified')}
              </p>
              <button onClick={() => act('next', {}, nextRound)}
                className="mt-4 w-full h-12 rounded-2xl font-black flex items-center justify-center gap-2"
                style={{ background: PJ.primary, color: PJ.bg }}>
                {t('games.pixeljagd.next')} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eingabe */}
      {phase === 'playing' && (
        <div className="relative z-10 px-4 mt-4 pb-8">
          {buzzedBy ? (
            <div className="rounded-3xl p-5 text-center" style={{ background: PJ.surface }}>
              <p className="text-sm font-bold">
                {t('games.pixeljagd.buzzedSay', { name: players.find((p) => p.id === buzzedBy)?.name ?? '' })}
              </p>
              {/* Zweistufig, und das ist der Kern des Spiels:
                  Wer gebuzzert hat, sagt die Antwort LAUT. Erst danach deckt
                  die Gruppe die Loesung auf und vergleicht.
                  Vorher standen hier sofort "Falsch"/"Richtig" — die Gruppe
                  sollte also etwas beurteilen, das sie selbst nicht wusste.
                  Das war unspielbar. */}
              {!solutionShown ? (
                <>
                  <p className="text-[11px] mt-1" style={{ color: PJ.dim }}>
                    {t('games.pixeljagd.sayThenReveal')}
                  </p>
                  <button
                    onClick={() => setSolutionShown(true)}
                    className="w-full h-12 rounded-2xl font-black mt-4 cursor-pointer transition-colors"
                    style={{ background: PJ.accent, color: PJ.bg }}>
                    {t('games.pixeljagd.revealSolution')}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[11px] mt-3" style={{ color: PJ.dim }}>
                    {t('games.pixeljagd.solution')}
                  </p>
                  <p className="text-xl font-black mt-1" style={{ color: PJ.accent }}>
                    {puzzle?.answer}
                  </p>
                  <p className="text-[11px] mt-2" style={{ color: PJ.dim }}>
                    {t('games.pixeljagd.groupDecides')}
                  </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => act('judge', { correct: false }, () => doJudge(false))}
                  className="flex-1 h-12 rounded-2xl font-black flex items-center justify-center gap-1"
                  style={{ background: PJ.bad, color: PJ.bg }}>
                  <X className="w-4 h-4" /> {t('games.pixeljagd.wrong')}
                </button>
                <button onClick={() => act('judge', { correct: true }, () => doJudge(true))}
                  className="flex-1 h-12 rounded-2xl font-black flex items-center justify-center gap-1"
                  style={{ background: PJ.primary, color: PJ.bg }}>
                  <Check className="w-4 h-4" /> {t('games.pixeljagd.correct')}
                </button>
              </div>
                </>
              )}
            </div>
          ) : answerMode === 'text' && isOnline ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (myId && guess.trim()) {
                  const text = guess;
                  act('text', { pid: myId, text }, () => doTextGuess(myId, text));
                  setGuess('');
                }
              }}
              className="flex gap-2"
            >
              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                disabled={meLocked}
                placeholder={meLocked ? t('games.pixeljagd.lockedOut') : t('games.pixeljagd.typeGuess')}
                className="flex-1 h-12 px-4 rounded-2xl text-sm outline-none"
                style={{ background: PJ.surface, color: PJ.text }}
              />
              <button type="submit" disabled={meLocked || !guess.trim()}
                className="px-5 h-12 rounded-2xl font-black disabled:opacity-40"
                style={{ background: PJ.primary, color: PJ.bg }}>
                {t('games.pixeljagd.send')}
              </button>
            </form>
          ) : (
            <>
              <p className="text-center text-[11px] mb-2" style={{ color: PJ.dim }}>
                {t('games.pixeljagd.buzzHint')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => act('buzz', { pid: p.id }, () => doBuzz(p.id))}
                    disabled={p.locked || (isOnline && myId !== p.id)}
                    className="h-16 rounded-2xl font-black text-sm disabled:opacity-35"
                    style={{ background: p.locked ? PJ.surface : p.color, color: p.locked ? PJ.dim : PJ.bg }}
                  >
                    {p.name}
                    <span className="block text-[11px] font-bold opacity-80">{p.score}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Punktestand */}
      <div className="relative z-10 px-4 pb-10 flex flex-wrap gap-2 justify-center">
        {sorted.map((p) => (
          <div key={p.id} className="px-3 py-1.5 rounded-full text-[11px] font-bold"
            style={{ background: PJ.surface, color: p.color }}>
            {p.name} · {p.score}
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl text-sm font-bold"
          style={{ background: PJ.surface, color: PJ.text }}>
          {toast}
        </div>
      )}

      {confirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(11,17,32,0.85)' }}>
          <div className="w-full max-w-xs rounded-3xl p-5 text-center" style={{ background: PJ.surface }}>
            <p className="font-black">{t('games.pixeljagd.leaveTitle')}</p>
            <p className="text-xs mt-1" style={{ color: PJ.dim }}>{t('games.pixeljagd.leaveBody')}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmExit(false)} className="flex-1 h-11 rounded-2xl font-bold"
                style={{ background: PJ.primary, color: PJ.bg }}>
                {t('games.pixeljagd.leaveStay')}
              </button>
              <button onClick={() => { clearSnapshot('pixeljagd'); setConfirmExit(false); navigate('/games'); }}
                className="flex-1 h-11 rounded-2xl font-bold" style={{ border: `1px solid ${PJ.dim}`, color: PJ.dim }}>
                {t('games.pixeljagd.leaveGo')}
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
function PixeljagdSetup({ onStart, onlinePlayers, contentReady, allowText, toast }: {
  onStart: (cfg: { players: { id: string; name: string }[]; mode: ModeId; answerMode: AnswerMode; categories: PixelCategory[]; rounds: number }) => void;
  onlinePlayers?: { id: string; name: string }[];
  contentReady: boolean;
  allowText: boolean;
  toast: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  /**
   * Party-Besetzung uebernehmen. Dieser eigene Setup-Bildschirm kannte bisher
   * nur den Online-Raum — eine laufende Party begann hier mit Platzhaltern
   * statt mit ihren echten Gaesten.
   */
  const partyRoster = useInitialRoster({ onlinePlayers, min: 2 });

  const [list, setList] = useState<PlayerSetupPlayer[]>(
    onlinePlayers?.length
      ? onlinePlayers.map((p) => ({ id: p.id, name: p.name, readOnly: true }))
      : partyRoster?.map((p) => ({ id: p.id, name: p.name }))
        ?? [{ id: 'p1', name: '' }, { id: 'p2', name: '' }],
  );
  const [mode, setMode] = useState<ModeId>('klassisch');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('buzzer');
  const [cats, setCats] = useState<PixelCategory[]>([]);
  const [rounds, setRounds] = useState(8);
  // Einzeln oder in Gruppen. Aendert nur die Beschriftung und die
  // Vorgabenamen — gespielt wird in beiden Faellen ueber dieselbe Liste,
  // eine Gruppe ist schlicht ein Spieler mit mehreren Koepfen dahinter.
  const [teamMode, setTeamMode] = useState<'solo' | 'groups'>('solo');

  const available = useMemo(
    () => (contentReady ? getPixelPuzzles(cats.length ? cats : undefined).length : 0),
    [contentReady, cats],
  );

  const named = list.map((p, i) => ({
    id: p.id,
    name: p.name.trim()
      || (teamMode === 'groups'
        ? t('games.pixeljagd.teamN', { n: i + 1 })
        : t('games.pixeljagd.playerN', { n: i + 1 })),
  }));
  const canStart = contentReady && available > 0 && named.length >= 2;

  return (
    <div className="min-h-[100dvh]" style={{ background: PJ.bg, color: PJ.text }}>
      <main className="relative z-10 pt-14 px-5 max-w-2xl mx-auto pb-16">
        <GameSetupBackLink onClick={() => navigate('/games')} className="mb-5" style={{ color: PJ.dim }}>
          ← {t('games.pixeljagd.backToGames')}
        </GameSetupBackLink>

        <h1 className="text-3xl font-black flex items-center gap-2">
          <Eye className="w-7 h-7" style={{ color: PJ.primary }} /> {t('games.pixeljagd.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: PJ.dim }}>{t('games.pixeljagd.tagline')}</p>

        {/* Einzeln oder in Gruppen */}
        <p className="mt-6 mb-2 text-xs font-black uppercase tracking-wide" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.teamMode')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(['solo', 'groups'] as const).map((m) => (
            <button key={m} onClick={() => setTeamMode(m)}
              aria-pressed={teamMode === m}
              className="p-3 rounded-2xl text-sm font-black"
              style={{
                background: teamMode === m ? PJ.secondary : PJ.surface,
                color: teamMode === m ? PJ.bg : PJ.text,
              }}>
              {m === 'solo'
                ? t('games.pixeljagd.teamModeSolo')
                : t('games.pixeljagd.teamModeGroups')}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <PlayerSetup
            players={list}
            onAdd={() => setList((p) => [...p, { id: `p${Date.now()}`, name: '' }])}
            onRemove={(id) => setList((p) => p.filter((x) => x.id !== id))}
            onRename={(id, name) => setList((p) => p.map((x) => (x.id === id ? { ...x, name } : x)))}
            min={2}
            max={8}
            accent={PJ.primary}
            label={teamMode === 'groups'
              ? t('games.pixeljagd.groupsLabel')
              : t('games.pixeljagd.playersLabel')}
            /* Aus dem Event uebernehmen: Wer schon eine Gaesteliste gepflegt
               hat, soll sie nicht zum zweiten Mal abtippen. */
            onImportNames={(names) =>
              setList((prev) => {
                const room = Math.max(0, 8 - prev.length);
                const fresh = names.slice(0, room).map((n, i) => ({
                  id: `ev${Date.now()}-${i}`,
                  name: n,
                }));
                // Leere Platzhalterzeilen zuerst auffuellen, damit nicht
                // "Spieler 1" und "Spieler 2" leer daneben stehen bleiben.
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

        {/* Modus */}
        <p className="mt-7 mb-2 text-xs font-black uppercase tracking-wide" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.mode')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="p-3 rounded-2xl text-left"
              style={{
                background: mode === m.id ? PJ.primary : PJ.surface,
                color: mode === m.id ? PJ.bg : PJ.text,
              }}>
              <span className="block text-sm font-black">{t(`gameModes.pixeljagd.${m.id}.name`)}</span>
              <span className="block text-[11px] opacity-80">{t(`gameModes.pixeljagd.${m.id}.desc`)}</span>
            </button>
          ))}
        </div>

        {/* Antwortmodus */}
        <p className="mt-7 mb-2 text-xs font-black uppercase tracking-wide" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.answerMode')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setAnswerMode('buzzer')}
            className="p-3 rounded-2xl text-left"
            style={{ background: answerMode === 'buzzer' ? PJ.secondary : PJ.surface, color: answerMode === 'buzzer' ? PJ.bg : PJ.text }}>
            <span className="block text-sm font-black">{t('games.pixeljagd.modeBuzzer')}</span>
            <span className="block text-[11px] opacity-80">{t('games.pixeljagd.modeBuzzerDesc')}</span>
          </button>
          <button onClick={() => allowText && setAnswerMode('text')} disabled={!allowText}
            className="p-3 rounded-2xl text-left disabled:opacity-40"
            style={{ background: answerMode === 'text' ? PJ.secondary : PJ.surface, color: answerMode === 'text' ? PJ.bg : PJ.text }}>
            <span className="block text-sm font-black">{t('games.pixeljagd.modeText')}</span>
            <span className="block text-[11px] opacity-80">
              {allowText ? t('games.pixeljagd.modeTextDesc') : t('games.pixeljagd.modeTextOnlineOnly')}
            </span>
          </button>
        </div>

        {/* Kategorien */}
        <p className="mt-7 mb-2 text-xs font-black uppercase tracking-wide" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.categoriesLabel')}
        </p>
        <div className="flex flex-wrap gap-2">
          {/* Zufall zuerst und als Voreinstellung: Eine leere Auswahl bedeutet
              in getPixelPuzzles() bereits "alle Kategorien" — bisher war das
              nur unsichtbar. Als Schaltflaeche ist es auffindbar, und der
              Rueckweg zur Mischung braucht nicht das Abwaehlen aller Chips. */}
          <button
            onClick={() => setCats([])}
            aria-pressed={cats.length === 0}
            className="px-3 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors"
            style={{
              background: cats.length === 0 ? PJ.primary : PJ.surface,
              color: cats.length === 0 ? PJ.bg : PJ.text,
            }}>
            {t('games.pixeljagd.categories.mix')}
          </button>
          {PIXEL_CATEGORIES.map((c) => {
            const on = cats.includes(c);
            return (
              <button key={c}
                onClick={() => setCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                aria-pressed={on}
                className="px-3 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors"
                style={{ background: on ? PJ.accent : PJ.surface, color: on ? PJ.bg : PJ.text }}>
                {t(categoryLabelKey(c))}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] mt-2" style={{ color: PJ.dim }}>
          {cats.length === 0 ? t('games.pixeljagd.allCategories') : t('games.pixeljagd.available', { count: available })}
        </p>

        {/* Runden */}
        <p className="mt-7 mb-2 text-xs font-black uppercase tracking-wide" style={{ color: PJ.dim }}>
          {t('games.pixeljagd.rounds')}: {rounds}
        </p>
        <input type="range" min={3} max={20} step={1} value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))} className="w-full" style={{ accentColor: PJ.primary }} />

        {contentReady && available === 0 && (
          <div className="mt-6 rounded-2xl p-4 text-sm" style={{ background: PJ.surface, color: PJ.dim }}>
            {t('games.pixeljagd.noImagesSetup')}
          </div>
        )}

        <button
          disabled={!canStart}
          onClick={() => onStart({ players: named, mode, answerMode, categories: cats, rounds })}
          className="mt-6 w-full h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: PJ.primary, color: PJ.bg }}
        >
          {t('games.pixeljagd.start')}
        </button>

        {toast && <p className="mt-3 text-center text-sm" style={{ color: PJ.bad }}>{toast}</p>}
      </main>
    </div>
  );
}
