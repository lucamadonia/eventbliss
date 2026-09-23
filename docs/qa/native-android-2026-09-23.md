# Native Android-Prüfung – 23.09.2026

## Abschließender Stand: native Abnahme nicht bestanden

Das Abschluss-APK mit SHA-256 `15b1326b85a78082b39fc20265744f61481b77c942cd73c55da4afb1648adb3f` wurde inzwischen erfolgreich installiert. Root hat den eigenen Emulator nach Freigabe mit Softwaregrafik neu gestartet; die Android-Screenshots zeigen jetzt die tatsächliche Oberfläche. Alle 19 Plugins sind auch in diesem Artefakt registriert. Die kalte Einladung öffnet die richtige Party-Anmeldeseite.

Die anschließende Bedienprüfung hat einen **ANR** erfasst: `Input dispatching timed out`, nach 5.005 ms für `FocusEvent(hasFocus=false)`. Laut `dumpsys activity lastanr` liegt der Android-Benachrichtigungsdialog (`GrantPermissionsActivity`) über der pausierten `MainActivity`; das Gerät ist wach und nicht gesperrt. `MainActivity` enthält keine eigenen Lifecycle-Overrides. Daraus lässt sich noch nicht ableiten, ob App, Plugin/WebView oder Emulator ursächlich blockiert.

Die Teststeuerung bedient Systemdialoge und Schaltflächen anhand ihrer Android-Accessibility-Koordinaten mit echten `adb input tap`-Eingaben. Ein Durchlauf bestätigte das Schließen des Benachrichtigungsdialogs, aber die anschließende Anmeldung bestand nicht. Der Fehler-Screenshot `scripts/tmp/native-device-qa/failure.png` zeigt den ANR-Dialog. **Passwortanmeldung, warmer Einladungslink und Sitzungswiederherstellung nach Neustart sind nicht positiv abgenommen.**

Die weitere Stack-Diagnose konnte nicht ausgeführt werden: Sowohl normale Quell-Lesebefehle als auch der freigegebene `dumpsys dropbox --print data_app_anr`-Aufruf scheiterten vor Prozessstart mit Windows `CreateProcessAsUserW`/`SpawnChild`, Zugriff verweigert (Fehler 5). Nächster Schritt nach Wiederherstellung der lokalen Werkzeugausführung: ANR-Thread-Stack erfassen, Ursache beheben, denselben nativen Ablauf erneut prüfen. Die nachstehenden Abschnitte halten die vorherigen Zwischenstände und reproduzierbaren Befehle fest.

## Umfang und Umgebung

Lokaler Android-15-/API-35-Emulator `emulator-5554`, AVD `Medium_Phone_API_35`, 1080 × 2400 Pixel. Kein physisches Android-Gerät war verbunden. Java 21 wurde portabel unter `scripts/tmp/jdk21` bereitgestellt; Java 17 auf dem PATH genügte der vorhandenen Capacitor-8-Konfiguration nicht. Der vorhandene Android-Studio-JBR konnte wegen einer fehlenden `lib/jvm.cfg` nicht starten.

Das Test-APK verwendet ausschließlich das isolierte Supabase unter `http://10.0.2.2:56321`. Konfiguration, Testkonten, Debug-Assets und Protokolle liegen unter dem ignorierten `scripts/tmp/`. RevenueCat-, Google-Login- und Spotify-Konfigurationswerte sind im Test-Webbuild leer. Die Produktionsdateien `dist` und `android/app/src/main/assets` wurden dafür nicht überschrieben. Ein temporäres Gradle-Init-Skript fügt nur dem Debug-Build lokale Assets und die lokale HTTP-Freigabe hinzu. Es gab keine Release-Signierung, keinen Store-Upload und keine produktiven Raum- oder Kontenänderungen.

## Nachgewiesener Paketfehler und Korrektur

Das erste APK enthielt eine korrekte `assets/capacitor.plugins.json` mit 15 zusätzlichen Plugins. Trotzdem registrierte die laufende WebView nur vier Capacitor-Basisplugins. Android protokollierte:

```text
PluginLoadException: Could not find class by class path:
com.eventbliss.ohrwurmspotify.OhrwurmSpotifyPlugin
```

Der lokale Spotify-Pluginquelltext ist Kotlin, seine Gradle-Datei aktivierte jedoch nur `com.android.library`. Die Kotlin-Datei wurde deshalb nicht kompiliert. Der fehlgeschlagene Ladevorgang verhinderte auch die Registrierung der übrigen Plugins, darunter `App`, `Keyboard` und `Preferences`.

`native-plugins/ohrwurm-spotify/android/build.gradle` aktiviert jetzt den bereits lokal vorhandenen Kotlin-Compiler 2.2.20 mit JVM-Ziel 17. Die gezielte Aufgabe `:ohrwurm-spotify:compileDebugKotlin` bestand und erzeugte tatsächlich `OhrwurmSpotifyPlugin.class`. Der anschließende Debug-Build bestand mit 548 Aufgaben, und das APK wurde erfolgreich installiert.

Im installierten korrigierten APK wurden alle 19 Plugins nachgewiesen: 15 zusätzliche Plugins einschließlich `App`, `Keyboard`, `Preferences`, `PushNotifications` und `OhrwurmSpotify` sowie vier Basisplugins. Der getestete Zwischenstand hatte SHA-256 `b8b2ef9ca66dead92567a036f317c11d079f36c964eedd9c3fbdd4859c780dea`. Er ist ausdrücklich vom anschließend neu gebauten Abschlussartefakt zu unterscheiden.

## Abschließendes lokales Debug-Artefakt

