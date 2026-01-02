import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { i18nInitPromise } from "./i18n";

// Wait for i18n to be fully initialized before rendering
i18nInitPromise.then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
