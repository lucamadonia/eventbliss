import '../headup/classic-stage.css';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { normalizeGuess, sealedGuesses, completeDrawingRounds } from './guess-rules';
import { useOnlineActions, useOnlinePrivateSnapshot, OnlineWaiting } from '../bottlespin/online-controller';
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect, useMemo } from 'react';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Trophy, RotateCcw, ArrowRight,
  Pencil, Eraser, Trash2, Undo2, Check, X,
} from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { personalResult } from '../social/result';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getPlayerColor, getPlayerInitial } from '../ui/PlayerAvatars';
import { PlayerSetup } from '../ui/PlayerSetup';
import { getDRAW_WORDS, type DrawWord } from './quickdraw-words';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Mode = 'classic' | 'speed' | 'blind';
type Phase =
  | 'setup'
  | 'drawerReveal'
  | 'drawing'
  | 'guessing'
  | 'roundResult'
  | 'gameOver';

interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
}

type PenSize = 3 | 6 | 12;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MODE_TIMERS: Record<Mode, number> = { classic: 60, speed: 30, blind: 60 };
const MODE_IDS: Mode[] = ['classic', 'speed', 'blind'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function QuickDrawGame({ online }: { online?: OnlineGameProps } = {}) {
  const { setTimeout, clearTimeout } = usePausableTasks(online?.isConnected !== false);
  const navigate = useNavigate();
  // Zurück mitten in der Runde darf die Partie nicht wegwerfen.
  const exitGuard = useConfirmExit(() => navigate('/games'));
  const { t } = useTranslation();

  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyRoster = useInitialRoster() ?? [];
  const partyPlayerNames = partyRoster.map((p) => p.name);
  const resolvedNames = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : [];
  const initialPlayers: Player[] = resolvedNames.length >= 2
    ? resolvedNames.map((name, i) => ({ id: online?.players[i]?.id ?? partyRoster[i]?.id ?? `p${i + 1}`, name, color: getPlayerColor(i), score: 0 }))
    : [
        { id: 'p1', name: t('games.quickdraw.defaultPlayer', { n: 1 }), color: getPlayerColor(0), score: 0 },
        { id: 'p2', name: t('games.quickdraw.defaultPlayer', { n: 2 }), color: getPlayerColor(1), score: 0 },
      ];
  /* ---- Setup ---- */
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [mode, setMode] = useState<Mode>('classic');
  const [totalRounds, setTotalRounds] = useState(8);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  /* ---- Game state ---- */
  const [phase, setPhase] = useState<Phase>('setup');

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste)
  // liegt über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg — die Partie ist
  // dann futsch. Setup und Endstand haben nichts zu verlieren und reichen
  // weiter an den Routen-Handler.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [round, setRound] = useState(1);
  const [drawerIdx, setDrawerIdx] = useState(0);
  const deck = useRef<DrawWord[]>(shuffle(getDRAW_WORDS()));
  const deckPos = useRef(0);
  const [currentWord, setCurrentWord] = useState<DrawWord | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<number | null>(null);
  const [canvasHidden, setCanvasHidden] = useState(false);

  /* ---- Canvas state ---- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const paths = useRef<ImageData[]>([]);
  // Cached per stroke so the hot pointermove path never calls
  // getBoundingClientRect()/getContext() (each forced a synchronous layout
  // reflow every move — the cause of the heavy drawing lag).
  const rectRef = useRef<DOMRect | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penSize, setPenSize] = useState<PenSize>(6);
  const [drawingDataURL, setDrawingDataURL] = useState<string | null>(null);

  /* ---- Guess state ---- */
  const [guesses, setGuesses] = useState<{ playerId: string; guess: string; correct: boolean }[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [currentGuesser, setCurrentGuesser] = useState(0);

  /* ---- Player management ---- */
  const nextId = useRef(3);
  const addPlayer = () => { if (players.length >= 10) return; const i = players.length; setPlayers(p => [...p, { id: `p${nextId.current++}`, name: t('games.quickdraw.defaultPlayer', { n: i + 1 }), color: getPlayerColor(i), score: 0 }]); };
  const removePlayer = (id: string) => { if (players.length <= 2) return; setPlayers(p => p.filter(x => x.id !== id)); };
  const updateName = (id: string, name: string) => setPlayers(p => p.map(x => x.id === id ? { ...x, name } : x));
  const isOnlineOrParty = resolvedNames.length >= 2;
  const handleImportNames = (names: string[]) => {
    setPlayers(() => {
      const roster: Player[] = [];
      for (const n of names) {
        if (roster.length >= 10) break;
        roster.push({ id: `p${nextId.current++}`, name: n, color: getPlayerColor(roster.length), score: 0 });
      }
      while (roster.length < 2) roster.push({ id: `p${nextId.current++}`, name: t('games.quickdraw.defaultPlayer', { n: roster.length + 1 }), color: getPlayerColor(roster.length), score: 0 });
      return roster;
    });
  };
  const drawer = players[drawerIdx % players.length];
  const guessers = players.filter((_, i) => i !== drawerIdx % players.length);

  const tv = useTVGameBridge('quickdraw', {
    phase, round, totalRounds, drawerIdx, drawer: drawer?.name, drawerColor: drawer?.color,
    timeLeft, maxTime: MODE_TIMERS[mode], drawingDataURL,
    currentWord: phase === 'roundResult' ? currentWord?.word : undefined, players,
  }, [phase, round, drawerIdx, timeLeft, drawingDataURL, players], !online || online.isHost);
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('tv-state', {
      game: 'quickdraw', phase, round, totalRounds, drawer: drawer?.name, drawerColor: drawer?.color,
      timeLeft, maxTime: MODE_TIMERS[mode], drawingDataURL,
      currentWord: phase === 'roundResult' ? currentWord?.word : undefined, players,
    });
  }, [online?.isHost, online?.broadcast, phase, round, totalRounds, drawer, timeLeft, mode, drawingDataURL, currentWord, players]);

  /* ---- Draw word ---- */
  function drawWord(): DrawWord {
    if (deckPos.current >= deck.current.length) {
      deck.current = shuffle(getDRAW_WORDS());
      deckPos.current = 0;
    }
    return deck.current[deckPos.current++];
  }

  /* ---- Timer ---- */
  const stopTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  const startTimer = (seconds: number) => {
    stopTimer(); setTimeLeft(seconds);
    const tick = () => { setTimeLeft(previous => Math.max(0, previous - 1)); timerRef.current = setTimeout(tick, 1000); };
    timerRef.current = setTimeout(tick, 1000);
  };

  useEffect(() => {
    if ((!online || online.isHost) && phase === 'drawing' && timeLeft === 0) {
      if (online?.isConnected === false) return;
      stopTimer();
      saveDrawing();
      setPhase('guessing');
      setCurrentGuesser(0);
    }
  }, [timeLeft, phase]);

  /* ---- Blind mode: hide canvas after 5s ---- */
  useEffect(() => {
    if (phase === 'drawing' && mode === 'blind' && (!online || drawer?.id === online.myPlayerId)) {
      setCanvasHidden(false);
      const t = setTimeout(() => setCanvasHidden(true), 5000);
      return () => clearTimeout(t);
    }
    setCanvasHidden(false);
  }, [phase, mode]);

  /* ---- Canvas helpers ---- */
  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;
  // Uses the rect cached on pointerdown — NOT a live getBoundingClientRect().
  const posFromRect = (clientX: number, clientY: number) => {
    const c = canvasRef.current!, r = rectRef.current!;
    return { x: (clientX - r.left) * (c.width / r.width), y: (clientY - r.top) * (c.height / r.height) };
  };
  const imageSentAt = useRef(0);
  const actionRef = useRef<(name: string, ...args: unknown[]) => void>(() => {});
  const publishCanvas = () => {
    if (!canvasRef.current) return;
    const image = canvasRef.current.toDataURL();
    if (online) actionRef.current('image', image);
    else setDrawingDataURL(image);
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (online && drawer?.id !== online.myPlayerId) return;
    const c = canvasRef.current; if (!c) return;
    c.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    rectRef.current = c.getBoundingClientRect();          // measure ONCE per stroke
    const ctx = getCtx(); ctxRef.current = ctx;
    lastPos.current = posFromRect(e.clientX, e.clientY);
    if (ctx) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      paths.current.push(ctx.getImageData(0, 0, c.width, c.height));
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPos.current) return;
    const ctx = ctxRef.current ?? getCtx(); if (!ctx || !rectRef.current) return;
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = penSize;
    }
    // Draw every coalesced sample for smooth, gap-free strokes at high input rates.
    const native = e.nativeEvent;
    const samples = native.getCoalescedEvents ? native.getCoalescedEvents() : [];
    const pts = samples.length ? samples.map((s) => posFromRect(s.clientX, s.clientY)) : [posFromRect(e.clientX, e.clientY)];
    const from = lastPos.current;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    for (const p of pts) { ctx.lineTo(p.x, p.y); }
    ctx.stroke();
    const to = pts[pts.length - 1];
    ctx.globalCompositeOperation = 'source-over';
    // Mirror the stroke to BOTH the online room AND the party-cast TV channel,
    // so the drawing shows on the TV in party mode too (not only online MP).
    const seg = { from, to, size: penSize, tool, color: '#000000' };
    if (online?.isHost) online.broadcast('tv-drawing', seg);
    if (tv?.isActive) tv.broadcastTV('tv-drawing', seg);
    lastPos.current = to;
    if (Date.now() - imageSentAt.current > 180) { imageSentAt.current = Date.now(); publishCanvas(); }
  };
  const onPointerUp = () => { if (isDrawing.current) publishCanvas(); isDrawing.current = false; lastPos.current = null; };
  const clearCanvas = () => { const ctx = getCtx(); if (!ctx) return; paths.current.push(ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); };
  const undoCanvas = () => { const ctx = getCtx(); if (!ctx || !paths.current.length) return; ctx.putImageData(paths.current.pop()!, 0, 0); };
  const initCanvas = () => { const ctx = getCtx(); if (!ctx) return; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); paths.current = []; };
  const saveDrawing = () => { if (canvasRef.current) setDrawingDataURL(canvasRef.current.toDataURL()); };

  /* ---- Game flow ---- */
  function startGame() { setTotalRounds(completeDrawingRounds(totalRounds, online?.players.length ?? players.length)); setPlayers(online ? online.players.map((p, i) => ({ id: p.id, name: p.name, color: getPlayerColor(i), score: 0 })) : players.map(p => ({ ...p, score: 0 }))); deck.current = shuffle(getDRAW_WORDS()); deckPos.current = 0; setRound(1); setGuesses([]); beginRound(0); }
  // A new match keeps the roster and settings, with a fresh score table.
  function playAgain() { setPlayers(previous => previous.map(player => ({ ...player, score: 0 }))); deck.current = shuffle(getDRAW_WORDS()); deckPos.current = 0; setRound(1); setGuesses([]); gameRecordedRef.current = false; beginRound(0); }
  function beginRound(dIdx: number) { setDrawerIdx(dIdx); setCurrentWord(drawWord()); setGuesses([]); setGuessInput(''); setCurrentGuesser(0); setDrawingDataURL(null); setTool('pen'); setPenSize(6); setPhase('drawerReveal'); }
  function startDrawing() {
    setPhase('drawing'); startTimer(MODE_TIMERS[mode]);
    if (online?.isHost) {
      online.broadcast('tv-drawing', { type: 'clear' });
    }
    // Party-cast TV: clear its canvas for the new round (the tv-state for the
    // 'quickdraw' cast view flows through useTVGameBridge above).
    if (tv?.isActive) tv.broadcastTV('tv-drawing', { type: 'clear' });
  }
  function finishDrawing() {
    stopTimer(); saveDrawing(); setPhase('guessing'); setCurrentGuesser(0);
  }

  /* ---- Guessing ---- */
  function submitGuess(text = guessInput, pass = false) {
    if ((!text.trim() && !pass) || !currentWord) return;
    const correct = !pass && normalizeGuess(text) === normalizeGuess(currentWord.word);
    const guesser = guessers[currentGuesser];
    setGuesses(prev => [...prev, { playerId: guesser.id, guess: text.trim().slice(0, 200), correct }]);
    if (correct) {
      setPlayers(prev => prev.map(p => {
        if (p.id === guesser.id) return { ...p, score: p.score + 2 };
        if (p.id === drawer.id) return { ...p, score: p.score + 1 };
        return p;
      }));
    }
    setGuessInput('');
    if (currentGuesser + 1 >= guessers.length) {
      setPhase('roundResult');
    } else {
      setCurrentGuesser(prev => prev + 1);
    }
  }

  // A connected but inactive participant cannot hold the round indefinitely.
  const [guessSeconds, setGuessSeconds] = useState(30);
  useEffect(() => { setGuessSeconds(30); }, [phase, currentGuesser, round]);
  useEffect(() => {
    if ((phase !== 'guessing' && phase !== 'drawerReveal') || guessSeconds <= 0 || (online && !online.isHost)) return;
    const pending = setTimeout(() => setGuessSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(pending);
  }, [phase, guessSeconds, currentGuesser]);
  useEffect(() => {
    if (phase === 'guessing' && guessSeconds === 0 && (!online || online.isHost) && online?.isConnected !== false) submitGuess('', true);
    if (phase === 'drawerReveal' && guessSeconds === 0 && (!online || online.isHost) && online?.isConnected !== false) startDrawing();
  }, [phase, guessSeconds, online?.isConnected]);

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const result = personalResult(players, online?.myPlayerId);
      recordEnd('schnellzeichner', result.score, result.won);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  /* ---- Next round ---- */
  function nextRound() {
    if (round >= totalRounds) { setPhase('gameOver'); return; }
    setRound(r => r + 1);
    beginRound((drawerIdx + 1) % players.length);
  }

  const isDrawer = !online || drawer?.id === online.myPlayerId;
  const act = useOnlineActions(online, 'quickdraw', `${phase}:${round}:${drawerIdx}:${currentGuesser}`, {
    start: { allowed: phase === 'setup' ? 'host' : false, run: startGame },
    draw: { allowed: phase === 'drawerReveal' ? drawer?.id ?? false : false, run: startDrawing },
    image: { allowed: phase === 'drawing' ? drawer?.id ?? false : false, run: (url: unknown) => { if (typeof url === 'string' && url.startsWith('data:image/png;base64,') && url.length <= 500000) setDrawingDataURL(url); } },
    finish: { allowed: phase === 'drawing' ? drawer?.id ?? false : false, run: (url: unknown) => { if (typeof url === 'string' && url.startsWith('data:image/png;base64,') && url.length <= 500000) setDrawingDataURL(url); stopTimer(); setPhase('guessing'); setCurrentGuesser(0); } },
    guess: { allowed: phase === 'guessing' ? guessers[currentGuesser]?.id ?? false : false, run: (text: unknown) => { if (typeof text === 'string' && text.length <= 200) submitGuess(text); } },
    pass: { allowed: phase === 'guessing' ? guessers[currentGuesser]?.id ?? false : false, run: () => submitGuess('', true) },
    next: { allowed: phase === 'roundResult' ? 'host' : false, run: nextRound },
    again: { allowed: phase === 'gameOver' ? 'host' : false, run: playAgain },
  });
  actionRef.current = act;
  useOnlinePrivateSnapshot(online, 'quickdraw', { phase, players, mode, totalRounds, round, drawerIdx, currentWord, timeLeft, guessSeconds, drawingDataURL, guesses, currentGuesser }, (state, recipient) => ({ ...state, guesses: sealedGuesses(state.phase, state.guesses), currentWord: recipient === drawer?.id || state.phase === 'roundResult' || state.phase === 'gameOver' ? state.currentWord : null }), state => {
    setGuessSeconds(state.guessSeconds);
    setPhase(state.phase); setPlayers(state.players); setMode(state.mode); setTotalRounds(state.totalRounds); setRound(state.round); setDrawerIdx(state.drawerIdx); setCurrentWord(state.currentWord); setTimeLeft(state.timeLeft); setDrawingDataURL(state.drawingDataURL); setGuesses(state.guesses); setCurrentGuesser(state.currentGuesser);
  });
  useEffect(() => {
    if (!online || isDrawer || phase !== 'drawing' || !drawingDataURL) return;
    const picture = new Image(); let cancelled = false;
    picture.onload = () => { if (!cancelled) { const ctx = getCtx(); ctx?.clearRect(0, 0, 400, 400); ctx?.drawImage(picture, 0, 0, 400, 400); } };
    picture.src = drawingDataURL;
    return () => { cancelled = true; };
  }, [online?.isOnline, isDrawer, phase, drawingDataURL]);
  useEffect(() => {
    if (phase !== 'drawing' || !isDrawer) return;
    let cancelled = false;
    const pending = setTimeout(() => {
      initCanvas();
      // A reconnecting drawer restores the acknowledged canvas instead of
      // replacing the drawing with an empty canvas. Subsequent echoes must
      // never overwrite that drawer's in-progress local stroke.
      if (drawingDataURL) {
        const picture = new Image();
        picture.onload = () => { if (!cancelled) getCtx()?.drawImage(picture, 0, 0, 400, 400); };
        picture.src = drawingDataURL;
      }
    }, 50);
    return () => { cancelled = true; clearTimeout(pending); };
  }, [phase, isDrawer, round]);
  useEffect(() => { setGuessInput(''); }, [currentGuesser, round]);


  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const anyCorrect = guesses.some(g => g.correct);

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  if (online && !online.isHost && phase === 'setup') return <OnlineWaiting />;
  return (
    <GameStage gameId="quickdraw" className="sketchbook-stage">


      {/* ---- SETUP ---- */}
      {phase === 'setup' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col py-3 max-w-3xl mx-auto w-full">
          <StageHeader title={t('gameRules.quickdraw.title')} subtitle={t('games.quickdraw.tagline')} />

          {/* Players */}
          <div className="mb-6">
            <PlayerSetup locked={!!online}
              players={players.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
              onAdd={addPlayer}
              onRemove={removePlayer}
              onRename={updateName}
              onImportNames={isOnlineOrParty ? undefined : handleImportNames}
              min={2}
              max={10}
              accent="#77cbbb"
              label={t('games.quickdraw.playerLabel')}
            />
          </div>

          {/* Mode */}
          <section className="space-y-3 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/65">{t('games.quickdraw.modeLabel')}</h2>
            <div className="space-y-2">
              {MODE_IDS.map(id => (
                <button key={id} onClick={() => setMode(id)} aria-pressed={mode === id}
                  className={cn('w-full flex items-center gap-3 p-4 rounded-[1rem] border-2 transition-colors text-left',
                    mode === id ? 'border-[#77cbbb] bg-[#77cbbb]/10 text-white' : 'border-gray-700 bg-[#1b2028] text-gray-300 hover:border-gray-600')}>
                  <Pencil className={cn('w-5 h-5', mode === id ? 'text-[#77cbbb]' : 'text-white/60')} />
                  <div>
                    <div className="text-sm font-semibold">{t(`gameModes.quickdraw.${id}.name`)}</div>
                    <div className="text-xs text-white/65">{t(`gameModes.quickdraw.${id}.desc`)}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Rounds */}
          <section className="mb-6">
            <div className="bg-[#1b2028] border border-[#44484f]/20 rounded-[1rem] p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/65">{t('games.setup.rounds')}</span><span className="text-white font-bold">{totalRounds}</span>
              </div>
              <input aria-label={t('games.setup.rounds')} type="range" min={3} max={20} step={1} value={totalRounds}
                onChange={e => setTotalRounds(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-gray-700 accent-[#77cbbb] cursor-pointer" />
            </div>
          </section>

          <div className="sticky bottom-0 mt-6 border-t border-white/10 bg-[var(--stage-bg)] py-4 z-20">
            <div className="w-full mx-auto space-y-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => act('start')}
                className="w-full py-4 rounded-full bg-[#77cbbb] text-[#14221a] text-base font-extrabold font-sans uppercase tracking-wide  flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> {t('games.setup.startGame')}</motion.button>
              {/* Nur im Web. In der App macht das der FloatingBackButton. */}
              {!hasShellBackButton() && (
                <button onClick={() => navigate('/games')} className="w-full py-3 text-white/60 text-sm hover:text-white/50 transition">{t('games.quickdraw.back')}</button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- DRAWER REVEAL ---- */}
      {phase === 'drawerReveal' && currentWord && isDrawer && <div className="mx-auto flex min-h-[75dvh] w-full max-w-3xl flex-col justify-center gap-6">
        <StageHeader title={drawer.name} eyebrow={t('games.quickdraw.draws')} subtitle={t('games.quickdraw.dontLook')} progress={{ value: round, total: totalRounds }} />
        <StagePanel tone="paper" className="!rounded-sm border-l-8 !border-l-[#cec4ae] min-h-64 flex flex-col justify-center">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest">{t('games.quickdraw.yourWord')}</p>
          <h2 className="text-4xl sm:text-6xl font-black break-words leading-tight">{currentWord.word}</h2>
          <p className="mt-5 text-sm">{currentWord.category}</p>
        </StagePanel>
        <StageFooter><StageAction disabled={!act.can('draw')} onClick={() => act('draw')}><Pencil className="h-5 w-5" />{t('games.quickdraw.startDrawing')}</StageAction></StageFooter>
      </div>}

      {phase === 'drawerReveal' && !isDrawer && <StageHeader title={drawer?.name} subtitle={t('games.quickdraw.draws')} />}
      {/* ---- DRAWING ---- */}
      {phase === 'drawing' && <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
        <StageHeader title={drawer.name} eyebrow={t('games.quickdraw.draws')} trailing={<span className="text-3xl font-semibold tabular-nums">{timeLeft}s</span>} progress={{ value: timeLeft, total: MODE_TIMERS[mode] }} />
        <div className="relative mx-auto w-full max-w-2xl bg-[#f7f2e6] p-3 sm:p-5 shadow-xl border-l-8 border-[#cec4ae]">
          <div className="relative aspect-square w-full overflow-hidden bg-white">
            {canvasHidden && <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#ebe5d8] p-8 text-center text-[#283b36]"><p className="text-2xl font-bold">{t('games.quickdraw.blindActive')}</p></div>}
            <canvas ref={canvasRef} width={400} height={400} className={cn('h-full w-full', canvasHidden && 'opacity-0')} style={{ touchAction: 'none' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} />
          </div>
        </div>
        {isDrawer && <div role="toolbar" aria-label={t('games.quickdraw.startDrawing')} className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#252c2b] p-3">
          {([3, 6, 12] as PenSize[]).map(size => <button key={size} aria-label={t('games.quickdraw.penSize', { size, defaultValue: 'Pen width {{size}}' })} aria-pressed={tool === 'pen' && penSize === size} onClick={() => { setTool('pen'); setPenSize(size); }} className={cn('grid h-11 w-11 place-items-center rounded-lg border', tool === 'pen' && penSize === size ? 'border-[#77cbbb] bg-[#77cbbb]' : 'border-white/15 bg-[#f7f2e6]')}><span className="rounded-full bg-[#18221e]" style={{ width: size + 3, height: size + 3 }} /></button>)}
          <button aria-label={t('games.quickdraw.eraser', { defaultValue: 'Eraser' })} aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')} className={cn('grid h-11 w-11 place-items-center rounded-lg border', tool === 'eraser' ? 'border-[#77cbbb] bg-[#77cbbb] text-[#14221a]' : 'border-white/20')}><Eraser className="h-5 w-5" /></button>
          <button aria-label={t('games.quickdraw.undo', { defaultValue: 'Undo' })} onClick={() => { undoCanvas(); publishCanvas(); }} className="grid h-11 w-11 place-items-center rounded-lg border border-white/20"><Undo2 className="h-5 w-5" /></button>
          <button aria-label={t('games.quickdraw.clear', { defaultValue: 'Clear drawing' })} onClick={() => { clearCanvas(); publishCanvas(); }} className="grid h-11 w-11 place-items-center rounded-lg border border-white/20"><Trash2 className="h-5 w-5" /></button>
        </div>}
        <StageFooter><StageAction disabled={!act.can('finish')} onClick={() => online ? act('finish', canvasRef.current?.toDataURL()) : finishDrawing()}>{t('games.quickdraw.doneDrawing')}</StageAction></StageFooter>
      </div>}

      {/* ---- GUESSING ---- */}
      {phase === 'guessing' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center gap-5 px-4 py-6 max-w-3xl mx-auto w-full">
          <div className="px-4 py-1.5 rounded-full bg-[#1b2028] border border-[#44484f]/20">
            <span className="text-xs font-bold uppercase tracking-widest text-[#77cbbb]">{t('games.quickdraw.guessingPhase')}</span>
          </div>
          {drawingDataURL && (
            <div className="w-full max-w-2xl aspect-square border-[12px] border-[#f7f2e6] overflow-hidden bg-white shadow-lg">
              <img src={drawingDataURL} alt={t('games.quickdraw.drawingAlt')} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: guessers[currentGuesser]?.color }}>{getPlayerInitial(guessers[currentGuesser]?.name ?? '')}</div>
            <span className="text-white font-bold">{t('games.quickdraw.playerGuesses', { name: guessers[currentGuesser]?.name })}</span>
          </div>
          <div className="w-full flex gap-2">
            <input type="text" value={guessInput} onChange={e => setGuessInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && act('guess', guessInput)}
              disabled={!act.can('guess')} placeholder={t('games.quickdraw.guessPlaceholder')} className="min-w-0 flex-1 bg-[#1b2028] border border-[#44484f]/20 rounded-xl px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#77cbbb]/50" />
            <motion.button whileTap={{ scale: 0.95 }} disabled={!act.can('guess') || !guessInput.trim()} onClick={() => act('guess', guessInput)}
              className="px-5 py-3 rounded-xl bg-[#77cbbb] text-[#14221a] font-bold">OK</motion.button>
          </div>
          <div className="flex items-center gap-4"><span aria-live="polite">{guessSeconds}s</span><button className="rounded-xl border border-white/20 px-5 py-3 disabled:opacity-40" disabled={!act.can('pass')} onClick={() => act('pass')}>{t('games.quickdraw.pass', { defaultValue: 'Pass' })}</button></div>
        </motion.div>
      )}

      {/* ---- ROUND RESULT ---- */}
      {phase === 'roundResult' && currentWord && <div className="mx-auto w-full max-w-3xl space-y-6">
        <StageHeader title={currentWord.word} eyebrow={t('games.quickdraw.theWordWas')} />
        {drawingDataURL && <figure className="mx-auto max-w-xl border-[12px] border-[#f7f2e6] bg-white shadow-lg"><img src={drawingDataURL} alt={t('games.quickdraw.drawingAlt')} className="aspect-square w-full object-contain" /></figure>}
        <GuessList guesses={guesses} players={players} />
        <StageFooter><StageAction disabled={!act.can('next')} onClick={() => act('next')}>{round >= totalRounds ? t('games.quickdraw.showResults') : t('games.play.next')}<ArrowRight className="h-5 w-5" /></StageAction></StageFooter>
      </div>}
      {phase === 'gameOver' && <div className="mx-auto w-full max-w-3xl space-y-7">
        <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
        <StageHeader title={t('games.results.gameOver')} eyebrow={t('games.results.leaderboard')} />
        <ol className="divide-y divide-white/15 border-y border-white/15">{sorted.map((player, index) => <li key={player.id} className="flex items-center gap-4 py-6"><span className="text-sm tabular-nums text-[var(--stage-muted)]">{index + 1}</span><p className="min-w-0 flex-1 break-words text-xl font-semibold">{player.name}</p><strong className={player.score === sorted[0]?.score ? 'text-4xl tabular-nums text-[#77cbbb]' : 'text-4xl tabular-nums'}>{player.score}</strong></li>)}</ol>
        <StageFooter className="flex-wrap"><StageAction disabled={!act.can('again')} onClick={() => act('again')}><RotateCcw className="h-5 w-5" />{t('games.results.playAgain')}</StageAction>{!hasShellBackButton() && <StageAction variant="secondary" onClick={() => navigate('/games')}>{t('games.results.otherGame')}</StageAction>}</StageFooter>
      </div>}
      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#77cbbb" />
    </GameStage>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component                                                      */
/* ------------------------------------------------------------------ */

function GuessList({ guesses, players }: { guesses: { playerId: string; guess: string; correct: boolean }[]; players: Player[] }) {
  return (
    <div className="w-full divide-y divide-white/15">
      {guesses.map((g, i) => {
        const p = players.find(x => x.id === g.playerId);
        return (
          <div key={i} className="flex flex-wrap items-center gap-3 py-4">
            {g.correct ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            <span className="text-white/50 text-sm">{p?.name}:</span>
            <span className={cn('font-semibold text-sm', g.correct ? 'text-emerald-300' : 'text-white/60')}>{g.guess}</span>
          </div>
        );
      })}
    </div>
  );
}
