/**
 * GameDetail — die Inhalte EINES Spiels: Typ-Reiter, Suche/Filter (Server,
 * Zustand in der URL), Liste, Mehrfachauswahl, Editor, Import,
 * Standardinhalte, Zurücksetzen.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, PackagePlus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  useContentCategories, useContentCounts, useContentPage, type GameContentRow,
} from '@/hooks/useGameContent';
import { hasDefaultContent } from '@/pages/admin/seedGameContent';
import { BulkBar } from './BulkBar';
import { DeleteConfirmDialog, ResetConfirmDialog } from './ConfirmDialogs';
import { ContentEditorSheet, type EditorTarget } from './ContentEditorSheet';
import { ContentList } from './ContentList';
import { ContentToolbar } from './ContentToolbar';
import { ImportSheet } from './ImportSheet';
import { SeedDefaultsDialog } from './SeedDefaultsDialog';
import { StatusBadge } from './StatusBadge';
import { StatusNotice } from './StatusNotice';
import { BASE_LANG, searchableFieldKeys, typeLabel } from './field-configs';
import { allContentPairs, canCreateContent, contentTypesForApp, pairKey, type HubGame } from './game-registry';
import { buildTemplateCsv } from './import-rows';
import {
  EMPTY_FILTERS, hasActiveFilters, listStateFromParams, listStateToParams, type ListFilters, type ListState,
} from './list-filters';
import { DEFAULT_PAGE_SIZE, pageCount, type ContentQueryParams } from './query-builder';
import { useContentActions } from './useContentActions';

interface Props {
  hub: HubGame;
  /** Inhaltstyp aus der URL (`?type=`); ungültige Werte fallen auf den ersten Typ zurück. */
  typeParam: string | null;
  onTypeChange: (type: string) => void;
  stickyTop: number | string;
}

const PAIRS = allContentPairs();
const NO_SELECTION: ReadonlySet<string> = new Set();

