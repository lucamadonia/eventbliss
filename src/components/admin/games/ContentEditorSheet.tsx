/**
 * ContentEditorSheet — Anlegen, Bearbeiten und Duplizieren eines Eintrags.
 * Rechts als Seitenblatt am Desktop, von unten am Handy. Deutsch ist die
 * Pflichtsprache; "Duplizieren" öffnet den Editor vorausgefüllt und speichert
 * erst auf Knopfdruck.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { deleteContent, insertContentRow, updateContent, type GameContentRow } from '@/hooks/useGameContent';
import { PANTOMIME_CATEGORIES_DE } from '@/games/content/pantomime-words-de';
import {
  BASE_LANG, LANGS, categorySuggestions, defaultDifficulty, difficultiesFor, fieldsFor, fixedCategoryIds,
  isLangFilled, typeLabel, usesDifficulty, type ContentMap,
} from './field-configs';
import { hasErrors, normalizeContent, toEditableContent, validateContent, type ValidationErrors } from './validation';
import { ContentFields } from './ContentFields';
import { DiscardChangesDialog } from './ConfirmDialogs';
import { ResponsiveSheet } from './ResponsiveSheet';

export interface EditorTarget {
  mode: 'create' | 'edit' | 'duplicate';
  row?: GameContentRow;
}

interface Props {
  target: EditorTarget | null;
  dbGameId: string;
  contentType: string;
  knownCategories: string[];
  onClose: () => void;
  onSaved: () => void;
  /** Nach "Rückgängig" aus dem Toast: Listen neu laden. */
  onUndone: () => void;
}

interface Draft {
  content: ContentMap;
  category: string;
  difficulty: string;
  active: boolean;
}

function initialDraft(target: EditorTarget | null, contentType: string): Draft {
  const row = target?.row;
  return {
    content: toEditableContent(row?.content),
    category: row?.category ?? fixedCategoryIds(contentType)?.[0] ?? '',
    difficulty: row?.difficulty ?? defaultDifficulty(contentType),
    active: row ? row.is_active !== false : true,
  };
}

const PANTOMIME_LABEL = new Map(PANTOMIME_CATEGORIES_DE.map((c) => [c.id as string, `${c.emoji} ${c.name}`]));

