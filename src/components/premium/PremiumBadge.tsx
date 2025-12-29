import { Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function PremiumBadge({ size = "md", className, showLabel = true }: PremiumBadgeProps) {
  const { t } = useTranslation();
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30",
        sizeClasses[size],
        className
      )}
    >
      <Crown className={cn(iconSizes[size], showLabel && "mr-1")} />
      {showLabel && t("premium.badge")}
    </Badge>
  );
}
