/** Authentication may return only to a local app route, never another origin. */
export function getSafeAuthRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some(char => char.charCodeAt(0) < 32)) return '/';
  const path = value.split(/[?#]/, 1)[0];
  if (path === '/auth' || path.startsWith('/auth/')) return '/';
  return value;
}
