import { useEffect, useState } from "react";

/**
 * useKeyboardInset — the current on-screen keyboard height in px (0 when hidden).
 *
 * Capacitor runs with KeyboardResize.Body, which shrinks document.body — but a
 * `position: fixed` bottom sheet is laid out against the LAYOUT viewport, so it
 * stays pinned to the physical screen bottom and the keyboard covers its inputs.
 * Consumers add this value as padding-bottom on their scroll container so the
 * focused field can scroll above the keyboard.
 *
 * Source: the `capacitor:keyboard` CustomEvents dispatched from native-setup.ts.
 * On web (no native keyboard events) this stays 0 — harmless.
 */
export function useKeyboardInset(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { visible: boolean; height: number };
      setHeight(detail.visible ? detail.height : 0);
    };
    window.addEventListener("capacitor:keyboard", handler);
    return () => window.removeEventListener("capacitor:keyboard", handler);
  }, []);

  return height;
}
