/**
 * party-scene.ts — the one scene every device of a joystick party is in.
 *
 * The Host plans a scene (`planScene`, server time + lead) and sends it at
 * once over the signed room channel as `party-scene`; the 4 s poll is only a
 * fallback. Every device (Host, phones, TV) switches at the same `startsAt`
 * instead of whenever a message happens to arrive (masterplan 4.1, T05/T11).
 *
 *   game-start  → 3-2-1-Los! overlay, then everyone routes into the game
 *   round-end   → everyone returns to the lobby/standings at the same moment
 *   finale      → party ended: confetti on every phone together with the TV podium
 */
import { useSyncExternalStore } from 'react';
import { planScene, type Scene } from './scene-schedule';
import { SCENE_LEAD_MS } from '@/lib/party-motion';

export type PartySceneName = 'game-start' | 'round-end' | 'finale';
export interface PartySceneData { gameId?: string; matchKey?: string }
export type PartyScene = Scene<PartySceneData> & { scene: PartySceneName };
/** Wire message: a scene, or the cancellation of one (start failed). */
export type PartySceneMessage = { scene: PartyScene; serverNow?: string } | { cancel: string };

/** Countdown digits after `startsAt` before "Los!" (SceneCountdown default). */
export const COUNTDOWN_DIGITS = 3;
/** A scene older than this is history, not something to show. */
const STALE_MS = 15_000;

let active: PartyScene | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

export function planPartyScene(name: PartySceneName, data: PartySceneData = {}): PartyScene {
  return planScene(name, data, { leadMs: SCENE_LEAD_MS }) as PartyScene;
}

/**
 * Party ended mid-game: the finale follows the round-end scene — it starts one
 * scene lead after the round-end moment, so every device (and the TV) celebrates together.
 */
export function chainedFinale(roundEnd: Pick<PartyScene, 'startsAt'>): PartyScene {
  return { ...planPartyScene('finale'), startsAt: sceneGoAt({ scene: 'round-end', startsAt: roundEnd.startsAt }) + SCENE_LEAD_MS };
}

/** When the scene's action happens (route): after the countdown for game-start, at start otherwise. */
export const sceneGoAt = (scene: Pick<PartyScene, 'scene' | 'startsAt'>) =>
  scene.startsAt + (scene.scene === 'game-start' ? COUNTDOWN_DIGITS * 1000 : 0);

/** Validates a scene from the wire; never trust shape or time blindly. */
export function parsePartySceneMessage(value: unknown, serverNowMs: number): PartySceneMessage | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.cancel === 'string' && raw.cancel) return { cancel: raw.cancel.slice(0, 128) };
  const scene = raw.scene as Record<string, unknown> | undefined;
  if (!scene || typeof scene !== 'object') return null;
  if (scene.scene !== 'game-start' && scene.scene !== 'round-end' && scene.scene !== 'finale') return null;
  if (typeof scene.sceneId !== 'string' || !scene.sceneId || typeof scene.startsAt !== 'number' || !Number.isFinite(scene.startsAt)) return null;
  // Far future (bad clock) or long past: ignore instead of freezing the screen.
  if (scene.startsAt > serverNowMs + 10_000 || sceneGoAt(scene as PartyScene) < serverNowMs - STALE_MS) return null;
  const data = (scene.data && typeof scene.data === 'object' ? scene.data : {}) as Record<string, unknown>;
  return {
    scene: {
      sceneId: scene.sceneId.slice(0, 128), scene: scene.scene, startsAt: scene.startsAt,
      data: {
        ...(typeof data.gameId === 'string' ? { gameId: data.gameId.slice(0, 64) } : {}),
        ...(typeof data.matchKey === 'string' ? { matchKey: data.matchKey.slice(0, 128) } : {}),
      },
    },
  };
}

export function showPartyScene(scene: PartyScene): void { active = scene; emit(); }
export function clearPartyScene(sceneId?: string): void {
  if (!active || (sceneId && active.sceneId !== sceneId)) return;
  active = null; emit();
}
export function applyPartySceneMessage(message: PartySceneMessage): void {
  if ('cancel' in message) clearPartyScene(message.cancel);
  else showPartyScene(message.scene);
}
export const getPartyScene = () => active;
export const subscribePartyScene = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function usePartyScene() { return useSyncExternalStore(subscribePartyScene, getPartyScene, () => null); }
