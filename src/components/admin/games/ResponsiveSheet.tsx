/**
 * ResponsiveSheet — ein Blatt für Editor und Import: rechts am Desktop, von
 * unten am Handy. Am Handy mit Ziehgriff (nach unten ziehen schließt — über
 * denselben Weg wie Esc, also mit Rückfrage bei ungespeicherten Änderungen)
 * und fester Fußzeile über dem sicheren Bereich.
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  /** Wird bei Esc, Klick daneben, X und Herunterziehen aufgerufen. */
  onRequestClose: () => void;
  title: string;
  description: string;
  /** Zwischen Kopf und Inhalt, z. B. Sprach-Reiter oder Schritte. */
  subheader?: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Element, das beim Öffnen den Fokus bekommt. */
  initialFocus?: React.RefObject<HTMLElement>;
}

const CLOSE_DISTANCE = 96;

export function ResponsiveSheet(p: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const start = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  const endDrag = () => {
    if (start.current === null) return;
    start.current = null;
    const far = drag > CLOSE_DISTANCE;
    setDrag(0);
    if (far) p.onRequestClose();
  };

  return (
    <Sheet open={p.open} onOpenChange={(o) => { if (!o) p.onRequestClose(); }}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        onKeyDown={p.onKeyDown}
        onOpenAutoFocus={(e) => {
          if (p.initialFocus?.current) { e.preventDefault(); p.initialFocus.current.focus(); }
        }}
        style={drag > 0 ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
        className={cn(
          'flex flex-col gap-0 p-0 data-[state=closed]:duration-200 data-[state=open]:duration-200 motion-reduce:animate-none',
          isMobile ? 'h-[92dvh] rounded-t-3xl' : 'w-full sm:max-w-xl',
        )}
      >
        {isMobile && (
          <div
            role="button"
            tabIndex={-1}
            aria-label={t('admin.games.sheet.dragClose', 'Nach unten ziehen zum Schließen')}
            className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            onPointerDown={(e) => { start.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current)); }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
          </div>
        )}
        <SheetHeader className={cn('border-b px-4 pb-4 pr-12 text-left', isMobile ? 'pt-1' : 'pt-4')}>
          <SheetTitle>{p.title}</SheetTitle>
          <SheetDescription>{p.description}</SheetDescription>
        </SheetHeader>
        {p.subheader}
        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">{p.children}</div>
        <div className="flex gap-2 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {p.footer}
        </div>
      </SheetContent>
    </Sheet>
  );
}
