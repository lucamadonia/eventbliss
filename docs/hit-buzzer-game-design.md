# Hit-Buzzer – Spielkonzept und Umsetzungsplan

Stand: 1. November 2026. Arbeitstitel **Hit-Buzzer**. Dieses Dokument beschreibt die beabsichtigte Spielregel und den konkreten Bauplan. Das Cover und der Einstieg im Admin-Bereich sind angelegt; der spielbare Ablauf ist noch nicht implementiert.

![Hit-Buzzer-Cover](../public/images/games/hit-buzzer.webp)

## 1. Versprechen und Grenzen

Hit-Buzzer ist ein schnelles Song-Erkennungsspiel. Ein 30-Sekunden-Ausschnitt läuft ausschließlich auf dem Host-Gerät. Jede spielende Person hat einen Buzzer. Wer zuerst buzzert, sagt **Interpret und Titel** laut. Der Host bestätigt die Antwort. Eine richtige Antwort belohnt eine schnelle Reaktion; eine falsche kostet Punkte und lässt die übrigen Spieler wieder zu.

Das Spiel braucht keine Jahreszahlen, Zeitlinie, Albumcover, Spotify-Premium-Mitgliedschaft oder Texterkennung. Es verwendet die vorhandenen 30-Sekunden-Vorschauen und denselben gepflegten Songbestand wie Ohrwurm. Der Host trifft die Entscheidung bei Schreibvarianten, Features, Coverversionen und unklarer Aussprache.

## 2. Entscheidungen für Version 1

| Regel | Vorgabe | Einstellbar |
| --- | --- | --- |
| Ziel | Höchste Punktzahl nach 15 Songs | 5–30 Runden oder erster zu 500/750/1000 Punkten |
| Musikfenster | Maximal 30 Sekunden pro Song | Nein, durch Vorschau begrenzt |
| Antwortfenster | 8 Sekunden ab bestätigtem Buzz | 5/8/12 Sekunden |
| Richtige Antwort | Interpret **und** Titel; Host bestätigt | Keine automatische Prüfung |
| Punkte | +100 bis +40, abhängig vom Buzz-Zeitpunkt | „Konstant“ mit +100 als barrierearme Option |
| Falsche/keine Antwort | −20 Punkte, genau ein Versuch pro Spieler oder Team und Song | −10/−20/−30 oder ohne Abzug |
| Punktestand | Darf negativ werden | Nein |
| Gleichstand | Gemeinsamer Sieg; auf Wunsch Stichrunde | Stichrunde im Setup |
| Wiedergabe | Host spielt den Ausschnitt; TV zeigt nur die Runde | Keine doppelte TV-Wiedergabe |

Der vorgeschlagene Zeitwert lautet `max(40, 100 - 2 × floor(abgelaufene Sekunden))`. Maßgeblich ist der vom Host angenommene Buzz-Zeitpunkt, **nicht** die Dauer der mündlichen Antwort. Nach Buzz werden Musik und 30-Sekunden-Uhr eingefroren. Bei einer falschen Antwort laufen beide an derselben Stelle weiter; bereits gesperrte Spieler dürfen in dieser Runde nicht erneut buzzern. Bei richtiger Antwort endet der Song sofort. Erreicht jemand das Punktziel durch einen bestätigten Treffer, endet das Spiel nach der Auflösung dieses Songs.

Beispiel: Buzz nach 7,8 Sekunden ergibt +86 Punkte. Falsche Antwort kostet 20, sperrt nur diese Person beziehungsweise ihr Team und setzt den Song bei 7,8 Sekunden fort. Ein anderer Spieler buzzert bei 11,2 Sekunden und erhält bei richtiger Antwort +78. Die 8 Sekunden Antwortzeit verbrauchen keine Musikzeit.

## 3. Geräte- und Teammodelle

### Eigenes Handy / Joystick-Modus

