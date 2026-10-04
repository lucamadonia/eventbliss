/**
 * Manche Bruecken fallen ohne Emoji auf die Initiale zurueck („T“). Die waere
 * in TVPlayerAvatar ein Buchstabenkreis — dann lieber undefined, damit das
 * Symbol aus der Teilnehmerliste (TVRosterContext) kommt.
 */
export const emojiOnly = (a?: unknown): string | undefined =>
  (typeof a === 'string' && a.trim() && !/^[\p{L}\p{N}]{1,2}$/u.test(a.trim()) ? a : undefined);
