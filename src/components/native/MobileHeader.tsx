/**
 * MobileHeader — sticky glass header for native stack pages.
 * Includes optional back button with haptic feedback.
 */
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  showBack?: boolean;
  rightSlot?: ReactNode;
  transparent?: boolean;
  onBack?: () => void;
}

export function MobileHeader({
  title,
  showBack = true,
  rightSlot,
  transparent = false,
  onBack,
}: Props) {
  const navigate = useNavigate();
  const haptics = useHaptics();

  const handleBack = () => {
    haptics.light();
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 safe-top",
        transparent
          ? "bg-transparent"
          : "bg-background/85 backdrop-blur-2xl border-b border-white/5"
      )}
    >
      <div className="flex items-center justify-between px-2 h-14">
        <div className="flex-1 flex items-center">
          {showBack && (
            <motion.button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full text-white/90"
              whileTap={{ scale: 0.9 }}
              aria-label="Zurück"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
          )}
        </div>

        {title && (
          <h1 className="flex-1 text-center font-display font-semibold text-white text-base truncate px-2">
            {title}
          </h1>
        )}

        <div className="flex-1 flex items-center justify-end gap-1 pr-1">
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
