import { FEATURE_SWITCHES, appSwitchFor } from "@/lib/app-switches";
import type { SwitchSpec } from "./useVisibilityFlags";

export interface AreaEntry extends SwitchSpec {
  id: string;
  title: string;
  /** One plain sentence: what people no longer see while this is hidden. */
  effect: string;
  /** "Wo wirkt das?" — the screens that change. */
  places: string[];
  scope: "app" | "all";
}

/**
 * German defaults describe what the readers really do:
 * - marketplace / services: `useAppSwitches` (native app only) → NativeApp MarketplaceGate,
 *   HomeScreen, GuestHomeView, OnboardingSlides, NativeEventDashboard (`hiddenEventTabs`)
 * - expenses_v2_off: ExpensesGate (web route + app), EventDashboard, NativeEventDashboard
 * - form_studio_off: CreateEvent, CreateEventFlow, EventQuestionsStep, NativeEventDashboard
 */
export const AREA_ENTRIES: readonly AreaEntry[] = [
  {
    ...appSwitchFor("marketplace"),
    id: "marketplace",
    title: "Marktplatz",
    effect: "Nutzer der App sehen keinen Marktplatz mehr. Die Website bleibt unverändert.",
    places: [
      "Startseite der App, auch für Gäste ohne Konto",
      "Event-Seite: Reiter „Marktplatz“ und die Schnellaktion „Marktplatz entdecken“",
      "Einführung beim ersten Start: die Marktplatz-Folie",
      "Alle Marktplatz-Seiten: ein Aufruf per Link führt zur Startseite",
    ],
    scope: "app",
  },
  {
    ...appSwitchFor("services"),
    id: "services",
    title: "Dienstleister",
    effect: "Auf der Event-Seite der App fehlt der Reiter mit den gebuchten Dienstleistungen. Die Website bleibt unverändert.",
    places: ["Event-Seite der App: Reiter „Services“"],
    scope: "app",
  },
  {
    ...FEATURE_SWITCHES[0],
    id: "expenses",
    title: "Ausgaben (neue Version)",
    effect: "Alle sehen wieder die ältere Ausgaben-Ansicht. Erfasste Ausgaben bleiben erhalten.",
    places: [
      "Website: Ausgaben-Seite und Ausgaben-Reiter des Events",
      "App: Reiter „Ausgaben“ auf der Event-Seite",
      "App: im Zeitplan entfällt „Ausgabe erfassen“",
    ],
    scope: "all",
  },
  {
    ...FEATURE_SWITCHES[1],
    id: "formstudio",
    title: "Form Studio",
    effect: "Formulare lassen sich nur noch mit dem einfachen Editor bauen. Vorhandene eigene Fragen bleiben sichtbar, sind aber nicht mehr bearbeitbar.",
    places: [
      "App: Reiter „Formular“ auf der Event-Seite zeigt den einfachen Editor",
      "App: beim Event-Erstellen entfällt das KI-Formular",
      "Website und App: beim Event-Erstellen entfällt „Eigene Frage“",
    ],
    scope: "all",
  },
];
