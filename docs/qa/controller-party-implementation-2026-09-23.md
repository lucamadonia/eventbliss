# EventBliss: Joystick-Party und Spielequalität

## Korrekturen nach Gerätefeedback vom 26. September

### Veröffentlichung am 27. September

- Quellstand `959487533964c1e60023dc1a084175d5eddee2ef` auf `main` und Release-Branch veröffentlicht.
- **Version 1.5.12, Build 295** erfolgreich archiviert, exportiert und zu TestFlight hochgeladen: [Workflow 36302394561](https://github.com/lucamadonia/eventbliss/actions/runs/36302394561), vollständig erfolgreich nach 11 Minuten 22 Sekunden. Apples Verarbeitung und die Verfügbarkeit im Testkonto sind nicht separat bestätigt.
- Vercel-Produktionsdeployment `FF16ew6GDFi58hz6GMamLrTPKx53` erfolgreich. Frischer Chromium-Aufruf von `/games/headup` um 09:22 MESZ bestätigt HTTP 200 und Sensorfreigaben für Beschleunigungssensor und Gyroskop; das Magnetometer bleibt gesperrt. Physische iPhone-Abnahme weiterhin offen.
- Live-Beitritt `/party/join/JL2D6Z` auf Hauptdomain und `www`: HTTP 200, richtiger Raumcode und echter `eventbliss://party/join/JL2D6Z`-App-Link. Beide neuen WebP-Motive liefern HTTP 200; der neue Service Worker enthält die Party-Link-Ausnahme. Mobile Darstellung visuell geprüft.
- Der erste zusätzliche Quality-Gate-Lauf lief in sein 15-Minuten-Limit: Im CI fehlte die öffentliche Supabase-Konfiguration, wodurch `createClient` bereits vor dem React-Start abbrach und jede vorgerenderte Route ins Timeout lief. Commit `887bd97` ergänzt die Buildvariablen mit lokalem Ersatz für externe Pull Requests. Kein App-Code nach dem TestFlight-Quellstand geändert.
- [Erneuter Quality Gate 36317219527](https://github.com/lucamadonia/eventbliss/actions/runs/36317219527) erfolgreich in 3 Minuten 18 Sekunden: Tests, PostgreSQL-Integration, TypeScript und Produktionsbuild bestanden; **41 Full-Render, 0 Meta-Fallbacks**. Der ausdrücklich nicht blockierende globale Lint-Schritt meldet weiterhin **638 Fehler und 195 Warnungen**. Ein grüner Gesamtworkflow bedeutet deshalb keine globale Lint-Freiheit.

Die positive Designreferenz des Nutzers sind Pixeljagd, Nah dran und Ohrwurm; diese Spiele bleiben unverändert. Tickende Bombe, Wortverbot, Stirnraten und Ohne Worte erhalten wieder eigene kräftige Farben, großzügige Wort-/Spielflächen und eine klare Hauptaktion. Die Party-Lobbies zeigen sekundäre Inhalte erst auf Anforderung.

- TV: Der vorhandene Provider öffnet nun auch ohne schwebenden Trigger sichtbar die Verbindungsinformationen. Kein zusätzlicher Realtime-Kanal.
- Native Party-Lobbies: begrenzter Scrollbereich, Abstand zur Tabbar, keine überlagernde globale Plus-Aktion. Sechs Scrollfälle bei 320/390 px und der Endparty-Dialog bestanden; Trefferprüfung links/Mitte/rechts des unteren Buttons.
- Neue Einladung bei bestehender Party: Ziel wird nicht mehr übersteuert; Wechsel verlangt Bestätigung und wartet auf erfolgreiches Verlassen/Beenden.
- Stirnraten: Kippen nach unten anhand negativer z-Gravitation als richtig, nach oben als weiter; erneute Freigabe erst nach Neutralstellung. Zehn Sensortests sowie Browserprüfung für Hoch-/Querformat, erteilte/verweigerte Sensorfreigabe, manuelle Tasten und abgebrochenes Verlassen während Countdown/Spiel bestanden. Physische iPhone-Sensorabnahme bleibt offen.
- Tickende Bombe und Wortverbot: sechs tatsächliche Browserabläufe bei 320/390/844 px inklusive nächstem Spieler/Wort bestanden; keine horizontalen Überläufe. Wortverbot-Fußzeile verdeckt keine Wörter mehr.
- Ohne Worte: drei Browserabläufe bei 320/390/844 px, große Wortkarte und erfolgreiches Weiterschalten durch „Erraten“ bestanden.
- Die genaue URL `/party/join/JL2D6Z` zeigt am 26. September im frischen mobilen Browser auf apex und www die korrekte App-Beitrittsseite. Die gemeldete 404 ist dort nicht reproduziert. Neue Party-Einladungen werden vom Service-Worker-Navigationsfallback ausgenommen; eine veraltete gecachte App-Seite ist eine mögliche, noch nicht am Nutzergerät bestätigte Ursache.

### Aktuelle Verifikation

Zusätzliche Prüfung am 27. September: Die produktive Permissions-Policy sperrte Beschleunigungssensor und Gyroskop vollständig; Chromium bestätigte beide als nicht erlaubt. Die Konfiguration erlaubt nun beide Sensoren ausschließlich für die eigene Origin (`self`). Ein isolierter HTTP-/Chromium-Test bestätigt beide Freigaben, während das Magnetometer gesperrt bleibt. Die Prüfung mit echten iPhone-Bewegungen bleibt offen.

Aktueller automatisierter Nachweis: **1.100 Tests in 86 Suiten bestanden**, vollständige TypeScript-Prüfung erfolgreich. Ein vorheriger paralleler Lauf hatte einen Import-Timeout; der vollständige Wiederholungslauf mit vier Workern bestand ohne Änderung der Testzeitlimits. Die Regression mit dem tatsächlich erzeugten Produktions-Service-Worker besteht: Eine Kontrollroute zeigt die absichtlich gecachte 404, die Party-Einladung lädt dagegen die echte Beitrittsseite vom Server. Keine Browser-Laufzeitfehler. Bereits installierte alte Worker müssen die Aktualisierung erst übernehmen.

Produktionspaket: Vite und PWA erfolgreich gebaut. Der abschließende Prerender-Schritt scheiterte zunächst an vollem Datenträger; nach Freigabe von Speicher wurde er mit neutraler App-Shell wiederholt und endete erfolgreich mit **41 vollständig gerenderten Seiten, 0 Meta-Fallbacks, Exitcode 0**. Der externe Security-Scanner wurde erneut versucht, scheiterte aber weiterhin vor dem Scan am npm-Fehler `Cannot read properties of null (reading 'package')`.

### Neue Bildmotive

Erzeugung mit dem integrierten GPT-Image-Werkzeug, anschließend als WebP für die App gespeichert. Bilder enthalten keine gerenderten Bedienelemente; Titel und Aktionen bleiben echte UI. Originaldateien bleiben im Imagegen-Ausgabeordner erhalten.

- `public/images/games/party-hero-gpt-v2.webp` (1200 × 675, ca. 99 KB), nur im leeren Party-Einstieg.
- `public/images/games/pantomime-hero-gpt-v2.webp` (1200 × 675, ca. 86 KB), im Ohne-Worte-Einstieg.

Verwendete Prompts:

> Create one production illustration for the EventBliss party-games app, wide 16:9 hero crop. Style: polished lively hand-drawn comic illustration with crisp dark outlines, dimensional cel shading, expressive adult faces and beautifully controlled cyan, violet and warm pink light, matching cheerful premium party-game cover illustrations. Scene: four adult friends enjoying a living-room party, each holding their own smartphone as a controller, exchanging excited smiles, with a distant television showing ONLY abstract colorful playful shapes (no interface, text or numbers). Strong readable central composition, generous dark midnight-violet negative space near bottom for real UI to overlay later; subjects in upper two thirds, keep edges uncluttered for mobile cropping. Fun, warm and stylish, rich material details, not childish, not flat generic vector art. No words, no lettering, no logos, no watermark, no UI controls. Output is a finished standalone raster hero image, not an app mockup.

> Use case: stylized-concept. Create a finished wide 16:9 hero illustration for the mobile charades party game 'Ohne Worte'. No writing at all. A charismatic adult friend centre-stage enthusiastically miming an imaginary bow and arrow, while three adult friends at the sides laugh and try to guess. Expressive comic faces, clean bold dark contours, rich cel-shaded illustration, playful premium board-game artwork rather than photo realism. Deep violet room, warm golden stage spotlight, contrasting pink and cyan accents echoing two teams. Dramatic yet warm, dynamic silhouettes, attractive polished detail, not childish. Center action clearly legible when viewed 350 pixels wide. Keep the lower quarter a smooth dark-violet gradient for real app title overlay and keep composition clean around edges. No weapon prop: unmistakably pretend gesture with empty hands. No labels, no lettering, no numbers, no UI, no cards with symbols, no speech bubbles, no watermarks. Standalone raster artwork, not screenshot or mockup.

Stand: 23. September 2026. Release-Quellstand `8dd19af32d13ef5dae9537d91f698c24b8c013d7`: TestFlight-Upload und Web-Veröffentlichung abgeschlossen; Geräteabnahme weiterhin offen.

## Veröffentlichung für die iPhone-Abnahme

- **Version 1.5.12, Build 294**: [iOS-Workflow 35873749032](https://github.com/lucamadonia/eventbliss/actions/runs/35873749032) erfolgreich. Archivierung, IPA-Export und Upload-Schritt erfolgreich; Upload beendet am 23. September um 14:39:07 UTC. Apples anschließende Verarbeitung und Testerzuweisung sind nicht separat bestätigt.
- Die einzelne Migration `20260922235000_controller_parties.sql` wurde erfolgreich auf dem Produktionsprojekt `kiyokpawmabodmrmhvev` angewendet. RPC und Tabellen existieren; öffentliche Zugriffe werden live mit `42501` verweigert. Keine Testkonten oder Partys in Produktion angelegt.
- Web-Deployment erfolgreich: Die öffentliche App-Link-Zuordnung enthält `/party/join/*`. Die tatsächliche Beitrittsseite auf `event-bliss.com` besteht die Browserprüfung bei 320 und 390 Pixeln ohne Laufzeitfehler oder Überlauf; App-Link und Store-Links vorhanden. Der Start der installierten iPhone-App bleibt eine Geräteprüfung.
- GitHub bestätigt Unit-Tests, Datenbanktests und TypeScript-Prüfung. Der zusätzliche Quality-Gate-Lauf wurde während des Produktionsbuilds abgebrochen und ist deshalb kein vollständig grüner CI-Nachweis. Der lokale Produktionsbuild und der separate iOS-Release-Workflow sind erfolgreich.
- Für die Abnahme auf allen beteiligten iPhones Build 294 installieren und getrennte Konten verwenden. Danach den untenstehenden Geräteprüfplan durchlaufen.

## Aktueller Abnahmestand

- Vollständiger Unit-Lauf: **1.080 Tests in 83 Testsuiten bestanden**. TypeScript-Prüfung erfolgreich; ESLint für die zuletzt geänderten Transport-, Splash- und TV-Dateien ohne Fehler. Datenbanktests: **15/15 bestanden**.
- Abschließender Produktionsbuild nach den TV-Animationskorrekturen erfolgreich (Exitcode 0), einschließlich PWA und **41 vollständig vorgerenderter Seiten**. Anschließend wurden ausschließlich generierte Sitemap-Datumsänderungen zurückgenommen.
- Echte lokale Supabase-Dienste: drei Spiele, später Beitritt, Wiederverbindung und genau einmal gespeicherte Statistiken bestanden. Details: [Realtime-Nachweis](controller-realtime-2026-09-23.md).
- Echte React-Oberflächen mit Supabase Auth/Postgres/Realtime: mitspielender Gastgeber, drei Gäste und TV absolvieren vier Matches einschließlich Rematch, mit eigenen Eingaben, stabiler Wiederverbindung und vier Ergebnissen. TV-Szenen sichtbar; geheime Quizantworten vor der Auflösung verborgen; keine Browser-Laufzeitfehler. Die native Plattformabfrage ist in dieser Browserprüfung simuliert.
- Derselbe vollständige Ablauf besteht auch mit **nicht mitspielendem Moderator, vier Gästen und TV** (Exitcode 0, keine Laufzeitfehler). Die Moderatoridentität bleibt aus aktiven Teilnehmern und Ergebniswertung ausgeschlossen. Berichte: `scripts/tmp/controllers-browser/real-host/report.json` und `real-moderator/report.json`.
- Android-Abschluss-APK gebaut und installiert (SHA-256 `15b1326b85a78082b39fc20265744f61481b77c942cd73c55da4afb1648adb3f`). Ein fehlender Kotlin-Compiler im Ohrwurm-Plugin verhinderte zuvor sämtliche externen Pluginregistrierungen; im Abschlussartefakt sind alle 15 externen Plugins registriert. Nach freigegebenem Emulator-Neustart mit Softwaregrafik ist die Einladungsseite sichtbar. **Native Abnahme noch nicht bestanden:** Android meldet beim Benachrichtigungsdialog einen ANR (`Input dispatching timed out`, `FocusEvent(hasFocus=false)`, 5.005 ms). Anmeldung und Wiederherstellung nach Neustart sind deshalb nicht bestätigt. Die Ursache ist noch nicht einem App- oder Emulatorfehler zugeordnet.
- iPhone mit TestFlight ist laut Nutzer verfügbar. Ein neuer TestFlight-Build, die passende Backendmigration und die unten aufgeführte physische Geräteabnahme stehen noch aus.

Details zum nativen Paket, geprüften Zwischenstand und aktuellen Android-Abschlussartefakt: [Android-Nachweis](native-android-2026-09-23.md).

Die nachfolgenden historischen Prüfschritte erläutern Umfang und Grenzen; spätere Nachweise oben ersetzen frühere offene Punkte nur auf der ausdrücklich geprüften Ebene.

## Umgesetzter Ablauf

1. In der App den Joystick-Modus öffnen und anmelden.
2. Party erstellen; Gastgeber spielt mit oder moderiert ohne eigenen Spielplatz.
3. Andere Personen scannen den QR-Code und treten mit ihrem eigenen Konto in der App bei. Die Webroute zeigt App-Links und Raumcode.
4. Alle aktiven Spieler verbinden sich und melden Bereitschaft. Maximal zwölf aktive Spieler; ein zusätzlicher Moderator ist möglich.
5. Der Gastgeber plant Spiele, deren Teilnehmergrenzen zur gesamten Gruppe passen. Sein Premiumstatus schaltet Premiumspiele für die Gruppe frei.
6. Jeder Controller erhält seine eigene Spieleridentität. Gastgeberaktionen und Spieleraktionen werden getrennt geprüft. Ein Moderator wird nicht versehentlich zum Spielteilnehmer.
7. Der optionale Fernseher zeigt den öffentlichen Spielstand. Verdeckte Antworten, Identitäten und interne Wertungsfelder werden nicht als Zuschauerinhalt übertragen.
8. Ergebnisse werden anhand stabiler Spieler-IDs genau einmal serverseitig verbucht. Neue Spiele erhalten eine neue Match-ID und frische Spielpunkte; Partypunkte bleiben erhalten.

## Technische Umsetzung und Fehlerbehandlung

- Accountgebundene Mitgliedschaften, geschützte Tabellen und RPC-Zugriff mit Host-, Teilnehmer-, Premium- und Kapazitätsprüfung.
- Monotone Serverrevisionen verhindern, dass verspätete Antworten neuere Spiele überschreiben. Generationsprüfungen verhindern Wiederbelebung einer verlassenen Sitzung.
- Matchteilnehmer behalten ihre Reihenfolge und Identität bei kurzen Verbindungsabbrüchen. Anwesenheit bleibt getrennt für Bereitschaft und Verbindungsanzeigen verfügbar.
- Neue Teilnehmer warten während einer Partie bis zum nächsten Spiel. Ein Host kann eine nicht wiederherstellbare Partie ohne Wertung abbrechen.
- Ergebnisübermittlung wird bei Verbindungsfehlern erneut versucht. Die Warteschlange wird nach Konto und Party getrennt lokal gespeichert und beim erneuten Beitritt wiederhergestellt. Bereits bestätigte, abgebrochene oder überholte Matches werden entfernt. Eine verlorene HTTP-Bestätigung nach erfolgreicher Speicherung führt zurück in die Lobby; eine verspätete Bestätigung beendet kein neueres Spiel. Bei nicht verfügbarem Gerätespeicher bleibt nur die laufende Prozesswarteschlange.
- Ausgeschiedene Teilnehmer bleiben in der historischen Gesamtwertung erhalten, belegen aber keinen aktiven Spielplatz. Nur dasselbe Konto kann seine Mitgliedschaft und Punkte wieder aufnehmen.
- Universal Links und eigener App-Link für Einladungen; Rückkehr aus Anmeldung, Registrierung und Passwortwiederherstellung erhält das Einladungsziel. Native E-Mail-Rückrufe tauschen den PKCE-Code genau einmal gegen die Sitzung aus; Authentifizierungscodes gelangen nicht in die App-Navigation. Kalter und warmer Link-Empfang sind gegen überholte Rückrufe abgesichert.
- Bestätigte Navigation beim Verlassen, Fokusführung und lokale Timerpause in Dialogen; ein laufendes Onlinespiel pausiert nicht durch den Dialog einer einzelnen Person.
- Texte des Joystick-Modus in allen zehn vorhandenen Sprachen.

## Prüfplan und bisherige Nachweise

| Ebene | Prüfung | Nachweis / Grenze |
| --- | --- | --- |
| Datenbank | Accountzugriff, RLS, Hostrechte, exakte Teilnehmer, Premium, Kapazität, doppelte Ergebnisse, neue Controlleridentität, Revisionen, Austritt und historische Punkte | 15 erfolgreiche Integrationstests mit tatsächlicher Migration in PGlite; kein produktiver Supabase-Test |
| Transport | Signierte Nachrichten, fremde Absender, Moderatorrolle, Start, veraltete Matches, Disconnect/Rejoin | Automatisierte RoomSession-Tests mit isoliertem Transport |
| Zustand | Verspätete Reads/Writes, Sign-out, gleiche Namen, Unentschieden, Ergebnisfilterung | Automatisierte Controller- und Spiele-Regressionstests |
| Darstellung | Alle 22 Spiele auf schmalen Displays; Zeichnen, TV-Zeichnung, Dialog und Timer | Separater Bericht `gameplay-audit-2026-09-23.md`; teilweise ausdrücklich synthetische Inhalte |
| Build | TypeScript, Unit-Tests, Datenbanktests, Produktionsbuild | Lokal ausführbare Prüfungen; CI um blockierende TypeScript-, DB- und Buildschritte erweitert |

Reproduzierbare Befehle: `pnpm test`, `pnpm typecheck`, `pnpm test:db`, `pnpm build`. Browserprüfungen unter `scripts/qa/` benötigen einen lokalen Vite-Server. Berichte und Screenshots liegen unter `scripts/tmp/`.

Vollständiger Unit-Lauf nach Ergebniswiederherstellung und nativer Authentifizierung: **83 Testsuiten, 1.080 Tests bestanden**. Vollständiger TypeScript-Check ohne Fehler. Datenbanklauf: **15/15 bestanden**. Der gezielte Browserlauf für Zeichnen, TV-Snapshots, Fokus und Timer besteht mit **fünf Prüfungen ohne Laufzeitfehler** (`scripts/tmp/game-interactions/report.json`). Spätere rein visuelle Korrekturen werden zusätzlich gezielt geprüft.

Der abschließende direkte Aufruf `npm run build` endete mit **Exit-Code 0**, inklusive PWA-Ausgabe und 41 vollständig vorgerenderten Seiten. Bestehende Hinweise zu Browserslist, großen Bundles und `eval` in Drittanbieterbibliotheken bleiben bestehen. Ein vorheriger Lauf mit PowerShell-Umleitung hatte Warnungen als `NativeCommandError` behandelt; deshalb wurde der vollständige Build mit direkter Ausgabe bestätigt.

Der echte Webpfad `/party/join/ABCDEF` wurde anschließend am gebauten Produktionspaket bei **320 und 390 Pixeln erfolgreich geprüft**: korrekter Raumcode, App-Link und Store-Links, keine Browser-Beitrittsfelder, kein horizontaler Überlauf, keine Laufzeitfehler und keine versuchten Cloud-Schreibzugriffe. Beide Screenshots wurden visuell geprüft. Bericht: `scripts/tmp/controller-web-fallback/report.json`; Wiederholung: `node scripts/qa/controller-web-fallback.mjs http://127.0.0.1:5182` bei laufendem Preview-Server. Ein vorheriger Entwicklungsserver-Lauf scheiterte an veralteten Vite-Abhängigkeiten (HTTP 504), nicht an der App-Route. Der native Start der installierten App wurde dadurch nicht geprüft.

## Verbleibende Freigabeprüfungen

1. Lokale Migration und echte Supabase-Authentifizierung/Realtime sind bestanden. Die Produktionsmigration ist inzwischen angewendet; der komplette Mehrgeräteablauf auf diesem Backend bleibt Teil der Geräteabnahme.
2. iOS und Android: QR-Start kalt/warm, Anmeldung mit Rückleitung, App-Links, Touchbedienung, Hintergrundwechsel, Netzwechsel und Geräte-Zurück prüfen.
3. Mehrere echte Geräte mit Moderator und optionalem TV gemeinsam spielen lassen; mindestens ein komplettes Set, ein Rematch, einen Disconnect und einen Host-Neustart prüfen.
4. Live-Inhalte von Nah dran und Pixeljagd sowie Spotify-/Maps-Abhängigkeiten mit freigeschalteten Testkonten prüfen. Lokale synthetische Inhalte belegen keine Live-Verfügbarkeit.
5. Bestehende globale ESLint-Altlasten weiter abbauen. Der globale Lint-Schritt bleibt ausdrücklich nicht blockierend; Regeln wurden nicht abgeschwächt.
6. Der laut `C:\Users\luca\AGENTS.md` verlangte externe Security-Scanner wurde versucht, startete jedoch mit npm-Fehler `Cannot read properties of null (reading 'package')` nicht. Dies ist kein bestandener Scan; die lokalen Zugriffsschutztests sind davon unabhängig.

Die App-only-Grenze ist eine Produkt- und Navigationsregel. Die Sicherheitsgrenze bleibt serverseitige Authentifizierung und Autorisierung; native Geräteattestierung ist nicht implementiert.

## Konkrete iPhone-Abnahme mit TestFlight

Der lokale Produktionsbuild nach den UI-/Auth-Korrekturen wurde erneut mit Exitcode 0 abgeschlossen (inklusive 41 vollständig gerenderter Seiten). Die nachfolgende echte Realtime-Prüfung untersuchte zusätzlich zwei Reihenfolgeprobleme: verspätete Presence-Verifikation und Wiederverwendung eines noch abmeldenden Kanals. Im installierten Realtime-SDK liefert `channel(topic)` einen bestehenden gleichnamigen Kanal zurück. Die abschließende Gerätefreigabe benötigt deshalb zusätzlich die überprüfte Korrektur des asynchronen Kanalabbaus.

Ein iPhone mit TestFlight steht laut Nutzer bereit. Die Prüfung muss den neuen Quellstand verwenden; ein älterer installierter Build belegt die Änderungen nicht. Auf dem Windows-Rechner ist kein iOS-Simulator verfügbar. Die vorhandene GitHub-Workflowdatei `ios-testflight.yml` kann zunächst mit `skip_upload=true` ein signiertes IPA erzeugen; dieser Schritt allein veröffentlicht keinen TestFlight-Build. Anschließend müssen Upload, Verarbeitung und installierte Buildnummer separat bestätigt werden. Für den Joystick-Modus benötigt das verwendete Backend außerdem die neue Migration.

| Schritt | Durchführung | Erwartetes Ergebnis |
| --- | --- | --- |
| Einladung kalt | App vollständig schließen, Party-QR mit Kamera scannen | App öffnet exakt die eingeladene Party; ohne Sitzung zunächst Anmeldung |
| Anmeldung | Mit eigenem Testkonto anmelden | Rückkehr zur eingeladenen Party ohne erneutes Scannen |
| Einladung warm | App geöffnet lassen, andere gültige Party-Einladung öffnen | Zielparty wird korrekt angezeigt; keine verspätete alte Navigation |
| Registrierung/Recovery | E-Mail-Bestätigung beziehungsweise Passwort-Link auf demselben iPhone öffnen | Sitzung beziehungsweise Passwortformular; danach erhaltenes Einladungsziel |
| Eigener Controller | Vier Teilnehmer plus Moderator verbinden, Bereitschaft bestätigen | Jeder bedient nur seine eigene Rolle; Moderator zählt nicht als Spieler |
| Komplettes Set | Fake or Fact, Dies oder Das und Flaschendrehen spielen, danach Rematch | Neue Spielpunkte beginnen bei null; Gesamtwertung bleibt; Gleichstände sichtbar |
| Lebenszyklus | Gast kurz in Hintergrund, Verbindung unterbrechen, zurückkehren | Identität und Punkte bleiben; Verbindungsstatus reagiert verständlich |
| Ergebnisretry | Host beim Ergebnis kurz offline, App neu starten, Party erneut öffnen | Noch nicht bestätigtes Ergebnis wird einmal gespeichert; keine doppelten Punkte |
| TV | Optionalen TV verbinden, geheime Rollen/Antworten prüfen | Öffentlicher Spielstand; keine privaten Inhalte |
| Bedienung | Kleine Ansicht, große Systemschrift, Zurückgeste, Neigung und Audio prüfen | Lesbare Inhalte, erreichbare Aktionen, bestätigtes Verlassen und korrekte Wiederaufnahme |

Je Durchlauf festhalten: TestFlight-Version/Build, iOS-Version, Teilnehmerrollen, Backend, erwartetes/tatsächliches Verhalten. Externe Spotify-/Maps-Flows benötigen passende Testkonten und werden separat protokolliert.
