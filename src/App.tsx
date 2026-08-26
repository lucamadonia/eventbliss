import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { initDeepLinks } from "@/lib/deep-links";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";

// TV Screen (lazy loaded)
const TVScreen = lazy(() => import("./games/tv/TVScreen"));
const TVCodeEntryPage = lazy(() => import("./games/tv/TVScreen").then(m => ({ default: m.TVCodeEntry })));
const GameProfilePage = lazy(() => import("./games/social/GameProfilePage").then(m => ({ default: m.GameProfilePage })));
const AdminGames = lazy(() => import("./pages/AdminGames"));
const OhrwurmSongs = lazy(() => import("./pages/admin/OhrwurmSongs"));
const PixelImages = lazy(() => import("./pages/admin/PixelImages"));
const CloseEnoughQuestions = lazy(() => import("./pages/admin/CloseEnoughQuestions"));
const GameReports = lazy(() => import("./pages/admin/GameReports"));

// Legal Pages (lazy loaded)
const Imprint = lazy(() => import("./pages/legal/Imprint"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));
const AgencyAgreement = lazy(() => import("./pages/legal/AgencyAgreement"));
const Support = lazy(() => import("./pages/Support"));

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
const AgencyPricing = lazy(() => import("./pages/AgencyPricing"));
const AgencyDemo = lazy(() => import("./pages/AgencyDemo"));
const CreatorPortal = lazy(() => import("./pages/CreatorPortal"));
const IdeasHub = lazy(() => import("./pages/IdeasHub"));
const JgaCity = lazy(() => import("./pages/JgaCity"));
const JgaCalculator = lazy(() => import("./pages/JgaCalculator"));
const IdeaActivity = lazy(() => import("./pages/IdeaActivity"));
const StagDoCity = lazy(() => import("./pages/StagDoCity"));
const ActivityEN = lazy(() => import("./pages/ActivityEN"));
const HenDoCity = lazy(() => import("./pages/HenDoCity"));
const IntlCity = lazy(() => import("./pages/IntlCity"));
const ActivityIntl = lazy(() => import("./pages/ActivityIntl"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const GamesHub = lazy(() => import("./pages/GamesHub"));
const MyBookings = lazy(() => import("@/pages/MyBookings"));
const BookingSuccess = lazy(() => import("@/pages/BookingSuccess"));
const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const MarketplaceService = lazy(() => import("@/pages/MarketplaceService"));
const MarketplaceAgency = lazy(() => import("@/pages/MarketplaceAgency"));
const AgencyEmbed = lazy(() => import("@/pages/AgencyEmbed"));

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { languages } from "@/i18n";
import PageLoader from "@/components/ui/PageLoader";
import { isNative } from "@/lib/platform";
const NativeApp = lazy(() => import("@/components/native/NativeApp"));
// Web pages — lazy so they stay OUT of the entry chunk. Important for the
// native app too: it renders only <NativeApp> but still loads this entry
// chunk, so eagerly importing these web-only pages bloated native cold-start.
const Landing = lazy(() => import("./pages/Landing"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const JoinEvent = lazy(() => import("./pages/JoinEvent"));
const EventSurvey = lazy(() => import("./pages/EventSurvey"));
const EventDashboard = lazy(() => import("./pages/EventDashboard"));
const ExpensesGate = lazy(() => import("./components/expenses-v2/ExpensesGate"));
const Danke = lazy(() => import("./pages/Danke"));
const Auth = lazy(() => import("./pages/Auth"));
const ClaimInvite = lazy(() => import("./pages/ClaimInvite"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data for a minute before refetching — kills the
      // refetch cascade on every tab/screen switch and app resume.
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: isNative() ? 1 : 2,
    },
  },
});

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

  // On native platforms (iOS/Android via Capacitor), render a completely
  // different app tree with bottom tab bar, animated splash, etc.
  // Desktop and mobile web are unchanged below.
  if (isNative()) {
    return (
      <TooltipProvider>
        <BrowserRouter>
          <DeepLinkHandler />
          <Toaster />
          <Sonner />
          <Suspense fallback={<div className="fixed inset-0 bg-background" />}>
            <NativeApp />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <BrowserRouter>
        <DeepLinkHandler />
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Landing /></Suspense></ErrorBoundary>} />
          <Route path="/create" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><CreateEvent /></Suspense></ErrorBoundary>} />
          <Route path="/join" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JoinEvent /></Suspense></ErrorBoundary>} />
          <Route path="/auth" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Auth /></Suspense></ErrorBoundary>} />
          <Route path="/e/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><EventSurvey /></Suspense></ErrorBoundary>} />
          <Route path="/e/:slug/dashboard" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><EventDashboard /></Suspense></ErrorBoundary>} />
          <Route path="/e/:slug/expenses" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ExpensesGate /></Suspense></ErrorBoundary>} />
          <Route path="/e/:slug/expenses-v2" element={<Navigate to="../expenses" replace />} />
          <Route path="/e/:slug/claim/:token" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ClaimInvite /></Suspense></ErrorBoundary>} />
          <Route path="/client/:token" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ClientPortal /></Suspense></ErrorBoundary>} />
          <Route path="/games" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><GamesHub /></Suspense></ErrorBoundary>} />
          <Route path="/games/:gameId" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><GamesHub /></Suspense></ErrorBoundary>} />
          <Route path="/tv" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><TVCodeEntryPage /></Suspense></ErrorBoundary>} />
          <Route path="/tv/:roomCode" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><TVScreen /></Suspense></ErrorBoundary>} />
          <Route path="/games/profile" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><GameProfilePage /></Suspense></ErrorBoundary>} />
          <Route path="/admin/games" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AdminGames /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/admin/ohrwurm-songs" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><OhrwurmSongs /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/admin/pixel-images" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><PixelImages /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/admin/closeenough-questions" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><CloseEnoughQuestions /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/admin/game-reports" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><GameReports /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/marketplace" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Marketplace /></Suspense></ErrorBoundary>} />
          <Route path="/marketplace/service/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><MarketplaceService /></Suspense></ErrorBoundary>} />
          <Route path="/marketplace/agency/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><MarketplaceAgency /></Suspense></ErrorBoundary>} />
          <Route path="/embed/agency/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgencyEmbed /></Suspense></ErrorBoundary>} />
          <Route path="/danke" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Danke /></Suspense></ErrorBoundary>} />
          {/* SEO landing pages — public, no auth */}
          <Route path="/jga/kalkulator" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/stag-do/calculator" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/despedida/calculadora" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/evg/calculatrice" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/addio/calcolatore" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/despedida-de-solteiro/calculadora" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/vrijgezellenfeest/calculator" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/wieczor-kawalerski/kalkulator" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/bekarliga-veda/hesaplayici" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/wadaa-azubiya/hasiba" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCalculator /></Suspense></ErrorBoundary>} />
          <Route path="/jga/:stadt" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><JgaCity /></Suspense></ErrorBoundary>} />
          <Route path="/ideen/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IdeaActivity /></Suspense></ErrorBoundary>} />
          <Route path="/stag-do/:city" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><StagDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/activities/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityEN /></Suspense></ErrorBoundary>} />
          <Route path="/jga-frauen/:stadt" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/hen-do/:city" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          {/* Hen Do — 7 additional languages */}
          <Route path="/despedida-soltera/:ciudad" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/evjf/:ville" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/addio-nubilato/:citta" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/despedida-de-solteira/:cidade" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/vrijgezellinnenfeest/:stad" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/wieczor-panienski/:miasto" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/kadin-bekarliga-veda/:sehir" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/wadaa-azubiya-banat/:sehir" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HenDoCity /></Suspense></ErrorBoundary>} />
          <Route path="/despedida/:ciudad" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IntlCity /></Suspense></ErrorBoundary>} />
          <Route path="/evg/:ville" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IntlCity /></Suspense></ErrorBoundary>} />
          <Route path="/addio/:citta" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IntlCity /></Suspense></ErrorBoundary>} />
          <Route path="/despedida-de-solteiro/:cidade" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IntlCity /></Suspense></ErrorBoundary>} />
          <Route path="/vrijgezellenfeest/:stad" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IntlCity /></Suspense></ErrorBoundary>} />
          <Route path="/wieczor-kawalerski/:miasto" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IntlCity /></Suspense></ErrorBoundary>} />
          <Route path="/bekarliga-veda/:sehir" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IntlCity /></Suspense></ErrorBoundary>} />
          <Route path="/wadaa-azubiya/:city" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><IntlCity /></Suspense></ErrorBoundary>} />
          {/* Multilingual activity glossary — 7 languages */}
          <Route path="/actividades/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityIntl /></Suspense></ErrorBoundary>} />
          <Route path="/activites/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityIntl /></Suspense></ErrorBoundary>} />
          <Route path="/attivita/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityIntl /></Suspense></ErrorBoundary>} />
          <Route path="/atividades/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityIntl /></Suspense></ErrorBoundary>} />
          <Route path="/activiteiten/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityIntl /></Suspense></ErrorBoundary>} />
          <Route path="/atrakcje/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityIntl /></Suspense></ErrorBoundary>} />
          <Route path="/aktiviteler/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityIntl /></Suspense></ErrorBoundary>} />
          <Route path="/anshita/:slug" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityIntl /></Suspense></ErrorBoundary>} />
          {/* User Pages (protected) */}
          <Route path="/my-events" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><MyEvents /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><ProfileSettings /></ProtectedRoute></Suspense></ErrorBoundary>} />
          {/* Native app uses /profile as a tab destination. On web we
              alias it to /settings so hand-typed URLs and shared deep
              links still land somewhere sensible. */}
          <Route path="/profile" element={<Navigate to="/settings" replace />} />
          <Route path="/premium" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><Premium /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/partner-portal" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><PartnerPortal /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/partner-apply" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><PartnerApply /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/agency-apply" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AgencyApply /></ProtectedRoute></Suspense></ErrorBoundary>} />
          {/* Common alias paths (/agency/apply, /apply) so deep links and human-typed URLs work */}
          <Route path="/agency/apply" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AgencyApply /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/apply" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AgencyApply /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/agency-portal" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AgencyPortal /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/agency" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><AgencyDashboard /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/agency/pricing" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgencyPricing /></Suspense></ErrorBoundary>} />

          {/*
            Die Demoseite aus dem Akquise-Anschreiben. Mit Token zeigt sie das
            Profil DIESER Agentur, ohne Token die allgemeine Fassung. Oeffentlich
            und ohne Login — eine Agentur, die eine Kaltmail bekommt, legt sich
            kein Konto an, um zu schauen, worum es geht.
          */}
          {/*
            Der persoenliche Bereich eines Influencers. Kein Login: wer eine
            Kaltansprache bekommt, legt sich kein Konto an, um nachzusehen,
            worum es geht. Die Seite haengt am invite_token.
          */}
          <Route path="/creators/:token" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><CreatorPortal /></Suspense></ErrorBoundary>} />
          <Route path="/agencies" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgencyDemo /></Suspense></ErrorBoundary>} />
          <Route path="/agencies/:token" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgencyDemo /></Suspense></ErrorBoundary>} />
          <Route path="/:lang/agencies" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgencyDemo /></Suspense></ErrorBoundary>} />
          <Route path="/:lang/agencies/:token" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgencyDemo /></Suspense></ErrorBoundary>} />
          <Route path="/admin/*" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AdminRoute><Admin /></AdminRoute></Suspense></ErrorBoundary>} />
          <Route path="/ideas" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><IdeasHub /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/my-bookings" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><MyBookings /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/booking-success" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProtectedRoute><BookingSuccess /></ProtectedRoute></Suspense></ErrorBoundary>} />
          <Route path="/booking/:number" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><PublicBooking /></Suspense></ErrorBoundary>} />
          {/* Legal & support pages — unprefixed (follow the UI language) */}
          <Route path="/legal/imprint" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Imprint /></Suspense></ErrorBoundary>} />
          <Route path="/legal/privacy" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Privacy /></Suspense></ErrorBoundary>} />
          <Route path="/legal/terms" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Terms /></Suspense></ErrorBoundary>} />
          <Route path="/legal/disclaimer" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Disclaimer /></Suspense></ErrorBoundary>} />
          <Route path="/legal/agency-agreement" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgencyAgreement /></Suspense></ErrorBoundary>} />
          <Route path="/support" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Support /></Suspense></ErrorBoundary>} />
          {/* Legal & support pages — language-prefixed (/de/legal/privacy, /fr/support …).
              Page language derives from :lang via useUrlLanguage; invalid langs render NotFound. */}
          <Route path="/:lang/legal/imprint" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Imprint /></Suspense></ErrorBoundary>} />
          <Route path="/:lang/legal/privacy" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Privacy /></Suspense></ErrorBoundary>} />
          <Route path="/:lang/legal/terms" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Terms /></Suspense></ErrorBoundary>} />
          <Route path="/:lang/legal/disclaimer" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Disclaimer /></Suspense></ErrorBoundary>} />
          <Route path="/:lang/legal/agency-agreement" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgencyAgreement /></Suspense></ErrorBoundary>} />
          <Route path="/:lang/support" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Support /></Suspense></ErrorBoundary>} />
          {/* Language-prefixed marketing homepage (/de, /en … /ar). Page language
              derives from :lang via useUrlLanguage; invalid langs render NotFound.
              Kept last so it never shadows the specific single-segment routes above
              (/games, /tv, /create …), which React Router matches with priority. */}
          <Route path="/:lang" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Landing /></Suspense></ErrorBoundary>} />
          <Route path="*" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><NotFound /></Suspense></ErrorBoundary>} />
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
