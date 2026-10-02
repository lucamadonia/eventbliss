/**
 * NAH DRAN — Spielstand auf EINEM Handy sichern und nach einem Neustart der
 * App wiederherstellen (nur lokal; online besitzt der Host die Wahrheit).
 */
import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { saveSnapshot, loadSnapshot, clearSnapshot } from '../ui/useGameSnapshot';
import { type CeResult } from './closeenough-scoring';
import type { CeCategory, CeQuestion } from './closeenough-content';
import type { ModeId, Phase, Player } from './ce-theme';

type SetS<T> = Dispatch<SetStateAction<T>>;

export function useCeOfflineSave({ isOnline, phase, players, round, totalRounds, question, mode, categories, deck, guesses, results,
  setPhase, setPlayers, setRound, setTotalRounds, setQuestion, setMode, setCategories, setDeck, setGuesses, setResults, setEntryIndex }: {
  isOnline: boolean; phase: Phase; players: Player[]; round: number; totalRounds: number; question: CeQuestion | null; mode: ModeId;
  categories: CeCategory[]; deck: CeQuestion[]; guesses: Record<string, number | null>; results: CeResult[] | null;
  setPhase: SetS<Phase>; setPlayers: SetS<Player[]>; setRound: SetS<number>; setTotalRounds: SetS<number>; setQuestion: SetS<CeQuestion | null>;
  setMode: SetS<ModeId>; setCategories: SetS<CeCategory[]>; setDeck: SetS<CeQuestion[]>; setGuesses: SetS<Record<string, number | null>>;
  setResults: SetS<CeResult[] | null>; setEntryIndex: SetS<number>;
}) {
  const restoredRef = useRef(false);
  useEffect(() => {
    if (isOnline || restoredRef.current) return;
    restoredRef.current = true;
    const s = loadSnapshot<Record<string, unknown>>('closeenough');
    if (s && s.phase && s.phase !== 'setup' && s.phase !== 'gameOver') {
      setPlayers(s.players as Player[]);
      setRound(s.round as number);
      setTotalRounds(s.totalRounds as number);
      setQuestion(s.question as CeQuestion | null);
      setMode(s.mode as ModeId);
      setCategories(s.categories as CeCategory[]);
      setDeck(s.deck as CeQuestion[]);

      const savedResults = (s.results as CeResult[] | null) ?? null;
      const savedGuesses = (s.guesses as Record<string, number | null>) ?? {};

      /*
       * Die Auflösung braucht die Wertung — ohne sie rendert der ganze Zweig
       * nichts und der Spieler steht vor einer leeren Fläche OHNE Weiter-Knopf.
       * Das ist eine Sackgasse: Nur „Verlassen" käme noch heraus, und die
       * ganze Partie wäre weg. Fehlt die Wertung im Spielstand, wird die Runde
       * deshalb neu getippt statt eine halbe Auflösung zu zeigen.
       */
      if (s.phase === 'reveal' && savedResults?.length) {
        setGuesses(savedGuesses);
        setResults(savedResults);
        setPhase('reveal');
      } else {
        setGuesses({});
        setResults(null);
        setEntryIndex(0);
        setPhase('guessing');
      }
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) return;
    if (phase === 'setup' || phase === 'gameOver') {
      clearSnapshot('closeenough');
      return;
    }
    if (!restoredRef.current) return;
    saveSnapshot('closeenough', {
      phase,
      players,
      round,
      totalRounds,
      question,
      mode,
      categories,
      deck,
      // Tipps und Wertung gehoeren mit in den Spielstand: Ohne sie laesst sich
      // eine unterbrochene Auflösung nicht wiederherstellen. Ein Mitlesen ist
      // hier kein Thema — der Spielstand liegt im localStorage des EIGENEN
      // Geraets, und offline sieht dieses Geraet die Tipps ohnehin alle.
      guesses,
      results,
    });
  }, [
    isOnline,
    phase,
    players,
    round,
    totalRounds,
    question,
    mode,
    categories,
    deck,
    guesses,
    results,
  ]);

  return restoredRef;
}
