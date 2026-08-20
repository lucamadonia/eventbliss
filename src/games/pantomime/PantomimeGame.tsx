/**
 * OHNE WORTE — Pantomime.
 *
 * Ein Spieler stellt einen Begriff stumm dar, sein Team rät. Zwei Teams
 * wechseln sich ab, wer am Ende mehr Treffer hat, gewinnt.
 *
 * Aufbau nach `TabooGame.tsx` — das einzige Spiel mit echten Teams und dem
 * Muster „einer macht vor, sein Team rät": zwei gemischte Teams, ein
 * Darsteller-Index je Team, Rotation beim Zugende.
 *
 * DREI DINGE, DIE HIER BESONDERS SIND:
 *
 * 1. **Die Herausforderungen.** Vor jedem Zug wird eine angeboten — „stell
 *    alles mit einem Kochlöffel dar", „nur eine Hand", „in Zeitlupe". Annehmen
 *    verdoppelt alle Treffer des Zuges, Ablehnen kostet nichts, Scheitern auch
 *    nicht. Die Ziehung steckt in `pantomime-extras.ts` und ist dort getestet.
 *
 * 2. **Der Begriff darf NIE auf den Fernseher.** Alle schauen auf den
 *    Fernseher — stünde der Begriff dort, wäre das Spiel in derselben Sekunde
 *    vorbei. Der Fernseher bekommt Team, Darsteller, Uhr und die
 *    Herausforderung, sonst nichts. Gleiche Regel wie bei NAH DRAN.
 *
 * 3. **Die 18+-Kategorie hängt am freigeschalteten Bereich.** Ohne
 *    `useDrinkingMode().isActivated` erscheint sie weder in der Auswahl noch im
 *    Kartenstapel — die Entscheidung fällt einmal in `getPantomimeCategories()`,
 *    damit beides nicht auseinanderlaufen kann.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drama, Check, ChevronRight, SkipForward, Clock, Trophy, Sparkles } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useDrinkingMode } from '@/hooks/useDrinkingMode';
import { useGameTimer } from '../engine/TimerSystem';
import { PlayerSetup, type PlayerSetupPlayer } from '../ui/PlayerSetup';
import { ActivePlayerBanner } from '../ui/ActivePlayerBanner';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import { useBackGuard } from '@/lib/back-guard';
import { saveSnapshot, loadSnapshot, clearSnapshot } from '../ui/useGameSnapshot';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import {
  getPantomimeCategories,
  getPantomimeWords,
  preloadPantomimeWords,
  type PantomimeCategory,
  type PantomimeCategoryId,
} from '../content/pantomime-words';
import { drawExtra, scoreTurn, FETCH_SECONDS, type Extra } from './pantomime-extras';

/**
 * Farbwelt Bühne: tiefes Aubergine als Saal, Scheinwerfergold für den
 * Darsteller, Pink und Türkis für die beiden Teams.
 */
const PM = {
  bg: '#0C0A14',
  elevated: '#141020',
  surface: '#1E1730',
  text: '#F5F3FF',
  dim: '#A79FC0',
  gold: '#FBBF24',
  teamA: '#F472B6',
  teamB: '#22D3EE',
  good: '#34D399',
  bad: '#FB7185',
} as const;

type Phase = 'setup' | 'turnStart' | 'extra' | 'fetch' | 'playing' | 'turnSummary' | 'gameOver';
type ModeId = 'entspannt' | 'klassisch' | 'blitz';

const MODES: { id: ModeId; duration: number }[] = [
  { id: 'entspannt', duration: 120 },
  { id: 'klassisch', duration: 90 },
  { id: 'blitz', duration: 60 },
];

interface TeamPlayer {
  id: string;
  name: string;
}

interface Team {
  name: string;
  color: string;
  players: TeamPlayer[];
  score: number;
}

