import { it, expect } from 'vitest';
import { toggleSelectedCategory } from './category-selection';
it('cannot implicitly reactivate unwanted categories through an empty selection', () => {
  expect(toggleSelectedCategory(['fun'],'fun')).toEqual(['fun']);
  expect(toggleSelectedCategory(['fun','party'],'fun')).toEqual(['party']);
  expect(toggleSelectedCategory(['fun'],'party')).toEqual(['fun','party']);
});
