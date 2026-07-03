import { lazy, Suspense, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TVParticles from './TVParticles';
import TVLobby from './TVLobby';
import TVLeaderboard from './TVLeaderboard';
import TVGameOver from './TVGameOver';
import TVVFXLayer from './components/TVVFXLayer';
import TVGlowFrame from './components/TVGlowFrame';
import { useTVConnection } from './useTVConnection';
import { useTVAudio } from './TVAudioManager';

// Lazy load game-specific TV views
const TVBombView = lazy(() => import('./games/TVBombView'));
const TVHeadUpView = lazy(() => import('./games/TVHeadUpView'));
const TVDrawView = lazy(() => import('./games/TVDrawView'));
const TVQuizView = lazy(() => import('./games/TVQuizView'));
const TVBottleView = lazy(() => import('./games/TVBottleView'));
const TVThisOrThatView = lazy(() => import('./games/TVThisOrThatView'));
const TVStoryView = lazy(() => import('./games/TVStoryView'));
const TVTabooView = lazy(() => import('./games/TVTabooView'));
const TVCategoryView = lazy(() => import('./games/TVCategoryView'));
const TVImpostorView = lazy(() => import('./games/TVImpostorView'));
const TVOhrwurmView = lazy(() => import('./games/TVOhrwurmView'));
const TVEmojiGuessView = lazy(() => import('./games/TVEmojiGuessView'));
const TVTruthDareView = lazy(() => import('./games/TVTruthDareView'));
const TVWhoAmIView = lazy(() => import('./games/TVWhoAmIView'));
const TVWordPressView = lazy(() => import('./games/TVWordPressView'));
const TVFindItView = lazy(() => import('./games/TVFindItView'));
const TVSmartFallback = lazy(() => import('./games/TVSmartFallback'));

const TVFallback = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-3 border-[#df8eff] border-t-transparent rounded-full animate-spin" />
  </div>
);

function GameView({ gameState, drawing }: { gameState: any; drawing: unknown[] }) {
  const game = gameState?.game || '';
  const props = { gameState, drawing };

  return (
    <Suspense fallback={TVFallback}>
      {game === 'bomb' && <TVBombView {...props} />}
      {game === 'headup' && <TVHeadUpView {...props} />}
      {(game === 'quickdraw' || game === 'draw') && <TVDrawView {...props} />}
      {(game === 'quiz' || game === 'splitquiz' || game === 'fakeorfact' || game === 'sharedquiz') && <TVQuizView {...props} />}
      {(game === 'flaschendrehen' || game === 'bottlespin') && <TVBottleView {...props} />}
      {(game === 'this-or-that' || game === 'thisorthat') && <TVThisOrThatView {...props} />}
      {(game === 'story-builder' || game === 'storybuilder') && <TVStoryView {...props} />}
      {game === 'taboo' && <TVTabooView {...props} />}
      {game === 'category' && <TVCategoryView {...props} />}
      {game === 'impostor' && <TVImpostorView {...props} />}
      {game === 'ohrwurm' && <TVOhrwurmView {...props} />}
      {game === 'emojiguess' && <TVEmojiGuessView {...props} />}
      {game === 'truthdare' && <TVTruthDareView {...props} />}
      {game === 'whoami' && <TVWhoAmIView {...props} />}
      {game === 'wordpress' && <TVWordPressView {...props} />}
      {game === 'findit' && <TVFindItView {...props} />}
      {/* Smart fallback for games without specific TV view */}
      {!['bomb', 'headup', 'quickdraw', 'draw', 'quiz', 'splitquiz', 'fakeorfact', 'sharedquiz', 'flaschendrehen', 'bottlespin', 'this-or-that', 'thisorthat', 'story-builder', 'storybuilder', 'taboo', 'category', 'impostor', 'ohrwurm', 'emojiguess', 'truthdare', 'whoami', 'wordpress', 'findit'].includes(game) && (
        <TVSmartFallback gameState={gameState} />
      )}
    </Suspense>
  );
}

export default function TVScreen() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const code = roomCode || '';
  const { isConnected, players, gameState, leaderboard, drawing, gameStarted, gameEnded, error } = useTVConnection(code);
  const { t } = useTranslation();

  const scores = useMemo(() => {
    if (leaderboard.length > 0) return leaderboard;
    // Offline TV mode has no presence roster — fall back to the players
    // carried inside the broadcast game state (they include live scores).
    const statePlayers = gameState?.players as { name?: string; score?: number; color?: string }[] | undefined;
    if (Array.isArray(statePlayers) && statePlayers.some(p => p && typeof p.name === 'string')) {
      return statePlayers
        .filter(p => p && typeof p.name === 'string')
        .map(p => ({ name: p.name as string, score: typeof p.score === 'number' ? p.score : 0, color: p.color || '#df8eff' }))
        .sort((a, b) => b.score - a.score);
    }
    return players.map(p => ({ name: p.name, score: 0, color: p.color }));
  }, [leaderboard, players, gameState?.players]);

  // Determine phase
  const showLeaderboard = gameState?.phase === 'leaderboard' || gameState?.phase === 'roundEnd';
  const showGameOver = gameEnded || gameState?.phase === 'gameOver';
  const showGame = gameStarted && gameState && !showLeaderboard && !showGameOver;
  const showLobby = !gameStarted || (!showGame && !showLeaderboard && !showGameOver);

  // Audio
  const audio = useTVAudio();
  const prevPhaseRef = useRef<string>('');

  // Trigger audio on phase changes
  useEffect(() => {
    const phase = gameState?.phase || '';
    const prev = prevPhaseRef.current;
    if (phase && phase !== prev) {
      if (phase === 'leaderboard' || phase === 'roundEnd') audio.playChime();
      else if (phase === 'gameOver') audio.playFanfare();
      else if (phase === 'reveal') audio.playReveal();
      else if (phase === 'voting') audio.playTick();
      prevPhaseRef.current = phase;
    }
  }, [gameState?.phase, audio]);

  // Timer tick sound
  useEffect(() => {
    const tl = gameState?.timeLeft as number | undefined;
    if (typeof tl === 'number' && tl <= 5 && tl > 0) audio.playTick();
  }, [gameState?.timeLeft, audio]);

  // Derive glow frame props from game state
  const glowColor = gameState?.players?.[gameState?.currentPlayerIndex ?? gameState?.activeIdx ?? gameState?.currentPlayerIdx]?.color as string | undefined;
  const timeLeft = typeof gameState?.timeLeft === 'number' ? gameState.timeLeft as number : null;
  const glowIntensity = showGameOver ? 'high' as const : (timeLeft !== null && timeLeft <= 5) ? 'medium' as const : 'low' as const;
  const glowRainbow = showGameOver;

  // Derive particle mood
  const particleMood = showGameOver ? 'celebrate' as const
    : (timeLeft !== null && timeLeft <= 5) ? 'danger' as const
    : (gameState?.phase === 'voting' || gameState?.phase === 'revealCountdown') ? 'tense' as const
    : 'ambient' as const;

  return (
    <div className="min-h-screen bg-[#060810] text-[#f1f3fc] overflow-hidden font-game">
      {/* Sound enable overlay */}
      {!audio.isEnabled && (
        <div
          className="fixed inset-0 z-[200] cursor-pointer"
          onClick={audio.enable}
        >
          <div className="absolute bottom-6 right-6 px-5 py-3 rounded-full bg-[#151a21]/90 border border-[#df8eff]/30 backdrop-blur-lg">
            <span className="text-lg text-[#a8abb3]">🔊 {t('tv.tapForSound', 'Tap für Sound')}</span>
          </div>
        </div>
      )}
      <TVParticles mood={particleMood} />
      <TVGlowFrame color={glowColor || '#df8eff'} intensity={glowIntensity} rainbow={glowRainbow} />
      <TVVFXLayer gameState={gameState} />
      {/* Floating live-stats overlay removed: every game view now renders its
          own full TVScoreboard roster, so this only duplicated the standings
          and covered on-screen content (timelines, cards, etc.). */}

      {/* Exactly ONE keyed child — AnimatePresence mode="wait" with several
          conditional children can wedge (view faded out but the next one
          never mounted) when the exit animation is interrupted, e.g. while
          the tab is backgrounded/throttled. A single child keyed by the
          derived view name cannot get stuck between views. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={showGameOver ? 'gameover' : showLeaderboard ? 'leaderboard' : showGame ? 'game' : 'lobby'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {showGameOver ? (
            <TVGameOver scores={scores} />
          ) : showLeaderboard ? (
            <TVLeaderboard scores={scores} />
          ) : showGame ? (
            <GameView gameState={gameState} drawing={drawing} />
          ) : (
            <TVLobby roomCode={code} players={players} isConnected={isConnected} error={error} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Simple code entry page at /tv */
export function TVCodeEntry() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = (form.get('code') as string || '').toUpperCase().trim();
    if (code.length === 6) navigate(`/tv/${code}`);
  };

  return (
    <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center p-8 font-game">
      <TVParticles />
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-black italic mb-4"
          style={{ background: 'linear-gradient(135deg, #df8eff, #8ff5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TV SCREEN
        </h1>
        <p className="text-xl text-[#a8abb3] mb-12">{t('tv.enterCode')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
          <input name="code" type="text" maxLength={6} placeholder="PARTY7" autoFocus
            className="w-80 text-center text-5xl font-black tracking-[0.3em] bg-[#151a21] border-2 border-[#df8eff]/30 rounded-2xl px-6 py-5 text-[#df8eff] placeholder:text-[#df8eff]/20 focus:outline-none focus:border-[#df8eff]/60 uppercase"
            onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} />
          <button type="submit" className="px-12 py-4 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-xl font-black text-white tracking-wider shadow-[0_0_30px_rgba(223,142,255,0.3)]">
            {t('tv.connect')}
          </button>
        </form>
      </div>
    </div>
  );
}
