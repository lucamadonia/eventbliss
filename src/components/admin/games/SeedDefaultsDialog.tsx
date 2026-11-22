/**
 * SeedDefaultsDialog — "Fehlende Standardinhalte ergänzen" für EIN Spiel und
 * EINEN Inhaltstyp. Zeigt zuerst, wie viel fehlt; schreibt nur das Fehlende
 * und löscht nie etwas.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { fetchAllForPair, insertContent } from '@/hooks/useGameContent';
import { buildDefaultItems, selectMissing, type SeedItem } from '@/pages/admin/seedGameContent';
import { primaryKey } from './import-rows';

interface Props {
  open: boolean;
  appId: string;
  dbGameId: string;
  contentType: string;
  gameName: string;
  onClose: () => void;
  onDone: () => void;
}

interface Plan { total: number; missing: SeedItem[] }

export function SeedDefaultsDialog({ open, appId, dbGameId, contentType, gameName, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPlan(null);
    setError(null);
    (async () => {
      try {
        const [defaults, existing] = await Promise.all([
          buildDefaultItems(appId, contentType),
          fetchAllForPair(dbGameId, contentType),
        ]);
        const keys = new Set(existing.map((r) => primaryKey(contentType, r.content)).filter(Boolean));
        if (!cancelled) setPlan({ total: defaults.length, missing: selectMissing(defaults, keys, contentType) });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [open, appId, dbGameId, contentType]);

  const write = async () => {
    if (!plan || plan.missing.length === 0) return;
    setBusy(true);
    try {
      const res = await insertContent(plan.missing.map((i) => ({
        game_id: dbGameId, content_type: contentType, content: i.content,
        difficulty: i.difficulty, category: i.category, is_active: true, tags: [],
      })));
      if (res.failed > 0) {
        toast.error(t('admin.games.import.partial', '{{ok}} importiert, {{failed}} fehlgeschlagen: {{msg}}', {
          ok: res.ok, failed: res.failed, msg: res.firstError ?? '',
        }));
      } else {
        toast.success(t('admin.games.seed.done', '{{n}} Standardinhalte ergänzt', { n: res.ok }));
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.games.seed.title', 'Standardinhalte für {{game}} ergänzen', { game: gameName })}</DialogTitle>
          <DialogDescription>
            {t('admin.games.seed.text', 'Verglichen wird der Grundstock aus dem App-Code mit der Datenbank (über den deutschen Haupttext). Ergänzt wird nur, was fehlt – nichts wird gelöscht oder überschrieben.')}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm" role="alert">{error}</p>
        ) : !plan ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            {t('admin.games.seed.checking', 'Vergleiche mit der Datenbank …')}
          </p>
        ) : (
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Cell label={t('admin.games.seed.total', 'Grundstock')} value={plan.total} />
            <Cell label={t('admin.games.seed.present', 'Vorhanden')} value={plan.total - plan.missing.length} />
            <Cell label={t('admin.games.seed.missing', 'Fehlen')} value={plan.missing.length} />
          </dl>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="h-11" onClick={onClose} disabled={busy}>
            {t('admin.games.cancel', 'Abbrechen')}
          </Button>
          <Button className="h-11" onClick={write} disabled={busy || !plan || plan.missing.length === 0}>
            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
            {plan && plan.missing.length === 0
              ? t('admin.games.seed.nothing', 'Nichts zu ergänzen')
              : t('admin.games.seed.write', '{{n}} ergänzen', { n: plan?.missing.length ?? 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}
