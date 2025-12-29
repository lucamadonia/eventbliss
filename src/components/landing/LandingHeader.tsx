import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

interface LandingHeaderProps {
  onScrollToSection?: (sectionId: string) => void;
}

export function LandingHeader({ onScrollToSection }: LandingHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: t("landing.nav.features"), id: "features" },
    { label: t("landing.nav.howItWorks"), id: "how-it-works" },
    { label: t("landing.nav.solutions"), id: "solutions" },
    { label: t("landing.nav.faq"), id: "faq" },
  ];

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false);
    if (onScrollToSection) {
      onScrollToSection(id);
    } else {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-md"
            : "bg-transparent"
        }`}
      >
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 shrink-0">
              <img
                src={eventBlissLogo}
                alt="EventBliss"
                className="h-8 md:h-10 w-auto"
              />
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher />
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                {t("landing.nav.login")}
              </Button>
              <Button
                onClick={() => navigate("/create")}
                className="gradient-primary text-primary-foreground"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t("landing.nav.signUp")}
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 lg:hidden"
          >
            <div className="bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg">
              <div className="container px-4 py-4">
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className="px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-border/50 my-2" />
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate("/auth");
                    }}
                  >
                    {t("landing.nav.login")}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate("/create");
                    }}
                    className="gradient-primary text-primary-foreground"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("landing.nav.signUp")}
                  </Button>
                </nav>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}