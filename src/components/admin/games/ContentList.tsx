/**
 * ContentList — die Einträge einer Seite. Der Text führt, Metadaten stehen
 * leise darunter. Aktionen sind immer sichtbar und daumengroß (kein Hover
 * nötig); der Aktiv-Schalter wirkt sofort.
 */
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Copy, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { GameContentRow } from '@/hooks/useGameContent';
import {
  LANGS, asText, difficultyLabel, difficultyTone, fieldsFor, langCoverage, previewText, usesDifficulty,
} from './field-configs';

interface Props {
  rows: GameContentRow[];
  contentType: string;
  viewLang: string;
  loading: boolean;
  /** Lädt im Hintergrund nach (Suche, Blättern): Liste bleibt stehen und wird nur blasser. */
  fetching: boolean;
  error: string | null;
  filtered: boolean;
  selected: ReadonlySet<string>;
  onRetry: () => void;
  onResetFilters: () => void;
  onToggleSelect: (id: string) => void;
  onToggleActive: (row: GameContentRow) => void;
  onEdit: (row: GameContentRow) => void;
  onDuplicate: (row: GameContentRow) => void;
  onDelete: (row: GameContentRow) => void;
  emptyHint: string;
  emptyAction?: React.ReactNode;
}

const ROW = 'rounded-2xl border bg-card p-3';

export function ContentList(props: Props) {
  const { t } = useTranslation();
  const { rows, loading, error } = props;

  if (loading) {
    // Gleicher Aufbau wie eine echte Zeile, damit beim Laden nichts springt.
    return (
      <ul className="space-y-2" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className={ROW}>
            <div className="flex items-start gap-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center"><Skeleton className="h-4 w-4 rounded" /></div>
              <div className="min-w-0 flex-1 space-y-2 py-1.5">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="flex h-11 items-center pl-1"><Skeleton className="h-6 w-11 rounded-full" /></div>
            </div>
            <div className="mt-1 flex h-11 items-center gap-2 pl-12">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-2 w-28 rounded-full" />
              <Skeleton className="ml-auto h-8 w-28 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-8 text-center" role="alert">
        <AlertTriangle className="mx-auto h-6 w-6 text-destructive" aria-hidden />
        <p className="mt-2 font-medium">{t('admin.games.list.errorTitle', 'Die Einträge konnten nicht geladen werden')}</p>
        <p className="mt-1 break-words text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4 h-11 rounded-full" onClick={props.onRetry}>
          <RefreshCw className="h-4 w-4" />
          {t('admin.games.retry', 'Erneut versuchen')}
        </Button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed px-6 py-12 text-center">
        <p className="text-lg font-semibold tracking-tight">
          {props.filtered
            ? t('admin.games.list.noMatchTitle', 'Keine Treffer')
            : t('admin.games.list.emptyTitle', 'Noch keine Einträge')}
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {props.filtered
            ? t('admin.games.list.noMatchText', 'Für diese Suche und Filter gibt es keine Einträge.')
            : props.emptyHint}
        </p>
        <div className="mt-5 flex justify-center">
          {props.filtered
            ? (
              <Button variant="outline" className="h-11 rounded-full" onClick={props.onResetFilters}>
                {t('admin.games.resetFilters', 'Filter zurücksetzen')}
              </Button>
            )
            : props.emptyAction}
        </div>
      </div>
    );
  }

  return (
    <ul
      className={cn('space-y-2 transition-opacity duration-200 motion-reduce:transition-none', props.fetching && 'opacity-60')}
      aria-busy={props.fetching}
    >
      {rows.map((row) => (
        <ContentRow key={row.id} row={row} {...props} />
      ))}
    </ul>
  );
}