- Der Host eröffnet wie bei Party Play eine Lobby mit Code und QR. Die Spieler kommen über ihr eigenes Handy hinein. Die Spielerkarte zeigt den eigenen Namen, Teamfarbe, Punktestand, Verbindungsstatus und einen dauerhaft erreichbaren großen Buzzer.
- **Jedes Handy hat seinen eigenen Buzzer**, auch wenn mehrere Personen im selben Team spielen. Ein Buzz ist immer einer eindeutig zugeordneten Person zuordenbar. Der Team-Punktestand wird separat geführt.
- Ein Spieler ohne eigenes Handy kann als Platz auf dem Host-Handy teilnehmen. Anders als bei Pixeljagd hat **jeder solche Platz einen eigenen sichtbaren Buzzer** auf dem Host-Gerät; ein geteiltes Handy bedeutet nicht automatisch nur einen Versuch für alle.
- Im Teammodus sperrt eine falsche Antwort das gesamte Team für diesen Song, weil sonst große Teams mehr Versuche bekämen. Im Einzelmodus sperrt sie nur den Spieler. Mehrere Teammitglieder dürfen bis zum ersten akzeptierten Buzz jeweils drücken; der erste Buzz reserviert den Teamversuch.
- Der Host kann Moderator sein, ohne mitzuspielen. Spielt der Host mit, erscheint sein eigener Buzzer neben den Host-Steuerelementen; ein versehentliches Tippen auf „Richtig“ darf keinen eigenen Buzz auslösen.
- Die Host-Ansicht zeigt alle Plätze, Verbindungen und Buzz-Eingänge. Jeder Gast sieht den gleichen Phasenstand, jedoch keine Lösung und keine anderen privaten Eingaben.

### Ein Gerät / Pass & Play

- Auf dem Host-Handy erscheint eine Buzzer-Fläche mit **einem großen, farblich getrennten Button pro Spieler oder Team**. Niemand muss einen allgemeinen „Buzz“-Knopf drücken und erst danach auswählen, wer es war.
- Die Buttons bleiben während des Hörens gleichzeitig erreichbar. Für mehr als vier Plätze wird die Fläche in zwei Spalten oder eine scrollbare Liste mit feststehender Musiksteuerung aufgeteilt; Mindestzielgröße 48 × 48 CSS-Pixel, besser deutlich größer.
- Der Host bewertet nach einem Buzz. Ist der Host zugleich Spieler, kann die Gruppe einen neutralen Moderator bestimmen; bei Self-Play bleibt die Antwortprüfung bewusst manuell und transparent.
- Beim falschen Versuch verschwindet nur der gesperrte Button. Alle anderen bleiben sofort aktiv, sobald der Host „Falsch“ bestätigt und die Vorschau wieder läuft.

### Teams

- Teamfarben, Namen und Mitglieder werden aus der Party-Lobby übernommen. Außerhalb der Party-Lobby bietet das Setup Einzelspieler und Teams an.
- Punkte gehören dem Team, der Buzz wird zusätzlich mit dem tatsächlichen Mitglied protokolliert. Auf TV und Ergebnisanzeige stehen Teamname und – wenn vorhanden – der buzzende Spieler.
- Gleichzeitige Buzzes aus demselben Team ergeben nur einen Teamversuch. Der zuerst angenommene Buzz wird angezeigt.

## 4. Ablauf einer Partie

1. **Setup:** Spielmodus, Runden-/Punktziel, Strafpunkte, Antwortfrist, Genre/Marktfilter und Einzel-/Teamwertung wählen. Standardwerte erlauben einen Start mit einem Schritt. Die Anzahl tatsächlich verfügbarer Songs wird angezeigt.
2. **Lobby:** Code/QR, Host und Gäste, Teams und kontrollierte Plätze werden gezeigt. Erst der Host startet. Fehlende oder getrennte Teilnehmer sind klar markiert; Start ist erst ab zwei aktiven Spielplätzen möglich.
3. **Song vorbereiten:** Der Host zieht genau eine bislang in dieser Partie ungespielte Song-ID. Die Vorschau wird vor dem Countdown geladen. Der Host hört optional kurz in einer privaten Kontrolle, ohne den Song zu verbrauchen. Fehlt der Clip, gibt es „Erneut laden“ und „Song überspringen“; kein Punkteabzug, keine verbrauchte Runde.
4. **Synchroner Start:** 3–2–1 auf Host, Handys und TV; danach startet die Host-Audioausgabe. Der Host sendet `roundId`, `startedAt` und Zustand. Buzzer öffnen erst nach bestätigt gestarteter Wiedergabe.
5. **Buzz:** Das erste gültige Signal reserviert den Antwortversuch. Alle Geräte zeigen „[Name] ist dran“; Musik und Rundenuhr pausieren. Der Host hört die gesprochene Antwort und hat „Richtig“, „Falsch“, „Nochmal hören“ und „Nicht wertbar“.
6. **Auflösung:** Richtig beendet den Song und zeigt Titel, Interpret, Punkte und neue Tabelle. Falsch zieht Punkte ab, sperrt den Spieler/das Team und öffnet nach kurzer gemeinsamer Freigabe die übrigen Buzzer. „Nicht wertbar“ gibt den Buzzer ohne Abzug frei, etwa bei Verbindungsfehler oder Fehlbedienung.
7. **Zeit abgelaufen:** Bei 30 Sekunden ohne Treffer endet der Song punktlos. Wenn ein gültiger Buzz unmittelbar vor Ablauf angenommen wurde, darf die begonnene Antwortfrist zu Ende laufen.
8. **Nächster Song:** Host bestätigt; die neue Runde bekommt eine neue ID und einen anderen Song. Nach 15 Songs oder Erreichen des Punktziels folgt die Rangliste mit „Noch einmal“ und frischer Punktzahl.

