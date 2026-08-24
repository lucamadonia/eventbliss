import { lazy, Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import TVParticles from './TVParticles';
import TVLobby from './TVLobby';
import TVLeaderboard from './TVLeaderboard';
import TVGameOver from './TVGameOver';
import TVVFXLayer from './components/TVVFXLayer';
import TVGlowFrame from './components/TVGlowFrame';
import TVPartyProgressStrip from './components/TVPartyProgressStrip';
import TVViewBar from './components/TVViewBar';
import { useTVConnection } from './useTVConnection';
import { useTVAudio } from './TVAudioManager';
import type { PartyNightState } from './party-types';

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
const TVPixeljagdView = lazy(() => import('./games/TVPixeljagdView'));
const TVCloseEnoughView = lazy(() => import('./games/TVCloseEnoughView'));
const TVPantomimeView = lazy(() => import('./games/TVPantomimeView'));
const TVEmojiGuessView = lazy(() => import('./games/TVEmojiGuessView'));
const TVTruthDareView = lazy(() => import('./games/TVTruthDareView'));
const TVWhoAmIView = lazy(() => import('./games/TVWhoAmIView'));
const TVWordPressView = lazy(() => import('./games/TVWordPressView'));
const TVFindItView = lazy(() => import('./games/TVFindItView'));
const TVSmartFallback = lazy(() => import('./games/TVSmartFallback'));

// Party Night scenes — the cross-game evening, not a single game
const TVPartyStandings = lazy(() => import('./TVPartyStandings'));
const TVPartyMap = lazy(() => import('./components/TVPartyMap'));
const TVPartyFinale = lazy(() => import('./TVPartyFinale'));

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
      {game === 'pixeljagd' && <TVPixeljagdView {...props} />}
      {game === 'closeenough' && <TVCloseEnoughView {...props} />}
      {game === 'pantomime' && <TVPantomimeView {...props} />}
      {game === 'emojiguess' && <TVEmojiGuessView {...props} />}
      {game === 'truthdare' && <TVTruthDareView {...props} />}
      {game === 'whoami' && <TVWhoAmIView {...props} />}
      {game === 'wordpress' && <TVWordPressView {...props} />}
      {game === 'findit' && <TVFindItView {...props} />}
      {/* Smart fallback for games without specific TV view */}
      {!['bomb', 'headup', 'quickdraw', 'draw', 'quiz', 'splitquiz', 'fakeorfact', 'sharedquiz', 'flaschendrehen', 'bottlespin', 'this-or-that', 'thisorthat', 'story-builder', 'storybuilder', 'taboo', 'category', 'impostor', 'ohrwurm', 'pixeljagd', 'closeenough', 'pantomime', 'emojiguess', 'truthdare', 'whoami', 'wordpress', 'findit'].includes(game) && (
        <TVSmartFallback gameState={gameState} />
      )}
    </Suspense>
  );
}

