// Resolve a safe origin for Stripe redirect URLs (success_url, cancel_url,
// return_url). Requests from the native Capacitor WebView arrive with
// `Origin: capacitor://localhost` (or `ionic://`, or `http://localhost`
// on Android) — SFSafariViewController / Custom Tabs can't resolve those
// schemes, so Stripe's redirect lands on an "Adresse ungültig" error.
//
// This helper normalises any non-http(s) or localhost origin to the
// canonical production domain. event-bliss.com is a registered
// Universal Link / App Link, so the post-checkout redirect is caught
// by the native app when installed, and by the website otherwise.

const CANONICAL_ORIGIN = "https://event-bliss.com";

export function getSafeOrigin(req: Request, fallback: string = CANONICAL_ORIGIN): string {
  const raw =
    req.headers.get("origin") ||
    req.headers.get("referer")?.replace(/\/$/, "") ||
    "";

  // Must be a real http(s) origin AND not localhost (WebView / dev shells
  // often present `http://localhost` which isn't reachable from the payer
  // after Stripe redirects out-of-band).
  const isPublicHttpOrigin =
    /^https?:\/\//i.test(raw) && !/^https?:\/\/localhost/i.test(raw);

  return isPublicHttpOrigin ? raw : fallback;
}
