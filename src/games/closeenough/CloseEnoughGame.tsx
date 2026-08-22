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
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, Trophy, ChevronRight, Check, Clock, ExternalLink } from 'lucide-react';
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
import { formatNumber, parseRaw, compactWords } from './number-format';
import { scoreRound, type CeGuess, type CeResult } from './closeenough-scoring';
import { anchorKeyFor } from './closeenough-anchors';
import { NumberEntry } from './NumberEntry';
import { RevealChart, type RevealMark } from './RevealChart';
import { CloseEnoughAtmosphere, BullseyeBurst, CountUp } from './CloseEnoughAtmosphere';
import { setReportContext, clearReportContext } from '@/games/ui/useReportContext';
import {
  loadQuestions,
  questionText,
  withUnit,
  formatAnswer,
  unitWord,
  unitSymbol,
  categoryLabelKey,
  CE_CATEGORIES,
  CE_UNITS,
  type CeCategory,
  type CeQuestion,
} from './closeenough-content';

/**
 * Farbwelt warm/kalt: Amber ist der Spieler, Mint die Wahrheit, Gold der
 * Volltreffer. Die Trennung ist der Grund, warum man in der Auflösung ohne
 * Legende versteht, welcher Strich was bedeutet.
 */
const CE = {
  bg: '#0B1120',
  elevated: '#111C33',
  surface: '#16233F',
  text: '#F1F5F9',
  dim: '#94A3B8',
  accent: '#FBBF24',
  truth: '#34D399',
  gold: '#FDE047',
  bad: '#FB7185',
} as const;

const CHART_THEME = {
  surface: CE.surface,
  elevated: CE.elevated,
  text: CE.text,
  dim: CE.dim,
  accent: CE.accent,
  truth: CE.truth,
  gold: CE.gold,
};

const ENTRY_THEME = {
  bg: CE.bg,
  surface: CE.surface,
  elevated: CE.elevated,
  text: CE.text,
  dim: CE.dim,
  accent: CE.accent,
};

type Phase = 'setup' | 'guessing' | 'reveal' | 'gameOver';
type ModeId = 'entspannt' | 'klassisch' | 'blitz';

interface ModeDef {
  id: ModeId;
  duration: number;
}
const MODES: ModeDef[] = [
  { id: 'entspannt', duration: 60 },
  { id: 'klassisch', duration: 40 },
  { id: 'blitz', duration: 20 },
];

interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
}

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

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
  /**
   * Runden-Auftakt. Ohne ihn steht die neue Frage im selben Wimpernschlag
   * da, in dem die Auflösung verschwindet — man liest sie dann erst, wenn
   * die Uhr schon fünf Sekunden gelaufen ist.
   */
  const [showIntro, setShowIntro] = useState(false);

  /** Der ganze Vorrat für die aktive Sprache; die Auswahl filtert daraus. */
  const [pool, setPool] = useState<CeQuestion[]>([]);
  const [contentReady, setContentReady] = useState(false);

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
    finishRoundRef.current?.();
  }, [isOnline, isHost, haptics]);

  const roundTimer = useGameTimer(modeDef.duration, handleTimeout);
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
    (d: CeQuestion[], idx: number, ps: Player[]) => {
      const next = d[idx];
      setQuestion(next ?? null);
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
      roundTimerRef.current?.reset(modeDef.duration);
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
    if (!Number.isFinite(value)) return;
    // Nur der erste Tipp zählt. Ohne die Sperre könnte ein Client denselben
    // Spieler beliebig oft korrigieren, während die anderen schon fertig sind.
    setGuesses((prev) => (pid in prev ? prev : { ...prev, [pid]: value }));
  }, []);

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

  // Host wendet Client-Aktionen an.
  const applyAction = useCallback(
    (data: Record<string, unknown>) => {
      switch (data.type) {
        case 'guess':
          doGuess(data.pid as string, Number(data.value));
          break;
        case 'next':
          nextRound();
          break;
        default:
          break;
      }
    },
    [doGuess, nextRound],
  );

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast('closeenough-action', (d) => applyAction(d));
  }, [online, isHost, applyAction]);

  /** Wer schon abgegeben hat — das ist alles, was während des Tippens rausgeht. */
  const submittedIds = useMemo(() => Object.keys(guesses), [guesses]);

  // Host → Snapshot. Ohne timeLeft, sonst wären es 60 Nachrichten pro Runde.
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('closeenough-state', {
      snapshot: JSON.parse(
        JSON.stringify({
          phase,
          players,
          round,
          totalRounds,
          question,
          mode,
          categories,
          deck,
          submittedIds,
          // Die Tipps und die Wertung erst ab der Auflösung. Vorher stünden
          // sie im Datenstrom und jeder Mitspieler könnte abschreiben.
          guesses: phase === 'reveal' ? guesses : {},
          results: phase === 'reveal' ? results : null,
        }),
      ),
    });
  }, [
    online,
    isHost,
    phase,
    players,
    round,
    totalRounds,
    question,
    mode,
    categories,
    deck,
    submittedIds,
    guesses,
    results,
  ]);

  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast('closeenough-state', (d) => {
      const s = (d as { snapshot?: Record<string, unknown> }).snapshot;
      if (!s) return;
      setPhase(s.phase as Phase);
      setPlayers(s.players as Player[]);
      setRound(s.round as number);
      setTotalRounds(s.totalRounds as number);
      setQuestion(s.question as CeQuestion | null);
      setMode(s.mode as ModeId);
      setCategories(s.categories as CeCategory[]);
      setDeck(s.deck as CeQuestion[]);
      setGuesses((s.guesses as Record<string, number | null>) ?? {});
      setResults((s.results as CeResult[] | null) ?? null);
      setRemoteSubmitted((s.submittedIds as string[]) ?? []);
    });
  }, [online, isHost]);

  const submittedSet = useMemo(
    () => new Set(isOnline && !isHost ? remoteSubmitted : submittedIds),
    [isOnline, isHost, remoteSubmitted, submittedIds],
  );

  // Auftakt nach anderthalb Sekunden ausblenden.
  useEffect(() => {
    if (!showIntro) return;
    const id = window.setTimeout(() => setShowIntro(false), 1500);
    return () => window.clearTimeout(id);
  }, [showIntro, round]);

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

  // --- Fernseher -----------------------------------------------------------
  const revealMarks = useMemo<RevealMark[]>(() => {
    if (!results) return [];
    return results.map((r) => {
      const p = players.find((x) => x.id === r.playerId);
      return {
        playerId: r.playerId,
        name: p?.name ?? '',
        color: p?.color ?? CE.accent,
        value: r.value,
        bonus: r.bonus,
        rank: r.rank,
      };
    });
  }, [results, players]);

  const truthLabel = useMemo(() => {
    if (!question) return '';
    return withUnit(
      formatAnswer(question.answer, question.unitKey, lang),
      question.unitKey,
      question.answer,
      lang,
      t,
    );
  }, [question, lang, t]);

  const unitLabel = useMemo(() => {
    if (!question) return '';
    return CE_UNITS[question.unitKey] === 'symbol'
      ? unitSymbol(question.unitKey, t)
      : unitWord(question.unitKey, 2, lang, t);
  }, [question, lang, t]);

  const tvPayload = useMemo(
    () => ({
      phase,
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        score: p.score,
        // Der Fernseher zeigt nur den Haken, nie die Zahl.
        status: submittedSet.has(p.id) ? 'done' : 'thinking',
      })),
      round: round + 1,
      totalRounds,
      question: question ? questionText(question, t) : '',
      unitLabel,
      timeLeft: roundTimer.timeLeft,
      totalTime: modeDef.duration,
      submittedCount: players.filter((p) => submittedSet.has(p.id)).length,
      // Erst ab der Auflösung — vorher stünde die Antwort im Datenstrom.
      reveal:
        phase === 'reveal' && question
          ? {
              truth: question.answer,
              truthLabel,
              tolerancePct: question.tolerancePct,
              unitKey: question.unitKey,
              source: question.sourceLabel,
              marks: revealMarks,
            }
          : null,
    }),
    [
      phase,
      players,
      submittedSet,
      round,
      totalRounds,
      question,
      unitLabel,
      roundTimer.timeLeft,
      modeDef.duration,
      revealMarks,
      truthLabel,
      t,
    ],
  );

  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('tv-state', { game: 'closeenough', ...tvPayload });
  }, [online, isHost, tvPayload]);

  useTVGameBridge('closeenough', tvPayload, [
    phase,
    round,
    roundTimer.timeLeft,
    submittedIds.length,
    results,
  ]);

  // --- Persistenz (offline) ------------------------------------------------
  const restoredRef = useRef(false);
  useEffect(() => {
    if (isOnline || restoredRef.current) return;
    restoredRef.current = true;
    const s = loadSnapshot<Record<string, unknown>>('closeenough');
    if (s && s.phase && s.phase !== 'setup' && s.phase !== 'gameOver') {
      setPlayers(s.players as Player[]);
      setRound(s.round as number);
      setTotalRounds(s.totalRounds as number);
      setQuestion(s.question as CeQuestion | null);
      setMode(s.mode as ModeId);
      setCategories(s.categories as CeCategory[]);
      setDeck(s.deck as CeQuestion[]);

      const savedResults = (s.results as CeResult[] | null) ?? null;
      const savedGuesses = (s.guesses as Record<string, number | null>) ?? {};

      /*
       * Die Auflösung braucht die Wertung — ohne sie rendert der ganze Zweig
       * nichts und der Spieler steht vor einer leeren Fläche OHNE Weiter-Knopf.
       * Das ist eine Sackgasse: Nur „Verlassen" käme noch heraus, und die
       * ganze Partie wäre weg. Fehlt die Wertung im Spielstand, wird die Runde
       * deshalb neu getippt statt eine halbe Auflösung zu zeigen.
       */
      if (s.phase === 'reveal' && savedResults?.length) {
        setGuesses(savedGuesses);
        setResults(savedResults);
        setPhase('reveal');
      } else {
        setGuesses({});
        setResults(null);
        setEntryIndex(0);
        setPhase('guessing');
      }
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) return;
    if (phase === 'setup' || phase === 'gameOver') {
      clearSnapshot('closeenough');
      return;
    }
    if (!restoredRef.current) return;
    saveSnapshot('closeenough', {
      phase,
      players,
      round,
      totalRounds,
      question,
      mode,
      categories,
      deck,
      // Tipps und Wertung gehoeren mit in den Spielstand: Ohne sie laesst sich
      // eine unterbrochene Auflösung nicht wiederherstellen. Ein Mitlesen ist
      // hier kein Thema — der Spielstand liegt im localStorage des EIGENEN
      // Geraets, und offline sieht dieses Geraet die Tipps ohnehin alle.
      guesses,
      results,
    });
  }, [
    isOnline,
    phase,
    players,
    round,
    totalRounds,
    question,
    mode,
    categories,
    deck,
    guesses,
    results,
  ]);

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
      beginRound(shuffled, 0, ps);
    },
    [pool, beginRound, flash, t],
  );

  // =========================================================================
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

  if (phase === 'gameOver') {
    return (
      <ResultScreen
        players={sorted.map((p) => ({ name: p.name, score: p.score, streak: 0 }))}
        gameTitle={t('games.closeenough.title')}
        onPlayAgain={() =>
          handleStart({
            players: players.map((p) => ({ id: p.id, name: p.name })),
            mode,
            categories,
            rounds: totalRounds,
          })
        }
        onBackToHub={() => {
          clearSnapshot('closeenough');
          navigate('/games');
        }}
        totalRounds={totalRounds}
        gameId="closeenough"
      />
    );
  }

  // Wer tippt gerade auf diesem Gerät?
  const activePlayer = isOnline
    ? (players.find((p) => p.id === myId) ?? null)
    : (players[entryIndex] ?? null);
  const alreadySubmitted = !!activePlayer && submittedSet.has(activePlayer.id);

  const anchorKey = question ? anchorKeyFor(question.frameKey, question.nameDe) : null;
  const hint = anchorKey ? t(anchorKey) : null;

  const myResult = results?.find((r) => r.playerId === activePlayer?.id) ?? null;
  const winners = results?.filter((r) => r.value !== null && r.rank === 1) ?? [];

  const submitGuess = () => {
    const value = parseRaw(raw);
    if (value === null || !activePlayer) return;
    void haptics.medium();
    act('guess', { pid: activePlayer.id, value }, () => doGuess(activePlayer.id, value));
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
    <div className="min-h-[100dvh] relative" style={{ background: CE.bg, color: CE.text }}>
      <CloseEnoughAtmosphere warm={CE.accent} cool={CE.truth} intense={phase === 'reveal'} />

      {/* Kopf: Runde, Uhr, Ausstieg */}
      <div className="relative z-10 px-4 pt-14 pb-3 flex items-center justify-between">
        {/* In der App löst der FloatingBackButton über den Back-Guard denselben
            Dialog aus — dort nur unsichtbar schalten, nicht entfernen, damit
            Runde und Punkte in der Kopfzeile stehen bleiben, wo sie waren. */}
        <button
          onClick={() => setConfirmExit(true)}
          className={`text-xs font-bold${hasShellBackButton() ? ' invisible pointer-events-none' : ''}`}
          aria-hidden={hasShellBackButton()}
          tabIndex={hasShellBackButton() ? -1 : undefined}
          style={{ color: CE.dim }}
        >
          ← {t('games.closeenough.leave')}
        </button>
        <div className="text-xs font-bold" style={{ color: CE.dim }}>
          {t('games.closeenough.roundOf', { round: round + 1, total: totalRounds })}
        </div>
        {/* Uhr als Ring: Die verbleibende Zeit ist damit eine Form, keine
            Zahl, die man erst lesen muss. Unter fünf Sekunden pulst sie. */}
        <motion.div
          className="relative w-9 h-9 flex items-center justify-center"
          animate={
            phase === 'guessing' && roundTimer.timeLeft <= 5 && roundTimer.timeLeft > 0
              ? { scale: [1, 1.14, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.7, repeat: roundTimer.timeLeft <= 5 ? Infinity : 0 }}
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={CE.surface} strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
              stroke={roundTimer.timeLeft <= 5 ? CE.bad : CE.accent}
              strokeDasharray={2 * Math.PI * 15.5}
              strokeDashoffset={
                2 * Math.PI * 15.5 * (1 - Math.max(0, roundTimer.timeLeft) / modeDef.duration)
              }
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span
            className="text-xs font-black tabular-nums"
            style={{ color: roundTimer.timeLeft <= 5 && phase === 'guessing' ? CE.bad : CE.accent }}
          >
            {phase === 'guessing' ? roundTimer.timeLeft : 0}
          </span>
        </motion.div>
      </div>

      {/* Frage */}
      <div className="relative z-10 px-4">
        <motion.div
          key={question?.id ?? 'none'}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="rounded-3xl p-5 border"
          style={{
            background: CE.elevated,
            borderColor: 'rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          {question && (
            <span
              className="inline-block mb-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
              style={{ background: CE.surface, color: CE.dim }}
            >
              {t(categoryLabelKey(question.category))}
            </span>
          )}
          <p className="text-lg font-black leading-snug">
            {question ? questionText(question, t) : ''}
          </p>
        </motion.div>

        {/* Uhrbalken */}
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: CE.surface }}>
          <div
            className="h-full transition-[width] duration-1000 ease-linear"
            style={{
              width: `${(roundTimer.timeLeft / modeDef.duration) * 100}%`,
              background: roundTimer.timeLeft <= 5 ? CE.bad : CE.accent,
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ---------------------------------------------------------------- */}
        {/* Auflösung                                                         */}
        {/* ---------------------------------------------------------------- */}
        {phase === 'reveal' && question && results && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 px-4 mt-4 pb-10"
          >
            <div className="rounded-3xl p-4" style={{ background: CE.surface }}>
              <RevealChart
                marks={revealMarks}
                truth={question.answer}
                tolerancePct={question.tolerancePct}
                unitKey={question.unitKey}
                lang={lang}
                truthLabel={truthLabel}
                theme={CHART_THEME}
              />
            </div>

            {/*
              Offline sitzen alle vor DEMSELBEN Gerät — dort gehört die ganze
              Rangliste hin, nicht nur das Ergebnis dessen, der zuletzt getippt
              hat. Online sieht jeder nur sein eigenes Ergebnis; die Zahlen der
              anderen stehen ohnehin auf der Achse.
            */}
            {!isOnline && results.length > 0 && (
              <div className="mt-3 rounded-3xl p-2" style={{ background: CE.surface }}>
                {results.map((r) => {
                  const rp = players.find((x) => x.id === r.playerId);
                  return (
                    <motion.div
                      key={r.playerId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.15 * r.rank,
                        type: 'spring',
                        stiffness: 320,
                        damping: 26,
                      }}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <span
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                        style={{
                          background: r.bonus ? CE.gold : (rp?.color ?? CE.accent),
                          color: CE.bg,
                        }}
                      >
                        {r.rank}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm font-bold">{rp?.name}</span>
                      <span className="text-xs tabular-nums" style={{ color: CE.dim }}>
                        {r.value === null
                          ? t('games.closeenough.noGuess')
                          : formatAnswer(r.value, question.unitKey, lang)}
                      </span>
                      <span
                        className="text-sm font-black tabular-nums w-14 text-right"
                        style={{ color: r.bonus ? CE.gold : CE.truth }}
                      >
                        <CountUp value={r.points} prefix="+" />
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Das eigene Ergebnis in Worten — die Achse zeigt das Bild, hier
                steht die Zahl. */}
            {isOnline && myResult && (
              <div className="mt-3 rounded-3xl p-4 text-center" style={{ background: CE.surface }}>
                {myResult.value === null ? (
                  <p className="text-sm font-bold" style={{ color: CE.dim }}>
                    {t('games.closeenough.noGuess')}
                  </p>
                ) : (
                  <>
                    <p className="text-sm" style={{ color: CE.dim }}>
                      {t('games.closeenough.yourGuess')}:{' '}
                      <span className="font-black tabular-nums" style={{ color: CE.text }}>
                        {formatAnswer(myResult.value, question.unitKey, lang)}
                      </span>
                    </p>
                    <p
                      className="mt-1 text-sm font-black"
                      style={{ color: myResult.bonus ? CE.gold : CE.accent }}
                    >
                      {myResult.bonus
                        ? t('games.closeenough.exactHit')
                        : t('games.closeenough.offBy', {
                            percent: formatNumber(myResult.relErr * 100, lang, 1),
                          })}
                    </p>
                  </>
                )}
                <div className="relative mt-2">
                  {myResult.bonus && <BullseyeBurst color={CE.gold} />}
                  <p className="text-2xl font-black" style={{ color: CE.truth }}>
                    <CountUp value={myResult.points} prefix="+" /> {t('games.closeenough.points')}
                  </p>
                </div>
              </div>
            )}

            {/* Rundensieger */}
            <p className="mt-3 text-center text-sm" style={{ color: CE.dim }}>
              {winners.length === 0 ? (
                t('games.closeenough.nobody')
              ) : (
                <>
                  <Trophy className="w-4 h-4 inline mr-1" style={{ color: CE.gold }} />
                  {t('games.closeenough.roundWinner', {
                    name: winners
                      .map((w) => players.find((p) => p.id === w.playerId)?.name ?? '')
                      .join(', '),
                  })}
                </>
              )}
            </p>

            {/* Beleg. Bei einer Zahl ist die Herkunft die einzige Möglichkeit,
                einen Streit am Spieltisch zu beenden. */}
            <p className="mt-3 text-center text-[11px] leading-snug" style={{ color: CE.dim }}>
              {t('games.closeenough.source')}:{' '}
              {question.sourceUrl ? (
                <a
                  href={question.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-0.5"
                >
                  {question.sourceLabel}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                question.sourceLabel
              )}
              {question.asOfYear ? ` · ${question.asOfYear}` : ''}
            </p>

            {/* Weiter darf nur der Host — sonst springen zwei Geräte gleichzeitig. */}
            {(!isOnline || isHost) && (
              <button
                onClick={() => act('next', {}, nextRound)}
                className="mt-4 w-full h-14 rounded-2xl font-black flex items-center justify-center gap-2"
                style={{ background: CE.accent, color: CE.bg }}
              >
                {round + 1 >= totalRounds || round + 1 >= deck.length
                  ? t('games.closeenough.finish')
                  : t('games.closeenough.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Gerät weiterreichen (nur offline)                                 */}
        {/* ---------------------------------------------------------------- */}
        {phase === 'guessing' && awaitingPass && activePlayer && (
          <motion.div
            key="pass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 px-4 mt-10 pb-10 text-center"
          >
            <p className="text-sm" style={{ color: CE.dim }}>
              {t('games.closeenough.passTo')}
            </p>
            <p className="text-3xl font-black mt-2" style={{ color: activePlayer.color }}>
              {activePlayer.name}
            </p>
            <button
              onClick={() => {
                roundTimerRef.current?.reset(modeDef.duration);
                setAwaitingPass(false);
              }}
              className="mt-8 w-full h-14 rounded-2xl font-black"
              style={{ background: CE.accent, color: CE.bg }}
            >
              {t('games.closeenough.passReady')}
            </button>
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Eingabe                                                           */}
        {/* ---------------------------------------------------------------- */}
        {phase === 'guessing' && !awaitingPass && (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 px-4 mt-4 pb-10"
          >
            {activePlayer && !alreadySubmitted && (
              <p
                className="mb-2 text-center text-sm font-bold"
                style={{ color: activePlayer.color }}
              >
                {activePlayer.name}
              </p>
            )}

            {alreadySubmitted || !activePlayer ? (
              // Abgegeben: ab hier zeigt die Fläche, WER schon dran war — nie,
              // WAS jemand getippt hat.
              <div className="rounded-3xl p-6 text-center" style={{ background: CE.surface }}>
                <Check className="w-10 h-10 mx-auto" style={{ color: CE.truth }} />
                <p className="mt-2 font-black">{t('games.closeenough.submitted')}</p>
                <p className="mt-1 text-sm" style={{ color: CE.dim }}>
                  {t('games.closeenough.waitingOthers', {
                    done: players.filter((p) => submittedSet.has(p.id)).length,
                    total: players.length,
                  })}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {players.map((p) => {
                    const done = submittedSet.has(p.id);
                    return (
                      <span
                        key={p.id}
                        className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
                        style={{
                          background: done ? p.color : CE.elevated,
                          color: done ? CE.bg : CE.dim,
                        }}
                      >
                        {done && <Check className="w-3 h-3" />}
                        {p.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <NumberEntry
                raw={raw}
                onRawChange={setRaw}
                onSubmit={submitGuess}
                lang={lang}
                unitLabel={unitLabel}
                allowNegative={question?.unitKey === 'year'}
                // Jahreszahlen weder gruppieren noch als Wort zeigen: „1.515"
                // und „1,5 Tausend" sind als Jahresangabe beide falsch.
                isYear={question?.unitKey === 'year'}
                hint={hint}
                hintShown={hintShown}
                onShowHint={() => setHintShown(true)}
                theme={ENTRY_THEME}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Runden-Auftakt — deckt die Fläche kurz zu, damit die neue Frage einen
          eigenen Moment bekommt statt im Nachbild der Auflösung unterzugehen. */}
      <AnimatePresence>
        {showIntro && phase === 'guessing' && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-40 flex flex-col items-center justify-center"
            style={{ background: CE.bg }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
          >
            <CloseEnoughAtmosphere warm={CE.accent} cool={CE.truth} intense />
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="relative z-10 text-center"
            >
              <Target className="w-12 h-12 mx-auto mb-3" style={{ color: CE.accent }} />
              <p className="text-4xl font-black" style={{ color: CE.text }}>
                {t('games.closeenough.roundIntro', { round: round + 1 })}
              </p>
              <p className="mt-2 text-sm" style={{ color: CE.dim }}>
                {t('games.closeenough.getReady')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verlassen bestätigen */}
      <AnimatePresence>
        {confirmExit && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: CE.elevated }}>
              <p className="text-lg font-black">{t('games.closeenough.leaveTitle')}</p>
              <p className="mt-2 text-sm" style={{ color: CE.dim }}>
                {t('games.closeenough.leaveBody')}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmExit(false)}
                  className="h-12 rounded-2xl font-black"
                  style={{ background: CE.surface, color: CE.text }}
                >
                  {t('games.closeenough.leaveStay')}
                </button>
                <button
                  onClick={() => {
                    clearSnapshot('closeenough');
                    navigate('/games');
                  }}
                  className="h-12 rounded-2xl font-black"
                  style={{ background: CE.bad, color: CE.bg }}
                >
                  {t('games.closeenough.leaveGo')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <p className="fixed bottom-6 left-0 right-0 text-center text-sm" style={{ color: CE.bad }}>
          {toast}
        </p>
      )}
    </div>
  );
}

// ===========================================================================
// Einrichtung
// ===========================================================================

function CloseEnoughSetup({
  onStart,
  onlinePlayers,
  pool,
  contentReady,
  toast,
}: {
  onStart: (cfg: {
    players: { id: string; name: string }[];
    mode: ModeId;
    categories: CeCategory[];
    rounds: number;
  }) => void;
  onlinePlayers?: { id: string; name: string }[];
  pool: CeQuestion[];
  contentReady: boolean;
  toast: string | null;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language || 'de').split('-')[0];

  const [list, setList] = useState<PlayerSetupPlayer[]>(
    onlinePlayers?.length
      ? onlinePlayers.map((p) => ({ id: p.id, name: p.name, readOnly: true }))
      : [
          { id: 'p1', name: '' },
          { id: 'p2', name: '' },
        ],
  );
  const [mode, setMode] = useState<ModeId>('klassisch');
  const [cats, setCats] = useState<CeCategory[]>([]);
  const [rounds, setRounds] = useState(7);
  // Einzeln oder in Gruppen. Aendert nur Beschriftung und Vorgabenamen —
  // gespielt wird in beiden Faellen ueber dieselbe Liste, eine Gruppe ist
  // schlicht ein Spieler mit mehreren Koepfen dahinter.
  const [teamMode, setTeamMode] = useState<'solo' | 'groups'>('solo');

  /** Wie viele Fragen je Kategorie da sind — leere Kategorien bleiben draußen. */
  const perCategory = useMemo(() => {
    const c: Record<string, number> = {};
    for (const q of pool) c[q.category] = (c[q.category] ?? 0) + 1;
    return c;
  }, [pool]);

  const available = useMemo(
    () => (cats.length ? pool.filter((q) => cats.includes(q.category)).length : pool.length),
    [pool, cats],
  );

  const named = list.map((p, i) => ({
    id: p.id,
    name:
      p.name.trim() ||
      (teamMode === 'groups'
        ? t('games.closeenough.teamN', { n: i + 1 })
        : t('games.closeenough.playerN', { n: i + 1 })),
  }));
  const canStart = contentReady && available > 0 && named.length >= 2;

  return (
    <div className="min-h-[100dvh] relative" style={{ background: CE.bg, color: CE.text }}>
      <CloseEnoughAtmosphere warm={CE.accent} cool={CE.truth} />

      <main className="relative z-10 pt-14 px-5 max-w-2xl mx-auto pb-16">
        <GameSetupBackLink
          onClick={() => navigate('/games')}
          className="mb-5"
          style={{ color: CE.dim }}
        >
          ← {t('games.closeenough.backToGames')}
        </GameSetupBackLink>

        <motion.h1
          className="text-3xl font-black flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          {/* Das Zielsymbol atmet — ein einziges bewegtes Element im Kopf
              reicht, damit die Seite lebendig wirkt statt bloss dunkel. */}
          <motion.span
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <Target className="w-7 h-7" style={{ color: CE.accent }} />
          </motion.span>
          {t('games.closeenough.title')}
        </motion.h1>
        <motion.p
          className="text-sm mt-1"
          style={{ color: CE.dim }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          {t('games.closeenough.tagline')}
        </motion.p>

        {/* Einzeln oder in Gruppen */}
        <p
          className="mt-7 mb-2 text-xs font-black uppercase tracking-wide"
          style={{ color: CE.dim }}
        >
          {t('games.closeenough.teamMode')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(['solo', 'groups'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setTeamMode(m)}
              aria-pressed={teamMode === m}
              className="p-3 rounded-2xl text-sm font-black transition-colors"
              style={{
                background: teamMode === m ? CE.truth : CE.surface,
                color: teamMode === m ? CE.bg : CE.text,
              }}
            >
              {m === 'solo'
                ? t('games.closeenough.teamModeSolo')
                : t('games.closeenough.teamModeGroups')}
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
            accent={CE.accent}
            label={
              teamMode === 'groups'
                ? t('games.closeenough.groupsLabel')
                : t('games.closeenough.playersLabel')
            }
            /* Aus dem Event uebernehmen: Wer schon eine Gaesteliste gepflegt
               hat, soll sie nicht ein zweites Mal abtippen. */
            onImportNames={(names) =>
              setList((prev) => {
                const room = Math.max(0, 8 - prev.length);
                const fresh = names.slice(0, room).map((n, i) => ({
                  id: `ev${Date.now()}-${i}`,
                  name: n,
                }));
                // Leere Platzhalterzeilen zuerst auffuellen, sonst stehen
                // „Spieler 1" und „Spieler 2" leer daneben.
                const filled = prev.slice();
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
        <p
          className="mt-7 mb-2 text-xs font-black uppercase tracking-wide"
          style={{ color: CE.dim }}
        >
          {t('games.closeenough.mode')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="p-3 rounded-2xl text-left"
              style={{
                background: mode === m.id ? CE.accent : CE.surface,
                color: mode === m.id ? CE.bg : CE.text,
              }}
            >
              <span className="block text-sm font-black">
                {t(`gameModes.closeenough.${m.id}.name`)}
              </span>
              <span className="block text-[11px] opacity-80">
                {t(`gameModes.closeenough.${m.id}.desc`)}
              </span>
            </button>
          ))}
        </div>

        {/* Kategorien */}
        <p
          className="mt-7 mb-2 text-xs font-black uppercase tracking-wide"
          style={{ color: CE.dim }}
        >
          {t('games.closeenough.categoriesLabel')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCats([])}
            aria-pressed={cats.length === 0}
            className="px-3 py-2 rounded-full text-xs font-bold transition-colors"
            style={{
              background: cats.length === 0 ? CE.accent : CE.surface,
              color: cats.length === 0 ? CE.bg : CE.text,
            }}
          >
            {t('games.closeenough.categories.mix')}
          </button>
          {CE_CATEGORIES.map((c) => {
            const count = perCategory[c] ?? 0;
            // Leere Kategorien gar nicht erst anbieten. „Alltag" ist zum Start
            // leer, weil Wikidata sie nicht liefern kann — ein Knopf, der zu
            // null Fragen führt, ist schlimmer als kein Knopf.
            if (contentReady && count === 0) return null;
            const on = cats.includes(c);
            return (
              <button
                key={c}
                onClick={() => setCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                aria-pressed={on}
                className="px-3 py-2 rounded-full text-xs font-bold transition-colors"
                style={{ background: on ? CE.truth : CE.surface, color: on ? CE.bg : CE.text }}
              >
                {t(categoryLabelKey(c))}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] mt-2" style={{ color: CE.dim }}>
          {!contentReady
            ? t('games.closeenough.loading')
            : cats.length === 0
              ? t('games.closeenough.allCategories', { count: available })
              : t('games.closeenough.available', { count: available })}
        </p>

        {/* Runden */}
        <p
          className="mt-7 mb-2 text-xs font-black uppercase tracking-wide"
          style={{ color: CE.dim }}
        >
          {t('games.closeenough.rounds')}: {rounds}
        </p>
        <input
          type="range"
          min={3}
          max={15}
          step={1}
          value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: CE.accent }}
        />

        {contentReady && available === 0 && (
          <div
            className="mt-6 rounded-2xl p-4 text-sm"
            style={{ background: CE.surface, color: CE.dim }}
          >
            {t('games.closeenough.noQuestionsSetup')}
          </div>
        )}

        {/* Beispiel für die Wortform, damit die Eingabefläche keine Überraschung
            ist: so groß wird die eigene Zahl später angezeigt. */}
        <p className="mt-6 text-[11px] text-center" style={{ color: CE.dim }}>
          {t('games.closeenough.wordFormHint', { example: compactWords(2_500_000, lang) })}
        </p>

        <button
          disabled={!canStart}
          onClick={() => onStart({ players: named, mode, categories: cats, rounds })}
          className="mt-4 w-full h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: CE.accent, color: CE.bg }}
        >
          {t('games.closeenough.start')}
        </button>

        {toast && (
          <p className="mt-3 text-center text-sm" style={{ color: CE.bad }}>
            {toast}
          </p>
        )}
      </main>
    </div>
  );
}
