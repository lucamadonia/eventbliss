import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { publicGeoPrompt, publicPanoramaDeck, createVisualDifference, createVisualScene, OBJECT_ATLAS, OBJECT_IDS, parseObjectGrid, projectVisualState } from './visual-content';

function random(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

describe('FindIt photographed object content', () => {
  it('ships a real square photo atlas with sixteen recognized object identities', () => {
    const path = `public${OBJECT_ATLAS}`;
    expect(existsSync(path)).toBe(true);
    const png = readFileSync(path);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(1024);
    expect(png.readUInt32BE(16)).toBe(png.readUInt32BE(20));
    expect(new Set(OBJECT_IDS).size).toBe(16);
  });

  it('derives every answer from the actual displayed cards across 300 layouts', () => {
    const layouts = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const scene = createVisualScene(random(seed));
      layouts.add(scene.grid);
      const cards = parseObjectGrid(scene.grid).flat();
      expect(cards).toHaveLength(9);
      expect(new Set(cards).size).toBe(9);
      for (const q of scene.questions) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        q.options.forEach(id => expect(OBJECT_IDS).toContain(id));
        const truth = q.options.map(id => q.q.endsWith('whichPosition')
          ? cards[q.position! - 1] === id
          : q.q.endsWith('whichMissing') ? !cards.includes(id) : cards.includes(id));
        expect(truth.filter(Boolean)).toHaveLength(1);
        expect(truth[q.correct]).toBe(true);
      }
    }
    expect(layouts.size).toBeGreaterThan(290);
  });

  it('changes exactly three unique cards, without invisible or ambiguous replacements', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const scene = createVisualDifference(random(seed));
      const a = parseObjectGrid(scene.gridA).flat(), b = parseObjectGrid(scene.gridB).flat();
      expect(a).toHaveLength(6);
      expect(b).toHaveLength(6);
      expect(new Set(a).size).toBe(6);
      expect(new Set(b).size).toBe(6);
      expect(a.flatMap((id, index) => id !== b[index] ? [index] : [])).toEqual(scene.diffs);
      expect(scene.diffs).toHaveLength(scene.count);
      expect(scene.count).toBe(3);
      scene.diffs.forEach(index => expect(a).not.toContain(b[index]));
    }
  });

  it('redacts solutions and hides the memory board until the whole turn ends', () => {
    const currentScene = createVisualScene(random(9));
    const currentDiff = createVisualDifference(random(5));
    const state = { mode: 'memory', phase: 'question', questionIdx: 1, currentScene, currentDiff };
    const question = projectVisualState(state);
    expect(question.currentScene.grid).toBe('');
    expect(question.currentScene.questions.every(q => q.correct === -1)).toBe(true);
    expect(question.currentDiff.diffs).toEqual([]);
    expect(question.currentDiff.count).toBe(3);
    const answer = projectVisualState({ ...state, phase: 'answer' });
    expect(answer.currentScene.grid).toBe('');
    expect(answer.currentScene.questions[1].correct).toBe(currentScene.questions[1].correct);
    expect(answer.currentScene.questions[2].correct).toBe(-1);
    expect(answer.currentDiff.diffs).toEqual(currentDiff.diffs);
    expect(projectVisualState({ ...state, phase: 'study' }).currentScene.grid).toBe(currentScene.grid);
    expect(projectVisualState({ ...state, mode: 'speed' }).currentScene.grid).toBe(currentScene.grid);
    expect(projectVisualState({ ...state, phase: 'roundEnd' }).currentScene.grid).toBe(currentScene.grid);
    expect(currentScene.questions.every(q => q.correct >= 0)).toBe(true);
    expect(JSON.parse(JSON.stringify(question))).toEqual(question);
  });
});

it('keeps geographic answers and future panorama scenes out of live room payloads', () => {
  const target = { name: 'London', lat: 51.5, lng: -0.1, type: 'city' };
  expect(publicGeoPrompt(target)).toEqual({ ...target, lat: 0, lng: 0 });
  expect(target.lat).toBe(51.5);
  const locations = [
    {lat: 1, lng: 2, city: 'One', country: 'Country', hint: 'Secret'},
    {lat: 3, lng: 4, city: 'Two', country: 'Other'},
  ];
  const live = JSON.parse(JSON.stringify(publicPanoramaDeck(locations, 0)));
  expect(live).toEqual([{lat: 1, lng: 2, city: '', country: ''}, null]);
  expect(locations[0].hint).toBe('Secret');
});
