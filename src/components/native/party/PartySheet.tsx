import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { Repeat2, Smartphone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NativeOverlayPortal } from '@/components/native/NativeOverlayPortal';
import { partyMotion } from '@/lib/party-motion';

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Footer stays visible above the home indicator while the body scrolls. */
  footer?: ReactNode;
  /** QA selector on the dialog (e.g. `kick-sheet`). */
  testId?: string;
}

/** Bottom sheet for the party flows: drag down, tap outside or Escape closes. */
export function PartySheet({ open, title, subtitle, onClose, children, footer, testId }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const drag = useDragControls();

  // Callers pass inline closures; a changing onClose must never re-run the focus effect
  // (that stole focus from inputs on every keystroke).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    // Focus the panel once on open, unless something inside already has focus.
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus?.(); };
  }, [open]);

  return (
    <NativeOverlayPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[130] flex items-end justify-center bg-[#05070d]/75 backdrop-blur-md"
            variants={partyMotion('scrimFade', reduced)} initial="initial" animate="animate" exit="exit"
            onClick={onClose}
          >
            <motion.div
              ref={panel}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid={testId}
              className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-white/10 bg-[#0e0d1a] text-white shadow-[0_-24px_80px_rgba(0,0,0,.6)] outline-none"
              variants={partyMotion('sheetEnter', reduced)} initial="initial" animate="animate" exit="exit"
              drag={reduced ? false : 'y'}
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
              onClick={event => event.stopPropagation()}
            >
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(223,142,255,.18),transparent_70%)]" />
              <div className="touch-none" onPointerDown={event => drag.start(event)}>
                <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-white/20" />
                <header className="relative flex items-start gap-3 px-5 pb-3 pt-3">
                  <div className="min-w-0 flex-1">
                    <h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2>
                    {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
                  </div>
                  <button type="button" onClick={onClose} aria-label={t('partyPlay.close', 'Schließen')}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[.06] text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:scale-95 active:bg-white/10">
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </header>
              </div>
              <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
              {footer && <footer className="relative border-t border-white/[.06] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">{footer}</footer>}
              {!footer && <div className="h-[env(safe-area-inset-bottom)]" />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </NativeOverlayPortal>
  );
}

/** Round avatar bubble in the player's colour — the same look the TV uses. */
export function SeatAvatar({ avatar, color, size = 44, dimmed = false }: { avatar: string; color: string; size?: number; dimmed?: boolean }) {
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, fontSize: size * 0.5, background: `radial-gradient(circle at 30% 25%, ${color}55, ${color}22)`, boxShadow: `inset 0 0 0 2px ${color}${dimmed ? '40' : 'aa'}`, opacity: dimmed ? 0.55 : 1 }}>
      {avatar}
    </span>
  );
}

/** 📱/🔁 as icons: emoji at small sizes render as a keypad grid on Android/Windows. */
export function SeatIcon({ guest, className = 'h-3 w-3' }: { guest: boolean; className?: string }) {
  return guest
    ? <Repeat2 className={`${className} shrink-0 text-[#df8eff]`} aria-hidden />
    : <Smartphone className={`${className} shrink-0`} aria-hidden />;
}
