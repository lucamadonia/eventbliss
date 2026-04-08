/**
 * NativeShell — the top-level layout when running inside Capacitor.
 *
 * Owns: safe-area wrapper, page transition region, bottom tab bar, FAB.
 * Does NOT own: routing, splash, onboarding (those live in NativeApp).
 */
import { ReactNode } from "react";
import { BottomTabBar } from "./BottomTabBar";
import { FloatingActionButton } from "./FloatingActionButton";

interface Props {
  children: ReactNode;
}

export function NativeShell({ children }: Props) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground overflow-hidden">
      {/* Page content — absolutely positioned inside to host transitions */}
      <main className="relative flex-1 overflow-hidden">{children}</main>

      {/* Bottom tab bar — hides itself on deep routes */}
      <BottomTabBar />

      {/* Floating action button — hides itself on deep routes */}
      <FloatingActionButton />
    </div>
  );
}
