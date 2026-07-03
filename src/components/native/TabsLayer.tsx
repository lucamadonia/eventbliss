/**
 * TabsLayer — keep-alive host for the five bottom-tab root screens.
 *
 * Native apps never unmount tab roots; switching tabs just swaps which view
 * is visible. Routing the tabs through <Routes> + PageTransition unmounted
 * and remounted the full screen on EVERY tab tap (all queries, lists and
 * entry animations re-ran) — on-device that cost up to seconds per switch.
 *
 * This layer stays mounted for the whole session (rendered by NativeApp
 * beneath PageTransition). Each tab screen mounts lazily on first visit and
 * is then kept alive with display:none — switching becomes a pure visibility
 * flip: instant, and scroll positions survive.
 */
import { lazy, Suspense, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/components/auth/AuthProvider";
import PageLoader from "@/components/ui/PageLoader";

// Loader factories are exported so NativeApp can warm the chunks during the
// splash animation (same modules — lazy() below reuses the cached import).
export const loadHomeScreen = () => import("@/pages/native/HomeScreen");
export const loadEventsScreen = () => import("@/pages/native/EventsScreen");
export const loadGamesScreen = () => import("@/pages/native/GamesScreen");
export const loadIdeasScreen = () => import("@/pages/native/IdeasScreen");
export const loadProfileScreen = () => import("@/pages/native/ProfileScreen");

export const TAB_SCREEN_LOADERS = [
  loadHomeScreen,
  loadEventsScreen,
  loadGamesScreen,
  loadIdeasScreen,
  loadProfileScreen,
];

const HomeScreen = lazy(loadHomeScreen);
const EventsScreen = lazy(loadEventsScreen);
const GamesScreen = lazy(loadGamesScreen);
const IdeasScreen = lazy(loadIdeasScreen);
const ProfileScreen = lazy(loadProfileScreen);

interface TabScreen {
  path: string;
  Comp: React.LazyExoticComponent<() => JSX.Element>;
  /** Requires an authenticated user (mirrors ProtectedRoute). */
  requiresAuth?: boolean;
}

const TAB_SCREENS: TabScreen[] = [
  { path: "/", Comp: HomeScreen },
  { path: "/my-events", Comp: EventsScreen, requiresAuth: true },
  { path: "/games", Comp: GamesScreen },
  { path: "/ideas", Comp: IdeasScreen, requiresAuth: true },
  { path: "/profile", Comp: ProfileScreen, requiresAuth: true },
];

export const TAB_ROOT_PATHS = TAB_SCREENS.map((t) => t.path);

export function TabsLayer() {
  const { pathname } = useLocation();
  const { user, isLoading } = useAuthContext();
  // Which tabs have been visited (mounted) so far. Mutating a ref during
  // render is safe here — adding is idempotent.
  const visitedRef = useRef<Set<string>>(new Set());

  const activeTab = TAB_SCREENS.find((t) => t.path === pathname);
  const isTabPath = !!activeTab;

  // Auth guard for the ACTIVE tab only (mirrors ProtectedRoute). Inactive
  // kept-alive tabs must never emit a <Navigate> — that would redirect the
  // user away from whatever tab they're actually looking at.
  if (activeTab?.requiresAuth) {
    if (isLoading) {
      return (
        <div className="absolute inset-0">
          <PageLoader />
        </div>
      );
    }
    if (!user) {
      return <Navigate to={`/auth?redirect=${encodeURIComponent(pathname)}`} replace />;
    }
  }

  if (activeTab) visitedRef.current.add(activeTab.path);

  return (
    <div
      className="absolute inset-0"
      style={{ display: isTabPath ? undefined : "none" }}
      aria-hidden={!isTabPath}
    >
      {TAB_SCREENS.filter((t) => visitedRef.current.has(t.path)).map((t) => {
        const active = t.path === pathname;
        return (
          <div
            key={t.path}
            className="absolute inset-0 overflow-hidden"
            style={{ display: active ? undefined : "none" }}
            aria-hidden={!active}
          >
            <Suspense fallback={<PageLoader />}>
              <t.Comp />
            </Suspense>
          </div>
        );
      })}
    </div>
  );
}