interface CardResult {
  word: string;
  result: 'correct' | 'skipped';
}

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function PantomimeGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const drinkingMode = useDrinkingMode();

  const isOnline = !!online;
  const isHost = !online || online.isHost;
  const myId = online?.myPlayerId ?? null;

  const [phase, setPhase] = useState<Phase>('setup');
  const [teams, setTeams] = useState<[Team, Team]>([
    { name: 'A', color: PM.teamA, players: [], score: 0 },
    { name: 'B', color: PM.teamB, players: [], score: 0 },
  ]);
  const [activeTeamIdx, setActiveTeamIdx] = useState<0 | 1>(0);
  const [actorIdx, setActorIdx] = useState<[number, number]>([0, 0]);
  const [mode, setMode] = useState<ModeId>('klassisch');
  const [categories, setCategories] = useState<PantomimeCategoryId[]>([]);
  const [extrasEnabled, setExtrasEnabled] = useState(true);
  const [totalRounds, setTotalRounds] = useState(5);
  const [round, setRound] = useState(1);

  const [deck, setDeck] = useState<string[]>([]);
  const [deckPos, setDeckPos] = useState(0);
  const [word, setWord] = useState<string | null>(null);
  const [turnResults, setTurnResults] = useState<CardResult[]>([]);
  const [extra, setExtra] = useState<Extra | null>(null);
  const [extraAccepted, setExtraAccepted] = useState(false);
  const [lastExtraKind, setLastExtraKind] = useState<Extra['kind'] | undefined>(undefined);
  const [fetchLeft, setFetchLeft] = useState(FETCH_SECONDS);
  const [confirmExit, setConfirmExit] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  const modeDef = useMemo(() => MODES.find((m) => m.id === mode) ?? MODES[1], [mode]);
  /** Bei der Tempo-Herausforderung zählt die halbe Zeit. */
  const turnSeconds =
    extraAccepted && extra?.halfTime ? Math.round(modeDef.duration / 2) : modeDef.duration;

  const activeTeam = teams[activeTeamIdx];
  const actor = activeTeam.players[actorIdx[activeTeamIdx]] ?? null;
  /** Auf diesem Gerät den Begriff zeigen? Offline immer, online nur beim Darsteller. */
  const iAmActor = !isOnline || (!!myId && actor?.id === myId);

  // --- Inhalte -------------------------------------------------------------
  useEffect(() => {
    void preloadPantomimeWords().finally(() => setContentReady(true));
  }, []);

  const availableCategories = useMemo<PantomimeCategory[]>(
    () => (contentReady ? getPantomimeCategories(drinkingMode.isActivated) : []),
    [contentReady, drinkingMode.isActivated],
  );

  // --- Zug -----------------------------------------------------------------
  const endTurnRef = useRef<(() => void) | null>(null);

  const handleTimeout = useCallback(() => {
    if (isOnline && !isHost) return;
    void haptics.warning();
    endTurnRef.current?.();
  }, [isOnline, isHost, haptics]);

  const timer = useGameTimer(modeDef.duration, handleTimeout);
  const timerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);
  timerRef.current = timer;

  const endTurn = useCallback(() => {
    timerRef.current?.pause();
    void haptics.success();
    setPhase('turnSummary');
  }, [haptics]);
  endTurnRef.current = endTurn;

  /**
   * Nächste Karte ziehen; ist der Stapel durch, geht es von vorn los.
   *
   * Die Position steht in einem Ref und NICHT allein im State: Ein
   * `setWord()` innerhalb des Updaters von `setDeckPos` wäre ein Seiteneffekt
   * an genau der Stelle, an der React den Updater erneut ausführen darf — in
   * OHRWURM ist dadurch schon einmal ein Spieler übersprungen worden. Der
   * State wird trotzdem mitgeführt, weil der Spielstand ihn braucht.
   */
  const deckPosRef = useRef(0);
  const drawWord = useCallback(() => {
    if (deck.length === 0) return;
    const pos = deckPosRef.current >= deck.length ? 0 : deckPosRef.current;
    setWord(deck[pos]);
    deckPosRef.current = pos + 1;
    setDeckPos(pos + 1);
  }, [deck]);

  const beginTurn = useCallback(() => {
    setTurnResults([]);
    setExtraAccepted(false);
    setFetchLeft(FETCH_SECONDS);
    if (extrasEnabled) {
      const drawn = drawExtra({
        previousKind: lastExtraKind,
        teamSize: teams[activeTeamIdx].players.length,
      });
      setExtra(drawn);
      setLastExtraKind(drawn.kind);
      setPhase('extra');
    } else {
      setExtra(null);
      setPhase('playing');
    }
  }, [extrasEnabled, lastExtraKind, teams, activeTeamIdx]);

  /** Vom Angebot in die Runde — mit oder ohne Herausforderung. */
  const startPlaying = useCallback(() => {
    drawWord();
    timerRef.current?.reset(turnSeconds);
    setPhase('playing');
    window.setTimeout(() => timerRef.current?.start(), 50);
  }, [drawWord, turnSeconds]);

  const acceptExtra = useCallback(() => {
    void haptics.medium();
    setExtraAccepted(true);
    if (extra?.needsFetch) {
      setFetchLeft(FETCH_SECONDS);
      setPhase('fetch');
      return;
    }
    startPlaying();
  }, [extra, haptics, startPlaying]);

  const declineExtra = useCallback(() => {
    setExtraAccepted(false);
    startPlaying();
  }, [startPlaying]);

  // Holzeit für das Requisit. Die Rundenuhr steht so lange still.
  useEffect(() => {
    if (phase !== 'fetch') return;
    if (fetchLeft <= 0) {
      startPlaying();
      return;
    }
    const id = window.setTimeout(() => setFetchLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, fetchLeft, startPlaying]);

  const doGuessed = useCallback(() => {
    if (phase !== 'playing' || !word) return;
    void haptics.success();
    setTurnResults((prev) => [...prev, { word, result: 'correct' }]);
    drawWord();
  }, [phase, word, haptics, drawWord]);

  const doSkip = useCallback(() => {
    if (phase !== 'playing' || !word) return;
    void haptics.light();
    setTurnResults((prev) => [...prev, { word, result: 'skipped' }]);
    drawWord();
  }, [phase, word, haptics, drawWord]);

  const turnPoints = useMemo(
    () => scoreTurn(turnResults.filter((r) => r.result === 'correct').length, extraAccepted),
    [turnResults, extraAccepted],
  );

  /** Punkte gutschreiben, Darsteller und Team weiterreichen. */
  const nextTurn = useCallback(() => {
    setTeams((prev) => {
      const copy: [Team, Team] = [{ ...prev[0] }, { ...prev[1] }];
      copy[activeTeamIdx].score += turnPoints;
      return copy;
    });
    setActorIdx((prev) => {
      const copy: [number, number] = [...prev];
      const size = teams[activeTeamIdx].players.length || 1;
      copy[activeTeamIdx] = (copy[activeTeamIdx] + 1) % size;
      return copy;
    });

    const nextIdx: 0 | 1 = activeTeamIdx === 0 ? 1 : 0;
    // Eine Runde ist erst vorbei, wenn BEIDE Teams dran waren.
    if (nextIdx === 0) {
      if (round >= totalRounds) {
        setPhase('gameOver');
        return;
      }
      setRound((r) => r + 1);
    }
    setActiveTeamIdx(nextIdx);
    setPhase('turnStart');
  }, [activeTeamIdx, turnPoints, teams, round, totalRounds]);

  // --- Online --------------------------------------------------------------
  const act = useCallback(
    (type: string, payload: Record<string, unknown>, run: () => void) => {
      if (isOnline && !isHost) {
        online!.broadcast('pantomime-action', { type, ...payload });
        return;
      }
      run();
    },
    [isOnline, isHost, online],
  );

  const applyAction = useCallback(
    (data: Record<string, unknown>) => {
      switch (data.type) {
        case 'guessed':
          doGuessed();
          break;
        case 'skip':
          doSkip();
          break;
        case 'accept':
          acceptExtra();
          break;
        case 'decline':
          declineExtra();
          break;
        case 'begin':
          beginTurn();
          break;
        case 'next':
          nextTurn();
          break;
        default:
          break;
      }
    },
    [doGuessed, doSkip, acceptExtra, declineExtra, beginTurn, nextTurn],
  );

  useEffect(() => {
    if (!online || !isHost) return;
    return online.onBroadcast('pantomime-action', (d) => applyAction(d));
  }, [online, isHost, applyAction]);

  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('pantomime-state', {
      snapshot: JSON.parse(
        JSON.stringify({
          phase,
          teams,
          activeTeamIdx,
          actorIdx,
          round,
          totalRounds,
          mode,
          categories,
          extrasEnabled,
          extra,
          extraAccepted,
          fetchLeft,
          deck,
          deckPos,
          turnResults,
          // Der Begriff geht an die Geräte, angezeigt wird er aber allein beim
          // Darsteller. Der Fernseher bekommt ihn nie — siehe `tvPayload`.
          word,
        }),
      ),
    });
  }, [
    online,
    isHost,
    phase,
    teams,
    activeTeamIdx,
    actorIdx,
    round,
    totalRounds,
    mode,
    categories,
    extrasEnabled,
    extra,
    extraAccepted,
    fetchLeft,
    deck,
    deckPos,
    turnResults,
    word,
  ]);

  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast('pantomime-state', (d) => {
      const s = (d as { snapshot?: Record<string, unknown> }).snapshot;
      if (!s) return;
      setPhase(s.phase as Phase);
      setTeams(s.teams as [Team, Team]);
      setActiveTeamIdx(s.activeTeamIdx as 0 | 1);
      setActorIdx(s.actorIdx as [number, number]);
      setRound(s.round as number);
      setTotalRounds(s.totalRounds as number);
      setMode(s.mode as ModeId);
      setCategories(s.categories as PantomimeCategoryId[]);
      setExtrasEnabled(s.extrasEnabled as boolean);
      setExtra((s.extra as Extra | null) ?? null);
      setExtraAccepted(s.extraAccepted as boolean);
      setFetchLeft(s.fetchLeft as number);
      setDeck(s.deck as string[]);
      setDeckPos(s.deckPos as number);
      deckPosRef.current = (s.deckPos as number) ?? 0;
      setTurnResults((s.turnResults as CardResult[]) ?? []);
      setWord((s.word as string | null) ?? null);
    });
  }, [online, isHost]);

  // Nicht-Host spiegelt die Uhr über EINEN Boolean (Muster aus OhrwurmGame).
  useEffect(() => {
    if (!isOnline || isHost) return;
    if (phase === 'playing') timerRef.current?.start();
    else timerRef.current?.pause();
  }, [isOnline, isHost, phase]);

  // --- Fernseher -----------------------------------------------------------
  const extraText = useMemo(() => {
    if (!extra) return '';
    if (extra.kind === 'requisit') {
      return t('games.pantomime.extras.requisit', {
        item: t(`games.pantomime.props.${extra.propKey}`),
      });
    }
    return t(`games.pantomime.extras.${extra.key}`);
  }, [extra, t]);

  const tvPayload = useMemo(
    () => ({
      phase,
      round,
      totalRounds,
      teams: teams.map((tm) => ({
        name: tm.name,
        color: tm.color,
        score: tm.score,
        players: tm.players.map((p) => p.name),
      })),
      activeTeamIdx,
      actor: actor?.name ?? '',
      timeLeft: timer.timeLeft,
      totalTime: turnSeconds,
      correctCount: turnResults.filter((r) => r.result === 'correct').length,
      // Fuer die Wertung zwischen den Zuegen — ohne das steht der Fernseher
      // dort leer, waehrend am Tisch die Punkte verkuendet werden.
      turnPoints,
      extraAccepted,
      // Die Herausforderung MUSS auf den Fernseher: Nur so sieht die Gruppe,
      // ob der Kochlöffel wirklich benutzt wurde.
      extra: extraAccepted && extra ? { text: extraText, kind: extra.kind } : null,
      fetchLeft: phase === 'fetch' ? fetchLeft : 0,
      // KEIN `word` — alle schauen auf den Fernseher.
    }),
    [
      phase,
      round,
      totalRounds,
      teams,
      activeTeamIdx,
      actor,
      timer.timeLeft,
      turnSeconds,
      turnResults,
      turnPoints,
      extraAccepted,
      extra,
      extraText,
      fetchLeft,
    ],
  );

  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('tv-state', { game: 'pantomime', ...tvPayload });
  }, [online, isHost, tvPayload]);

  useTVGameBridge('pantomime', tvPayload, [
    phase,
    round,
    activeTeamIdx,
    // Die Uhr MUSS hier stehen: Ohne sie feuert die Bruecke nur bei
    // Phasenwechseln, und auf dem Fernseher stuende eine eingefrorene Zahl.
    timer.timeLeft,
    turnResults.length,
    turnPoints,
    fetchLeft,
  ]);

  // --- Persistenz (offline) ------------------------------------------------
  const restoredRef = useRef(false);
  useEffect(() => {
    if (isOnline || restoredRef.current) return;
    restoredRef.current = true;
    const s = loadSnapshot<Record<string, unknown>>('pantomime');
    if (s && s.phase && s.phase !== 'setup' && s.phase !== 'gameOver') {
      setTeams(s.teams as [Team, Team]);
      setActiveTeamIdx(s.activeTeamIdx as 0 | 1);
      setActorIdx(s.actorIdx as [number, number]);
      setRound(s.round as number);
      setTotalRounds(s.totalRounds as number);
      setMode(s.mode as ModeId);
      setCategories(s.categories as PantomimeCategoryId[]);
      setExtrasEnabled(s.extrasEnabled as boolean);
      setDeck(s.deck as string[]);
      setDeckPos(s.deckPos as number);
      deckPosRef.current = (s.deckPos as number) ?? 0;
      // Mitten im Zug wird NICHT fortgesetzt: Der Darsteller hat den Begriff
      // längst gesehen und die Uhr lief weiter. Der Zug beginnt neu.
      setPhase('turnStart');
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) return;
    if (phase === 'setup' || phase === 'gameOver') {
      clearSnapshot('pantomime');
      return;
    }
    if (!restoredRef.current) return;
    saveSnapshot('pantomime', {
      phase,
      teams,
      activeTeamIdx,
      actorIdx,
      round,
      totalRounds,
      mode,
      categories,
      extrasEnabled,
      deck,
      deckPos,
    });
  }, [
    isOnline,
    phase,
    teams,
    activeTeamIdx,
    actorIdx,
    round,
    totalRounds,
    mode,
    categories,
    extrasEnabled,
    deck,
    deckPos,
  ]);

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
      players: TeamPlayer[];
      mode: ModeId;
      categories: PantomimeCategoryId[];
      rounds: number;
      extras: boolean;
    }) => {
      const words = shuffle(getPantomimeWords(cfg.categories, drinkingMode.isActivated));
      if (words.length === 0) return;

      const mixed = shuffle(cfg.players);
      const half = Math.ceil(mixed.length / 2);
      setTeams([
        {
          name: t('games.pantomime.teamA'),
          color: PM.teamA,
          players: mixed.slice(0, half),
          score: 0,
        },
        {
          name: t('games.pantomime.teamB'),
          color: PM.teamB,
          players: mixed.slice(half),
          score: 0,
        },
      ]);
      setMode(cfg.mode);
      setCategories(cfg.categories);
      setTotalRounds(cfg.rounds);
      setExtrasEnabled(cfg.extras);
      setDeck(words);
      setDeckPos(0);
      deckPosRef.current = 0;
      setActiveTeamIdx(0);
      setActorIdx([0, 0]);
      setRound(1);
      setLastExtraKind(undefined);
      restoredRef.current = true;
      setPhase('turnStart');
    },
    [drinkingMode.isActivated, t],
  );

  // =========================================================================
  if (phase === 'setup') {
    return (
      <PantomimeSetup
        onStart={handleStart}
        onlinePlayers={online?.players}
        categories={availableCategories}
        contentReady={contentReady}
        adultUnlocked={drinkingMode.isActivated}
      />
    );
  }

  const winner =
    teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? teams[0] : teams[1];

  return (
    <div className="min-h-[100dvh] relative" style={{ background: PM.bg, color: PM.text }}>
      {/* Kopf */}
      <div className="relative z-10 px-4 pt-14 pb-3 flex items-center justify-between">
        <button
          onClick={() => setConfirmExit(true)}
          className="text-xs font-bold"
          style={{ color: PM.dim }}
        >
          ← {t('games.pantomime.leave')}
        </button>
        <div className="text-xs font-bold" style={{ color: PM.dim }}>
          {t('games.pantomime.roundOf', { round, total: totalRounds })}
        </div>
        <div className="flex items-center gap-2 text-xs font-black">
          <span style={{ color: PM.teamA }}>{teams[0].score}</span>
          <span style={{ color: PM.dim }}>:</span>
          <span style={{ color: PM.teamB }}>{teams[1].score}</span>
        </div>
      </div>

      {/*
        Ohne `AnimatePresence`, wie in `TabooGame.tsx`, dem Vorbild dieses
        Spiels: Die Bildschirme ziehen einzeln ein (`initial`/`animate`), gehen
        aber ohne Ausblendung.

        Der Unterschied ist nicht nur Geschmack. Ein Ausblenden laeuft ueber
        `requestAnimationFrame`, und solange es laeuft, haelt
        `AnimatePresence` den alten Bildschirm im Baum. Steht rAF still —
        Browsertab im Hintergrund, App auf dem Handy weggewischt —, endet das
        Ausblenden nie: Der alte Bildschirm bleibt stehen, der neue kommt bei
        `mode="wait"` gar nicht erst. Genau das ist mir beim Durchspielen in
        einem unsichtbaren Tab passiert (0 Bilder/Sekunde), und auf einem
        Handy, das aus der Tasche kommt, ist derselbe Zustand denkbar.

        Ohne Ausblendung haengt der Phasenwechsel an nichts als am Zustand.
      */}
        {/* ---------------------------------------------------------------- */}
        {phase === 'turnStart' && (
          <motion.div
            key="turnStart"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 px-4 pt-8 text-center"
          >
            <p
              className="inline-block px-4 py-1.5 rounded-full text-sm font-black"
              style={{ background: activeTeam.color, color: PM.bg }}
            >
              {activeTeam.name}
            </p>
            <div className="mt-6">
              <ActivePlayerBanner
                playerName={actor?.name ?? ''}
                playerColor={activeTeam.color}
                subtitle={t('games.pantomime.actorIs')}
              />
            </div>
            <button
              onClick={() => act('begin', {}, beginTurn)}
              className="mt-10 w-full h-14 rounded-2xl font-black text-lg"
              style={{ background: PM.gold, color: PM.bg }}
            >
              {t('games.pantomime.ready')}
            </button>
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Das Angebot — der Moment, in dem der Kochlöffel ins Spiel kommt.   */}
        {phase === 'extra' && extra && (
          <motion.div
            key="extra"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="relative z-10 px-4 pt-8"
          >
            <div
              className="rounded-3xl p-6 text-center border"
              style={{
                background: PM.surface,
                borderColor: 'rgba(251,191,36,0.35)',
                boxShadow: '0 0 40px rgba(251,191,36,0.12)',
              }}
            >
              <Sparkles className="w-8 h-8 mx-auto" style={{ color: PM.gold }} />
              <p
                className="mt-2 text-[11px] font-black uppercase tracking-widest"
                style={{ color: PM.gold }}
              >
                {t('games.pantomime.extraTitle')}
              </p>
              <p className="mt-3 text-xl font-black leading-snug">{extraText}</p>
              <p className="mt-3 text-sm font-bold" style={{ color: PM.good }}>
                {t('games.pantomime.extraDouble')}
              </p>
            </div>

            {iAmActor && (
              <>
                <button
                  onClick={() => act('accept', {}, acceptExtra)}
                  className="mt-5 w-full h-14 rounded-2xl font-black text-lg"
                  style={{ background: PM.gold, color: PM.bg }}
                >
                  {t('games.pantomime.extraAccept')}
                </button>
                <button
                  onClick={() => act('decline', {}, declineExtra)}
                  className="mt-2 w-full h-12 rounded-2xl font-bold"
                  style={{ background: PM.surface, color: PM.dim }}
                >
                  {t('games.pantomime.extraDecline')}
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {phase === 'fetch' && extra && (
          <motion.div
            key="fetch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 px-4 pt-16 text-center"
          >
            <p className="text-sm" style={{ color: PM.dim }}>
              {t('games.pantomime.fetchTitle')}
            </p>
            <p className="mt-2 text-3xl font-black" style={{ color: PM.gold }}>
              {t(`games.pantomime.props.${extra.propKey}`)}
            </p>
            <motion.p
              key={fetchLeft}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-10 text-7xl font-black tabular-nums"
            >
              {fetchLeft}
            </motion.p>
            {iAmActor && (
              <button
                onClick={startPlaying}
                className="mt-10 w-full h-12 rounded-2xl font-bold"
                style={{ background: PM.surface, color: PM.text }}
              >
                {t('games.pantomime.fetchGo')}
              </button>
            )}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {phase === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 px-4"
          >
            {/* Uhr */}
            <div className="flex items-center justify-center gap-2">
              <Clock
                className="w-4 h-4"
                style={{ color: timer.timeLeft <= 10 ? PM.bad : PM.dim }}
              />
              <span
                className="text-2xl font-black tabular-nums"
                style={{ color: timer.timeLeft <= 10 ? PM.bad : PM.text }}
              >
                {timer.timeLeft}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 rounded-full overflow-hidden"
              style={{ background: PM.surface }}
            >
              <div
                className="h-full transition-[width] duration-1000 ease-linear"
                style={{
                  width: `${(timer.timeLeft / turnSeconds) * 100}%`,
                  background: timer.timeLeft <= 10 ? PM.bad : activeTeam.color,
                }}
              />
            </div>

            {/* Angenommene Herausforderung bleibt sichtbar — sonst vergisst sie
                im Eifer jeder, und die doppelten Punkte wären geschenkt. */}
            {extraAccepted && extra && (
              <p
                className="mt-3 rounded-2xl px-4 py-2 text-center text-sm font-bold"
                style={{ background: 'rgba(251,191,36,0.12)', color: PM.gold }}
              >
                <Sparkles className="w-4 h-4 inline mr-1.5" />
                {extraText}
              </p>
            )}

            {iAmActor ? (
              <>
                {/* Der Begriff — nur auf diesem Gerät. */}
                <motion.div
                  key={word ?? 'none'}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className="mt-6 rounded-3xl px-5 py-10 text-center"
                  style={{ background: PM.elevated }}
                >
                  <p className="text-3xl font-black leading-tight">{word}</p>
                </motion.div>

                <div className="mt-5 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => act('guessed', {}, doGuessed)}
                    className="h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
                    style={{ background: PM.good, color: PM.bg }}
                  >
                    <Check className="w-6 h-6" /> {t('games.pantomime.guessed')}
                  </button>
                  <button
                    onClick={() => act('skip', {}, doSkip)}
                    className="h-12 rounded-2xl font-bold flex items-center justify-center gap-2"
                    style={{ background: PM.surface, color: PM.dim }}
                  >
                    <SkipForward className="w-4 h-4" /> {t('games.pantomime.skip')}
                  </button>
                </div>
              </>
            ) : (
              // Alle anderen Geräte: bloß nicht der Begriff.
              <div
                className="mt-6 rounded-3xl px-5 py-12 text-center"
                style={{ background: PM.elevated }}
              >
                <Drama className="w-10 h-10 mx-auto" style={{ color: activeTeam.color }} />
                <p className="mt-3 text-xl font-black">
                  {t('games.pantomime.watching', { name: actor?.name ?? '' })}
                </p>
                <p className="mt-2 text-sm" style={{ color: PM.dim }}>
                  {t('games.pantomime.wordsSoFar', {
                    count: turnResults.filter((r) => r.result === 'correct').length,
                  })}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {phase === 'turnSummary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 px-4 pt-6 pb-10"
          >
            <p className="text-center text-sm" style={{ color: PM.dim }}>
              {t('games.pantomime.summaryTitle', { name: actor?.name ?? '' })}
            </p>
            <p className="mt-1 text-center text-5xl font-black" style={{ color: activeTeam.color }}>
              +{turnPoints}
            </p>
            {extraAccepted && (
              <p className="mt-1 text-center text-sm font-bold" style={{ color: PM.gold }}>
                {t('games.pantomime.summaryDoubled')}
              </p>
            )}

            <div className="mt-5 rounded-3xl p-2" style={{ background: PM.surface }}>
              {turnResults.length === 0 && (
                <p className="px-3 py-3 text-center text-sm" style={{ color: PM.dim }}>
                  {t('games.pantomime.summaryEmpty')}
                </p>
              )}
              {turnResults.map((r, i) => (
                <div key={`${r.word}-${i}`} className="flex items-center gap-2 px-3 py-2">
                  {r.result === 'correct' ? (
                    <Check className="w-4 h-4 shrink-0" style={{ color: PM.good }} />
                  ) : (
                    <SkipForward className="w-4 h-4 shrink-0" style={{ color: PM.dim }} />
                  )}
                  <span
                    className="text-sm font-bold"
                    style={{ color: r.result === 'correct' ? PM.text : PM.dim }}
                  >
                    {r.word}
                  </span>
                </div>
              ))}
            </div>

            {(!isOnline || isHost) && (
              <button
                onClick={() => act('next', {}, nextTurn)}
                className="mt-5 w-full h-14 rounded-2xl font-black flex items-center justify-center gap-2"
                style={{ background: PM.gold, color: PM.bg }}
              >
                {round >= totalRounds && activeTeamIdx === 1
                  ? t('games.pantomime.finish')
                  : t('games.pantomime.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {phase === 'gameOver' && (
          <motion.div
            key="over"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 px-4 pt-10 text-center"
          >
            <Trophy className="w-12 h-12 mx-auto" style={{ color: PM.gold }} />
            <p className="mt-3 text-2xl font-black">
              {winner
                ? t('games.pantomime.winner', { team: winner.name })
                : t('games.pantomime.draw')}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {teams.map((tm) => (
                <div key={tm.name} className="rounded-3xl p-5" style={{ background: PM.surface }}>
                  <p className="text-sm font-black" style={{ color: tm.color }}>
                    {tm.name}
                  </p>
                  <p className="mt-1 text-4xl font-black tabular-nums">{tm.score}</p>
                  <p className="mt-2 text-[11px] leading-snug" style={{ color: PM.dim }}>
                    {tm.players.map((p) => p.name).join(' · ')}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                clearSnapshot('pantomime');
                setPhase('setup');
              }}
              className="mt-8 w-full h-14 rounded-2xl font-black"
              style={{ background: PM.gold, color: PM.bg }}
            >
              {t('games.pantomime.playAgain')}
            </button>
            <button
              onClick={() => {
                clearSnapshot('pantomime');
                navigate('/games');
              }}
              className="mt-2 w-full h-12 rounded-2xl font-bold"
              style={{ background: PM.surface, color: PM.dim }}
            >
              {t('games.pantomime.backToGames')}
            </button>
          </motion.div>
        )}

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
            <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: PM.elevated }}>
              <p className="text-lg font-black">{t('games.pantomime.leaveTitle')}</p>
              <p className="mt-2 text-sm" style={{ color: PM.dim }}>
                {t('games.pantomime.leaveBody')}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmExit(false)}
                  className="h-12 rounded-2xl font-black"
                  style={{ background: PM.surface, color: PM.text }}
                >
                  {t('games.pantomime.leaveStay')}
                </button>
                <button
                  onClick={() => {
                    clearSnapshot('pantomime');
                    navigate('/games');
                  }}
                  className="h-12 rounded-2xl font-black"
                  style={{ background: PM.bad, color: PM.bg }}
                >
                  {t('games.pantomime.leaveGo')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===========================================================================
// Einrichtung
// ===========================================================================

function PantomimeSetup({
  onStart,
  onlinePlayers,
  categories,
  contentReady,
  adultUnlocked,
}: {
  onStart: (cfg: {
    players: TeamPlayer[];
    mode: ModeId;
    categories: PantomimeCategoryId[];
    rounds: number;
    extras: boolean;
  }) => void;
  onlinePlayers?: { id: string; name: string }[];
  categories: PantomimeCategory[];
  contentReady: boolean;
  adultUnlocked: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [list, setList] = useState<PlayerSetupPlayer[]>(
    onlinePlayers?.length
      ? onlinePlayers.map((p) => ({ id: p.id, name: p.name, readOnly: true }))
      : [
          { id: 'p1', name: '' },
          { id: 'p2', name: '' },
          { id: 'p3', name: '' },
          { id: 'p4', name: '' },
        ],
  );
  const [mode, setMode] = useState<ModeId>('klassisch');
  const [cats, setCats] = useState<PantomimeCategoryId[]>([]);
  const [rounds, setRounds] = useState(5);
  const [extras, setExtras] = useState(true);

  const named: TeamPlayer[] = list.map((p, i) => ({
    id: p.id,
    name: p.name.trim() || t('games.pantomime.playerN', { n: i + 1 }),
  }));

  const available = useMemo(() => {
    const chosen = cats.length > 0 ? categories.filter((c) => cats.includes(c.id)) : categories;
    return chosen.reduce((sum, c) => sum + c.words.length, 0);
  }, [categories, cats]);

  // Vier Leute sind das Minimum für zwei Teams, in denen jemand rät.
  const canStart = contentReady && available > 0 && named.length >= 4;

  return (
    <div className="min-h-[100dvh]" style={{ background: PM.bg, color: PM.text }}>
      <main className="relative z-10 pt-14 px-5 max-w-2xl mx-auto pb-16">
        <button
          onClick={() => navigate('/games')}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold"
          style={{ color: PM.dim }}
        >
          ← {t('games.pantomime.backToGames')}
        </button>

        <h1 className="text-3xl font-black flex items-center gap-2">
          <Drama className="w-7 h-7" style={{ color: PM.gold }} />
          {t('games.pantomime.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: PM.dim }}>
          {t('games.pantomime.tagline')}
        </p>

        <div className="mt-6">
          <PlayerSetup
            players={list}
            onAdd={() => setList((p) => [...p, { id: `p${Date.now()}`, name: '' }])}
            onRemove={(id) => setList((p) => p.filter((x) => x.id !== id))}
            onRename={(id, name) => setList((p) => p.map((x) => (x.id === id ? { ...x, name } : x)))}
            min={4}
            max={16}
            accent={PM.gold}
            label={t('games.pantomime.playersLabel')}
            hint={
              <span className="text-[11px]" style={{ color: PM.dim }}>
                {t('games.pantomime.teamsHint')}
              </span>
            }
            onImportNames={(names) =>
              setList((prev) => {
                const room = Math.max(0, 16 - prev.length);
                const fresh = names.slice(0, room).map((n, i) => ({
                  id: `ev${Date.now()}-${i}`,
                  name: n,
                }));
                const filled = prev.slice();
                let take = 0;
                for (let i = 0; i < filled.length && take < fresh.length; i++) {
                  if (!filled[i].name.trim() && !filled[i].readOnly) {
                    filled[i] = { ...filled[i], name: fresh[take].name };
                    take++;
                  }
                }
                return [...filled, ...fresh.slice(take)].slice(0, 16);
              })
            }
          />
        </div>

        {/* Herausforderungen */}
        <p
          className="mt-7 mb-2 text-xs font-black uppercase tracking-wide"
          style={{ color: PM.dim }}
        >
          {t('games.pantomime.extrasLabel')}
        </p>
        <button
          onClick={() => setExtras((v) => !v)}
          aria-pressed={extras}
          className="w-full p-4 rounded-2xl text-left flex items-center gap-3"
          style={{ background: extras ? 'rgba(251,191,36,0.14)' : PM.surface }}
        >
          <Sparkles className="w-5 h-5 shrink-0" style={{ color: extras ? PM.gold : PM.dim }} />
          <span className="flex-1">
            <span className="block text-sm font-black">
              {extras ? t('games.pantomime.extrasOn') : t('games.pantomime.extrasOff')}
            </span>
            <span className="block text-[11px]" style={{ color: PM.dim }}>
              {t('games.pantomime.extrasDesc')}
            </span>
          </span>
        </button>

        {/* Bedenkzeit */}
        <p
          className="mt-7 mb-2 text-xs font-black uppercase tracking-wide"
          style={{ color: PM.dim }}
        >
          {t('games.pantomime.mode')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="p-3 rounded-2xl text-left"
              style={{
                background: mode === m.id ? PM.gold : PM.surface,
                color: mode === m.id ? PM.bg : PM.text,
              }}
            >
              <span className="block text-sm font-black">
                {t(`gameModes.pantomime.${m.id}.name`)}
              </span>
              <span className="block text-[11px] opacity-80">
                {t(`gameModes.pantomime.${m.id}.desc`)}
              </span>
            </button>
          ))}
        </div>

        {/* Kategorien */}
        <p
          className="mt-7 mb-2 text-xs font-black uppercase tracking-wide"
          style={{ color: PM.dim }}
        >
          {t('games.pantomime.categoriesLabel')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCats([])}
            aria-pressed={cats.length === 0}
            className="px-3 py-2 rounded-full text-xs font-bold"
            style={{
              background: cats.length === 0 ? PM.gold : PM.surface,
              color: cats.length === 0 ? PM.bg : PM.text,
            }}
          >
            {t('games.pantomime.mix')}
          </button>
          {categories.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() =>
                  setCats((prev) => (on ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
                }
                aria-pressed={on}
                className="px-3 py-2 rounded-full text-xs font-bold"
                style={{
                  background: on ? (c.adult ? PM.bad : PM.teamB) : PM.surface,
                  color: on ? PM.bg : PM.text,
                }}
              >
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] mt-2" style={{ color: PM.dim }}>
          {contentReady
            ? t('games.pantomime.available', { count: available })
            : t('games.pantomime.loading')}
        </p>
        {/* Kein Hinweis auf die 18+-Kategorie, solange sie nicht freigeschaltet
            ist — ein „hier fehlt etwas" wäre selbst schon der Hinweis. */}
        {adultUnlocked && (
          <p className="text-[11px] mt-1" style={{ color: PM.bad }}>
            {t('games.pantomime.adultHint')}
          </p>
        )}

        {/* Runden */}
        <p
          className="mt-7 mb-2 text-xs font-black uppercase tracking-wide"
          style={{ color: PM.dim }}
        >
          {t('games.pantomime.rounds')}: {rounds}
        </p>
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: PM.gold }}
        />

        <button
          disabled={!canStart}
          onClick={() => onStart({ players: named, mode, categories: cats, rounds, extras })}
          className="mt-8 w-full h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: PM.gold, color: PM.bg }}
        >
          {t('games.pantomime.start')}
        </button>
        {!canStart && named.length < 4 && (
          <p className="mt-2 text-center text-[11px]" style={{ color: PM.dim }}>
            {t('games.pantomime.needFour')}
          </p>
        )}
      </main>
    </div>
  );
}
