# Spiele-Audit und Abnahmeplan

Stand: 23. September 2026. Lokale Implementierung und isolierte Browserprüfung; keine Veröffentlichung oder vollständige Geräteabnahme. Der Bericht trennt behobene Codefehler, tatsächlich ausgeführte Prüfungen und noch offene Freigabeprüfungen. „Fehlerfrei“ lässt sich aus diesen Nachweisen nicht ableiten.

## Vorgehen und Prioritäten

1. **Spielzustand und Fairness:** Aktionen an Absender, Spielzug und Runde binden; verspätete oder doppelte Eingaben ablehnen. Punkte und persönliche Ergebnisse konsistent berechnen, Rematches zurücksetzen.
2. **Verdeckte Informationen:** TV-, Wiederherstellungs- und Controllerdaten getrennt prüfen. Antworten und geheime Identitäten vor der Auflösung verbergen.
3. **Bedienung:** Übergaben, Start, richtige/falsche Eingaben, Pausen und Rücknavigation prüfen. Timer dürfen während lokaler Bestätigungsdialoge nicht weiterlaufen.
4. **Darstellung:** Alle 22 Spiele mit vier Spielern bei 375 und 320 CSS-Pixeln starten, Laufzeitfehler und horizontales Dokument-Overflow prüfen; ausgewählte Spielabläufe vertiefen.
5. **Integration:** Zehn Sprachen, stabile Teilnehmer-IDs, gemeinsame Partywertung, Datenbankrechte und reproduzierbare Tests ergänzen.
6. **Freigabe:** Echte Mehrgerätepartie, native Funktionen und externe Dienste in einer Testumgebung prüfen. Diese Stufe ist noch offen.

## Reproduzierbare Prüfung

Lokalen Vite-Server starten und anschließend aus dem Projektverzeichnis ausführen:

```powershell
node scripts/qa/games-browser.mjs
node scripts/qa/gameplay-browser.mjs
node scripts/qa/game-interactions.mjs
```

`QA_BASE_URL` überschreibt für `games-browser.mjs` und `gameplay-browser.mjs` den Standard `http://127.0.0.1:5180`; `game-interactions.mjs` verwendet dafür `QA_ORIGIN`. Die Fixture `scripts/qa/games-browser.html` montiert echte Spielkomponenten mit lokalem Vierer-Roster. Der Netzwerkfilter unterbindet externe Zugriffe. Nah dran und Pixeljagd erhalten ausdrücklich **synthetische lokale Inhalte**. Das beweist Bedienung und Darstellung, weder Vollständigkeit noch Verfügbarkeit produktiver Inhalte. Ein zuvor im isolierten Test leerer Inhaltspool war deshalb kein Nachweis eines Produktionsfehlers.

Berichte: `scripts/tmp/games-browser/report.json`, `deep-report.json` und Screenshots im selben Ordner. Temporäre Dateien werden nicht als Produktionsartefakte ausgeliefert. Die Browserprüfung deaktiviert Vite-HMR, damit parallele Quelltextänderungen laufende Szenarien nicht neu laden. Sie ersetzt keine Prüfung jeder Kombination aus Modus, Sprache, Spielerzahl und Verbindungslage.

## Spiel für Spiel

Für jede Zeile gilt zusätzlich: Setup und erster Spielzustand bei 375/320 Pixeln mit vier Spielern; keine echte Onlinepartie in dieser Browserreihe. „Regression“ bezeichnet automatische Zustands-/Komponententests, „Browser“ eine tatsächlich bediente Oberfläche.

