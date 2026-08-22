/**
 * Geld, Zahlen und Daten in der aktiven Sprache — für das Expenses-v2-Modul.
 *
 * Warum es diese Datei gibt: `formatMoney()` aus `lib/expenses-v2/types` hat
 * `de-DE` fest verdrahtet, und ein Dutzend Komponenten riefen daneben
 * `toLocaleDateString("de-DE")` auf. Wer die App auf Englisch stellte, bekam
 * "1.234,50 €" und "22. Aug." — richtig gerechnet, falsch geschrieben.
 *
 * Alles Sichtbare läuft ab jetzt über diesen Hook. `formatMoney` bleibt
 * unangetastet, weil es außerhalb dieses Moduls weitere Aufrufer hat.
 */
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { categoryKeyFromName } from "@/lib/expenses-v2/category-assets";

/**
 * Sprachcode der App → BCP-47-Tag für Intl.
 *
 * Arabisch bewusst mit lateinischen Ziffern (`-u-nu-latn`): Die Betragsfelder
 * dieses Moduls nehmen nur 0-9 an, arabisch-indische Ziffern (٥٠٫٠٠) kämen aus
 * der Anzeige nicht wieder in die Eingabe zurück. Trennzeichen, Währungs-
 * position und Leserichtung bleiben arabisch.
 */
const INTL_LOCALES: Record<string, string> = {
  de: "de-DE",
  en: "en-GB",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  nl: "nl-NL",
  pt: "pt-PT",
  pl: "pl-PL",
  tr: "tr-TR",
  ar: "ar-u-nu-latn",
};

export function intlLocaleFor(lng: string | undefined | null): string {
  const base = (lng ?? "en").split("-")[0].toLowerCase();
  return INTL_LOCALES[base] ?? "en-GB";
}

/** Tag für die Spracherkennung (Web Speech API) — dort will Arabisch ar-SA. */
export function speechLocaleFor(lng: string | undefined | null): string {
  const base = (lng ?? "en").split("-")[0].toLowerCase();
  if (base === "ar") return "ar-SA";
  return INTL_LOCALES[base] ?? "en-GB";
}

export interface ExpenseFormat {
  /** Aktiver BCP-47-Tag, z. B. für Intl-Aufrufe in Diagrammen. */
  locale: string;
  /** Tag für die Spracherkennung. */
  speechLocale: string;
  /** Betrag mit Währung, z. B. "12,50 €" / "€12.50". */
  money: (amount: number, currency?: string) => string;
  /** Nur das Währungszeichen, z. B. "€" — für Eingabe-Suffixe. */
  currencySymbol: (currency?: string) => string;
  /** Leerwert eines Betragsfeldes in der aktiven Sprache: "0,00" / "0.00". */
  amountPlaceholder: string;
  /** Dezimaltrennzeichen der aktiven Sprache — "," oder ".". */
  decimalSeparator: string;
  /** Zahl als Text fürs Eingabefeld, mit dem Trennzeichen der Sprache. */
  toInput: (value: number) => string;
  /** Tag + Monat, kurz. */
  shortDate: (value: string | number | Date) => string;
  /** Wochentag, Tag, Monat, Jahr — ausgeschrieben. */
  longDate: (value: string | number | Date) => string;
  /** Wochentag, Tag, Monat — für Tagesüberschriften. */
  weekdayDate: (value: string | number | Date) => string;
  /** Datum mit Uhrzeit, kompakt. */
  dateTime: (value: string | number | Date) => string;
  /** Nur Uhrzeit, Stunde und Minute. */
  time: (value: string | number | Date) => string;
}

export function useExpenseFormat(defaultCurrency = "EUR"): ExpenseFormat {
  const { i18n } = useTranslation();
  const locale = intlLocaleFor(i18n.language);
  const speechLocale = speechLocaleFor(i18n.language);

  return useMemo<ExpenseFormat>(() => {
    const money = (amount: number, currency = defaultCurrency) =>
      new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);

    const currencySymbol = (currency = defaultCurrency) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? currency;

    const amountPlaceholder = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    }).format(0);

    const decimalSeparator =
      new Intl.NumberFormat(locale)
        .formatToParts(1.1)
        .find((p) => p.type === "decimal")?.value ?? ".";

    const toInput = (value: number) =>
      value ? String(Math.round(value * 100) / 100).replace(".", decimalSeparator) : "";

    const day = (value: string | number | Date, opts: Intl.DateTimeFormatOptions) =>
      new Date(value).toLocaleDateString(locale, opts);

    return {
      locale,
      speechLocale,
      money,
      currencySymbol,
      amountPlaceholder,
      decimalSeparator,
      toInput,
      shortDate: (v) => day(v, { day: "2-digit", month: "short" }),
      longDate: (v) => day(v, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
      weekdayDate: (v) => day(v, { weekday: "long", day: "2-digit", month: "long" }),
      dateTime: (v) =>
        new Date(v).toLocaleString(locale, {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      time: (v) => new Date(v).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
    };
  }, [locale, speechLocale, defaultCurrency]);
}

/**
 * Anzeigename einer Ausgaben-Kategorie in der aktiven Sprache.
 *
 * Die sieben Systemkategorien liegen in der Datenbank auf Englisch; ihre
 * Übersetzungen stehen seit jeher unter `expenses.categories.*`. Eigene
 * Kategorien der Nutzer behalten ihren eingegebenen Namen.
 */
export function useCategoryName(): (name: string | null | undefined) => string {
  const { t } = useTranslation();
  return useCallback(
    (name: string | null | undefined) => {
      const key = categoryKeyFromName(name);
      return key ? t(`expenses.categories.${key}`) : name ?? "";
    },
    [t],
  );
}
