/**
 * validation — Pflichtfelder des Editors.
 *
 * Regeln:
 * - Basissprache (Deutsch): alle Pflichtfelder müssen gefüllt sein.
 * - Andere Sprachen: leer ist erlaubt (dann nutzt die App Deutsch). Sobald dort
 *   aber etwas steht, müssen auch dort die Pflichtfelder gefüllt sein — eine
 *   halb übersetzte Karte wäre im Spiel kaputt.
 * - Zahlenfelder müssen Zahlen sein.
 */
import { BASE_LANG, LANG_CODES, asText, fieldsFor, isLangFilled, type ContentMap } from './field-configs';

export type FieldErrorCode = 'required' | 'number' | 'range';
export type ValidationErrors = Record<string, Record<string, FieldErrorCode>>;

export function validateContent(contentType: string, content: ContentMap): ValidationErrors {
  const fields = fieldsFor(contentType);
  const errors: ValidationErrors = {};
  for (const lang of LANG_CODES) {
    const data = content[lang] ?? {};
    const mustValidate = lang === BASE_LANG || isLangFilled(contentType, data);
    if (!mustValidate) continue;
    for (const f of fields) {
      const value = asText(data[f.key]).trim();
      if (f.type === 'select') continue;
      if (f.required && value === '') {
        (errors[lang] ??= {})[f.key] = 'required';
        continue;
      }
      if (f.type === 'number' && value !== '') {
        const n = Number(value.replace(',', '.'));
        if (!Number.isFinite(n)) (errors[lang] ??= {})[f.key] = 'number';
        else if ((f.key === 'lat' && Math.abs(n) > 90) || (f.key === 'lng' && Math.abs(n) > 180)) {
          (errors[lang] ??= {})[f.key] = 'range';
        }
      }
    }
  }
  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Entfernt leere Sprachen und Leerzeichen; füllt Auswahlfelder mit '0' auf. */
export function normalizeContent(contentType: string, content: ContentMap): ContentMap {
  const fields = fieldsFor(contentType);
  const out: ContentMap = {};
  for (const lang of LANG_CODES) {
    const data = content[lang];
    if (!isLangFilled(contentType, data)) continue;
    // Unbekannte Schlüssel bleiben erhalten (alte Zeilen haben z. B. `category` im Sprachobjekt).
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(data ?? {})) {
      const t = asText(v).trim();
      if (t !== '') clean[k] = t;
    }
    for (const f of fields) {
      const raw = asText(data?.[f.key]).trim();
      if (f.type === 'select') clean[f.key] = raw === '' ? '0' : raw;
      else if (raw !== '') clean[f.key] = raw;
    }
    out[lang] = clean;
  }
  return out;
}

/** Inhalt aus der Datenbank in editierbare Form bringen (alles als Text, nur bekannte Sprachen). */
export function toEditableContent(content: Record<string, unknown> | null | undefined): ContentMap {
  const out: ContentMap = {};
  for (const lang of LANG_CODES) {
    const data = content?.[lang];
    if (data && typeof data === 'object') {
      out[lang] = Object.fromEntries(Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, asText(v)]));
    } else out[lang] = {};
  }
  return out;
}
