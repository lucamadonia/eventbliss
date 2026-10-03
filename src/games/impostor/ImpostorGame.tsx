import { GameStage, StageHeader, StageAction } from '../ui/GameStage';
import './design.css';
import { uniqueVoteLeader, impostorRoundPoints } from './round-rules';
import { impostorSnapshotFor, impostorTVPlayers } from './private-state';
import { pendingLocalReveals, removeFromRound } from './roster-change';
import { useGuestHandover } from '../ui/useGuestHandover';
import { localActiveSeats } from '../ui/guest-handover';
import { serverClock } from '../party/scene-clock';
import { planPhaseStart } from '../party/phase-gate';
import { usePhaseGate } from '../party/usePhaseGate';
import { useOnlineAuthority, useOnlineSnapshot, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { GameRulesModal, useAutoShowRules, RulesHelpButton } from '../ui/GameRulesModal';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import {
  Play, Eye, EyeOff, ChevronRight,
  Clock, CheckCircle2, Trophy, ArrowLeft, RotateCcw,
  Shield, AlertTriangle, Crown, Send, Lock, LockOpen,
  Sparkles, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { PlayerSetup } from '../ui/PlayerSetup';
import { getPlayerColor, getPlayerInitial } from '../ui/PlayerAvatars';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useAmbientMotion } from "@/lib/useAmbientMotion";
import { useNavigate } from 'react-router-dom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase =
  | 'setup'
  | 'wordReveal'
  | 'discussion'
  | 'voting'
  | 'revealCountdown'
  | 'reveal'
  | 'bonusGuess'
  | 'results';

interface Player {
  id: string;
  name: string;
  isImpostor: boolean;
  hasSpoken: boolean;
  votedFor: string | null;
  score: number;
}

interface WordSet {
  category: string;
  word: string;
}

// ---------------------------------------------------------------------------
// Word Sets
// ---------------------------------------------------------------------------

// Word sets loaded from dedicated content file (100+ words, multilingual)
import {
  IMPOSTOR_WORDS_DE, IMPOSTOR_WORDS_EN, IMPOSTOR_WORDS_ES, IMPOSTOR_WORDS_FR,
  IMPOSTOR_WORDS_IT, IMPOSTOR_WORDS_NL, IMPOSTOR_WORDS_PL, IMPOSTOR_WORDS_PT,
  IMPOSTOR_WORDS_TR, IMPOSTOR_WORDS_AR,
} from './impostor-words';
import i18n from 'i18next';

function getWordSets(): WordSet[] {
  const lang = i18n.language?.split('-')[0] || 'de';
  const map: Record<string, WordSet[]> = {
    de: IMPOSTOR_WORDS_DE, en: IMPOSTOR_WORDS_EN, es: IMPOSTOR_WORDS_ES,
    fr: IMPOSTOR_WORDS_FR, it: IMPOSTOR_WORDS_IT, nl: IMPOSTOR_WORDS_NL,
    pl: IMPOSTOR_WORDS_PL, pt: IMPOSTOR_WORDS_PT, tr: IMPOSTOR_WORDS_TR,
    ar: IMPOSTOR_WORDS_AR,
  };
  return map[lang] || map.de;
}

const WORD_SETS = IMPOSTOR_WORDS_DE; // fallback for type inference

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1;
function createPlayer(name: string): Player {
  return {
    id: `p-${nextId++}`,
    name,
    isImpostor: false,
    hasSpoken: false,
    votedFor: null,
    score: 0,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Reveal VFX helpers — particle bursts, glow rings, scan lines
// ---------------------------------------------------------------------------

/**
 * ParticleBurst — N small dots fly radially outward from the center.
 * Used twice: once at the moment the lock "cracks" (cyan/violet sparks),
 * once as ambient sparkle around the revealed safe word.
 */
function ParticleBurst({
  count = 14,
  color = '#e6b76a',
  radius = 120,
  size = 6,
  duration = 0.9,
  delay = 0,
}: { count?: number; color?: string; radius?: number; size?: number; duration?: number; delay?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              background: color,
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x, y, opacity: [0, 1, 0], scale: [0, 1, 0.4] }}
            transition={{ duration, delay, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

/**
 * RotatingGlowRing — conic gradient behind the revealed word. Spins
 * slowly while the role is on screen; intensifies for impostor.
 * The infinite spin is decorative, so it only runs when `ambient` is
 * true (off on native / reduced-motion); otherwise it renders static.
 */
function RotatingGlowRing({ impostor, ambient }: { impostor: boolean; ambient: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      animate={ambient ? { rotate: 360 } : undefined}
      transition={ambient ? { repeat: Infinity, duration: impostor ? 4 : 10, ease: 'linear' } : undefined}
    >
      <div
        className="w-[140%] h-[140%] rounded-full opacity-30 blur-3xl"
        style={{
          background: impostor
            ? 'conic-gradient(from 0deg, transparent 0%, #ff6e84 25%, transparent 50%, #a70138 75%, transparent 100%)'
            : 'conic-gradient(from 0deg, transparent 0%, #eee3cb 25%, transparent 50%, #e6b76a 75%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}

/**
 * DangerScanLine — horizontal red line sweeping top→bottom for the
 * impostor reveal. Animates `transform: translateY` (compositor-only,
 * NO layout reflow) instead of `top`. Decorative infinite loop, so it
 * only renders when `ambient` is true.
 */
function DangerScanLine() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-0 h-[3px] will-change-transform"
      style={{
        background: 'linear-gradient(90deg, transparent, #ff6e84, transparent)',
        boxShadow: '0 0 20px #ff6e84, 0 0 40px #ff6e84',
      }}
      initial={{ y: 0 }}
      animate={{ y: [0, 360, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ImpostorGameContent({ online }: { online?: OnlineGameProps }) {
  const { t } = useTranslation();
  // Decorative infinite loops (rings, sparkles, breathing lock, scan line,
  // glows) are gated behind this — FALSE on native WebView & reduced-motion,
  // where endless compositor loops are the main source of jank.
  const ambient = useAmbientMotion();
  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyRoster = useInitialRoster() ?? [];
  const partyPlayerNames = partyRoster.map((p) => p.name);
  const resolvedNames = onlinePlayerNames.length >= 4
    ? onlinePlayerNames
    : partyPlayerNames.length >= 4
      ? partyPlayerNames
      : [];
  // --- Setup state ---
  const [players, setPlayers] = useState<Player[]>(() =>
    resolvedNames.length >= 4
      ? resolvedNames.map((name, i) => { const player = createPlayer(name); return { ...player, id: online?.players[i]?.id ?? partyRoster[i]?.id ?? player.id }; })
      : [
          createPlayer(`${t('games.impostor.playerLabel')} 1`),
          createPlayer(`${t('games.impostor.playerLabel')} 2`),
          createPlayer(`${t('games.impostor.playerLabel')} 3`),
          createPlayer(`${t('games.impostor.playerLabel')} 4`),
        ]
  );
  const [impostorCount, setImpostorCount] = useState(1);
  const [timerDuration, setTimerDuration] = useState(90);
  // Hard mode: hide the category everywhere it would normally appear as a clue
  // (reveal cards + discussion timer + bonus guess) so the impostor flies blind.
  const [hideCategory, setHideCategory] = useState(false);
  /**
   * Reihenfolge zufaellig.
   *
   * Bisher gab es hier gar keinen Zufall: Das `shuffle` weiter unten bestimmt
   * nur, WER Hochstapler wird, und mappt danach positionsgetreu zurueck.
   * Wort-Anzeige, Sprechen und Abstimmen liefen immer stur in der
   * Setup-Reihenfolge — bei jeder Runde dieselbe Abfolge.
   */
  const [randomOrder, setRandomOrder] = useState(false);
  /**
   * Die Abfolge als eigene Indexliste, NICHT durch Umsortieren von `players`:
   * `revealIndex`, `currentSpeaker` und `votingPlayer` greifen an rund acht
   * Stellen direkt per Index auf `players` zu, und die Punkteliste wuerde bei
   * jedem Mischen umspringen. So bleibt die Anzeige ruhig und nur die Abfolge
   * wechselt.
   */
  const [order, setOrder] = useState<number[]>([]);
  /**
   * Abfolge-Position -> Index in `players`. Ohne gesetzte Reihenfolge (erste
   * Runde, oder Schalter aus) ist es die Identitaet — dann verhaelt sich alles
   * exakt wie vorher.
   */
  const seat = useCallback((i: number) => order[i] ?? i, [order]);

  // --- Game state ---
  const [phase, setPhase] = useState<Phase>('setup');

  const navigate = useNavigate();
  const exitGuard = useConfirmExit(() => navigate('/games'));

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste) liegt
  // über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg und die Partie ist
  // futsch. Setup und Endstand haben nichts zu verlieren und reichen an den
  // Routen-Handler weiter.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'results') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [currentWordSet, setCurrentWordSet] = useState<WordSet | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(false);
  // Short-lived "unlocking" stage between tap and reveal — the lock
  // animation owns ~1100ms of screen time before the actual word/role
  // is shown. Keeps the tap → reveal moment suspenseful.
  const [unlocking, setUnlocking] = useState(false);
  const haptics = useHaptics();
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [votingPlayer, setVotingPlayer] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [bonusGuess, setBonusGuess] = useState('');
  const [bonusResult, setBonusResult] = useState<boolean | null>(null);
  const [round, setRound] = useState(1);
  const [roleReady, setRoleReady] = useState<string[]>([]);

  // 🔁-Gaeste am Host-Handy (Masterplan 3.5, sharedDevice 'secret'): Rolle
  // aufdecken und abstimmen nur nach verdeckter Weitergabe mit Halten; vor dem
  // Weiterreichen zudecken. Keine Spieluhr laeuft in diesen Phasen.
  const handover = useGuestHandover(online, { secret: true, clockPaused: false });
  const localSeatIds = useMemo(() => localActiveSeats(online), [online]);

  // Gemeinsamer Start jeder Phase (Serverzeit). Online plant der Host den
  // Wechsel mit Vorlauf und schickt die Zeit an Handys (Snapshot) und TV
  // (Bridge); alle wechseln zu diesem Moment. Lokal: der echte Wechsel.
  const [remotePhaseStartsAt, setRemotePhaseStartsAt] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plannedPhaseStart = useMemo(() => (online ? planPhaseStart() : serverClock.now()), [phase, round]);
  const phaseStartsAt = online && !online.isHost ? remotePhaseStartsAt : plannedPhaseStart;
  const gate = usePhaseGate(phase, online ? phaseStartsAt : null);

  // Score/speaker/timer changes within a round must reach the TV too — the
  // deps list is what triggers a re-broadcast, so it carries a score signature.
  useTVGameBridge(
    'impostor',
    { phase, phaseStartsAt, round, players: impostorTVPlayers(phase, players), currentSpeaker, timeLeft, handover: handover.tv },
    [phase, round, currentSpeaker, timeLeft, players.map((p) => p.score).join(','), handover.tv?.playerId ?? '', handover.tv?.progress?.phase ?? ''],
    !online || online.isHost,
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const privateSnapshot = JSON.stringify({ players, phase, phaseStartsAt, currentWordSet, timeLeft, currentSpeaker, votingPlayer, countdownNum, round, hideCategory, order, impostorCount, timerDuration, randomOrder, bonusResult, roleReady });
  useEffect(() => {
    if (!online?.isHost) return;
    const state = JSON.parse(privateSnapshot);
    for (const recipient of online.players) {
      // Eigene Plaetze (Host + 🔁-Gaeste an diesem Handy) haben kein eigenes Geraet.
      if (recipient.id === online.myPlayerId || localSeatIds.includes(recipient.id)) continue;
      online.broadcastTo?.(recipient.id, "impostor-state", impostorSnapshotFor(state, recipient.id));
    }
  }, [privateSnapshot, online?.isHost, online?.broadcastTo, online?.players, localSeatIds]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast("impostor-state", data => {
      if (data.__senderId !== (online.hostPlayerId ?? online.players.find(p => p.isHost)?.id)) return;
      setPlayers(data.players as Player[]);
      setPhase(data.phase as Phase);
      setRemotePhaseStartsAt(typeof data.phaseStartsAt === 'number' ? data.phaseStartsAt : null);
      setCurrentWordSet(data.currentWordSet as WordSet | null);
      setTimeLeft(data.timeLeft as number);
      setCurrentSpeaker(data.currentSpeaker as number);
      setVotingPlayer(data.votingPlayer as number);
      setCountdownNum(data.countdownNum as number);
      setRound(data.round as number);
      setHideCategory(data.hideCategory as boolean);
      setOrder(data.order as number[]);
      setImpostorCount(data.impostorCount as number);
      setTimerDuration(data.timerDuration as number);
      setRandomOrder(data.randomOrder as boolean);
      setBonusResult(data.bonusResult as boolean | null);
      setRoleReady(data.roleReady as string[]);
    });
  }, [online?.isHost, online?.onBroadcast, online?.players]);

  // --- Derived ---
  const impostors = useMemo(() => players.filter((p) => p.isImpostor), [players]);
  const villagers = useMemo(() => players.filter((p) => !p.isImpostor), [players]);

  const voteTally = useMemo(() => {
    const tally: Record<string, number> = {};
    players.forEach((p) => {
      if (p.votedFor) tally[p.votedFor] = (tally[p.votedFor] || 0) + 1;
    });
    return tally;
  }, [players]);

  const mostVotedId = useMemo(() => uniqueVoteLeader(voteTally), [voteTally]);

  const mostVotedPlayer = players.find((p) => p.id === mostVotedId);
  const impostorCaught = mostVotedPlayer?.isImpostor ?? false;

  // --- Player management ---
  const addPlayer = useCallback(() => {
    setPlayers((prev) => {
      if (prev.length >= 15) return prev;
      return [...prev, createPlayer(`${t('games.impostor.playerLabel')} ${prev.length + 1}`)];
    });
  }, [t]);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => {
      if (prev.length <= 4) return prev;
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const updateName = useCallback((id: string, name: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const isOnlineOrParty = resolvedNames.length >= 4;
  const handleImportNames = useCallback((names: string[]) => {
    const playerLabel = t('games.impostor.playerLabel');
    setPlayers((prev) => {
      const kept = prev.filter((p) => p.name.trim() && !new RegExp(`^${playerLabel} \\d+$`).test(p.name.trim()));
      const merged = [...kept];
      for (const n of names) {
        if (merged.length >= 15) break;
        merged.push(createPlayer(n));
      }
      while (merged.length < 4) merged.push(createPlayer(`${playerLabel} ${merged.length + 1}`));
      return merged;
    });
  }, [t]);

  const route = useOnlineAuthority(online, 'impostor', `${phase}:${round}:${currentSpeaker}:${votingPlayer}`, {
    readyRole: { allow: (sender, args) => phase === "wordReveal" && Number.isInteger(args[0]) && sender === players[args[0]]?.id && !roleReady.includes(sender), run: (...args) => readyRole(args[0]) },
    markSpoken: { allow: (sender, args) => phase === "discussion" && args[0] === currentSpeaker && sender === players[seat(currentSpeaker)]?.id, run: (...args) => markSpoken(args[0]) },
    skipToVoting: { allow: (sender, args) => phase === "discussion" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => skipToVoting() },
    castVote: { answer: true, allow: (sender, args) => phase === "voting" && sender === players[seat(votingPlayer)]?.id && players.some(p => p.id === args[0] && p.id !== sender), run: (...args) => castVote(args[0]) },
    submitBonusGuess: { answer: true, allow: (sender, args) => phase === "bonusGuess" && bonusResult === null && players.some(p => p.id === sender && p.isImpostor && p.id !== mostVotedId) && typeof args[0] === "string" && args[0].length <= 100, run: (...args) => submitBonusGuess(args[0]) },
    proceedFromReveal: { allow: (sender, args) => phase === "reveal" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => proceedFromReveal() },
    playAgain: { allow: (sender, args) => phase === "results" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => playAgain() },
    resetGame: { allow: (sender, args) => phase === "results" && sender === (online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id), run: (...args) => resetGame() },
  });

  function readyRole(index: number) {
    // Gast-Plaetze des Hosts erkennt die Online-Wache selbst (actingSeat).
    if (route('readyRole', [index])) return;
    if (!players[index] || roleReady.includes(players[index].id)) return;
    const ready = [...roleReady, players[index].id];
    setRoleReady(ready);
    if (ready.length === players.length) { setCurrentSpeaker(0); setPhase('discussion'); }
  }

  // --- Neue Rollen mitten im Abend (einziger Hochstapler hat die Runde verlassen) ---
  const restartRound = (list: Player[]) => {
    const wordSet = pickRandom(getWordSets());
    setCurrentWordSet(wordSet);
    const impostorIndices = new Set(shuffle(list.map((_, i) => i)).slice(0, Math.min(impostorCount, Math.floor((list.length - 1) / 2))));
    const seats = list.map((_, i) => i);
    setOrder(randomOrder ? shuffle(seats) : seats);
    setPlayers(list.map((p, i) => ({ ...p, isImpostor: impostorIndices.has(i), hasSpoken: false, votedFor: null })));
    setRoleReady([]);
    setCurrentSpeaker(0);
    setVotingPlayer(0);
    setRevealIndex(0);
    setWordVisible(false);
    setPhase('wordReveal');
  };

  // --- Mitspielende entfernt (Host, jederzeit — Masterplan 6.6) ---
  const removedKey = (online?.removedPlayerIds ?? []).join(',');
  useEffect(() => {
    if (!online?.isHost || !removedKey) return;
    const change = removeFromRound({ players, order, phase, currentSpeaker, votingPlayer, roleReady }, online.removedPlayerIds ?? []);
    if (!change.changed) return;
    if (change.restart && !change.tooFew) { restartRound(change.state.players); return; }
    setPlayers(change.state.players);
    setOrder(change.state.order);
    setRoleReady(change.state.roleReady);
    setCurrentSpeaker(change.state.currentSpeaker);
    setVotingPlayer(change.state.votingPlayer);
    setPhase(change.state.phase as Phase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removedKey, online?.isHost]);

  // --- Gaeste decken ihre Rolle auf: erst der Host (er haelt das Handy), dann die Gaeste ---
  useEffect(() => {
    if (!online || phase !== 'wordReveal' || handover.state.status !== 'idle') return;
    const pending = pendingLocalReveals(players, localSeatIds, roleReady);
    if (pending.length && pending[0] !== online.myPlayerId) handover.request(pending.filter(id => id !== online.myPlayerId));
  }, [online, phase, players, localSeatIds, roleReady, handover.state.status, handover.request]);

  // --- Gast stimmt ab: verdeckt weitergeben, direkt zum naechsten Gast ---
  const voterId = phase === 'voting' ? players[seat(votingPlayer)]?.id : undefined;
  useEffect(() => {
    if (!voterId || !handover.isGuest(voterId)) return;
    if (handover.activeGuest === voterId || handover.recipient === voterId) return;
    const st = handover.state;
    if (st.status === 'idle' || (st.status === 'return' && st.to === null)) handover.request([voterId]);
  }, [voterId, handover]);

  // Kein Weitergabe-Bild ueber Setup/Endstand haengen lassen.
  useEffect(() => {
    if (phase === 'setup') handover.cancel();
  }, [phase, handover.cancel]);

  // --- Start game ---
  const startGame = useCallback(() => {
    if (online && (!online.isHost || online.isConnected === false || phase !== "setup")) return;
    setRoleReady([]);
    const wordSet = pickRandom(getWordSets());
    setCurrentWordSet(wordSet);

    const shuffledIndices = shuffle(players.map((_, i) => i));
    const impostorIndices = new Set(shuffledIndices.slice(0, Math.min(impostorCount, Math.floor((players.length - 1) / 2))));
    // Bei aktivem Schalter jede Runde neu mischen, sonst die Setup-Reihenfolge.
    const seats = players.map((_, i) => i);
    setOrder(randomOrder ? shuffle(seats) : seats);

    setPlayers((prev) =>
      prev.map((p, i) => ({
        ...p,
        isImpostor: impostorIndices.has(i),
        hasSpoken: false,
        votedFor: null,
      }))
    );

    setRevealIndex(0);
    setWordVisible(false);
    setPhase('wordReveal');
  }, [players, impostorCount, randomOrder, online, phase]);

  useEffect(() => {
    if (phase === 'discussion' && (!online || online.isHost)) setTimeLeft(timerDuration);
  }, [phase, timerDuration]);
  useEffect(() => {
    if (phase === 'revealCountdown' && (!online || online.isHost)) setCountdownNum(3);
  }, [phase]);

  // --- Discussion timer ---
  useEffect(() => {
    if ((online && (!online.isHost || online.isConnected === false)) || phase !== 'discussion') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('voting');
          setVotingPlayer(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, online?.isHost, online?.isConnected]);

  // --- Reveal countdown ---
  useEffect(() => {
    if ((online && (!online.isHost || online.isConnected === false)) || phase !== 'revealCountdown') return;
    const timer = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('reveal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, online?.isHost, online?.isConnected]);

  // --- Word reveal navigation ---
  // First tap triggers the lock-unlock sequence (~1100ms). Second tap
  // (on the revealed content) advances to the next player or starts
  // the discussion phase. Haptics mirror the visual beats so it feels
  // physical: medium on tap, heavy at the "crack", celebrate/warning
  // when the role is revealed.
  const handleRevealTap = () => {
    if (unlocking) return; // ignore taps during the animation
    if (wordVisible) {
      void haptics.light();
      setWordVisible(false);
      // Absichtlich der Wert aus diesem Render, nicht `i => i + 1`: Ein schneller
      // Doppeltipp auf „Verstanden“ feuert zweimal mit demselben Stand — mit
      // der Funktionsform lief der Zeiger ueber das Ende hinaus (weisser
      // Bildschirm, „reading 'name'“) bzw. uebersprang jemanden.
      if (revealIndex < players.length - 1) {
        setRevealIndex(revealIndex + 1);
      } else {
        setPhase('discussion');
        setCurrentSpeaker(0);
      }
      return;
    }
    // Start the unlock sequence
    void haptics.medium();
    setUnlocking(true);
    // Mid-animation "crack" haptic
    window.setTimeout(() => { void haptics.heavy(); }, 500);
    // Final reveal haptic — gentler if safe word, sharper for impostor
    const isImpostor = players[seat(revealIndex)]?.isImpostor;
    window.setTimeout(() => {
      if (isImpostor) void haptics.warning();
      else void haptics.success();
      setWordVisible(true);
      setUnlocking(false);
    }, 1100);
  };

  // --- Mark spoken ---
  /**
   * `index` ist die Position in der ABFOLGE, nicht in `players`. Bei gemischter
   * Reihenfolge sind das zwei verschiedene Dinge — der Haken muss beim
   * richtigen Menschen landen, weitergeschaltet wird aber entlang der Abfolge.
   */
  const markSpoken = (index: number) => {
    if (route("markSpoken", [index])) return;
    const player = seat(index);
    setPlayers((prev) =>
      prev.map((p, i) => (i === player ? { ...p, hasSpoken: true } : p))
    );
    if (index < players.length - 1) {
      setCurrentSpeaker(index + 1);
    }
  };

  // --- Skip to voting ---
  const skipToVoting = () => {
    if (route("skipToVoting", [])) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('voting');
    setVotingPlayer(0);
  };

  // --- Cast vote ---
  const castVote = (targetId: string) => {
    if (route("castVote", [targetId])) return;
    const voter = players[seat(votingPlayer)];
    if (!voter || targetId === voter.id || !players.some(p => p.id === targetId)) return;

    setPlayers((prev) =>
      prev.map((p, i) => (i === seat(votingPlayer) ? { ...p, votedFor: targetId } : p))
    );

    // Wie beim Aufdecken: Doppeltipp darf den Zeiger nicht ueber das Ende schieben.
    if (votingPlayer < players.length - 1) {
      setVotingPlayer(votingPlayer + 1);
    } else {
      setPhase('revealCountdown');
    }
  };

  // --- Score calculation ---
  const calculateScores = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => {
        const points = p.score + impostorRoundPoints(p.isImpostor, p.id, mostVotedId, impostorCaught);
        return { ...p, score: points };
      })
    );
  }, [impostorCaught, mostVotedId]);

  // --- Bonus guess ---
  const submitBonusGuess = (guess = bonusGuess) => {
    if (route("submitBonusGuess", [guess])) return;
    if (bonusResult !== null) return;
    const correct =
      guess.trim().toLowerCase() === currentWordSet?.word.toLowerCase();
    setBonusResult(correct);
    if (correct) {
      setPlayers((prev) =>
        prev.map((p) => (p.isImpostor && p.id !== mostVotedId ? { ...p, score: p.score + 10 } : p))
      );
    }

  };

  useEffect(() => {
    if (phase !== 'bonusGuess' || bonusResult === null || (online && (!online.isHost || online.isConnected === false))) return;
    const timeout = setTimeout(() => setPhase('results'), 1500);
    return () => clearTimeout(timeout);
  }, [phase, bonusResult, online?.isHost, online?.isConnected]);

  // --- Move to bonus or results after reveal ---
  const proceedFromReveal = () => {
    if (route("proceedFromReveal", [])) return;
    calculateScores();
    if (impostors.some(p => p.id !== mostVotedId)) {
      setBonusGuess('');
      setBonusResult(null);
      setPhase('bonusGuess');
    } else {
      setPhase('results');
    }
  };

  // --- New match: retain players/settings and reset their scores. ---
  const playAgain = () => {
    if (route("playAgain", [])) return;
    gameRecordedRef.current = false;
    setRound((r) => r + 1);
    setRoleReady([]);

    const wordSet = pickRandom(getWordSets());
    setCurrentWordSet(wordSet);

    const shuffledIndices = shuffle(players.map((_, i) => i));
    const impostorIndices = new Set(shuffledIndices.slice(0, Math.min(impostorCount, Math.floor((players.length - 1) / 2))));
    // Bei aktivem Schalter jede Runde neu mischen, sonst die Setup-Reihenfolge.
    const seats = players.map((_, i) => i);
    setOrder(randomOrder ? shuffle(seats) : seats);

    setPlayers((prev) =>
      prev.map((p, i) => ({
        ...p,
        isImpostor: impostorIndices.has(i),
        hasSpoken: false,
        votedFor: null,
        score: 0,
      }))
    );

    setBonusGuess('');
    setBonusResult(null);
    setRevealIndex(0);
    setWordVisible(false);
    setPhase('wordReveal');
  };

  useEffect(() => {
    if (phase === 'results' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players.find(p => p.id === online.myPlayerId) : winner;
      recordEnd('hochstapler', me?.score ?? 0, !!me && me.score === Math.max(...players.map(p => p.score)));
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const resetGame = () => {
    if (route("resetGame", [])) return;
    setRound(1);
    setPhase('setup');
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        isImpostor: false,
        hasSpoken: false,
        votedFor: null,
        score: 0,
      }))
    );
    setCurrentWordSet(null);
    setBonusGuess('');
    setBonusResult(null);
  };

  const canStart = players.length >= 4 && players.every((p) => p.name.trim());

  // --- Format timer ---
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Jede Phase hat hier ihr eigenes `return`. Damit der Verlassen-Dialog nicht
  // sechsmal im Quelltext steht, wird er einmal gebaut und unten eingesetzt.
  const exitDialog = <ConfirmExitDialog {...exitGuard.dialogProps} accent="#e6b76a" />;

  // =========================================================================
  // RENDER
  // =========================================================================

  // Gerendert wird die GEZEIGTE Phase: online haelt usePhaseGate eine neue Phase
  // bis zum gemeinsamen Start zurueck, damit Host, Handys und TV gleichzeitig wechseln.
  const view = gate.shown;
  const renderPhase = () => {

  // --- SETUP ---
  if (view === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  // Waehrend das Handy weitergegeben wird, ist NUR der deckende Weitergabe-Bildschirm im DOM.
  if (handover.overlay) return <>{handover.overlay}{exitDialog}</>;
  if (online && view === 'wordReveal') {
    // Wer haelt das Handy? Ein bestaetigter Gast, sonst der eigene Platz.
    const viewerId = handover.activeGuest ?? online.myPlayerId;
    const index = players.findIndex(p => p.id === viewerId);
    const me = players[index];
    const finishReveal = () => {
      setWordVisible(false);
      readyRole(index);
      if (handover.activeGuest === viewerId) handover.done();
    };
    return <div className="dossier-private min-h-[100dvh] p-4 mx-auto flex flex-col justify-center gap-5">
      <StageHeader eyebrow={t('games.impostor.privateRole')} title={me?.name} progress={{ value: roleReady.length, total: players.length }} />
      <button className="dossier-file" data-testid="impostor-role-card" data-player-id={viewerId} aria-pressed={wordVisible} onClick={() => setWordVisible(v => !v)}>
        <span className="dossier-file-number" aria-hidden="true">{String(index + 1).padStart(2, '0')} / {String(players.length).padStart(2, '0')}</span>
        <span className="dossier-file-title">{wordVisible ? me?.isImpostor ? t('native.gameNames.hochstapler') : currentWordSet?.word : t('games.impostor.viewRole')}</span>
        {!hideCategory && <span className="dossier-category">{currentWordSet?.category}</span>}
      </button>
      <StageAction data-testid="impostor-ready" disabled={index < 0 || roleReady.includes(viewerId)} onClick={finishReveal}>
        {roleReady.includes(viewerId) ? t('games.impostor.waitPlayers') : t('games.impostor.readyRole')}
      </StageAction>
      <StageAction variant="ghost" onClick={exitGuard.request}>{t('games.impostor.exitGame')}</StageAction>
      {exitDialog}
    </div>;
  }

  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#0a0e14] px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          <StageHeader title={t('games.impostor.title')} subtitle={t('games.impostor.subtitle')} />

          {round > 1 && (
            <div className="text-center text-xs text-[#e6b76a] font-semibold">
              {t('games.impostor.round', { round })}
            </div>
          )}

          {/* Player list */}
          <PlayerSetup
            locked={!!online}
            players={players.map((p) => ({ id: p.id, name: p.name }))}
            onAdd={addPlayer}
            onRemove={removePlayer}
            onRename={updateName}
            onImportNames={isOnlineOrParty ? undefined : handleImportNames}
            min={4}
            max={15}
            accent="#e6b76a"
            label={t('games.impostor.playerLabel')}
          />

          {/* Impostor count */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a8abb3]">
              {t('games.impostor.impostorCountLabel')}
            </h2>
            <div className="flex gap-3">
              {[1, 2].filter(n => n < players.length / 2).map((n) => (
                <motion.button
                  key={n}
                  onClick={() => setImpostorCount(n)}
                  className={cn(
                    'flex-1 py-3 rounded-2xl border-2 font-semibold text-sm transition-colors',
                    impostorCount === n
                      ? 'border-[#ff6b98] bg-[#ff6b98]/10 text-[#ff6b98]'
                      : 'border-[#44484f] bg-[#151a21]/40 text-[#a8abb3] hover:border-[#44484f]/60'
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  {t('games.impostor.impostorCountOption', { count: n })}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Timer */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a8abb3]">
              {t('games.impostor.discussionTime')}
            </h2>
            <div className="flex gap-3">
              {[60, 90, 120].map((t) => (
                <motion.button
                  key={t}
                  onClick={() => setTimerDuration(t)}
                  className={cn(
                    'flex-1 py-3 rounded-2xl border-2 font-semibold text-sm transition-colors',
                    timerDuration === t
                      ? 'border-[#e6b76a] bg-[#e6b76a]/10 text-[#e6b76a]'
                      : 'border-[#44484f] bg-[#151a21]/40 text-[#a8abb3] hover:border-[#44484f]/60'
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  {t}s
                </motion.button>
              ))}
            </div>
          </section>

          {/* Difficulty: hide category */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a8abb3]">
              {t('games.impostor.difficulty')}
            </h2>
            <button
              type="button"
              onClick={() => setHideCategory((v) => !v)}
              aria-pressed={hideCategory}
              className={cn(
                'w-full flex items-center gap-3 py-3 px-4 rounded-2xl border-2 text-left transition-colors',
                hideCategory
                  ? 'border-[#ff6b98] bg-[#ff6b98]/10'
                  : 'border-[#44484f] bg-[#151a21]/40 hover:border-[#44484f]/60'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold', hideCategory ? 'text-[#ff6b98]' : 'text-[#f1f3fc]')}>
                  {t('games.impostor.hideCategory')}
                </p>
                <p className="text-xs text-[#a8abb3] mt-0.5">
                  {t('games.impostor.hideCategoryHint')}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors',
                  hideCategory ? 'bg-[#ff6b98]' : 'bg-[#44484f]'
                )}
              >
                <span
                  className={cn(
                    'block w-6 h-6 rounded-full bg-white transition-transform',
                    hideCategory ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRandomOrder((v) => !v)}
              aria-pressed={randomOrder}
              className={cn(
                'w-full flex items-center gap-3 py-3 px-4 rounded-2xl border-2 text-left transition-colors',
                randomOrder
                  ? 'border-[#e6b76a] bg-[#e6b76a]/10'
                  : 'border-[#44484f] bg-[#151a21]/40 hover:border-[#44484f]/60'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold', randomOrder ? 'text-[#e6b76a]' : 'text-[#f1f3fc]')}>
                  {t('games.impostor.randomOrder')}
                </p>
                <p className="text-xs text-[#a8abb3] mt-0.5">
                  {t('games.impostor.randomOrderHint')}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors',
                  randomOrder ? 'bg-[#e6b76a]' : 'bg-[#44484f]'
                )}
              >
                <span
                  className={cn(
                    'block w-6 h-6 rounded-full bg-white transition-transform',
                    randomOrder ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </span>
            </button>
          </section>

          {/* Start */}
          <motion.button
            onClick={startGame}
            disabled={!canStart}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all',
              canStart
                ? 'bg-gradient-to-r from-[#e6b76a] via-[#ff6b98] to-[#e6b76a] text-white shadow-[0_0_20px_rgba(230,183,106,0.3)] hover:shadow-[0_0_30px_rgba(230,183,106,0.4)]'
                : 'bg-[#1b2028] text-gray-500 cursor-not-allowed'
            )}
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            <Play className="w-5 h-5" />
            {t('games.setup.startGame')}
          </motion.button>
        </div>
      </div>
    );
  }

  // --- WORD REVEAL ---
  if (view === 'wordReveal') {
    const currentPlayer = players[seat(Math.min(revealIndex, players.length - 1))];
    if (!currentPlayer) return <>{exitDialog}</>;
    const phaseNum = String(revealIndex + 1).padStart(2, '0');
    const totalPhases = String(players.length).padStart(2, '0');
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc]">
        {exitDialog}
        {/* Ambient glow layer */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-[#e6b76a]/10 blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[#e6b76a]/10 blur-[120px]" />
          <div className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-[#0a0e14] to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-10">
          <div className="w-full max-w-md space-y-8">
            {/* Phase pill */}
            <div className="flex justify-center">
              <div className="px-4 py-1 rounded-full bg-[#20262f] border border-[#e6b76a]/20 text-[#e6b76a] text-[10px] font-bold tracking-[0.25em] uppercase">
                {t('games.impostor.privateRole')} · {phaseNum}/{totalPhases}
              </div>
            </div>

            {/* Main secret card with asymmetric deco */}
            <div className="relative group">
              {/* Decorative rotating square top-left */}
              <motion.div
                className="absolute -top-4 -left-4 w-16 h-16 rounded-xl rotate-12 opacity-20 bg-gradient-to-br from-[#e6b76a] to-[#e6b76a]"
                animate={ambient ? { rotate: [12, 45, 12] } : undefined}
                transition={ambient ? { duration: 12, repeat: Infinity, ease: 'easeInOut' } : undefined}
              />

              <div className="dossier-offline relative z-10 p-8 flex flex-col items-center text-center space-y-6 overflow-hidden"
                style={{
                  background: 'rgba(32, 38, 47, 0.4)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(230, 183, 106, 0.25)',
                }}
              >
                {/* Radial texture */}
                <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(230,183,106,0.4),transparent_60%)]" />

                <AnimatePresence mode="wait">
                  {!wordVisible && !unlocking && (
                    <motion.div
                      key={`pass-${revealIndex}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="relative z-10 w-full space-y-6"
                    >
                      <div className="space-y-2">
                        <span className="text-[#e6b76a] font-bold tracking-[0.25em] text-[10px] uppercase">
                          {phaseNum}
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                          {t('games.impostor.passPhone')}
                        </h2>
                      </div>
                      <div className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-[#44484f]/40 flex flex-col items-center justify-center overflow-hidden bg-black/40">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#e6b76a]/5 to-[#e6b76a]/5" />
                        {/* Ambient lock — gently breathes to signal "tap to unlock".
                            Infinite loop → only when ambient (off on native). */}
                        <motion.div
                          animate={ambient ? { scale: [1, 1.06, 1], y: [0, -2, 0] } : undefined}
                          transition={ambient ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
                          className="relative"
                        >
                          <Lock className="w-14 h-14 text-[#e6b76a]/60 drop-shadow-[0_0_16px_rgba(230,183,106,0.35)]" />
                        </motion.div>
                        <p className="relative mt-3 text-2xl font-black bg-gradient-to-r from-[#e6b76a] to-[#e6b76a] bg-clip-text text-transparent">
                          {currentPlayer.name}
                        </p>
                      </div>
                      <motion.button
                        onClick={handleRevealTap}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-4 px-8 rounded-full text-[#0a0e14] font-extrabold text-sm tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(230,183,106,0.4)] hover:shadow-[0_0_30px_rgba(230,183,106,0.6)] transition-all"
                        style={{ background: '#e6b76a', color: '#24281f', boxShadow: 'none', borderRadius: 5 }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Eye className="w-4 h-4" /> {t('games.impostor.showSecret')}
                        </span>
                      </motion.button>
                    </motion.div>
                  )}

                  {unlocking && (
                    <motion.div
                      key={`unlocking-${revealIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        // Whole card shakes subtly while the lock breaks
                        x: [0, -3, 3, -3, 3, 0, 0, 0],
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 1.1, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1] }}
                      className="relative z-10 w-full min-h-[260px] flex flex-col items-center justify-center"
                    >
                      {/* Radial flash behind the lock — opacity/scale only
                          (transform + opacity, compositor-cheap). Background is
                          static, not tweened. */}
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: currentPlayer.isImpostor
                            ? 'radial-gradient(circle, rgba(255,110,132,0.55), transparent 65%)'
                            : 'radial-gradient(circle, rgba(143,245,255,0.55), transparent 65%)',
                        }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{
                          opacity: [0, 0.45, 0.3, 0.9, 0],
                          scale:   [0.6, 1, 1.1, 1.6, 2],
                        }}
                        transition={{ duration: 1.1, ease: 'easeOut' }}
                      />

                      {/* The lock itself — shake → spin-up → fly away */}
                      <motion.div
                        className="relative"
                        initial={{ rotate: 0, scale: 1, y: 0, opacity: 1 }}
                        animate={{
                          // t=0 to 0.5: violent shake in place
                          // t=0.5 to 0.8: scale up + flash
                          // t=0.8 to 1.1: shackle flies up, body dissolves
                          rotate: [0, -6, 6, -8, 8, -4, 0, -14],
                          scale:  [1, 1, 1, 1, 1.05, 1.2, 1.3, 0.6],
                          y:      [0, 0, 0, 0, 0, -6, -14, -36],
                          opacity: [1, 1, 1, 1, 1, 1, 0.7, 0],
                        }}
                        transition={{ duration: 1.1, times: [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.78, 1] }}
                      >
                        <Lock
                          className="w-20 h-20 drop-shadow-[0_0_24px_rgba(230,183,106,0.6)]"
                          style={{
                            color: currentPlayer.isImpostor ? '#ff6e84' : '#e6b76a',
                          }}
                        />
                        {/* Swap-in open-lock on the tail end for a crisp unlock beat */}
                        <motion.div
                          className="absolute inset-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0, 0, 0, 0, 0, 0.9, 0] }}
                          transition={{ duration: 1.1, times: [0, 0.5, 0.6, 0.65, 0.7, 0.75, 0.8, 0.95] }}
                        >
                          <LockOpen
                            className="w-20 h-20"
                            style={{ color: currentPlayer.isImpostor ? '#ffb2b9' : '#eee3cb' }}
                          />
                        </motion.div>
                      </motion.div>

                      {/* Sparks at the moment of cracking — decorative burst,
                          skipped on native so the crack→reveal stays cheap. */}
                      {ambient && (
                        <motion.div
                          className="absolute inset-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0, 0, 0, 0.9, 1, 0.4, 0] }}
                          transition={{ duration: 1.1, times: [0, 0.4, 0.5, 0.55, 0.6, 0.7, 0.85, 1] }}
                        >
                          <ParticleBurst
                            count={18}
                            color={currentPlayer.isImpostor ? '#ff6e84' : '#eee3cb'}
                            radius={140}
                            size={6}
                            duration={0.6}
                            delay={0.55}
                          />
                        </motion.div>
                      )}

                      {/* Tiny "cracking" label */}
                      <motion.span
                        className="absolute bottom-4 text-[10px] font-bold tracking-[0.3em] uppercase"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4] }}
                        transition={{ duration: 1.1, times: [0, 0.2, 0.8, 1] }}
                        style={{ color: currentPlayer.isImpostor ? '#ffb2b9' : '#eee3cb' }}
                      >
                        {currentPlayer.isImpostor ? t('games.impostor.intrusionDetected') : t('games.impostor.accessGranted')}
                      </motion.span>
                    </motion.div>
                  )}

                  {wordVisible && !unlocking && (
                    <motion.div
                      key={`word-${revealIndex}`}
                      initial={{ opacity: 0, scale: 0.85, rotateY: 60 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                      className="relative z-10 w-full space-y-6"
                    >
                      {/* Rotating background glow ring — role-tinted */}
                      <RotatingGlowRing impostor={currentPlayer.isImpostor} ambient={ambient} />

                      {currentPlayer.isImpostor ? (
                        <div className="relative space-y-4">
                          {/* Danger scan line + red vignette pulse — decorative
                              infinite loops, only when ambient (off on native). */}
                          {ambient && (
                            <div className="absolute -inset-x-6 -inset-y-6 pointer-events-none overflow-hidden rounded-2xl">
                              <DangerScanLine />
                              {/* Red vignette pulse at the edges */}
                              <motion.div
                                className="absolute inset-0 rounded-2xl"
                                animate={{
                                  boxShadow: [
                                    'inset 0 0 24px rgba(255,110,132,0.35)',
                                    'inset 0 0 60px rgba(255,110,132,0.55)',
                                    'inset 0 0 24px rgba(255,110,132,0.35)',
                                  ],
                                }}
                                transition={{ duration: 1.4, repeat: Infinity }}
                              />
                            </div>
                          )}
                          <motion.span
                            className="relative text-[#ff6e84] font-bold tracking-[0.25em] text-[10px] uppercase"
                            initial={ambient ? { opacity: 0, letterSpacing: '0.6em' } : { opacity: 0 }}
                            animate={ambient ? { opacity: 1, letterSpacing: '0.25em' } : { opacity: 1 }}
                            transition={{ duration: 0.4 }}
                          >
                            {t('games.impostor.roleRevealed')}
                          </motion.span>
                          <motion.div
                            animate={{ x: [0, -5, 5, -5, 5, 0], rotate: [0, -3, 3, -3, 3, 0] }}
                            transition={{ duration: 0.6, repeat: 2 }}
                            className="relative flex justify-center"
                          >
                            {/* Warning icon with radial pulse behind it —
                                infinite loop, only when ambient. */}
                            {ambient && (
                              <motion.div
                                className="absolute w-24 h-24 rounded-full"
                                animate={{
                                  scale: [1, 1.6, 1],
                                  opacity: [0.5, 0, 0.5],
                                }}
                                transition={{ duration: 1.4, repeat: Infinity }}
                                style={{ background: 'radial-gradient(circle, rgba(255,110,132,0.4), transparent 70%)' }}
                              />
                            )}
                            <AlertTriangle className="relative w-16 h-16 text-[#ff6e84] drop-shadow-[0_0_28px_rgba(255,110,132,0.7)]" />
                          </motion.div>
                          <motion.h2
                            className="relative text-4xl sm:text-5xl font-black tracking-tight text-[#ff6e84] drop-shadow-[0_0_24px_rgba(255,110,132,0.6)]"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: [0.7, 1.1, 1] }}
                            transition={{ duration: 0.55, ease: 'backOut' }}
                          >
                            {/* textShadow keyframe loop repaints every frame —
                                only animate when ambient; else static glow. */}
                            <motion.span
                              animate={ambient ? {
                                textShadow: [
                                  '0 0 0px #ff6e84',
                                  '0 0 28px #ff6e84, 2px 0 0 #a70138, -2px 0 0 #ffb2b9',
                                  '0 0 12px #ff6e84',
                                ],
                              } : undefined}
                              transition={ambient ? { duration: 1.8, repeat: Infinity } : undefined}
                              style={ambient ? undefined : { textShadow: '0 0 18px #ff6e84' }}
                            >
                              {t('games.impostor.impostorRole')}
                            </motion.span>
                          </motion.h2>
                          <p className="relative text-sm text-[#a8abb3]">
                            {t('games.impostor.impostorHint')}
                          </p>
                          {!hideCategory && (
                            <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff6e84]/10 border border-[#ff6e84]/30 text-[11px] font-bold uppercase tracking-widest text-[#ff6e84]">
                              <Zap className="w-3 h-3" />
                              {t('games.impostor.categoryDot')} {currentWordSet?.category}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative space-y-4">
                          {/* Floating sparkles around the safe word — decorative
                              infinite loops (transform/opacity). Capped to 3 and
                              only rendered when ambient (none on native). */}
                          {ambient && [0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="absolute will-change-transform"
                              style={{
                                top:   `${15 + Math.sin(i) * 30 + i * 8}%`,
                                left:  `${10 + (i * 83) % 80}%`,
                                color: i % 2 === 0 ? '#eee3cb' : '#e6b76a',
                              }}
                              initial={{ opacity: 0, y: 10, scale: 0.4 }}
                              animate={{
                                opacity: [0, 0.9, 0.5, 0.9, 0],
                                y: [10, -8, 2, -6, -14],
                                scale: [0.4, 1, 0.8, 1.05, 0.6],
                              }}
                              transition={{
                                duration: 3 + (i % 3) * 0.5,
                                delay: 0.2 + i * 0.25,
                                repeat: Infinity,
                                repeatDelay: 0.4,
                              }}
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.span>
                          ))}

                          <motion.span
                            className="relative text-[#eee3cb] font-bold tracking-[0.25em] text-[10px] uppercase"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                          >
                            {t('games.impostor.yourWord')}
                          </motion.span>
                          {!hideCategory && (
                            <p className="relative text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a8abb3]">
                              {currentWordSet?.category}
                            </p>
                          )}
                          {/* Word reveal. On ambient (desktop) each letter springs
                              in with a 3D flip. On native/reduced-motion that's
                              N simultaneous per-letter springs at the exact moment
                              the WORD appears — the reported hang — so we fall back
                              to one cheap opacity/translateY fade of the whole word. */}
                          {ambient ? (
                            <motion.p
                              className="relative text-5xl font-black leading-none text-white drop-shadow-[0_0_24px_rgba(230,183,106,0.45)] tracking-tight flex justify-center flex-wrap"
                              initial="hidden"
                              animate="show"
                              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
                            >
                              {(currentWordSet?.word ?? '').split('').map((ch, i) => (
                                <motion.span
                                  key={`${ch}-${i}`}
                                  className="inline-block"
                                  variants={{
                                    hidden: { opacity: 0, y: 20, rotateX: 80 },
                                    show:   { opacity: 1, y: 0,  rotateX: 0,  transition: { type: 'spring', stiffness: 280, damping: 14 } },
                                  }}
                                  style={{ whiteSpace: 'pre' }}
                                >
                                  {ch}
                                </motion.span>
                              ))}
                            </motion.p>
                          ) : (
                            <motion.p
                              className="relative text-5xl font-black leading-none text-white drop-shadow-[0_0_24px_rgba(230,183,106,0.45)] tracking-tight flex justify-center flex-wrap"
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.28 }}
                            >
                              {online && players.find(p => p.id === online.myPlayerId)?.isImpostor ? '???' : currentWordSet?.word}
                            </motion.p>
                          )}
                          <p className="relative text-xs text-[#a8abb3]/80">
                            {t('games.impostor.rememberHint')}
                          </p>
                          {/* Success particle burst fires once at reveal —
                              decorative, skipped on native to keep the word
                              appearance a cheap transform/opacity reveal. */}
                          {ambient && (
                            <div className="relative">
                              <ParticleBurst count={14} color="#eee3cb" radius={150} size={5} duration={1.1} delay={0} />
                            </div>
                          )}
                        </div>
                      )}
                      <motion.button
                        onClick={handleRevealTap}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "dossier-acknowledge relative w-full py-4 px-8 border font-extrabold text-sm tracking-[0.2em] uppercase transition-colors",
                          currentPlayer.isImpostor
                            ? "bg-[#20262f] border-[#ff6e84]/30 text-[#ff6e84] hover:bg-[#262c36]"
                            : "bg-[#20262f] border-[#eee3cb]/30 text-[#eee3cb] hover:bg-[#262c36]",
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <EyeOff className="w-4 h-4" /> {t('games.impostor.understood')}
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decorative corner bracket bottom-right */}
              <div className="pointer-events-none absolute -bottom-2 -right-2 w-24 h-24 border-b-2 border-r-2 border-[#eee3cb]/30 rounded-br-3xl" />
            </div>

            {/* Players ready mini grid */}
            <div className="grid grid-cols-4 gap-3 pt-4">
              {(order.length ? order : players.map((_, i) => i)).map((pi, i) => {
                const p = players[pi];
                const done = i < revealIndex;
                const current = i === revealIndex;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex flex-col items-center space-y-2',
                      !done && !current && 'opacity-40',
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold',
                        done && 'bg-[#e6b76a]/20 border-[#e6b76a]',
                        current && 'bg-[#e6b76a]/20 border-[#e6b76a] shadow-[0_0_16px_rgba(230,183,106,0.22)]',
                        !done && !current && 'bg-[#20262f] border-[#44484f]',
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-[#e6b76a]" />
                      ) : (
                        getPlayerInitial(p.name)
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider',
                        current ? 'text-[#e6b76a]' : done ? 'text-[#e6b76a]/80' : 'text-[#a8abb3]',
                      )}
                    >
                      {p.name.length > 8 ? p.name.slice(0, 8) : p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DISCUSSION ---
  if (view === 'discussion') {
    const urgency = timeLeft <= 10;
    const spokenCount = players.filter((p) => p.hasSpoken).length;
    const progress = players.length > 0 ? spokenCount / players.length : 0;
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc]">
        {exitDialog}
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 -right-20 w-72 h-72 rounded-full bg-[#e6b76a]/10 blur-[110px]" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-[#ff6b98]/10 blur-[130px]" />
        </div>

        <div className="dossier-proceedings relative z-10 mx-auto max-w-md px-6 py-8 space-y-6">
          {/* Phase pill */}
          <div className="flex justify-center">
            <div className="px-4 py-1 rounded-full bg-[#20262f] border border-[#e6b76a]/20 text-[#e6b76a] text-[10px] font-bold tracking-[0.25em] uppercase">
              {t('games.impostor.discussionPhase')}
            </div>
          </div>

          {/* Timer card */}
          <div className="relative group">
            <motion.div
              className="absolute -top-3 -right-3 w-14 h-14 rounded-xl rotate-12 opacity-20 bg-gradient-to-br from-[#eee3cb] to-[#e6b76a]"
              animate={ambient ? { rotate: [12, -12, 12] } : undefined}
              transition={ambient ? { duration: 10, repeat: Infinity, ease: 'easeInOut' } : undefined}
            />
            <motion.div
              className={cn(
                'relative z-10 rounded-2xl p-6 text-center overflow-hidden',
                urgency ? 'border border-[#ff6e84]/50' : 'border border-[#e6b76a]/20',
              )}
              style={{
                background: 'rgba(32, 38, 47, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
              animate={urgency && ambient ? { scale: [1, 1.02, 1] } : {}}
              transition={urgency && ambient ? { repeat: Infinity, duration: 0.6 } : {}}
            >
              <span className={cn(
                'text-[10px] font-bold tracking-[0.3em] uppercase',
                urgency ? 'text-[#ff6e84]' : 'text-[#a8abb3]',
              )}>
                {urgency ? t('games.impostor.lastSeconds') : t('games.impostor.timeForDiscussion')}
              </span>
              <p className={cn(
                'text-6xl font-black tabular-nums tracking-tighter mt-1 drop-shadow-[0_0_12px_rgba(241,243,252,0.25)]',
                urgency ? 'text-[#ff6e84]' : 'text-white',
              )}>
                {formatTime(timeLeft)}
              </p>
              {!hideCategory && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0e14]/60 border border-[#44484f]/40 text-[11px] text-[#a8abb3]">
                  {t('games.impostor.categoryDot')} <span className="text-[#e6b76a] font-semibold">{currentWordSet?.category}</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Progress + speakers */}
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-[#a8abb3]">
                {t('games.impostor.takeTurns')}
              </h2>
              <span className="text-[11px] font-mono text-[#eee3cb]">
                {spokenCount} / {players.length}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-[#20262f] overflow-hidden">
              {/* Animate scaleX (compositor) instead of width (layout reflow). */}
              <motion.div
                className="h-full w-full origin-left bg-gradient-to-r from-[#eee3cb] via-[#e6b76a] to-[#ff6b98]"
                animate={{ scaleX: progress }}
                transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              />
            </div>
            <div className="space-y-2">
              {(order.length ? order : players.map((_, i) => i)).map((pi, i) => {
                const player = players[pi];
                const isActive = i === currentSpeaker && !player.hasSpoken;
                return (
                  <motion.button
                    key={player.id}
                    data-testid={`impostor-speaker-${player.id}`}
                    onClick={() => !player.hasSpoken && markSpoken(i)}
                    disabled={player.hasSpoken}
                    whileTap={{ scale: player.hasSpoken ? 1 : 0.98 }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors overflow-hidden relative',
                      isActive && 'border-[#e6b76a]/60 shadow-[0_0_16px_rgba(230,183,106,0.18)]',
                      player.hasSpoken && 'border-[#44484f]/30 opacity-50',
                      !isActive && !player.hasSpoken && 'border-[#44484f]/50 hover:border-[#e6b76a]/30',
                    )}
                    style={{
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(230,183,106,0.12), rgba(255,107,152,0.08))'
                        : 'rgba(21, 26, 33, 0.4)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: getPlayerColor(i) }}
                    >
                      {getPlayerInitial(player.name)}
                    </div>
                    <span className="flex-1 text-sm font-semibold">{player.name}</span>
                    {player.hasSpoken ? (
                      <CheckCircle2 className="w-5 h-5 text-[#eee3cb]" />
                    ) : isActive ? (
                      <motion.div
                        animate={ambient ? { x: [0, 3, 0] } : undefined}
                        transition={ambient ? { repeat: Infinity, duration: 1.2 } : undefined}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#e6b76a]"
                      >
                        {t('games.impostor.yourTurn')}
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* CTA to voting */}
          <motion.button
            data-testid="impostor-to-voting"
            onClick={skipToVoting}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-full text-[#0a0e14] font-extrabold text-sm tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(255,107,152,0.35)] flex items-center justify-center gap-2"
            style={{ background: '#e6b76a', color: '#24281f', boxShadow: 'none', borderRadius: 5 }}
          >
            {t('games.impostor.toVoting')}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    );
  }

  // --- VOTING ---
  if (view === 'voting') {
    const voter = players[seat(Math.min(votingPlayer, players.length - 1))];
    if (!voter) return <>{exitDialog}</>;
    // Online stimmt nur ab, wer das Handy hat: der eigene Platz oder der bestaetigte Gast.
    const canVote = !online || (voter?.id === online.myPlayerId && handover.state.status === 'idle') || voter?.id === handover.activeGuest;
    const vote = (targetId: string) => {
      const guestVoting = !!online && voter?.id === handover.activeGuest;
      castVote(targetId);
      if (guestVoting) handover.done();
    };
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc]">
        {exitDialog}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-[#ff6b98]/12 blur-[120px]" />
          <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-[#e6b76a]/10 blur-[100px]" />
        </div>
        <div className="dossier-proceedings relative z-10 mx-auto max-w-md px-6 py-8 space-y-6">
          <div className="flex justify-center">
            <div className="px-4 py-1 rounded-full bg-[#20262f] border border-[#ff6b98]/30 text-[#ff6b98] text-[10px] font-bold tracking-[0.25em] uppercase">
              {t('games.impostor.votingPhase', { current: votingPlayer + 1, total: players.length })}
            </div>
          </div>
          <div className="relative group">
            <motion.div
              className="absolute -top-3 -left-3 w-14 h-14 rounded-xl rotate-12 opacity-20 bg-gradient-to-br from-[#ff6b98] to-[#e6b76a]"
              animate={ambient ? { rotate: [12, 40, 12] } : undefined}
              transition={ambient ? { duration: 14, repeat: Infinity, ease: 'easeInOut' } : undefined}
            />
            <div
              className="relative z-10 rounded-2xl p-6 text-center space-y-2 overflow-hidden"
              style={{
                background: 'rgba(32, 38, 47, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 107, 152, 0.18)',
              }}
            >
              <span className="text-[#ff6b98] font-bold tracking-[0.25em] text-[10px] uppercase">
                {t('games.impostor.isVoting', { name: voter.name })}
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight">{t('games.impostor.whoIsImpostor')}</h2>
              <p className="text-xs text-[#a8abb3]">{t('games.impostor.secretVote')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {players.map((target, i) => {
              const isSelf = target.id === voter.id;
              return (
                <motion.button
                  key={target.id}
                  data-testid={`impostor-vote-${target.id}`}
                  onClick={() => !isSelf && canVote && vote(target.id)}
                  disabled={isSelf || !canVote}
                  whileHover={!isSelf ? { scale: 1.03 } : {}}
                  whileTap={!isSelf ? { scale: 0.95 } : {}}
                  className={cn(
                    'relative p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all overflow-hidden',
                    isSelf
                      ? 'border-[#44484f]/30 opacity-30 cursor-not-allowed'
                      : 'border-[#44484f]/50 hover:border-[#ff6b98]/60',
                  )}
                  style={{
                    background: isSelf
                      ? 'rgba(21, 26, 33, 0.3)'
                      : 'rgba(32, 38, 47, 0.4)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                    style={{ backgroundColor: getPlayerColor(i) }}
                  >
                    {getPlayerInitial(target.name)}
                  </div>
                  <span className="text-sm font-semibold truncate max-w-full">{target.name}</span>
                  {isSelf && (
                    <span className="text-[10px] uppercase tracking-widest text-[#a8abb3]">{t('games.impostor.selfLabel')}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- REVEAL COUNTDOWN ---
  if (view === 'revealCountdown') {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        {exitDialog}
        <AnimatePresence mode="wait">
          <motion.span
            key={countdownNum}
            className="text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {countdownNum}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  // --- REVEAL ---
  if (view === 'reveal') {
    return (
      <div className="min-h-screen bg-[#0a0e14] px-4 py-8 flex items-center justify-center">
        {exitDialog}
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Result banner */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className={cn(
              'py-6 px-4 rounded-3xl border-2',
              impostorCaught
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-red-500/50 bg-red-500/10'
            )}
          >
            <motion.p
              className={cn(
                'text-3xl font-black mb-2',
                impostorCaught ? 'text-green-400' : 'text-red-400'
              )}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: 3, duration: 0.4 }}
            >
              {impostorCaught ? t('games.impostor.impostorCaught') : t('games.impostor.impostorSurvived')}
            </motion.p>
            <p className="text-gray-300 text-sm">
              {impostorCaught
                ? t('games.impostor.impostorCaughtSub')
                : t('games.impostor.impostorSurvivedSub')}
            </p>
          </motion.div>

          {!mostVotedId && <p role="status" className="p-4 rounded-xl bg-amber-500/10 text-amber-200">{t('games.impostor.voteTie')}</p>}
          {impostorCount > 1 && <p className="text-sm text-white/60">{t('games.impostor.multiScoring')}</p>}
          {/* Most voted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <p className="text-[#a8abb3] text-xs uppercase tracking-wider">
              {t('games.impostor.mostVotes')}
            </p>
            {mostVotedPlayer && (
              <div className="flex items-center justify-center gap-3">
                <div
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ring-4',
                    mostVotedPlayer.isImpostor ? 'ring-red-500/60' : 'ring-green-500/60'
                  )}
                  style={{ backgroundColor: getPlayerColor(players.indexOf(mostVotedPlayer)) }}
                >
                  {getPlayerInitial(mostVotedPlayer.name)}
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">{mostVotedPlayer.name}</p>
                  <p className={cn('text-sm font-semibold', mostVotedPlayer.isImpostor ? 'text-red-400' : 'text-green-400')}>
                    {mostVotedPlayer.isImpostor ? t('games.impostor.wasImpostor') : t('games.impostor.wasNotImpostor')}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Real impostors */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-2"
          >
            <p className="text-[#a8abb3] text-xs uppercase tracking-wider">
              {impostors.length === 1 ? t('games.impostor.theImpostorWas') : t('games.impostor.theImpostorsWere')}
            </p>
            <div className="flex justify-center gap-3">
              {impostors.map((imp) => (
                <div key={imp.id} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-xl">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: getPlayerColor(players.indexOf(imp)) }}
                  >
                    {getPlayerInitial(imp.name)}
                  </div>
                  <span className="text-red-400 font-semibold text-sm">{imp.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* The real word */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-[#e6b76a]/10 border border-[#e6b76a]/30 rounded-2xl p-4"
          >
            <p className="text-[#a8abb3] text-xs uppercase tracking-wider mb-1">{t('games.impostor.theWordWas')}</p>
            <p className="text-3xl font-black text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              {view === 'reveal' && impostors.some(p => p.id !== mostVotedId) ? '???' : online && players.find(p => p.id === online.myPlayerId)?.isImpostor ? '???' : currentWordSet?.word}
            </p>
            <p className="text-[#e6b76a] text-xs mt-1">{currentWordSet?.category}</p>
          </motion.div>

          {/* Continue */}
          <motion.button
            data-testid="impostor-proceed"
            onClick={proceedFromReveal}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#e6b76a] via-[#ff6b98] to-[#e6b76a] text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {t('games.impostor.continue')}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    );
  }

  // --- BONUS GUESS ---
  if (view === 'bonusGuess') {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-4">
        {exitDialog}
        <div className="max-w-sm w-full space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <Crown className="w-12 h-12 text-yellow-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">
              {t('games.impostor.bonusRound')}
            </h2>
            <p className="text-[#a8abb3] text-sm">
              {t('games.impostor.bonusQuestion', { names: impostors.map((i) => i.name).join(' & ') })}
            </p>
            {!hideCategory && (
              <p className="text-[#e6b76a] text-xs">
                {t('games.impostor.bonusCategory', { category: currentWordSet?.category })}
              </p>
            )}
          </motion.div>

          {bonusResult === null ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <input
                type="text"
                value={bonusGuess}
                disabled={!!online && !players.some(p => localSeatIds.includes(p.id) && p.isImpostor && p.id !== mostVotedId)}
                onChange={(e) => setBonusGuess(e.target.value)}
                placeholder={t('games.impostor.wordPlaceholder')}
                className="w-full bg-[#151a21]/60 border border-[#44484f] rounded-xl px-4 py-3 text-white text-center text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                onKeyDown={(e) => e.key === 'Enter' && bonusGuess.trim() && submitBonusGuess()}
              />
              <motion.button
                data-testid="impostor-bonus-submit"
                onClick={() => submitBonusGuess()}
                disabled={!bonusGuess.trim()}
                className={cn(
                  'w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2',
                  bonusGuess.trim()
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                    : 'bg-[#1b2028] text-gray-500 cursor-not-allowed'
                )}
                whileTap={bonusGuess.trim() ? { scale: 0.97 } : {}}
              >
                <Send className="w-5 h-5" />
                {t('games.impostor.guess')}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'py-6 px-4 rounded-2xl border-2',
                bonusResult
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-gray-600 bg-[#151a21]/40'
              )}
            >
              <p className={cn('text-2xl font-black', bonusResult ? 'text-yellow-400' : 'text-[#a8abb3]')}>
                {bonusResult ? t('games.impostor.bonusCorrect') : t('games.impostor.bonusWrong')}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  if (view === 'results') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-[#0a0e14] px-4 py-8">
        <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
        <div className="mx-auto max-w-md space-y-6">
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[#a8abb3] text-sm uppercase tracking-wider">{t('games.results.leaderboard')}</p>
          </motion.div>

          <div className="space-y-2">
            {sorted.map((player, i) => (
              <motion.div
                key={player.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border',
                  i === 0
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#151a21]/40 border-[#44484f]/50'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="w-8 flex items-center justify-center">
                  {i === 0 ? (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <span className="text-sm font-bold text-gray-500">{i + 1}</span>
                  )}
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: getPlayerColor(players.indexOf(player)) }}
                >
                  {getPlayerInitial(player.name)}
                </div>
                <span className="flex-1 text-white font-medium text-sm truncate">
                  {player.name}
                </span>
                {player.isImpostor && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                    {t('games.impostor.impostorBadge')}
                  </span>
                )}
                <span className="text-sm font-bold text-gray-300 min-w-[40px] text-right">
                  {player.score}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <motion.div
            className="flex gap-3 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={resetGame}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-600 text-gray-300 font-semibold flex items-center justify-center gap-2 hover:border-gray-500 transition-colors text-sm"
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw className="w-4 h-4" />
              {t('games.impostor.resetGame')}
            </motion.button>
            <motion.button
              onClick={playAgain}
              className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-[#e6b76a] via-[#ff6b98] to-[#e6b76a] text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)] text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Play className="w-4 h-4" />
              {t('games.impostor.playAgain')}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

    return exitDialog;
  };

  return <>
    {renderPhase()}
    {/* Einblend-Takt (Design §9): Eingaben erst ab 1200 ms nach dem Wechsel — der Weitergabe-Bildschirm (z-90) bleibt bedienbar. */}
    {!gate.inputOpen && <div data-testid="phase-input-gate" aria-hidden className="fixed inset-0 z-[80]" />}
  </>;
}

export default function ImpostorGame({ online }: { online?: OnlineGameProps } = {}) {
  return <GameStage gameId="hochstapler" className="dossier-game"><ImpostorGameContent online={online} /></GameStage>;
}
