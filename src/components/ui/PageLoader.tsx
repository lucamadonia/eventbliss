import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Lottie from "lottie-react";
import loaderIcon from "@/assets/eventbliss-loader-icon.png";
import loadingAnimation from "@/assets/animations/loading.json";

interface PageLoaderProps {
  variant?: "logo" | "lottie";
}

/**
 * Minimal, modern route loader. The logo variant is a single transform-only
 * rotating arc around the brand mark — no particle fields, no counter-rotating
 * rings, no layout-animating underline, no blur pulses (all of which janked on
 * every route change). Quiet and flat by design.
 */
export const PageLoader = ({ variant = "logo" }: PageLoaderProps) => {
  const { t } = useTranslation();

  if (variant === "lottie") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Lottie animationData={loadingAnimation} loop style={{ width: 160, height: 160 }} />
        </motion.div>
        <p className="mt-6 text-sm font-medium text-muted-foreground">
          {t("common.loading", "Loading...")}
        </p>
      </div>
    );
  }

  // Logo variant (default) — single rotating arc, transform-only.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-24 h-24 flex items-center justify-center"
      >
        {/* Single rotating arc — GPU transform only */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 96 96"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <linearGradient id="loaderArc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
            </linearGradient>
          </defs>
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="url(#loaderArc)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="150 130"
          />
        </motion.svg>
        <img src={loaderIcon} alt="" className="w-14 h-14 relative z-10" />
      </motion.div>

      <p className="mt-7 text-sm font-medium text-muted-foreground">
        {t("common.loading", "Loading...")}
      </p>
    </div>
  );
};

export default PageLoader;
