import { it, expect } from 'vitest';
import { GEO_LOCATIONS, filterByDifficulty, filterByRegion } from './geo-locations';
it('easy and hard select different nonempty destination pools within the region', () => {
  const region = filterByRegion(GEO_LOCATIONS,'europa');
  const easy = filterByDifficulty(region,0), hard = filterByDifficulty(region,2);
  expect(easy.length).toBeGreaterThan(0);
  expect(hard.length).toBeGreaterThan(0);
  expect(easy.some(place => hard.includes(place))).toBe(false);
  expect([...easy,...hard].every(place => region.includes(place))).toBe(true);
});
