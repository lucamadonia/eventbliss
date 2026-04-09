/**
 * NativeShell — the top-level layout when running inside Capacitor.
 *
 * Owns: safe-area wrapper, page transition region, bottom tab bar, FAB.
 * Does NOT own: routing, splash, onboarding (those live in NativeApp).
 */
import { ReactNode, useEffect, useState } from "react";
import { BottomTabBar } from "./BottomTabBar";
import { FloatingActionButton } from "./FloatingActionButton";
import { useSwipeBack } from "@/hooks/useSwipeBack";

interface Props {
  children: ReactNode;
}

export function NativeShell({ children }: Props) {
  const swipeRef = useSwipeBack();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Listen for keyboard events from native-setup.ts
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setKeyboardVisible(detail.visible);
    };
    window.addEventListener("capacitor:keyboard", handler);
    return () => window.removeEventListener("capacitor:keyboard", handler);
  }, []);

  return (
    <div
      ref={swipeRef}
      className="fixed inset-0 flex flex-col bg-background text-foreground overflow-hidden"
    >
      {/* Page content — absolutely positioned inside to host transitions */}
      <main className="relative flex-1 overflow-hidden">{children}</main>

      {/* Bottom tab bar — hides on deep routes + when keyboard is open */}
      {!keyboardVisible && <BottomTabBar />}

      {/* Floating action button — hides on deep routes + when keyboard is open */}
      {!keyboardVisible && <FloatingActionButton />}
    </div>
  );
}