## 5. Zustände und Datenvertrag

`setup → lobby → loading → countdown → listening → answering → judging → listening/roundResult → gameResult`.

| Feld | Bedeutung |
| --- | --- |
| `matchId`, `roundId`, `revision` | Neue Partie, eindeutiger Songversuch und monotoner Zustand; alte Aktionen verwerfen |
| `songId`, `previewUrl` | Nur Host; niemals an Gäste oder TV vor Reveal schicken |
| `phase`, `phaseStartedAt`, `clipElapsedMs` | Synchronisierte Anzeige; Host bleibt Zeitautorität |
| `claim` | Buzz-ID, Spieler-/Team-ID, angenommener Host-Zeitpunkt, Status |
| `lockedIds` | In diesem Song ausgeschlossene Spieler/Teams |
| `scores`, `history` | Wertung und idempotent protokollierte Entscheidungen |
| `answerExpiresAt` | Frist nach Buzz; Countdown pausiert die Vorschau |

Eingänge heißen etwa `buzz`, `host-judge`, `host-void`, `next-round`, `clip-ready`. Jeder Eingang trägt `matchId`, `roundId`, `actionId` und Absender. Der Host verarbeitet nur einen Eingang, der zur aktuellen Runde passt und dessen Absender den behaupteten Platz tatsächlich kontrolliert. Ein wiederholtes `actionId` ändert nichts. Gäste dürfen nie selbst Punkte, Songwahl, Host-Bewertung oder Reveal senden.

**Fairness:** Die erste beim Host gültig eingetroffene Buzz-Nachricht gewinnt. Geräteuhren dürfen die Reihenfolge nicht bestimmen, weil sie manipulierbar und unsynchron sind. Netzwerkverzögerung kann ein echtes Gleichzeitigkeitsergebnis verändern. Die UI soll daher keine Millisekunden-Rangliste behaupten; der Host kann ein offensichtlich falsches Ergebnis mit „Nicht wertbar“ aufheben. Ein transaktionaler Server-Buzz mit serverseitiger Reihenfolge ist eine spätere Option, falls reale Tests Host-Ankunft als unzureichend zeigen.

**Reconnect:** Die aktuelle öffentliche Momentaufnahme enthält Phase, verbleibende Vorschauzeit, Punkte, Sperren und derzeitigen Buzz. Bei Host-Verbindungsabbruch pausiert die Partie; kein Gast wird automatisch zum Host. Ein wiederkehrender Gast kann nur noch in der aktuellen offenen Hörphase buzzern. Verlassende Spieler werden aus der Buzz-Auswahl entfernt; ein aktiver Buzz dieser Person wird ohne Strafe freigegeben und im Verlauf vermerkt. Ein Host-„Undo“ rollt nur die letzte Entscheidung dieser Runde zurück und synchronisiert eine höhere `revision`.

## 6. Audio und Songbestand

