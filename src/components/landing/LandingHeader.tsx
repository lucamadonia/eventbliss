import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { UserProfileMenu } from "@/components/landing/UserProfileMenu";
import { useAuthContext } from "@/components/auth/AuthProvider";
import eventBlissLogo from "@/assets/eventbliss-logo.png";

interface LandingHeaderProps {
  onScrollToSection?: (sectionId: string) => void;
}

export const LandingHeader = ({ onScrollToSection }: LandingHeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Defensive try-catch for HMR edge cases
  let authState = { isAuthenticated: false, isLoading: true };
  try {
    authState = useAuthContext();
  } catch (e) {
    // Context not ready during HMR, use defaults
  }
  const { isAuthenticated, isLoading } = authState;

  const navItems = [
    { label: t("landing.nav.features"), href: "features" },
    { label: t("landing.nav.howItWorks"), href: "how-it-works" },
    { label: t("landing.nav.ideas"), href: "ideas", isRoute: true },
    { label: t("landing.nav.games"), href: "games", isRoute: true },
    { label: t("landing.nav.faq"), href: "faq" },
    { label: t("landing.nav.partner"), href: "partner-apply", isRoute: true },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (onScrollToSection) {
      onScrollToSection(href);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={eventBlissLogo} 
              alt="EventBliss" 
              className="h-48 md:h-56 lg:h-64 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              item.isRoute ? (
                <Link
                  key={item.href}
                  to={`/${item.href}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              )
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {isLoading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <UserProfileMenu />
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  {t("landing.nav.login")}
                </Button>
                <Button onClick={() => navigate("/create")}>
                  {t("landing.nav.signUp")}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {!isLoading && isAuthenticated && <UserProfileMenu />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  item.isRoute ? (
                    <Link
                      key={item.href}
                      to={`/${item.href}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.href}
                      onClick={() => handleNavClick(item.href)}
                      className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </button>
                  )
                ))}
                {!isAuthenticated && !isLoading && (
                  <>
                    <hr className="my-2 border-border" />
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
                      className="justify-start"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/create");
                      }}
                    >
                      {t("landing.nav.signUp")}
                    </Button>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
