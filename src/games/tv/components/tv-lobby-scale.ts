/**
 * Ein Massstab fuer den ganzen Wartebereich: `lu(n)` ist n Hundertstel der
 * Bildschirmhoehe, aber nie breiter als ein 16:9-Bild es erlaubt. Damit sieht
 * der Wartebereich auf 1280×720 und 3840×2160 identisch aus — nur groesser.
 */
export const lu = (n: number) => `min(${n}vh, ${+(n * 0.5625).toFixed(3)}vw)`;

export const LOBBY_ACCENTS = { purple: '#df8eff', cyan: '#8ff5ff', pink: '#ff6b98', muted: '#a8abb3' } as const;
