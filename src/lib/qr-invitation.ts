import { deepLinkTarget } from './deep-links';

export type ScannedInvitation = { kind: 'route'; path: string } | { kind: 'code'; code: string } | null;

/** Only EventBliss app links and six-character room codes may navigate the app. */
export function scannedInvitation(value: string): ScannedInvitation {
  const text = value.trim();
  if (!text || text.length > 1024) return null;
  const route = deepLinkTarget(text);
  if (route) return { kind: 'route', path: route };
  const code = text.toUpperCase();
  return /^[A-HJ-NP-Z2-9]{6}$/.test(code) ? { kind: 'code', code } : null;
}
