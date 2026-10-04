import { GameStage } from '../ui/GameStage';
import './design.css';
import { phaseAfterQuestion, identityMatches, identityMayBeRevealed } from './question-rules';
import { useOnlineAuthority, OnlineWaiting } from '../sharedquiz/useOnlineAuthority';
import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameEnd } from '../social/useGameEnd';
import { PlayerSetup } from '../ui/PlayerSetup';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import { useHaptics } from '@/hooks/useHaptics';
import { useConfirmExit, ConfirmExitDialog } from '@/games/ui/useConfirmExit';
import { useBackGuard } from '@/lib/back-guard';
import { hasShellBackButton } from '@/games/ui/shell-back';
import { localActiveSeats } from '../ui/guest-handover';
import { useSeatHandover } from '../multiplayer/useGuestHandover';
import { useSyncedPhase } from '../multiplayer/useSyncedPhase';
import { useRemovedPlayers } from '../multiplayer/useRemovedPlayers';
import { PLAYER_COLORS, MAX_QUESTIONS, drawPool, EP_STYLE } from './whoami-config';
import { applyWhoAmIRemoval } from './removal';
import {
  answerVoter, characterView, guardedSeats, holderSeat, pendingAssignViewers, solveBonus,
  visibleCharacters, whoamiActiveSeat, whoamiTVPlayers, type WhoAmIPhase, notSeenNames } from './party-seats';
import { useWhoAmISync } from './useWhoAmISync';
import { WhoAmISetup, useSetupRoster, type SetupSeat } from './WhoAmISetup';
import { ExitLink, LocalAssign, OnlineAssign } from './AssignPanels';
import { AskingPanel } from './AskingPanel';
import { AnswerVotePanel, GuessingPanel, type Answer } from './RoundPanels';
import { GameOverPanel, GuessResultPanel } from './ResultPanels';

type Phase = WhoAmIPhase;
interface Player {
  id: string; name: string; color: string; avatar: string; score: number;
  character: string; questionsAsked: number; guessedCorrectly: boolean; eliminated: boolean;
}
type Settings = { timer: number; rounds: number };

/** Spielerzahl des Setups (gegen die Registry geprueft: lib/playable-games.test.ts). */
const MIN = 2, MAX = 10;