- **Einzige Datenquelle:** `public.ohrwurm_songs` und der bestehende Ohrwurm-Codebestand. Hit-Buzzer bekommt **keine zweite Songtabelle und keinen Kopierjob**. Der vorbereitete Adapter `src/games/hitbuzzer/song-pool.ts` ruft denselben `loadExtraSongs(aktuelleSprache)`-Lader und `buildDeck()` auf. Die spätere Spielimplementierung muss diesen Adapter beim Start jeder neuen Partie verwenden. Neu angelegte Songs erscheinen dadurch bei der nächsten Partie automatisch; laufende Partien behalten ihren eingefrorenen Deck.
- Dieselben `languages`-Zuordnungen, Aktivierung und Genre-Filter gelten. `base_id` ersetzt den statischen Grundsong, statt ihn zu duplizieren. Stabile IDs verhindern Doppelziehungen und erlauben eindeutige Reports.
- Vorschau: `Song.previewUrl` bevorzugen; andernfalls den vorhandenen `ohrwurm-preview`-Resolver mit Cache, Timeout und Retry verwenden. Nur eine Audioquelle auf dem Host. Kein zweites Streaming, kein Clip-Upload und keine Weitergabe des Vorschau-Links an Gast oder TV.
- Nach dem Reveal kann wie bei Ohrwurm ein direkter Spotify-Link oder Suchlink angeboten werden. Das ändert die In-Game-Wiedergabe nicht.
- Vor Spielstart muss der Songdeck nach aktiven, zum Markt passenden und **spielbaren Vorschauen** beurteilt werden. Ein später fehlgeschlagener Clip wird ohne Rundenverbrauch ersetzt.
- **Bestehende Kante:** `setBaseSongs(null)` fällt auf den eingebauten Grundbestand zurück. Falls die Datenbank erreichbar ist, aber alle Grundsongs bewusst deaktiviert wurden, darf dieser Fallback sie nicht unbemerkt reaktivieren. Das ist vor Freigabe beider Spiele im gemeinsamen Lader zu korrigieren und mit einem Datenbanktest zu belegen.

## 7. Admin-Portal

Im Bereich **Admin → Spiele** steht eine Hit-Buzzer-Karte mit Cover und Link zur gemeinsamen Songverwaltung. Dort wird derzeit derselbe `ohrwurm_songs`-Editor geöffnet. Jahr bleibt ein Metadatenfeld für Ohrwurm, obwohl Hit-Buzzer es nicht wertet. Interpret, Titel, Land/Flagge, Genre, Sprachfassungen, Aktivierung, Vorschau und Spotify-URI werden nur einmal gepflegt. Die Karte ist als **Spielkonzept** gekennzeichnet, bis der komplette Spielablauf freigegeben ist.

Für den späteren Release braucht die Songverwaltung zusätzlich eine gut sichtbare Clip-Prüfung: `spielbar / Vorschau fehlt / Resolver prüfen`, gefiltert nach Sprache und Aktivierung. Ein „Probehören“-Knopf muss dieselbe Host-Wiedergabeart testen, ohne den Song einer Partie zu verbrauchen. Eine Fehlerquote und ein Bericht über übersprungene Songs helfen, stumme Runden gezielt zu beheben. Spielregeln wie Punkteziel und Strafpunkte gehören ins Match-Setup; Admin-Vorgaben dürfen nicht die eigene Songbibliothek duplizieren.

## 8. Corporate Design und Erlebnisqualität

Hit-Buzzer ist visuell Teil von EventBliss Party Play. Die verbindliche Grundlage ist `docs/party-play-design.md`; die Spielansichten verwenden die bereits vorhandenen Bausteine `partyMotion`, `playerGlow`, `pressable`, `SeatAvatar`, `PartyTurnRibbon`, `tvPanel` und `tvType`. Die Buzzerform gibt dem Spiel Wiedererkennung, während Typografie, Raumtiefe, Spielerfarben, Bewegungen und Zustandswechsel aus dem gemeinsamen System kommen.

| Gestaltung | Hit-Buzzer-Anwendung |
| --- | --- |
| Flächen | `#060810` als Bühne, `#0d0915` als Panel, `#16101f` als aktive Karte; keine flachen grauen Kästen |
| Akzente | `#df8eff` für Hauptaktionen, `#8ff5ff` für bereit/bestätigt, `#ff6b98` für Warnung/Strafe; Pink `#FF2E88` nur als Spielakzent am Buzzer |
| Radien | 28 px für Bühnenpanels, 20 px für Karten, volle Rundung für Status-Pills; gleicher Rhythmus auf Host, Handy und TV |
| Typografie | `font-game` für kurze Bühnenansagen; Fließtext in der bestehenden App-Schrift. Zahlen und Countdown mit `tabular-nums`; höchstens zwei Gewichte pro TV-Szene |
| Spieleridentität | Zimmer-/Lobby-Farbe folgt dem Spieler via `playerGlow`; auf Text und Status zusätzlich Name, Avatar, Form und Icon |
| Bild | Eigenständige gezeichnete Gruppenszene im Stil der vorhandenen Ohrwurm-, Pixeljagd- und GEBRÄU-Cover; kein fotorealistischer Neon-Buzzer |

