import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  count: number;
  busy: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onClear: () => void;
}

/** Klebt am unteren Rand, solange Einträge ausgewählt sind. */
export function BulkBar({ count, busy, onActivate, onDeactivate, onDelete, onClear }: Props) {
  const { t } = useTranslation();
  if (count === 0) return null;
  return (
    <div
      role="toolbar"
      aria-label={t('admin.games.bulk.label', 'Aktionen für die Auswahl')}
      className="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex w-full max-w-xl items-center gap-1 rounded-full border bg-card p-1.5 shadow-lg duration-200 animate-in fade-in slide-in-from-bottom-4 motion-reduce:animate-none"
    >
      <Button
        variant="ghost" size="icon" className="h-11 w-11 shrink-0 rounded-full"
        onClick={onClear} disabled={busy}
        aria-label={t('admin.games.bulk.clear', 'Auswahl aufheben')}
      >
        <X className="h-4 w-4" />
      </Button>
      <span className="min-w-0 flex-1 truncate text-sm font-medium" aria-live="polite">
        {busy && <Loader2 className="mr-1 inline h-4 w-4 animate-spin motion-reduce:animate-none" />}
        {t('admin.games.bulk.count', '{{n}} ausgewählt', { n: count })}
      </span>
      <Button variant="ghost" className="h-11 rounded-full px-3" onClick={onActivate} disabled={busy}>
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">{t('admin.games.bulk.activate', 'Aktivieren')}</span>
        <span className="sr-only sm:hidden">{t('admin.games.bulk.activate', 'Aktivieren')}</span>
      </Button>
      <Button variant="ghost" className="h-11 rounded-full px-3" onClick={onDeactivate} disabled={busy}>
        <EyeOff className="h-4 w-4" />
        <span className="hidden sm:inline">{t('admin.games.bulk.deactivate', 'Deaktivieren')}</span>
        <span className="sr-only sm:hidden">{t('admin.games.bulk.deactivate', 'Deaktivieren')}</span>
      </Button>
      <Button variant="ghost" className="h-11 rounded-full px-3 text-destructive hover:text-destructive" onClick={onDelete} disabled={busy}>
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">{t('admin.games.bulk.delete', 'Löschen')}</span>
        <span className="sr-only sm:hidden">{t('admin.games.bulk.delete', 'Löschen')}</span>
      </Button>
    </div>
  );
}
