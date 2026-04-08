/**
 * NativeStackPage — wraps an existing desktop page in native chrome
 * (safe-area, glass header, scroll container). The page's own JSX
 * is rendered unmodified — only the frame changes.
 *
 * Use for pages that aren't redesigned yet but need to look native
 * (e.g., EventDashboard, Premium, Legal, etc.).
 */
import { ReactNode } from "react";
import { MobileHeader } from "./MobileHeader";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBack?: boolean;
  fullscreen?: boolean;
  className?: string;
}

export function NativeStackPage({
  children,
  title,
  showHeader = true,
  showBack = true,
  fullscreen = false,
  className,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-background">
      {showHeader && !fullscreen && (
        <MobileHeader title={title} showBack={showBack} />
      )}
      <div
        className={cn(
          "flex-1 native-scroll",
          fullscreen && "safe-top",
          !fullscreen && "pb-tabbar",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
