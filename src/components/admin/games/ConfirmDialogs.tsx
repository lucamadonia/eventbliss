/**
 * ConfirmDialogs — alle Rückfragen des Bereichs. Kein `window.confirm`.
 * Das Zurücksetzen eines Inhaltstyps verlangt das Eintippen des Spielnamens.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const destructive = cn(buttonVariants({ variant: 'destructive' }), 'h-11');

interface BaseProps {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ open, busy, count, onCancel, onConfirm }: BaseProps & { count: number }) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o && !busy) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count === 1
              ? t('admin.games.confirm.deleteOneTitle', 'Diesen Eintrag löschen?')
              : t('admin.games.confirm.deleteManyTitle', '{{n}} Einträge löschen?', { n: count })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.games.confirm.deleteText', 'Das Löschen lässt sich nicht rückgängig machen. Wenn du nur ausblenden willst, deaktiviere die Einträge stattdessen.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11" disabled={busy}>{t('admin.games.cancel', 'Abbrechen')}</AlertDialogCancel>
          <AlertDialogAction
            className={destructive}
            disabled={busy}
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
            {count === 1
              ? t('admin.games.confirm.deleteOne', 'Löschen')
              : t('admin.games.confirm.deleteMany', '{{n}} löschen', { n: count })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ResetConfirmDialog({
  open, busy, gameName, typeLabel, count, onCancel, onConfirm,
}: BaseProps & { gameName: string; typeLabel: string; count: number }) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');
  useEffect(() => { if (open) setTyped(''); }, [open]);
  const matches = typed.trim().toLowerCase() === gameName.trim().toLowerCase();

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o && !busy) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('admin.games.confirm.resetTitle', 'Alle {{n}} Einträge „{{type}}“ von {{game}} löschen?', {
              n: count, type: typeLabel, game: gameName,
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.games.confirm.resetText', 'Betroffen ist nur dieser eine Inhaltstyp dieses Spiels. Das Löschen lässt sich nicht rückgängig machen.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reset-confirm-name">
            {t('admin.games.confirm.resetLabel', 'Zur Bestätigung den Spielnamen eintippen: {{game}}', { game: gameName })}
          </Label>
          <Input
            id="reset-confirm-name"
            className="h-11"
            value={typed}
            autoComplete="off"
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11" disabled={busy}>{t('admin.games.cancel', 'Abbrechen')}</AlertDialogCancel>
          <AlertDialogAction
            className={destructive}
            disabled={!matches || busy}
            onClick={(e) => { e.preventDefault(); if (matches) onConfirm(); }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
            {t('admin.games.confirm.reset', 'Endgültig löschen')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DiscardChangesDialog({ open, onCancel, onConfirm }: BaseProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.games.confirm.discardTitle', 'Änderungen verwerfen?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.games.confirm.discardText', 'Du hast ungespeicherte Änderungen. Wenn du schließt, gehen sie verloren.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">{t('admin.games.confirm.keepEditing', 'Weiter bearbeiten')}</AlertDialogCancel>
          <AlertDialogAction className={destructive} onClick={onConfirm}>
            {t('admin.games.confirm.discard', 'Verwerfen')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