| Spiel | Umgesetzte Korrektur / Absicherung | Zusätzlicher Nachweis | Noch zu prüfen |
| --- | --- | --- | --- |
| Bombe | Quizantwort im öffentlichen Zustand verborgen; Zugrevision und Absenderprüfung gegen doppelte/veraltete Aktionen; fremde Zugsteuerung gesperrt; Strafen im Rematch null; persönliche Ergebnisse; lokale Timerpause | Regressionen zu öffentlichen Quizdaten; Browser: gelöst wechselt zu Ben, Uhr während Ausstiegsdialog eingefroren, Escape setzt fort | Alle Modi inklusive Quiz/Alle auf echten Controllern, Explosion bei Verbindungswechsel |
| HeadUp | Rückrufzustand korrigiert; geheimes Wort nicht an TV; stabile IDs auch für nicht gewertete Teilnehmer | Setup/Start; Zustandsregressionen | iOS-/Android-Neigung, Berechtigungen, Kamera-/Orientierungswechsel |
| Taboo | Frische Rematchwerte und persönliche Ergebnisse; stabile Zuordnung zur Partywertung | Setup bis Übergabe, Zustandsregressionen | Vollständige Teamsitzung, Zeitende und mehrfaches Überspringen auf Geräten |
| Kategorien | Punkte und Niederlagen beim Rematch zurückgesetzt; persönlicher statt pauschaler Siegerstatus | Browser: „Apple“ akzeptiert, „apple“ als Wiederholung abgewiesen | Sprach-/Buchstabenvarianten, Timerende, Stimmen und Verbindungswechsel |
| Hochstapler | Geheimdaten im öffentlichen Zustand beschränkt; stabile Teilnehmerzuordnung und Rematchwerte | Setup bis verdeckter Geheimnisübergabe; Regressionen | Vollständige Enthüllungs-/Abstimmungsrunde mit mehreren Geräten |
| Drück das Wort | Zustands-/Rematch- und Ergebnisintegration in gemeinsame Partywertung | Setup/Start; Regressionen | Vollständige Runden und gleichzeitige Eingaben unter Netzlatenz |
| Wo ist was? | Rematch löscht Punkte, Fehler, Serien und Bestzeit; Karten-/Panoramapakete verbergen Zielnamen, fremde Tipps und zukünftige Orte bis zur Auflösung; Runden-ID schützt vor verspäteten Ergebnissen; Timer/Übergänge pausierbar; Speed-Zeit bereinigt | Browser: genau drei Unterschiede erkannt und bedient; Regressionen zu Karten-/Panoramaprojektion und verborgenen Tipps | Memory, Speed, Karte und Street View vollständig auf Geräten; Maps-Zugriff. Aktuelle Panorama-Koordinaten bleiben technisch für die Google-Darstellung erforderlich |
| Split Quiz | Frische Rematches, persönliche Ergebnisse, stabile Team-/Spielerzuordnung | Setup/Start; Regressionen | Vollständige Mehrgeräterunde mit ungleichen Teams |
| Geteilt gequizzt | Antworten in öffentlicher Ansicht geschützt; persönliche Statistik und Rematch-/Teamzuordnung | Setup/Start; Zustandsregressionen | Gleichzeitige Antworten, Timeout, Wiederbeitritt mit echten Geräten |
| Schnellzeichner | Blindmodus blockiert erneutes Zeichnen nach dem Verbergen nicht mehr; TV-Zustand unterstützt Rückgängig/Leeren konsistent; Rematchwerte und persönliche Statistik; Modus-/Reglerzugänglichkeit | Browser: nach mehr als fünf Sekunden neu ansetzen erzeugt Tinte; Rückgängig stellt Pixel exakt wieder her, Leeren erzeugt weiße Fläche; bleibende TV-Komponente aktualisiert Snapshots | Native Touch-/Stiftgeräte, Druck/Unterbrechung, echte TV-Verbindung |
| Wahrheit oder Pflicht | Modusbeschriftungen lokalisiert; frische Rematchwerte und stabile Teilnehmerzuordnung | Setup/Start; Regressionen | Aufgabenannahme/-ablehnung, alle Sprachpakete auf Geräten |
| Dies oder Das | Rundenvotes/öffentliche Daten und persönliche Statistik korrigiert; Rematch setzt zurück | Setup bis zwei Auswahloptionen; Regressionen | Gleichzeitige Votes, Unentschieden und vollständiger Durchlauf |
| Wer bin ich? | Endzustand nach Auflösung korrigiert; Controllerhinweis und Wiederholungsaktion lokalisiert; Rematch frisch | Setup bis verdeckter Identität; Regressionen | Vollständige Fragerunde, letzter Treffer, Ergebnis und Rematch mit mehreren Geräten |
| Emoji-Raten | Speed-Modus fix auf zehn Sekunden; ungleiche Teams über ganzzahlige Gewichtung gleiches maximales Rundenergebnis; Hinweis in zehn Sprachen | Regression für 3/5/7/19 Spieler; Browser: Speed-Einstellung, falsche Antwort mit Rückmeldung, Überspringen | Vollständige Teamrunden mit ungeraden Gruppengrößen und Timeout |
| Fake or Fact | Private Übergabe vor jeder lokalen Antwort; Timer startet erst nach Bereitschaft; TV enthüllt in Übergabe keine Aussage | Browser: vier Spieler bestätigen nacheinander Bereitschaft und stimmen ab; keine Uhr in Übergabe | Beide Modi vollständig, letzte Runde/Rematch, Onlinegleichzeitigkeit |
| Story Builder | Fortsetzung und Promptzustand korrigiert; Leerzustand lokalisiert; frische Rematchwerte | Setup/Start; Regressionen | Lange Geschichten, leere Eingaben, letzte Person und Wiederherstellung |
| Flaschendrehen | Reduzierte Bewegung respektiert; verzögerte Übergänge pausierbar; Regeln-ID vereinheitlicht | Browser: fünf Fragerunden inklusive Drehen/Annehmen und anschließendes Rematch mit erhaltenem Roster | Aufgaben/Voting, Ablehnung, volle Besetzung, echte Controller und Drehanimation |
| Ohrwurm | Rückzähler, verbleibende Zeit und laufender Zustand bei Wiederherstellung bewahrt; Aktionsrechte des aktuellen Spielers | Setup bis Rundenstart; Regressionen | Spotify-/Audiozugriff, Hintergrundton, native Unterbrechungen und echte Konten |
| Pixeljagd | Buzz erst nach Bildbereitschaft; Eingaben/Platzierung abgesichert; Wiederherstellung | Setup/Start mit synthetischem lokalen Bild; Regressionen | Tatsächlicher Bilderpool, langsame/fehlende Bilder, mehrere Buzzer auf Geräten |
| Nah dran | Runden-Token verhindert verspätete Schätzung in neuer Runde | Regressionen; Browser-Eingabe/Übergabe mit ausdrücklich synthetischer Frage | Produktiver Fragenpool, alle Einheiten/Sprachen, volle Wertung und Mehrgeräteverbindung |
| Pantomime | Überspringen und Wiederherstellung repariert; abgeschlossene TurnSummary bleibt bis zum nächsten Zug erhalten; Team-IDs und Punkte eindeutig | Setup bis Bereitschaft; Regressionen | Teamwechsel, Ergebnis/Multiplikator nach Netzunterbrechung, komplette Sitzung |
| Gebräu | Zug-Token und Aktions-ID verhindern doppelte/veraltete Eingaben; unerreichbarer Glaszweig entfernt | Browser: ziehen und einfüllen; Typprüfung | Bust, alle Glasformen, vollständige Partie und Host-/Gast-Unterbrechung |