export function ContentEditorSheet({ target, dbGameId, contentType, knownCategories, onClose, onSaved, onUndone }: Props) {
  const { t } = useTranslation();
  const firstField = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(target, contentType));
  const [snapshot, setSnapshot] = useState('');
  const [lang, setLang] = useState<string>(BASE_LANG);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!target) return;
    const next = initialDraft(target, contentType);
    setDraft(next);
    // Ein Duplikat gilt sofort als "geändert" — es ist noch nirgends gespeichert.
    setSnapshot(target.mode === 'duplicate' ? '' : JSON.stringify(next));
    setLang(BASE_LANG);
    setShowErrors(false);
    setConfirmDiscard(false);
  }, [target, contentType]);

  const dirty = target !== null && JSON.stringify(draft) !== snapshot;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const fields = fieldsFor(contentType);
  const fixedCategories = fixedCategoryIds(contentType);
  const errors: ValidationErrors = useMemo(() => validateContent(contentType, draft.content), [contentType, draft.content]);
  const categoryMissing = fixedCategories !== null && !fixedCategories.includes(draft.category);
  const suggestions = useMemo(
    () => [...new Set([...knownCategories, ...categorySuggestions(contentType)])],
    [knownCategories, contentType],
  );

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const setField = (key: string, value: string) => {
    setDraft((d) => ({ ...d, content: { ...d.content, [lang]: { ...d.content[lang], [key]: value } } }));
  };

  const copyFromBase = () => {
    setDraft((d) => ({ ...d, content: { ...d.content, [lang]: { ...d.content[BASE_LANG] } } }));
  };

  const save = async () => {
    if (!target) return;
    setShowErrors(true);
    if (hasErrors(errors) || categoryMissing) {
      const firstLang = Object.keys(errors)[0];
      if (firstLang) setLang(firstLang);
      toast.error(t('admin.games.editor.fixErrors', 'Bitte fülle die markierten Pflichtfelder aus.'));
      return;
    }
    setSaving(true);
    const undoLabel = t('admin.games.undo', 'Rückgängig');
    const undo = (revert: () => Promise<void>) => ({
      label: undoLabel,
      onClick: () => {
        revert()
          .then(() => { toast.success(t('admin.games.undone', 'Rückgängig gemacht')); onUndone(); })
          .catch((e: unknown) => toast.error(t('admin.games.actionError', 'Die Aktion ist fehlgeschlagen: {{msg}}', {
            msg: e instanceof Error ? e.message : String(e),
          })));
      },
    });
    try {
      const payload = {
        content: normalizeContent(contentType, draft.content),
        category: draft.category.trim() || 'general',
        difficulty: draft.difficulty,
        is_active: draft.active,
      };
      const saved = t('admin.games.editor.saved', 'Gespeichert');
      if (target.mode === 'edit' && target.row) {
        const { id, content, category, difficulty, is_active } = target.row;
        await updateContent(id, payload);
        toast.success(saved, { action: undo(() => updateContent(id, { content, category, difficulty, is_active })) });
      } else {
        const created = await insertContentRow({
          ...payload, game_id: dbGameId, content_type: contentType, tags: target.row?.tags ?? [],
        });
        toast.success(saved, { action: undo(() => deleteContent([created.id])) });
      }
      onSaved();
    } catch (e) {
      toast.error(t('admin.games.editor.saveError', 'Speichern fehlgeschlagen: {{msg}}', {
        msg: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setSaving(false);
    }
  };

  const canSave = !saving && !(target?.mode === 'edit' && !dirty);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (canSave) void save();
    }
  };

  const title = target?.mode === 'edit'
    ? t('admin.games.editor.titleEdit', '{{type}} bearbeiten', { type: typeLabel(contentType) })
    : target?.mode === 'duplicate'
      ? t('admin.games.editor.titleDuplicate', '{{type}} duplizieren', { type: typeLabel(contentType) })
      : t('admin.games.editor.titleCreate', '{{type}} anlegen', { type: typeLabel(contentType) });

  const langErrors = showErrors ? errors[lang] ?? {} : {};
  const currentLang = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <>
      <ResponsiveSheet
        open={target !== null}
        onRequestClose={requestClose}
        title={title}
        description={t('admin.games.editor.hint', 'Deutsch ist Pflicht. Fehlt eine andere Sprache, zeigt die App dort den deutschen Text.')}
        onKeyDown={onKeyDown}
        initialFocus={firstField}
        subheader={(
          <div className="flex gap-1 overflow-x-auto border-b px-3 py-2 [scrollbar-width:none]" role="tablist">
            {LANGS.map((l) => {
              const filled = isLangFilled(contentType, draft.content[l.code]);
              const bad = showErrors && Boolean(errors[l.code]);
              return (
                <button
                  key={l.code}
                  type="button"
                  role="tab"
                  aria-selected={lang === l.code}
                  onClick={() => setLang(l.code)}
                  title={l.name}
                  className={cn(
                    'flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                    lang === l.code ? 'border-primary bg-primary/10 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span aria-hidden>{l.flag}</span>
                  <span className="uppercase">{l.code}</span>
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full border',
                      bad ? 'border-destructive bg-destructive' : filled ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                    )}
                    aria-label={bad
                      ? t('admin.games.editor.langError', 'unvollständig')
                      : filled ? t('admin.games.list.langFilled', 'gefüllt') : t('admin.games.list.langEmpty', 'leer')}
                  />
                </button>
              );
            })}
          </div>
        )}
        footer={(
          <>
            <Button variant="outline" className="h-12 flex-1 sm:h-11" onClick={requestClose} disabled={saving}>
              {t('admin.games.cancel', 'Abbrechen')}
            </Button>
            <Button
              className="h-12 flex-[2] sm:h-11"
              onClick={save}
              disabled={!canSave}
              aria-keyshortcuts="Control+Enter Meta+Enter"
              title={t('admin.games.editor.saveShortcut', 'Strg/⌘ + Enter speichert')}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
              {t('admin.games.editor.save', 'Speichern')}
            </Button>
          </>
        )}
      >
            {lang !== BASE_LANG && !isLangFilled(contentType, draft.content[lang]) && (
              <Button variant="outline" className="h-11 w-full" onClick={copyFromBase}>
                <Copy className="h-4 w-4" />
                {t('admin.games.editor.copyBase', 'Deutschen Text als Ausgangspunkt übernehmen')}
              </Button>
            )}

            <ContentFields
              fields={fields}
              contentType={contentType}
              lang={currentLang.code}
              values={draft.content[lang] ?? {}}
              errors={langErrors}
              requiredHere={lang === BASE_LANG || isLangFilled(contentType, draft.content[lang])}
              onChange={setField}
              firstFieldRef={firstField}
            />

            <div className="space-y-4 rounded-2xl border bg-muted/30 p-4">
              <p className="text-sm font-medium">{t('admin.games.editor.metaTitle', 'Gilt für alle Sprachen')}</p>

              <div className="space-y-1.5">
                <Label htmlFor="gc-category">{t('admin.games.editor.category', 'Kategorie')}</Label>
                {fixedCategories ? (
                  <Select value={draft.category} onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}>
                    <SelectTrigger id="gc-category" className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {fixedCategories.map((c) => (
                        <SelectItem key={c} value={c}>{PANTOMIME_LABEL.get(c) ?? c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input
                      id="gc-category"
                      className="h-11"
                      list="gc-category-options"
                      value={draft.category}
                      onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                      placeholder="general"
                    />
                    <datalist id="gc-category-options">
                      {suggestions.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </>
                )}
                {showErrors && categoryMissing && (
                  <p className="text-sm text-destructive">{t('admin.games.editor.categoryRequired', 'Bitte eine Kategorie wählen.')}</p>
                )}
              </div>

              {usesDifficulty(contentType) && (
                <div className="space-y-1.5">
                  <Label htmlFor="gc-difficulty">{t('admin.games.editor.difficulty', 'Schwierigkeit')}</Label>
                  <Select value={draft.difficulty} onValueChange={(v) => setDraft((d) => ({ ...d, difficulty: v }))}>
                    <SelectTrigger id="gc-difficulty" className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {difficultiesFor(contentType).map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
                <span className="text-sm">
                  <span className="font-medium">{t('admin.games.editor.active', 'Aktiv')}</span>
                  <span className="block text-muted-foreground">
                    {t('admin.games.editor.activeHint', 'Inaktive Einträge bleiben gespeichert, die App lädt sie nicht.')}
                  </span>
                </span>
                <Switch checked={draft.active} onCheckedChange={(v) => setDraft((d) => ({ ...d, active: v }))} />
              </label>
            </div>
      </ResponsiveSheet>

      <DiscardChangesDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
      />
    </>
  );
}
