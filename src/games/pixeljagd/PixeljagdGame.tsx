import OnlineWaiting from '../multiplayer/OnlineWaiting';
import { publicRoundItem } from '../multiplayer/public-round-item';
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
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { useGameTimer } from '../engine/TimerSystem';
import { getPlayerColor } from '../ui/PlayerAvatars';
import { ResultScreen } from '../ui/ResultScreen';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import { useBackGuard } from '@/lib/back-guard';
import { saveSnapshot, loadSnapshot, clearSnapshot } from '../ui/useGameSnapshot';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { PixelCanvas } from './PixelCanvas';
import { stepsFor, pointsAt, FINAL_STEP } from './pixelate';
import { isCorrectAnswer } from './answer-match';
import { recoverPixelRound, validPixelAnswerAction } from './recovery';
import { dropPixelPlayers } from './removal';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { getPixelPuzzles, type PixelCategory, type PixelPuzzle } from './pixeljagd-content';
import { loadExtraPuzzles } from './pixeljagd-extra';
import { PJ, MODES, type Phase, type AnswerMode, type ModeId, type Player } from './pixeljagd-theme';
import { PixeljagdSetup } from './PixeljagdSetup';
import { AnswerPad, BuzzedCard, ExitDialog, PixelHeader, RoundReveal, ScoreStrip } from './PixelPlayPanels';
import { mayActFor, penalizeTeam, sharedPhoneTeams } from './team-buzzer';
import { usePixelRoomSync } from './usePixelRoomSync';

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
  const [imageFailed, setImageFailed] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [puzzle, setPuzzle] = useState<PixelPuzzle | null>(null);
  const [buzzedBy, setBuzzedBy] = useState<string | null>(null);
  // Die Loesung bleibt bis zum bewussten Aufdecken verdeckt — sonst koennte die
  // Gruppe nicht urteilen, ohne die Antwort vorher zu verraten.
  const [solutionShown, setSolutionShown] = useState(false);
  const [frozenPoints, setFrozenPoints] = useState<number | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  // Steht das Motiv schon auf der Zeichenflaeche? Die Runde darf erst dann
  // loslaufen — sonst tickt die Uhr gegen ein Bild, das noch niemand sieht.
  const [imageReady, setImageReady] = useState(false);
  const [readyDevices, setReadyDevices] = useState<string[]>([]);

  // All devices + TV switch phase together; the reveal clock waits for the beat (design §9).
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, round]);
  const inputOpen = !blocker;
  // Seats this phone plays: online the host + its 🔁 guests (one team, team-buzzer.ts).
  const room = useMemo(() => online?.players ?? [], [online?.players]);
  const mySeats = useMemo(() => (online ? localSeats(online) : []), [online]);
  const requiredDevices = useMemo(() => [...new Set(room.map(p => p.controlledBy || p.id).concat(myId ?? []))], [room, myId]);

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

  const roundTimer = useGameTimer(modeDef.duration, handleTimeout, online?.isConnected !== false);
  const roundTimerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);
  roundTimerRef.current = roundTimer;

  const elapsed = Math.max(0, modeDef.duration - roundTimer.timeLeft);
  // In der Auflösung immer scharf zeigen.
  const step = view === 'roundEnd'
    ? FINAL_STEP
    : (steps[Math.min(elapsed, steps.length - 1)] ?? FINAL_STEP);
  const livePoints = frozenPoints ?? pointsAt(elapsed, modeDef.duration);

  const beginRound = useCallback((d: PixelPuzzle[], idx: number, ps: Player[], duration = modeDef.duration) => {
    const next = d[idx];
    setPuzzle(next ?? null);
    setRound(idx);
    setBuzzedBy(null);
    setFrozenPoints(null);
    setWinnerId(null);
    setSolutionShown(false);
    setPlayers(ps.map((p) => ({ ...p, locked: false })));
    roundTimerRef.current?.reset(duration);
    setImageReady(false);
    setReadyDevices([]);
    setPhase('playing');
    // Kein start() hier: das uebernimmt der Effekt, sobald PixelCanvas
    // meldet, dass das Motiv geladen und gezeichnet ist.
  }, [modeDef.duration]);

  // --- Eingaben ------------------------------------------------------------
  const act = useCallback((type: string, payload: Record<string, unknown>, run: () => void) => {
    if (online?.isConnected === false) return;
    if (isOnline && !isHost) { online!.broadcast('pixeljagd-action', { type, ...payload, round, puzzleId: puzzle?.id }); return; }
    run();
  }, [isOnline, isHost, online, round, puzzle?.id]);

  const doBuzz = useCallback((pid: string) => {
    if (buzzedBy || phase !== 'playing' || !imageReady) return;
    const p = players.find((x) => x.id === pid);
    if (!p || p.locked) return;
    void haptics.medium();
    // Uhr UND Punktezähler einfrieren — sonst verliert der Spieler Punkte,
    // während er die Antwort ausspricht.
    setFrozenPoints(pointsAt(elapsed, modeDef.duration));
    roundTimerRef.current?.pause();
    setBuzzedBy(pid);
    setSolutionShown(false);
  }, [buzzedBy, phase, players, haptics, elapsed, modeDef.duration, imageReady]);

  const award = useCallback((pid: string, pts: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === pid ? { ...p, score: p.score + pts } : p)));
    setWinnerId(pid);
    roundTimerRef.current?.pause();
    void haptics.success();
    setPhase('roundEnd');
  }, [haptics]);

  const penalize = useCallback((pid: string) => {
    // A wrong guess locks the whole phone (host + 🔁 guests), only the guesser loses points.
    const result = penalizeTeam(players, pid, modeDef.penalty, room);
    setPlayers(result.players);
    setBuzzedBy(null);
    setFrozenPoints(null);
    void haptics.error();
    flash(t('games.pixeljagd.wrongToast', { points: modeDef.penalty }));
    // Enthüllung läuft weiter — die anderen sind noch im Rennen.
    if (!result.othersLeft) { setPhase('roundEnd'); return; }
    roundTimerRef.current?.start();
  }, [modeDef.penalty, haptics, flash, t, players, room]);

  useEffect(() => { setImageFailed(false); setImageReady(false); }, [puzzle?.id]);

  const doJudge = useCallback((correct: boolean) => {
    if (!buzzedBy) return;
    if (correct) award(buzzedBy, frozenPoints ?? 10);
    else {
      penalize(buzzedBy);
      // The solution has been shown for judging, so no further guesses are fair.
      roundTimerRef.current?.pause();
      setPhase('roundEnd');
    }
  }, [buzzedBy, frozenPoints, award, penalize]);

  const doTextGuess = useCallback((pid: string, text: string) => {
    if (phase !== 'playing' || !puzzle || !imageReady || typeof text !== 'string' || !text.trim() || text.length > 200) return;
    const p = players.find((x) => x.id === pid);
    if (!p || p.locked) return;
    if (isCorrectAnswer(text, puzzle.answer, puzzle.aliases)) {
      award(pid, pointsAt(elapsed, modeDef.duration));
    } else {
      penalize(pid);
    }
  }, [phase, puzzle, players, award, penalize, elapsed, modeDef.duration, imageReady]);

  const nextRound = useCallback(() => {
    const nextIdx = round + 1;
    if (nextIdx >= totalRounds || nextIdx >= deck.length) {
      roundTimerRef.current?.pause();
      setPhase('gameOver');
      return;
    }
    beginRound(deck, nextIdx, players);
  }, [round, totalRounds, deck, players, beginRound]);

  const rematchRef = useRef<() => void>(() => {});
  // Host wendet Client-Aktionen an.
  const applyAction = useCallback((data: Record<string, unknown>) => {
    if (online?.isConnected === false || data.round !== round || data.puzzleId !== puzzle?.id) return;
    const sender = data.__senderId;
    const device = typeof sender === 'string' && requiredDevices.includes(sender);
    if (data.type === 'image-ready' && device) {
      setReadyDevices(prev => prev.includes(sender) ? prev : [...prev, sender]);
      return;
    }
    if (data.type === 'image-error' && device && phase === 'playing') {
      flash(t('games.pixeljagd.imageFailed'));
      nextRound();
      return;
    }
    if (data.type === 'again' && phase === 'gameOver' && players.some(p => p.id === data.__senderId)) { rematchRef.current(); return; }
    if (typeof sender !== 'string' || !validPixelAnswerAction(data, answerMode)) return;
    // A seat answers from its own phone, a 🔁 guest from the phone that plays it. Judging and advancing are host controls.
    if (!players.some(p => p.id === data.pid) || !mayActFor(data.pid, sender, room)) return;
    switch (data.type) {
      case 'buzz': doBuzz(data.pid as string); break;
      case 'text': doTextGuess(data.pid as string, data.text as string); break;
      default: break;
    }
  }, [phase, players, doBuzz, doTextGuess, online?.isConnected, round, puzzle?.id, answerMode, room, requiredDevices, nextRound, flash, t]);

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast('pixeljagd-action', (d) => applyAction(d));
  }, [online, isHost, applyAction]);

  // Host: kicked/left players leave the round; a released buzz lets the reveal run on (G7).
  useRemovedPlayers(online, (ids) => {
    const drop = dropPixelPlayers({ phase, players, buzzedBy }, ids);
    if (!drop) return;
    setPlayers(drop.players);
    if (drop.clearBuzz || drop.endRound) { setBuzzedBy(null); setFrozenPoints(null); setSolutionShown(false); }
    if (drop.endRound) { roundTimerRef.current?.pause(); setPhase('roundEnd'); }
  });


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
    if (phase !== 'playing' || !imageReady || buzzedBy || !inputOpen || (isOnline && !requiredDevices.every(id => readyDevices.includes(id)))) return;
    roundTimerRef.current?.start();
  }, [isOnline, isHost, phase, imageReady, buzzedBy, inputOpen, requiredDevices, readyDevices]);

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
  // The host sends the authoritative timer state after every phone has drawn
  // the image. A local start here can reveal a still blank canvas.

  // TV: gleiche Nutzlast offline wie online. Die Antwort erst in der Auflösung.
  const tvPayload = useMemo(() => ({
    phase,
    phaseStartsAt,
    players: players.map((p) => ({ id: p.id, name: p.name, color: p.color, score: p.score, locked: p.locked, ...(p.avatar ? { avatar: p.avatar } : {}) })),
    // Public: who shares the host phone (one buzzer, one try per phone). Never answers.
    teams: sharedPhoneTeams(room),
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
  }), [phase, phaseStartsAt, players, room, round, totalRounds, puzzle, step, roundTimer.timeLeft, modeDef.duration, livePoints, buzzedBy, winnerId]);

  usePixelRoomSync(online, {
    phase, players, round, totalRounds,
    puzzle: publicRoundItem(puzzle, phase === 'roundEnd' || phase === 'gameOver', ['answer', 'aliases', 'credit', 'sourceUrl']),
    buzzedBy, frozenPoints, winnerId, mode, answerMode, categories, phaseStartsAt,
  }, (s) => {
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
    receivePhaseStart(s.phaseStartsAt);
  }, roundTimer, roundTimerRef, tvPayload);

  useTVGameBridge('pixeljagd', tvPayload, [phase, phaseStartsAt, round, step, roundTimer.timeLeft, buzzedBy, winnerId, players], isHost);

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
      const checkpoint = recoverPixelRound(s, (MODES.find(option => option.id === s.mode) ?? MODES[0]).duration);
      roundTimerRef.current?.reset(checkpoint.timeLeft);
      setBuzzedBy(checkpoint.buzzedBy);
      setFrozenPoints(checkpoint.frozenPoints);
      setWinnerId(checkpoint.winnerId);
      setSolutionShown(checkpoint.solutionShown);
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) return;
    if (phase === 'setup' || phase === 'gameOver') { clearSnapshot('pixeljagd'); return; }
    if (!restoredRef.current) return;
    saveSnapshot('pixeljagd', { phase, players, round, totalRounds, puzzle, mode, answerMode, categories, deck,
      timeLeft: roundTimer.timeLeft, buzzedBy, frozenPoints, winnerId, solutionShown });
  }, [isOnline, phase, players, round, totalRounds, puzzle, mode, answerMode, categories, deck,
    roundTimer.timeLeft, buzzedBy, frozenPoints, winnerId, solutionShown]);

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
    if (!isHost) return;
    const pool = shuffle(getPixelPuzzles(cfg.categories.length ? cfg.categories : undefined));
    if (pool.length === 0) { flash(t('games.pixeljagd.noImages')); return; }
    // Party: keep each seat's own colour and symbol (same face on phone and TV).
    const ps: Player[] = cfg.players.map((p, i) => {
      const seat = online?.players.find(r => r.id === p.id);
      return { id: p.id, name: p.name, color: seat?.color || getPlayerColor(i), score: 0, locked: false, ...(seat?.avatar ? { avatar: seat.avatar } : {}) };
    });
    setMode(cfg.mode);
    setAnswerMode(cfg.answerMode);
    setCategories(cfg.categories);
    setTotalRounds(Math.min(cfg.rounds, pool.length));
    setDeck(pool);
    restoredRef.current = true;
    beginRound(pool, 0, ps, (MODES.find(m => m.id === cfg.mode) ?? MODES[0]).duration);
  }, [isHost, beginRound, flash, t, online?.players]);

  // =========================================================================
  rematchRef.current = () => handleStart({ players: players.map(p => ({ id: p.id, name: p.name })), mode, answerMode, categories, rounds: totalRounds });
  if (phase === 'setup' && online && !isHost) return <OnlineWaiting />;
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

  if (view === 'gameOver') {
    return (
      <ResultScreen
        players={sorted.map((p) => ({ name: p.name, score: p.score, streak: 0 }))}
        gameTitle={t('games.pixeljagd.title')}
        onPlayAgain={() => act('again', {}, () => rematchRef.current())}
        onBackToHub={() => { clearSnapshot('pixeljagd'); navigate('/games'); }}
        totalRounds={totalRounds}
        gameId="pixeljagd"
      />
    );
  }

  return (
    <div data-phase={view} className="min-h-[100dvh] relative" style={{ background: PJ.bg, color: PJ.text }}>
      {blocker}
      <PixelHeader round={round + 1} total={totalRounds} points={livePoints} onLeave={() => setConfirmExit(true)} />

      {/* Bild */}
      <div className="relative z-10 px-4">
        <div className="rounded-3xl overflow-hidden" style={{ background: PJ.elevated, border: `1px solid ${PJ.surface}` }}>
          {puzzle ? (
            <div className="relative">
              <PixelCanvas
                key={`${puzzle.id}-${imageAttempt}`}
                src={puzzle.image}
                step={step}
                className="w-full h-auto block"
                onError={() => {
                  flash(t('games.pixeljagd.imageFailed'));
                  if (isHost) nextRound();
                  else {
                    setImageFailed(true);
                    online?.broadcast('pixeljagd-action', { type: 'image-error', round, puzzleId: puzzle.id });
                  }
                }}
                onReady={() => {
                  setImageReady(true);
                  if (isOnline && !isHost) online?.broadcast('pixeljagd-action', { type: 'image-ready', round, puzzleId: puzzle.id });
                  else if (myId) setReadyDevices(prev => prev.includes(myId) ? prev : [...prev, myId]);
                }}
              />
              {!imageReady && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: PJ.elevated }}>
                  {imageFailed ? <button className="min-h-12 rounded-2xl px-5 font-bold" style={{ background: PJ.primary, color: PJ.bg }} onClick={() => { setImageFailed(false); setImageAttempt(n => n + 1); }}>{t('games.pixeljagd.retryImage')}</button> : <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: PJ.primary, borderTopColor: 'transparent' }} />}
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
        {view === 'roundEnd' && puzzle && (
          <RoundReveal key="reveal" puzzle={puzzle} winner={players.find((p) => p.id === winnerId)} isHost={isHost}
            onNext={() => act('next', {}, nextRound)} />
        )}
      </AnimatePresence>

      {/* Eingabe */}
      {view === 'playing' && (
        <div className="relative z-10 px-4 mt-4 pb-8">
          {buzzedBy ? (
            <BuzzedCard buzzer={players.find((p) => p.id === buzzedBy)} myId={myId} isOnline={isOnline} isHost={isHost}
              solutionShown={solutionShown} answer={puzzle?.answer} onShow={() => setSolutionShown(true)}
              onJudge={(correct) => act('judge', { correct }, () => doJudge(correct))} />
          ) : (
            <AnswerPad answerMode={answerMode} isOnline={isOnline} players={players} localSeats={mySeats} imageReady={imageReady}
              onBuzz={(pid) => act('buzz', { pid }, () => doBuzz(pid))}
              onText={(pid, text) => act('text', { pid, text }, () => doTextGuess(pid, text))} />
          )}
        </div>
      )}

      {/* While buzzers show name + score here, the strip lists only the others. */}
      <ScoreStrip players={players} hide={view === 'playing' && !buzzedBy ? (isOnline ? mySeats : players.map((p) => p.id)) : []} />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl text-sm font-bold"
          style={{ background: PJ.surface, color: PJ.text }}>
          {toast}
        </div>
      )}

      {confirmExit && (
        <ExitDialog onStay={() => setConfirmExit(false)}
          onLeave={() => { clearSnapshot('pixeljagd'); setConfirmExit(false); navigate('/games'); }} />
      )}
    </div>
  );
}
