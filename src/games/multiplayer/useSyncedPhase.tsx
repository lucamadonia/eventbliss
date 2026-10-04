import { useMemo, useState, type ReactNode } from 'react';
import { planPhaseStart } from '../party/phase-gate';
import { usePhaseGate } from '../party/usePhaseGate';
import { serverClock } from '../party/scene-clock';
import type { OnlineGameProps } from './OnlineGameTypes';

/**
 * All devices switch phase at the same moment (design §9 beat): the host plans
 * the start of every phase change (`key`), phones take the host's value from
 * the state snapshot (`receive`). Render with `view` instead of `phase`; game
 * logic stays on `phase`. `blocker` swallows taps until input opens (below the
 * handover overlay). Local play: no gate, nothing changes.
 */
export function useSyncedPhase<P>(online: OnlineGameProps | undefined, phase: P, key: readonly unknown[]):
  { phaseStartsAt: number; view: P; blocker: ReactNode; receive: (startsAt: unknown) => void } {
  const [remote, setRemote] = useState<number | null>(null);
  const planned = useMemo(() => (online ? planPhaseStart() : serverClock.now()), key); // eslint-disable-line react-hooks/exhaustive-deps
  const phaseStartsAt = online && !online.isHost && remote !== null ? remote : planned;
  const gate = usePhaseGate(phase, online ? phaseStartsAt : null);
  return {
    phaseStartsAt,
    view: gate.shown,
    blocker: gate.inputOpen ? null : <div data-testid="phase-input-gate" aria-hidden className="fixed inset-0 z-[80]" />,
    receive: startsAt => setRemote(typeof startsAt === 'number' && Number.isFinite(startsAt) ? startsAt : null),
  };
}
