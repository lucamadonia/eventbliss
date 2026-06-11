// CORS helpers with an origin allowlist.
//
// Instead of reflecting "*" we only echo back origins we trust:
//  - production web (event-bliss.com + www)
//  - Capacitor native shells (capacitor://localhost, https://localhost)
//  - local development servers (vite :5173, :8080)
//  - Vercel preview deployments (https://*.vercel.app)
//
// Unknown / missing origins (e.g. server-to-server webhooks from Stripe)
// fall back to the canonical production origin — browsers from other
// origins will then fail the CORS check, which is the intended behaviour.

const FALLBACK_ORIGIN = "https://event-bliss.com";

const ALLOWED_ORIGINS = new Set<string>([
  "https://event-bliss.com",
  "https://www.event-bliss.com",
  // Capacitor native WebViews (iOS uses capacitor://localhost, Android https://localhost)
  "capacitor://localhost",
  "https://localhost",
  // Local development
  "http://localhost:5173",
  "http://localhost:8080",
]);

function resolveAllowedOrigin(origin: string | null): string {
  if (!origin) return FALLBACK_ORIGIN;
  if (ALLOWED_ORIGINS.has(origin)) return origin;

  // Vercel preview deployments: https://<deployment>.vercel.app
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && url.hostname.endsWith(".vercel.app")) {
      return origin;
    }
  } catch {
    // Malformed Origin header → fall through to fallback
  }

  return FALLBACK_ORIGIN;
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(origin),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function getCorsHeadersWithStripe(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(origin),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}
