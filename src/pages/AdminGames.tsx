/**
 * AdminGames — "Games Content" (/admin/games).
 *
 * Dünne Seite: Kopfzeile + Hub oder Detail. Das gewählte Spiel und der
 * Inhaltstyp stehen in der URL (`?game=…&type=…`), damit Zurück, Neuladen und
 * geteilte Links funktionieren. Alles Weitere liegt in
 * src/components/admin/games/.
 *
 * Die Seite läuft auch eingebettet im nativen Admin (AdminScreen bringt dort
 * seine eigene Kopfzeile mit) — dann entfällt die Kopfzeile hier.
 */
import { useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameDetail } from '@/components/admin/games/GameDetail';
import { GamesHub } from '@/components/admin/games/GamesHub';
import { buildHubGames } from '@/components/admin/games/game-registry';
import { LIST_PARAM_KEYS } from '@/components/admin/games/list-filters';

const HUB_GAMES = buildHubGames();
const HEADER_OFFSET = 'calc(3.5rem + env(safe-area-inset-top))';

export default function AdminGames() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const standalone = location.pathname.startsWith('/admin/games');

  const gameId = params.get('game');
  const hub = useMemo(() => HUB_GAMES.find((h) => h.game.id === gameId && h.status !== 'editor') ?? null, [gameId]);

  // Beim Wechsel von Spiel oder Typ fallen die Listen-Filter weg — sie gehören zur alten Liste.
  const navigateTo = (game: string | null, type: string | null, replace = false) => {
    const next = new URLSearchParams(params);
    for (const key of LIST_PARAM_KEYS) next.delete(key);
    if (game) next.set('game', game); else next.delete('game');
    if (type) next.set('type', type); else next.delete('type');
    setParams(next, { replace });
  };
  const openGame = (appId: string) => navigateTo(appId, null);
  const closeGame = () => navigateTo(null, null);
  const changeType = (type: string) => navigateTo(gameId, type, true);

  const backLabel = t('admin.games.backToGames', 'Alle Spiele');
  const body = hub ? (
    <GameDetail
      hub={hub}
      typeParam={params.get('type')}
      onTypeChange={changeType}
      stickyTop={standalone ? HEADER_OFFSET : 0}
    />
  ) : (
    <GamesHub
      onOpenGame={openGame}
      onOpenEditor={(path) => navigate(path)}
      stickyTop={standalone ? HEADER_OFFSET : 0}
    />
  );

  if (!standalone) {
    return (
      <div className="space-y-3">
        {hub && (
          <Button variant="ghost" className="-ml-2 h-11" onClick={closeGame}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        )}
        {body}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-card/80 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2 sm:px-4">
          {hub ? (
            <Button variant="ghost" className="h-11 px-3" onClick={closeGame}>
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          ) : (
            <Button variant="ghost" className="h-11 px-3" asChild>
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4" />
                {t('admin.games.backToAdmin', 'Admin')}
              </Link>
            </Button>
          )}
          <div className="ml-auto flex min-w-0 items-center gap-2 pr-2">
            <Gamepad2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <h1 className="truncate text-sm font-medium text-muted-foreground">{t('admin.games.title', 'Games Content')}</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4">
        {body}
      </main>
    </div>
  );
}
