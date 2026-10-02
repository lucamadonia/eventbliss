import type { KeyboardEvent } from 'react';

/**
 * Arrow-key navigation for a role="radiogroup" with roving tabindex: only the
 * checked option is tabbable, arrows move and select (WAI-ARIA radio pattern).
 * Left/Right follow the reading direction, so RTL feels natural.
 */
export function radioKeyDown<T>(event: KeyboardEvent<HTMLElement>, values: readonly T[], current: T, select: (value: T) => void): void {
  const rtl = typeof document !== 'undefined' && document.dir === 'rtl';
  const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, Home: 0, End: 0 }[event.key];
  if (step === undefined) return;
  event.preventDefault();
  const index = values.indexOf(current);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? values.length - 1 : (index + step + values.length) % values.length;
  select(values[next]);
  const group = event.currentTarget.closest('[role="radiogroup"]');
  requestAnimationFrame(() => (group?.querySelectorAll<HTMLElement>('[role="radio"]')[next])?.focus());
}

/** Roving tabindex for one option. */
export const radioTabIndex = (checked: boolean) => (checked ? 0 : -1);
