# Party Night — Release-Notizen und Arbeitsstand

**Datum:** 2026-08-22
**Branch:** `party-night`
**Commit:** `09ebde1` (84 Dateien)
**Basis:** `2d79e1a` auf `main`

---

## Teil 1 — Freigabetexte für die Stores

Fertig zum Einfügen in App Store Connect und Google Play Console.

### Deutsch

```
Party Night ist da.

Plant euren Spieleabend im Voraus: Wählt mehrere Spiele als Set-Liste aus,
und sie laufen nacheinander ab. Die Spieler werden automatisch übernommen,
und eine Rangliste läuft den ganzen Abend mit.

• Set-Liste — mehrere Spiele vorab planen, Reihenfolge frei bestimmen
• Durchgehende Wertung über alle Spiele hinweg
• Zwischenstand nach jedem Spiel mit Rangwechseln
• Abschluss-Zeremonie mit Auszeichnungen wie „Comeback des Abends"
• Fernseher-Modus zeigt den Punktestand durchgehend an

Außerdem verbessert:
• Kein versehentliches Verlassen mehr — alle Spiele fragen jetzt nach,
  bevor eine laufende Runde abgebrochen wird
• Party-Punkte werden sofort gespeichert: Nach einem Absturz macht ihr
  dort weiter, wo ihr aufgehört habt
• Spiele-Bereich vollständig in allen zehn Sprachen
```

### Englisch

```
Party Night is here.

Plan your game night up front: pick several games as a set list and they
run one after another. Players carry over automatically, and a single
leaderboard runs all evening.

• Set list — plan several games in advance, in any order
• One running score across every game
• Standings reveal after each game, with rank changes
• Closing ceremony with awards like "Comeback of the Night"
• TV mode shows the standings throughout

Also improved:
• No more accidental exits — every game now asks before you abandon a round
• Party points save instantly: after a crash you pick up where you left off
• Games area fully translated into all ten languages
```

**Hinweis zu den übrigen acht Sprachen:** Die App-Oberfläche ist in allen zehn
Sprachen verfügbar. Die Store-Texte oben liegen bisher nur auf Deutsch und
Englisch vor — für Spanisch, Französisch, Italienisch, Niederländisch,
Polnisch, Portugiesisch, Türkisch und Arabisch müssten sie noch übersetzt werden.

---

## Teil 2 — Was in dieser Version geändert wurde

### Party Night (neu)

Ein Spieleabend besteht jetzt aus einer geplanten Abfolge statt aus
Einzelpartien.

- **Wertung:** Platzierungspunkte (1. = 10, 2. = 7, 3. = 5, 4. = 3, 5. = 2,
  ab 6. = 1; Gleichstand teilt den höheren Wert). Bewusst nicht die Rohpunkte
  der Spiele — sonst würde ein Spiel mit vierstelligen Zahlen den Abend
  dominieren.
- **Ergebnis-Erfassung:** Läuft über `useTVGameBridge`, das ohnehin in allen
  21 Spielen hängt. Ein eigener Effekt, bewusst **nicht** an `tv.isActive`
  gekoppelt, weil eine Party meist ohne Fernseher läuft.
- **Spiele ohne Einzelwertung** (Team- und Pass-the-Phone-Spiele) erscheinen
  als „Pausenspiel" in der Historie, verändern die Rangliste aber nicht.
- **Absturzsicherheit:** Punkte werden im Moment des Spielendes in den
  `localStorage` geschrieben, nicht beim Weitertippen.

Neue Module: `src/games/party/` (Wertung, Ergebnis-Extraktion, Rang-Ableitung,
Sitzungs-Schema mit Migration), `src/components/native/party/` (Set-Liste,
Zwischenstand, Fortsetzen-Banner, Ablaufsteuerung).

### Fernseher-Modus

- Zwei neue Vollbild-Szenen: Zwischenstand mit Podium und Rangwechseln,
  Abschluss-Zeremonie mit fünf abgeleiteten Titeln.
- Der Party-Rang erscheint als Chip **in der vorhandenen Punktetafel**, die
  ohnehin jede Spielansicht rendert — kein schwebendes Overlay. Ein solches
  gab es früher und wurde bewusst entfernt, weil es Inhalte verdeckte.
- Die Auszeichnungen überspringen lieber einen Titel, als einem Spieler zwei
  zu geben; der Champion ist von den Nebentiteln ausgenommen.
- Der tote `TVStatsOverlay` (null Importeure) wurde gelöscht.

### Ausstiegs-Schutz — die wichtigste Korrektur

**Vorher registrierten nur 4 von 21 Spielen einen echten Zurück-Schutz. Jetzt
sind es 21 von 21.**

Die Lücke war schwer zu sehen: `useConfirmExit` sieht wie ein Schutz aus,
schützt aber nur den spielinternen Pfeil — und der schwebende Zurück-Knopf der
nativen Hülle liegt optisch darüber. In der Praxis traf man fast immer den
schwebenden und flog kommentarlos aus der laufenden Runde.

Alle 21 nutzen denselben geteilten Dialog. Der Guard greift nur während einer
laufenden Runde; im Setup und auf dem Ergebnisschirm lässt er durch.

### Übersetzungen

- `GamesHub`, `GameLobby`, `PartyLobbyScreen` und `GamesScreen` hatten **gar
  keine** i18n-Anbindung und zeigten feste deutsche Texte in jeder Sprache.
