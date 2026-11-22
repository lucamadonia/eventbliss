/**
 * ContentToolbar — klebende Such- und Filterleiste der Inhaltsliste.
 * "/" springt in die Suche. Aktive Filter sind hervorgehoben; ein Tipp setzt
 * alle zurück. Alle Filter wirken auf dem Server.
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download, FileUp, FilterX, Loader2, MoreHorizontal, PackagePlus, Plus, RotateCcw, Search, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LANGS, difficultiesFor, usesDifficulty } from './field-configs';
import { EMPTY_FILTERS, activeFilterCount, type ListFilters } from './list-filters';
import type { ActiveFilter } from './query-builder';

interface Props {
  contentType: string;
  filters: ListFilters;
  onChange: (next: ListFilters) => void;
  /** Der getippte Text — die Suche selbst läuft entprellt über `filters.search`. */
  searchInput: string;
  onSearchInput: (value: string) => void;
  fetching: boolean;
  viewLang: string;
  onViewLang: (lang: string) => void;
  categories: string[];
  stickyTop: number | string;
  canCreate: boolean;
  canSeed: boolean;
  hasRows: boolean;
  onCreate: () => void;
  onImport: () => void;
  onTemplate: () => void;
  onSeed: () => void;
  onReset: () => void;
}

const ALL = '__all__';
const PILL = 'h-11 w-auto shrink-0 gap-2 rounded-full transition-colors motion-reduce:transition-none';
const PILL_ON = 'border-primary bg-primary/10 text-foreground';

export function ContentToolbar(p: Props) {
  const { t } = useTranslation();
  const searchRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<ListFilters>) => p.onChange({ ...p.filters, ...patch });
  const pick = (v: string) => (v === ALL ? '' : v);
  const showMenu = p.canCreate || p.canSeed || p.hasRows;
  const activeCount = activeFilterCount({ ...p.filters, search: p.searchInput });

  // "/" springt in die Suche — außer man tippt gerade irgendwo oder ein Dialog ist offen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector('[role="dialog"],[role="alertdialog"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="sticky z-20 -mx-4 space-y-2 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ top: p.stickyTop }}
    >
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          {p.fetching
            ? <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden />
            : <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />}
          <Input
            ref={searchRef}
            type="search"
            enterKeyHint="search"
            value={p.searchInput}
            onChange={(e) => p.onSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape' && p.searchInput) { e.stopPropagation(); p.onSearchInput(''); } }}
            placeholder={t('admin.games.toolbar.search', 'Inhalte durchsuchen …')}
            aria-label={t('admin.games.toolbar.search', 'Inhalte durchsuchen …')}
            aria-keyshortcuts="/"
            className="h-11 rounded-full pl-9 pr-11 [&::-webkit-search-cancel-button]:hidden"
          />
          {p.searchInput ? (
            <button
              type="button"
              onClick={() => { p.onSearchInput(''); searchRef.current?.focus(); }}
              aria-label={t('admin.games.clearSearch', 'Suche leeren')}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 text-xs text-muted-foreground md:block" aria-hidden>/</kbd>
          )}
        </div>
        {p.canCreate && (
          <Button className="h-11 shrink-0 rounded-full" onClick={p.onCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.games.toolbar.new', 'Neuer Eintrag')}</span>
            <span className="sm:hidden">{t('admin.games.toolbar.newShort', 'Neu')}</span>
          </Button>
        )}
        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full"
                aria-label={t('admin.games.toolbar.more', 'Weitere Aktionen')}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {p.canCreate && (
                <>
                  <DropdownMenuItem className="min-h-11" onSelect={p.onImport}>
                    <FileUp className="mr-2 h-4 w-4" />
                    {t('admin.games.toolbar.import', 'Importieren (CSV / JSON)')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="min-h-11" onSelect={p.onTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('admin.games.toolbar.template', 'CSV-Vorlage herunterladen')}
                  </DropdownMenuItem>
                </>
              )}
              {p.canSeed && (
                <DropdownMenuItem className="min-h-11" onSelect={p.onSeed}>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  {t('admin.games.toolbar.seed', 'Fehlende Standardinhalte ergänzen')}
                </DropdownMenuItem>
              )}
              {p.hasRows && (
                <>
                  {(p.canCreate || p.canSeed) && <DropdownMenuSeparator />}
                  <DropdownMenuItem className="min-h-11 text-destructive focus:text-destructive" onSelect={p.onReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('admin.games.toolbar.reset', 'Alle Einträge dieses Typs löschen …')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {activeCount > 0 && (
          <Button
            variant="secondary"
            className="h-11 shrink-0 rounded-full"
            onClick={() => { p.onSearchInput(''); p.onChange(EMPTY_FILTERS); }}
          >
            <FilterX className="h-4 w-4" />
            {t('admin.games.toolbar.resetCount', 'Filter zurücksetzen ({{n}})', { n: activeCount })}
          </Button>
        )}

        <Select value={p.filters.active} onValueChange={(v) => set({ active: v as ActiveFilter })}>
          <SelectTrigger
            className={cn(PILL, p.filters.active !== 'all' && PILL_ON)}
            aria-label={t('admin.games.toolbar.state', 'Status')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.games.toolbar.stateAll', 'Aktiv + inaktiv')}</SelectItem>
            <SelectItem value="active">{t('admin.games.toolbar.stateActive', 'Nur aktive')}</SelectItem>
            <SelectItem value="inactive">{t('admin.games.toolbar.stateInactive', 'Nur inaktive')}</SelectItem>
          </SelectContent>
        </Select>

        {usesDifficulty(p.contentType) && (
          <Select value={p.filters.difficulty || ALL} onValueChange={(v) => set({ difficulty: pick(v) })}>
            <SelectTrigger
              className={cn(PILL, p.filters.difficulty && PILL_ON)}
              aria-label={t('admin.games.toolbar.difficulty', 'Schwierigkeit')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('admin.games.toolbar.difficultyAll', 'Jede Schwierigkeit')}</SelectItem>
              {difficultiesFor(p.contentType).map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={p.filters.category || ALL} onValueChange={(v) => set({ category: pick(v) })}>
          <SelectTrigger
            className={cn(PILL, 'max-w-[14rem]', p.filters.category && PILL_ON)}
            aria-label={t('admin.games.toolbar.category', 'Kategorie')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('admin.games.toolbar.categoryAll', 'Jede Kategorie')}</SelectItem>
            {/* Eine Kategorie aus der URL, die es (noch) nicht in der Liste gibt, bleibt wählbar. */}
            {[...new Set([...(p.filters.category ? [p.filters.category] : []), ...p.categories])].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={p.filters.missingLang || ALL} onValueChange={(v) => set({ missingLang: pick(v) })}>
          <SelectTrigger
            className={cn(PILL, p.filters.missingLang && PILL_ON)}
            aria-label={t('admin.games.toolbar.missing', 'Sprache fehlt')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('admin.games.toolbar.missingAll', 'Übersetzung egal')}</SelectItem>
            {LANGS.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {t('admin.games.toolbar.missingLang', '{{lang}} fehlt', { lang: `${l.flag} ${l.name}` })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="mx-1 w-px shrink-0 self-stretch bg-border" aria-hidden />

        <Select value={p.viewLang} onValueChange={p.onViewLang}>
          <SelectTrigger className={PILL} aria-label={t('admin.games.toolbar.viewLang', 'Anzeigesprache')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
