import OnlineWaiting from '../multiplayer/OnlineWaiting';
/**
 * CLOSE ENOUGH (deutsch „Nah Dran") — Schätzspiel.
 *
 * Pro Runde eine Frage mit einer Zahl als Antwort. Alle tippen, wer am
 * nächsten dran liegt, bekommt die meisten Punkte. Gewertet wird die RELATIVE
 * Abweichung — die Fragen reichen von „8 Beine" bis „2 500 000 Liter", absolut
 * gerechnet wäre bei großen Zahlen jeder gleich weit daneben.
 *
 * Läuft in drei Konstellationen — ein Handy, Online-Raum, Fernsehmodus. Muster
 * durchgehend von OhrwurmGame und PixeljagdGame übernommen: `act()` als
 * einziger Eingabepfad, der Host besitzt die Wahrheit, Clients spiegeln.
 *
 * ZWEI DINGE, DIE HIER ANDERS SIND als in den bisherigen Spielen:
 *
 * 1. Die Phase heißt `reveal`, nicht `roundEnd`. `TVScreen.tsx` blendet bei
 *    `roundEnd` die Spielansicht aus und zeigt stattdessen die Rangliste —
 *    die Auflösung wäre auf dem Fernseher also nie zu sehen. (Genau deshalb
 *    ist der Auflösungszweig in `TVPixeljagdView` dort toter Code.)
 *
 * 2. Die Tipps wandern erst AB `reveal` in den Datenstrom. Vorher stünden sie
 *    im Snapshot, und ein Mitspieler könnte sie in der Browserkonsole
 *    mitlesen. Solange getippt wird, geht nur nach draußen, WER schon
 *    abgegeben hat — nie, WAS.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { useGameTimer } from '../engine/TimerSystem';
import { getPlayerColor } from '../ui/PlayerAvatars';
import { ResultScreen } from '../ui/ResultScreen';
import { useBackGuard } from '@/lib/back-guard';
import { clearSnapshot } from '../ui/useGameSnapshot';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { parseRaw } from './number-format';
import { scoreRound, type CeGuess, type CeResult } from './closeenough-scoring';
import { anchorKeyFor } from './closeenough-anchors';
import { dropRemovedPlayers } from './removal';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { CloseEnoughAtmosphere } from './CloseEnoughAtmosphere';
import { setReportContext } from '@/games/ui/useReportContext';
import { loadQuestions, type CeCategory, type CeQuestion } from './closeenough-content';
import { CE, MODES, shuffle, type ModeId, type Phase, type Player } from './ce-theme';
import { CloseEnoughSetup } from './CloseEnoughSetup';
import { useCeTv } from './useCeTv';
import { useCeOnlineSync } from './useCeOnlineSync';
import { useCeOfflineSave } from './useCeOfflineSave';
import { CeEntry, CeExitConfirm, CeHeader, CeIntro, CePass, CeReveal } from './CloseEnoughPanels';
import { ceExpiry, ceSenderMayGuess, nextLocalGuesser, queuedLocalGuessers } from './guest-estimates';

export default function CloseEnoughGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const lang = (i18n.language || 'de').split('-')[0];
  const isOnline = !!online;
  const isHost = !online || online.isHost;
  const myId = online?.myPlayerId ?? null;

  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<ModeId>('klassisch');
  const [categories, setCategories] = useState<CeCategory[]>([]);
  const [totalRounds, setTotalRounds] = useState(7);
  const [round, setRound] = useState(0);
  const [roundToken, setRoundToken] = useState('');
  const [deck, setDeck] = useState<CeQuestion[]>([]);
  const [question, setQuestion] = useState<CeQuestion | null>(null);
  const [guesses, setGuesses] = useState<Record<string, number | null>>({});
  const [results, setResults] = useState<CeResult[] | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [raw, setRaw] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Beim Client: wer abgegeben hat, kommt vom Host statt aus `guesses`. */
  const [remoteSubmitted, setRemoteSubmitted] = useState<string[]>([]);

  /** Wer auf DIESEM Gerät gerade tippt. Nur im Offline-Modus benutzt. */
  const [entryIndex, setEntryIndex] = useState(0);
  /** Offline: Gerät weiterreichen, bevor der Nächste die Frage sieht. */
  const [awaitingPass, setAwaitingPass] = useState(false);
  /** Runden-Auftakt: die neue Frage bekommt einen eigenen Moment, bevor die Uhr läuft. */
  const [showIntro, setShowIntro] = useState(false);

  /** Der ganze Vorrat für die aktive Sprache; die Auswahl filtert daraus. */
  const [pool, setPool] = useState<CeQuestion[]>([]);
  const [contentReady, setContentReady] = useState(false);

  // 🔁 guests on the host phone estimate one after another, each after an opaque handover (guest-estimates.ts).
  const seats = online ? localSeats(online) : [];
  const localGuesser = online ? nextLocalGuesser(seats, players, isHost ? guesses : new Set(remoteSubmitted)) : null;
  const handover = useSeatHandover(online, phase === 'guessing' ? localGuesser : null);
  // All devices + TV switch phase together (design §9); render with `view`, rules stay on `phase`.
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, round]);

  const modeDef = useMemo(() => MODES.find((m) => m.id === mode) ?? MODES[1], [mode]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }, []);

  // --- Inhalte -------------------------------------------------------------
  // Einmal alles laden und danach im Speicher filtern. 864 Zeilen sind
  // harmlos, und die Einrichtung kann so die Anzahl je Kategorie sofort
  // anzeigen, statt bei jedem Antippen erneut zu fragen.
  useEffect(() => {
    let cancelled = false;
    setContentReady(false);
    void loadQuestions(lang).then((qs) => {
      if (cancelled) return;
      setPool(qs);
      setContentReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // --- Runde ---------------------------------------------------------------
  const finishRoundRef = useRef<(() => void) | null>(null);

  const handleTimeout = useCallback(() => {
    if (isOnline && !isHost) return;
    void haptics.warning();
    if (isOnline) {
      // Queued guests keep their turn and get a full clock after the handover.
      if (!queuedLocalGuessers(seats, players, guesses).length) { finishRoundRef.current?.(); return; }
      setGuesses(previous => ceExpiry(players, previous, queuedLocalGuessers(seats, players, previous)));
      return;
    }
    const player = players[entryIndex];
    if (!player) return;
    setGuesses(previous => ({ ...previous, [player.id]: null }));
    setRaw(''); setHintShown(false);
    if (entryIndex + 1 < players.length) { setEntryIndex(entryIndex + 1); setAwaitingPass(true); }
    // The all-submitted effect resolves the final person's timeout once state commits.
  }, [isOnline, isHost, haptics, players, entryIndex, guesses, seats.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const roundTimer = useGameTimer(modeDef.duration, handleTimeout, online?.isConnected !== false && !handover.isPaused);
  const roundTimerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);
  roundTimerRef.current = roundTimer;

  const finishRound = useCallback(() => {
    if (!question) return;
    const list: CeGuess[] = players.map((p) => ({
      playerId: p.id,
      value: guesses[p.id] ?? null,
    }));
    const res = scoreRound(list, question.answer, question.tolerancePct);
    setResults(res);
    setPlayers((prev) =>
      prev.map((p) => {
        const r = res.find((x) => x.playerId === p.id);
        return r ? { ...p, score: p.score + r.points } : p;
      }),
    );
    roundTimerRef.current?.pause();
    setAwaitingPass(false);
    void haptics.success();
    setPhase('reveal');
  }, [question, players, guesses, haptics]);

  finishRoundRef.current = finishRound;

  const beginRound = useCallback(
    (d: CeQuestion[], idx: number, ps: Player[], duration = modeDef.duration) => {
      const next = d[idx];
      setQuestion(next ?? null);
      setRoundToken(crypto.randomUUID());
      // Damit der Melde-Knopf in der Titelleiste weiss, worauf er sich bezieht.
      // NAH DRAN ist hier der beste Fall im ganzen Projekt: Es liefert die
      // Datenbank-ID, den Antwortwert UND die Quelle mit — eine Meldung ist
      // damit ohne Rueckfrage pruefbar.
      setReportContext(
        next
          ? {
              gameId: "closeenough",
              contentId: next.id,
              label: next.question || next.name || "",
              extra: {
                antwort: next.answer,
                einheit: next.unitKey,
                quelle: next.sourceLabel,
                quelleUrl: next.sourceUrl,
              },
            }
          : null
      );
      setRound(idx);
      setGuesses({});
      setRemoteSubmitted([]);
      setResults(null);
      setHintShown(false);
      setRaw('');
      setEntryIndex(0);
      setAwaitingPass(false);
      setPlayers(ps);
      roundTimerRef.current?.reset(duration);
      setShowIntro(true);
      setPhase('guessing');
      // Kein start() hier: die Uhr läuft erst, wenn der Auftakt durch ist.
    },
    [modeDef.duration],
  );

  // --- Eingaben ------------------------------------------------------------
  const act = useCallback(
    (type: string, payload: Record<string, unknown>, run: () => void) => {
      if (isOnline && !isHost) {
        online!.broadcast('closeenough-action', { type, ...payload });
        return;
      }
      run();
    },
    [isOnline, isHost, online],
  );

  const doGuess = useCallback((pid: string, value: number) => {
    if (phase !== 'guessing' || !players.some(p => p.id === pid) || !Number.isFinite(value)) return;
    // Nur der erste Tipp zählt. Ohne die Sperre könnte ein Client denselben
    // Spieler beliebig oft korrigieren, während die anderen schon fertig sind.
    setGuesses((prev) => (pid in prev ? prev : { ...prev, [pid]: value }));
  }, [phase, players]);

  /**
   * Alle abgegeben? Dann auflösen.
   *
   * Bewusst als Effekt und NICHT im State-Updater von `doGuess`: React darf
   * Updater erneut ausführen, ein Seiteneffekt darin feuerte also mehrfach.
   * Genau daran ist in OHRWURM schon einmal ein Spieler übersprungen worden.
   */
  useEffect(() => {
    if (phase !== 'guessing') return;
    if (isOnline && !isHost) return;
    if (players.length === 0) return;
    if (players.every((p) => p.id in guesses)) finishRound();
  }, [phase, guesses, players, isOnline, isHost, finishRound]);

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
  const applyAction = useCallback(
    (data: Record<string, unknown>) => {
      if (data.type === 'again' && phase === 'gameOver' && players.some(p => p.id === data.__senderId)) { rematchRef.current(); return; }
      if (online?.isConnected === false || phase !== 'guessing' || data.roundToken !== roundToken || data.type !== 'guess' || !ceSenderMayGuess(data.pid, data.__senderId, online?.players ?? [])) return;
      switch (data.type) {
        case 'guess':
          doGuess(data.pid as string, Number(data.value));
          break;
        default:
          break;
      }
    },
    [phase, players, doGuess, roundToken, online?.isConnected],
  );

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast('closeenough-action', (d) => applyAction(d));
  }, [online, isHost, applyAction]);

  // Host: Kick/Verlassen mitten im Match. Kader, Tipps und Ergebnis bereinigen;
  // der Alle-abgegeben-Effekt oben löst die Runde dann ggf. sofort auf.
  useRemovedPlayers(online, (ids) => {
    const next = dropRemovedPlayers({ players, guesses, results }, ids);
    if (!next) return;
    setPlayers(next.players); setGuesses(next.guesses); setResults(next.results);
  });

  /** Wer schon abgegeben hat — das ist alles, was während des Tippens rausgeht. */
  const submittedIds = useMemo(() => Object.keys(guesses), [guesses]);
  useCeOnlineSync({
    online, isHost, timer: roundTimer, timerRef: roundTimerRef, snapshot: { phase, phaseStartsAt, players, round, roundToken, totalRounds, question, mode, categories, submittedIds, guesses, results },
    receive: { setPhase, setPlayers, setRound, setRoundToken, setTotalRounds, setQuestion, setMode, setCategories, setGuesses, setResults, setRemoteSubmitted, receivePhaseStart },
  });

  const submittedSet = useMemo(
    () => new Set(isOnline && !isHost ? remoteSubmitted : submittedIds),
    [isOnline, isHost, remoteSubmitted, submittedIds],
  );

  // Auftakt nach anderthalb Sekunden ausblenden — gezählt ab dem gemeinsamen Phasenwechsel.
  useEffect(() => {
    if (!showIntro || view !== 'guessing') return;
    const id = window.setTimeout(() => setShowIntro(false), 1500);
    return () => window.clearTimeout(id);
  }, [showIntro, round, view]);
  // Handys zeigen denselben Auftakt im selben Moment wie Host und TV.
  useEffect(() => {
    if (isOnline && !isHost && view === 'guessing') setShowIntro(true);
  }, [isOnline, isHost, view, round]);
  // Jeder Gast am Host-Handy schätzt mit einer vollen eigenen Uhr.
  const guestTurn = handover.activeGuest ?? '';
  useEffect(() => {
    if (!isHost || !guestTurn || phase !== 'guessing') return;
    roundTimerRef.current?.reset(modeDef.duration);
    roundTimerRef.current?.start();
  }, [guestTurn]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Startschuss der Runde.
   *
   * Die Uhr darf weder während des Auftakts noch während des Weiterreichens
   * laufen — sonst verliert derjenige Zeit, der die Frage noch gar nicht
   * gesehen hat.
   */
  useEffect(() => {
    if (isOnline && !isHost) return;
    if (phase !== 'guessing' || showIntro || awaitingPass) return;
    roundTimerRef.current?.start();
  }, [isOnline, isHost, phase, showIntro, awaitingPass]);

  // Nicht-Host spiegelt die Uhr über EINEN Boolean (Muster aus OhrwurmGame).
  useEffect(() => {
    if (!isOnline || isHost) return;
    if (phase === 'guessing' && !showIntro) roundTimerRef.current?.start();
    else roundTimerRef.current?.pause();
  }, [isOnline, isHost, phase, showIntro]);

  const { lastReveal, revealMarks, truthLabel, unitLabel } = useCeTv({
    online, isHost, phase, phaseStartsAt, handoverTv: handover.tv, players, submittedSet, submittedIds, round, totalRounds,
    question, results, lang, timeLeft: roundTimer.timeLeft, duration: modeDef.duration,
  });

  const restoredRef = useCeOfflineSave({
    isOnline, phase, players, round, totalRounds, question, mode, categories, deck, guesses, results,
    setPhase, setPlayers, setRound, setTotalRounds, setQuestion, setMode, setCategories, setDeck, setGuesses, setResults, setEntryIndex,
  });

  // Zurück abfangen — der native Zurück-Knopf liegt über allem.
  useBackGuard(() => {
    if (phase === 'setup') return false;
    if (confirmExit) {
      setConfirmExit(false);
      return true;
    }
    setConfirmExit(true);
    return true;
  });

  // --- Start ---------------------------------------------------------------
  const handleStart = useCallback(
    (cfg: {
      players: { id: string; name: string }[];
      mode: ModeId;
      categories: CeCategory[];
      rounds: number;
    }) => {
      if (!isHost) return;
      const source = cfg.categories.length
        ? pool.filter((q) => cfg.categories.includes(q.category))
        : pool;
      if (source.length === 0) {
        flash(t('games.closeenough.noQuestions'));
        return;
      }
      const shuffled = shuffle(source);
      const ps: Player[] = cfg.players.map((p, i) => ({
        id: p.id,
        name: p.name,
        color: getPlayerColor(i),
        score: 0,
      }));
      setMode(cfg.mode);
      setCategories(cfg.categories);
      setTotalRounds(Math.min(cfg.rounds, shuffled.length));
      setDeck(shuffled);
      restoredRef.current = true;
      beginRound(shuffled, 0, ps, (MODES.find(option => option.id === cfg.mode) ?? MODES[1]).duration);
    },
    [isHost, pool, beginRound, flash, t],
  );

  // =========================================================================
  rematchRef.current = () => handleStart({ players: players.map(p => ({ id: p.id, name: p.name })), mode, categories, rounds: totalRounds });
  if (phase === 'setup' && online && !isHost) return <OnlineWaiting />;
  if (handover.overlay) return handover.overlay; // phone in transit: only the opaque pass screen
  if (phase === 'setup') {
    return (
      <CloseEnoughSetup
        onStart={handleStart}
        onlinePlayers={online?.players}
        pool={pool}
        contentReady={contentReady}
        toast={toast}
      />
    );
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (view === 'gameOver') {
    return (
      <ResultScreen
        players={sorted.map((p) => ({ name: p.name, score: p.score, streak: 0 }))}
        gameTitle={t('games.closeenough.title')}
        onPlayAgain={() => act('again', {}, () => rematchRef.current())}
        onBackToHub={() => {
          clearSnapshot('closeenough');
          navigate('/games');
        }}
        totalRounds={totalRounds}
        gameId="closeenough"
      />
    );
  }

  // Wer tippt gerade auf diesem Gerät? Online: der eigene Platz oder der 🔁-Gast, der das Handy hält.
  const activePlayer = isOnline
    ? (players.find((p) => p.id === (localGuesser ?? myId)) ?? null)
    : (players[entryIndex] ?? null);
  const alreadySubmitted = !!activePlayer && submittedSet.has(activePlayer.id);
  const seatOf = (id: string) => online?.players.find((p) => p.id === id);
  const activeSeat = activePlayer ? seatOf(activePlayer.id) : undefined;

  const anchorKey = question ? anchorKeyFor(question.frameKey, question.nameDe) : null;
  const hint = anchorKey ? t(anchorKey) : null;

  const myResult = results?.find((r) => r.playerId === activePlayer?.id) ?? null;
  // Bis zum gemeinsamen Wechsel bleibt die alte Auflösung stehen (kein leeres Bild).
  const shownReveal = view === 'reveal' ? (phase === 'reveal' ? { question, results } : lastReveal.current) : null;

  const submitGuess = () => {
    const value = parseRaw(raw);
    if (value === null || !activePlayer) return;
    void haptics.medium();
    act('guess', { pid: activePlayer.id, value, roundToken }, () => doGuess(activePlayer.id, value));
    setRaw('');
    setHintShown(false);
    if (!isOnline) {
      // Offline reicht das Gerät weiter. Die Uhr hält an, bis der Nächste
      // bereit ist — sonst tippt er unter einer Uhr, die schon läuft.
      const nextIndex = entryIndex + 1;
      if (nextIndex < players.length) {
        roundTimerRef.current?.pause();
        setEntryIndex(nextIndex);
        setAwaitingPass(true);
      }
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div data-phase={view} className="min-h-[100dvh] relative" style={{ background: CE.bg, color: CE.text }}>
      {blocker}
      <CloseEnoughAtmosphere warm={CE.accent} cool={CE.truth} intense={view === 'reveal'} />

      <CeHeader round={round} totalRounds={totalRounds} timeLeft={roundTimer.timeLeft} duration={modeDef.duration}
        guessing={view === 'guessing'} question={shownReveal?.question ?? question} onLeave={() => setConfirmExit(true)} />

      <AnimatePresence mode="wait">
        {shownReveal?.question && shownReveal.results && (
          <CeReveal question={shownReveal.question} results={shownReveal.results} marks={revealMarks} players={players}
            isOnline={isOnline} myResult={myResult} truthLabel={truthLabel} lang={lang} canAdvance={!isOnline || isHost}
            isLast={round + 1 >= totalRounds || round + 1 >= deck.length} onNext={() => act('next', {}, nextRound)} />
        )}

        {/* Gerät weiterreichen (nur offline) */}
        {view === 'guessing' && awaitingPass && activePlayer && (
          <CePass player={activePlayer} onReady={() => { roundTimerRef.current?.reset(modeDef.duration); setAwaitingPass(false); }} />
        )}

        {view === 'guessing' && !awaitingPass && (
          <CeEntry activePlayer={activePlayer} submitted={alreadySubmitted} players={players} submittedSet={submittedSet} seatOf={seatOf}
            ribbon={activePlayer && isOnline ? { id: activePlayer.id, name: activePlayer.name, avatar: activeSeat?.avatar, color: activeSeat?.color || activePlayer.color } : undefined}
            raw={raw} onRawChange={setRaw} onSubmit={submitGuess} lang={lang} unitLabel={unitLabel} unitKey={question?.unitKey}
            hint={hint} hintShown={hintShown} onShowHint={() => setHintShown(true)} />
        )}
      </AnimatePresence>

      <CeIntro show={showIntro && view === 'guessing'} round={round} />
      <CeExitConfirm open={confirmExit} onStay={() => setConfirmExit(false)} onLeave={() => { clearSnapshot('closeenough'); navigate('/games'); }} />

      {toast && (
        <p className="fixed bottom-6 left-0 right-0 text-center text-sm" style={{ color: CE.bad }}>
          {toast}
        </p>
      )}
    </div>
    </MotionConfig>
  );
}
