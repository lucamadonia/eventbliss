/** Keep answer-bearing fields on the host until the official reveal. */
export function publicRoundItem<T extends object, K extends keyof T>(item: T | null, reveal: boolean, secretFields: readonly K[]): Omit<T, K> & Partial<Pick<T, K>> | null {
  if (!item) return null;
  const view = { ...item };
  if (!reveal) for (const field of secretFields) delete view[field];
  return view;
}
