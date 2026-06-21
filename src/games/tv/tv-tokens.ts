/**
 * Shared design tokens for TV (cast) views — one cohesive, modern broadcast
 * look across every game. Principles:
 *   - The TV is the richer shared canvas (more than the phone): solid dark
 *     surfaces, hairline top-highlight borders, large radii, generous space.
 *   - Fluid `clamp()` type scale fills both 1080p and 4K without per-view tuning.
 *   - Colour/accent ring appears only on the ACTIVE element, not everywhere.
 * Per-game views compose these so they feel like one product, not 11 designs.
 */
import type { CSSProperties } from 'react';

export const tvSurface = {
  base: '#060810', // page background (matches TVScreen root)
  panel: '#0d0915', // default card surface
  panelRaised: '#16101f', // elevated / active surface
  hairline: 'rgba(255,255,255,0.06)',
} as const;

/** Default panel: solid dark, hairline border + 1px top highlight, big radius. */
export const tvPanel =
  'rounded-[28px] border border-white/[0.06] bg-[#0d0915] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';

/** Elevated panel for the active/hero element (pair with `tvActiveRing`). */
export const tvPanelRaised =
  'rounded-[28px] border border-white/[0.08] bg-[#16101f] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]';

/** Fluid type scale — use via style={{ fontSize: tvType.hero }}. */
export const tvType = {
  micro: 'clamp(0.75rem, 0.9vw, 1.1rem)',
  label: 'clamp(0.85rem, 1.1vw, 1.4rem)',
  body: 'clamp(1rem, 1.4vw, 1.85rem)',
  title: 'clamp(1.6rem, 2.6vw, 3.4rem)',
  display: 'clamp(2.6rem, 5vw, 6rem)',
  hero: 'clamp(4rem, 10vw, 12rem)',
} as const;

/** Fluid spacing for layout gaps/padding. */
export const tvSpace = {
  gap: 'clamp(1rem, 2vw, 2.5rem)',
  pad: 'clamp(1.25rem, 2.4vw, 3rem)',
} as const;

/** A 3-zone broadcast grid (left rail · hero · right rail) that fills 16:9. */
export const tvGrid =
  'grid h-screen grid-cols-[minmax(260px,1fr)_2fr_minmax(260px,1fr)] gap-[clamp(1rem,2vw,2.5rem)] p-[clamp(1.25rem,2.4vw,3rem)]';

/** Accent ring for the single active element. Pass a player/team colour. */
export const tvActiveRing = (color: string): CSSProperties => ({
  boxShadow: `0 0 0 2px ${color}, 0 0 36px -6px ${color}`,
});

/** Parse "#rrggbb" → "r,g,b" for rgba() composition. */
export function tvRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
