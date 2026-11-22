/**
 * GamesHub — alle Spiele der App mit ehrlichem Status:
 * "Live bearbeitbar" (die App liest die Datenbank), "Eigener Editor"
 * (eigene Tabelle, eigene Seite) oder "Fest in der App" (Inhalte im Code).
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowUpRight, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useContentCounts } from '@/hooks/useGameContent';
import {
  EDITOR_ROUTES, allContentPairs, buildHubGames, contentTypesForApp, filterHubGames, pairKey,
  type GameStatus, type HubFilter, type HubGame,
} from './game-registry';
import { StatusBadge } from './StatusBadge';

interface Props {
  onOpenGame: (appId: string) => void;
  onOpenEditor: (path: string) => void;
  /** Abstand der klebenden Suchleiste nach oben (Höhe der Seitenkopfzeile). */
  stickyTop: number | string;
}

const HUB_GAMES = buildHubGames();
const PAIRS = allContentPairs();

export function GamesHub({ onOpenGame, onOpenEditor, stickyTop }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<HubFilter>({ query: '', status: 'all', tier: 'all' });
  const counts = useContentCounts(PAIRS);

  const visible = useMemo(
    () => filterHubGames(HUB_GAMES, filter, (g) => t(g.nameKey, g.id)),
    [filter, t],
  );

  const countFor = (h: HubGame): number | null => {
    if (!counts.data || h.status === 'editor') return null;
    return contentTypesForApp(h.game.id)
      .reduce((sum, type) => sum + (counts.data.byPair[pairKey(h.dbId, type)] ?? 0), 0);
  };

  const known = counts.data ? Object.values(counts.data.byPair).reduce((a, b) => a + b, 0) : 0;
  const orphaned = counts.data ? Math.max(0, counts.data.total - known) : 0;

  const statusChips: { value: GameStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('admin.games.hub.filterAll', 'Alle') },
    { value: 'live', label: t('admin.games.status.live', 'Live bearbeitbar') },
    { value: 'editor', label: t('admin.games.status.editor', 'Eigener Editor') },
    { value: 'static', label: t('admin.games.status.static', 'Fest in der App') },
  ];
  const tierChips: { value: HubFilter['tier']; label: string }[] = [
    { value: 'free', label: t('admin.games.tier.free', 'Gratis') },
    { value: 'premium', label: t('admin.games.tier.premium', 'Premium') },
  ];

  const liveGames = HUB_GAMES.filter((h) => h.status === 'live').length;

  return (
    <div className="space-y-4">
      <header className="space-y-2 pt-2">
        <h2 className="text-3xl font-semibold tracking-tight">{t('admin.games.title', 'Games Content')}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t('admin.games.intro', 'Alle Spiele der App. Der Status zeigt, ob die App ihre Inhalte aus der Datenbank lädt, ob es einen eigenen Editor gibt oder ob die Inhalte fest im App-Code liegen.')}
        </p>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm">
          <Total label={t('admin.games.hub.totalGames', 'Spiele')} value={HUB_GAMES.length} />
          <Total label={t('admin.games.status.live', 'Live bearbeitbar')} value={liveGames} />
          <Total label={t('admin.games.hub.totalEntries', 'Einträge in der Datenbank')} value={counts.data?.total ?? null} />
        </dl>
      </header>

      <div
        className="sticky z-20 -mx-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ top: stickyTop }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            placeholder={t('admin.games.hub.search', 'Spiel suchen …')}
            aria-label={t('admin.games.hub.search', 'Spiel suchen …')}
            className="h-11 rounded-full pl-9 pr-11"
          />
          {filter.query && (
            <button
              type="button"
              onClick={() => setFilter((f) => ({ ...f, query: '' }))}
              aria-label={t('admin.games.clearSearch', 'Suche leeren')}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {statusChips.map((c) => (
            <Chip
              key={c.value}
              active={filter.status === c.value}
              onClick={() => setFilter((f) => ({ ...f, status: c.value }))}
            >
              {c.label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 self-stretch bg-border" aria-hidden />
          {tierChips.map((c) => (
            <Chip
              key={c.value}
              active={filter.tier === c.value}
              onClick={() => setFilter((f) => ({ ...f, tier: f.tier === c.value ? 'all' : c.value }))}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {counts.isError && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <span className="min-w-0 flex-1">
            {t('admin.games.hub.countError', 'Die Anzahl der Einträge konnte nicht geladen werden.')}
          </span>
          <Button variant="outline" size="sm" className="h-11" onClick={() => counts.refetch()}>
            <RefreshCw className="h-4 w-4" />
            {t('admin.games.retry', 'Erneut versuchen')}
          </Button>
        </div>
      )}

      {orphaned > 0 && (
        <p className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
          {t(
            'admin.games.hub.orphaned',
            '{{n}} Einträge in der Datenbank gehören zu keinem Spiel dieser Liste und werden hier nicht angezeigt.',
            { n: orphaned },
          )}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">{t('admin.games.hub.emptyTitle', 'Kein Spiel gefunden')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('admin.games.hub.emptyText', 'Ändere die Suche oder setze die Filter zurück.')}
          </p>
          <Button
            variant="outline"
            className="mt-4 h-11"
            onClick={() => setFilter({ query: '', status: 'all', tier: 'all' })}
          >
            {t('admin.games.resetFilters', 'Filter zurücksetzen')}
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((h) => (
            <li key={h.game.id}>
              <GameCard
                hub={h}
                count={countFor(h)}
                loading={counts.isLoading}
                onOpen={() => {
                  const editor = EDITOR_ROUTES[h.game.id];
                  if (editor) onOpenEditor(editor.path);
                  else onOpenGame(h.game.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function GameCard({ hub, count, loading, onOpen }: {
  hub: HubGame;
  count: number | null;
  loading: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { game, status } = hub;
  const editor = EDITOR_ROUTES[game.id];

  let detail: string;
  if (editor) detail = t(editor.labelKey, editor.label);
  else if (count === null) detail = '';
  else if (count > 0 && status === 'static') {
    detail = t('admin.games.hub.countUnused', '{{n}} Einträge · von der App nicht geladen', { n: count });
  } else if (count > 0) detail = t('admin.games.hub.count', '{{n}} Einträge', { n: count });
  else if (status === 'live') detail = t('admin.games.hub.countNone', 'Noch keine Einträge');
  else detail = t('admin.games.hub.inCode', 'Inhalte liegen im App-Code');

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-card text-left transition-[border-color,box-shadow,transform] duration-200 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={game.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transform-none"
        />
        <StatusBadge status={status} className="absolute left-2 top-2 bg-background/90 shadow-sm backdrop-blur" />
        {game.tier === 'premium' && (
          <Badge className="absolute right-2 top-2 shadow-sm">{t('admin.games.tier.premium', 'Premium')}</Badge>
        )}
      </span>
      <span className="flex min-h-[72px] flex-1 items-center gap-2 p-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold tracking-tight">{t(game.nameKey, game.id)}</span>
          {loading && !editor
            ? <Skeleton className="mt-1.5 h-4 w-24" />
            : <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{detail}</span>}
        </span>
        {editor
          ? <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
          : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />}
      </span>
    </button>
  );
}

function Total({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dd className="text-lg font-semibold tabular-nums">
        {value === null ? <Skeleton className="inline-block h-5 w-10 align-middle" /> : value}
      </dd>
      <dt className="text-muted-foreground">{label}</dt>
    </div>
  );
}
