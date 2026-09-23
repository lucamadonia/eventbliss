/** Durable, account- and party-scoped results; contains no private game state. */
export interface PendingControllerResult {
  match_id: string;
  game_id: string;
  scores: Record<string, number>;
  scored: boolean;
}

const key = (account: string, party: string) => `controller_results:${account}:${party}`;

export function readControllerResults(account: string, party: string): PendingControllerResult[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(account, party)) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is PendingControllerResult => {
      if (!entry || typeof entry !== 'object' || typeof entry.match_id !== 'string' || !entry.match_id ||
        typeof entry.game_id !== 'string' || !entry.game_id || typeof entry.scored !== 'boolean' ||
        !entry.scores || typeof entry.scores !== 'object' || Array.isArray(entry.scores)) return false;
      const scores = Object.values(entry.scores);
      return scores.length > 0 && scores.length <= 12 && scores.every(score => typeof score === 'number' && Number.isFinite(score));
    }).slice(0, 30);
  } catch { return []; }
}

export function writeControllerResults(account: string, party: string, results: PendingControllerResult[]): void {
  try {
    if (results.length) localStorage.setItem(key(account, party), JSON.stringify(results));
    else localStorage.removeItem(key(account, party));
  } catch { /* Private browsing or full storage: keep the in-memory retry queue. */ }
}
