import { useEffect, useState, type ReactNode } from 'react';
import { NativeOverlayPortal } from '@/components/native/NativeOverlayPortal';
import { useTabBarVisible } from '@/components/native/BottomTabBar';

/** The route wants the tab bar AND it is really on screen (embedded hosts may not render it). */
function useTabBarOnScreen(): boolean {
  const wanted = useTabBarVisible();
  const [present, setPresent] = useState(false);
  useEffect(() => {
    if (!wanted) { setPresent(false); return; }
    const check = () => setPresent(!!document.querySelector('nav.fixed.bottom-0'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: false });
    const late = setTimeout(check, 400); // the tab bar animates in
    return () => { observer.disconnect(); clearTimeout(late); };
  }, [wanted]);
  return wanted && present;
}

/**
 * The thumb-zone action bar of the party screens. Fixed to the viewport (via
 * portal — a transformed page wrapper would trap `position: fixed`), resting
 * on the tab bar when it is on screen, otherwise on the safe area. A scrim
 * fades the content scrolling underneath. Pages leave room for it with
 * <PartyBottomBarSpacer />.
 */
export function PartyBottomBar({ children, testId, zIndex, coversTabBar = false }: {
  children: ReactNode; testId?: string;
  /** Above a full-screen overlay (e.g. "Euer Abend"), which also hides the tab bar. */
  zIndex?: number; coversTabBar?: boolean;
}) {
  const tabBar = useTabBarOnScreen() && !coversTabBar;
  return (
    <NativeOverlayPortal>
      {/* Opaque where the bar and its subline sit, fading out only in the top 32px — nothing shows through. */}
      <div data-testid={testId} className="pointer-events-none fixed inset-x-0 z-40 mx-auto max-w-2xl px-5 pt-8"
        style={{ ...(zIndex ? { zIndex } : {}), bottom: tabBar ? 'var(--tabbar-space)' : 0, paddingBottom: tabBar ? '0.75rem' : 'calc(1rem + env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, #060810 0%, #060810 78%, rgba(6,8,16,0) 100%)' }}>
        <div className="pointer-events-auto">{children}</div>
      </div>
    </NativeOverlayPortal>
  );
}

/** Keeps the last content fully above the fixed bar: scrim 2rem + button 4rem + reason/undo line ~3.5rem + padding. */
export const PartyBottomBarSpacer = () => <div aria-hidden className="h-[calc(11.5rem+env(safe-area-inset-bottom))]" />;
