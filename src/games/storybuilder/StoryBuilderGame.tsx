import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play, Trophy, RotateCcw, ArrowRight, ArrowLeft,
  BookOpen, Pen, Sparkles, Music, Type, Eye,
} from 'lucide-react';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { cn } from '@/lib/utils';
import { STORY_STARTERS, STORY_PROMPTS } from './story-prompts-de';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'writing' | 'passing' | 'storyReveal' | 'gameOver';
type Mode = 'classic' | 'vorgabe' | 'reimzeit';

interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

interface StorySentence {
  playerId: string;
  playerName: string;
  text: string;
  prompt?: string;
}

const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
];

const MAX_CHARS = 150;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Setup config
// ---------------------------------------------------------------------------

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Klassisch', desc: 'Freier Text', icon: <Pen className="w-6 h-6" /> },
  { id: 'vorgabe', name: 'Vorgabe', desc: 'Mit Satzanfaengen', icon: <BookOpen className="w-6 h-6" /> },
  { id: 'reimzeit', name: 'Reimzeit', desc: 'Saetze muessen reimen', icon: <Music className="w-6 h-6" /> },
];

const SETUP_SETTINGS: SettingsConfig = {
  timer: { min: 1, max: 3, default: 1, step: 1, label: 'Saetze pro Spieler' },
  rounds: { min: 1, max: 5, default: 2, step: 1, label: 'Runden (Durchlaeufe)' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StoryBuilderGame({ online }: { online?: OnlineGameProps } = {}) {
  const navigate = useNavigate();

  // Setup
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<Mode>('classic');
  const [sentencesPerPlayer, setSentencesPerPlayer] = useState(1);
  const [totalRounds, setTotalRounds] = useState(2);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  // Game state
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentSentenceNum, setCurrentSentenceNum] = useState(1);
  const [sentences, setSentences] = useState<StorySentence[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Story reveal
  const [revealIdx, setRevealIdx] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  // Prompts deck
  const promptsDeck = useRef<string[]>([]);
  const promptsPos = useRef(0);
  const startersDeck = useRef<string[]>([]);
  const startersPos = useRef(0);

  useTVGameBridge('storybuilder', { phase, currentRound, currentPlayerIdx, players }, [phase, currentRound, currentPlayerIdx]);

  // Derived
  const currentPlayer = players[currentPlayerIdx] ?? null;
  const lastSentence = sentences.length > 0 ? sentences[sentences.length - 1] : null;
  const totalTurns = players.length * sentencesPerPlayer * totalRounds;
  const currentTurn = sentences.length + 1;

  // ---------------------------------------------------------------------------
  // Setup handler
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(
    (
      setupPlayers: { id: string; name: string; color: string; avatar: string }[],
      selectedMode: string,
      settings: { timer: number; rounds: number },
    ) => {
      const mapped: Player[] = setupPlayers.map((p, i) => ({
        ...p,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      }));
      setPlayers(mapped);
      setMode(selectedMode as Mode);
      setSentencesPerPlayer(settings.timer);
      setTotalRounds(settings.rounds);
      setSentences([]);
      setCurrentRound(1);
      setCurrentPlayerIdx(0);
      setCurrentSentenceNum(1);
      setInputText('');

      promptsDeck.current = shuffle(STORY_PROMPTS);
      promptsPos.current = 0;
      startersDeck.current = shuffle(STORY_STARTERS);
      startersPos.current = 0;

      // Set first prompt
      if (selectedMode === 'vorgabe') {
        const starter = startersDeck.current[0];
        startersPos.current = 1;
        setCurrentPrompt(starter);
      } else if (selectedMode === 'reimzeit') {
        setCurrentPrompt('Schreibe einen Satz, der sich reimt!');
      } else {
        setCurrentPrompt('');
      }

      setPhase('writing');
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Game logic
  // ---------------------------------------------------------------------------

  function getNextPrompt(): string {
    if (mode === 'vorgabe') {
      // First sentence of the entire story uses a starter
      if (sentences.length === 0) {
        return startersDeck.current[startersPos.current % startersDeck.current.length];
      }
      const prompt = promptsDeck.current[promptsPos.current % promptsDeck.current.length];
      promptsPos.current++;
      return prompt;
    }
    if (mode === 'reimzeit') {
      return 'Dein Satz muss sich reimen!';
    }
    return '';
  }

  function submitSentence() {
    const trimmed = inputText.trim();
    if (!trimmed || !currentPlayer) return;

    const newSentence: StorySentence = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      text: trimmed,
      prompt: mode === 'vorgabe' ? currentPrompt : undefined,
    };

    const updatedSentences = [...sentences, newSentence];
    setSentences(updatedSentences);
    setInputText('');

    // Calculate next turn
    const nextSentenceNum = currentSentenceNum + 1;
    if (nextSentenceNum > sentencesPerPlayer) {
      // Move to next player
      const nextPlayerIdx = currentPlayerIdx + 1;
      if (nextPlayerIdx >= players.length) {
        // Check if more rounds
        const nextRound = currentRound + 1;
        if (nextRound > totalRounds) {
          // Story complete, go to reveal
          setRevealIdx(0);
          setIsRevealing(false);
          setPhase('passing');
          // Use a short delay then go to reveal
          setTimeout(() => {
            setPhase('storyReveal');
          }, 100);
          return;
        }
        setCurrentRound(nextRound);
        setCurrentPlayerIdx(0);
      } else {
        setCurrentPlayerIdx(nextPlayerIdx);
      }
      setCurrentSentenceNum(1);
    } else {
      setCurrentSentenceNum(nextSentenceNum);
    }

    setCurrentPrompt(getNextPrompt());
    setPhase('passing');
  }

  function confirmPass() {
    setPhase('writing');
  }

  // Reveal animation
  useEffect(() => {
    if (phase !== 'storyReveal' || isRevealing) return;
    setIsRevealing(true);
    setRevealIdx(0);

    const interval = setInterval(() => {
      setRevealIdx(prev => {
        if (prev >= sentences.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [phase, sentences.length, isRevealing]);

  useEffect(() => {
    if (phase === 'storyReveal' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      recordEnd('story-builder', sentences.length, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  function resetGame() {
    setPhase('setup');
    setPlayers([]);
    setSentences([]);
  }

  /* ---- Online: host broadcasts game state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, currentRound, totalRounds, currentPlayerIdx,
      sentences: sentences.map(s => ({ playerName: s.playerName, text: s.text })),
    });
  }, [phase, currentRound, currentPlayerIdx, sentences, online]);

  /* ---- Online: non-host syncs state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as Phase);
      if (data.currentRound) setCurrentRound(data.currentRound as number);
      if (data.currentPlayerIdx !== undefined) setCurrentPlayerIdx(data.currentPlayerIdx as number);
      if (data.sentences) {
        const incoming = data.sentences as { playerName: string; text: string }[];
        setSentences(incoming.map(s => ({ playerId: '', playerName: s.playerName, text: s.text })));
      }
    });
  }, [online]);

  // =========================================================================
  // RENDER
  // =========================================================================

  if (phase === 'setup') {
    return (
      <GameSetup
        gameId="storybuilder"
        modes={GAME_MODES}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title="Story Builder"
        onlinePlayers={online?.players}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col">
      <style>{`
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#df8eff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#8ff5ff]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* ---- WRITING ---- */}
      {phase === 'writing' && currentPlayer && (
        <motion.div
          key={`write-${sentences.length}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <ActivePlayerBanner
            playerName={currentPlayer.name}
            playerColor={currentPlayer.color}
            playerAvatar={currentPlayer.avatar}
            hidden={false}
          />
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: currentPlayer.color }}
              >
                {currentPlayer.avatar}
              </div>
              <span className="text-sm text-white/60">{currentPlayer.name}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#1b2028] border border-[#44484f]/20 text-xs text-white/40">
              {currentTurn}/{totalTurns}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 max-w-lg mx-auto w-full">
            {/* Previous sentence (only last one visible) */}
            {lastSentence && (
              <div className="w-full rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  Letzter Satz von {lastSentence.playerName}
                </div>
                <p className="text-sm text-white/60 italic leading-relaxed">
                  "{lastSentence.text}"
                </p>
              </div>
            )}

            {/* Prompt (if vorgabe mode) */}
            {mode === 'vorgabe' && currentPrompt && (
              <div className="flex items-center gap-2 text-[#ff6b98] text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>{currentPrompt}</span>
              </div>
            )}

            {mode === 'reimzeit' && (
              <div className="flex items-center gap-2 text-[#8ff5ff] text-sm font-semibold">
                <Music className="w-4 h-4" />
                <span>Dein Satz muss sich reimen!</span>
              </div>
            )}

            {/* Input */}
            <div className="w-full relative">
              <textarea
                value={inputText}
                onChange={e => {
                  if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
                }}
                placeholder="Schreibe deinen Satz..."
                rows={3}
                className="w-full bg-[#151a21] border-0 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#df8eff]/40 resize-none"
              />
              <div className="absolute bottom-2 right-3 text-[10px] text-white/20">
                {inputText.length}/{MAX_CHARS}
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={submitSentence}
              disabled={inputText.trim().length === 0}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-full font-extrabold text-base transition-all',
                inputText.trim().length > 0
                  ? 'bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] shadow-[0_0_20px_rgba(223,142,255,0.3)]'
                  : 'bg-[#1b2028] text-white/20 cursor-not-allowed',
              )}
            >
              <Pen className="w-4 h-4" /> Abschicken
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ---- PASSING DEVICE ---- */}
      {phase === 'passing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full bg-[#1b2028] border border-[#44484f]/20 flex items-center justify-center"
          >
            <ArrowRight className="w-8 h-8 text-[#df8eff]" />
          </motion.div>
          <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-white text-center">
            Geraet weitergeben!
          </h2>
          {players[currentPlayerIdx] && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1b2028] border border-[#44484f]/20">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: players[currentPlayerIdx].color }}
              >
                {players[currentPlayerIdx].avatar}
              </div>
              <span className="text-sm text-white/70">{players[currentPlayerIdx].name} ist dran</span>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={confirmPass}
            className="mt-4 flex items-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] px-8 py-3 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(223,142,255,0.3)]"
          >
            <Play className="w-5 h-5" /> Bereit!
          </motion.button>
        </motion.div>
      )}

      {/* ---- STORY REVEAL ---- */}
      {phase === 'storyReveal' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full"
        >
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#df8eff]/10 border border-[#df8eff]/20 mb-3">
              <BookOpen className="w-6 h-6 text-[#df8eff]" />
            </div>
            <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] bg-clip-text text-transparent">
              Eure Geschichte
            </h2>
          </div>

          {/* Scrollable story */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-24">
            {sentences.map((s, i) => (
              <AnimatePresence key={i}>
                {i <= revealIdx && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                        style={{ backgroundColor: players.find(p => p.id === s.playerId)?.color ?? '#8b5cf6' }}
                      >
                        {s.playerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">
                        {s.playerName}
                      </span>
                    </div>
                    <motion.p
                      className="text-white/80 text-sm leading-relaxed font-[Plus_Jakarta_Sans]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {s.text}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Bottom actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14] to-transparent z-20">
            <div className="max-w-lg mx-auto space-y-3">
              {revealIdx < sentences.length - 1 ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRevealIdx(sentences.length - 1)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1b2028] border border-[#44484f]/20 text-white/60 py-3 rounded-full font-semibold text-sm"
                >
                  <Eye className="w-4 h-4" /> Alles zeigen
                </motion.button>
              ) : (
                <div className="space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={resetGame}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(223,142,255,0.3)]"
                  >
                    <RotateCcw className="w-4 h-4" /> Nochmal
                  </motion.button>
                  <button
                    onClick={() => navigate('/games')}
                    className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
                  >
                    Anderes Spiel
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
