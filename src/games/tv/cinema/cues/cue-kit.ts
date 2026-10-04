/**
 * Bausteine fuer die Szenen-Cues der Spiele (eine Datei `<spiel>.cue.ts` je
 * Spiel, automatisch eingesammelt von cues/index.ts).
 *
 * GEHEIMNIS-DISZIPLIN: Karten tragen nur oeffentliche Texte — Rundennummer,
 * Phasenname, oeffentliche Namen/Optionen. Nie Rollen, Loesungen, Begriffe,
 * Stimmen oder Zeiten einzelner Personen. Jede Cue-Datei braucht einen Test,
 * der das fuer einen Zustand MIT Geheimnissen prueft (cue-secrets.test.ts).
 */
import type { PartySound } from '@/lib/party-motion';

export interface CueText { key: string; fallback: string; params?: Record<string, string | number> }

export interface TVPhaseCue {
  /** Wechselt der Schluessel, wird der Cue (einmal) ausgespielt. */
  key: string;
  /** false = nur Ton, keine Karte (die Szene selbst ist der Moment). */
  card: boolean;
  eyebrow?: CueText;
  title?: CueText;
  subtitle?: CueText;
  accent: string;
  sound: PartySound;
}

export type CueState = Record<string, unknown>;
/** Spielzustand (oeffentlicher TV-Zustand) → Cue fuer die aktuelle Phase. */
export type CueFn = (phase: string, state: CueState) => TVPhaseCue | null;

export const ACCENT = { purple: '#df8eff', cyan: '#8ff5ff', amber: '#fbbf24', red: '#ff6b98', green: '#10b981', gold: '#FFD23F' } as const;

export const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
export const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** „Runde 3“ bzw. „Runde 3 von 8“. */
export function roundEyebrow(round: number, total?: number): CueText {
  return total && total > 0
    ? { key: 'tvCinema.roundOf', fallback: 'Runde {{round}} von {{total}}', params: { round, total } }
    : { key: 'tvCinema.round', fallback: 'Runde {{round}}', params: { round } };
}

/** Kurzform fuer eine Titelkarte. */
export function card(key: string, accent: string, sound: PartySound, title: CueText, extra: { eyebrow?: CueText; subtitle?: CueText } = {}): TVPhaseCue {
  return { key, card: true, accent, sound, title, ...extra };
}

/** Kurzform fuer einen reinen Ton-Cue (die Szene selbst ist der Moment). */
export function sound(key: string, s: PartySound, accent: string = ACCENT.purple): TVPhaseCue {
  return { key, card: false, accent, sound: s };
}
