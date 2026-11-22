/**
 * ImportSheet — geführter Import in drei Schritten:
 * Datei wählen → Vorschau (mit übersprungenen Zeilen und Gründen) → Ergebnis.
 * Geschrieben wird erst nach der Vorschau, und nur hinzugefügt — nichts wird
 * gelöscht oder ersetzt.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CircleCheck, FileUp, Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fetchAllForPair, insertContent, type WriteResult } from '@/hooks/useGameContent';
import { fieldsFor, previewText, typeLabel } from './field-configs';
import { buildImportPreview, detectFormat, primaryKey, type ImportPreview, type SkipReason } from './import-rows';
import { ResponsiveSheet } from './ResponsiveSheet';

interface Props {
  open: boolean;
  dbGameId: string;
  contentType: string;
  onClose: () => void;
  /** Nach dem Schreiben: Liste und Zähler neu laden (das Blatt bleibt für das Ergebnis offen). */
  onWritten: () => void;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PREVIEW_ITEMS = 30;
const PREVIEW_SKIPPED = 100;

export function ImportSheet({ open, dbGameId, contentType, onClose, onWritten }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<WriteResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setText(''); setFileName(''); setPreview(null); setResult(null); setBusy(false); }
  }, [open, contentType]);

  const step = result ? 2 : preview ? 1 : 0;
  const steps = [
    t('admin.games.import.stepFile', 'Datei wählen'),
    t('admin.games.import.preview', 'Vorschau'),
    t('admin.games.import.stepResult', 'Ergebnis'),
  ];

  const reasonText = (reason: SkipReason): string => ({
    empty: t('admin.games.import.reason.empty', 'Zeile ist leer'),
    unknownLang: t('admin.games.import.reason.unknownLang', 'Unbekannte Sprache'),
    missingBase: t('admin.games.import.reason.missingBase', 'Deutscher Text fehlt'),
    required: t('admin.games.import.reason.required', 'Pflichtfeld fehlt'),
    number: t('admin.games.import.reason.number', 'Keine gültige Zahl'),
    range: t('admin.games.import.reason.range', 'Wert außerhalb des gültigen Bereichs'),
    duplicateInFile: t('admin.games.import.reason.duplicateInFile', 'Doppelt in der Datei'),
    duplicateInDb: t('admin.games.import.reason.duplicateInDb', 'Schon in der Datenbank'),
    badCategory: t('admin.games.import.reason.badCategory', 'Unbekannte Kategorie'),
    badJson: t('admin.games.import.reason.badJson', 'Kein gültiges JSON'),
  })[reason];

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error(t('admin.games.import.tooLarge', 'Die Datei ist größer als 5 MB.'));
      return;
    }
    setText(await file.text());
    setFileName(file.name);
  };

  const buildPreview = async () => {
    setBusy(true);
    try {
      const existing = await fetchAllForPair(dbGameId, contentType);
      const keys = new Set(existing.map((r) => primaryKey(contentType, r.content)).filter(Boolean));
      setPreview(buildImportPreview(text, detectFormat(text), contentType, { existingKeys: keys }));
    } catch (e) {
      toast.error(t('admin.games.import.loadError', 'Der Abgleich mit der Datenbank ist fehlgeschlagen: {{msg}}', {
        msg: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setBusy(false);
    }
  };

  const write = async () => {
    if (!preview || preview.items.length === 0) return;
    setBusy(true);
    try {
      setResult(await insertContent(preview.items.map((i) => ({
        game_id: dbGameId,
        content_type: contentType,
        content: i.content,
        difficulty: i.difficulty,
        category: i.category,
        is_active: i.is_active,
        tags: [],
      }))));
      onWritten();
    } catch (e) {
      setResult({ ok: 0, failed: preview.items.length, firstError: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const columns = ['lang', ...fieldsFor(contentType).map((f) => f.key), 'difficulty', 'category', 'active'].join(';');
  const requestClose = () => { if (!busy) onClose(); };
  const spinner = busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />;
  const cancel = t('admin.games.cancel', 'Abbrechen');

  const footer = step === 0 ? (
    <>
      <Button variant="outline" className="h-12 flex-1 sm:h-11" onClick={requestClose} disabled={busy}>{cancel}</Button>
      <Button className="h-12 flex-[2] sm:h-11" onClick={buildPreview} disabled={busy || text.trim() === ''}>
        {spinner}
        {t('admin.games.import.toPreview', 'Weiter zur Vorschau')}
      </Button>
    </>
  ) : step === 1 ? (
    <>
      <Button variant="outline" className="h-12 flex-1 sm:h-11" onClick={() => setPreview(null)} disabled={busy}>
        {t('admin.games.import.back', 'Zurück')}
      </Button>
      <Button className="h-12 flex-[2] sm:h-11" onClick={write} disabled={busy || !preview || preview.items.length === 0}>
        {spinner}
        {t('admin.games.import.write', '{{n}} importieren', { n: preview?.items.length ?? 0 })}
      </Button>
    </>
  ) : (
    <Button className="h-12 flex-1 sm:h-11" onClick={onClose}>{t('admin.games.import.finish', 'Fertig')}</Button>
  );

  return (
    <ResponsiveSheet
      open={open}
      onRequestClose={requestClose}
      title={t('admin.games.import.title', '{{type}} importieren', { type: typeLabel(contentType) })}
      description={t('admin.games.import.subtitle', 'Es wird nur hinzugefügt. Vor dem Schreiben siehst du eine Vorschau.')}
      footer={footer}
      subheader={(
        <ol className="flex items-center gap-2 border-b px-4 py-3 text-sm">
          {steps.map((label, i) => (
            <li key={label} className="flex min-w-0 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors duration-200 motion-reduce:transition-none',
                  i < step && 'border-primary bg-primary text-primary-foreground',
                  i === step && 'border-primary text-primary',
                  i > step && 'text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={cn('truncate', i === step ? 'font-medium' : 'text-muted-foreground')}>{label}</span>
              {i < steps.length - 1 && <span className="h-px w-4 shrink-0 bg-border sm:w-8" aria-hidden />}
            </li>
          ))}
        </ol>
      )}
    >
      {step === 0 && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,.txt,text/csv,application/json"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[112px] w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed bg-muted/30 p-4 text-center transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          >
            <FileUp className="h-6 w-6 text-muted-foreground" aria-hidden />
            <span className="font-medium">
              {fileName || t('admin.games.import.chooseFile', 'Datei wählen (CSV oder JSON)')}
            </span>
          </button>
          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setFileName(''); }}
            rows={8}
            spellCheck={false}
            aria-label={t('admin.games.import.paste', 'Inhalt der Datei')}
            placeholder={t('admin.games.import.pastePlaceholder', '… oder CSV/JSON hier einfügen')}
            className="min-h-[160px] font-mono text-xs"
          />
          <div className="space-y-1 rounded-2xl border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{t('admin.games.import.columnsTitle', 'CSV-Spalten für diesen Typ')}</p>
            <p className="break-all font-mono">{columns}</p>
            <p>
              {t('admin.games.import.columnsHint', 'Trennzeichen ; , oder Tab. Texte mit Trennzeichen in "Anführungszeichen". Eine Zeile = ein Eintrag; ohne Spalte „lang“ gilt Deutsch. Mehrere Sprachen pro Eintrag gehen über JSON ({ "content": { "de": {…}, "en": {…} } }).')}
            </p>
          </div>
        </>
      )}

      {step === 1 && preview && (preview.fatal ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm" role="alert">
          {reasonText(preview.fatal)}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('admin.games.import.willImport', 'Werden importiert')} value={preview.items.length} strong />
            <Stat label={t('admin.games.import.skipped', 'Übersprungen')} value={preview.skipped.length} />
          </div>
          {preview.ignoredColumns.length > 0 && (
            <p className="rounded-2xl border bg-muted/30 p-3 text-xs text-muted-foreground">
              {t('admin.games.import.ignoredColumns', 'Unbekannte Spalten werden ignoriert: {{cols}}', {
                cols: preview.ignoredColumns.join(', '),
              })}
            </p>
          )}
          {preview.items.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium">{t('admin.games.import.itemsTitle', 'Neue Einträge')}</h3>
              <ul className="divide-y rounded-2xl border">
                {preview.items.slice(0, PREVIEW_ITEMS).map((i) => (
                  <li key={i.line} className="flex gap-3 px-3 py-2 text-sm">
                    <span className="w-10 shrink-0 tabular-nums text-muted-foreground">{i.line}</span>
                    <span className="min-w-0 flex-1 break-words">{previewText(contentType, i.content, 'de')}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{i.category}</span>
                  </li>
                ))}
              </ul>
              {preview.items.length > PREVIEW_ITEMS && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('admin.games.import.more', '… und {{n}} weitere', { n: preview.items.length - PREVIEW_ITEMS })}
                </p>
              )}
            </section>
          )}
          {preview.skipped.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium">{t('admin.games.import.skippedTitle', 'Übersprungene Zeilen')}</h3>
              <ul className="divide-y rounded-2xl border">
                {preview.skipped.slice(0, PREVIEW_SKIPPED).map((s, idx) => (
                  <li key={`${s.line}-${idx}`} className="flex gap-3 px-3 py-2 text-sm">
                    <span className="w-10 shrink-0 tabular-nums text-muted-foreground">{s.line}</span>
                    <span className="min-w-0 flex-1 break-words">
                      {reasonText(s.reason)}
                      {s.detail && <span className="text-muted-foreground"> · {s.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {preview.skipped.length > PREVIEW_SKIPPED && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('admin.games.import.more', '… und {{n}} weitere', { n: preview.skipped.length - PREVIEW_SKIPPED })}
                </p>
              )}
            </section>
          )}
        </>
      ))}

      {step === 2 && result && preview && (
        <div className="space-y-4 py-6 text-center" role="status">
          {result.failed === 0
            ? <CircleCheck className="mx-auto h-10 w-10 text-primary" aria-hidden />
            : <TriangleAlert className="mx-auto h-10 w-10 text-destructive" aria-hidden />}
          <p className="text-lg font-semibold tracking-tight">
            {t('admin.games.import.done', '{{n}} Einträge importiert', { n: result.ok })}
          </p>
          <div className="grid grid-cols-3 gap-2 text-left">
            <Stat label={t('admin.games.import.resultOk', 'Importiert')} value={result.ok} strong />
            <Stat label={t('admin.games.import.skipped', 'Übersprungen')} value={preview.skipped.length} />
            <Stat label={t('admin.games.import.resultFailed', 'Fehlgeschlagen')} value={result.failed} />
          </div>
          {result.firstError && (
            <p className="break-words rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-left text-sm" role="alert">
              {result.firstError}
            </p>
          )}
        </div>
      )}
    </ResponsiveSheet>
  );
}

function Stat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={cn('rounded-2xl border p-3', strong ? 'border-primary/40 bg-primary/5' : 'bg-card')}>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
