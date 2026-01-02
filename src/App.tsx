import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

import { AuthProvider } from "@/components/auth/AuthProvider";
import { languages } from "@/i18n";
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

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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
          <Route path="/danke" element={<Danke />} />
          {/* User Pages */}
          <Route path="/my-events" element={<Suspense fallback={<PageLoader />}><MyEvents /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><ProfileSettings /></Suspense>} />
          <Route path="/premium" element={<Suspense fallback={<PageLoader />}><Premium /></Suspense>} />
          <Route path="/partner-portal" element={<Suspense fallback={<PageLoader />}><PartnerPortal /></Suspense>} />
          <Route path="/partner-apply" element={<Suspense fallback={<PageLoader />}><PartnerApply /></Suspense>} />
          <Route path="/agency-apply" element={<Suspense fallback={<PageLoader />}><AgencyApply /></Suspense>} />
          <Route path="/agency-portal" element={<Suspense fallback={<PageLoader />}><AgencyPortal /></Suspense>} />
          <Route path="/admin/*" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
          {/* Legal Pages */}
          <Route path="/legal/imprint" element={<Suspense fallback={<PageLoader />}><Imprint /></Suspense>} />
          <Route path="/legal/privacy" element={<Suspense fallback={<PageLoader />}><Privacy /></Suspense>} />
          <Route path="/legal/terms" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>} />
          <Route path="/legal/disclaimer" element={<Suspense fallback={<PageLoader />}><Disclaimer /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
