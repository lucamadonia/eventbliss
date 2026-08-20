/**
 * CLOSE ENOUGH — die Eingabefläche.
 *
 * Das ist die Kernfläche des Spiels, und der eine Fehler, der hier passiert,
 * ist immer derselbe: eine Null zu viel oder zu wenig. Er ist besonders
 * ärgerlich, weil er nicht wie ein Fehler aussieht — 250.000 und 2.500.000
 * unterscheiden sich auf dem Handy um genau ein Zeichen, und der Unterschied
 * ist erster gegen letzter Platz.
 *
 * Vier Schutzschichten, die aufeinander aufbauen:
 *
 *  1. Live-Gruppierung in großen Tabellenziffern — `2.500.000`.
 *  2. Wortform darunter: „2,5 Millionen". Man liest ein Wort, statt Nullen zu
 *     zählen. Kommt aus `Intl.NumberFormat` mit `compactDisplay: 'long'`, ist
 *     also in allen zehn Sprachen ohne einen einzigen eigenen Schlüssel da.
 *  3. Größenordnungsleiter: eine Null mehr ist ein sichtbarer *Sprung* nach
 *     rechts, keine stille Zeichenänderung.
 *  4. Die Abgeben-Taste nennt den Betrag noch einmal in Worten.
 *
 * EIGENER ZIFFERNBLOCK statt Systemtastatur. Zwei Gründe: Es gäbe sonst keine
 * `000`-Taste, mit der große Zahlen ohne Zählen entstehen — und die
 * Systemtastatur verdeckt auf dem Handy genau die untere Bildhälfte, in der
 * Wortform und Leiter stehen. Der Schutz wäre dann unsichtbar.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Delete, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { formatNumber, compactWords, parseRaw } from './number-format';

export interface NumberEntryTheme {
  bg: string;
  surface: string;
  elevated: string;
  text: string;
  dim: string;
  accent: string;
}

interface Props {
  /** Rohwert: ASCII-Ziffern, optional ein Punkt und ein führendes Minus. */
  raw: string;
  onRawChange: (next: string) => void;
  onSubmit: () => void;
  lang: string;
  /** Einheitentext hinter der Zahl („m", „Einwohner"). Darf leer sein. */
  unitLabel: string;
  /** Nur bei Jahreszahlen: erlaubt ein Minus für Jahre vor Christus. */
  allowNegative: boolean;
  /**
   * Jahreszahl? Dann keine Tausendergruppierung, keine Wortform und keine
   * Größenordnungsleiter: „1.515" und „1,5 Tausend" sind als Jahresangabe
   * beide falsch, und eine Leiter über zehn Zehnerpotenzen sagt bei einer
   * vierstelligen Jahreszahl nichts aus.
   */
  isYear?: boolean;
  /** Vergleichsanker; `null`, wenn es keinen gibt oder er die Antwort verriete. */
  hint: string | null;
  hintShown: boolean;
  onShowHint: () => void;
  disabled?: boolean;
  theme: NumberEntryTheme;
}

/** Dezimaltrennzeichen der Sprache — dieselbe Ermittlung wie in number-format. */
function decimalSeparator(lang: string): string {
  try {
    const parts = new Intl.NumberFormat(lang).formatToParts(1.1);
    return parts.find((p) => p.type === 'decimal')?.value ?? '.';
  } catch {
    return '.';
  }
}

/** Kurzform für die Leiter: „1 Mio."; fällt auf die reine Zahl zurück. */
function compactShort(value: number, lang: string): string {
  try {
    return new Intl.NumberFormat(lang, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return String(value);
  }
}

/** Rohwert zur Anzeige gruppieren, ohne die getippten Nachkommastellen anzufassen. */
function display(raw: string, lang: string, isYear = false): string {
  if (!raw || raw === '-') return raw;
  if (isYear) return raw.replace('-', '−');
  const dec = decimalSeparator(lang);
  const negative = raw.startsWith('-');
  const body = negative ? raw.slice(1) : raw;
  const dot = body.indexOf('.');
  const whole = dot >= 0 ? body.slice(0, dot) : body;
  const frac = dot >= 0 ? body.slice(dot + 1) : null;

  const wholeNum = Number(whole || '0');
  const grouped = Number.isFinite(wholeNum) ? formatNumber(wholeNum, lang, 0) : whole;
  const sign = negative ? '−' : '';
  if (frac === null) return sign + grouped;
  return `${sign}${grouped}${dec}${frac}`;
}

/** Die Sprossen der Leiter: 1, 10, 100 … eine Billion. */
const LADDER = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e12];