**Cover:** Vier Freunde an einem Tisch, jeder mit eigenem Buzzer, Musikquelle beim Host, ein Mensch drückt zuerst. Handgezeichnete Konturen, ausdrucksstarke Figuren, violette EventBliss-Bühne und sparsame Pink-/Türkis-Akzente. Die App setzt „Hit-Buzzer“ als echten UI-Text über oder neben das Bild; im Bild selbst stehen keine Buchstaben. Datei: `public/images/games/hit-buzzer.webp`.

### 8.1 Informationshierarchie pro Bildschirm

| Phase | Spielerhandy | Host-Handy | TV |
| --- | --- | --- | --- |
| Bereit | Eigener Avatar, Team und großer Buzzer; „Warte auf den Song“ | Song vorbereiten, Lautstärkeprobe, Teilnehmerstatus | Runde, alle Avatare, „Gleich geht's los“ |
| Countdown | Große 3–2–1, Buzzer sichtbar aber gesperrt | Startstatus und Audio-Bereitschaft | Derselbe Countdown zur gemeinsamen `startsAt` |
| Hören | Ein dominanter Buzzer in der Daumenzone, darunter eigener Punktestand | Audio/30-s-Ring, lokale Plätze mit **je eigenem** Buzzer, sichere Juryzone noch verborgen | Songnummer und Ring, Rangliste in fester Seitenzone |
| Buzz angenommen | „Du bist dran“ mit eigenem Avatar und Antwortfrist; andere sehen „[Name] antwortet“ | Musik pausiert, Name groß, Juryaktionen getrennt von jedem Buzzer | Spotlight auf den Buzzenden; keinerlei Songtitel |
| Falsch | Eigener Platz „Für diesen Song gesperrt“; andere Buzzer werden wieder aktiv | −20 sichtbar, dann „Weiterhören“; keine zusätzliche Bestätigung nötig | Kurzer Punktabzug am richtigen Platz, Zeitring läuft weiter |
| Richtig/Ende | Lösung und eigene Punktänderung, dann ruhig warten | Titel/Interpret, kontrollierbarer nächster Song | Song-Reveal, neue Rangfolge und Moment für den Gewinner |
| Verbindung weg | Ruhiger Sperrzustand mit „Verbinde neu …“; keine Schein-Buzzer | Teilnehmerstatus, Host kann pausieren/aufheben | Letzter gültiger Zustand ohne irreführenden Countdown |

Auf dem Handy stehen **Aktion und Zustand** immer vor Dekoration. Der Buzzer muss bei 320 und 390 px Breite ohne Scrollen erreichbar bleiben, einschließlich iOS-Safe-Area und eingeblendeter Systemleisten. Bei mehreren 🔁-Plätzen bleiben die Buzzer eindeutig beschriftet; die Host-Jury erscheint erst nach einem angenommenen Buzz in einer eigenen Zone, damit kein Spielplatz versehentlich bewertet. Für zwei bis vier lokale Plätze ist ein 2×2-Raster möglich; bei mehr Plätzen erhalten die Buttons eine vertikale Liste mit festem Fortschrittskopf. Weder Punkte noch eine Animation dürfen die Trefferfläche verdecken.

Auf dem TV bleiben 5 % Sicherheitsrand für Overscan. Runde und Uhr sind aus drei Metern lesbar; alle handlungsrelevanten Texte verwenden mindestens `tvType.label`, Namen `tvType.body`, Ansagen `tvType.title`. Die Rangliste rückt beim Buzz optisch zurück, aber nie so weit, dass der Punktestand verschwindet. Der TV ist die gemeinsame Bühne und zeigt keine Bedienknöpfe. Die Host-Audioausgabe bleibt die einzige Tonquelle, damit kein Echo entsteht; falls später TV-Audio gewünscht ist, braucht es einen ausdrücklich wählbaren Einzelausgang mit eigener Autoplay-Prüfung.

### 8.2 Bewegung, Ton und Haptik

