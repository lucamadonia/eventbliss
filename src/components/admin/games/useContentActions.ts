/**
 * useContentActions — Schreibaktionen der Inhaltsliste.
 *
 * Umkehrbares (aktivieren/deaktivieren) passiert sofort und optimistisch, ohne
 * Rückfrage, und der Toast bietet "Rückgängig". Endgültiges (löschen,
 * zurücksetzen) läuft nur über die Bestätigungsdialoge der Aufrufer.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  deleteAllForPair, deleteContent, setContentActive, useInvalidateContent, type GameContentRow,
} from '@/hooks/useGameContent';

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function useContentActions(rows: readonly GameContentRow[]) {
  const { t } = useTranslation();
  const invalidate = useInvalidateContent();
  /** Optimistische Schalterstände, bis die Liste neu geladen ist. */
  const [overrides, setOverrides] = useState<Readonly<Record<string, boolean>>>({});
  const [busy, setBusy] = useState(false);

  const fail = useCallback((e: unknown) => {
    toast.error(t('admin.games.actionError', 'Die Aktion ist fehlgeschlagen: {{msg}}', { msg: message(e) }));
  }, [t]);

  /** Setzt Einträge auf je ihren Zielzustand; bei Fehler springt die Anzeige zurück. */
  const apply = useCallback(async (target: Record<string, boolean>) => {
    setOverrides((o) => ({ ...o, ...target }));
    const on = Object.keys(target).filter((id) => target[id]);
    const off = Object.keys(target).filter((id) => !target[id]);
    try {
      if (on.length) await setContentActive(on, true);
      if (off.length) await setContentActive(off, false);
      await invalidate();
      return true;
    } catch (e) {
      fail(e);
      return false;
    } finally {
      setOverrides((o) => {
        const next = { ...o };
        for (const id of Object.keys(target)) delete next[id];
        return next;
      });
    }
  }, [invalidate, fail]);

  const setActive = useCallback(async (ids: readonly string[], isActive: boolean) => {
    const before: Record<string, boolean> = {};
    const target: Record<string, boolean> = {};
    for (const row of rows) {
      if (!ids.includes(row.id)) continue;
      before[row.id] = row.is_active !== false;
      target[row.id] = isActive;
    }
    const count = Object.keys(target).length;
    if (count === 0) return;
    if (!(await apply(target))) return;
    const text = count === 1
      ? (isActive ? t('admin.games.list.activated', 'Eintrag aktiviert') : t('admin.games.list.deactivated', 'Eintrag deaktiviert'))
      : (isActive
        ? t('admin.games.bulk.activated', '{{n}} Einträge aktiviert', { n: count })
        : t('admin.games.bulk.deactivated', '{{n}} Einträge deaktiviert', { n: count }));
    toast.success(text, {
      action: { label: t('admin.games.undo', 'Rückgängig'), onClick: () => { void apply(before); } },
    });
  }, [rows, apply, t]);

  const remove = useCallback(async (ids: readonly string[]) => {
    setBusy(true);
    try {
      await deleteContent(ids);
      toast.success(t('admin.games.deleted', '{{n}} Einträge gelöscht', { n: ids.length }));
      await invalidate();
      return true;
    } catch (e) {
      fail(e);
      return false;
    } finally {
      setBusy(false);
    }
  }, [invalidate, fail, t]);

  const resetPair = useCallback(async (dbId: string, contentType: string, doneText: string) => {
    setBusy(true);
    try {
      await deleteAllForPair(dbId, contentType);
      toast.success(doneText);
      await invalidate();
      return true;
    } catch (e) {
      fail(e);
      return false;
    } finally {
      setBusy(false);
    }
  }, [invalidate, fail]);

  return { overrides, busy, setActive, remove, resetPair, invalidate };
}