export function GameDetail({ hub, typeParam, onTypeChange, stickyTop }: Props) {
  const { t } = useTranslation();
  const { game, dbId, status } = hub;
  const gameName = t(game.nameKey, game.id);
  const types = contentTypesForApp(game.id);
  const contentType = typeParam && types.includes(typeParam) ? typeParam : types[0] ?? '';
  const hasType = contentType !== '';

  // Filter, Anzeigesprache und Seite leben in der URL (teilbar, Neuladen-fest).
  const [urlParams, setUrlParams] = useSearchParams();
  const listState = useMemo(() => listStateFromParams(urlParams), [urlParams]);
  const { filters, viewLang, page } = listState;
  const writeState = (patch: Partial<ListState>) => {
    setUrlParams((prev) => listStateToParams(prev, { ...listStateFromParams(prev), ...patch }), { replace: true });
  };

  const [searchInput, setSearchInput] = useState(filters.search);
  const [selected, setSelected] = useState<ReadonlySet<string>>(NO_SELECTION);
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  const changeFilters = (next: ListFilters) => { setSelected(NO_SELECTION); writeState({ filters: next, page: 0 }); };
  const goToPage = (next: number) => { setSelected(NO_SELECTION); writeState({ page: next }); };

  // Suche entprellen: erst 300 ms nach dem letzten Tastendruck geht sie an den Server.
  useEffect(() => {
    if (searchInput.trim() === filters.search) return;
    const id = window.setTimeout(() => changeFilters({ ...filters, search: searchInput.trim() }), 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur die Eingabe löst aus
  }, [searchInput]);
  // Von außen geändert (Zurücksetzen, Zurück-Taste): Eingabefeld nachziehen.
  useEffect(() => { setSearchInput((cur) => (cur.trim() === filters.search ? cur : filters.search)); }, [filters.search]);
  useEffect(() => { setSelected(NO_SELECTION); }, [dbId, contentType]);

  const params: ContentQueryParams = useMemo(() => ({
    dbGameId: dbId,
    contentType,
    search: filters.search,
    searchLangs: [...new Set([viewLang, BASE_LANG])],
    searchFields: searchableFieldKeys(contentType),
    difficulty: filters.difficulty,
    category: filters.category,
    active: filters.active,
    missingLang: filters.missingLang,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  }), [dbId, contentType, viewLang, filters, page]);

  const list = useContentPage(params, hasType);
  const counts = useContentCounts(PAIRS);
  const categories = useContentCategories(dbId, contentType, hasType);

  const loaded = useMemo(() => list.data?.rows ?? [], [list.data]);
  const actions = useContentActions(loaded);
  // Beim Wechsel des Typs zeigt React Query kurz die alte Seite als Platzhalter — die gehört nicht hierher.
  const foreign = list.isPlaceholderData && loaded.some((r) => r.game_id !== dbId || r.content_type !== contentType);
  const rows = useMemo(
    () => loaded.map((r) => (r.id in actions.overrides ? { ...r, is_active: actions.overrides[r.id] } : r)),
    [loaded, actions.overrides],
  );
  const total = list.data?.total ?? 0;
  const pages = pageCount(total);
  const typeTotal = counts.data?.byPair[pairKey(dbId, contentType)] ?? 0;
  const canCreate = hasType && canCreateContent(game.id, contentType);
  const canSeed = hasType && hasDefaultContent(game.id, contentType);
  const filtered = hasActiveFilters(filters);

  // Hinter der letzten Seite gelandet (z. B. nach dem Löschen): zurück auf eine gültige.
  useEffect(() => {
    if (page === 0) return;
    if (list.isError) goToPage(0);
    else if (list.data && !list.isPlaceholderData && page > pages - 1) goToPage(pages - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reagiert nur auf das Ladeergebnis
  }, [list.isError, list.data, list.isPlaceholderData, page, pages]);

  const toggleSelect = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const togglePage = () => setSelected(allOnPage ? NO_SELECTION : new Set(rows.map((r) => r.id)));

  const bulkSetActive = (isActive: boolean) => {
    const ids = [...selected];
    setSelected(NO_SELECTION);
    void actions.setActive(ids, isActive);
  };
  const confirmDelete = async () => {
    if (deleteIds && await actions.remove(deleteIds)) { setSelected(NO_SELECTION); setDeleteIds(null); }
  };
  const confirmReset = async () => {
    const done = t('admin.games.resetDone', 'Alle Einträge „{{type}}“ von {{game}} gelöscht', {
      type: typeLabel(contentType), game: gameName,
    });
    if (await actions.resetPair(dbId, contentType, done)) { setResetOpen(false); setSelected(NO_SELECTION); goToPage(0); }
  };

  const downloadTemplate = () => {
    const blob = new Blob([buildTemplateCsv(contentType)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.id}-${contentType}-vorlage.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const afterWrite = () => { setEditor(null); setSeedOpen(false); void actions.invalidate(); };
  const createButton = (
    <Button className="h-11 rounded-full" onClick={() => setEditor({ mode: 'create' })}>
      <Plus className="h-4 w-4" />
      {t('admin.games.toolbar.new', 'Neuer Eintrag')}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <img src={game.image} alt="" className="h-16 w-16 shrink-0 rounded-2xl bg-muted object-cover shadow-sm" />
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold tracking-tight">{gameName}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <Badge variant={game.tier === 'premium' ? 'default' : 'secondary'}>
              {game.tier === 'premium' ? t('admin.games.tier.premium', 'Premium') : t('admin.games.tier.free', 'Gratis')}
            </Badge>
          </div>
        </div>
      </div>

      {!hasType ? (
        <div className="rounded-3xl border border-dashed p-10 text-center">
          <p className="font-medium">{t('admin.games.detail.noContentTitle', 'Hier gibt es nichts zu bearbeiten')}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t('admin.games.detail.noContentText', 'Dieses Spiel liefert seine Inhalte vollständig mit der App aus und hat keine Einträge in der Datenbank.')}
          </p>
        </div>
      ) : (
        <>
          {types.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]" role="tablist">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={type === contentType}
                  onClick={() => onTypeChange(type)}
                  className={cn(
                    'h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                    type === contentType ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {typeLabel(type)}
                  <span className="ml-2 tabular-nums opacity-80">{counts.data?.byPair[pairKey(dbId, type)] ?? '–'}</span>
                </button>
              ))}
            </div>
          )}

          <StatusNotice appId={game.id} dbId={dbId} contentType={contentType} />

          <ContentToolbar
            contentType={contentType}
            filters={filters}
            onChange={changeFilters}
            searchInput={searchInput}
            onSearchInput={setSearchInput}
            fetching={list.isFetching && !list.isLoading}
            viewLang={viewLang}
            onViewLang={(lang) => writeState({ viewLang: lang })}
            categories={categories.data ?? []}
            stickyTop={stickyTop}
            canCreate={canCreate}
            canSeed={canSeed}
            hasRows={typeTotal > 0}
            onCreate={() => setEditor({ mode: 'create' })}
            onImport={() => setImportOpen(true)}
            onTemplate={downloadTemplate}
            onSeed={() => setSeedOpen(true)}
            onReset={() => setResetOpen(true)}
          />

          {/* Feste Höhe: die Zeile springt nicht, wenn Treffer kommen oder gehen. */}
          <div className="flex h-11 items-center gap-1">
            {rows.length > 0 && !list.isError && !foreign && (
              <>
                <label className="flex h-11 cursor-pointer items-center gap-3 pl-3 pr-2 text-sm">
                  <Checkbox checked={allOnPage} onCheckedChange={togglePage} />
                  {t('admin.games.list.selectPage', 'Seite auswählen')}
                </label>
                <span className="ml-auto text-sm tabular-nums text-muted-foreground" aria-live="polite">
                  {filtered
                    ? t('admin.games.list.totalFiltered', '{{n}} Treffer', { n: total })
                    : t('admin.games.list.total', '{{n}} Einträge', { n: total })}
                </span>
              </>
            )}
          </div>

          <ContentList
            rows={rows}
            contentType={contentType}
            viewLang={viewLang}
            loading={list.isLoading || foreign}
            fetching={list.isFetching}
            error={list.isError && page === 0 ? (list.error instanceof Error ? list.error.message : String(list.error)) : null}
            filtered={filtered}
            selected={selected}
            onRetry={() => list.refetch()}
            onResetFilters={() => { setSearchInput(''); changeFilters(EMPTY_FILTERS); }}
            onToggleSelect={toggleSelect}
            onToggleActive={(row: GameContentRow) => { void actions.setActive([row.id], row.is_active === false); }}
            onEdit={(row) => setEditor({ mode: 'edit', row })}
            onDuplicate={(row) => setEditor({ mode: 'duplicate', row })}
            onDelete={(row) => setDeleteIds([row.id])}
            emptyHint={canSeed
              ? t('admin.games.list.emptyHintSeed', 'Ergänze die Standardinhalte oder lege den ersten Eintrag an.')
              : canCreate
                ? t('admin.games.list.emptyHintCreate', 'Lege den ersten Eintrag an oder importiere eine Datei.')
                : t('admin.games.list.emptyText', 'Für diesen Inhaltstyp liegt nichts in der Datenbank.')}
            emptyAction={canCreate ? (
              <div className="flex flex-wrap justify-center gap-2">
                {canSeed && (
                  <Button variant="outline" className="h-11 rounded-full" onClick={() => setSeedOpen(true)}>
                    <PackagePlus className="h-4 w-4" />
                    {t('admin.games.toolbar.seed', 'Fehlende Standardinhalte ergänzen')}
                  </Button>
                )}
                {createButton}
              </div>
            ) : undefined}
          />

          {pages > 1 && (
            <nav className="flex items-center justify-between gap-2" aria-label={t('admin.games.list.pagination', 'Seiten')}>
              <Button variant="outline" className="h-11 rounded-full" disabled={page === 0 || list.isFetching} onClick={() => goToPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
                {t('admin.games.list.prev', 'Zurück')}
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                {t('admin.games.list.pageOf', 'Seite {{page}} von {{pages}}', { page: page + 1, pages })}
              </span>
              <Button variant="outline" className="h-11 rounded-full" disabled={page >= pages - 1 || list.isFetching} onClick={() => goToPage(page + 1)}>
                {t('admin.games.list.next', 'Weiter')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          )}

          <BulkBar
            count={selected.size}
            busy={actions.busy}
            onActivate={() => bulkSetActive(true)}
            onDeactivate={() => bulkSetActive(false)}
            onDelete={() => setDeleteIds([...selected])}
            onClear={() => setSelected(NO_SELECTION)}
          />

          <ContentEditorSheet
            target={editor}
            dbGameId={dbId}
            contentType={contentType}
            knownCategories={categories.data ?? []}
            onClose={() => setEditor(null)}
            onSaved={afterWrite}
            onUndone={() => { void actions.invalidate(); }}
          />
          <ImportSheet
            open={importOpen}
            dbGameId={dbId}
            contentType={contentType}
            onClose={() => setImportOpen(false)}
            onWritten={() => { void actions.invalidate(); }}
          />
          <SeedDefaultsDialog
            open={seedOpen}
            appId={game.id}
            dbGameId={dbId}
            contentType={contentType}
            gameName={gameName}
            onClose={() => setSeedOpen(false)}
            onDone={afterWrite}
          />
          <DeleteConfirmDialog
            open={deleteIds !== null}
            count={deleteIds?.length ?? 0}
            busy={actions.busy}
            onCancel={() => setDeleteIds(null)}
            onConfirm={confirmDelete}
          />
          <ResetConfirmDialog
            open={resetOpen}
            gameName={gameName}
            typeLabel={typeLabel(contentType)}
            count={typeTotal}
            busy={actions.busy}
            onCancel={() => setResetOpen(false)}
            onConfirm={confirmReset}
          />
        </>
      )}
    </div>
  );
}
