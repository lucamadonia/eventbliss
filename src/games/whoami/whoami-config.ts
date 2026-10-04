import { getWhoAmIPool, type WhoAmICategoryKey } from './whoami-content';

export const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];
export const MAX_QUESTIONS = 20;

// Internal sentinel key for the first default player; NOT shown to users directly
export const DEFAULT_PLAYER_SENTINEL = 'Du';

/**
 * Die im Setup waehlbare Kennung. Frueher stand hier eine Tabelle auf die
 * DEUTSCHEN Kategorie-Beschriftungen — und weil die Inhaltspakete diese
 * Beschriftung mituebersetzen ("Celebrities", "Ünlüler"), traf der Filter in
 * neun von zehn Sprachen nichts. Der Pool war leer, `pool[i % 0]` wurde zu
 * `pool[NaN]`, und der Zugriff auf `.name` liess das Spiel beim Start
 * abstuerzen. Die Kennungen sind jetzt sprachunabhaengig; die Uebersetzung
 * findet nur noch in der Anzeige statt.
 */
const SETUP_ID_TO_KEY: Record<string, WhoAmICategoryKey> = {
  prominente: 'prominente',
  tiere: 'tiere',
  berufe: 'berufe',
  filme: 'filme',
};

/**
 * Figuren fuer eine Runde ziehen. Gibt `null`, wenn keine da sind — dann darf
 * NICHT gestartet werden. Ein leerer Pool hat frueher einen Absturz erzeugt,
 * der wie ein toter Knopf aussah; lieber eine ehrliche Meldung.
 */
export function drawPool(setupId: string) {
  const pool = shuffle(getWhoAmIPool(SETUP_ID_TO_KEY[setupId] ?? 'prominente'));
  return pool.length > 0 ? pool : null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const EP_STYLE = `
.neon-glow { text-shadow: 0 0 20px rgba(150,160,165,0.6), 0 0 40px rgba(150,160,165,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
`;
