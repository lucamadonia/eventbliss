import type { CueFn } from './cue-kit';

/**
 * Sammelt alle `*.cue.ts` ein. Jede Datei exportiert `cues`: Spiel-IDs (inkl.
 * Aliasse wie 'bottlespin'/'flaschendrehen') → CueFn. So kann jedes Spiel
 * seine Titelkarten bekommen, ohne eine gemeinsame Datei zu aendern.
 */
const modules = import.meta.glob<{ cues: Record<string, CueFn> }>('./*.cue.ts', { eager: true });

export const GAME_CUES: ReadonlyMap<string, CueFn> = new Map(
  Object.values(modules).flatMap((m) => Object.entries(m.cues ?? {})),
);