## Gemeinsame Nachweise

- Finale Browserläufe: **22/22 Spiele** in Setup und gestartetem Zustand bei jeweils 375/320 Pixeln ohne erfasste Laufzeitfehler oder horizontales Dokument-Overflow; **8/8 vertiefte Abläufe bestanden**, beide Skripte mit Exitcode 0. Screenshots der acht vertieften Spiele wurden zusätzlich visuell geprüft. Die 88 Layoutaufnahmen sind keine vollständige manuelle Designabnahme aller Spielphasen.
- Gesamte lokale Testsuite: **83 Dateien, 1080 Tests bestanden**; TypeScript ohne Fehler. Datenbankintegration: **15 Tests bestanden** (PGlite mit tatsächlicher Migration, keine produktive Supabase-Abnahme).
- Eigener Acht-Spiele-Umfang zuvor: 25 Testdateien, 366 Tests bestanden. Neue Sprachschlüssel und Pluralvarianten: zehn Sprachprüfungen bestanden.
- Interaktionsprüfung Zeichnen/Dialog/TV: fünf Szenarien bestanden, einschließlich Beschriftung, Tab-Fokus, Escape, Fokusrückgabe und lokaler Timerpause.
- Joystick-Texte sowie neue Spielhinweise in Deutsch, Englisch, Spanisch, Französisch, Italienisch, Niederländisch, Polnisch, Portugiesisch, Türkisch und Arabisch. Das ist keine vollständige manuelle Sprachabnahme aller bestehenden Inhalte.
- Öffentliche Spiel-/TV-Zustände enthalten stabile Wertungsidentitäten intern; die Zuschauerprojektion entfernt interne Partywertungen. Persönliche Ergebnisse behandeln Gleichstände konsistent.

## Erweiterte Layoutmatrix und gemeinsame Darstellung

