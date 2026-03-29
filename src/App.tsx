import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { initDeepLinks } from "@/lib/deep-links";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";

// Legal Pages (lazy loaded)
const Imprint = lazy(() => import("./pages/legal/Imprint"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));

// User Pages (lazy loaded)
const MyEvents = lazy(() => import("./pages/MyEvents"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const Premium = lazy(() => import("./pages/Premium"));
const Admin = lazy(() => import("./pages/Admin"));
const PartnerPortal = lazy(() => import("./pages/PartnerPortal"));
const PartnerApply = lazy(() => import("./pages/PartnerApply"));
const AgencyApply = lazy(() => import("./pages/AgencyApply"));
const AgencyPortal = lazy(() => import("./pages/AgencyPortal"));
const AgencyDashboard = lazy(() => import("./pages/AgencyDashboard"));
const IdeasHub = lazy(() => import("./pages/IdeasHub"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const GamesHub = lazy(() => import("./pages/GamesHub"));

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { languages } from "@/i18n";
import PageLoader from "@/components/ui/PageLoader";
import Landing from "./pages/Landing";
import CreateEvent from "./pages/CreateEvent";
import JoinEvent from "./pages/JoinEvent";
import EventSurvey from "./pages/EventSurvey";
import EventDashboard from "./pages/EventDashboard";
import EventExpenses from "./pages/EventExpenses";
import Danke from "./pages/Danke";
import Auth from "./pages/Auth";
import ClaimInvite from "./pages/ClaimInvite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const DeepLinkHandler = () => {
  const navigate = useNavigate();
  useEffect(() => {
    initDeepLinks(navigate);
  }, [navigate]);
  return null;
};

const AppContent = () => {
  const { i18n } = useTranslation();

  // RTL support for Arabic
  useEffect(() => {
    const currentLang = languages.find(l => l.code === i18n.language);
    document.documentElement.dir = currentLang?.dir || 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <TooltipProvider>
      <BrowserRouter>
        <DeepLinkHandler />
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<CreateEvent />} />
          <Route path="/join" element={<JoinEvent />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/e/:slug" element={<EventSurvey />} />
          <Route path="/e/:slug/dashboard" element={<EventDashboard />} />
          <Route path="/e/:slug/expenses" element={<EventExpenses />} />
          <Route path="/e/:slug/claim/:token" element={<ClaimInvite />} />
          <Route path="/client/:token" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ClientPortal /></Suspense></ErrorBoundary>} />
          <Route path="/games" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><GamesHub /></Suspense></ErrorBoundary>} />
          <Route path="/games/:gameId" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><GamesHub /></Suspense></ErrorBoundary>} />
          <Route path="/danke" element={<Danke />} />
          {/* User Pages (protected) */}
          <Route path="/my-events" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><MyEvents /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><ProfileSettings /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/premium" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><Premium /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/partner-portal" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><PartnerPortal /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/partner-apply" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><PartnerApply /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/agency-apply" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AgencyApply /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/agency-portal" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AgencyPortal /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/agency" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AgencyDashboard /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/admin/*" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AdminRoute><Admin /></AdminRoute></Suspense></ErrorBoundary>} />
          <Route path="/ideas" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><IdeasHub /></ProtectedRoute></Suspense></ErrorBoundary>} />
          {/* Legal Pages */}
          <Route path="/legal/imprint" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Imprint /></Suspense></ErrorBoundary>} />
          <Route path="/legal/privacy" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Privacy /></Suspense></ErrorBoundary>} />
          <Route path="/legal/terms" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Terms /></Suspense></ErrorBoundary>} />
          <Route path="/legal/disclaimer" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Disclaimer /></Suspense></ErrorBoundary>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      themes={["light", "dark", "rose", "system"]}
      enableSystem={true}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <AppContent />
          </Suspense>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
