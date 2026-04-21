/**
 * HoloFrame — a wrapper that adds an animated conic-gradient border (holo
 * effect) around its children. Uses the `.holo-border` utility from
 * src/index.css which relies on the `@property --angle` custom property.
 *
 * The border runs on its own layer (via mask-composite) so content is never
 * clipped. Reduced-motion mode freezes the conic rotation.
 */
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface HoloFrameProps {
  children: ReactNode;
  className?: string;
  /** Border radius utility (Tailwind). Default `rounded-3xl`. */
  rounded?: string;
  /** Extra inner padding offset (the border is painted on padding). */
  innerClassName?: string;
}

export function HoloFrame({
  children,
  className,
  rounded = "rounded-3xl",
  innerClassName,
}: HoloFrameProps) {
  return (
    <div className={cn("holo-border relative", rounded, className)}>
      <div className={cn("relative", rounded, "overflow-hidden", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