Die zusaetzliche Matrix pruefte alle 22 Spiele mit minimaler und maximaler Besetzung bei 320 Pixeln, einschliesslich englischem Spielstart und arabischer RTL-Darstellung. Der korrigierte Hauptlauf erreichte 43/44; ein separater Bomben-Wiederholungslauf bestand beide Besetzungsvarianten nach einer Wartebedingung auf den tatsaechlichen Phasenwechsel. Damit sind alle 44 Kombinationen abgedeckt, nicht alle Spielmodi oder kompletten Partien. Nachweise: `scripts/tmp/game-roster-matrix/report.json` und `scripts/tmp/game-roster-matrix-bomb/report.json`. Ein visuell gefundener echter Fehler wurde behoben: breite Premium-Auswahlkarten waren durch CSS-Spezifitaet nur 44 statt 168 Pixel hoch. Ein RTL-Screenshotversatz war dagegen eine Capture-/Scrollposition und kein bestaetigter Layoutfehler.

Die Finale-Anzeige nennt nun alle punktgleichen Sieger gemeinsam; gleichrangige Podiumsplaetze erhalten gleiche Kronen-/Hoehen-/Farbbehandlung. Zwei neue Texte sind in allen zehn Sprachen vorhanden. Regressionen decken zwei Sieger, einen Gleichstand aller zwoelf Spieler, null Punkte und leere Ergebnisse ab; 40 fokussierte Tests bestanden. Der gerenderte Vierfach-Gleichstand bei 320 Pixeln bestand ebenfalls ohne horizontales Overflow oder Laufzeitfehler; alle vier Namen und Rang-1-Eintraege wurden visuell kontrolliert (`scripts/tmp/party-finale/tie-320.png`).

## Ergaenzte Mehrgeraete-Integration

Die reproduzierbare isolierte Integration startet mit `npx vite --config scripts/qa/controller-vite.config.ts --host 127.0.0.1 --port 5183`. Danach pruefen `node scripts/qa/controllers-browser.mjs` und `node scripts/qa/controllers-browser.mjs --host-plays` zwei Rollenvarianten. Berichte und Screenshots liegen unter `scripts/tmp/controllers-browser/moderator/` beziehungsweise `host/`.

**Beide Varianten bestanden mit Exitcode 0:** Moderator plus vier Gaeste sowie mitspielender Gastgeber plus drei Gaeste. Jede Variante absolvierte Fake or Fact (fuenf Runden, 20 eigene Abstimmungen), Dies oder Das (fuenf Runden, 20 eigene Abstimmungen), Flaschendrehen (fuenf angenommene Karten) und ein weiteres vollstaendiges Fake-or-Fact-Spiel. Vier unterschiedliche Match-IDs und vier stabile Spieler-IDs pro gespeichertem Ergebnis wurden geprueft. Ein Gast wurde waehrend der Partie getrennt und ueber den echten Wiederverbindungsablauf mit derselben Identitaet wieder verbunden. Die Oberflaeche sperrte Abstimmungen auf einem fremden Controller. Der Moderator blieb aus der aktiven Wertung ausgeschlossen.

Die Pruefung verwendet die echten Komponenten `ControllerPartyLobby`, `ControllerPartyCoordinator`, `ControllerGameControls`, `OnlineGameWrapper` und die Spielkomponenten. Der echte `RoomSession` signiert und prueft Nachrichten; seine Supabase-Transportoberflaeche ist durch einen lokalen asynchronen Broker ersetzt. Die echte Datenbankmigration laeuft in PGlite und verarbeitet Start/Ergebnisse/Platzierungen. **Authentifizierungsidentitaeten und die native Plattformabfrage sind synthetisch; dies ist keine native Geraete- oder Supabase-Auth/Realtime-Abnahme.** Es gab keine produktiven Zugriffe. Die beiden erfolgreichen Laeufe erfassten keine Browser-Laufzeitfehler und 512 beziehungsweise 410 Brokerpakete. Rueckkehr in Lobby/Zwischenwertung sowie anschliessender Spielstart liefen ueber den echten Coordinator.

Die zuvor offenen vollstaendigen Mehrgeraeteablaeufe fuer diese drei Spiele sind damit auf der isolierten Integrationsebene geprueft. Andere Spiele, echte Funk-/Netzbedingungen, native Lebenszyklen und echte externe Dienste bleiben davon getrennte Pruefungen.

## Echte lokale Supabase- und TV-Integration

