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
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useLaunchFlow } from "@/hooks/useLaunchFlow";
import { SplashExperience } from "./SplashExperience";
import { OnboardingSlides } from "./OnboardingSlides";
import { NativeShell } from "./NativeShell";
import { PageTransition } from "./PageTransition";
import { NativeStackPage } from "./NativeStackPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageLoader from "@/components/ui/PageLoader";

// Native-only screens (lazy)
const HomeScreen = lazy(() => import("@/pages/native/HomeScreen"));
const EventsScreen = lazy(() => import("@/pages/native/EventsScreen"));
const GamesScreen = lazy(() => import("@/pages/native/GamesScreen"));
const IdeasScreen = lazy(() => import("@/pages/native/IdeasScreen"));
const ProfileScreen = lazy(() => import("@/pages/native/ProfileScreen"));
const CreateEventFlow = lazy(() => import("@/pages/native/CreateEventFlow"));
const JoinEventFlow = lazy(() => import("@/pages/native/JoinEventFlow"));
const AdminScreen = lazy(() => import("@/pages/native/AdminScreen"));
const DrinkTrackerScreen = lazy(() => import("@/pages/native/DrinkTrackerScreen"));

// Existing desktop pages — wrapped in NativeStackPage at route level
import Auth from "@/pages/Auth";
import EventSurvey from "@/pages/EventSurvey";
const EventDashboard = lazy(() => import("@/pages/EventDashboard"));
const EventExpenses = lazy(() => import("@/pages/EventExpenses"));
const Premium = lazy(() => import("@/pages/Premium"));
const ProfileSettings = lazy(() => import("@/pages/ProfileSettings"));
const Admin = lazy(() => import("@/pages/Admin"));
const GamesHub = lazy(() => import("@/pages/GamesHub"));
const Imprint = lazy(() => import("@/pages/legal/Imprint"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const Disclaimer = lazy(() => import("@/pages/legal/Disclaimer"));
const ClaimInvite = lazy(() => import("@/pages/ClaimInvite"));
const ClientPortal = lazy(() => import("@/pages/ClientPortal"));
const GameProfilePage = lazy(() => import("@/games/social/GameProfilePage"));
const TVScreen = lazy(() => import("@/games/tv/TVScreen"));

function wrap(node: JSX.Element, title?: string, opts?: { fullscreen?: boolean; showBack?: boolean }) {
  return (
    <ErrorBoundary>
      <NativeStackPage title={title} fullscreen={opts?.fullscreen} showBack={opts?.showBack}>
        {node}
      </NativeStackPage>
    </ErrorBoundary>
  );
}

export function NativeApp() {
  const { stage, completeSplash, completeOnboarding } = useLaunchFlow();

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
                element={wrap(<EventDashboard />, "Dashboard")}
              />
              <Route
                path="/e/:slug/expenses"
                element={wrap(<EventExpenses />, "Expenses")}
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
