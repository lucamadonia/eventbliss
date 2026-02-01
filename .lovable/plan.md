
## Ziel
Die i18n-Fehler auf der kompletten Startseite (Route `/`) beheben, sodass keine rohen Keys wie `landing.hero.title` / `landing.features...` mehr angezeigt werden.

---

## Diagnose (Ursache)
In praktisch allen Sprachdateien gibt es **doppelte Root-Keys** namens `"landing"`.

JSON erlaubt zwar syntaktisch doppelte Keys, aber beim Parsen gilt: **der letzte Key gewinnt**.  
Dadurch überschreibt am Dateiende ein kleiner Block wie:

```json
"landing": { "nav": { "ideas": "Ideen" } }
```

die komplette, eigentlich vorhandene Landing-Übersetzungsstruktur (Hero, Features, FAQ, Footer etc.). Ergebnis: Die Startseite findet die meisten `landing.*` Keys nicht mehr → i18n zeigt die Keys als Text.

Beispiel ist sichtbar in `src/i18n/locales/pt.json` (am Ende steht nochmal `"landing": {...}`), ebenso in `de.json`, `es.json`, `fr.json`, `ar.json` und auch `en.json`.

---

## Umsetzung (Code-Änderungen)
### 1) Doppelte `landing`-Blocks am Dateiende entfernen (alle 10 Sprachen)
In diesen Dateien den **zweiten** (späteren) `"landing": { "nav": { "ideas": ... } }`-Block entfernen:

- `src/i18n/locales/de.json`
- `src/i18n/locales/en.json`
- `src/i18n/locales/es.json`
- `src/i18n/locales/fr.json`
- `src/i18n/locales/it.json`
- `src/i18n/locales/nl.json`
- `src/i18n/locales/pl.json`
- `src/i18n/locales/pt.json`
- `src/i18n/locales/tr.json`
- `src/i18n/locales/ar.json`

Wichtig dabei:
- Wenn der entfernte Block **das letzte Property** war, muss das Property direkt davor **ohne trailing comma** enden.  
  Beispiel `pt.json`: Nach dem Entfernen muss `"eventTypes": {...}` ohne Komma enden.

### 2) Sicherstellen, dass die Keys im “richtigen” Landing-Block vorhanden sind
In den “ersten” Landing-Blöcken (die großen, vollständigen) prüfen:
- `landing.nav.ideas` ist in den großen Blöcken bereits vorhanden (z.B. `de.json` Zeile ~64).
- `landing.footer.agencyPortal` ist ebenfalls bereits vorhanden in `landing.footer` (z.B. `de.json` Zeile ~303).

Falls in einer Sprache ausnahmsweise doch fehlend, wird es **im ersten Landing-Block** ergänzt (nicht erneut am Dateiende).

---

## Optionaler Guard (damit das nicht wieder passiert)
Um zukünftige i18n-Probleme schneller zu erkennen:
- In `src/i18n/index.ts` in DEV einen `missingKey`-Logger aktivieren (z.B. `i18n.on('missingKey', ...)`), der in der Konsole klar zeigt, welche Keys fehlen.
- Zusätzlich (optional) eine kleine “Landing sanity check”-Utility im Frontend, die beim Rendern von `/` einmal prüft, ob zentrale Keys existieren (z.B. `landing.hero.title`, `landing.footer.tagline`) und im DEV-Modus warnt.

Das ist nicht zwingend nötig, hilft aber, wenn später wieder viele Keys auf einmal geändert werden.

---

## Testplan (End-to-End)
1) Startseite `/` öffnen
2) Prüfen, dass Headline/Subheadline/Buttons im Hero korrekt übersetzt sind (keine `landing.*` Keys mehr sichtbar).
3) Footer prüfen (Tagline, Links, Legal, Kontakt) – insbesondere “Agency Portal”.
4) Sprache über LanguageSwitcher durchtesten: `de`, `en`, `es`, `fr`, `it`, `nl`, `pl`, `pt`, `tr`, `ar`
5) Bei `ar`: prüfen, dass RTL weiterhin korrekt greift (Layout/Alignment).
6) Hard Reload (Cache umgehen) falls im Browser noch alte Bundles geladen sind.

---

## Erwartetes Ergebnis
- Die Landing-Seite hat wieder ihre vollständigen Übersetzungen.
- Keine “rohen” i18n-Schlüssel mehr sichtbar.
- Übersetzungen funktionieren wieder stabil in allen 10 Sprachen, inkl. RTL für Arabisch.
