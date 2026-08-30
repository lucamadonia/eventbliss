/** Internal marker used to collapse one logical TV packet sent over two channels. */
export const TV_MESSAGE_ID_KEY = "__eventblissTvMessageId" as const;

export type TVWirePayload = Record<string, unknown>;

export function withTVMessageId<T extends TVWirePayload>(payload: T, id: string): T & {
  [TV_MESSAGE_ID_KEY]: string;
} {
  return { ...payload, [TV_MESSAGE_ID_KEY]: id };
}

export function getTVMessageId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const id = (payload as TVWirePayload)[TV_MESSAGE_ID_KEY];
  return typeof id === "string" && id.length > 0 ? id : null;
}

/** The transport marker must never leak into game state or drawing data. */
export function stripTVMessageId<T extends TVWirePayload>(payload: T): T {
  if (!(TV_MESSAGE_ID_KEY in payload)) return payload;
  const copy = { ...payload };
  delete copy[TV_MESSAGE_ID_KEY];
  return copy;
}

/**
 * Bounded packet gate. A sender deliberately mirrors packets across `game-room`
 * and `tv-room`; the receiver accepts the first copy and drops the mirror.
 */
export function createTVPacketGate(limit = 256): (payload: unknown) => boolean {
  const seen = new Set<string>();
  const order: string[] = [];

  return (payload: unknown) => {
    const id = getTVMessageId(payload);
    // Compatibility with older hosts and direct game broadcasts.
    if (!id) return true;
    if (seen.has(id)) return false;

    seen.add(id);
    order.push(id);
    while (order.length > Math.max(1, limit)) {
      const oldest = order.shift();
      if (oldest) seen.delete(oldest);
    }
    return true;
  };
}
