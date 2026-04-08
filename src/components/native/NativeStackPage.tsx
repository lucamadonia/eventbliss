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
import { FloatingBackButton } from "./FloatingBackButton";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBack?: boolean;
  /** When true: no sticky header, content goes edge-to-edge under status bar.
   * A floating back button is still shown in the top-left corner. */
  fullscreen?: boolean;
  /** When true: no back button AT ALL (use for auth / standalone flows). */
  noBack?: boolean;
  className?: string;
}

export function NativeStackPage({
  children,
  title,
  showHeader = true,
  showBack = true,
  fullscreen = false,
  noBack = false,
  className,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-background relative">
      {showHeader && !fullscreen && (
        <MobileHeader title={title} showBack={showBack && !noBack} />
      )}

      {/* Fullscreen pages: floating back button overlay */}
      {fullscreen && !noBack && <FloatingBackButton />}

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
