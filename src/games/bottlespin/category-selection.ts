/** Always keep at least one explicit category: empty must never mean all. */
export function toggleSelectedCategory<T>(selected: T[], category: T): T[] {
  return selected.includes(category) ? selected.length > 1 ? selected.filter(c => c !== category) : selected : [...selected, category];
}