- **Start:** Countdown und Öffnung der Buzzer benutzen die Party-Szenenuhr (`startsAt`, 600 ms Vorlauf). Ein verspätet verbundenes Handy springt in den aktuellen Zustand, statt den Countdown nachzuspielen.
- **Drücken:** `pressable` mit 140 ms und Scale 0,97, eine präzise Haptik auf dem eigenen Handy. „Gesendet“ erscheint sofort; „angenommen“ erst nach Host-Bestätigung. Keine optimistische Punktevergabe.
- **Buzz-Gewinn:** Avatar, Name und Spielerglow wechseln in höchstens 260 ms; ein kurzer Soundhinweis kommt nur aus der ausgewählten Audioquelle. Kein Stroboskop, keine dauerpulsierende Fläche.
- **Falsch:** Der betroffene Score zählt einmal von alt auf neu, mit klarer −20-Markierung. Die anderen Geräte sehen die Freigabe erst, wenn der Host-Zustand wieder `listening` meldet.
- **Richtig:** Kurzer `checkPop`, dann Lösungskarte. Konfetti ist für die Spielentscheidung am Ende reserviert; wiederholte Treffer erhalten kein überladenes Vollbild-Feuerwerk.
- **Reduzierte Bewegung:** Derselbe Endzustand erscheint ohne räumliche Animation. Fristen und Sperren bleiben semantisch identisch. Haptik und Ton sind nicht die einzigen Hinweise.

### 8.3 Lesbarkeit, Sprache und harte Abnahme

Textkontrast mindestens 4,5:1, große Schrift mindestens 3:1; Spielerfarben niemals allein als Textfarbe. Hauptaktionen mindestens 56 px hoch, andere Trefferflächen mindestens 44 × 44 px mit 8 px Abstand. Sichtbarer Fokus bekommt den bestehenden 2-px-Türkisring. „Richtig“ und „Falsch“ stehen räumlich getrennt und haben Text plus Icon, damit ein Host im Tempo nicht falsch wertet. Live-Ansagen sind für Screenreader kurz und werden nicht bei jedem Timer-Tick wiederholt.

Alle zehn vorhandenen Sprachen brauchen echte Texte für jede Phase, Fehlermeldung und Host-Aktion. Arabisch verwendet logische Layout-Eigenschaften; Zahlen, Punkte und Zeit bleiben lesbar. Lange Namen und lange Songtitel dürfen weder Buzzer noch Juryknöpfe verdrängen. Die Spielgrafik muss im Kartenformat bei 400 px, auf 320/390-px-Handys und auf 1080p-TV getestet werden. Für jede Phase entstehen Vergleichsbilder für Host, eigenes Spielerhandy, 🔁-Platz und TV. Vor Freigabe müssen ein kompletter 15-Song-Abend, Reconnect, fehlender Clip, gleichzeitige Buzzes und Rematch auf echten iOS- und Android-Geräten durchlaufen sein.

### Spätere Varianten

Der Standardmodus bleibt bewusst leicht erklärbar. Denkbare Varianten nach einer realen Testrunde sind **Blitz-Buzzer** (Ausschnitte werden nach zehn Sekunden abgeschnitten), **Doppelter Einsatz** (vor dem Song freiwillig höherer Gewinn und höherer Verlust) und **Finalsong** (ein letzter Song als Stichrunde nur für punktgleiche Erstplatzierte). Alle drei verwenden denselben Songpool und dieselbe Jury; sie benötigen keine zusätzliche Inhaltsverwaltung. Serienboni sollten zunächst nur als Animation erscheinen, damit ein frühes Glück nicht den gesamten Abend entscheidet.

### Cover-Prompt und Herkunft

Erzeugt mit dem integrierten Imagegen-Werkzeug; anschließend als 1024 × 1024 WebP für die App gespeichert. Verwendeter Prompt:

> Edit Image 1 into a square EventBliss game cover matching the established editorial illustration style of Images 2, 3 and 4. Keep the central idea of a song-recognition buzzer contest, but replace the realistic neon-rendered stage entirely with a lively hand-drawn cartoon group scene. Four distinct adult friends gathered around one table at a party; each has their own separate large red/pink buzzer or phone buzzer in front of them, one reaches to press first, others react with anticipation, and a host controls the music from a small speaker/phone. This game is about fast song recognition, not chronology: use a few floating colorful music notes and audio-wave accents, no timeline cards, no pixelated image. Match references' bold ink outlines, expressive faces, warm playful character art, crisp cel shading, textured purple-magenta ambient lighting, cyan and coral accents, grounded tabletop composition, detailed but readable at 400px thumbnail scale. Original characters, not copies of the reference people. Keep main action in center 80 percent with room for square crop. No photorealism, no glossy 3D object, no glowing nightclub laser stage, no written words, no letters, no speech bubbles, no logos, no trademarked imagery.

