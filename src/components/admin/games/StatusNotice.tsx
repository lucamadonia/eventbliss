/**
 * StatusNotice — sagt ehrlich, was mit den Einträgen dieses Spiels passiert:
 * lädt die App sie, oder liegen sie nur in der Datenbank?
 */
import { useTranslation } from 'react-i18next';
import { Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isLivePair } from './game-registry';

interface Props {
  appId: string;
  dbId: string;
  contentType: string;
}

export function StatusNotice({ appId, dbId, contentType }: Props) {
  const { t } = useTranslation();
  const live = isLivePair(appId, contentType);

  const lines: string[] = [];
  if (live) {
    lines.push(t('admin.games.notice.live', 'Die App lädt diese Einträge. Änderungen erscheinen auf Geräten beim nächsten Öffnen des Spiels, spätestens nach etwa fünf Minuten. Ohne Internet spielt die App mit dem zuletzt geladenen Stand.'));
    lines.push(t('admin.games.notice.additive', 'Der Grundstock steckt in der App und lässt sich hier nicht entfernen. Diese Einträge kommen dazu; was es im Grundstock schon gibt, zählt nur einmal. Ein Eintrag erscheint nur in den Sprachen, in denen er ausgefüllt ist.'));
    if (contentType === 'headup_word') {
      lines.push(t('admin.games.notice.headup', 'Trägt ein Eintrag den Namen einer eingebauten Kategorie, kommen seine Wörter dort dazu. Eine neue Kategorie erscheint ab 10 Wörtern.'));
    }
  } else {
    lines.push(t('admin.games.notice.unused', 'Diese Einträge werden von der App derzeit nicht geladen.'));
    lines.push(t('admin.games.notice.static', 'Das Spiel liefert seine Inhalte mit der App aus. Bearbeiten ändert in der App nichts; neue Einträge lassen sich hier deshalb nicht anlegen.'));
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
