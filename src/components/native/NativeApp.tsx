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
import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { isNative } from "@/lib/platform";
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

// Native-only screens (lazy). The tab-root factories are extracted into
// named consts so they can be handed BOTH to lazy() and to the idle
// preloader below — warming the chunks during the splash makes the first
// tap on every tab hit already-downloaded-and-parsed code.
const loadHomeScreen = () => import("@/pages/native/HomeScreen");
const loadEventsScreen = () => import("@/pages/native/EventsScreen");
const loadGamesScreen = () => import("@/pages/native/GamesScreen");
const loadIdeasScreen = () => import("@/pages/native/IdeasScreen");
const loadProfileScreen = () => import("@/pages/native/ProfileScreen");
const loadCreateEventFlow = () => import("@/pages/native/CreateEventFlow");

const HomeScreen = lazy(loadHomeScreen);
const EventsScreen = lazy(loadEventsScreen);
const GamesScreen = lazy(loadGamesScreen);
const IdeasScreen = lazy(loadIdeasScreen);
const ProfileScreen = lazy(loadProfileScreen);
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
const TAB_SCREEN_LOADERS = [
  loadHomeScreen,
  loadEventsScreen,
  loadGamesScreen,
  loadIdeasScreen,
  loadProfileScreen,
  loadCreateEventFlow,
];

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

  TAB_SCREEN_LOADERS.forEach((load, i) => {
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
 * Picks between the stable EventExpenses page and the new v2 rebuild
 * based on the `expenses_v2` feature flag. Kept near the routes so
 * there's only one branch point across the entire native shell.
 */
function ExpensesGate() {
  const { enabled, isLoading } = useFeatureFlag("expenses_v2");
  if (isLoading) return <PageLoader />;
  return enabled ? <EventExpensesV2 /> : <EventExpenses />;
}

export function NativeApp() {
  const { stage, completeSplash, completeOnboarding } = useLaunchFlow();

  // Warm all tab chunks while the splash plays (see preloadTabScreens).
  useEffect(() => {
    preloadTabScreens();
  }, []);

  return (
    <>
      {/* The main shell is always mounted once stage>=ready so transitions work */}
      {stage === "ready" && (
        <NativeShell>
          <PageTransition>
            <Routes>
              {/* Tab root pages */}
              <Route path="/" element={<HomeScreen />} />
              <Route
                path="/my-events"
                element={<ProtectedRoute><EventsScreen /></ProtectedRoute>}
              />
              <Route path="/games" element={<GamesScreen />} />
              <Route
                path="/ideas"
                element={<ProtectedRoute><IdeasScreen /></ProtectedRoute>}
              />
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
              <Route
                path="/profile"
                element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>}
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
              <Route
                path="/e/:slug/expenses-v2"
                element={wrap(<Suspense fallback={<PageLoader />}><EventExpensesV2 /></Suspense>, "Expenses")}
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
                element={wrap(<GamesHub />, undefined, { fullscreen: true, showBack: true })}
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </NativeShell>
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
