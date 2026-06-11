// Simple in-memory rate limiter (fixed window per IP).
//
// Note: Deno Deploy / Supabase Edge Functions run in multiple isolates, so
// this is NOT a precise global limit — each isolate keeps its own counters.
// It is still effective against brute-force from a single client (e.g.
// guessing access codes in join-event), because a burst from one IP tends to
// hit the same warm isolate. For a hard global limit a DB/KV-backed counter
// would be required.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Best-effort client IP from proxy headers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 *
 * @param scope       Logical bucket name, e.g. "join-event"
 * @param ip          Client IP (see getClientIp)
 * @param maxRequests Allowed requests per window
 * @param windowMs    Window size in ms (default: 1 minute)
 */
export function checkRateLimit(
  scope: string,
  ip: string,
  maxRequests: number,
  windowMs = 60_000,
): boolean {
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size >= MAX_BUCKETS) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  const key = `${scope}:${ip}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= maxRequests;
}

/** Standard 429 response with Retry-After. */
export function rateLimitResponse(
  corsHeaders: Record<string, string>,
  retryAfterSeconds = 60,
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
