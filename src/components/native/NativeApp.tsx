/**
 * NativeApp — root of the native mobile experience.
 *
 * Mount order:
 *   1. SplashExperience plays (animated handoff from native Capacitor splash)
 *   2. If first launch → OnboardingSlides
 *   3. NativeShell with routing + tab bar
 *
 * This component is only rendered when isNative() === true.
 * Desktop / mobile web continue using the original <AppContent /> tree.
 */
import { lazy, Suspense, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Routes, Route, Navigate, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { isNative } from "@/lib/platform";
import { useBackGuard } from "@/lib/back-guard";
import { useLaunchFlow } from "@/hooks/useLaunchFlow";
import { SplashExperience } from "./SplashExperience";
import { OnboardingSlides } from "./OnboardingSlides";
import { NativeShell } from "./NativeShell";
import { PageTransition } from "./PageTransition";
import { NativeStackPage } from "./NativeStackPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageLoader from "@/components/ui/PageLoader";

// The five tab-root screens live in TabsLayer (keep-alive, mounted once for
// the whole session). Their loader factories are re-used here to warm the
// chunks during the splash animation.
import { TabsLayer, TAB_SCREEN_LOADERS } from "./TabsLayer";
import { TABS } from "./BottomTabBar";

const loadCreateEventFlow = () => import("@/pages/native/CreateEventFlow");
const CreateEventFlow = lazy(loadCreateEventFlow);
const JoinEventFlow = lazy(() => import("@/pages/native/JoinEventFlow"));

/**
 * Idle preloader for the bottom-tab screens (+ the FAB's create flow).
 *
 * Started from NativeApp's mount effect, i.e. WHILE the ~2.1s splash
 * animation is still playing, so the chunks are warm before the user can
 * even tap a tab. Imports are staggered ~300ms apart and scheduled through
 * requestIdleCallback (setTimeout fallback — WKWebView has no rIC) so the
 * main thread is never blocked during the splash/handoff animation.
 *
 * Native-only: on the web nothing changes — pure on-demand lazy loading.
 * A failed preload is harmless; lazy() simply fetches again on demand.
 */
const PRELOAD_CHUNKS = [...TAB_SCREEN_LOADERS, loadCreateEventFlow];

let tabPreloadStarted = false;

function preloadTabScreens(): void {
  if (tabPreloadStarted || !isNative()) return;
  tabPreloadStarted = true;

  const whenIdle = (cb: () => void) => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => cb(), { timeout: 1000 });
    } else {
      setTimeout(cb, 50);
    }
  };

  PRELOAD_CHUNKS.forEach((load, i) => {
    setTimeout(() => {
      whenIdle(() => {
        load().catch(() => undefined);
      });
    }, i * 300);
  });
}
const AdminScreen = lazy(() => import("@/pages/native/AdminScreen"));
const DrinkTrackerScreen = lazy(() => import("@/pages/native/DrinkTrackerScreen"));
const PartyLobbyScreen = lazy(() => import("@/pages/native/PartyLobbyScreen"));
const NativeEventDashboard = lazy(() => import("@/pages/native/NativeEventDashboard"));
const JoinRoomScreen = lazy(() => import("@/pages/native/JoinRoomScreen"));
const NativeMarketplaceScreen = lazy(() => import("@/pages/native/NativeMarketplaceScreen"));
const NativeServiceDetailScreen = lazy(() => import("@/pages/native/NativeServiceDetailScreen"));