## 9. Wiederverwendung und Implementierungsreihenfolge

1. **Reine Regeln:** Neuer `src/games/hitbuzzer`-Reducer mit Phasen, Punktformel, Sperren, Teamzuordnung, Timeout, Undo und doppelten/verspäteten Aktionen. Testfälle zuerst an der Regelgrenze.
2. **Gemeinsamer Songadapter:** Der direkte Ohrwurm-Adapter ist angelegt. Den Deaktivierungs-Fallback bereinigen; bei fehlendem Audio ohne Strafpunkte weiterziehen. Test: im Admin neuer Song → nächster Hit-Buzzer-Deck enthält dieselbe ID.
3. **Lokale Partie:** Setup, Host-Audio, Pass-&-Play-Buzzer pro Platz, Host-Jury und Ergebnisansicht. Ohne Netzwerk vollständig spielbar machen.
4. **Joystick/Party:** `OnlineGameProps`, `localSeats`, `mayActFor` und hostautoritatives Aktionsmuster von Pixeljagd verwenden; jedoch **keine** Pixeljagd-Regel „ein Buzzer pro Gerät“ übernehmen. Für jeden kontrollierten Platz einen eigenen Button und eine eigene Sperre zeigen.
5. **TV:** Öffentliche Projektion über `useTVGameBridge`, eigene Hit-Buzzer-Ansicht und Zustandssynchronisierung. Hostgerät bleibt einzige Audioquelle.
6. **Integration:** Erst nach funktionierendem Ablauf in `playable-games.ts`, `GamesHub`, Party-Auswahl, Premium-Konfiguration, zehn i18n-Sprachen, Regeln/Report und ggf. native Navigation aufnehmen. Bis dahin kein antippbares Spiel ohne Route.
7. **Release:** Lokale Tests, Browser mit Host/Gast/TV, echte zwei Handys plus Host, iOS-Audio/Hintergrund, Android-Audio, Reconnect und App-Store-/Play-Builds getrennt nachweisen.

## 10. Abnahmefälle

- Zwei Spieler buzzern nahezu gleichzeitig: genau **ein** gültiger Claim; doppeltes oder verspätetes Event ändert keine Punkte.
- Ein falscher Einzelspieler verliert 20 Punkte und ist gesperrt; zwei andere können den verbleibenden Clip hören und buzzern.
- Zwei Mitglieder eines Teams haben eigene Handy-Buzzer; der erste Claim zählt, eine falsche Teamantwort sperrt das Team, nicht die anderen Teams.
- Drei Plätze auf einem Host-Handy haben drei getrennte Buttons und individuelle Sperren. Host-Jury bleibt unabhängig bedienbar.
- Ein Buzz kurz vor 30 Sekunden erhält seine volle Antwortfrist. Nach 30 Sekunden ohne Buzz ist niemand mehr buzzerberechtigt.
- Ein Clip schlägt fehl: keine stumme Runde, keine verlorene Runde, keine Punkteänderung; nächster Song lädt.
- Ein neuer Admin-Song erscheint in beiden Decks nach neuer Partie, ohne Migration oder doppelten Eintrag. Inaktive beziehungsweise für die aktuelle Sprache ausgeblendete Songs erscheinen in keinem Deck.
- Gerät verliert Verbindung während Buzz oder Juryphase: keine doppelte Wertung; Host kann fortsetzen oder den Claim ohne Strafe aufheben.
- TV und Gäste sehen vor Reveal weder Interpret noch Titel noch Preview-URL; nach Reveal stimmen Punkte und Lösung überein.
- Rematch setzt Punkte, Sperren, Songdeck und `matchId` frisch; alte Buzz-Nachrichten können keine neue Partie beeinflussen.

## Status dieser Ausarbeitung

**Angelegt:** Regelkonzept, Coverdatei, direkter Adapter auf den Ohrwurm-Songpool und Hit-Buzzer-Einstieg im Admin-Bereich mit gemeinsamer Songverwaltung. **Noch umzusetzen:** spielbarer Reducer und Screens, Live-Buzzer für eigene Handys und Host-Plätze, Host-Audio/Jury, TV-Projektion, gemeinsame Songadapter-Tests und echte Geräteabnahme. Der Admin-Einstieg ist bewusst als Konzept markiert, damit die App keinen fertigen Spielmodus verspricht.