- Der Namensraum `games.common` fehlte in allen zehn Sprachen — der Dialog
  „Spiel verlassen?" war überall deutsch. Besonders relevant, weil er durch
  die Härtung oben in 17 weitere Spiele eingebaut wurde.
- **Vier konkurrierende Spielnamen-Kataloge** auf `src/lib/playable-games.ts`
  zusammengeführt. Dabei fiel auf, dass der Party-Picker OHRWURM überhaupt
  nicht kannte.
- Zähler nutzen Label-Zahl-Formulierungen statt i18next-Pluralen: Polnisch
  bräuchte vier Formen, Arabisch sechs; mit nur `_one`/`_other` fällt i18next
  dort still auf Englisch zurück.

### Qualitätsstand

- 145 Tests in 9 Suiten, grün.
- `tsc -p tsconfig.app.json --noEmit`: 126 Fehler, **vier weniger als vorher**,
  keiner aus dieser Arbeit.
- Produktions-Build läuft durch (3 min 45 s), PWA und Prerender für 2650 Seiten.

---

## Teil 3 — Offene Punkte aus dem ersten Gerätetest

Beim Test auf dem Gerät gefunden, **noch nicht behoben**. Details und Ursachen
im Plan unter `C:\Users\luca\.claude\plans\unified-stirring-plum.md`.

| Fehler | Ursache | Schwere |
|---|---|---|
| Bestätigen-Knopf der Set-Liste hinter der Tab-Leiste | `PageTransition` setzt `transform` → neuer Stapelkontext → jedes `fixed`-Overlay hängt auf `z-10` fest, die Tab-Leiste liegt auf `z-40` darüber. Kein z-index kann das lösen; Fix ist ein Portal. | **blockierend** — Party Night ist so nicht bedienbar |
| Zurück aus einem Spiel springt auf die Startseite | `navigate(-1)` in `FloatingBackButton` — ein blinder Verlaufssprung; Tab-Wechsel erzeugen keine Verlaufseinträge. Älter als diese Sitzung. | hoch |
| Zwei Zurück-Knöpfe gleichzeitig | Schwebender Knopf der Hülle plus spielinterner Pfeil. Älter als diese Sitzung. | mittel |
| Gast-Formular: alle Validierungsmeldungen fest deutsch | `src/lib/schemas.ts:113-150`, kein einziges `t()`. Trifft **Gäste**, nicht den Organisator — und die sind seltener deutschsprachig. | hoch, bisher unbemerkt |
| Nachrichten: nur „Kickoff" deutsch | `MessagesTab.tsx:187` liest die Spalte `locale`, filtert aber nie danach. Die gespeicherte deutsche Zeile gewinnt in jeder Sprache; die übrigen neun Vorlagen haben keine DB-Zeile und fallen korrekt auf i18n zurück. | mittel |
| RSVP- und Dauer-Vorschläge deutsch | Der Mechanismus `tOption()` existiert und funktioniert gastseitig — die Editoren auf Organisator-Seite nutzen ihn nur nicht. | mittel |
| Hinweis „Antwort-Werte sind fest…" immer deutsch | Key `dashboard.form.valuesLocked` existiert **nirgends**. Derselbe Satz existiert korrekt als `formStudio.valuesLocked`. | mittel |
| Expenses v2 komplett deutsch | 16 von 17 Dateien ohne `useTranslation` — ein nie angebundenes Feature. | hoch, großer Umfang |

### Warum die Tests das nicht gefunden haben

`locale-integrity.test.ts` prüft, ob **vorhandene** Keys in allen Sprachen
existieren. Ein Text, der nie einen Key bekommen hat, ist für den Test
unsichtbar. Deshalb waren 28 Sprachtests grün, während die App auf Englisch
durchgehend Deutsch zeigte. Eine Prüfung auf tote Keys und auf deutsche
Literale ohne `t()` ist geplant.

---

## Teil 4 — Auslieferung

### Web
Vercel, ausschließlich per CLI: `vercel --prod`. Kein automatischer Deploy über
git. Anmeldung als `info@yjbn.me`, Team „Eventbliss' projects".

### iOS
GitHub-Actions-Workflow `.github/workflows/ios-testflight.yml`.
Auslösen per `gh workflow run ios-testflight.yml --ref <branch>` oder über
einen Tag `v*`. Laufzeit rund 14 Minuten. Bundle-ID `app.eventbliss`.

### Android
**Es gibt keinen CI-Workflow für Android** — nur `ios-testflight.yml`,
`charts-sync.yml` und `quality.yml`. Das Android-Release läuft manuell:
`npm run build`, dann `npx cap sync android`, dann Bundle in Android Studio
bzw. per Gradle erzeugen und in die Play Console laden.

Das ist eine Lücke: iOS ist automatisiert, Android nicht. Ein
`android-play.yml` analog zum iOS-Workflow wäre der nächste sinnvolle Schritt,
damit beide Plattformen aus demselben Commit freigegeben werden können.

### Reihenfolge vor dem nächsten Release
Die blockierenden Punkte aus Teil 3 zuerst — insbesondere der Portal-Fix.
Ohne ihn lässt sich Party Night nicht starten, und das Feature ist der
Hauptinhalt dieser Version.
