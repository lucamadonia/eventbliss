import { BottleObject } from './BottleObject';
import { BottleContentSelection } from './ContentSelection';
import { createBottleDeck, filterBottleCards, type ContentSelection } from './deck';
import { GameStage } from '../ui/GameStage';
import './design.css';
import { toggleSelectedCategory } from './category-selection';
import { usePausableTasks } from '../bottlespin/pausable-tasks';
import { useOnlineActions, useOnlineSnapshot, OnlineWaiting } from '../bottlespin/online-controller';
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, Timer, Sparkles, Zap, MessageCircle, Wine } from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { haptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { getTranslatedModes } from '../ui/getTranslatedModes';
import { useGameTimer } from '../engine/TimerSystem';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { bottleActiveSeat, dropBottlePlayers } from './guest-turns';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { getBOTTLE_CARDS, getCATEGORY_META, localizeBottleCard, type BottleCard, type BottleCategory } from './bottlespin-content';
import { useConfirmExit, ConfirmExitDialog } from "@/games/ui/useConfirmExit";
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { neonStyles, playStopSound } from './bottle-styles';
import { BottleVote, BottleGameOver } from './BottlePanels';

type Phase = 'setup' | 'spinning' | 'card' | 'vote' | 'gameOver';
interface Player { id: string; name: string; color: string; avatar: string; score: number; }

const PLAYER_COLORS = ['#e6b880','#ff6b98','#91b8a1','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];
const GAME_MODES: GameMode[] = [
  { id: 'fragen', name: 'Mit Fragen', desc: 'Flasche + Fragen & Aufgaben', icon: <MessageCircle className="w-6 h-6" /> },
  { id: 'nur-flasche', name: 'Nur Flasche', desc: 'Reines Flaschendrehen', icon: <Wine className="w-6 h-6" /> },
];

const RADIUS = 130;

function BottleSpinGameContent({ online }: { online?: OnlineGameProps } = {}) {
  const reduceMotion = useReducedMotion();
  const { setTimeout, clearTimeout } = usePausableTasks(online?.isConnected !== false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // Confirm before leaving mid-round (accidental back tap during active play).
  const exitGuard = useConfirmExit(() => navigate('/games'));
  const setupSettings: SettingsConfig = useMemo(() => ({
    timer: { min: 15, max: 60, default: 30, step: 5, label: t('games.bottlespin.setupTimerLabel') },
    rounds: { min: 5, max: 50, default: 15, step: 1, label: t('games.bottlespin.setupRoundsLabel') },
  }), [t]);
  const [phase, setPhase] = useState<Phase>('setup');

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste)
  // liegt über dem Pfeil im Spiel und läuft nicht über dessen onClick.
  // Ohne Eintrag im Back-Guard-Stapel navigiert er mitten in der Runde weg und
  // die Partie ist futsch. Delegiert bewusst an denselben `exitGuard` wie der
  // Pfeil, damit es genau EINEN Bestätigungsdialog gibt.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [mode, setMode] = useState('fragen');
  const [timerSec, setTimerSec] = useState(30);
  const [totalRounds, setTotalRounds] = useState(15);
  const [currentRound, setCurrentRound] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<BottleCategory[]>(['spass', 'party', 'eisbrecher']);
  const [contentSelection, setContentSelection] = useState<ContentSelection>('mixed');
  const [contentReady, setContentReady] = useState(false);
  useEffect(() => {
    if (phase !== 'setup' || (online && !online.isHost)) return;
    const available = new Set(getBOTTLE_CARDS().map(card => card.category));
    setSelectedCategories(previous => {
      const retained = previous.filter(category => available.has(category));
      return retained.length === previous.length ? previous : retained.length ? retained : ['eisbrecher'];
    });
  }, [i18n.language, phase, online?.isHost]);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const lastSelectedRef = useRef(-1);
  const [currentCard, setCurrentCard] = useState<BottleCard | null>(null);
  const [declined, setDeclined] = useState(false);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [voterIdx, setVoterIdx] = useState(0);

  // 🔁 guests play their turn/vote on the host phone; the clock stands while it is passed.
  const handover = useSeatHandover(online, bottleActiveSeat(phase, players, selectedIdx, voterIdx));
  useTVGameBridge(
    'bottlespin',
    {
      handover: handover.tv,
      phase, currentRound, selectedIdx, rotation, players, mode, totalRounds,
      selectedName: selectedIdx >= 0 ? players[selectedIdx]?.name ?? '' : '',
      // Task text stays hidden until the card phase (and lingers through the vote).
      task: (phase === 'card' || phase === 'vote') ? (currentCard?.text ?? '') : '',
      taskId: (phase === 'card' || phase === 'vote') ? currentCard?.id : undefined,
      taskType: currentCard?.type ?? '',
      // Live yes/no tally for the vote-distribution bar (only meaningful in 'vote').
      voteYes: Object.values(votes).filter(Boolean).length,
      voteNo: Object.values(votes).filter((v) => !v).length,
    },
    [phase, currentRound, selectedIdx, votes, handover.tv?.playerId], !online || online.isHost);

  // The host freezes the selected language/content at match start, including replay.
  const matchCards = useRef<BottleCard[]>([]);
  const deck = useRef(createBottleDeck([]));

  const handleTimerExpire = useCallback(() => { if ((!online || online.isHost) && phase === 'card') startVote(); }, [phase, online?.isHost]);
  const timer = useGameTimer(timerSec, handleTimerExpire, online?.isConnected !== false && !handover.isPaused);

  const handleStart = (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string, settings: { timer: number; rounds: number },
  ) => {
    const selected = filterBottleCards(getBOTTLE_CARDS(), selectedCategories, contentSelection);
    if (selectedMode !== 'nur-flasche' && !selected.length) { setContentReady(false); return; }
    matchCards.current = selected;
    deck.current = createBottleDeck(selected);
    setPlayers(mapped.map((p, i) => ({ ...p, color: PLAYER_COLORS[i % PLAYER_COLORS.length], score: 0 })));
    setMode(selectedMode); setTimerSec(settings.timer); setTotalRounds(settings.rounds);
    setCurrentRound(1); setSelectedIdx(-1); lastSelectedRef.current = -1;
    setPhase('spinning');
  };

  const doSpin = () => {
    if (isSpinning || players.length < 2) return;
    setIsSpinning(true); setSelectedIdx(-1);
    const available = players.map((_, i) => i).filter((i) => i !== lastSelectedRef.current);
    const targetIdx = available[Math.floor(Math.random() * available.length)];
    const sliceAngle = 360 / players.length;
    const targetAngle = targetIdx * sliceAngle;
    const extraSpins = (Math.floor(Math.random() * 4) + 3) * 360;
    // Point the bottle neck (top = 0°) directly at the target player.
    // Players are laid out starting at -π/2 (top), so player 0 = 0°, player 1 = sliceAngle°, etc.
    // We need the final rotation to land with the neck pointing at targetAngle.
    const currentNormalized = rotation % 360;
    const finalAngle = rotation - currentNormalized + extraSpins + targetAngle;
    setRotation(finalAngle);
    setTimeout(() => {
      setIsSpinning(false); setSelectedIdx(targetIdx); lastSelectedRef.current = targetIdx;
      playStopSound();
      haptics.success();
      try { navigator.vibrate?.([80, 40, 80]); } catch { /* */ }
      if (mode !== 'nur-flasche') setTimeout(() => showCard(), 600);
    }, reduceMotion ? 150 : 3200);
  };

  const showCard = () => {
    const card = deck.current.draw();
    if (!card) { setPhase('setup'); setContentReady(false); return; }
    setCurrentCard(card); setDeclined(false);
    if (card.type === 'aufgabe') { timer.reset(timerSec); timer.start(); }
    setPhase('card');
  };

  const awardPoints = (pts: number) => {
    if (selectedIdx < 0) return;
    setPlayers((prev) => prev.map((p, i) => i === selectedIdx ? { ...p, score: p.score + pts } : p));
  };

  const nextRound = () => {
    timer.pause();
    if (currentRound >= totalRounds) { setPhase('gameOver'); return; }
    setCurrentRound((r) => r + 1); setCurrentCard(null); setSelectedIdx(-1); setPhase('spinning');
  };

  const handleAccept = () => {
    if (currentCard?.type === 'aufgabe') { startVote(); } else { awardPoints(1); nextRound(); }
  };
  const handleDecline = () => { setDeclined(true); awardPoints(-1); timer.pause(); setTimeout(nextRound, 800); };

  function startVote() { setVotes({}); setVoterIdx(0); timer.pause(); setPhase('vote'); }

  const castVote = (yes: boolean) => {
    const otherPlayers = players.filter((_, i) => i !== selectedIdx);
    const voter = otherPlayers[voterIdx];
    if (!voter) return;
    const newVotes = { ...votes, [voter.id]: yes }; setVotes(newVotes);
    if (voterIdx + 1 >= otherPlayers.length) {
      const yesCount = Object.values(newVotes).filter(Boolean).length;
      awardPoints(yesCount > otherPlayers.length / 2 ? 2 : 0); nextRound();
    } else { setVoterIdx((v) => v + 1); }
  };

  // Host: a removed player leaves the circle; their turn is skipped, a pending vote closes without them.
  const removedKey = online?.removedPlayerIds?.join(',') ?? '';
  useEffect(() => {
    if (!online?.isHost) return;
    const drop = dropBottlePlayers(players, selectedIdx, voterIdx, online.removedPlayerIds ?? []);
    if (!drop) return;
    const chosen = players[selectedIdx]?.id, others = drop.players.filter(p => p.id !== chosen), yes = others.filter(p => votes[p.id]).length;
    const pts = drop.votingDone && phase === 'vote' ? (yes > others.length / 2 ? 2 : 0) : 0;
    setPlayers(drop.players.map(p => p.id === chosen ? { ...p, score: p.score + pts } : p)); lastSelectedRef.current = -1; setSelectedIdx(drop.selectedIdx); setVoterIdx(drop.voterIdx);
    if ((drop.skipTurn && (phase === 'card' || phase === 'vote')) || (drop.votingDone && phase === 'vote')) nextRound();
  }, [removedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextRoundBottleOnly = () => {
    if (currentRound >= totalRounds) { setPhase('gameOver'); return; }
    setCurrentRound((r) => r + 1); setSelectedIdx(-1); setPhase('spinning');
  };

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players.find(p => p.id === online.myPlayerId) : winner;
      recordEnd('flaschendrehen', me?.score ?? 0, mode !== 'nur-flasche' && !!me && me.score === Math.max(...players.map(p => p.score)));
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  // Rematch retains the selected content, resets scores, and starts a fresh shuffled deck.
  const playAgain = () => {
    setCurrentRound(1);
    setSelectedIdx(-1); lastSelectedRef.current = -1;
    setCurrentCard(null); setDeclined(false);
    setVotes({}); setVoterIdx(0);
    deck.current = createBottleDeck(matchCards.current);
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    gameRecordedRef.current = false;
    timer.reset(timerSec);
    setPhase('spinning');
  };

  const winner = useMemo(() => [...players].sort((a, b) => b.score - a.score)[0], [players]);
  const selectedPlayer = selectedIdx >= 0 ? players[selectedIdx] : null;

  const toggleCategory = (cat: BottleCategory) => {
    setSelectedCategories((prev) => toggleSelectedCategory(prev, cat));
  };

  const actor = players[selectedIdx]?.id ?? false;
  const voter = players.filter((_, i) => i !== selectedIdx)[voterIdx]?.id ?? false;
  const act = useOnlineActions(online, 'bottlespin', `${phase}:${currentRound}:${selectedIdx}:${voterIdx}:${isSpinning}:${declined}`, {
    start: { allowed: phase === 'setup' ? 'host' : false, run: handleStart },
    spin: { allowed: phase === 'spinning' && !isSpinning ? 'host' : false, run: doSpin },
    accept: { allowed: phase === 'card' && !declined ? actor : false, run: handleAccept },
    decline: { allowed: phase === 'card' && !declined ? actor : false, run: handleDecline },
    vote: { allowed: phase === 'vote' ? voter : false, run: (yes: unknown) => { if (typeof yes === 'boolean') castVote(yes); } },
    next: { allowed: phase === 'spinning' && !isSpinning && selectedIdx >= 0 ? 'host' : false, run: nextRoundBottleOnly },
    again: { allowed: phase === 'gameOver' ? 'host' : false, run: playAgain },
  });
  useOnlineSnapshot(online, 'bottlespin', { phase, players, mode, timerSec, totalRounds, currentRound, selectedCategories, contentSelection, rotation, isSpinning, selectedIdx, currentCard, declined, votes, voterIdx, timeLeft: timer.timeLeft }, s => {
    setPhase(s.phase); setPlayers(s.players); setMode(s.mode); setTimerSec(s.timerSec); setTotalRounds(s.totalRounds); setCurrentRound(s.currentRound); setSelectedCategories(s.selectedCategories); setContentSelection(s.contentSelection ?? 'mixed'); setRotation(s.rotation); setIsSpinning(s.isSpinning); setSelectedIdx(s.selectedIdx); setCurrentCard(s.currentCard); setDeclined(s.declined); setVotes(s.votes); setVoterIdx(s.voterIdx); timer.reset(s.timeLeft);
  });
  if (online && !online.isHost && phase === 'setup') return <OnlineWaiting />;
  if (handover.overlay) return handover.overlay; // phone in transit: only the opaque pass screen

  if (phase === 'setup') {
    if (!contentReady) return <BottleContentSelection cards={getBOTTLE_CARDS()} categories={getCATEGORY_META()}
      selected={selectedCategories} type={contentSelection} onToggle={toggleCategory} onType={setContentSelection}
      onContinue={() => setContentReady(true)} disabled={online?.isConnected === false} />;
    return (
      <div>
      <button type="button" className="bottle-edit-selection" onClick={() => setContentReady(false)}>{t('games.bottlespin.editSelection')}</button>
      <GameSetup gameId="bottlespin" modes={getTranslatedModes('bottlespin', GAME_MODES, (key, fallback) => t(key, { defaultValue: fallback }))} settings={setupSettings} onStart={(...args) => act('start', ...args)}
        title={t('gameNames.flaschendrehen')} minPlayers={2} maxPlayers={12} onlinePlayers={online?.players} />
      </div>
    );
  }

  return (
    <div data-phase={phase} className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col font-game overflow-hidden">
      <style>{neonStyles}</style>

      {/* Background aura blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="float-aura absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#e6b880]/[0.06] blur-[120px]" />
        <div className="float-aura absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full bg-[#ff6b98]/[0.05] blur-[140px]" style={{ animationDelay: '2s' }} />
        <div className="float-aura absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-[#91b8a1]/[0.04] blur-[100px]" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-[#e6b880]/[0.06]">
        {/* In der App liegt der FloatingBackButton genau auf diesem Pfeil und
            tut über den Back-Guard dasselbe — dort nur unsichtbar schalten,
            nicht entfernen: der Platzhalter hält die Kopfzeile im Gleichgewicht
            und den Platz unter dem schwebenden Pfeil frei. */}
        <button
          onClick={() => (phase === 'gameOver' ? navigate('/games') : exitGuard.request())}
          className={`p-2 text-white/40 hover:text-[#e6b880] transition-colors${hasShellBackButton() ? ' invisible pointer-events-none' : ''}`}
          aria-hidden={hasShellBackButton()}
          tabIndex={hasShellBackButton() ? -1 : undefined}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#91b8a1]/60">
          {t('games.bottlespin.roundCounter', { current: currentRound, total: totalRounds })}
        </div>
        <div className="px-3 py-1 rounded-full glass-panel text-sm font-bold text-[#e6b880]">
          {mode === 'fragen' ? t('gameModes.bottlespin.fragen.name') : t('gameModes.bottlespin.nur-flasche.name')}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SPINNING PHASE */}
        {phase === 'spinning' && (
          <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="table-play relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <h2 className="text-xl font-extrabold">
              {selectedPlayer ? (
                <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="neon-text-purple text-[#e6b880]">
                  {selectedPlayer.name}!
                </motion.span>
              ) : <span className="text-white/60">{t('games.bottlespin.whoWillItBe')}</span>}
            </h2>

            {/* Player circle + bottle */}
            <div className="bottle-table relative" style={{ width: RADIUS * 2 + 60, height: RADIUS * 2 + 60 }}>
              {players.map((p, i) => {
                const angle = (i / players.length) * 2 * Math.PI - Math.PI / 2;
                const x = Math.cos(angle) * RADIUS, y = Math.sin(angle) * RADIUS;
                const isSel = selectedIdx === i;
                return (
                  <motion.div key={p.id} className="absolute flex flex-col items-center gap-1"
                    style={{ left: `calc(50% + ${x}px - 22px)`, top: `calc(50% + ${y}px - 22px)` }}
                    animate={isSel ? { scale: 1.4 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}>
                    <div className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-300',
                        isSel ? 'ring-2' : 'ring-2 ring-white/[0.08]'
                      )}
                      style={{
                        backgroundColor: p.color,
                        ...(isSel ? { ringColor: p.color, boxShadow: `0 0 18px ${p.color}88, 0 0 40px ${p.color}33` } : {}),
                      }}>
                      {p.avatar}
                    </div>
                    <span className={cn('text-[10px] font-semibold truncate max-w-[54px] text-center transition-colors',
                      isSel ? 'text-white' : 'text-white/40')}>{p.name}</span>
                    {mode === 'fragen' && (
                      <span className="text-[9px] font-bold text-[#e6b880]/70">{p.score}</span>
                    )}
                  </motion.div>
                );
              })}

              {/* Center table surface */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] rounded-full border border-white/[0.06] bg-white/[0.03]"
                style={{ boxShadow: 'inset 0 0 30px rgba(139,92,246,0.06), 0 0 60px rgba(139,92,246,0.04)' }} />

              {/* Spinning bottle — shared bottle silhouette */}
              <motion.div
                className="absolute left-1/2 top-1/2 origin-center"
                style={{ marginLeft: -60, marginTop: -60, width: 120, height: 120 }}
                animate={{ rotate: rotation }}
                transition={{ type: 'tween', duration: reduceMotion ? 0 : 3, ease: [0.15, 0.85, 0.25, 1] }}>
                {/* The bottle stays perfectly centered.
                    Neck points UP (0° = top = toward first player). */}
                <div className="w-full h-full flex items-center justify-center relative">
                  <BottleObject />
                  {/* Pointer indicator at the cork/top end */}
                  <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -61 }}>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#e6b880]"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(150,160,165,0.6))' }} />
                  </div>
                </div>
              </motion.div>
            </div>

            {mode === 'fragen' && <p className="bottle-content-summary">
              {t(`games.bottlespin.${contentSelection === 'frage' ? 'questionsOnly' : contentSelection === 'aufgabe' ? 'tasksOnly' : 'mixedCards'}`)}
              {' · '}{selectedCategories.map(category => getCATEGORY_META()[category]?.name ?? category).join(' · ')}
            </p>}

            {/* Action button */}
            {selectedIdx >= 0 && !isSpinning ? (
              mode === 'nur-flasche' ? (
                <motion.button whileTap={{ scale: 0.97 }} disabled={!act.can('next')} onClick={() => act('next')}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#e6b880] to-[#d779ff] text-white px-8 py-3.5 rounded-2xl h-14 font-extrabold text-base btn-glow">
                  <Sparkles className="w-5 h-5" /> {t('games.bottlespin.nextRound')}
                </motion.button>
              ) : null
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => act('spin')} disabled={isSpinning || !act.can('spin')}
                className={cn('flex items-center gap-2 px-8 py-3.5 rounded-2xl h-14 font-extrabold text-base transition-all',
                  isSpinning ? 'glass-panel text-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#e6b880] to-[#d779ff] text-white btn-glow')}>
                <Zap className="w-5 h-5" /> {isSpinning ? t('games.bottlespin.spinning') : t('games.bottlespin.spin')}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* CARD PHASE */}
        {phase === 'card' && currentCard && selectedPlayer && (
          <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6">

            {/* Timer */}
            {currentCard.type === 'aufgabe' && !declined && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2">
                <Timer className={cn('w-5 h-5', timer.timeLeft <= 10 ? 'text-[#ff6e84] animate-pulse' : 'text-[#91b8a1]')} />
                <span className={cn('text-2xl font-mono font-bold', timer.timeLeft <= 10 ? 'text-[#ff6e84]' : 'neon-text-cyan text-[#91b8a1]')}>
                  {timer.timeLeft}s
                </span>
              </motion.div>
            )}

            {/* Player pill */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2"
                style={{ backgroundColor: selectedPlayer.color, boxShadow: `0 0 12px ${selectedPlayer.color}44` }}>
                {selectedPlayer.avatar}
              </div>
              <span className="text-sm font-bold text-white/80">{t('games.bottlespin.playerChallenge', { name: selectedPlayer.name })}</span>
            </motion.div>

            {/* Glowing card */}
            <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full max-w-sm relative">
              {/* Gradient glow backlight */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6b98] via-[#e6b880] to-[#91b8a1] rounded-2xl blur opacity-20" />
              {/* Card surface */}
              <div className="table-task relative overflow-hidden border">
                {/* Gradient top stripe */}
                <div className="h-2 w-full bg-gradient-to-r from-[#ff6b98] to-[#e6b880]" />
                <div className="p-6 flex flex-col items-center gap-4">
                  {/* Category label */}
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] italic"
                    style={{ color: getCATEGORY_META()[currentCard.category].color }}>
                    {getCATEGORY_META()[currentCard.category].name}
                  </span>
                  {/* Type label */}
                  <h3 className={cn('text-5xl font-black tracking-tight',
                    currentCard.type === 'frage' ? 'text-[#91b8a1] neon-text-cyan' : 'text-[#ff6b98] neon-text')}>
                    {currentCard.type === 'frage' ? t('games.bottlespin.cardTypeQuestion') : t('games.bottlespin.cardTypeChallenge')}
                  </h3>
                  {/* Divider */}
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#44484f] to-transparent" />
                  {/* Card text */}
                  <p dir="auto" className="text-2xl font-bold text-white leading-tight text-center">{localizeBottleCard(currentCard).text}</p>
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            {!declined ? (
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <motion.button whileTap={{ scale: 0.97 }} disabled={!act.can('accept')} onClick={() => act('accept')}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#e6b880] to-[#d779ff] text-white py-4 rounded-2xl h-14 font-extrabold btn-glow">
                  <ThumbsUp className="w-5 h-5" /> {currentCard.type === 'aufgabe' ? t('games.bottlespin.done') : t('games.bottlespin.accept')}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={!act.can('decline')} onClick={() => act('decline')}
                  className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#ff6e84]/30 text-[#ff6e84]/70 px-6 py-3.5 rounded-2xl font-bold hover:border-[#ff6e84]/50 hover:text-[#ff6e84] transition-all">
                  {t('games.bottlespin.decline')}
                </motion.button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-[#ff6e84] font-bold text-sm neon-text">{t('games.bottlespin.penaltyPoint')}</motion.div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-white/20 uppercase tracking-widest">{t('games.bottlespin.roundCounter', { current: currentRound, total: totalRounds })}</span>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalRounds, 12) }).map((_, i) => (
                  <div key={i} className={cn('w-1.5 h-1.5 rounded-full',
                    i < currentRound ? 'bg-[#e6b880]' : 'bg-white/[0.08]')} />
                ))}
              </div>
              <span className="text-[10px] text-[#e6b880]/30 font-bold tracking-widest">EventBliss</span>
            </div>
          </motion.div>
        )}

        {/* VOTE PHASE */}
        {phase === 'vote' && selectedPlayer && (
          <BottleVote key="vote" players={players} selectedIdx={selectedIdx} voterIdx={voterIdx} selectedName={selectedPlayer.name}
            canVote={act.can('vote')} onVote={yes => act('vote', yes)} />
        )}

        {/* GAME OVER */}
        {phase === 'gameOver' && (
          <BottleGameOver key="over" players={players} winner={winner} mode={mode} totalRounds={totalRounds} achievements={newAchievements}
            onDismissAchievements={clearAchievements} canAgain={act.can('again')} onAgain={() => act('again')} onOtherGame={() => navigate('/games')} />
        )}
      </AnimatePresence>

      <ConfirmExitDialog {...exitGuard.dialogProps} accent="#e6b880" />
    </div>
  );
}

export default function BottleSpinGame({ online }: { online?: OnlineGameProps } = {}) {
  return <GameStage gameId="flaschendrehen" className="table-game"><BottleSpinGameContent online={online} /></GameStage>;
}
