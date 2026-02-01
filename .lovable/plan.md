
# Plan: Fehlende Übersetzungen auf der Startseite reparieren

## Problem

Bei der Erweiterung der Ideas Hub wurden neue Navigations-Elemente hinzugefügt, aber die entsprechenden Übersetzungsschlüssel fehlen in den Sprachdateien:

1. **`landing.nav.ideas`** - Fehlt in ALLEN 10 Sprachdateien
   - Wird in `LandingHeader.tsx` Zeile 35 verwendet
   - Zeigt aktuell den rohen Schlüssel "landing.nav.ideas" statt "Ideen"

2. **`landing.footer.agencyPortal`** - Fehlt in den meisten Sprachdateien
   - Wird in `LandingFooter.tsx` Zeile 20 verwendet
   - Hat zwar einen Fallback ("Agentur-Portal"), aber sollte übersetzt werden

## Lösung

Hinzufügen der fehlenden Übersetzungsschlüssel in allen 10 Sprachdateien:

### Änderungen pro Sprachdatei

| Datei | Schlüssel | Übersetzung |
|-------|-----------|-------------|
| **de.json** | `landing.nav.ideas` | "Ideen" |
| **de.json** | `landing.footer.agencyPortal` | "Agentur-Portal" |
| **en.json** | `landing.nav.ideas` | "Ideas" |
| **en.json** | `landing.footer.agencyPortal` | "Agency Portal" |
| **es.json** | `landing.nav.ideas` | "Ideas" |
| **es.json** | `landing.footer.agencyPortal` | "Portal de Agencia" |
| **fr.json** | `landing.nav.ideas` | "Idées" |
| **fr.json** | `landing.footer.agencyPortal` | "Portail Agence" |
| **it.json** | `landing.nav.ideas` | "Idee" |
| **it.json** | `landing.footer.agencyPortal` | "Portale Agenzia" |
| **nl.json** | `landing.nav.ideas` | "Ideeën" |
| **nl.json** | `landing.footer.agencyPortal` | "Agentschap Portaal" |
| **pl.json** | `landing.nav.ideas` | "Pomysły" |
| **pl.json** | `landing.footer.agencyPortal` | "Portal Agencji" |
| **pt.json** | `landing.nav.ideas` | "Ideias" |
| **pt.json** | `landing.footer.agencyPortal` | "Portal da Agência" |
| **tr.json** | `landing.nav.ideas` | "Fikirler" |
| **tr.json** | `landing.footer.agencyPortal` | "Ajans Portalı" |
| **ar.json** | `landing.nav.ideas` | "أفكار" |
| **ar.json** | `landing.footer.agencyPortal` | "بوابة الوكالة" |

## Technische Details

Die Änderungen erfolgen im `landing.nav` Objekt jeder Sprachdatei:

```json
// Vorher (de.json)
"nav": {
  "features": "Funktionen",
  "howItWorks": "So funktioniert's",
  "solutions": "Lösungen",
  "faq": "FAQ",
  "login": "Anmelden",
  "signUp": "Registrieren",
  "partner": "Partner"
}

// Nachher (de.json)
"nav": {
  "features": "Funktionen",
  "howItWorks": "So funktioniert's",
  "ideas": "Ideen",
  "solutions": "Lösungen",
  "faq": "FAQ",
  "login": "Anmelden",
  "signUp": "Registrieren",
  "partner": "Partner"
}
```

Und im `landing.footer` Objekt:

```json
// Hinzufügen in footer-Bereich
"agencyPortal": "Agentur-Portal"
```

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/i18n/locales/de.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/en.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/es.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/fr.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/it.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/nl.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/pl.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/pt.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/tr.json` | 2 Schlüssel hinzufügen |
| `src/i18n/locales/ar.json` | 2 Schlüssel hinzufügen |

## Geschätzter Aufwand

- 10 Dateien mit je 2 kleinen Änderungen
- Schnelle Umsetzung (~5 Minuten)
