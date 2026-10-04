import { useSyncExternalStore } from 'react';
import { UNDO_WINDOW_MS } from '@/lib/party-motion';

/**
 * kick-queue.ts — "Rückgängig" for removing a player (masterplan 6.6, T19).
 *
 * A kick cannot be reverted on the server (an archived seat stays archived),
 * so undo means: the request is only sent after the grace period. Until then
 * the Host can cancel it. One pending kick at a time; scheduling a second one
 * sends the first immediately so nothing is silently dropped.
 */
export const KICK_UNDO_MS = UNDO_WINDOW_MS;

export interface PendingKick { id: string; label: string; sendsAt: number }
interface Entry extends PendingKick { run: () => Promise<unknown> | void; timer: ReturnType<typeof setTimeout> }

let pending: Entry | null = null;
let snapshot: PendingKick | null = null;
const listeners = new Set<() => void>();
const emit = () => {
  snapshot = pending ? { id: pending.id, label: pending.label, sendsAt: pending.sendsAt } : null;
  listeners.forEach(fn => fn());
};

function send(entry: Entry) {
  if (pending === entry) pending = null;
  clearTimeout(entry.timer);
  emit();
  try { void Promise.resolve(entry.run()).catch(() => { /* the session store shows the error */ }); } catch { /* same */ }
}

export function scheduleKick(id: string, label: string, run: () => Promise<unknown> | void, delayMs = KICK_UNDO_MS): void {
  if (pending) send(pending);
  const entry: Entry = { id, label, run, sendsAt: Date.now() + delayMs, timer: setTimeout(() => send(entry), delayMs) };
  pending = entry;
  emit();
}

/** Undo: the request was never sent. */
export function cancelKick(): boolean {
  if (!pending) return false;
  clearTimeout(pending.timer);
  pending = null;
  emit();
  return true;
}

/** Send now (e.g. the snackbar is dismissed or the app goes to the background). */
export function flushKick(): void { if (pending) send(pending); }

export const getPendingKick = () => snapshot;
export const subscribeKick = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function usePendingKick() { return useSyncExternalStore(subscribeKick, getPendingKick, () => null); }