function WhoAmIGameContent({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Confirm-before-quit for the in-game header back button (active play only).
  const exitGuard = useConfirmExit(() => navigate('/games'));
  const haptics = useHaptics();

  const [phase, setPhase] = useState<Phase>('setup');
  /** Keine Figuren fuer die gewaehlte Gruppe: ehrliche Meldung statt totem Knopf. */
  const [contentError, setContentError] = useState(false);

  // Der native Zurueck-Knopf laeuft nicht ueber den Pfeil im Spiel: ohne Back-Guard
  // waere die Partie mitten in der Runde futsch. Ein Dialog, derselbe exitGuard.
  useBackGuard(() => {
    if (phase === 'setup' || phase === 'gameOver') return false;
    if (exitGuard.open) { exitGuard.cancel(); return true; }
    exitGuard.request();
    return true;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('prominente');
  const [maxQ, setMaxQ] = useState(MAX_QUESTIONS);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealIdx, setRevealIdx] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [voteResults, setVoteResults] = useState<Record<string, Answer>>({});
  const [voterIdx, setVoterIdx] = useState(0);
  const [guessAttempt, setGuessAttempt] = useState('');
  const [guessCorrect, setGuessCorrect] = useState<boolean | null>(null);
  const [characterRevealed, setCharacterRevealed] = useState(false);
  /** Host-Handy: lokale Plaetze, die beim Verteilen die Karten der anderen schon gesehen haben. */
  const [assignSeen, setAssignSeen] = useState<string[]>([]);

  // 🔁-Gaeste am Host-Handy (sharedDevice 'secret'): wer fragt, antwortet oder
  // die Karten ansieht, bekommt das Handy verdeckt; nie die eigene Figur.
  const localSeatIds = useMemo(() => localActiveSeats(online), [online]);
  const pendingViewers = online?.isHost ? pendingAssignViewers(localSeatIds, players, assignSeen) : [];
  const handover = useSeatHandover(online, whoamiActiveSeat(phase, players, activeIdx, voterIdx, phase === 'assign' ? pendingViewers[0] ?? null : null), { secret: true });
  const hasGuests = handover.guests.length > 0;
  const holder = online ? holderSeat(online.myPlayerId, handover.activeGuest) : null;
  const canAct = (seat: string | undefined) => !online || (!!seat && seat === holder && !handover.overlay);
  const activePlayer = players[activeIdx];
  const viewCtx = { phase, holderId: holder, activeId: activePlayer?.id, maxQ, guarded: guardedSeats(localSeatIds, handover.guests) };
  useEffect(() => { if (phase === 'assign') setAssignSeen([]); }, [phase, currentRound]);

  // Alle Geraete und der TV wechseln die Phase im selben Moment (Design §9.3).
  const { phaseStartsAt, view, blocker, receive: receivePhaseStart } = useSyncedPhase(online, phase, [phase, currentRound]);

  const handleStart = (mapped: SetupSeat[], selectedMode: string, settings: Settings) => {
    if (online && (!online.isHost || online.isConnected === false)) return;
    const pool = drawPool(selectedMode);
    if (!pool) { setContentError(true); return; }
    setPlayers(mapped.map((m, i) => ({
      ...m, color: (online && m.color) || PLAYER_COLORS[i % PLAYER_COLORS.length],
      score: 0, character: pool[i % pool.length].name,
      questionsAsked: 0, guessedCorrectly: false, eliminated: false,
    })));
    setMode(selectedMode); setMaxQ(settings.timer); setTotalRounds(settings.rounds);
    setCurrentRound(1); setRevealIdx(0); setActiveIdx(0);
    setPhase('assign');
  };

  const hostId = online?.hostPlayerId ?? online?.players.find(p => p.isHost)?.id;
  const route = useOnlineAuthority(online, 'whoami', `${phase}:${currentRound}:${activeIdx}:${voterIdx}:${revealIdx}`, {
    submitQuestion: { allow: sender => phase === 'asking' && sender === players[activeIdx]?.id, run: (...args) => submitQuestion(args[0]) },
    tryGuess: { allow: (sender, args) => phase === 'guessing' && sender === players[activeIdx]?.id && typeof args[0] === 'string' && args[0].length <= 100, run: (...args) => tryGuess(args[0]), answer: true },
    skipToGuess: { allow: sender => phase === 'asking' && sender === players[activeIdx]?.id, run: () => skipToGuess() },
    nextReveal: { allow: sender => phase === 'assign' && sender === hostId, run: () => nextReveal() },
    castAnswer: { allow: (sender, args) => phase === 'answerVote' && ['yes', 'no', 'maybe'].includes(args[0]) && sender === answerVoter(players, activeIdx, voterIdx)?.id, run: (...args) => castAnswer(args[0]), answer: true },
    afterGuess: { allow: sender => phase === 'guessResult' && sender === hostId, run: () => afterGuess() },
    handleSolvedDirect: { allow: () => false, run: () => handleSolvedDirect() },
    handleSkipDirect: { allow: sender => phase === 'asking' && sender === players[activeIdx]?.id, run: () => handleSkipDirect() },
    playAgain: { allow: sender => phase === 'gameOver' && sender === hostId, run: () => playAgain() },
  });

  const nextReveal = () => {
    if (route('nextReveal', [])) return;
    if (online) { setPhase('asking'); return; }
    setCharacterRevealed(false); // Hide character for next player
    if (revealIdx + 1 >= players.length) { setRevealIdx(0); setActiveIdx(0); setPhase('asking'); }
    else setRevealIdx(r => r + 1);
  };

  const submitQuestion = (question = currentQuestion) => {
    if (typeof question !== 'string' || !question.trim() || question.length > 200) return;
    if (route('submitQuestion', [question])) return;
    setCurrentQuestion(question); setVoteResults({}); setVoterIdx(0);
    setPhase('answerVote');
  };

  const castAnswer = (answer: Answer) => {
    if (route('castAnswer', [answer])) return;
    const others = players.filter((_, i) => i !== activeIdx);
    const voter = others[voterIdx];
    if (!voter) return;
    setVoteResults({ ...voteResults, [voter.id]: answer });
    if (voterIdx + 1 >= others.length) {
      setPlayers(prev => prev.map((p, i) => i === activeIdx ? { ...p, questionsAsked: p.questionsAsked + 1 } : p));
      setCurrentQuestion('');
      setPhase(phaseAfterQuestion(activePlayer?.questionsAsked ?? 0, maxQ));
    } else setVoterIdx(v => v + 1);
  };

  const voteSummary = useMemo(() => {
    const vals = Object.values(voteResults);
    return { yes: vals.filter(v => v === 'yes').length, no: vals.filter(v => v === 'no').length, maybe: vals.filter(v => v === 'maybe').length };
  }, [voteResults]);

  // TV ist oeffentlich: volle Identitaet, Frage + Summe der Antworten; Figuren erst im Endstand.
  useTVGameBridge('whoami', {
    phase, phaseStartsAt, currentRound, totalRounds, activeIdx, players: whoamiTVPlayers(phase, players),
    currentQuestion, voteTally: voteSummary, maxQuestions: maxQ, guessCorrect, handover: handover.tv,
  }, [phase, phaseStartsAt, currentRound, activeIdx, currentQuestion, voteSummary, guessCorrect,
    players.map(p => `${p.id}:${p.score}:${p.questionsAsked}:${+p.guessedCorrectly}:${+p.eliminated}`).join(','),
    handover.tv?.playerId ?? '', handover.tv?.progress?.phase ?? ''], !online || online.isHost);

  const tryGuess = (guess = guessAttempt) => {
    if (typeof guess !== 'string' || !guess.trim()) return;
    if (route('tryGuess', [guess])) return;
    const correct = identityMatches(guess, activePlayer?.character ?? '');
    setGuessCorrect(correct);
    if (correct) {
      const bonus = solveBonus(activePlayer?.questionsAsked ?? 0, maxQ);
      setPlayers(prev => prev.map((p, i) => i === activeIdx ? { ...p, guessedCorrectly: true, score: p.score + bonus } : p));
    }
    setPhase('guessResult');
  };

  const afterGuess = () => {
    if (route('afterGuess', [])) return;
    setGuessAttempt(''); setGuessCorrect(null);
    if (guessCorrect) { advancePlayer(); return; }
    // wrong guess counts as a question
    const out = (activePlayer?.questionsAsked ?? 0) + 1 >= maxQ;
    setPlayers(prev => prev.map((p, i) => i === activeIdx ? { ...p, questionsAsked: p.questionsAsked + 1, eliminated: p.eliminated || out } : p));
    if (out) advancePlayer(); else setPhase('asking');
  };

  const advancePlayer = () => {
    const remaining = players.filter((p, i) => i !== activeIdx && !p.guessedCorrectly && !p.eliminated);
    if (remaining.length === 0) { endRound(); return; }
    let next = (activeIdx + 1) % players.length;
    while (players[next].guessedCorrectly || players[next].eliminated) next = (next + 1) % players.length;
    setActiveIdx(next); setPhase('asking');
  };

  const endRound = () => {
    if (currentRound >= totalRounds) { setPhase('gameOver'); return; }
    setCurrentRound(r => r + 1);
    const pool = drawPool(mode);
    if (!pool) { setContentError(true); return; }
    setPlayers(prev => prev.map((p, i) => ({ ...p, character: pool[i % pool.length].name, questionsAsked: 0, guessedCorrectly: false, eliminated: false })));
    setRevealIdx(0); setActiveIdx(0); setPhase('assign');
  };

  // Host: a removed player drops out; nobody waits for his question, answer or guess (G7).
  useRemovedPlayers(online, ids => {
    const r = applyWhoAmIRemoval({ phase, players, activeIdx, voterIdx, voteResults, currentQuestion, guessCorrect }, ids, maxQ);
    if (!r) return;
    setPlayers(r.players); setActiveIdx(r.activeIdx); setVoterIdx(r.voterIdx); setVoteResults(r.voteResults);
    setCurrentQuestion(r.currentQuestion); setGuessCorrect(r.guessCorrect); setPhase(r.phase as Phase);
    if (r.roundOver) endRound();
  });

  const skipToGuess = () => { if (route('skipToGuess')) return; setPhase('guessing'); };

  // Lokal („Heads-up“): Telefonhalter tippt GELOEST oder UEBERSPRINGEN.
  const handleSolvedDirect = () => {
    if (route('handleSolvedDirect', [])) return;
    if (!activePlayer) return;
    void haptics.celebrate();
    const bonus = solveBonus(activePlayer.questionsAsked, maxQ);
    setPlayers(prev => prev.map((p, i) => i === activeIdx ? { ...p, guessedCorrectly: true, score: p.score + bonus } : p));
    setGuessCorrect(true); setPhase('guessResult');
  };

  const handleSkipDirect = () => {
    if (route('handleSkipDirect', [])) return;
    if (!activePlayer) return;
    void haptics.warning();
    // Give up this character — count as eliminated, advance to next.
    setPlayers(prev => prev.map((p, i) => i === activeIdx ? { ...p, eliminated: true, questionsAsked: maxQ } : p));
    setGuessCorrect(false); setPhase('guessResult');
  };

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const best = [...players].sort((a, b) => b.score - a.score)[0];
      const me = online ? players.find(p => p.id === online.myPlayerId) : best;
      recordEnd('wer-bin-ich', me?.score ?? 0, !!me && me.score === Math.max(...players.map(p => p.score)));
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preserve players and settings; reset scores and assign fresh characters.
  const playAgain = () => {
    if (route('playAgain', [])) return;
    const pool = drawPool(mode);
    if (!pool) { setContentError(true); return; }
    setPlayers(prev => prev.map((p, i) => ({ ...p, score: 0, character: pool[i % pool.length].name, questionsAsked: 0, guessedCorrectly: false, eliminated: false })));
    setCurrentRound(1); setRevealIdx(0); setActiveIdx(0); setCharacterRevealed(false);
    setCurrentQuestion(''); setVoteResults({}); setVoterIdx(0); setGuessAttempt(''); setGuessCorrect(null);
    gameRecordedRef.current = false;
    setPhase('assign');
  };

  useWhoAmISync(online, { phase, phaseStartsAt, currentRound, totalRounds, activeIdx, players, mode, maxQ, revealIdx, currentQuestion, voteResults, voterIdx, guessCorrect }, localSeatIds, data => {
    setPhase(data.phase); setCurrentRound(data.currentRound); setTotalRounds(data.totalRounds); setActiveIdx(data.activeIdx);
    setPlayers(data.players); setMode(data.mode); setMaxQ(data.maxQ); setRevealIdx(data.revealIdx);
    setCurrentQuestion(data.currentQuestion); setVoteResults(data.voteResults); setVoterIdx(data.voterIdx);
    setGuessCorrect(data.guessCorrect); receivePhaseStart(data.phaseStartsAt);
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const exitDialog = <ConfirmExitDialog {...exitGuard.dialogProps} accent="#ef987e" />;
  if (phase === 'setup' && online && !online.isHost) return <OnlineWaiting />;
  // Waehrend das Handy weitergegeben wird, ist NUR der deckende Weitergabe-Bildschirm im DOM.
  if (handover.overlay) return <>{handover.overlay}{exitDialog}</>;
  if (view === 'setup') return <SetupScreen online={online} contentError={contentError} onStart={handleStart} />;

  const modeLabel = t(`gameModes.whoami.${mode}.name`);
  if (online && view === 'assign') {
    const holderPlayer = players.find(p => p.id === holder);
    return <div data-phase="assign" className="flex min-h-[100dvh] flex-col">
      {blocker}
      <OnlineAssign holder={holderPlayer} shown={visibleCharacters(players, viewCtx)} isHost={online.isHost} hasGuests={hasGuests}
        holderIsGuest={!!handover.activeGuest} holderPending={!!holder && pendingViewers.includes(holder)}
        allSeen={pendingViewers.length === 0} notSeen={notSeenNames(pendingViewers, players)}
        onSeen={() => holder && setAssignSeen(prev => prev.includes(holder) ? prev : [...prev, holder])}
        onStart={nextReveal} footer={<ExitLink onExit={exitGuard.request} />} />
      {exitDialog}
    </div>;
  }

  const voter = answerVoter(players, activeIdx, voterIdx);
  const renderPhase = () => {
    if (view === 'assign') return <LocalAssign key="assign" player={players[revealIdx]} revealed={characterRevealed} isLast={revealIdx + 1 >= players.length} onReveal={() => setCharacterRevealed(true)} onNext={nextReveal} />;
    if (view === 'gameOver') return <GameOverPanel key="over" players={players} achievements={newAchievements} onDismissAchievements={clearAchievements}
      canAgain={!online || online.isHost} onAgain={playAgain} onOtherGame={() => navigate('/games')} />;
    if (!activePlayer) return null;
    if (view === 'asking') return <AskingPanel key="asking" online={!!online} active={activePlayer} view={characterView(activePlayer, viewCtx)} canAct={canAct(activePlayer.id)}
      round={currentRound} totalRounds={totalRounds} modeLabel={modeLabel} maxQ={maxQ} hasVotes={Object.keys(voteResults).length > 0} voteSummary={voteSummary}
      question={currentQuestion} onQuestion={setCurrentQuestion} onSubmit={() => submitQuestion()} onGuess={skipToGuess} onSkip={handleSkipDirect} onSolved={handleSolvedDirect} />;
    if (view === 'answerVote' && voter) return <AnswerVotePanel key="answerVote" online={!!online} asker={activePlayer} voter={voter} voterCount={players.length - 1} voterIdx={voterIdx}
      question={currentQuestion} askerView={characterView(activePlayer, viewCtx)} canVote={canAct(voter.id)} onAnswer={castAnswer} />;
    if (view === 'guessing') return <GuessingPanel key="guessing" online={!!online} active={activePlayer} canAct={canAct(activePlayer.id)} guess={guessAttempt} onGuessText={setGuessAttempt} onGuess={() => tryGuess()} />;
    if (view === 'guessResult') return <GuessResultPanel key="guessResult" active={activePlayer} correct={!!guessCorrect} view={characterView(activePlayer, viewCtx)}
      revealed={identityMayBeRevealed(phase, activePlayer, maxQ)} modeLabel={modeLabel} maxQ={maxQ} canNext={!online || online.isHost} onNext={afterGuess} />;
    return null;
  };

  return (
    <div data-phase={view} className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col font-game">
      <style>{EP_STYLE}</style>{blocker}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#ef987e]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#e4cec0]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#44484f]/20">
        {/* In der App liegt der FloatingBackButton auf diesem Pfeil und tut ueber den
            Back-Guard dasselbe — dort nur unsichtbar: der Platzhalter haelt die Kopfzeile. */}
        <button onClick={() => (view === 'gameOver' ? navigate('/games') : exitGuard.request())}
          className={`p-2 text-[#a8abb3] hover:text-white${hasShellBackButton() ? ' invisible pointer-events-none' : ''}`}
          aria-hidden={hasShellBackButton()} tabIndex={hasShellBackButton() ? -1 : undefined}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-[0.8125rem] font-semibold text-white/60">{t('games.whoami.round', { round: currentRound, total: totalRounds })}</div>
        <div className="px-3 py-1 rounded-full bg-[#1b2028] border border-[#44484f]/20 text-xs font-bold text-[#ef987e]">{modeLabel}</div>
      </div>
      <AnimatePresence mode="wait">{renderPhase()}</AnimatePresence>
      {exitDialog}
    </div>
  );
}

/** Setup mit Spielerleiste. Die Grenzen stehen hier am PlayerSetup (Registry-Test). */
function SetupScreen({ online, contentError, onStart }: { online?: OnlineGameProps; contentError: boolean; onStart: (players: SetupSeat[], mode: string, settings: Settings) => void }) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const roster = useSetupRoster(online?.players, t, MIN, MAX);
  const { isOnline, players } = roster;
  const canStart = !contentError && players.length >= MIN && players.every(p => p.name.trim().length > 0);
  return (
    <WhoAmISetup canStart={canStart} contentError={contentError} haptics={haptics} t={t} onStart={(mode, settings) => onStart(players, mode, settings)}
      strip={<PlayerSetup
        players={players.map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, readOnly: isOnline }))}
        onAdd={roster.add} onRemove={roster.remove} onRename={roster.rename}
        onImportNames={isOnline ? undefined : roster.importNames}
        min={isOnline ? players.length : MIN}
        max={isOnline ? players.length : MAX}
        accent="#ef987e" label={t('games.whoami.setup.playerLabel')} maxNameLength={14} />} />
  );
}

export default function WhoAmIGame({ online }: { online?: OnlineGameProps } = {}) {
  return <GameStage gameId="wer-bin-ich" className="identity-game"><WhoAmIGameContent online={online} /></GameStage>;
}
