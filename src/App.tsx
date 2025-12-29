import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
