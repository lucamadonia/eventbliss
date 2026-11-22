/**
 * ContentFields — die Felder EINER Sprache, gebaut aus `FIELD_CONFIGS`.
 * Auswahlfelder speichern den Index als Text ('0', '1', …) — so wie bisher.
 */
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { FieldDef, LangContent } from './field-configs';
import type { FieldErrorCode } from './validation';

interface Props {
  fields: FieldDef[];
  contentType: string;
  lang: string;
  values: LangContent;
  errors: Record<string, FieldErrorCode>;
  /** In dieser Sprache gelten die Pflichtfelder (Deutsch, oder Sprache ist angefangen). */
  requiredHere: boolean;
  onChange: (key: string, value: string) => void;
  /** Bekommt das erste Textfeld — dorthin springt der Fokus beim Öffnen. */
  firstFieldRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

export function ContentFields({ fields, contentType, lang, values, errors, requiredHere, onChange, firstFieldRef }: Props) {
  const { t } = useTranslation();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const firstKey = fields.find((f) => f.type !== 'select')?.key;

  const errorText = (code: FieldErrorCode): string => ({
    required: t('admin.games.editor.errRequired', 'Pflichtfeld – bitte ausfüllen.'),
    number: t('admin.games.editor.errNumber', 'Bitte eine Zahl eingeben.'),
    range: t('admin.games.editor.errRange', 'Der Wert liegt außerhalb des gültigen Bereichs.'),
  })[code];

  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const id = `gc-${lang}-${f.key}`;
        const value = values[f.key] ?? '';
        const error = errors[f.key];
        const label = t(`admin.games.fields.${contentType}.${f.key}.label`, f.label);
        const desc = t(`admin.games.fields.${contentType}.${f.key}.desc`, f.desc);
        const invalid = Boolean(error);
        const common = {
          id,
          'aria-invalid': invalid,
          'aria-describedby': error ? `${id}-error` : desc ? `${id}-desc` : undefined,
        };

        return (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={id}>
              {label}
              {f.required && requiredHere && <span className="text-destructive" aria-hidden> *</span>}
            </Label>
            {f.type === 'select' && f.options ? (
              <Select value={value === '' ? '0' : value} onValueChange={(v) => onChange(f.key, v)}>
                <SelectTrigger {...common} className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {f.options.map((o, i) => <SelectItem key={o} value={String(i)}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : f.type === 'textarea' ? (
              <Textarea
                {...common}
                ref={f.key === firstKey ? (firstFieldRef as React.RefObject<HTMLTextAreaElement>) : undefined}
                dir={dir}
                rows={3}
                value={value}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={cn('min-h-[88px]', invalid && 'border-destructive focus-visible:ring-destructive')}
              />
            ) : (
              <Input
                {...common}
                ref={f.key === firstKey ? (firstFieldRef as React.RefObject<HTMLInputElement>) : undefined}
                dir={f.type === 'number' ? 'ltr' : dir}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                value={value}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={cn('h-11', invalid && 'border-destructive focus-visible:ring-destructive')}
              />
            )}
            {error
              ? <p id={`${id}-error`} className="text-sm text-destructive">{errorText(error)}</p>
              : desc && <p id={`${id}-desc`} className="text-xs text-muted-foreground">{desc}</p>}
          </div>
        );
      })}
    </div>
  );
}
