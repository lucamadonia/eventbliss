import { lazy, Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import type { BrewCue } from '@/games/brew/brew-audio';
import type { PartyNightState } from './party-types';
import { resolveTvView } from './tv-view';
import { isStroke } from './drawing';
import { getBaseUrl } from '@/lib/platform';
import { setPartyTraceDevice } from '@/games/party/party-trace';
import TVLatecomerQR from './components/TVLatecomerQR';
import TVHandoverBanner from './components/TVHandoverBanner';
import TVHandoverStage from './cinema/TVHandoverStage';
import { parseTvHandover } from './cinema/tv-handover';
import { TVRosterContext, buildRoster } from './cinema/tv-roster';
import TVPhaseCard from './cinema/TVPhaseCard';
import { useTVCinema } from './cinema/useTVCinema';
import { useTVPhaseGate } from './cinema/useTVPhaseGate';
import { TVCueContext } from './cinema/tv-cue-context';
import TVSceneCountdown, { parseWireScene } from './components/TVSceneCountdown';
import { useTVServerClock } from './useTVServerClock';
import { legacyLobbyState, parseTVLobbyState, type TVLobbyPlayer, type TVLobbyState } from './tv-lobby-state';

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
const TVBrewView = lazy(() => import('./games/TVBrewView'));
const TVEmojiGuessView = lazy(() => import('./games/TVEmojiGuessView'));
const TVTruthDareView = lazy(() => import('./games/TVTruthDareView'));
const TVWhoAmIView = lazy(() => import('./games/TVWhoAmIView'));
const TVWordPressView = lazy(() => import('./games/TVWordPressView'));
const TVFindItView = lazy(() => import('./games/TVFindItView'));
const TVSmartFallback = lazy(() => import('./games/TVSmartFallback'));

// Party Night scenes — the cross-game evening, not a single game
const TVPartyStandings = lazy(() => import('./TVPartyStandings'));
const TVPartyMap = lazy(() => import('./components/TVPartyMap'));
const TVRules = lazy(() => import('./TVRules'));
const TVPartyFinale = lazy(() => import('./TVPartyFinale'));
const TVPartyReady = lazy(() => import('./TVPartyReady'));

const TVFallback = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-3 border-[#df8eff] border-t-transparent rounded-full animate-spin" />
  </div>
);

// Die einzelnen Legacy-TV-Views besitzen noch keinen gemeinsamen State-Vertrag.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GameView({ gameState, drawing }: { gameState: any; drawing: unknown[] }) {
  const game = gameState?.game || '';
  const props = { gameState, drawing: drawing.filter(isStroke) };

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
      {game === 'brew' && <TVBrewView {...props} />}
      {game === 'emojiguess' && <TVEmojiGuessView {...props} />}
      {game === 'truthdare' && <TVTruthDareView {...props} />}
      {game === 'whoami' && <TVWhoAmIView {...props} />}
      {game === 'wordpress' && <TVWordPressView {...props} />}
      {game === 'findit' && <TVFindItView {...props} />}
      {/* Smart fallback for games without specific TV view */}
      {!['bomb', 'headup', 'quickdraw', 'draw', 'quiz', 'splitquiz', 'fakeorfact', 'sharedquiz', 'flaschendrehen', 'bottlespin', 'this-or-that', 'thisorthat', 'story-builder', 'storybuilder', 'taboo', 'category', 'impostor', 'ohrwurm', 'pixeljagd', 'closeenough', 'pantomime', 'brew', 'emojiguess', 'truthdare', 'whoami', 'wordpress', 'findit'].includes(game) && (
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
  // Timing-Messpunkte dieses Geraets als Fernseher kennzeichnen (party-trace).
  useEffect(() => { setPartyTraceDevice('tv'); }, []);
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
  const wirePartyNight = gameState?.partyNight as PartyNightState | undefined;
  /**
   * „Party beenden“ (D04): Das Telefon meldet das Ende als Leerlauf-Zustand mit
   * `controllerJoinCode: null` — oft schon ohne Party-Block, weil die Sitzung
   * dort geschlossen ist. Der Fernseher zeigt dann die Siegerehrung aus dem
   * zuletzt bekannten Abend, statt in einen leeren Wartebereich zu fallen.
   */
  const partyEnded = gameState?.game === 'lobby' && gameState?.controllerJoinCode === null;
  const lastPartyNightRef = useRef<PartyNightState | undefined>(undefined);
  if (wirePartyNight?.active && (wirePartyNight.history?.length ?? 0) > 0) lastPartyNightRef.current = wirePartyNight;
  // Ein Finale ohne Stand (Sitzung schon zu) faellt ebenfalls auf den letzten Abend zurueck.
  const wireFinaleEmpty = wirePartyNight?.phase === 'finale' && !(wirePartyNight.standings?.length);
  const partyNight: PartyNightState | undefined = (wireFinaleEmpty ? undefined : wirePartyNight)
    ?? ((partyEnded || wireFinaleEmpty) && lastPartyNightRef.current ? { ...lastPartyNightRef.current, phase: 'finale' } : wirePartyNight);
  const partyActive = !!partyNight?.active && (partyNight.standings?.length ?? 0) > 0;
  const showLeaderboard = gameState?.phase === 'leaderboard' || gameState?.phase === 'roundEnd';
  const showGameOver = gameEnded || gameState?.phase === 'gameOver';
  // Explicit host intent wins over the derived per-game phases below.
  const wirePhase = partyNight?.phase ?? 'ingame';
  /**
   * Wartebereich: Neue Telefone senden ihn als `lobby` im Leerlauf-Zustand
   * (`game: 'lobby'`). Alte Telefone senden ihn nicht — dann leitet der
   * Fernseher einen Ersatz aus der Anwesenheit ab.
   */
  const wireLobby = useMemo(() => parseTVLobbyState(gameState?.lobby), [gameState?.lobby]);
  const legacyJoinCode = typeof gameState?.controllerJoinCode === 'string' && /^[A-HJ-NP-Z2-9]{6}$/.test(gameState.controllerJoinCode)
    ? gameState.controllerJoinCode : null;
  /**
   * Waehrend eines Spiels traegt der Zustand keinen Wartebereich. Ruft der
   * Gastgeber dann das „Startbild“ (G05), zeigt der Fernseher den zuletzt
   * empfangenen — mit dem grossen QR — statt eines Ersatzes ohne Mitglieder.
   */
  const lastWireLobbyRef = useRef<TVLobbyState | null>(null);
  if (wireLobby) lastWireLobbyRef.current = wireLobby;
  if (partyEnded) lastWireLobbyRef.current = null;
  const rememberedLobby = wireLobby ?? lastWireLobbyRef.current;
  const lobbyState = useMemo(
    () => rememberedLobby ?? legacyLobbyState({ code, presence: players, controllerJoinCode: legacyJoinCode, baseUrl: getBaseUrl() }),
    [rememberedLobby, code, players, legacyJoinCode],
  );
  /**
   * Nichts bekannt: kein Wartebereich, keine Anwesenheit, kein Beitrittscode.
   * Dann ist es kein „lokaler Abend mit 0 Spielern“, sondern der Gastgeber hat
   * (noch) keinen Fernseher verbunden — oder die Party ist vorbei.
   */
  const lobbyNotice: 'waiting-host' | 'ended' | null = rememberedLobby || legacyJoinCode || players.length > 0
    ? null
    : partyEnded ? 'ended' : 'waiting-host';
  const idleLobby = gameState?.game === 'lobby' && !!wireLobby;
  /**
   * Vor dem ersten Spiel gehoert der Bildschirm dem Wartebereich — auch wenn
   * das Telefon dort schon die Nacht-Route vorschlaegt. Danach entscheidet der
   * Gastgeber ("Startbild"), und eine am Fernseher gewaehlte Ansicht gewinnt.
   */
  const lobbyFirst = idleLobby && !localView && (partyNight?.history?.length ?? 0) === 0 && (wirePhase === 'map' || wirePhase === 'ingame');
  const effectiveView = lobbyFirst ? 'intro' : resolveTvView(localView ?? wirePhase, { partyActive, gameOver: showGameOver });
  const showPartyFinale = partyActive && effectiveView === 'finale';
  const showPartyStandings = partyActive && effectiveView === 'between';
  const showPartyMap = partyActive && effectiveView === 'map';
  const showPartyIntro = partyActive && effectiveView === 'intro';
  const showPartyRules = partyActive && effectiveView === 'rules';
  const showPartyReady = partyActive && effectiveView === 'ready';

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

  // Determine the remaining per-game phases.
  const showGame = gameStarted && gameState && !idleLobby && !showLeaderboard && !showGameOver;
  const showLobby = !gameStarted || (!showGame && !showLeaderboard && !showGameOver);
  const showLobbyScene = showPartyIntro || (!showPartyFinale && !showPartyStandings && !showPartyReady && !showPartyRules && !showGameOver && !showLeaderboard && !showGame);

  /**
   * Beitrittslink fuer Nachzuegler im Spiel (T15). Die Spielzustaende tragen
   * ihn nicht, also merkt sich der Fernseher den letzten aus dem Wartebereich.
   * Nur fuer Joystick-Partys: einem laufenden Online-Raum tritt niemand bei.
   */
  const [latecomerJoin, setLatecomerJoin] = useState<{ url: string; code: string; players: TVLobbyPlayer[] } | null>(null);
  useEffect(() => {
    if (wireLobby) {
      setLatecomerJoin(wireLobby.mode === 'controller-party' && wireLobby.joinUrl ? { url: wireLobby.joinUrl, code: wireLobby.code, players: wireLobby.players } : null);
    } else if (legacyJoinCode) {
      // Altes Telefon: keine Mitgliederliste, also auch keine Beitrittsmeldung.
      setLatecomerJoin((prev) => ({ url: `${getBaseUrl()}/party/join/${legacyJoinCode}`, code: legacyJoinCode, players: prev?.code === legacyJoinCode ? prev.players : [] }));
    } else if (gameState?.game === 'lobby' && gameState.controllerJoinCode === null) {
      setLatecomerJoin(null); // Party beendet
    }
  }, [wireLobby, legacyJoinCode, gameState?.game, gameState?.controllerJoinCode]);

  // Gemeinsame Uhr (T-1): echte Serverzeit, der Stempel vom Telefon nur als Notbehelf.
  useTVServerClock(typeof gameState?.serverNow === 'string' ? gameState.serverNow : null);
  const wireScene = useMemo(() => parseWireScene(gameState?.scene), [gameState?.scene]);
  // Gemeinsamer Start der Siegerehrung — Podest und Konfetti im selben Moment wie die Telefone.
  const finaleStartsRef = useRef<number | null>(null);
  if (wireScene?.scene === 'finale') finaleStartsRef.current = wireScene.startsAt;

  // Audio
  const audio = useTVAudio();
  /**
   * Teilnehmerliste mit Symbolen fuer ALLE Ansichten: Wartebereich, Abend-
   * Tabelle und Spielzustand. So bleibt „🦊 Lena“ auch im Spiel „🦊 Lena“.
   */
  const roster = useMemo(() => buildRoster(
    lobbyState.players,
    partyNight?.standings,
    Array.isArray(gameState?.players) ? (gameState.players as { id?: unknown; name?: unknown; avatar?: unknown; color?: unknown }[]) : null,
  ), [lobbyState.players, partyNight?.standings, gameState?.players]);
  const handover = useMemo(() => (showGame ? parseTvHandover(gameState?.handover) : null), [showGame, gameState?.handover]);

  // Toene + Titelkarten (Wartebereich, Szenen-Cues der Pilotspiele) — cinema/useTVCinema.
  // Phasenwechsel zur geplanten gemeinsamen Zeit (phaseStartsAt) — wie Host und Handys.
  const gatedGameState = useTVPhaseGate(gameState);
  const { playSound: playLobbySound, cueApi, phaseCue, phaseStartsAt, cueGame } = useTVCinema(audio, gatedGameState, !!showGame);
  const prevPhaseRef = useRef<string>('');
  const prevBrewCueRef = useRef<number | null>(null);

  // Trigger audio on phase changes
  useEffect(() => {
    const phase = gameState?.phase || '';
    const prev = prevPhaseRef.current;
    if (phase && phase !== prev && cueGame && phase !== 'gameOver') {
      prevPhaseRef.current = phase;
    } else if (phase && phase !== prev) {
      if (phase === 'leaderboard' || phase === 'roundEnd') audio.playChime();
      else if (phase === 'gameOver') audio.playFanfare();
      else if (phase === 'reveal') audio.playReveal();
      else if (phase === 'voting') audio.playTick();
      prevPhaseRef.current = phase;
    }
  }, [gameState?.phase, audio, cueGame]);

  // Timer tick sound
  useEffect(() => {
    const tl = gameState?.timeLeft as number | undefined;
    if (typeof tl === 'number' && tl <= 5 && tl > 0) audio.playTick();
  }, [gameState?.timeLeft, audio]);

  // Gebräu sendet semantische Cues mit monotonem Zähler. Der erste empfangene
  // Stand wird nur gemerkt, damit ein spät verbundener TV nichts nachspielt.
  useEffect(() => {
    if (gameState?.game !== 'brew') return;
    const seq = Number(gameState?.audioCueSeq ?? 0);
    if (prevBrewCueRef.current === null) { prevBrewCueRef.current = seq; return; }
    if (seq <= prevBrewCueRef.current) return;
    prevBrewCueRef.current = seq;
    const cue = gameState?.audioCue as BrewCue | undefined;
    if (cue) audio.playBrew(cue);
  }, [gameState?.game, gameState?.audioCueSeq, gameState?.audioCue, audio]);

  // Derive glow frame props from game state
  const activeIndex = gameState?.currentPlayerIndex ?? gameState?.activeIdx ?? gameState?.currentPlayerIdx;
  const activePlayer = Array.isArray(gameState?.players) && typeof activeIndex === 'number' ? gameState.players[activeIndex] : null;
  const glowColor = activePlayer && typeof activePlayer === 'object' && typeof activePlayer.color === 'string' ? activePlayer.color : undefined;
  const timeLeft = typeof gameState?.timeLeft === 'number' ? gameState.timeLeft as number : null;
  const glowIntensity = showGameOver ? 'high' as const : (timeLeft !== null && timeLeft <= 5) ? 'medium' as const : 'low' as const;
  const glowRainbow = showGameOver;

  // Derive particle mood
  const particleMood = showGameOver ? 'celebrate' as const
    : (timeLeft !== null && timeLeft <= 5) ? 'danger' as const
    : (gameState?.phase === 'voting' || gameState?.phase === 'revealCountdown') ? 'tense' as const
    : 'ambient' as const;

  return (
    <TVRosterContext.Provider value={roster}>
    {/* Ueberschriften ausgewogen umbrechen (text-wrap: balance) — nie ein einzelnes Wort allein in Zeile 2. */}
    <div className="min-h-screen bg-[#060810] text-[#f1f3fc] overflow-hidden font-game [&_h1]:[text-wrap:balance] [&_h2]:[text-wrap:balance] [&_h3]:[text-wrap:balance]">
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
          {/* Bewusst LINKS: Der Menue-Knopf sitzt unten rechts, beide zusammen
                 ueberlappten sich sonst. */}
            <div className="absolute bottom-6 left-6 px-5 py-3 rounded-full bg-[#151a21]/90 border border-[#df8eff]/30 backdrop-blur-lg">
            <span className="text-lg text-[#a8abb3]">🔊 {t('tv.tapForSound')}</span>
          </div>
        </div>
      )}

      {/*
        Die Knopfreihe. Sie erscheint auf Maus- oder Tastenregung und blendet
        sich nach vier Sekunden Ruhe aus — die Hausregel weiter unten (nichts
        liegt dauerhaft ueber dem Spielbild) gilt auch fuer sie.
      */}
      <TVViewBar
        enabled={partyActive}
        current={effectiveView}
        onSelect={setLocalView}
        /*
         * Vor dem ersten Spiel gibt es nichts zu feiern — eine Siegerehrung
         * ueber eine leere Tabelle waere Hohn (dieselbe Regel wie beim
         * "Party beenden"-Knopf in der Lobby). Und ohne naechsten Eintrag in
         * der Set-Liste gibt es keine Anleitung zu zeigen.
         */
        omit={[
          ...((partyNight?.history?.length ?? 0) === 0 ? (['finale'] as const) : []),
          ...(partyNight?.playlist?.[partyNight.index] ? [] : (['rules'] as const)),
        ]}
      />
      <TVParticles mood={particleMood} />
      <TVGlowFrame color={glowColor || '#df8eff'} intensity={glowIntensity} rainbow={glowRainbow} />
      <TVVFXLayer gameState={gameState} />
      <TVSceneCountdown scene={wireScene} />
      {/* T07: Gast am Host-Handy — generisch fuer jedes Spiel, das `handover` sendet. */}
      {/* T07: mit Fortschritt die Buehne (Design §9.3), sonst das schmale Band. */}
      <TVHandoverStage handover={handover?.progress ? handover : null} onCue={audio.playChime} />
      <TVHandoverBanner handover={handover && !handover.progress ? handover : null} onCue={audio.playChime} />
      <TVCueContext.Provider value={cueApi}>
        <TVPhaseCard cue={phaseCue} phaseStartsAt={phaseStartsAt} />
      </TVCueContext.Provider>
      {latecomerJoin && !showLobbyScene && !showPartyFinale && (
        <TVLatecomerQR
          url={latecomerJoin.url}
          code={latecomerJoin.code}
          expandKey={showGame ? `game:${String(gameState?.game ?? '')}:${String(gameState?.round ?? '')}` : `scene:${effectiveView}:${showLeaderboard}`}
          // Nur Listen vom Telefon — die Anwesenheit im Spiel kennt andere Kennungen.
          players={latecomerJoin.players}
          onLateJoin={audio.playTick}
        />
      )}
      {/* Floating live-stats overlay removed: every game view now renders its
          own full TVScoreboard roster, so this only duplicated the standings
          and covered on-screen content (timelines, cards, etc.).
          Party Night keeps that rule: "where do I stand tonight" travels as
          optional partyRank/partyPoints props on that same TVScoreboard, and
          the only extra chrome is the hairline strip below — a single
          text-height row inside the padding every view already reserves. */}
      {partyActive && !showPartyStandings && !showPartyFinale && !showPartyMap && !showPartyIntro && !showPartyRules && !showPartyReady && (
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

      {/* Replace the previous scene synchronously. Keeping an exiting lobby
          mounted can leave the live game below its full-height layout while
          nested animations finish. The keyed scene still fades in. */}
        <motion.div
          data-tv-scene
          // Volle Bildhoehe: Ansichten mit h-full/flex-1 brauchen eine feste Hoehe darueber.
          className="relative h-screen w-full"
          key={
            showPartyFinale ? 'partyFinale'
            : showPartyStandings ? 'partyStandings'
            : showPartyReady ? 'partyReady'
            // Vom Gastgeber gerufenes Startbild — dieselbe Lobby wie am Anfang
            // des Abends, damit ein Nachzuegler den Raumcode wiederfindet.
            : showPartyRules ? 'partyRules'
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
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {showPartyFinale ? (
            <Suspense fallback={TVFallback}><TVPartyFinale party={partyNight!} startsAt={finaleStartsRef.current} /></Suspense>
          ) : showPartyStandings ? (
            <Suspense fallback={TVFallback}><TVPartyStandings party={partyNight!} /></Suspense>
          ) : showPartyReady ? (
            <Suspense fallback={TVFallback}><TVPartyReady party={partyNight!} /></Suspense>
          ) : showPartyRules ? (
            <Suspense fallback={TVFallback}>
              <TVRules
                gameId={partyNight!.playlist[partyNight!.index]?.gameId ?? ''}
                gameName={partyNight!.playlist[partyNight!.index]?.name}
              />
            </Suspense>
          ) : showPartyIntro ? (
            <TVLobby lobby={lobbyState} notice={lobbyNotice} isConnected={isConnected} error={error} onSound={playLobbySound} />
          ) : showGameOver ? (
            <TVGameOver scores={scores} gameId={gameState?.game as string | undefined} />
          ) : showLeaderboard ? (
            <TVLeaderboard scores={scores} party={partyNight} />
          ) : showGame ? (
            <TVCueContext.Provider value={cueApi}><GameView gameState={gatedGameState ?? gameState} drawing={drawing} /></TVCueContext.Provider>
          ) : (
            <TVLobby lobby={lobbyState} notice={lobbyNotice} isConnected={isConnected} error={error} onSound={playLobbySound} />
          )}
        </motion.div>
    </div>
    </TVRosterContext.Provider>
  );
}

// Die Code-Eingabe unter /tv lebt in TVCodeEntry.tsx (App.tsx laedt sie ueber diesen Export).
export { TVCodeEntry } from './TVCodeEntry';
