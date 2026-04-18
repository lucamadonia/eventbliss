// Unified Stripe Checkout launcher.
//
// Web: plain `window.location.href` full-page redirect — Stripe handles
// success/cancel via URL and lands us back on event-bliss.com.
//
// Native (Capacitor): open Stripe Checkout inside an in-app browser
// (SFSafariViewController on iOS, Custom Tabs on Android) so the user
// never leaves the app chrome. When the user closes the in-app browser
// we navigate *within the app* to `onFinishPath` so they see the
// BookingSuccess screen natively. BookingSuccess re-verifies payment
// against Stripe via the `marketplace-verify-payment` edge function, so
// even if the user closes the sheet prematurely the final status is
// resolved correctly.

import { Browser } from "@capacitor/browser";
import { isNative } from "@/lib/platform";

export interface OpenCheckoutOptions {
  url: string;
  /** In-app router path to navigate to after the sheet closes. */
  onFinishPath?: string;
  /** Optional callback fired as soon as the sheet closes (before navigate). */
  onClose?: () => void;
}

export async function openCheckout(opts: OpenCheckoutOptions | string): Promise<void> {
  const options: OpenCheckoutOptions =
    typeof opts === "string" ? { url: opts } : opts;

  if (!isNative()) {
    window.location.href = options.url;
    return;
  }

  // Native path — SFSafariVC / Custom Tabs. Hook the finish event before
  // opening so we don't race with fast dismissals.
  const sub = await Browser.addListener("browserFinished", () => {
    sub.remove();
    options.onClose?.();
    if (options.onFinishPath) {
      // Use a soft route change instead of window.location so React Router
      // stays in charge. If we're reachable we use history.pushState +
      // popstate to trigger the app's router.
      try {
        window.history.pushState({}, "", options.onFinishPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch {
        window.location.href = options.onFinishPath;
      }
    }
  });

  try {
    await Browser.open({
      url: options.url,
      presentationStyle: "fullscreen",
      toolbarColor: "#0B0D12",
    });
  } catch (e) {
    sub.remove();
    // Last-resort fallback — should be rare (only if the plugin crashes)
    window.location.href = options.url;
    throw e;
  }
}
