import { describe, expect, it } from 'vitest';
import { applyPartySceneMessage, getPartyScene, parsePartySceneMessage, sceneGoAt, showPartyScene, clearPartyScene } from './party-scene';

const NOW = 1_000_000;
const scene = { sceneId: 's1', scene: 'game-start', startsAt: NOW + 600, data: { gameId: 'bomb' } };

describe('party-scene', () => {
  it('accepts a fresh scene and computes the shared moment', () => {
    const parsed = parsePartySceneMessage({ scene, serverNow: 'x' }, NOW);
    expect(parsed).toEqual({ scene });
    expect(sceneGoAt(scene as never)).toBe(NOW + 3600);
    expect(sceneGoAt({ scene: 'round-end', startsAt: NOW })).toBe(NOW);
  });

  it('rejects unknown, far-future, stale or malformed scenes', () => {
    expect(parsePartySceneMessage({ scene: { ...scene, scene: 'boom' } }, NOW)).toBeNull();
    expect(parsePartySceneMessage({ scene: { ...scene, startsAt: NOW + 60_000 } }, NOW)).toBeNull();
    expect(parsePartySceneMessage({ scene: { ...scene, startsAt: NOW - 60_000 } }, NOW)).toBeNull();
    expect(parsePartySceneMessage({ scene: { ...scene, sceneId: '' } }, NOW)).toBeNull();
    expect(parsePartySceneMessage('x', NOW)).toBeNull();
  });

  it('cancel clears only the matching scene', () => {
    showPartyScene(scene as never);
    applyPartySceneMessage({ cancel: 'other' });
    expect(getPartyScene()?.sceneId).toBe('s1');
    applyPartySceneMessage(parsePartySceneMessage({ cancel: 's1' }, NOW)!);
    expect(getPartyScene()).toBeNull();
    clearPartyScene();
  });

  it('strips unexpected data fields', () => {
    const parsed = parsePartySceneMessage({ scene: { ...scene, data: { gameId: 'bomb', evil: '<script>' } } }, NOW);
    expect(parsed && 'scene' in parsed && parsed.scene.data).toEqual({ gameId: 'bomb' });
  });
});
