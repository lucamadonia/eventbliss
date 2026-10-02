/**
 * NAH DRAN online: Host sendet Uhr und Spielstand, Handys spiegeln ihn.
 *
 * Die Tipps und die Wertung wandern erst AB `reveal` in den Datenstrom —
 * vorher stünden sie im Snapshot und jeder Mitspieler (oder der nächste
 * 🔁-Gast) könnte abschreiben. Solange getippt wird, geht nur raus, WER schon
 * abgegeben hat. `phaseStartsAt` reist mit, damit alle zur selben Zeit wechseln.
 */
import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { publicRoundItem } from '../multiplayer/public-round-item';
import type { useGameTimer } from '../engine/TimerSystem';
import { type CeResult } from './closeenough-scoring';
import type { CeCategory, CeQuestion } from './closeenough-content';
import type { ModeId, Phase, Player } from './ce-theme';

type SetS<T> = Dispatch<SetStateAction<T>>;
type Timer = ReturnType<typeof useGameTimer>;

export interface CeSnapshot {
  phase: Phase; phaseStartsAt: number; players: Player[]; round: number; roundToken: string; totalRounds: number;
  question: CeQuestion | null; mode: ModeId; categories: CeCategory[]; submittedIds: string[];
  guesses: Record<string, number | null>; results: CeResult[] | null;
}

export interface CeReceivers {
  setPhase: SetS<Phase>; setPlayers: SetS<Player[]>; setRound: SetS<number>; setRoundToken: SetS<string>; setTotalRounds: SetS<number>;
  setQuestion: SetS<CeQuestion | null>; setMode: SetS<ModeId>; setCategories: SetS<CeCategory[]>;
  setGuesses: SetS<Record<string, number | null>>; setResults: SetS<CeResult[] | null>; setRemoteSubmitted: SetS<string[]>;
  receivePhaseStart: (startsAt: unknown) => void;
}

/** Was öffentlich rausgehen darf: Antwort und Tipps erst ab der Auflösung. */
export function publicCeSnapshot(s: CeSnapshot): CeSnapshot {
  const revealed = s.phase === 'reveal';
  return {
    ...s,
    question: publicRoundItem(s.question, revealed || s.phase === 'gameOver', ['answer', 'tolerancePct', 'sourceUrl', 'sourceLabel']) as CeQuestion | null,
    guesses: revealed ? s.guesses : {},
    results: revealed ? s.results : null,
  };
}

export function useCeOnlineSync({ online, isHost, timer, timerRef, snapshot, receive }: {
  online: OnlineGameProps | undefined; isHost: boolean; timer: Timer; timerRef: MutableRefObject<Timer | null>;
  snapshot: CeSnapshot; receive: CeReceivers;
}) {
  // The shared clock also restores the correct remaining time after reconnect.
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('closeenough-timer-state', { timeLeft: timer.timeLeft, running: timer.isRunning });
  }, [online, timer.timeLeft, timer.isRunning]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('closeenough-timer-state', data => {
      if (typeof data.timeLeft !== 'number') return;
      timerRef.current?.reset(data.timeLeft);
      if (data.running) timerRef.current?.start();
    });
  }, [online, timerRef]);

  // Host → Snapshot. Ohne timeLeft, sonst wären es 60 Nachrichten pro Runde.
  const serialized = JSON.stringify(publicCeSnapshot(snapshot));
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('closeenough-state', { snapshot: JSON.parse(serialized) });
  }, [online, isHost, serialized]);

  const receivers = useRef(receive);
  receivers.current = receive;
  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast('closeenough-state', (d) => {
      const s = (d as { snapshot?: Record<string, unknown> }).snapshot;
      if (!s) return;
      const r = receivers.current;
      r.setPhase(s.phase as Phase);
      r.setPlayers(s.players as Player[]);
      r.setRound(s.round as number);
      r.setRoundToken(s.roundToken as string);
      r.setTotalRounds(s.totalRounds as number);
      r.setQuestion(s.question as CeQuestion | null);
      r.setMode(s.mode as ModeId);
      r.setCategories(s.categories as CeCategory[]);
      r.setGuesses((s.guesses as Record<string, number | null>) ?? {});
      r.setResults((s.results as CeResult[] | null) ?? null);
      r.setRemoteSubmitted((s.submittedIds as string[]) ?? []);
      r.receivePhaseStart(s.phaseStartsAt);
    });
  }, [online, isHost]);
}
