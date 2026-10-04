/**
 * guest-match.ts — "Bist du Max?" (masterplan B12).
 *
 * Someone creating a new seat with a name close to a free guest seat
 * ("max", "Maxi", "Max K.", "Mxa") is probably that guest. Pure, no React.
 */

/** Lowercase, without diacritics, punctuation or repeated spaces. */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const left = [...a], right = [...b];
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[right.length];
}

/** Short names tolerate fewer typos, otherwise "Ben" would match "Jan". */
function allowedDistance(a: string, b: string): number {
  const shorter = Math.min([...a].length, [...b].length);
  if (shorter >= 5) return 2;
  if (shorter >= 3) return 1;
  return 0;
}

/** 0 = same name, 1 = prefix/first name, 2+ = typo distance; null = unrelated. */
function similarity(typed: string, seat: string): number | null {
  if (!typed || !seat) return null;
  if (typed === seat) return 0;
  const shorter = typed.length < seat.length ? typed : seat;
  const longer = shorter === typed ? seat : typed;
  if ([...shorter].length >= 3 && longer.startsWith(shorter)) return 1;
  // "Gerda" ↔ "Oma Gerda", "Max K." ↔ "Max": one whole word in common.
  const seatWords = new Set(seat.split(' ').filter(word => [...word].length >= 3));
  if (typed.split(' ').some(word => seatWords.has(word))) return 1;
  const typedFirst = typed.split(' ')[0], seatFirst = seat.split(' ')[0];
  const distance = Math.min(levenshtein(typed, seat), levenshtein(typedFirst, seatFirst));
  const limit = Math.max(allowedDistance(typed, seat), allowedDistance(typedFirst, seatFirst));
  return distance <= limit ? 1 + distance : null;
}

/** Best matching guest seat for a newly typed name, or null. */
export function findSimilarGuest<T extends { name: string }>(name: string, guests: readonly T[]): T | null {
  const typed = normalizeName(name);
  let best: T | null = null, bestScore = Infinity;
  for (const guest of guests) {
    const score = similarity(typed, normalizeName(guest.name));
    if (score !== null && score < bestScore) { best = guest; bestScore = score; }
  }
  return best;
}
