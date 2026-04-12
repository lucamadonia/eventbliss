import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameTimer } from '../engine/TimerSystem';
import { getTabooCards, type TabooCard } from '../content/taboo-words';
import { Play, SkipForward, Trophy, RotateCcw, Users, Timer, Check, X, ArrowRight, MessageCircle, Ban } from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useDrinkingMode } from '@/hooks/useDrinkingMode';
import { haptics } from '@/hooks/useHaptics';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { getActivePartySession } from "@/hooks/usePartySession";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Team { name: string; color: string; textColor: string; borderColor: string; players: string[]; score: number }
type CardResult = { card: TabooCard; result: 'correct' | 'taboo' | 'skipped' };
type Phase = 'setup' | 'turnStart' | 'playing' | 'turnSummary' | 'gameOver';

/* ------------------------------------------------------------------ */
/*  Buzzer Sound via Web Audio API                                     */
/* ------------------------------------------------------------------ */

const audioCtxRef = { current: null as AudioContext | null };
function playBuzzer() {
  try {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(200, ctx.currentTime);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  } catch { /* silent fallback */ }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Electric Pulse Styles                                              */
/* ------------------------------------------------------------------ */

const EP = `
.ep-bg { background: #0a0e14; }
.pulse-bg { background: radial-gradient(circle at center, rgba(223,142,255,0.15) 0%, rgba(10,14,20,1) 70%); }
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.neon-glow-secondary { text-shadow: 0 0 15px rgba(255,107,152,0.6); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
.ep-surface { background: #0f141a; }
.ep-container { background: #151a21; }
.ep-high { background: #1b2028; }
.ep-highest { background: #20262f; }
.timer-ring { transition: stroke-dashoffset 1s linear; }
`;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TabooGameProps { players?: string[]; onClose?: () => void; online?: OnlineGameProps }

export default function TabooGame({ players = [], onClose, online }: TabooGameProps) {
  const drinkingMode = useDrinkingMode();
  const isDrinkingMode = drinkingMode.isDrinkingMode;
  const [disclaimer, setDisclaimer] = useState<{ message: string; emoji: string } | null>(null);
  const [timerOption, setTimerOption] = useState(60);
  const [totalRounds, setTotalRounds] = useState(2);
  // Auto-populate from online room players if available
  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  const partyPlayerNames = getActivePartySession()?.players?.map(p => p.name) ?? [];
  const initialPlayers = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : players;
  const [phase, setPhase] = useState<Phase>('setup');
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const recordedRef = useRef(false);
  const [playerNames, setPlayerNames] = useState<string[]>(initialPlayers);
  const [playerInput, setPlayerInput] = useState('');
  const [teams, setTeams] = useState<[Team, Team]>(buildTeams(initialPlayers));
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [explainerIdx, setExplainerIdx] = useState<[number, number]>([0, 0]);
  const [currentRound, setCurrentRound] = useState(1);
  const deck = useRef<TabooCard[]>(shuffle(getTabooCards()));
  const deckPos = useRef(0);
  const [currentCard, setCurrentCard] = useState<TabooCard | null>(null);
  const [turnResults, setTurnResults] = useState<CardResult[]>([]);
  const [cardKey, setCardKey] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const activeTeam = teams[activeTeamIdx];
  const explainer = activeTeam.players[explainerIdx[activeTeamIdx]];

  useTVGameBridge('taboo', { phase, currentRound, teams, activeTeamIdx, explainer }, [phase, currentRound, activeTeamIdx]);

  const handleTimerExpire = useCallback(() => { setPhase('turnSummary'); }, []);
  const timer = useGameTimer(timerOption, handleTimerExpire);

  function buildTeams(pls: string[]): [Team, Team] {
    const s = shuffle(pls); const mid = Math.ceil(s.length / 2);
    return [
      { name: 'Team A', color: 'bg-[#df8eff]', textColor: 'text-[#df8eff]', borderColor: 'border-[#df8eff]', players: s.slice(0, mid), score: 0 },
      { name: 'Team B', color: 'bg-[#8ff5ff]', textColor: 'text-[#8ff5ff]', borderColor: 'border-[#8ff5ff]', players: s.slice(mid), score: 0 },
    ];
  }

  function addPlayer() {
    const name = playerInput.trim();
    if (!name || playerNames.includes(name)) return;
    const next = [...playerNames, name];
    setPlayerNames(next);
    setTeams(buildTeams(next));
    setPlayerInput('');
  }

  function removePlayer(name: string) {
    const next = playerNames.filter(n => n !== name);
    setPlayerNames(next);
    setTeams(buildTeams(next));
  }

  const canStart = teams[0].players.length >= 1 && teams[1].players.length >= 1;

  function drawCard(): TabooCard {
    if (deckPos.current >= deck.current.length) { deck.current = shuffle(getTabooCards()); deckPos.current = 0; }
    return deck.current[deckPos.current++];
  }

  function startTurn() { setTurnResults([]); setCountdown(3); }

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null); setCurrentCard(drawCard()); setCardKey(k => k + 1); timer.reset(timerOption); timer.start(); setPhase('playing');
      if (online?.isHost) {
        online.broadcast('tv-state', {
          game: 'taboo', phase: 'playing', teamA: teams[0].score, teamB: teams[1].score,
          activeTeam: activeTeam.name, explainer, timeLeft: timerOption,
          round: currentRound, totalRounds,
        });
      }
      return;
    }
    const t = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  function handleCorrect() {
    if (!currentCard) return;
    setTurnResults(r => [...r, { card: currentCard, result: 'correct' }]);
    const next = drawCard(); setCurrentCard(next); setCardKey(k => k + 1);
    if (online?.isHost) {
      online.broadcast('tv-state', {
        game: 'taboo', phase: 'playing', teamA: teams[0].score, teamB: teams[1].score,
        activeTeam: activeTeam.name, explainer, timeLeft: timer.timeLeft,
        round: currentRound, totalRounds,
      });
    }
  }

  function handleTaboo() {
    if (!currentCard) return;
    playBuzzer(); navigator.vibrate?.([300]);
    setShowFlash(true); setTimeout(() => setShowFlash(false), 350);
    setTurnResults(r => [...r, { card: currentCard, result: 'taboo' }]); setCurrentCard(drawCard()); setCardKey(k => k + 1);
    if (isDrinkingMode) {
      const d = drinkingMode.recordDrink();
      if (d) {
        setTimeout(() => {
          haptics.warning();
          setDisclaimer(d);
          setTimeout(() => setDisclaimer(null), 5000);
        }, 600);
      }
    }
  }

  function handleSkip() {
    if (!currentCard) return;
    setTurnResults(r => [...r, { card: currentCard, result: 'skipped' }]);
    const next = drawCard(); setCurrentCard(next); setCardKey(k => k + 1);
    if (online?.isHost) {
      online.broadcast('tv-state', {
        game: 'taboo', phase: 'playing', teamA: teams[0].score, teamB: teams[1].score,
        activeTeam: activeTeam.name, explainer, timeLeft: timer.timeLeft,
        round: currentRound, totalRounds,
      });
    }
  }

  function endTurn() {
    timer.pause();
    const correct = turnResults.filter(r => r.result === 'correct').length;
    const taboo = turnResults.filter(r => r.result === 'taboo').length;
    const points = correct - taboo;
    setTeams(prev => { const c: [Team, Team] = [{ ...prev[0] }, { ...prev[1] }]; c[activeTeamIdx].score += points; return c; });
    setExplainerIdx(prev => { const c: [number, number] = [...prev]; c[activeTeamIdx] = (c[activeTeamIdx] + 1) % teams[activeTeamIdx].players.length; return c; });
    const nextTeamIdx = activeTeamIdx === 0 ? 1 : 0;
    if (nextTeamIdx === 0) { if (currentRound >= totalRounds) { setPhase('gameOver'); return; } setCurrentRound(r => r + 1); }
    setActiveTeamIdx(nextTeamIdx); setPhase('turnStart');
  }

  useEffect(() => {
    if (phase === 'gameOver' && !recordedRef.current) {
      recordedRef.current = true;
      const winnerScore = Math.max(teams[0].score, teams[1].score);
      recordEnd('taboo', winnerScore, true);
    }
    if (phase === 'setup') recordedRef.current = false;
  }, [phase]);

  function resetGame() {
    setTeams(buildTeams(players)); setActiveTeamIdx(0); setExplainerIdx([0, 0]); setCurrentRound(1);
    setTurnResults([]); setCurrentCard(null); deck.current = shuffle(getTabooCards()); deckPos.current = 0; timer.reset(timerOption); setPhase('setup');
  }

  /* ---- Online: host broadcasts game state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, activeTeamIdx, explainerIdx, currentRound, totalRounds,
      teams: teams.map(t => ({ name: t.name, score: t.score, players: t.players })),
      timeLeft: timer.timeLeft,
      currentCard: currentCard ? { term: currentCard.term, forbidden: currentCard.forbidden } : null,
    });
  }, [phase, activeTeamIdx, currentRound, teams, timer.timeLeft, online]);

  /* ---- Online: non-host syncs state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as Phase);
      if (data.activeTeamIdx !== undefined) setActiveTeamIdx(data.activeTeamIdx as number);
      if (data.currentRound) setCurrentRound(data.currentRound as number);
      if (data.teams) {
        const incoming = data.teams as { name: string; score: number; players: string[] }[];
        setTeams(prev => [
          { ...prev[0], score: incoming[0].score, players: incoming[0].players },
          { ...prev[1], score: incoming[1].score, players: incoming[1].players },
        ]);
      }
      if (data.currentCard) setCurrentCard(data.currentCard as TabooCard);
    });
  }, [online]);

  /* ---- Online: determine if it's my turn ---- */
  const isMyTurn = !online || online.isHost || (() => {
    const myIdx = online.players.findIndex(p => p.id === online.myPlayerId);
    return myIdx === activeTeamIdx;
  })();

  const mvp = useMemo(() => { const w = teams[0].score >= teams[1].score ? teams[0] : teams[1]; return w.players[0] ?? 'Unbekannt'; }, [teams]);
  const turnCorrect = turnResults.filter(r => r.result === 'correct').length;
  const turnTaboo = turnResults.filter(r => r.result === 'taboo').length;
  const turnSkipped = turnResults.filter(r => r.result === 'skipped').length;

  const circumference = 2 * Math.PI * 40;
  const timerDash = circumference - (circumference * timer.percentLeft) / 100;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="relative min-h-[100dvh] ep-bg text-[#f1f3fc] flex flex-col overflow-hidden">
      <style>{EP}</style>

      {/* Ambient blur orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#df8eff]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#ff6b98]/8 rounded-full blur-[120px]" />
      </div>

      {/* TABOO flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: isDrinkingMode ? 0.6 : 0.35 }}
            className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none flex-col gap-3 ${isDrinkingMode ? 'bg-amber-500/60' : 'bg-[#ff6b98]/70'}`}>
            <motion.span initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 0.35 }}
              className="text-7xl font-black text-white neon-glow-secondary italic tracking-tight">
              {isDrinkingMode ? '\uD83C\uDF7A Trinken!' : 'TABU!'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer banner — appears when drink threshold is hit */}
      <AnimatePresence>
        {disclaimer && (
          <motion.div
            className="fixed bottom-24 left-0 right-0 z-50 mx-6 px-5 py-3 rounded-2xl bg-amber-900/40 border border-amber-500/30 backdrop-blur text-center"
            initial={{ y: 30, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
          >
            <span className="text-2xl">{disclaimer.emoji}</span>
            <p className="text-sm text-amber-200 font-semibold mt-1">{disclaimer.message}</p>
            <p className="text-[10px] text-amber-300/50 mt-1">
              Drink #{drinkingMode.drinkCount} · Bitte trinkt verantwortungsvoll
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- SETUP ---- */}
      {phase === 'setup' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex-1 flex flex-col px-4 py-8 pb-32 max-w-lg mx-auto w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl ep-high border border-[#df8eff]/20 mb-4">
              <MessageCircle className="w-8 h-8 text-[#df8eff]" />
            </div>
            <h1 className="text-3xl font-black italic tracking-tight text-[#df8eff] neon-glow">WORTVERBOT</h1>
            <p className="text-[#a8abb3] text-sm mt-2 max-w-xs mx-auto">Erklaere Begriffe, ohne die verbotenen Woerter zu verwenden!</p>
          </div>
          {/* Player input */}
          <div className="glass-card border border-[#44484f]/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#df8eff]/70" />
              <span className="text-xs font-semibold text-[#a8abb3] uppercase tracking-wider">Spieler ({playerNames.length})</span>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPlayer(); } }}
                placeholder="Name eingeben..."
                maxLength={20}
                className="flex-1 px-3 py-2 rounded-full bg-[#f1f3fc]/[0.06] border border-[#44484f]/30 text-sm text-[#f1f3fc] placeholder:text-[#a8abb3]/50 focus:outline-none focus:border-[#df8eff]/50"
              />
              <button
                type="button"
                onClick={addPlayer}
                disabled={!playerInput.trim()}
                className="px-4 py-2 rounded-full bg-[#df8eff] text-[#0a0e14] text-xs font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(223,142,255,0.4)] transition-shadow"
              >
                +
              </button>
            </div>
            {playerNames.length === 0 && (
              <p className="text-xs text-[#a8abb3]/60 text-center">Mindestens 2 Spieler hinzufuegen (1 pro Team)</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {teams.map((t, i) => (
              <div key={i} className={`rounded-2xl glass-card border p-4 ${i === 0 ? 'border-[#df8eff]/20' : 'border-[#8ff5ff]/20'}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${i === 0 ? 'text-[#df8eff]' : 'text-[#8ff5ff]'}`}>{t.name}</div>
                <div className="space-y-1.5">{t.players.length === 0 ? (
                  <div className="text-xs text-[#a8abb3]/40 italic">Leer</div>
                ) : t.players.map(p => (
                  <div key={p} className="flex items-center justify-between gap-2 group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-[#df8eff]' : 'bg-[#8ff5ff]'}`} />
                      <span className="text-sm text-[#f1f3fc]/70 truncate">{p}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlayer(p)}
                      className="text-[#a8abb3]/40 hover:text-[#ff6b98] transition-colors flex-shrink-0"
                      aria-label={`${p} entfernen`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass-card border border-[#44484f]/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3"><Timer className="w-4 h-4 text-[#df8eff]/70" /><span className="text-xs font-semibold text-[#a8abb3] uppercase tracking-wider">Zeit</span></div>
              <div className="flex flex-col gap-1.5">{[60, 90, 120].map(s => (
                <button key={s} onClick={() => setTimerOption(s)}
                  className={`py-2 rounded-full text-xs font-bold transition-all ${timerOption === s ? 'bg-[#df8eff] text-[#0a0e14] shadow-[0_0_12px_rgba(223,142,255,0.4)]' : 'bg-[#f1f3fc]/[0.06] text-[#a8abb3] hover:bg-[#f1f3fc]/10'}`}>{s}s</button>
              ))}</div>
            </div>
            <div className="glass-card border border-[#44484f]/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3"><RotateCcw className="w-4 h-4 text-[#df8eff]/70" /><span className="text-xs font-semibold text-[#a8abb3] uppercase tracking-wider">Runden</span></div>
              <div className="flex flex-col gap-1.5">{[1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => setTotalRounds(r)}
                  className={`py-2 rounded-full text-xs font-bold transition-all ${totalRounds === r ? 'bg-[#df8eff] text-[#0a0e14] shadow-[0_0_12px_rgba(223,142,255,0.4)]' : 'bg-[#f1f3fc]/[0.06] text-[#a8abb3] hover:bg-[#f1f3fc]/10'}`}>{r}</button>
              ))}</div>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14] to-transparent z-20">
            <div className="max-w-lg mx-auto space-y-3">
              <motion.button
                whileTap={canStart ? { scale: 0.97 } : undefined}
                onClick={() => canStart && setPhase('turnStart')}
                disabled={!canStart}
                className={`w-full py-4 rounded-full text-base font-black italic uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
                  canStart
                    ? 'bg-gradient-to-r from-[#df8eff] to-[#b44dff] text-[#0a0e14] shadow-[0_0_30px_rgba(223,142,255,0.3)]'
                    : 'bg-[#f1f3fc]/[0.06] text-[#a8abb3]/40 cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5" />
                {canStart ? 'Spiel starten' : 'Spieler hinzufuegen'}
              </motion.button>
              {onClose && <button onClick={onClose} className="w-full py-3 text-[#a8abb3]/50 text-sm hover:text-[#a8abb3] transition">Zurueck</button>}
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- TURN START ---- */}
      {phase === 'turnStart' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-4 pulse-bg">
          <ActivePlayerBanner
            playerName={explainer}
            subtitle="erklaert!"
            hidden={false}
          />
          <div className="px-4 py-1.5 rounded-full glass-card border border-[#44484f]/30">
            <span className={`text-xs font-bold uppercase tracking-widest ${activeTeam.textColor}`}>Runde {currentRound} / {totalRounds}</span>
          </div>
          <h2 className="text-2xl font-black italic tracking-tight text-[#f1f3fc]">{activeTeam.name} ist dran!</h2>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-card border border-[#44484f]/30">
            <Users className="w-4 h-4 text-[#a8abb3]" />
            <span className="font-semibold text-[#f1f3fc]/70">{explainer}</span>
            <span className="text-[#a8abb3] text-sm">erklaert</span>
          </div>
          <NeonScoreBar teams={teams} />
          {countdown !== null ? (
            <motion.div key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              className="text-8xl font-black italic text-[#df8eff] neon-glow">{countdown}</motion.div>
          ) : (
            <motion.button whileTap={{ scale: 0.97 }} onClick={startTurn}
              className="mt-2 flex items-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#b44dff] text-[#0a0e14] px-8 py-3 rounded-full font-black italic text-lg shadow-[0_0_25px_rgba(223,142,255,0.3)]">
              <Play className="w-5 h-5" /> Los geht's!
            </motion.button>
          )}
        </motion.div>
      )}

      {/* ---- PLAYING ---- */}
      {phase === 'playing' && currentCard && (
        <div className="relative z-10 flex-1 flex flex-col pulse-bg">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0a0e14]/40 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#df8eff]" />
              <span className={`text-lg font-mono font-bold ${timer.timeLeft <= 10 ? 'text-[#ff6e84] animate-pulse' : 'text-[#f1f3fc]/80'}`}>{timer.timeLeft}s</span>
            </div>
            <span className="text-sm font-black italic text-[#df8eff] drop-shadow-[0_0_10px_rgba(223,142,255,0.4)]">WORTVERBOT</span>
            <NeonScoreBar teams={teams} compact />
          </div>

          {/* Timer SVG circle - top right */}
          <div className="absolute top-16 right-4 z-20">
            <svg width="56" height="56" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#1b2028" strokeWidth="6" />
              <circle cx="48" cy="48" r="40" fill="none" stroke={timer.timeLeft <= 10 ? '#ff6e84' : '#df8eff'} strokeWidth="6"
                strokeDasharray={circumference} strokeDashoffset={timerDash} strokeLinecap="round"
                transform="rotate(-90 48 48)" className="timer-ring" style={{ filter: `drop-shadow(0 0 6px ${timer.timeLeft <= 10 ? 'rgba(255,110,132,0.6)' : 'rgba(223,142,255,0.5)'})` }} />
              <text x="48" y="52" textAnchor="middle" fill="#f1f3fc" fontSize="20" fontWeight="900" fontFamily="monospace">{timer.timeLeft}</text>
            </svg>
          </div>

          {/* Main word display */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <AnimatePresence mode="wait">
              <motion.div key={cardKey} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}
                className="w-full max-w-sm flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8ff5ff] mb-3">Aktuelles Wort</span>
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter italic text-[#df8eff] neon-glow text-center uppercase leading-none mb-8">
                  {currentCard.term}
                </h2>
                {/* Forbidden words */}
                <div className="w-full flex flex-col gap-2">
                  {currentCard.forbidden.map((word, i) => (
                    <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 - i * 0.15 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between bg-[#0f141a]/60 rounded-full border-l-4 border-[#ff6b98] px-5 py-2.5">
                      <span className="font-bold text-lg text-[#f1f3fc]/90">{word}</span>
                      <Ban className="w-4 h-4 text-[#ff6b98]" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Score pill at bottom */}
          <div className="flex justify-center mb-2">
            <div className="glass-card rounded-full px-5 py-2 flex items-center gap-3 border border-[#44484f]/20">
              <span className="text-sm font-bold text-[#8ff5ff]">{turnCorrect} Richtig</span>
              <div className="w-px h-4 bg-[#44484f]" />
              <span className="text-sm font-bold text-[#ff6e84]">{turnTaboo + turnSkipped} Skip</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3 px-4 pb-6 pt-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleTaboo}
              className="col-span-1 relative flex flex-col items-center justify-center gap-1 bg-[#ff6b98] rounded-2xl py-4 font-black text-base text-white shadow-[0_0_20px_rgba(255,107,152,0.4)] active:scale-95 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <X className="w-6 h-6" /><span className="text-xs">TABU!</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSkip}
              className="col-span-1 flex flex-col items-center justify-center gap-1 bg-[#1b2028] border border-[#44484f]/40 rounded-2xl py-4 text-[#a8abb3] active:scale-95 transition-all">
              <SkipForward className="w-6 h-6" /><span className="text-xs font-bold">SKIP</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleCorrect}
              className="col-span-1 relative flex flex-col items-center justify-center gap-1 bg-[#00deec] rounded-2xl py-4 font-black text-base text-white shadow-[0_0_20px_rgba(0,222,236,0.4)] active:scale-95 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <Check className="w-6 h-6" /><span className="text-xs">RICHTIG</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* ---- TURN SUMMARY ---- */}
      {phase === 'turnSummary' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex-1 flex flex-col items-center gap-5 px-4 py-8 max-w-lg mx-auto w-full pulse-bg overflow-y-auto">
          <div className="mt-4">
            <h2 className="text-3xl font-black italic tracking-tight text-center">
              <span className="text-[#df8eff] neon-glow">RUNDE</span>{' '}
              <span className="text-[#f1f3fc]">Beendet!</span>
            </h2>
          </div>
          <div className={`px-5 py-2 rounded-full glass-card border ${activeTeamIdx === 0 ? 'border-[#df8eff]/30' : 'border-[#8ff5ff]/30'}`}>
            <span className={`text-sm font-bold ${activeTeam.textColor}`}>{activeTeam.name}</span>
          </div>
          {/* Score board */}
          <div className="w-full glass-card rounded-2xl border border-[#44484f]/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#a8abb3] text-sm font-semibold">Punkte diese Runde</span>
              <span className={`text-2xl font-black ${turnCorrect - turnTaboo >= 0 ? 'text-[#8ff5ff]' : 'text-[#ff6e84]'}`}>
                {turnCorrect - turnTaboo >= 0 ? '+' : ''}{turnCorrect - turnTaboo}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0f141a] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, turnCorrect * 20)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#df8eff] to-[#8ff5ff]" />
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1 text-center"><div className="text-2xl font-black text-[#8ff5ff]">{turnCorrect}</div><div className="text-xs text-[#a8abb3]">Richtig</div></div>
              <div className="flex-1 text-center"><div className="text-2xl font-black text-[#ff6e84]">{turnTaboo}</div><div className="text-xs text-[#a8abb3]">Tabu</div></div>
              <div className="flex-1 text-center"><div className="text-2xl font-black text-[#a8abb3]/40">{turnSkipped}</div><div className="text-xs text-[#a8abb3]">Skip</div></div>
            </div>
          </div>
          {/* Word protocol */}
          <div className="w-full max-h-48 overflow-y-auto space-y-1.5">
            {turnResults.map((r, i) => (
              <div key={i} className="flex items-center gap-3 glass-card border border-[#44484f]/10 rounded-xl px-4 py-2.5 text-sm">
                {r.result === 'correct' && <Check className="w-4 h-4 text-[#8ff5ff] shrink-0" />}
                {r.result === 'taboo' && <X className="w-4 h-4 text-[#ff6e84] shrink-0" />}
                {r.result === 'skipped' && <ArrowRight className="w-4 h-4 text-[#a8abb3]/40 shrink-0" />}
                <span className={`${r.result === 'taboo' ? 'line-through text-[#f1f3fc]/40' : 'text-[#f1f3fc]/80'}`}>{r.card.term}</span>
                <span className={`ml-auto text-xs font-bold ${r.result === 'correct' ? 'text-[#8ff5ff]' : r.result === 'taboo' ? (isDrinkingMode ? 'text-amber-400' : 'text-[#ff6e84]') : 'text-[#a8abb3]/40'}`}>
                  {r.result === 'correct'
                    ? (isDrinkingMode ? '\uD83C\uDF89 Prost!' : '+1')
                    : r.result === 'taboo'
                      ? (isDrinkingMode ? '\uD83C\uDF7A Trinken!' : '-1')
                      : '0'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full space-y-3 mt-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={endTurn}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#b44dff] text-[#0a0e14] px-8 py-4 rounded-full font-black italic text-base shadow-[0_0_25px_rgba(223,142,255,0.3)]">
              Naechste Runde <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ---- GAME OVER ---- */}
      {phase === 'gameOver' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 max-w-lg mx-auto w-full pulse-bg">
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#df8eff]/10 border border-[#df8eff]/20">
              <Trophy className="w-8 h-8 text-[#df8eff]" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-black italic tracking-tight text-[#df8eff] neon-glow">SPIELENDE!</h2>
          {teams[0].score !== teams[1].score ? (
            <div className={`px-6 py-2 rounded-full glass-card border text-lg font-bold ${teams[0].score > teams[1].score ? 'border-[#df8eff]/30 text-[#df8eff]' : 'border-[#8ff5ff]/30 text-[#8ff5ff]'}`}>
              {teams[0].score > teams[1].score ? teams[0].name : teams[1].name} gewinnt!
            </div>
          ) : (
            <div className="px-6 py-2 rounded-full glass-card border border-[#44484f] text-lg font-bold text-[#a8abb3]">Unentschieden!</div>
          )}
          <div className="flex gap-6 w-full max-w-xs">
            {teams.map((t, i) => (
              <div key={i} className={`flex-1 p-4 rounded-2xl glass-card border text-center ${i === 0 ? 'border-[#df8eff]/20' : 'border-[#8ff5ff]/20'}
                ${(teams[0].score > teams[1].score && i === 0) || (teams[1].score > teams[0].score && i === 1) ? 'shadow-[0_0_20px_rgba(223,142,255,0.15)]' : ''}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${t.textColor}`}>{t.name}</div>
                <div className="text-4xl font-black text-[#f1f3fc]">{t.score}</div>
              </div>
            ))}
          </div>
          <div className="text-sm text-[#a8abb3]">MVP: <span className="text-[#f1f3fc] font-semibold">{mvp}</span></div>
          <div className="w-full space-y-3 mt-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={resetGame}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#b44dff] text-[#0a0e14] py-4 rounded-full font-black italic text-base shadow-[0_0_25px_rgba(223,142,255,0.3)]">
              <RotateCcw className="w-4 h-4" /> Nochmal
            </motion.button>
            {onClose && (
              <button onClick={onClose} className="w-full py-3.5 rounded-full border border-[#44484f] text-[#a8abb3] text-sm font-semibold hover:bg-[#f1f3fc]/[0.04] transition-colors">
                Anderes Spiel
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Neon Score Bar                                                     */
/* ------------------------------------------------------------------ */

function NeonScoreBar({ teams, compact }: { teams: [Team, Team]; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-full glass-card border border-[#44484f]/20 ${compact ? '' : 'mt-2'}`}>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#df8eff] shadow-[0_0_6px_rgba(223,142,255,0.5)]" />
        <span className={`${compact ? 'text-sm' : 'text-base'} font-bold text-[#df8eff]`}>{teams[0].score}</span>
      </div>
      <span className="text-[#44484f] text-xs">vs</span>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#8ff5ff] shadow-[0_0_6px_rgba(143,245,255,0.5)]" />
        <span className={`${compact ? 'text-sm' : 'text-base'} font-bold text-[#8ff5ff]`}>{teams[1].score}</span>
      </div>
    </div>
  );
}
