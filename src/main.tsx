import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";
import { i18nInitPromise } from "./i18n";
import { initNativeSetup } from "./lib/native-setup";
import { initPushNotifications } from "./lib/push-notifications";

// Deregister service workers on native platforms
if (Capacitor.isNativePlatform()) {
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
});
