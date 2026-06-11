import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./fonts.css";
import "./index.css";
import { i18nInitPromise } from "./i18n";
import { initNativeSetup } from "./lib/native-setup";
import { initPushNotifications } from "./lib/push-notifications";
import { initRevenueCat } from "./lib/revenuecat";
import { initSocialLogin } from "./lib/native-auth";

// Mark native platform SYNCHRONOUSLY before first paint so native-only CSS
// (e.g. disabled backdrop-blur in index.css) applies on the very first frame
// — avoids a one-frame flash of the expensive glass-blur on cold start.
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add("capacitor-native");
  // Deregister service workers on native platforms
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

// Wait for i18n to be fully initialized before rendering
i18nInitPromise.then(() => {
  createRoot(document.getElementById("root")!).render(<App />);

  // Initialize native features after render
  initNativeSetup();
  initPushNotifications();
  initRevenueCat();
  initSocialLogin();
});
