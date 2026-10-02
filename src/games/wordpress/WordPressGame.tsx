import { getWordPack, forbiddenWords, wordLanguage } from './word-content';
import '../headup/classic-stage.css';
import { GameStage } from '../ui/GameStage';
import { removeFromWordPress } from './removal';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { useOnlineActions, useOnlineSnapshot, OnlineWaiting } from '../bottlespin/online-controller';
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useInitialRoster } from "@/games/ui/useInitialRoster";
import { useNavigate } from 'react-router-dom';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { SetupScreen } from './WordPressSetup';
import { PlayingScreen } from './WordPressPlaying';
import { GameOverScreen, RoundEndScreen } from './WordPressResults';
import { wordPressActiveId, wordPressActiveSeat, wordPressTvPlayers } from './guest-turns';
import { randomFrom, WORDS_PER_TURN, type GameMode, type GamePhase, type PlayerState, type Speed } from './wordpress-types';

// ---------------------------------------------------------------------------
// Main Game Controller
// ---------------------------------------------------------------------------

export default function WordPressGame({ online }: { online?: OnlineGameProps } = {}) {
  const { i18n } = useTranslation();
  const [contentLanguage, setContentLanguage] = useState(() => wordLanguage(i18n.language));
  const matchWords = getWordPack(contentLanguage);
  const onlinePlayerNames = online?.players?.map(p => p.name) ?? [];
  // Gemeinsamer Helfer statt neunter Kopie: Er kennt dieselbe Rangfolge und
  // haengt live an der Party-Sitzung — die frueheren Einzelfassungen lasen
  // genau einmal beim Mount und verpassten jede spaetere Aenderung.
  const partyRoster = useInitialRoster() ?? [];
  const partyPlayerNames = partyRoster.map((p) => p.name);
  const resolvedPlayerNames = onlinePlayerNames.length >= 2
    ? onlinePlayerNames
    : partyPlayerNames.length >= 2
      ? partyPlayerNames
      : [];
  const [phase, setPhase] = useState<GamePhase>('setup');

  const navigate = useNavigate();
  const exitGuard = useConfirmExit(() => navigate('/games'));

  // Der native Zurück-Knopf (FloatingBackButton / Android-Hardware-Taste) liegt
  // über allem und löst kein onClick im Spiel aus. Ohne Eintrag im
  // Back-Guard-Stapel navigiert er mitten in der Runde weg und die Partie ist
  // futsch. Setup und Endstand haben nichts zu verlieren und reichen an den
  // Routen-Handler weiter.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [mode, setMode] = useState<GameMode>('kategorie');
  const [speed, setSpeed] = useState<Speed>('medium');
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [forbiddenWord, setForbiddenWord] = useState(() => randomFrom(forbiddenWords(matchWords)));
  const [turnQueue, setTurnQueue] = useState<number[]>([]);
  // Live-Snapshot aus PlayingScreen hochgereicht (currentWord/combo/score leben
  // dort als State — ein direkter Verweis hier warf "Can't find variable" und
  // crashte das Spiel). Dient nur der TV-Ansicht.
  const [live, setLive] = useState<{ word: string; displayColor?: string; wordIndex: number; combo: number; score: number }>({ word: '', wordIndex: 0, combo: 0, score: 0 });
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  // 🔁 guests take their turn on the host phone after an opaque handover; the word clock only
  // starts with their own "Bereit", so nothing runs while the phone travels (guest-turns.ts).
  const handover = useSeatHandover(online, wordPressActiveSeat(phase, wordPressActiveId(players, currentPlayerIndex, online?.players)));
  // All devices + TV switch together on every phase, round and turn change (design §9 beat).
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, round, currentPlayerIndex]);

  useTVGameBridge('wordpress', {
    phase, phaseStartsAt, round, currentPlayerIndex, totalRounds, handover: handover.tv,
    players: wordPressTvPlayers(players, online?.players ?? partyRoster),
    partyScoresById: online ? Object.fromEntries(online.players.map((p, i) => [p.id, (players.find(x => x.id === p.id) ?? players[i])?.score ?? 0])) : undefined,
    mode,
    currentWord: live.word,
    displayColor: live.displayColor,
    forbiddenWord, contentLanguage,
    wordIndex: live.wordIndex,
    wordsPerTurn: WORDS_PER_TURN,
    liveCombo: live.combo,
    liveScore: live.score,
  }, [phase, phaseStartsAt, round, currentPlayerIndex, players, mode, forbiddenWord, contentLanguage, live, handover.tv], !online || online.isHost);

  const handleStart = useCallback((ps: PlayerState[], m: GameMode, s: Speed, r: number) => {
    const roster = online ? online.players.map((member, i) => ({ ...ps[i % ps.length], id: member.id, name: member.name })) : ps;
    const language = wordLanguage(i18n.language);
    setContentLanguage(language);
    setPlayers(roster);
    setMode(m);
    setSpeed(s);
    setTotalRounds(r);
    setRound(1);
    setCurrentPlayerIndex(0);
    setForbiddenWord(randomFrom(forbiddenWords(getWordPack(language))));
    // Build queue: all players take a turn in round 1
    setTurnQueue(roster.map((_, i) => i).slice(1));
    setPhase('playing');
  }, [online, i18n.language]);

  const handlePlayerDone = useCallback((updatedPlayer: PlayerState) => {
    setPlayers(prev => prev.map((p, i) => i === currentPlayerIndex ? updatedPlayer : p));

    if (turnQueue.length > 0) {
      // More players in this round
      const [next, ...rest] = turnQueue;
      setCurrentPlayerIndex(next);
      setForbiddenWord(randomFrom(forbiddenWords(matchWords)));
      setTurnQueue(rest);
      // The playing screen remounts by player key; the turn change is a synced beat of its own.
    } else {
      // Round complete
      setPhase('roundEnd');
    }
  }, [currentPlayerIndex, turnQueue, matchWords]);

  const handleNextRound = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound > totalRounds) {
      setPhase('gameOver');
      return;
    }
    setRound(nextRound);
    setCurrentPlayerIndex(0);
    setForbiddenWord(randomFrom(forbiddenWords(matchWords)));
    setTurnQueue(players.map((_, i) => i).slice(1));
    setPhase('playing');
  }, [round, totalRounds, players, matchWords]);

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? (players.find(p => p.id === online.myPlayerId) ?? players[online.players.findIndex(p => p.id === online.myPlayerId)]) : winner;
      recordEnd('drueck-das-wort', me?.score ?? 0, !!me && me.score === winner?.score);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const handleRestart = useCallback(() => {
    setPhase('setup');
    setPlayers([]);
    setRound(1);
    setCurrentPlayerIndex(0);
    setTurnQueue([]);
  }, []);

  // Preserve players and settings; start a new match with fresh reaction statistics.
  const rematch = useCallback(() => {
    if (players.length === 0) { handleRestart(); return; }
    gameRecordedRef.current = false;
    setPlayers(prev => prev.map(player => ({ ...player, score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, missed: 0 })));
    setRound(1);
    setCurrentPlayerIndex(0);
    setForbiddenWord(randomFrom(forbiddenWords(matchWords)));
    setTurnQueue(players.map((_, i) => i).slice(1));
    setPhase('playing');
  }, [players, handleRestart, matchWords]);

  // Host: removed players leave roster/scores/queue; if it was their turn the next
  // queued player starts fresh (or the round closes) — see removal.ts.
  useRemovedPlayers(online, ids => {
    const change = removeFromWordPress({ phase, players, currentPlayerIndex, turnQueue }, ids);
    if (!change.changed) return;
    const next = change.state;
    if (change.turnEnded) { setForbiddenWord(randomFrom(forbiddenWords(matchWords))); }
    setPlayers(next.players); setCurrentPlayerIndex(next.currentPlayerIndex); setTurnQueue(next.turnQueue); setPhase(next.phase);
  });

  const act = useOnlineActions(online, 'wordpress', `${phase}:${round}:${currentPlayerIndex}`, {
    start: { allowed: phase === 'setup' ? 'host' : false, run: handleStart },
    next: { allowed: phase === 'roundEnd' && turnQueue.length === 0 ? 'host' : false, run: handleNextRound },
    again: { allowed: phase === 'gameOver' ? 'host' : false, run: rematch },
  });
  useOnlineSnapshot(online, 'wordpress', { phase, phaseStartsAt, players, mode, speed, round, totalRounds, currentPlayerIndex, turnQueue, forbiddenWord, contentLanguage }, state => {
    receivePhaseStart(state.phaseStartsAt);
    setPhase(state.phase); setPlayers(state.players); setMode(state.mode); setSpeed(state.speed); setRound(state.round); setTotalRounds(state.totalRounds); setCurrentPlayerIndex(state.currentPlayerIndex); setTurnQueue(state.turnQueue);
    setForbiddenWord(state.forbiddenWord);
    setContentLanguage(wordLanguage(state.contentLanguage));
  });
  if (online && !online.isHost && phase === 'setup') return <OnlineWaiting />;
  if (handover.overlay) return handover.overlay; // phone in transit: only the opaque pass screen


  return (
    // Fragment, damit der Verlassen-Dialog NEBEN der AnimatePresence liegt und
    // deren mode="wait"-Phasenwechsel nicht als zweites Kind stört.
    <GameStage gameId="wordpress" className={view === 'playing' ? 'wordpress-controller !p-0' : 'wordpress-controller'}>
    {blocker}
    <AnimatePresence mode="wait">
      {view === 'setup' && (
        <motion.div key="setup" exit={{ opacity: 0 }}>
          <SetupScreen locked={!!online} onStart={(...args) => act('start', ...args)} onlinePlayerNames={resolvedPlayerNames} />
        </motion.div>
      )}
      {view === 'playing' && (
        <motion.div key={`playing-${round}-${players[currentPlayerIndex]?.id ?? currentPlayerIndex}`} exit={{ opacity: 0 }}>
          <PlayingScreen
            online={online}
            players={players}
            mode={mode}
            speed={speed}
            round={round}
            totalRounds={totalRounds}
            currentPlayerIndex={currentPlayerIndex}
            forbiddenWord={forbiddenWord}
            contentLanguage={contentLanguage}
            onPlayerDone={handlePlayerDone}
            onLive={setLive}
            inputOpen={!blocker}
          />
        </motion.div>
      )}
      {view === 'roundEnd' && (
        <motion.div key={`roundEnd-${round}`} exit={{ opacity: 0 }}>
          <RoundEndScreen
            players={players}
            round={round}
            totalRounds={totalRounds}
            onNextRound={() => act('next')}
          />
        </motion.div>
      )}
      {view === 'gameOver' && (
        <motion.div key="gameOver" exit={{ opacity: 0 }}>
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <GameOverScreen players={players} onRestart={() => act('again')} />
        </motion.div>
      )}
    </AnimatePresence>
    <ConfirmExitDialog {...exitGuard.dialogProps} accent="#d5f46a" />
    </GameStage>
  );
}