export function NumberEntry({
  raw,
  onRawChange,
  onSubmit,
  lang,
  unitLabel,
  allowNegative,
  isYear = false,
  hint,
  hintShown,
  onShowHint,
  disabled,
  theme,
}: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const dec = decimalSeparator(lang);

  const value = parseRaw(raw);
  const words =
    !isYear && value !== null && Math.abs(value) >= 1000 ? compactWords(value, lang) : '';

  /** Welche Sprosse leuchtet? Nach der Stellenzahl, nicht nach dem Wert. */
  const rung = useMemo(() => {
    if (value === null || value === 0) return -1;
    const digits = Math.floor(Math.log10(Math.abs(value))) + 1;
    let best = 0;
    for (let i = 0; i < LADDER.length; i++) {
      if (Math.floor(Math.log10(LADDER[i])) + 1 <= digits) best = i;
    }
    return best;
  }, [value]);

  const push = (chunk: string) => {
    if (disabled) return;
    void haptics.light();
    const negative = raw.startsWith('-');
    const body = negative ? raw.slice(1) : raw;
    // Deckel bei 15 Stellen — die Datenbank lässt nichts Größeres zu
    // (`abs(answer) < 1e15`), und alles darüber ist ohnehin kein Tipp mehr.
    const digitCount = body.replace(/\D/g, '').length;
    if (digitCount + chunk.length > 15) return;
    // Führende Nullen nicht anhäufen: „000" auf einer leeren Fläche bleibt „0".
    if ((body === '' || body === '0') && chunk !== '.') {
      const cleaned = chunk.replace(/^0+(?=\d)/, '');
      onRawChange((negative ? '-' : '') + (cleaned === '' ? '0' : cleaned));
      return;
    }
    onRawChange(raw + chunk);
  };

  const pushDecimal = () => {
    if (disabled || raw.includes('.')) return;
    void haptics.light();
    onRawChange((raw || '0') + '.');
  };

  const toggleSign = () => {
    if (disabled) return;
    void haptics.light();
    onRawChange(raw.startsWith('-') ? raw.slice(1) : '-' + raw);
  };

  const backspace = () => {
    if (disabled || !raw) return;
    void haptics.light();
    onRawChange(raw.slice(0, -1));
  };

  const canSubmit = !disabled && value !== null;

  const keyStyle = {
    background: theme.elevated,
    color: theme.text,
  } as const;

  return (
    <div className="w-full">
      {/* 1. Gruppierte Ziffern — Tabellenziffern, damit beim Tippen nichts wackelt. */}
      <div
        className="rounded-3xl px-4 py-5 text-center"
        style={{ background: theme.surface }}
        aria-live="polite"
      >
        <div
          className="font-black leading-none tabular-nums break-all"
          style={{
            fontSize: raw.length > 11 ? '1.9rem' : raw.length > 8 ? '2.4rem' : '3rem',
            color: raw ? theme.text : theme.dim,
            // Die Zahl bleibt linksläufig, auch wenn die Oberfläche arabisch
            // rechtsläufig ist — Ziffernfolgen werden in jeder Sprache von
            // links nach rechts gelesen.
            direction: 'ltr',
          }}
        >
          {display(raw, lang, isYear) || '0'}
        </div>
        {unitLabel && (
          <div className="mt-1 text-sm font-bold" style={{ color: theme.dim }}>
            {unitLabel}
          </div>
        )}

        {/* 2. Wortform — ein Wort lesen statt Nullen zählen. */}
        <div className="mt-2 h-5 text-sm font-bold" style={{ color: theme.accent }}>
          {words}
        </div>

        {/* 3. Größenordnungsleiter — eine Null mehr ist ein sichtbarer Sprung.
            Bei Jahreszahlen entfällt sie: dort gibt es keine Größenordnung,
            über die man sich vertun könnte. */}
        <div
          className="mt-3 flex items-end justify-between gap-[2px]"
          aria-hidden="true"
          style={{ display: isYear ? 'none' : undefined }}
        >
          {LADDER.map((step, i) => {
            const on = i === rung;
            const passed = rung >= 0 && i < rung;
            return (
              <div key={step} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-full"
                  animate={{ height: on ? 18 : passed ? 9 : 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  style={{
                    // Auch die noch NICHT erreichten Sprossen muessen sichtbar
                    // sein — sonst sieht man nur, wo man steht, und nie, wie
                    // weit der naechste Sprung fuehrt. Genau das ist aber der
                    // Sinn der Leiter. (`elevated` auf `surface` war dunkel auf
                    // dunkel und damit unsichtbar.)
                    background: on ? theme.accent : theme.dim,
                    opacity: on ? 1 : passed ? 0.6 : 0.22,
                  }}
                />
                <span
                  className="text-[8px] font-bold leading-none"
                  style={{
                    // Aktive Sprosse voll, Anfang und Ende als Orientierung
                    // gedaempft — ohne jede Beschriftung waere die Leiter eine
                    // Reihe Striche ohne Bezug.
                    color: on ? theme.accent : theme.dim,
                    opacity: on ? 1 : i === 0 || i === LADDER.length - 1 ? 0.5 : 0,
                  }}
                >
                  {compactShort(step, lang)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vergleichsanker — kostenlos, aber auf Knopfdruck: Wer ihn nicht will,
          bekommt ihn nicht aufgedrängt. */}
      {hint && (
        <div className="mt-3">
          {hintShown ? (
            <p
              className="rounded-2xl px-4 py-3 text-sm"
              style={{ background: theme.surface, color: theme.dim }}
            >
              <Lightbulb className="w-4 h-4 inline mr-1.5" style={{ color: theme.accent }} />
              {hint}
            </p>
          ) : (
            <button
              type="button"
              onClick={onShowHint}
              className="w-full h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: theme.surface, color: theme.dim }}
            >
              <Lightbulb className="w-4 h-4" />
              {t('games.closeenough.showHint')}
            </button>
          )}
        </div>
      )}

      {/* Ziffernblock */}
      <div className="mt-3 grid grid-cols-3 gap-2" style={{ direction: 'ltr' }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => push(d)}
            disabled={disabled}
            className="h-14 rounded-2xl text-2xl font-black active:scale-95 transition-transform disabled:opacity-40"
            style={keyStyle}
          >
            {d}
          </button>
        ))}

        <button
          type="button"
          onClick={() => (allowNegative ? toggleSign() : pushDecimal())}
          disabled={disabled}
          className="h-14 rounded-2xl text-xl font-black active:scale-95 transition-transform disabled:opacity-40"
          style={keyStyle}
          aria-label={
            allowNegative ? t('games.closeenough.padSign') : t('games.closeenough.padDecimal')
          }
        >
          {allowNegative ? '±' : dec}
        </button>

        <button
          type="button"
          onClick={() => push('0')}
          disabled={disabled}
          className="h-14 rounded-2xl text-2xl font-black active:scale-95 transition-transform disabled:opacity-40"
          style={keyStyle}
        >
          0
        </button>

        <button
          type="button"
          onClick={backspace}
          disabled={disabled}
          className="h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          style={keyStyle}
          aria-label={t('games.closeenough.padDelete')}
        >
          <Delete className="w-6 h-6" />
        </button>

        {/* Die 000-Taste ist der halbe Grund für den eigenen Block: Millionen
            entstehen damit in einem Anschlag statt in sechs. */}
        <button
          type="button"
          onClick={() => push('000')}
          disabled={disabled}
          className="col-span-3 h-12 rounded-2xl text-lg font-black active:scale-95 transition-transform disabled:opacity-40"
          style={keyStyle}
        >
          000
        </button>
      </div>

      {/* 4. Die Abgeben-Taste nennt den Betrag noch einmal. */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-3 w-full h-14 rounded-2xl font-black text-lg disabled:opacity-40"
        style={{ background: theme.accent, color: theme.bg }}
      >
        {value === null
          ? t('games.closeenough.submit')
          : t('games.closeenough.submitWith', { value: words || display(raw, lang, isYear) })}
      </button>
    </div>
  );
}
