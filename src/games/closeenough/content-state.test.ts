import { beforeEach, describe, expect, it, vi } from 'vitest';

const result: { value: unknown; throws: boolean } = { value: { data: [], error: null }, throws: false };

function builder() {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'overlaps', 'in']) b[m] = () => b;
  b.range = async () => { if (result.throws) throw new Error('offline'); return result.value; };
  return b;
}

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => builder() } }));

import { ceContentState, loadQuestionPool } from './closeenough-content';

const row = { id: 'q1', name_i18n: {}, question_i18n: { de: 'Wie viele?' }, frame_key: 'custom', answer: '12', unit_key: 'count',
  category: 'alltag', tolerance_pct: 10, as_of_year: null, difficulty: 1, source_label: 'x', source_url: 'u' };

describe('closeenough question loading', () => {
  beforeEach(() => { result.value = { data: [], error: null }; result.throws = false; });

  it('reports a query error instead of a silent empty pool', async () => {
    result.value = { data: null, error: { message: 'boom' } };
    expect(await loadQuestionPool('de')).toEqual({ questions: [], failed: true });
  });

  it('reports a thrown network error', async () => {
    result.throws = true;
    expect((await loadQuestionPool('de')).failed).toBe(true);
  });

  it('loads valid rows without failure', async () => {
    result.value = { data: [row], error: null };
    const pool = await loadQuestionPool('de');
    expect(pool.failed).toBe(false);
    expect(pool.questions).toHaveLength(1);
    expect(pool.questions[0].answer).toBe(12);
  });
});

describe('ceContentState', () => {
  const base = { contentReady: true, failed: false, poolSize: 10, available: 10 };
  it('shows loading until the pool arrived', () => expect(ceContentState({ ...base, contentReady: false })).toBe('loading'));
  it('offers retry when loading failed and nothing came back', () => expect(ceContentState({ ...base, failed: true, poolSize: 0, available: 0 })).toBe('error'));
  it('keeps playing with a partial pool', () => expect(ceContentState({ ...base, failed: true })).toBe('ready'));
  it('says the database is empty', () => expect(ceContentState({ ...base, poolSize: 0, available: 0 })).toBe('empty'));
  it('says the selection is empty', () => expect(ceContentState({ ...base, available: 0 })).toBe('emptySelection'));
  it('is ready otherwise', () => expect(ceContentState(base)).toBe('ready'));
});
