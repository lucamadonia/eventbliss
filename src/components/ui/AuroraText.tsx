/**
 * AuroraText — wraps children in an animated multi-stop gradient bg-clip-text.
 * Uses the .text-aurora utility defined in src/index.css.
 */
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AuroraTextProps {
  children: ReactNode;
  className?: string;
  /** Render as a specific HTML tag; defaults to <span>. */
  as?: "span" | "div" | "h1" | "h2" | "h3";
}

export function AuroraText({ children, className, as: Tag = "span" }: AuroraTextProps) {
  return (
    <Tag className={cn("text-aurora inline-block font-display font-bold", className)}>
      {children}
    </Tag>
  );
}