function ContentRow({ row, ...p }: Props & { row: GameContentRow }) {
  const { t } = useTranslation();
  const isSelected = p.selected.has(row.id);
  const active = row.is_active !== false;
  const title = previewText(p.contentType, row.content, p.viewLang);
  const coverage = langCoverage(p.contentType, row.content);
  const filled = LANGS.filter((l) => coverage[l.code]);
  const missing = LANGS.filter((l) => !coverage[l.code]);
  const inViewLang = coverage[p.viewLang];

  const data = row.content?.[p.viewLang] ?? row.content?.de ?? {};
  const secondary = fieldsFor(p.contentType)
    .filter((f) => f.type !== 'select')
    .map((f) => asText(data[f.key]).trim())
    .filter((v) => v !== '' && v !== title)
    .join(' · ');

  const coverageLabel = missing.length === 0
    ? t('admin.games.list.coverageFull', 'Alle {{total}} Sprachen gefüllt', { total: LANGS.length })
    : t('admin.games.list.coverageMissing', '{{n}} von {{total}} Sprachen gefüllt – es fehlen: {{langs}}', {
      n: filled.length, total: LANGS.length, langs: missing.map((l) => l.name).join(', '),
    });

  return (
    <li
      className={cn(
        ROW,
        'transition-colors duration-150 motion-reduce:transition-none',
        isSelected && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex items-start gap-1">
        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => p.onToggleSelect(row.id)}
            aria-label={t('admin.games.list.select', 'Eintrag auswählen')}
          />
        </label>
        <div className={cn('min-w-0 flex-1 py-1.5 transition-opacity duration-150 motion-reduce:transition-none', !active && 'opacity-55')}>
          <p className="break-words text-base font-semibold leading-snug tracking-tight" dir="auto">
            {title || <span className="font-normal text-muted-foreground">{t('admin.games.list.noText', '(ohne Text)')}</span>}
          </p>
          {secondary && (
            <p className="mt-0.5 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground" dir="auto">{secondary}</p>
          )}
          {!inViewLang && title && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('admin.games.list.fallbackLang', 'In dieser Sprache leer – gezeigt wird eine andere Sprache.')}
            </p>
          )}
        </div>
        <div className="flex h-11 shrink-0 items-center pl-1">
          <Switch
            checked={active}
            onCheckedChange={() => p.onToggleActive(row)}
            aria-label={active
              ? t('admin.games.list.deactivate', 'Deaktivieren')
              : t('admin.games.list.activate', 'Aktivieren')}
          />
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-12">
        {row.category && (
          <span className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">{row.category}</span>
        )}
        {usesDifficulty(p.contentType) && row.difficulty && (
          <span className={cn('rounded-full border px-2 py-0.5 text-xs', difficultyTone(row.difficulty))}>
            {difficultyLabel(row.difficulty)}
          </span>
        )}
        {!active && (
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            {t('admin.games.list.inactive', 'Inaktiv')}
          </span>
        )}
        <span className="flex items-center gap-[3px] py-2" role="img" aria-label={coverageLabel} title={coverageLabel}>
          {LANGS.map((l) => (
            <span
              key={l.code}
              title={`${l.flag} ${l.name}: ${coverage[l.code]
                ? t('admin.games.list.langFilled', 'gefüllt')
                : t('admin.games.list.langEmpty', 'leer')}`}
              className={cn(
                'h-2 w-2 rounded-full border',
                coverage[l.code] ? 'border-primary bg-primary' : 'border-muted-foreground/50 bg-transparent',
              )}
            />
          ))}
          <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">{filled.length}/{LANGS.length}</span>
        </span>

        <span className="ml-auto flex items-center">
          <Button
            variant="ghost" size="icon" className="h-11 w-11 rounded-full"
            onClick={() => p.onEdit(row)}
            aria-label={t('admin.games.list.edit', 'Bearbeiten')}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-11 w-11 rounded-full"
            onClick={() => p.onDuplicate(row)}
            aria-label={t('admin.games.list.duplicate', 'Duplizieren')}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-11 w-11 rounded-full text-destructive hover:text-destructive"
            onClick={() => p.onDelete(row)}
            aria-label={t('admin.games.list.delete', 'Löschen')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      </div>
    </li>
  );
}