// Existing desktop pages — wrapped in NativeStackPage at route level
import Auth from "@/pages/Auth";
import EventSurvey from "@/pages/EventSurvey";
import { TVBroadcastProvider } from "@/contexts/TVBroadcastContext";
import { getActivePartySession, subscribePartySession } from "@/hooks/usePartySession";
const EventDashboard = lazy(() => import("@/pages/EventDashboard"));
const EventExpenses = lazy(() => import("@/pages/EventExpenses"));
const EventExpensesV2 = lazy(() => import("@/pages/EventExpensesV2"));
const MyBookings = lazy(() => import("@/pages/MyBookings"));
const BookingSuccess = lazy(() => import("@/pages/BookingSuccess"));
const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const Premium = lazy(() => import("@/pages/Premium"));
const ProfileSettings = lazy(() => import("@/pages/ProfileSettings"));
const Admin = lazy(() => import("@/pages/Admin"));
const GamesHub = lazy(() => import("@/pages/GamesHub"));
const Imprint = lazy(() => import("@/pages/legal/Imprint"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const Disclaimer = lazy(() => import("@/pages/legal/Disclaimer"));
const Support = lazy(() => import("@/pages/Support"));
const ClaimInvite = lazy(() => import("@/pages/ClaimInvite"));
const ClientPortal = lazy(() => import("@/pages/ClientPortal"));
const GameProfilePage = lazy(() => import("@/games/social/GameProfilePage").then(m => ({ default: m.GameProfilePage })));
const TVScreen = lazy(() => import("@/games/tv/TVScreen"));
const MarketplaceAgency = lazy(() => import("@/pages/MarketplaceAgency"));

function wrap(node: JSX.Element, title?: string, opts?: { fullscreen?: boolean; showBack?: boolean }) {
  return (
    <ErrorBoundary>
      <NativeStackPage title={title} fullscreen={opts?.fullscreen} showBack={opts?.showBack}>
        {node}
      </NativeStackPage>
    </ErrorBoundary>
  );
}

/**
 * Wohin der Zurück-Pfeil aus einem Spiel führt.
 *
 * Fest verdrahtet statt `navigate(-1)`: In ein Spiel führen SIEBEN Wege —
 * Spiele-Tab, Ideen-Tab, Ideen-Regal, Themen-Blatt, Party-Lobby, Raum-Blatt und
 * Deep-Link. Verlaufsbasiert landete man deshalb mal in den Ideen, mal in der
 * Party, und nach einem Kaltstart oder Deep-Link auf dem Dashboard, weil
 * darunter schlicht nichts anderes lag. Ein Spiel gehört unter „Spiele" — also
 * gehört man beim Verlassen dorthin, unabhängig vom Weg hinein.
 *
 * Das läuft bewusst über den Zurück-Stapel und nicht über eine eigene Leitung:
 * Sowohl der schwebende Pfeil (`FloatingBackButton`) als auch die
 * Android-Hardware-Taste (`native-setup.ts`) fragen `runBackGuards()` — beide
 * Wege sind damit in einem Zug erledigt.
 *
 * Rang `route` ist zwingend: Der Schutz einer LAUFENDEN Partie („wirklich
 * verlassen?") muss weiterhin zuerst gefragt werden. Siehe die Begründung in
 * `src/lib/back-guard.ts`.
 */
function GameBackTarget({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Ausnahme Party-Lobby: Dort ist das Spiel Teil eines laufenden Abends, und
  // die Spieleübersicht wäre ein Bruch im Ablauf.
  const to = params.get("party") === "true" ? "/party" : "/games";

  useBackGuard(
    () => {
      navigate(to);
      return true;
    },
    true,
    "route",
  );

  return <>{children}</>;
}

/**
 * Renders the v2 expenses experience by default; the `expenses_v2_off`
 * kill-switch flag falls back to the legacy v1 page. No loading gate: while
 * the flag fetches, `off` is false → v2 renders immediately (no v1 flash).
 */
function ExpensesGate() {
  const { enabled: off } = useFeatureFlag("expenses_v2_off");
  return off ? <EventExpenses /> : <EventExpensesV2 />;
}

const TAB_PATHS = TABS.map((t) => t.to);

/**
 * Auffang-Route — darf waehrend einer Ausblend-Animation NICHT feuern.
 *
 * AnimatePresence haelt die verlassene Seite fuer die Dauer der Animation im
 * Baum, und die rendert mit der bereits NEUEN Adresse neu. Zeigt die auf eine
 * Tab-Wurzel, findet dieses <Routes> nichts (Tab-Wurzeln leben in TabsLayer,
 * nicht hier) — und das blanke <Navigate to="/"> warf den Nutzer auf die
 * Startseite. Damit landete JEDE programmatische Navigation von einer
 * Stack-Seite auf einen Tab auf Home statt am Ziel: navigate("/games")
 * beim Beenden einer Party ebenso wie das X in der Party-Lobby.
 */
function RouteFallback() {
  const { pathname } = useLocation();
  if (TAB_PATHS.includes(pathname)) return null;
  return <Navigate to="/" replace />;
}

export function NativeApp() {
  const { stage, completeSplash, completeOnboarding } = useLaunchFlow();
  const { pathname: shellPath } = useLocation();
  /**
   * EIN Fernseh-Kanal fuer die ganze App.
   *
   * Frueher haing der Provider nur um den Spiele-Hub — die Party-Lobby lag
   * ausserhalb und konnte gar nichts senden: kein Zwischenstand, keine
   * Siegerehrung, keine Fernbedienung. Ein ZWEITER Provider an `/party` waere
   * schlimmer gewesen, weil `supabase.channel()` nach Topic dedupliziert und
   * der zuerst abgebaute den geteilten Kanal mitgerissen haette.
   *
   * Der Provider um den Spiele-Hub bleibt stehen und wird hier drinnen zum
   * No-Op (Durchreiche-Schutz) — im Web wirkt er unveraendert.
   */
  const partySession = useSyncExternalStore(subscribePartySession, getActivePartySession, () => null);
  const partyTvCode = partySession?.isActive ? partySession.tvCode : undefined;
  // Die schwebende Pille nur dort, wo sie hingehoert. Die Party-Lobby hat ihre
  // eigene TV-Karte; zwei Bedienelemente fuer dieselbe Sache verwirren.
  const showTvPill = shellPath.startsWith("/games");

  // Warm all tab chunks while the splash plays (see preloadTabScreens).
  useEffect(() => {
    preloadTabScreens();
  }, []);

  return (
    <>
      {/* The main shell is always mounted once stage>=ready so transitions work */}
      {stage === "ready" && (
        <TVBroadcastProvider sessionCode={partyTvCode} showConnectButton={showTvPill}>
        <NativeShell>
          {/* Keep-alive tab roots — always mounted, visibility-toggled.
              Tab paths are NOT routed through PageTransition (it skips
              them), so switching tabs never unmounts a screen. */}
          <TabsLayer />
          <PageTransition>
            <Routes>
              {/* Tab root pages (/, /my-events, /games, /ideas, /profile)
                  are handled by TabsLayer above. */}
              <Route
                path="/marketplace"
                element={<Suspense fallback={<PageLoader />}><NativeMarketplaceScreen /></Suspense>}
              />
              <Route
                path="/marketplace/service/:slug"
                element={<Suspense fallback={<PageLoader />}><NativeServiceDetailScreen /></Suspense>}
              />
              <Route
                path="/marketplace/agency/:slug"
                element={wrap(
                  <Suspense fallback={<PageLoader />}><MarketplaceAgency /></Suspense>,
                  "Agentur"
                )}
              />
              {/* Settings is a separate stack page (not a tab) */}
              <Route
                path="/settings"
                element={wrap(
                  <ProtectedRoute><Suspense fallback={<PageLoader />}><ProfileSettings /></Suspense></ProtectedRoute>,
                  "Einstellungen"
                )}
              />

              {/* Native-designed flows */}
              <Route path="/create" element={<CreateEventFlow />} />
              <Route path="/join" element={<JoinEventFlow />} />
              <Route path="/party-stats" element={
                <Suspense fallback={<PageLoader />}><DrinkTrackerScreen /></Suspense>
              } />
              <Route path="/party" element={
                <Suspense fallback={<PageLoader />}><PartyLobbyScreen /></Suspense>
              } />

              <Route path="/join-room" element={
                <Suspense fallback={<PageLoader />}><JoinRoomScreen /></Suspense>
              } />

              {/* Existing pages wrapped in NativeStackPage */}
              <Route
                path="/auth"
                element={wrap(<Auth />, undefined, { fullscreen: true })}
              />
              <Route
                path="/e/:slug"
                element={wrap(<EventSurvey />, "Event")}
              />
              <Route
                path="/e/:slug/dashboard"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <NativeEventDashboard />
                  </Suspense>
                }
              />
              <Route
                path="/e/:slug/expenses"
                element={wrap(<ExpensesGate />, "Expenses")}
              />
              {/* Legacy deep link — v2 is now the canonical /expenses page. */}
              <Route
                path="/e/:slug/expenses-v2"
                element={<Navigate to="../expenses" replace />}
              />

              {/* Booking flow — mirrors App.tsx so users don't bounce out of
                  the native shell after Stripe Checkout completes. */}
              <Route
                path="/my-bookings"
                element={wrap(
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}><MyBookings /></Suspense>
                  </ProtectedRoute>,
                  "Meine Buchungen",
                )}
              />
              <Route
                path="/booking-success"
                element={wrap(
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}><BookingSuccess /></Suspense>
                  </ProtectedRoute>,
                  "Buchung bestätigt",
                )}
              />
              <Route
                path="/booking/:number"
                element={wrap(
                  <Suspense fallback={<PageLoader />}><PublicBooking /></Suspense>,
                  "Buchung",
                )}
              />
              <Route
                path="/e/:slug/claim/:token"
                element={wrap(<ClaimInvite />, "Einladung")}
              />
              <Route
                path="/client/:token"
                element={wrap(<ClientPortal />, "Client")}
              />
              <Route
                path="/premium"
                element={wrap(
                  <ProtectedRoute><Premium /></ProtectedRoute>,
                  "Premium"
                )}
              />
              <Route
                path="/games/:gameId"
                element={
                  <GameBackTarget>
                    {wrap(<GamesHub />, undefined, { fullscreen: true, showBack: true })}
                  </GameBackTarget>
                }
              />
              <Route
                path="/games/profile"
                element={wrap(<GameProfilePage />, "Profil")}
              />
              <Route
                path="/tv"
                element={wrap(<TVScreen />, undefined, { fullscreen: true })}
              />
              <Route
                path="/tv/:roomCode"
                element={wrap(<TVScreen />, undefined, { fullscreen: true })}
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AdminScreen />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/*"
                element={wrap(
                  <AdminRoute><Admin /></AdminRoute>,
                  "Admin"
                )}
              />
              <Route path="/legal/imprint" element={wrap(<Imprint />, "Impressum")} />
              <Route path="/legal/privacy" element={wrap(<Privacy />, "Datenschutz")} />
              <Route path="/legal/terms" element={wrap(<Terms />, "AGB")} />
              <Route path="/legal/disclaimer" element={wrap(<Disclaimer />, "Haftung")} />
              <Route path="/support" element={wrap(<Support />, "Support")} />

              {/* Fallback */}
              <Route path="*" element={<RouteFallback />} />
            </Routes>
          </PageTransition>
        </NativeShell>
        </TVBroadcastProvider>
      )}

      {/* Overlay layers (splash + onboarding) — on top of shell */}
      <AnimatePresence mode="wait">
        {stage === "splash" && (
          <SplashExperience key="splash" onComplete={completeSplash} />
        )}
        {stage === "onboarding" && (
          <OnboardingSlides key="onboarding" onComplete={completeOnboarding} />
        )}
      </AnimatePresence>
    </>
  );
}

export default NativeApp;