export default function TVScreen() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const code = roomCode || '';
  /**
   * Sprache aus dem Link, noch bevor das Telefon zum ersten Mal sendet —
   * sonst steht die TV-Lobby in der Browsersprache des Fernsehers da.
   * Der Broadcast korrigiert spaeter, falls der Gastgeber umschaltet.
   */
  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get('lang');
    if (!lang) return;
    if (lang.split('-')[0] === i18n.language?.split('-')[0]) return;
    void i18n.changeLanguage(lang);
  }, []);
  const { isConnected, players, gameState, leaderboard, drawing, gameStarted, gameEnded, error } = useTVConnection(code);
  const { t } = useTranslation();
  /**
   * Manuelle Einblendung der Nacht-Route. Rein oertlich auf dem Fernseher —
   * der Zwischenstand liegt ohnehin schon im empfangenen Zustand, es braucht
   * also keine Rueckleitung zum Telefon und es funktioniert auch, waehrend
   * dort gerade ein Spiel laeuft.
   */
  /**
   * Eine am FERNSEHER gewaehlte Ansicht. Sie gewinnt gegen den Zustand vom
   * Telefon — aber nur, bis der Gastgeber dort selbst etwas umschaltet. Ohne
   * diesen Vorrang haette der naechste Broadcast (er kommt im Sekundentakt)
   * jede Eingabe am Fernseher sofort wieder ueberfahren.
   */
  const [localView, setLocalView] = useState<PartyNightState['phase'] | null>(null);

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

  // Party Night context, if the phone is running a playlist evening. Absent for
  // single games, in which case everything below behaves exactly as before.
  const partyNight = gameState?.partyNight as PartyNightState | undefined;
  const partyActive = !!partyNight?.active && (partyNight.standings?.length ?? 0) > 0;
  // Explicit host intent wins over the derived per-game phases below.
  const wirePhase = partyNight?.phase ?? 'ingame';
  const effectiveView = localView ?? wirePhase;
  const showPartyFinale = partyActive && effectiveView === 'finale';
  const showPartyStandings = partyActive && effectiveView === 'between';
  const showPartyMap = partyActive && effectiveView === 'map';
  const showPartyIntro = partyActive && effectiveView === 'intro';

  /**
   * Schaltet der Gastgeber am Telefon um, gibt der Fernseher seine oertliche
   * Wahl auf — sonst wuerde ein einmal am TV gedruecktes "Zwischenstand" jede
   * spaetere Fernbedienung blockieren.
   */
  const lastWirePhaseRef = useRef(wirePhase);
  useEffect(() => {
    if (lastWirePhaseRef.current !== wirePhase) {
      lastWirePhaseRef.current = wirePhase;
      setLocalView(null);
    }
  }, [wirePhase]);

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
      {/*
        Eine einzige Klickflaeche fuer beides: solange der Ton nicht frei ist,
        gibt der erste Klick ihn frei; danach blendet jeder Klick die
        Nacht-Route ein und aus. Bewusst KEIN schwebender Knopf — die Hausregel
        weiter unten (kein Chrome ueber dem Spielbild) gilt auch hier.
      */}
      {/*
        Nur noch zum Ton-Freischalten — das erzwingt der Browser mit einer
        Nutzergeste. Frueher schaltete dieselbe Flaeche blind die Nacht-Route
        um: kein Knopf, keine Beschriftung. Wer nicht wusste, dass es sie gibt,
        hat sie nie gefunden. Das Umschalten macht jetzt `TVViewBar`.
      */}
      {!audio.isEnabled && (
        <div
          className="fixed inset-0 z-[200] cursor-pointer"
          onClick={() => audio.enable()}
        >
          <div className="absolute bottom-6 right-6 px-5 py-3 rounded-full bg-[#151a21]/90 border border-[#df8eff]/30 backdrop-blur-lg">
            <span className="text-lg text-[#a8abb3]">🔊 {t('tv.tapForSound')}</span>
          </div>
        </div>
      )}

      {/*
        Die Knopfreihe. Sie erscheint auf Maus- oder Tastenregung und blendet
        sich nach vier Sekunden Ruhe aus — die Hausregel weiter unten (nichts
        liegt dauerhaft ueber dem Spielbild) gilt auch fuer sie.
      */}
      <TVViewBar enabled={partyActive} current={effectiveView} onSelect={setLocalView} />
      <TVParticles mood={particleMood} />
      <TVGlowFrame color={glowColor || '#df8eff'} intensity={glowIntensity} rainbow={glowRainbow} />
      <TVVFXLayer gameState={gameState} />
      {/* Floating live-stats overlay removed: every game view now renders its
          own full TVScoreboard roster, so this only duplicated the standings
          and covered on-screen content (timelines, cards, etc.).
          Party Night keeps that rule: "where do I stand tonight" travels as
          optional partyRank/partyPoints props on that same TVScoreboard, and
          the only extra chrome is the hairline strip below — a single
          text-height row inside the padding every view already reserves. */}
      {partyActive && !showPartyStandings && !showPartyFinale && !showPartyMap && !showPartyIntro && (
        <TVPartyProgressStrip playlist={partyNight!.playlist} index={partyNight!.index} />
      )}

      {/*
        Die manuell gerufene Karte liegt UEBER allem anderen, aber unter der
        Klickflaeche (z-[200]) — der naechste Klick blendet sie wieder aus.
        `travel={false}`: Wer sie selbst aufruft, will den Stand sehen, nicht
        die Reise noch einmal vorgefuehrt bekommen.
      */}
      {showPartyMap && (
        <div className="fixed inset-0 z-[150]">
          <Suspense fallback={TVFallback}>
            <TVPartyMap
              playlist={partyNight!.playlist}
              index={partyNight!.index}
              standings={partyNight!.standings}
              /* Die Reise mitspielen lassen, auch wenn die Karte gerufen wird:
                 Der Sprung der Figuren IST der Moment, fuer den die Karte
                 gebaut ist. Sie danach nur als Standbild zu zeigen, waere die
                 halbe Wirkung. */
              travel
            />
          </Suspense>
        </div>
      )}

      {/* Genau EIN Kind, ueber den abgeleiteten Ansichtsnamen verschluesselt.
          Frueher stand hier zusaetzlich `mode="wait"`, mit der Begruendung, ein
          einzelnes verschluesseltes Kind koenne nicht haengenbleiben. Es kann:
          Ist das naechste Kind ein `lazy()`-Bauteil, wartet `mode="wait"` auf
          das Ende der Ausblendung, das Nachladen beginnt aber erst NACH dem
          Wechsel — nachgemessen blieb der Fernseher beim Sprung auf die
          Zwischenstands-Szene schwarz: die Lobby auf Deckkraft 0 ausgeblendet,
          die neue Szene nie gemountet, ihr Chunk nie geladen.
          Ohne `mode="wait"` ueberblenden beide kurz — die Ansichten liegen
          ohnehin uebereinander, es sieht als Kreuzblende sogar besser aus. */}
      <AnimatePresence>
        <motion.div
          key={
            showPartyFinale ? 'partyFinale'
            : showPartyStandings ? 'partyStandings'
            // Vom Gastgeber gerufenes Startbild — dieselbe Lobby wie am Anfang
            // des Abends, damit ein Nachzuegler den Raumcode wiederfindet.
            : showPartyIntro ? 'lobby'
            : showGameOver ? 'gameover'
            : showLeaderboard ? 'leaderboard'
            : showGame ? 'game'
            : 'lobby'
          }
          /* Kreuzblende mit einem Hauch Tiefe: Die Ansichten liegen ohnehin
             uebereinander, und auf einer Kinoleinwand wirkt ein blosses
             Aufblenden billig. Bewusst kurz — der Fernseher soll nicht
             wirken, als haenge er. */
          initial={{ opacity: 0, scale: 1.015 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {showPartyFinale ? (
            <Suspense fallback={TVFallback}><TVPartyFinale party={partyNight!} /></Suspense>
          ) : showPartyStandings ? (
            <Suspense fallback={TVFallback}><TVPartyStandings party={partyNight!} /></Suspense>
          ) : showPartyIntro ? (
            <TVLobby roomCode={code} players={players} isConnected={isConnected} error={error} />
          ) : showGameOver ? (
            <TVGameOver scores={scores} />
          ) : showLeaderboard ? (
            <TVLeaderboard scores={scores} party={partyNight} />
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
