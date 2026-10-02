import { TV_HANDOVER_MAX_ID_LENGTH, TV_HANDOVER_MAX_IDS, type TvHandover, type TvHandoverProgress } from '@/games/ui/guest-handover';

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const PHASES = new Set<TvHandoverProgress['phase']>(['passing', 'viewing', 'covered']);

const record = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const color = (v: unknown) => (typeof v === 'string' && HEX.test(v) ? v : '#df8eff');
const validId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= TV_HANDOVER_MAX_ID_LENGTH;
const ids = (v: unknown) => (Array.isArray(v) ? v.filter(validId).slice(0, TV_HANDOVER_MAX_IDS) : []);

function parseProgress(v: unknown): TvHandoverProgress | undefined {
  const raw = record(v);
  if (!raw || !validId(raw.currentId) || !PHASES.has(raw.phase as TvHandoverProgress['phase'])) return undefined;
  const currentId = raw.currentId;
  // Doppelte und die aktuelle Person raus — die Punktreihe hat keine Luecken und keine Dopplungen.
  const done = [...new Set(ids(raw.doneIds))].filter((id) => id !== currentId);
  const queue = [...new Set(ids(raw.queueIds))].filter((id) => id !== currentId && !done.includes(id));
  return { doneIds: done, currentId, queueIds: queue, phase: raw.phase as TvHandoverProgress['phase'] };
}

/** Prueft `handover` aus dem Spielzustand — oeffentliche Daten, aber trotzdem Leitung. */
export function parseTvHandover(value: unknown): TvHandover | null {
  const raw = record(value);
  if (!raw || !validId(raw.playerId)) return null;
  const name = text(raw.name, 40);
  if (!name) return null;
  const progress = parseProgress(raw.progress);
  const nextRaw = record(raw.next);
  const nextName = nextRaw ? text(nextRaw.name, 40) : '';
  return {
    playerId: raw.playerId,
    name,
    avatar: text(raw.avatar, 16),
    color: color(raw.color),
    ...(progress ? { progress } : {}),
    ...(nextRaw && nextName ? { next: { name: nextName, avatar: text(nextRaw.avatar, 16), color: color(nextRaw.color) } } : {}),
  };
}

/** Reihenfolge der Punktreihe: fertig → jetzt → offen. */
export function handoverDots(p: TvHandoverProgress): { id: string; state: 'done' | 'current' | 'queued' }[] {
  if (p.phase === 'covered') {
    return [...p.doneIds, p.currentId].map((id) => ({ id, state: 'done' as const }));
  }
  return [
    ...p.doneIds.map((id) => ({ id, state: 'done' as const })),
    { id: p.currentId, state: 'current' as const },
    ...p.queueIds.map((id) => ({ id, state: 'queued' as const })),
  ];
}

/** Mindest-Anzeigedauer pro Person — die Blickdauer darf nichts verraten (Design §9.3). */
export const HANDOVER_MIN_VIEW_MS = 1500;
