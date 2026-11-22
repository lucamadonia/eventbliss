/**
 * StatusNotice — sagt ehrlich, was mit den Einträgen dieses Spiels passiert:
 * lädt die App sie, oder liegen sie nur in der Datenbank?
 */
import { useTranslation } from 'react-i18next';
import { Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isLivePair, isPreparedPair } from './game-registry';

interface Props {
  appId: string;
  dbId: string;
  contentType: string;
}

export function StatusNotice({ appId, dbId, contentType }: Props) {
  const { t } = useTranslation();
  const live = isLivePair(appId, contentType);
  const prepared = isPreparedPair(appId, contentType);

  const lines: string[] = [];
  if (live) {
    lines.push(t('admin.games.notice.live', 'Die App lädt diese Einträge. Auf Geräten erscheinen Änderungen, sobald deren Zwischenspeicher abläuft – spätestens nach 24 Stunden.'));
    if (contentType === 'pantomime_word') {
      lines.push(t('admin.games.notice.pantomime', 'Der Grundstock an Begriffen steckt in der App. Hier pflegst du zusätzliche Begriffe; sie werden je Kategorie dazugemischt.'));
    }
  } else {
    lines.push(t('admin.games.notice.unused', 'Diese Einträge werden von der App derzeit nicht geladen.'));
    lines.push(prepared
      ? t('admin.games.notice.prepared', 'Der Lade-Code ist vorbereitet, das Spiel ruft ihn aber noch nicht auf – es spielt mit seinen fest eingebauten Inhalten. Pflegen lohnt sich erst, wenn das Spiel angeschlossen ist.')
      : t('admin.games.notice.static', 'Das Spiel liefert seine Inhalte mit der App aus. Bearbeiten ändert in der App nichts; neue Einträge lassen sich hier deshalb nicht anlegen.'));
    if (dbId !== appId) {
      lines.push(t('admin.games.notice.legacyId', 'Gespeichert unter der alten Kennung „{{id}}“.', { id: dbId }));
    }
  }

  const Icon = live ? Info : TriangleAlert;
  return (
    <div
      role="note"
      className={cn(
        'flex gap-3 rounded-2xl border p-3 text-sm',
        live ? 'border-primary/30 bg-primary/5' : 'bg-muted/40',
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', live ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
      <div className="min-w-0 space-y-1">
        {lines.map((line, i) => (
          <p key={line} className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>{line}</p>
        ))}
      </div>
    </div>
  );
}
