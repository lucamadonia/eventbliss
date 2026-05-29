import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, ArrowRight, RotateCcw, Trophy, Users, User, Plus, X as CloseIcon,
  Check, Music2, Fish, Repeat, ExternalLink, ChevronRight, Sparkles, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { Confetti } from '@/components/expenses-v2/Confetti';
import {
  buildDeck, resolveRound, insertSorted, hasWon,
  type Participant, type Phase, type PendingCounter, type RoundResolution, type Song,
} from './ohrwurm-engine';
import { OHRWURM_GENRES } from './ohrwurm-content';

// ---------------------------------------------------------------------------
// Design-Tokens (Spec §6) — als lokale Konstanten, damit das Corporate-Design
// an einer Stelle gepflegt werden kann.
// ---------------------------------------------------------------------------
const OW = {
  primary: '#FF2E88',   // Aktion / Hervorhebung
  secondary: '#26E0C4', // Konter / Erfolg
  accent: '#FFD23F',    // Highlight / Slots
  bg: '#16101f',
  elevated: '#1e1530',
  surface: '#241a39',
  text: '#F7F2E9',
  dim: '#b3a8c9',
} as const;

const PLAYER_COLORS = ['#FF2E88', '#26E0C4', '#FFD23F', '#8b5cf6'];
const MAX_HOOKS = 5;        // Hausregel-Cap (Spec §2.4)
const START_HOOKS = 3;      // Spec §2.1

const OW_STYLE = `
.ow-glow-pink { text-shadow: 0 0 18px rgba(255,46,136,.55), 0 0 40px rgba(255,46,136,.3); }
.ow-glow-teal { text-shadow: 0 0 18px rgba(38,224,196,.55), 0 0 40px rgba(38,224,196,.3); }
.ow-card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
@keyframes ow-eq { 0%,100% { height: 20%; } 50% { height: 100%; } }
`;

// ---------------------------------------------------------------------------
// Setup-Konfiguration
// ---------------------------------------------------------------------------
interface OhrwurmConfig {
  mode: 'solo' | 'group';
  winTarget: number;
  genre: string | null;
}

interface SetupPlayer { id: string; name: string; color: string; avatar: string; }