Der nachfolgende aktuelle Webbuild bestand in 3 Minuten 36 Sekunden; das abschließende Android-APK bestand mit Exitcode 0 in 2 Minuten 37 Sekunden (548 Aufgaben). Es enthält die anschließenden gemeinsamen Korrekturen an Presence, TV, Authentifizierung und Splash sowie den Kotlin-Paketfix.

- Datei: `android/app/build/outputs/apk/debug/app-debug.apk`
- SHA-256: `15b1326b85a78082b39fc20265744f61481b77c942cd73c55da4afb1648adb3f`
- Android-Versionsbezeichnung unverändert 1.5.11 / Version-Code 12; der Hash identifiziert diesen lokalen Debug-Quellstand eindeutig.
- Dieses Abschlussartefakt ist zunächst gebaut, nicht als vollständig visuell oder funktional auf dem Gerät abgenommen zu betrachten. Der nachstehende Zwischenstands-Nachweis darf nicht stillschweigend auf dieses APK übertragen werden.

## Einladungen und Authentifizierung

Ein echter Android-VIEW-Intent mit `eventbliss://party/join/N6947V` öffnete im korrigierten APK die Route `/party/join/N6947V`. Die WebView zeigte die Anmeldeaufforderung des Joystick-Modus. In diesem Durchlauf wurden keine JavaScript-Laufzeitfehler erfasst.

Zusätzlich wurden folgende Quellfehler korrigiert und automatisiert geprüft:

- Registrierung bewahrt das lokale Rücksprungziel statt pauschal zur Startseite zu navigieren.
- Ein verspätetes Kaltstart-Ergebnis überschreibt keinen neueren warmen App-Link.
- Android und iOS registrieren das bisher fehlende Rücksprungschema `app.eventbliss` für E-Mail-Authentifizierung.
- Die ergänzte JavaScript-Verarbeitung für PKCE, Passwort-Rücksetzung und gespeicherte Einladungsziele ist im Hauptbericht beschrieben.

Die beiden Tests zur nativen Paketregistrierung bestanden. Die ursprünglichen Einladungs-/Rücksprungtests bestanden mit 15 Tests; weitere Callback-Tests wurden danach vom Integrationsagent ergänzt. Die letzte vom Integrationsagent bestätigte vollständige Testsuite umfasst 1080 bestandene Tests in 83 Dateien.

## Offene Geräteabnahme: keine positive visuelle Aussage

Der Emulator meldete zahlreiche OpenGL-Fehler (`0x502`, `Draw context is NULL`). Sowohl die Android-Aufnahme als auch die WebView-Aufnahme lieferten keine brauchbare visuelle Abnahme: Die Android-Aufnahme ist schwarz, und simulierte Klicks auf die sichtbare DOM-Schaltfläche wechselten nicht zur Anmeldung. Der erfolgreiche DOM-/Plugin-Nachweis ist daher **kein** bestandener Touch-, Anmelde- oder visueller Gerätetest.

Der angeforderte Neustart des eigenen Emulators mit Softwaregrafik wurde nicht ausgeführt. Die eskalierte Werkzeuganfrage zum Beenden des Emulators blieb hängen und wurde abgebrochen; ein anschließender Sandbox-Aufruf scheiterte mit `Cannot mkdir '\\.android': Permission denied`. Der Emulator blieb unverändert. Es wurden keine fremden Prozesse oder Docker-Instanzen beendet.

Nach Freigabe der konkreten Emulator-Neustartaktion ist diese Reihenfolge vorgesehen; App-Daten bleiben erhalten:

```powershell
& 'C:/Users/luca/AppData/Local/Android/Sdk/platform-tools/adb.exe' -s emulator-5554 emu kill
Start-Process -FilePath 'C:/Users/luca/AppData/Local/Android/Sdk/emulator/emulator.exe' -WindowStyle Hidden -ArgumentList '-avd','Medium_Phone_API_35','-gpu','swiftshader_indirect','-no-window','-no-audio','-no-snapshot-load','-no-snapshot-save'
```

`swiftshader_indirect` ist durch die Hilfe des installierten Emulators bestätigt. Danach das aktuelle Debug-APK installieren und `node scripts/qa/native-device-qa.mjs` ausführen. Der Test erwartet den lokalen Supabase-Stack, die ignorierten Testkontendateien und einen laufenden lokalen Gastgeber aus `scripts/qa/controller-native-host.mjs`. Er prüft Pluginregistrierung, Kaltstart-Einladung, Anmeldung über die Oberfläche, warmen App-Link und Sitzungserhalt nach vollständigem App-Neustart. Die noch offenen Schritte dürfen nicht aus dem bisherigen Bericht als bestanden übernommen werden.

## iPhone/TestFlight

Der Nutzer hat ein iPhone mit TestFlight bestätigt. Auf dem Windows-Rechner sind `xcodebuild` und `idevice_id` nicht verfügbar. Der vorhandene Workflow `ios-testflight.yml` nutzt einen macOS-26-Runner; `workflow_dispatch` bietet `skip_upload` mit Standardwert `false`. `skip_upload=true` erzeugt zunächst ein signiertes IPA-Artefakt ohne TestFlight-Upload. Buildnummer ist `github.run_number`, Marketing-Version im Projekt aktuell 1.5.12. Für die iPhone-Abnahme müssen Quell-Commit, Workflow-Lauf und tatsächlich installierte Buildnummer zusammenpassen. Kein Workflow wurde für diese Prüfung ausgelöst.

Verwandte Nachweise: [Controller-Implementierung](controller-party-implementation-2026-09-23.md), [echter lokaler Supabase-/Realtime-Test](controller-realtime-2026-09-23.md). Die Emulator-Ausgaben liegen unter `scripts/tmp/native-device-qa/report.json`; schwarze Screenshots sind ausschließlich Fehlerbelege.
