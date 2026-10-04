import { PLAYER_AVATARS } from '../party/session-schema';

/** Party emoji for a seat without one (TV shows emoji everywhere); stable per key. Initials never. */
export function avatarOrFallback(avatar: string | undefined | null, key: string | number): string {
  if (avatar && avatar.trim()) return avatar;
  const n = typeof key === 'number' ? key : [...key].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return PLAYER_AVATARS[n % PLAYER_AVATARS.length];
}
