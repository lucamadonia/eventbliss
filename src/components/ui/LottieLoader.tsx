import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import loadingAnimation from "@/assets/animations/loading.json";

export const LottieLoader = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle Background Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 60%)"
        }}
      />

      {/* Lottie Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10"
      >
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          style={{ width: 180, height: 180 }}
        />
      </motion.div>

      {/* Loading Text */}
      <motion.div
        className="mt-6 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.p
          className="text-lg font-medium text-foreground/80"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {t("common.loading", "Loading...")}
        </motion.p>
        
        {/* Animated Underline */}
        <motion.div
          className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
          initial={{ width: "0%", left: "50%" }}
          animate={{ width: ["0%", "100%", "0%"], left: ["50%", "0%", "50%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};

export default LottieLoader;