Der anschliessende Lauf mit mitspielendem Gastgeber, drei Gaesten und separatem TV bestand mit Exitcode 0 (`scripts/tmp/controllers-browser/real-host/report.json`). Er verwendete echte lokale GoTrue-Konten, PostgreSQL-Migration/RPCs, Supabase-SDK und Realtime. Fake or Fact, Dies oder Das, Flaschendrehen und ein vollstaendiges Fake-or-Fact-Rematch wurden abgeschlossen: vier verschiedene Match-IDs, vier stabile Teilnehmer-IDs pro gespeichertem Ergebnis und frische Anfangspunkte. Ein Gast verlor per Chrome-Netzwerkemulation die Verbindung und kehrte ueber den echten Retry mit derselben Identitaet zurueck. Fremde Controller konnten nicht abstimmen. Der echte Coordinator wechselte zwischen Spiel und Lobby.

Der separate TV empfing echte Realtime-Nachrichten. Alle vier Spielansichten wurden mit sichtbarer Deckkraft und sichtbarer Inhaltsgeometrie geprueft; Fake-Antworten blieben vor der Aufloesung verborgen, interne Party-Scoremaps fehlten auch in Start-/Sync-Paketen. Der erfolgreiche Lauf erfasste keine Browser-Laufzeitfehler. Sichtpruefungen bestaetigten die Fake- und Dies-oder-Das-Spielansichten.

Dabei wurden reale TV-Fehler behoben: Die ausblendende Lobby konnte das laufende Spiel unter ihre volle Bildschirmhoehe schieben; Szenen ersetzen sich nun direkt mit kurzer Eintrittsanimation. Unzulaessige mehrteilige Spring-Keyframes verursachten Laufzeitfehler in Lobby, Quiz, Kategorien, Dies oder Das und Hochstapler; diese Sequenzen verwenden nun Tween-Animationen. Runde und Stimmen auf dem Dies-oder-Das-TV nutzen bestehende Uebersetzungen. Der erfolgreiche Hostlauf entstand vor dieser letzten reinen Textkorrektur.

Die native Plattformberechtigung ist in diesem Browserfixture weiterhin simuliert; das ist keine reale iOS-/Android-Abnahme. Auch der anschliessende echte Supabase-Moderatorlauf mit vier Gaesten und separatem TV bestand mit Exitcode 0 (`scripts/tmp/controllers-browser/real-moderator/report.json`): dieselben vier vollstaendigen Spiele, stabile Wiederverbindung, vier Ergebnisroster ohne Moderator, sichtbare TV-Spielansichten und keine Laufzeitfehler. Ein vorheriger TargetCloseError beim Browserstart wurde durch den erfolgreichen Wiederholungslauf abgeloest. Die TV-Aufnahme von Dies oder Das wurde visuell geprueft und zeigt nun korrekt Round 1/5; auch die mobile Finale-Ansicht wurde kontrolliert. Die bereits erfolgreichen Moderator-/Hostlaeufe mit PGlite-Broker bleiben davon getrennte Nachweise. Auch der isolierte Kategorien-/Hochstapler-TV-Runner (`scripts/qa/tv-reveal-browser.mjs`) bestand mit Exitcode 0: beide echten Komponenten wurden mit synthetischem Spielzustand sichtbar gerendert, ohne Animations-Laufzeitfehler. Nachweis: `scripts/tmp/tv-reveal/report.json`.

## Offene Freigabeschritte

1. Produktions-/Staging-Konfiguration von Auth, Realtime und Migration getrennt freigeben; beide isolierten lokalen Supabase-Rollenvarianten sind bestanden.
2. Ein vollständiges Set aus mehreren Spielen samt Rematch, Gast-Rejoin, Host-Neustart, Hintergrund-/Netzwechsel und Ergebnisretry absolvieren.
3. iOS/Android: Touch, Zurückgeste, Orientierung/Neigung, Audio und Einladungslinks kalt/warm prüfen.
4. Externe Inhalte, Maps/Street View und Spotify mit freigeschalteten Testkonten validieren. Lokale Mocks können diese Freigabe nicht ersetzen.
5. Alle Modi bei minimaler/maximaler Spielerzahl, 320-Pixel-Ansicht, großen Systemschriften und arabischer Schreibrichtung abnehmen; besonders lange Texte und Ergebnislisten.

Weitere gemeinsame Implementierung, Datenbankgrenzen und Veröffentlichungsschritte: [Joystick-Party-Bericht](controller-party-implementation-2026-09-23.md).