// ===========================================================================
// Haupt-Komponente
// ===========================================================================
export default function OhrwurmGame() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const recordedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('setup');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [deck, setDeck] = useState<Song[]>([]);
  const [turn, setTurn] = useState(0);
  const [song, setSong] = useState<Song | null>(null);
  const [placement, setPlacement] = useState<number | null>(null);
  const [counter, setCounter] = useState<PendingCounter | null>(null);
  const [counteringId, setCounteringId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<RoundResolution | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [swapUsed, setSwapUsed] = useState(false);
  const [bonusDecided, setBonusDecided] = useState(false);
  const [winTarget, setWinTarget] = useState(10);
  const [genre, setGenre] = useState<string | null>(null);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const active = participants[turn] ?? null;
  const ownedIds = useMemo(
    () => new Set(participants.flatMap((p) => p.timeline.map((s) => s.id))),
    [participants],
  );

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }, []);

  // --- Stapel: oberste Karte ziehen, ggf. neu mischen (Spec §2.6) ---------
  const takeCard = useCallback((d: Song[], owned: Set<string>): { card: Song; rest: Song[] } => {
    if (d.length > 0) {
      return { card: d[d.length - 1], rest: d.slice(0, -1) };
    }
    const fresh = buildDeck(genre).filter((s) => !owned.has(s.id));
    return { card: fresh[fresh.length - 1], rest: fresh.slice(0, -1) };
  }, [genre]);

  // --- Neue Runde starten -------------------------------------------------
  const beginTurn = useCallback((parts: Participant[], d: Song[], idx: number) => {
    const owned = new Set(parts.flatMap((p) => p.timeline.map((s) => s.id)));
    const { card, rest } = takeCard(d, owned);
    setParticipants(parts);
    setDeck(rest);
    setTurn(idx);
    setSong(card);
    setPlacement(null);
    setCounter(null);
    setCounteringId(null);
    setResolution(null);
    setFlipped(false);
    setSwapUsed(false);
    setBonusDecided(false);
    setPhase('draw');
  }, [takeCard]);

  // --- Spielstart ---------------------------------------------------------
  const handleStart = useCallback((cfg: OhrwurmConfig, players: SetupPlayer[]) => {
    let d = buildDeck(cfg.genre);
    const parts: Participant[] = players.map((p) => {
      const startCard = d[d.length - 1];
      d = d.slice(0, -1);
      return {
        id: p.id,
        name: p.name,
        type: cfg.mode === 'group' ? 'group' : 'player',
        color: p.color,
        avatar: p.avatar,
        timeline: [startCard],
        hooks: START_HOOKS,
      };
    });
    setWinTarget(cfg.winTarget);
    setGenre(cfg.genre);
    void haptics.celebrate();
    beginTurn(parts, d, 0);
  }, [beginTurn, haptics]);

  // --- Phase 1: Tausch (Spec §2.4 #2) -------------------------------------
  const handleSwap = useCallback(() => {
    if (!active || !song || swapUsed || active.hooks < 1) return;
    void haptics.medium();
    const owned = new Set(participants.flatMap((p) => p.timeline.map((s) => s.id)));
    // aktuelle Karte unter den Stapel, neue oberste ziehen
    const deckWithBack = [song, ...deck];
    const { card, rest } = takeCard(deckWithBack, owned);
    setParticipants((prev) => prev.map((p, i) => (i === turn ? { ...p, hooks: p.hooks - 1 } : p)));
    setDeck(rest);
    setSong(card);
    setSwapUsed(true);
    flash('Karte getauscht — 1 🎣 abgegeben');
  }, [active, song, swapUsed, participants, deck, turn, takeCard, haptics, flash]);

  // --- Phase 2: Einordnen -------------------------------------------------
  const handlePlace = useCallback((slotIndex: number) => {
    if (!active) return;
    void haptics.light();
    setPlacement(slotIndex);
    const someoneCanCounter = participants.some((p, i) => i !== turn && p.hooks >= 1);
    if (someoneCanCounter) {
      setPhase('counter');
    } else {
      goReveal(slotIndex, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, participants, turn, haptics]);

  // --- Phase 3: Konter ----------------------------------------------------
  const handleChooseCounter = useCallback((pid: string) => {
    void haptics.medium();
    setCounteringId(pid);
    setPhase('counterPlace');
  }, [haptics]);

  const handleCommitCounter = useCallback((slotIndex: number) => {
    if (!counteringId || placement === null) return;
    void haptics.medium();
    setParticipants((prev) => prev.map((p) => (p.id === counteringId ? { ...p, hooks: p.hooks - 1 } : p)));
    const ct: PendingCounter = { participantId: counteringId, slotIndex };
    goReveal(placement, ct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counteringId, placement, haptics]);

  const handleNoCounter = useCallback(() => {
    if (placement === null) return;
    goReveal(placement, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  // --- Phase 4: Auflösung -------------------------------------------------
  const goReveal = (slotIndex: number, ct: PendingCounter | null) => {
    if (!active || !song) return;
    const res = resolveRound(active.id, active.timeline, { slotIndex }, ct, song);

    setParticipants((prev) => {
      let next = prev;
      if (res.winnerId) {
        next = prev.map((p) =>
          p.id === res.winnerId ? { ...p, timeline: insertSorted(p.timeline, song) } : p,
        );
      } else {
        // zurück auf den Stapel (nach ganz unten)
        setDeck((d) => [song, ...d]);
      }
      return next;
    });

    setCounter(ct);
    setResolution(res);
    setPhase('reveal');
    setFlipped(false);
    // Flip nach kurzem Moment
    window.setTimeout(() => setFlipped(true), 220);
    if (res.winnerId) void haptics.success(); else void haptics.warning();
  };

  // --- Phase 5: Bonus -----------------------------------------------------
  const handleBonus = useCallback((earned: boolean) => {
    setBonusDecided(true);
    if (earned && active) {
      void haptics.success();
      setParticipants((prev) => prev.map((p, i) =>
        i === turn ? { ...p, hooks: Math.min(MAX_HOOKS, p.hooks + 1) } : p));
      flash('+1 🎣 Bonus!');
    }
  }, [active, turn, haptics, flash]);

  // --- Weiter / Sieg-Check ------------------------------------------------
  const handleContinue = useCallback(() => {
    const won = participants.find((p) => hasWon(p, winTarget));
    if (won) {
      setWinner(won);
      setPhase('gameOver');
      void haptics.celebrate();
      return;
    }
    const nextIdx = (turn + 1) % participants.length;
    beginTurn(participants, deck, nextIdx);
  }, [participants, winTarget, turn, deck, beginTurn, haptics]);

  // --- Stats beim Spielende -----------------------------------------------
  useEffect(() => {
    if (phase === 'gameOver' && winner && !recordedRef.current) {
      recordedRef.current = true;
      recordEnd('ohrwurm', winner.timeline.length, true);
    }
    if (phase === 'setup') recordedRef.current = false;
  }, [phase, winner, recordEnd]);

  const resetGame = useCallback(() => {
    setPhase('setup');
    setParticipants([]);
    setWinner(null);
    setSong(null);
  }, []);

  // =========================================================================
  // Render
  // =========================================================================
  if (phase === 'setup') {
    return <OhrwurmSetup onStart={handleStart} haptics={haptics} />;
  }

  const bonusOpen = phase === 'reveal' && !!resolution?.bonusEligible && !bonusDecided;

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col font-game"
      style={{ background: OW.bg, color: OW.text }}
    >
      <style>{OW_STYLE}</style>
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(255,46,136,0.12)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[130px]" style={{ background: 'rgba(38,224,196,0.10)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/games')} className="p-2 -ml-2" style={{ color: OW.dim }} aria-label="Zurück">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4" style={{ color: OW.primary }} />
          <span className="text-sm font-black tracking-[0.2em] uppercase ow-glow-pink" style={{ color: OW.primary }}>OHRWURM</span>
        </div>
        <div className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: OW.surface, color: OW.accent }}>
          Ziel {winTarget}
        </div>
      </div>

      {/* Scoreboard */}
      <Scoreboard participants={participants} activeId={active?.id} winTarget={winTarget} />

      {/* Phase content */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-6">
        <AnimatePresence mode="wait">
          {/* ---- DRAW: QR-Karte hören ---- */}
          {phase === 'draw' && song && active && (
            <motion.div key="draw" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
              <PhaseBanner
                tone="primary"
                kicker={`${active.name} ist dran`}
                title="Scannen & hören"
                sub="QR-Code mit dem Handy scannen, Song anhören — das Jahr bleibt geheim."
              />
              <QrCard song={song} />
              <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { void haptics.light(); setPhase('place'); }}
                  className="w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2"
                  style={{ background: OW.primary, color: OW.bg }}>
                  In Timeline einordnen <ChevronRight className="w-5 h-5" />
                </motion.button>
                <button
                  onClick={handleSwap}
                  disabled={swapUsed || active.hooks < 1}
                  className="inline-flex items-center gap-2 text-sm font-bold disabled:opacity-30 transition-opacity"
                  style={{ color: OW.secondary }}
                >
                  <Repeat className="w-4 h-4" />
                  {swapUsed ? 'Tausch verbraucht' : `Song unbekannt? Tauschen (1 🎣)`}
                </button>
              </div>
            </motion.div>
          )}

          {/* ---- PLACE: aktive Person ordnet ein ---- */}
          {phase === 'place' && song && active && (
            <motion.div key="place" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col gap-5 py-4">
              <PhaseBanner tone="accent" kicker={`${active.name}s Timeline`} title="Wohin gehört der Song?"
                sub="Tippe die Lücke, in der das Erscheinungsjahr liegt." />
              <MysteryChip />
              <TimelinePlacer timeline={active.timeline} onSelect={handlePlace} accent={active.color} />
            </motion.div>
          )}

          {/* ---- COUNTER: Konter-Fenster ---- */}
          {phase === 'counter' && active && (
            <motion.div key="counter" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col gap-5 py-4">
              <PhaseBanner tone="secondary" kicker="Konter-Fenster" title="Wer will kontern?"
                sub={`${active.name} hat platziert. Mit 1 🎣 kannst du anfechten und die Karte ggf. klauen.`} />
              <div className="flex flex-col gap-2.5 w-full max-w-md mx-auto">
                {participants.map((p, i) => {
                  if (i === turn) return null;
                  const canCounter = p.hooks >= 1;
                  return (
                    <button key={p.id} onClick={() => canCounter && handleChooseCounter(p.id)} disabled={!canCounter}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all disabled:opacity-35"
                      style={{ background: OW.surface, border: `1px solid ${canCounter ? p.color : 'transparent'}` }}>
                      <Avatar p={p} />
                      <span className="flex-1 font-bold">{p.name}</span>
                      <span className="text-sm font-mono" style={{ color: OW.secondary }}>{p.hooks} 🎣</span>
                      {canCounter && <Fish className="w-4 h-4" style={{ color: OW.secondary }} />}
                    </button>
                  );
                })}
              </div>
              <button onClick={handleNoCounter}
                className="mx-auto mt-2 px-8 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: OW.dim }}>
                Niemand kontert — auflösen
              </button>
            </motion.div>
          )}

          {/* ---- COUNTER PLACE ---- */}
          {phase === 'counterPlace' && active && counteringId && (
            <motion.div key="cplace" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col gap-5 py-4">
              <PhaseBanner tone="secondary"
                kicker={`${participants.find((p) => p.id === counteringId)?.name} kontert`}
                title="Karte neu platzieren"
                sub={`In ${active.name}s Timeline — wo gehört der Song wirklich hin?`} />
              <MysteryChip />
              <TimelinePlacer timeline={active.timeline} onSelect={handleCommitCounter}
                accent={participants.find((p) => p.id === counteringId)?.color ?? OW.secondary} />
            </motion.div>
          )}

          {/* ---- REVEAL ---- */}
          {phase === 'reveal' && song && active && resolution && (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
              <RevealCard song={song} flipped={flipped} />
              <ResolutionSummary
                resolution={resolution} active={active} counter={counter} participants={participants}
              />
              {bonusOpen ? (
                <div className="w-full max-w-sm rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: OW.surface, border: `1px solid ${OW.accent}` }}>
                  <p className="text-sm font-bold text-center" style={{ color: OW.accent }}>
                    <Sparkles className="inline w-4 h-4 mr-1" />
                    Titel <span className="opacity-70">&</span> Künstler beim Hören richtig genannt?
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => handleBonus(true)} className="flex-1 h-12 rounded-xl font-black" style={{ background: OW.accent, color: OW.bg }}>Ja · +1 🎣</button>
                    <button onClick={() => handleBonus(false)} className="flex-1 h-12 rounded-xl font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: OW.dim }}>Nein</button>
                  </div>
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue}
                  className="w-full max-w-sm h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2"
                  style={{ background: OW.primary, color: OW.bg }}>
                  Weiter <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ---- GAME OVER ---- */}
          {phase === 'gameOver' && winner && (
            <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-5 py-8 max-w-lg mx-auto w-full">
              <Confetti fire particles={120} />
              <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'rgba(255,210,63,0.12)', border: `1px solid ${OW.accent}` }}>
                  <Trophy className="w-8 h-8" style={{ color: OW.accent }} />
                </div>
              </motion.div>
              <h2 className="text-3xl font-black ow-glow-pink" style={{ color: OW.primary }}>Spielende!</h2>
              <div className="text-lg font-bold" style={{ color: OW.secondary }}>{winner.name} gewinnt mit {winner.timeline.length} Hits! 🎉</div>
              <div className="w-full space-y-2">
                {[...participants].sort((a, b) => b.timeline.length - a.timeline.length).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: OW.surface }}>
                    <span className="text-sm font-bold w-5" style={{ color: OW.dim }}>#{i + 1}</span>
                    <Avatar p={p} />
                    <span className="flex-1 font-semibold truncate">{p.name}</span>
                    <span className="font-bold" style={{ color: OW.secondary }}>{p.timeline.length} Hits</span>
                    <span className="text-sm font-mono" style={{ color: OW.accent }}>{p.hooks} 🎣</span>
                  </div>
                ))}
              </div>
              <div className="w-full space-y-3 mt-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={resetGame}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl h-14 font-black"
                  style={{ background: `linear-gradient(135deg, ${OW.primary}, ${OW.secondary})`, color: OW.bg }}>
                  <RotateCcw className="w-4 h-4" /> Nochmal
                </motion.button>
                <button onClick={() => navigate('/games')} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ border: '1px solid rgba(255,255,255,0.1)', color: OW.dim }}>
                  Anderes Spiel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full font-bold text-sm shadow-xl"
            style={{ background: OW.elevated, color: OW.text, border: `1px solid ${OW.secondary}` }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===========================================================================
// Sub-Komponenten
// ===========================================================================

function Avatar({ p, size = 32 }: { p: Pick<Participant, 'color' | 'avatar' | 'type'>; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-black text-white shrink-0 relative"
      style={{ width: size, height: size, background: p.color, fontSize: size * 0.42 }}>
      {p.avatar}
      {p.type === 'group' && (
        <Users className="absolute -bottom-1 -right-1 w-3 h-3 p-[1px] rounded-full" style={{ background: OW.bg, color: p.color }} />
      )}
    </div>
  );
}

function Scoreboard({ participants, activeId, winTarget }: { participants: Participant[]; activeId?: string; winTarget: number }) {
  return (
    <div className="relative z-10 flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      {participants.map((p) => {
        const isActive = p.id === activeId;
        return (
          <div key={p.id}
            className="shrink-0 flex items-center gap-2.5 rounded-2xl px-3 py-2 transition-all"
            style={{
              background: OW.surface,
              border: `1.5px solid ${isActive ? p.color : 'transparent'}`,
              boxShadow: isActive ? `0 0 18px ${p.color}40` : 'none',
            }}>
            <Avatar p={p} size={30} />
            <div className="leading-tight">
              <div className="text-xs font-bold max-w-[88px] truncate">{p.name}</div>
              <div className="text-[11px] font-mono" style={{ color: OW.dim }}>
                <span style={{ color: OW.secondary }}>{p.timeline.length}</span>/{winTarget} · {p.hooks} 🎣
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PhaseBanner({ tone, kicker, title, sub }: { tone: 'primary' | 'secondary' | 'accent'; kicker: string; title: string; sub: string }) {
  const color = tone === 'primary' ? OW.primary : tone === 'secondary' ? OW.secondary : OW.accent;
  return (
    <div className="text-center max-w-md mx-auto">
      <p className="text-[11px] font-black uppercase tracking-[0.25em] mb-1.5" style={{ color }}>{kicker}</p>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{title}</h2>
      <p className="text-sm" style={{ color: OW.dim }}>{sub}</p>
    </div>
  );
}

/** Mystery-Chip — repräsentiert die unbekannte (noch nicht aufgedeckte) Karte. */
function MysteryChip() {
  return (
    <div className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full"
      style={{ background: OW.surface, border: `1px dashed ${OW.primary}` }}>
      <Music2 className="w-4 h-4" style={{ color: OW.primary }} />
      <span className="font-black text-lg" style={{ color: OW.primary }}>?</span>
      <span className="text-xs font-bold" style={{ color: OW.dim }}>Jahr unbekannt</span>
    </div>
  );
}

/** Vorderseite der Karte: QR-Code + Logo (Spec §2.2). */
function QrCard({ song }: { song: Song }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-[20px] blur-2xl opacity-40" style={{ background: OW.primary }} />
      <div className="relative w-[230px] rounded-[20px] p-5 flex flex-col items-center gap-4"
        style={{ background: OW.elevated, boxShadow: '0 18px 50px rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <Music2 className="w-3.5 h-3.5" style={{ color: OW.primary }} />
          <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: OW.dim }}>OHRWURM</span>
        </div>
        <div className="bg-white p-3 rounded-2xl">
          <QRCodeSVG value={song.qrPayload} size={158} level="M" fgColor="#16101f" bgColor="#ffffff" />
        </div>
        <a href={song.qrPayload} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: OW.secondary }}>
          <ExternalLink className="w-3.5 h-3.5" /> Auf Spotify öffnen
        </a>
      </div>
    </div>
  );
}

/** Auflösungs-Karte: Jahr groß + Titel + Künstler + Flagge (Spec §2.2). */
function RevealCard({ song, flipped }: { song: Song; flipped: boolean }) {
  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        animate={{ rotateY: flipped ? 0 : 180 }}
        transition={{ duration: 0.7, ease: [0.4, 0.7, 0.3, 1.1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-[230px] h-[300px]"
      >
        {/* Rückseite (sichtbar nach Flip) */}
        <div className="ow-card-face absolute inset-0 rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-3"
          style={{ background: `linear-gradient(160deg, ${OW.elevated}, ${OW.surface})`, border: `1px solid ${OW.primary}`, boxShadow: '0 18px 50px rgba(0,0,0,.5)' }}>
          <span className="text-[11px] font-black tracking-[0.25em] uppercase" style={{ color: OW.dim }}>Erscheinungsjahr</span>
          <span className="text-6xl font-black ow-glow-pink leading-none" style={{ color: OW.primary }}>{song.year}</span>
          <div className="mt-2">
            <h3 className="text-xl font-black leading-tight">{song.title}</h3>
            <p className="text-sm font-semibold mt-1" style={{ color: OW.dim }}>
              {song.artist} <span className="ml-1">{song.flag}</span>
            </p>
          </div>
          <span className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: OW.bg, color: OW.accent }}>{song.genre}</span>
        </div>
        {/* Vorderseite (QR-Platzhalter, sichtbar vor Flip) */}
        <div className="ow-card-face absolute inset-0 rounded-[20px] flex items-center justify-center"
          style={{ background: OW.elevated, border: '1px solid rgba(255,255,255,0.06)', transform: 'rotateY(180deg)' }}>
          <Music2 className="w-12 h-12" style={{ color: OW.primary }} />
        </div>
      </motion.div>
    </div>
  );
}

/** Horizontale Timeline mit antippbaren Slots zwischen/um die Karten. */
function TimelinePlacer({ timeline, onSelect, accent }: { timeline: Song[]; onSelect: (slot: number) => void; accent: string }) {
  const slot = (i: number, label: string) => (
    <button key={`slot-${i}`} onClick={() => onSelect(i)}
      className="shrink-0 w-16 h-[120px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group"
      style={{ background: 'rgba(255,210,63,0.06)', border: `2px dashed ${accent}` }}>
      <Plus className="w-5 h-5 transition-transform group-hover:scale-125" style={{ color: accent }} />
      <span className="text-[9px] font-bold leading-tight text-center px-1" style={{ color: OW.dim }}>{label}</span>
    </button>
  );

  const card = (s: Song) => (
    <div key={s.id} className="shrink-0 w-[100px] h-[120px] rounded-2xl p-3 flex flex-col justify-between"
      style={{ background: OW.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-2xl font-black" style={{ color: OW.accent }}>{s.year}</span>
      <div className="leading-tight">
        <div className="text-[11px] font-bold line-clamp-2">{s.title}</div>
        <div className="text-[10px] truncate" style={{ color: OW.dim }}>{s.artist} {s.flag}</div>
      </div>
    </div>
  );

  const items: React.ReactNode[] = [];
  items.push(slot(0, timeline.length ? 'früher' : 'hier'));
  timeline.forEach((s, i) => {
    items.push(card(s));
    const isLast = i === timeline.length - 1;
    items.push(slot(i + 1, isLast ? 'später' : 'dazwischen'));
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-3 px-1 items-center snap-x no-scrollbar">
      {items}
    </div>
  );
}

/** Textuelle Zusammenfassung der Auflösung. */
function ResolutionSummary({ resolution, active, counter, participants }: {
  resolution: RoundResolution; active: Participant; counter: PendingCounter | null; participants: Participant[];
}) {
  const winnerName = resolution.winnerId
    ? participants.find((p) => p.id === resolution.winnerId)?.name ?? '—'
    : null;
  const counterName = counter ? participants.find((p) => p.id === counter.participantId)?.name : null;

  let headline: string;
  let tone: string;
  if (!resolution.winnerId) {
    headline = 'Daneben — Karte zurück auf den Stapel ✗';
    tone = OW.primary;
  } else if (resolution.winnerId === active.id) {
    headline = counter && !resolution.activeCorrect
      ? `${active.name} behält die Karte ✓`
      : `${active.name} lag richtig ✓`;
    tone = OW.secondary;
  } else {
    headline = `${winnerName} kontert erfolgreich und klaut die Karte 🎣`;
    tone = OW.secondary;
  }

  return (
    <div className="w-full max-w-sm rounded-2xl px-4 py-3 text-center" style={{ background: OW.surface }}>
      <p className="font-black" style={{ color: tone }}>{headline}</p>
      <div className="mt-1.5 flex items-center justify-center gap-3 text-xs" style={{ color: OW.dim }}>
        <span>{active.name}: {resolution.activeCorrect ? 'richtig' : 'falsch'}</span>
        {counter && counterName && (
          <span>· {counterName}: {resolution.counterCorrect ? 'richtig' : 'falsch'}</span>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Setup-Screen
// ===========================================================================
interface SetupProps {
  onStart: (cfg: OhrwurmConfig, players: SetupPlayer[]) => void;
  haptics: ReturnType<typeof useHaptics>;
}

function OhrwurmSetup({ onStart, haptics }: SetupProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'solo' | 'group'>('solo');
  const [winTarget, setWinTarget] = useState(10);
  const [genre, setGenre] = useState<string | null>(null);
  const [players, setPlayers] = useState<SetupPlayer[]>([
    { id: 'p-1', name: 'Du', color: PLAYER_COLORS[0], avatar: 'D' },
    { id: 'p-2', name: 'Spieler 2', color: PLAYER_COLORS[1], avatar: '2' },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const MIN = 2, MAX = 4; // Spec §2.1: 2–4 Teilnehmer
  const addPlayer = () => {
    if (players.length >= MAX) return;
    const idx = players.length;
    void haptics.select();
    const id = `p-${idx + 1}-${players.length}`;
    setPlayers((prev) => [...prev, { id, name: `${mode === 'group' ? 'Gruppe' : 'Spieler'} ${idx + 1}`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], avatar: String(idx + 1) }]);
    setEditingId(id);
  };
  const removePlayer = (id: string) => setPlayers((prev) => (prev.length > MIN ? prev.filter((p) => p.id !== id) : prev));
  const renamePlayer = (id: string, name: string) =>
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name, avatar: name.slice(0, 1).toUpperCase() || '?' } : p)));

  const canStart = players.length >= MIN && players.every((p) => p.name.trim().length > 0);
  const start = () => {
    if (!canStart) return;
    void haptics.celebrate();
    onStart({ mode, winTarget, genre }, players);
  };

  const TARGETS = [
    { v: 6, label: 'Schnell', desc: '6 Hits' },
    { v: 10, label: 'Klassik', desc: '10 Hits' },
    { v: 15, label: 'Marathon', desc: '15 Hits' },
  ];

  return (
    <div className="relative min-h-[100dvh] overflow-hidden pb-40 font-game" style={{ background: OW.bg, color: OW.text }}>
      <style>{OW_STYLE}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-[110px]" style={{ background: 'rgba(255,46,136,0.14)' }} />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full blur-[120px]" style={{ background: 'rgba(38,224,196,0.10)' }} />
      </div>

      <main className="relative z-10 pt-10 px-6 max-w-2xl mx-auto">
        <button onClick={() => navigate('/games')} className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: OW.dim }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Zurück
        </button>

        {/* Hero */}
        <section className="mb-9">
          <p className="font-black tracking-[0.25em] text-[11px] uppercase mb-2" style={{ color: OW.secondary }}>Musik-Quiz</p>
          <h1 className="text-5xl font-black tracking-tighter leading-[0.95] mb-3 ow-glow-pink" style={{ color: OW.primary }}>OHRWURM</h1>
          <p className="text-sm max-w-[320px]" style={{ color: OW.dim }}>
            QR scannen, Song hören, ins richtige Jahr einordnen. Wer zuerst {winTarget} Hits sammelt, gewinnt. 🎣 sind deine Joker.
          </p>
        </section>

        {/* Modus */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: OW.dim }}>Modus</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'solo', label: 'Einzeln', desc: 'Jeder für sich', icon: <User className="w-5 h-5" /> },
              { id: 'group', label: 'Gruppen', desc: 'Generationen-Teams', icon: <Users className="w-5 h-5" /> },
            ] as const).map((m) => {
              const activeMode = mode === m.id;
              return (
                <button key={m.id} onClick={() => { void haptics.select(); setMode(m.id); }}
                  className="rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
                  style={{ background: OW.surface, border: `2px solid ${activeMode ? OW.primary : 'transparent'}`, boxShadow: activeMode ? `0 0 20px ${OW.primary}33` : 'none' }}>
                  <div className="mb-2" style={{ color: activeMode ? OW.primary : OW.dim }}>{m.icon}</div>
                  <div className="font-black">{m.label}</div>
                  <div className="text-[11px]" style={{ color: OW.dim }}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Spielziel */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: OW.dim }}>Spielziel</h3>
          <div className="grid grid-cols-3 gap-3">
            {TARGETS.map((t) => {
              const activeT = winTarget === t.v;
              return (
                <button key={t.v} onClick={() => { void haptics.select(); setWinTarget(t.v); }}
                  className="rounded-2xl p-4 text-center transition-all active:scale-[0.98]"
                  style={{ background: OW.surface, border: `2px solid ${activeT ? OW.accent : 'transparent'}` }}>
                  <div className="text-2xl font-black" style={{ color: activeT ? OW.accent : OW.text }}>{t.v}</div>
                  <div className="text-[11px] font-bold mt-0.5">{t.label}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Genre-Filter */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: OW.dim }}>Genre <span className="opacity-50 normal-case tracking-normal">(optional)</span></h3>
          <div className="flex flex-wrap gap-2">
            <GenrePill label="Alle" active={genre === null} onClick={() => { void haptics.select(); setGenre(null); }} />
            {OHRWURM_GENRES.map((g) => (
              <GenrePill key={g} label={g} active={genre === g} onClick={() => { void haptics.select(); setGenre(g); }} />
            ))}
          </div>
        </section>

        {/* Teilnehmer */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase inline-flex items-center gap-2" style={{ color: OW.dim }}>
              <Users className="w-4 h-4" style={{ color: OW.secondary }} />
              {mode === 'group' ? 'Gruppen' : 'Spieler'} · {players.length}/{MAX}
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-6 px-6 no-scrollbar">
            {players.map((p, i) => {
              const isEditing = editingId === p.id;
              return (
                <div key={p.id} className="shrink-0 flex flex-col items-center gap-2 w-16">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full p-0.5" style={{ background: `linear-gradient(135deg, ${p.color}, ${OW.surface})` }}>
                      <div className="w-full h-full rounded-full flex items-center justify-center text-lg font-black text-white" style={{ background: p.color, border: `2px solid ${OW.bg}` }}>{p.avatar}</div>
                    </div>
                    {players.length > MIN && (
                      <button onClick={() => { void haptics.light(); removePlayer(p.id); }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: OW.surface, border: '1px solid rgba(255,255,255,0.15)' }} aria-label="entfernen">
                        <CloseIcon className="w-2.5 h-2.5" style={{ color: OW.dim }} />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <input autoFocus type="text" value={p.name} maxLength={12}
                      onChange={(e) => renamePlayer(p.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                      className="w-16 text-center text-[10px] font-bold bg-transparent border-b focus:outline-none"
                      style={{ borderColor: OW.primary, color: OW.text }} />
                  ) : (
                    <button onClick={() => setEditingId(p.id)} className="text-[10px] font-bold truncate max-w-full">{p.name}</button>
                  )}
                </div>
              );
            })}
            {players.length < MAX && (
              <button onClick={addPlayer} className="shrink-0 flex flex-col items-center gap-2 w-16 group">
                <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center active:scale-95 transition-transform" style={{ borderColor: 'rgba(255,255,255,0.2)', color: OW.dim }}>
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold" style={{ color: OW.dim }}>{mode === 'group' ? 'Gruppe' : 'Gast'}</span>
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Start CTA */}
      <div className="fixed bottom-6 inset-x-0 px-6 flex justify-center z-40 pointer-events-none">
        <motion.button onClick={start} disabled={!canStart} whileTap={canStart ? { scale: 0.97 } : {}}
          className="w-full max-w-md h-16 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 pointer-events-auto transition-all"
          style={canStart
            ? { background: `linear-gradient(135deg, ${OW.primary}, ${OW.secondary})`, color: OW.bg, boxShadow: `0 20px 40px ${OW.primary}40` }
            : { background: OW.surface, color: OW.dim }}>
          {canStart ? <>Spiel starten <Crown className="w-5 h-5" /></> : `Mindestens ${MIN} ${mode === 'group' ? 'Gruppen' : 'Spieler'}`}
        </motion.button>
      </div>
    </div>
  );
}

function GenrePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
      style={{ background: active ? OW.secondary : OW.surface, color: active ? OW.bg : OW.dim, border: `1px solid ${active ? OW.secondary : 'transparent'}` }}>
      {label}
    </button>
  );
}
