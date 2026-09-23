import { describe, expect, it } from 'vitest';
import { isStroke } from '../../src/games/tv/drawing';

describe('TV drawing payload validation', () => {
  const stroke = { from: { x: 0, y: 400 }, to: { x: 200, y: 100 } };
  it('accepts finite strokes and eraser metadata without initializing a renderer', () => {
    expect(isStroke(stroke)).toBe(true);
    expect(isStroke({ ...stroke, size: 12, color: '#ffffff', tool: 'eraser' })).toBe(true);
  });
  it.each([
    null, {}, { ...stroke, from: null }, { ...stroke, to: { x: Infinity, y: 3 } },
    { ...stroke, size: 0 }, { ...stroke, size: 101 }, { ...stroke, size: NaN },
    { ...stroke, tool: 'unknown' }, { ...stroke, color: 42 },
  ])('rejects malformed stroke %j', value => expect(isStroke(value)).toBe(false));
});
