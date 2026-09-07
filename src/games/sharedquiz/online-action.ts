/** Validate intent before applying any authoritative game mutation. */
export function acceptOnlineAction(data: Record<string, unknown>, token: string,
  members: readonly string[], seen: Map<string, number>, allow: (sender: string) => boolean): boolean {
  const sender = data.__senderId;
  if (typeof sender !== 'string' || !members.includes(sender) || data.token !== token ||
      typeof data.instance !== 'string' || data.instance.length > 64 ||
      !Number.isSafeInteger(data.seq) || Number(data.seq) < 1 || !allow(sender)) return false;
  const key = `${sender}:${data.instance}`;
  if (Number(data.seq) <= (seen.get(key) ?? 0)) return false;
  seen.set(key, Number(data.seq));
  return true;
}
