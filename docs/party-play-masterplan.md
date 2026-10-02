# Party-Play Masterplan — ein Party-Abend, jedes Handy, ein Fernseher

Stand: 2026-10-01 · Status: Entwurf zur Freigabe · Kill-Switch: `party_unified_off`

> Ziel: Der Party-Abend ist DAS Erlebnis, mit dem sich EventBliss abhebt.
> QR scannen → „Wer bist du?“ → spielen. Niemand muss Modi, Codes oder
> Regeln der App verstehen. Kein Bildschirm bleibt je hängen, alle Geräte
> wechseln im selben Moment, und der Fernseher sagt jederzeit, was passiert.

---

## 0. Goal

**Nordstern:** EventBliss ist die Party-App, bei der eine ganze Gruppe in unter zwei Minuten vom QR-Code am Fernseher zum ersten Spiel kommt — egal ob jeder ein Handy hat oder nur der Host — und bei der alle Geräte wie ein einziges System wirken.

**Messbare Ziele (Release „Party-Play 1“):**
| # | Ziel | Messung |
|---|---|---|
| G1 | Scan → „Du bist dabei“ ≤ 30 s (eingeloggt) | Harness A01 + Playtest |
| G2 | Gruppe von 8 → erstes Spiel ≤ 2 min | Playtest |
| G3 | Gemischter Abend: 0–100 % eigene Handys in jeder Party möglich | Szenarien B, F09 |
| G4 | Kein hängender Zustand in 50 Chaos-Läufen | Chaos-Harness |
| G5 | Szenenversatz zwischen Geräten ≤ 250 ms | T-1 |
| G6 | Punkte gehen in keinem Szenario verloren | D-/B-Tests B01–B13, F13–F19 |
| G7 | Host kann jederzeit Spieler entfernen, ohne dass ein Spiel hängt | F13–F19 |
| G8 | Alle neuen Texte in 10 Sprachen | Schlüssel-Test |

**Festlegungen für den Start** (aus Abschnitt 14, jederzeit änderbar):
- Echtzeit-Spiele: Gäste am Host-Handy setzen aus (`sitout`) — Standard für alle nicht angepassten Spiele.
- Keine Host-Übergabe in Release 1.
- Lokaler Ein-Handy-Abend bleibt vorerst unverändert; Umzug auf den Server folgt in Phase 6.
- UI-Bezeichnung „Joystick-Modus“ bleibt bis Phase 5.
- Gäste ohne Login; Host und 📱-Spieler mit Login. Freier Beitritt mit Code, Host kann entfernen und sperren.

**Sprint 1 (jetzt):** Phase 1 (TV-Wartebereich), Phase 2 (Server + „Wer bist du?“ + Profil + Entfernen), Grundlagen aus Phase 3 (Szenen-Uhr, `sharedDevice`, `HandoverScreen`, `localPlayerIds`, Gäste `sitout` im Spiel).

---

## 1. Ausgangslage (Ist-Zustand)

| Heute | Code | Problem |
|---|---|---|
| Party-Modus (ein Handy) | `/party`, `usePartySession`, `playMode: 'local'` | Nur lokal, kein Beitritt per Handy |
| Joystick-Modus | `/party/controllers`, `controller-session.ts`, RPC `controller_party_request` | Nur „alle mit eigenem Handy + Konto“, kein Mischbetrieb |
| Online-Raum | `/join-room`, `?room=`, `room-session.ts` | Keine Gesamtwertung, eigener Einstieg |
| TV-Startbild | `TVLobby.tsx` | Zeigt nur Presence-Spieler (lokale Party: leer), falscher Link `/tv/CODE` für Spieler, QR nur 148 px in der Ecke (`TVScreen.tsx:272`) |
| TV verbinden | `TVCodeEntry` | Code mit der Fernbedienung tippen |
| Szenenwechsel | Broadcast „sofort“ | Jedes Gerät wechselt, wenn die Nachricht ankommt → Versatz je nach Netz |

Technische Fakten:
- `controller_party_members.user_id` ist `NOT NULL` → heute braucht jedes Mitglied ein Konto.
- Symbol/Farbe werden aus der Reihenfolge berechnet (`createPartyPlayer(id, name, i)`), nicht gespeichert.
- Alle 22 Online-Spiele gehen von **ein Gerät = ein Spieler** aus (`myPlayerId`).
- Partys laufen 24 h ab, max. 12 Spieler, Premium hängt am Host.
- QR-Beitritt `/party/join/CODE` tritt eingeloggt bereits automatisch bei.
- Multi-Client-Testaufbau existiert: `scripts/qa/controllers-browser.mjs` (PGlite oder `--real`), `game-roster-matrix.mjs`.

---

## 2. Zielbild

### 2.1 Ein Modell statt drei Modi

Ein **Party-Abend** hat Spieler. Jeder Spieler hat genau einen **Platz**:

| Platz-Art | Symbol | Gesteuert von |
|---|---|---|
| Eigenes Handy | 📱 | dem Konto, das den Platz übernommen hat |
| Am Host-Handy (Gast) | 🔁 | dem Handy des Hosts |

0 % eigene Handys = heutiger Party-Modus · 100 % = heutiger Joystick-Modus · dazwischen = **gemischter Abend (neu)**.

Der **Online-Raum** bleibt als „Schnelle Runde“ (ein Spiel, keine Gesamtwertung) — gleiches Raum-Gerüst ohne Party-Klammer.

### 2.2 Grundsätze

1. **Nie hängen.** Jeder Zustand hat einen sichtbaren Ausweg.
2. **Gleichzeitig.** Szenenwechsel passieren auf allen Geräten im selben Moment (≤ 250 ms Versatz).
3. **Der Fernseher erklärt, die Handys handeln.** Wer wartet, sieht auf dem TV, worauf. Das Handy zeigt nur, was *ich* tun muss.
4. **Punkte gehen nie verloren** — weder durch Gerätewechsel, Abbruch, Neuladen noch Update.
5. **Ein Tipp pro Entscheidung.** Vorauswahl, wo es nur eine sinnvolle Option gibt.
6. **Geheimes bleibt geheim.** Nie auf dem TV; beim Weitergeben immer verdeckt.
7. **Der Server ist die Wahrheit** für Plätze, Profile, Wertung. Der Spielverlauf bleibt beim Host-Gerät.
8. **Ohne TV genauso gut.** Fehlt der Fernseher, übernimmt das Host-Handy dessen Ansagen.

---

## 3. Abläufe aus Nutzersicht

### 3.1 Host startet den Abend
1. „Gemeinsam spielen“ → „Party-Abend mit Wertung“.
2. Optional Spieler ohne Handy eintragen (Name, Symbol, Farbe).
3. „Fernseher dazunehmen?“ → TV zeigt Kopplungs-QR → Handykamera → verbunden.
4. TV zeigt den **Wartebereich** (5.3) mit großem Beitritts-QR.
5. Spieleliste planen — parallel zum Beitreten der Gäste.

### 3.2 Gast scannt den QR am Fernseher
```
Kamera → event-bliss.com/party/join/CODE → App öffnet sich
  ├─ nicht installiert → Web-Seite: Code + App Store / Google Play; nach Installation weiter mit Code
  ├─ nicht eingeloggt  → Login/Registrierung → automatisch zurück in den Beitritt
  └─ eingeloggt        → „Wer bist du?“
```
Ziel: **≤ 30 s vom Scannen bis „Du bist dabei“** (eingeloggt, App installiert).

### 3.3 „Wer bist du?“
```
┌─────────────────────────────────────┐
│  Lucas Party · 6 Spieler             │
│  Wer bist du?          [🔍 Suchen]   │  ← Suche ab 7 Plätzen
│  🎸 Max        – am Host-Handy   │  ← antippbar
│  🦄 Oma Gerda  – am Host-Handy   │  ← antippbar
│  ─────────────────────────────────── │
│  📱 Lena, Tom, Sara (schon dabei)     │  ← ausgegraut
│                                      │
│  [ Ich finde mich nicht – neu anlegen ] │  ← immer sichtbar, groß
└─────────────────────────────────────┘
```
- Wählbar sind nur 🔁-Plätze. 📱-Plätze stehen ausgegraut darunter.
- **„Ich finde mich nicht – neu anlegen“** ist immer da, auch wenn es 🔁-Plätze gibt.
- **Klug abgleichen:** Tippt jemand beim Neu-Anlegen einen Namen, der einem freien 🔁-Platz ähnelt („max“, „Maxi“, „Max K.“), fragt die App: „Bist du Max? Seine 12 Punkte übernehmen?“ → Ja / Nein, ich bin jemand anderes.
- Gibt es keine 🔁-Plätze, wird der Schritt übersprungen → direkt Profil.
- Übernahme behält Punkte, Spiele, Platzierung, Symbol, Farbe.
- Läuft gerade ein Spiel → Übernahme wird **vorgemerkt** und nach der Runde vollzogen.
- Name aus dem Konto wird beim Neu-Anlegen vorgeschlagen.

### 3.4 Profil (Name, Symbol, Farbe)
- Jederzeit in der Lobby änderbar: eigener Platz durch den Spieler, 🔁-Plätze durch den Host.
- Während eines Spiels gesperrt („nach der Runde änderbar“).
- Vorschlag nimmt zuerst freie Symbole/Farben; Doppelte erlaubt.
- Name 1–24 Zeichen, getrimmt; Symbol nur aus erlaubter Liste (`PLAYER_AVATARS`, erweiterbar).
- Live-Vorschau: so sieht mich der Fernseher.

### 3.5 Weitergeben im Spiel (Handover)
```
Host-Handy:  📲 Gib das Handy an MAX  ·  [Ich bin Max – los geht's]
Fernseher:        „🎸 Max spielt am Host-Handy …“
Nach dem Zug:     📲 Weiter an GERDA   (oder: Zurück an LUCA)
```
- Inhalt bleibt verdeckt, bis bestätigt wird; Spieluhr pausiert (Ausnahme Echtzeit, Abschnitt 7).
- Folgen mehrere Gäste aufeinander, wird direkt weitergereicht, ohne Umweg über den Host.

### 3.6 Nachzügler & Abgänge
- QR bleibt im Spiel klein auf dem TV; Beitritt während eines Spiels → „Ab der nächsten Runde dabei“.
- Spieler verlässt die Party → Platz archiviert, Punkte bleiben in der Wertung (wie `past_members`).
- Host kann jeden 📱-Platz zurück an sein Handy holen (Akku leer, Spieler geht).

---

## 4. Übergänge & Timing (Choreografie)

### 4.1 Prinzip: Szenen mit gemeinsamer Uhr
Heute wechselt jedes Gerät, sobald eine Nachricht ankommt — Handys mit schlechtem WLAN hinken hinterher. Neu:

1. **Eine Szene = ein Zustand mit Startzeit.** Der Host sendet `{ scene, sceneId, startsAt }`, wobei `startsAt` = Host-Zeit + **Vorlauf 600 ms**.
2. **Gemeinsame Uhr.** Jedes Gerät kennt seinen Versatz zur Serverzeit (Abgleich beim Beitritt und alle 30 s über die RPC-Antwort `now()`, gemittelt aus 3 Messungen). Alle rechnen `startsAt` in lokale Zeit um.
3. **Alle wechseln gleichzeitig** zu `startsAt`. Kommt eine Nachricht zu spät an, springt das Gerät direkt in die laufende Szene (Animation vorgespult), statt sie neu zu beginnen.
4. **Eingabe-Schluss über Fristen, nicht über Nachrichten.** „Zeit ist um“ ist eine Uhrzeit (`deadline`), die alle Geräte selbst einhalten. Kein Spieler gewinnt durch Verzögerung Zeit.
5. **Kritische Szenen warten auf Bestätigung.** Spielstart und Rundenende warten, bis alle aktiven Geräte die Szene bestätigt haben (max. 3 s), danach geht es ohne die Langsamen weiter (die springen nach).
6. **Wer den Blick bekommt:** Hat der TV den wichtigen Inhalt, zeigen Handys „👀 Schau auf den Fernseher“. Bin ich dran, vibriert mein Handy (Haptik) und es wird hell; der TV gibt den Ton.

### 4.2 Übergangstabelle

| # | Übergang | Fernseher | Host-Handy | Spieler-Handy 📱 | Dauer / Regel |
|---|---|---|---|---|---|
| T01 | Spieler tritt bei | Avatar fliegt ein + Ton, Zähler +1 | Liste + kurze Haptik | „Du bist dabei ✓“ | TV ≤ 1 s nach Bestätigung; Animation 1,2 s |
| T02 | Platz übernommen 🔁→📱 | Symbol wechselt mit Dreh-Animation | Gast verschwindet aus „am Host-Handy“ | Profil-Bildschirm | ≤ 1 s |
| T03 | Profil geändert | Karte morpht zu neuem Namen/Symbol | Liste aktualisiert | Vorschau = Ergebnis | ≤ 1 s |
| T04 | Spieler bereit | ✓ erscheint | Startknopf-Zähler | Knopf wird „Bereit ✓“ | sofort |
| T05 | Spielstart | Spiel-Intro (Name, Bild), dann Regeln | Countdown 3-2-1 | Countdown 3-2-1, danach „Schau auf den TV“ | Countdown synchron; Regeln 8–15 s, Host kann überspringen |
| T06 | Ich bin dran | „Lena ist dran“ (1,5 s) | Wartebildschirm (wenn nicht Gast) | Haptik + aktive Ansicht | synchron mit TV |
| T07 | Gast ist dran | „🎸 Max spielt am Host-Handy“ | Weitergabe-Bildschirm (verdeckt) | „Max ist dran“ | Uhr pausiert bis „Ich bin Max“ |
| T08 | Gast fertig | Hinweis verschwindet | „Weiter an Gerda“ / „Zurück an Luca“ | — | sofort |
| T09 | Zeit läuft ab | letzte 5 s Tick-Ton + Ring | Eingabe sperrt zu `deadline` | Eingabe sperrt zu `deadline`, „Zeit!“ | alle Geräte zur selben Uhrzeit |
| T10 | Auflösung einer Runde | Antwort/Ergebnis-Animation | „Schau auf den TV“ | eigenes Ergebnis (+3 / richtig) | TV-Animation 2–4 s, Handy zeigt Eigenes gleichzeitig |
| T11 | Spielende → Zwischenstand | Platzierungen, Punkte zählen hoch | „Weiter“ erst nach Animation aktiv (min. 6 s) | eigene Platzierung + „Schau auf den TV“ | 6–8 s |
| T12 | Nächstes Spiel / Karte | Reise-Animation auf der Karte | Spieleliste, Start | „Gleich geht's weiter“ | Host bestimmt Tempo |
| T13 | Verbindung weg (📱 oder Host) | nach 2 s: „Warte auf Tom …“ | nach 30 s: „Ohne Tom weiter“ / „Tom ans Host-Handy“ | eigener Bildschirm: „Verbinde neu …“ | Spiel pausiert (`isConnected=false`) |
| T14 | Spiel abgebrochen | „Runde abgebrochen – zählt nicht“ | zurück in Lobby | zurück in Lobby | 2 s Hinweis, dann Wartebereich |
| T15 | Nachzügler im Spiel | Mini-Ton, kleiner Hinweis unten | Liste | „Ab der nächsten Runde dabei“ | stört das laufende Spiel nicht |
| T16 | Siegerehrung | Trommelwirbel, Podest, Konfetti | Konfetti + „Party beenden / Weiterspielen“ | Konfetti + eigene Platzierung, Haptik beim Sieger | Konfetti synchron |
| T17 | TV gekoppelt | Wartebereich blendet ein, Sprache des Handys | „Verbunden ✓“ + TV-Fernbedienung | — | ≤ 10 s ab Scan |
| T19 | Host entfernt Spieler | „Tom hat die Party verlassen“, Avatar blendet aus | Bestätigung + 5 s „Rückgängig“ | Betroffener: „Nicht mehr in dieser Party“; andere: Liste aktualisiert | ≤ 1 s, Spiel läuft weiter |
| T18 | Host ruft TV-Ansicht | Kreuzblende (bestehend 0,32 s) | Knopf aktiv | — | sofort |

### 4.3 Ohne Fernseher
Fehlt der TV, zeigt das **Host-Handy** in Wartephasen die TV-Ansagen (Wer ist dran, Zwischenstand), und die Spieler-Handys zeigen statt „Schau auf den TV“ den Inhalt selbst an.

### 4.4 Timing testen
- Harness misst pro Szene den Zeitpunkt, zu dem jedes Gerät sie sichtbar hat → **Versatz ≤ 250 ms** (Ziel), ≤ 500 ms bei 800 ms Netzlatenz.
- Eingaben nach `deadline` werden vom Host verworfen (Test mit absichtlich verzögerten Clients).
- TV-Aufnahme (Bildschirmvideo) für Sichtprüfung jeder Übergangsanimation.

---

## 5. Bildschirme

### 5.1 Host-Handy — Lobby
- Spielerliste mit 📱/🔁, Bereit-Status, Verbindungszustand.
- „+ Spieler ohne Handy“; Profil antippen → bearbeiten; Wischen → entfernen / zurückholen.
- Spieleliste mit Hinweis je Spiel: „passt“ / „Max & Gerda setzen aus“ / „zu viele Spieler“.
- Startknopf, deaktiviert mit Begründung („Sara ist noch nicht bereit“).
- Kachel „Fernseher“: verbunden / koppeln / Ansicht umschalten.

### 5.2 Spieler-Handy
- „Wer bist du?“, Profil, Lobby (wer ist dabei, was kommt), Bereit-Knopf, Party verlassen.
- Fremder Zug: Wartebildschirm mit „Max ist dran“ + kleine Reaktionsleiste (siehe 11).

### 5.3 Fernseher — Wartebereich (ersetzt `TVLobby`-Inhalt)
```
┌──────────────────────────────────────────────────────────────┐
│ ● Verbunden                          Party-Abend · 3 Spiele    │
│   ┌──────────┐     Scannen & mitspielen                        │
│   │   QR     │     1. Handykamera auf den Code                 │
│   │  (groß)  │     2. App öffnet sich – du bist drin            │
│   └──────────┘     oder in der App: Code  K7QM4X                │
│   DABEI (5)                                                     │
│   🦊 Lena ✓   🐼 Tom ✓   🦄 Sara …   🐯 Max 🔁   👑 Luca (spielt mit) │
│   ALS NÄCHSTES: 🍺 GEBRÄU · 2–8 Spieler · noch 1 bereit fehlt    │
└──────────────────────────────────────────────────────────────┘
```
- QR ≥ 30 % Bildschirmhöhe, weißer Rand, Link `/party/join/CODE` (Online-Raum: `/games?room=CODE`).
- Falscher Link `/tv/CODE` entfällt.
- Automatisch sichtbar in der Lobby vor dem ersten Spiel; danach über „Startbild“.
- Hinweis bei 🔁-Plätzen: „Max, Gerda: Habt ihr ein Handy? Scannt euch rein.“

### 5.4 Fernseher — Kopplung
- `/tv`: Kopplungs-QR (`/tv/pair/<8 Zeichen>`, 10 min gültig, rotiert) + Ausweich-Eingabefeld.
- Kanal `tv-pair:<code>`; erste gültige Kopplung gewinnt; Code im `localStorage` für Neuladen.
- App-Route `/tv/pair/:code` + Web-Fallback; AASA und `assetlinks.json` um `/tv/pair/*` erweitern (Apple-Cache beachten).

---

## 6. Vollständige Liste aller Handlungen

Jede Handlung braucht: Auslöser, sichtbare Rückmeldung auf allen betroffenen Geräten (Abschnitt 4.2), Fehlerfall, Testfall (Abschnitt 8).

### 6.1 Host
| Handlung | Wann erlaubt | Testfall |
|---|---|---|
| Party erstellen (mitspielen ja/nein) | immer | A12 |
| Spieler ohne Handy hinzufügen / bearbeiten / entfernen | Lobby | C06, D05 |
| 📱-Platz zurück ans Host-Handy holen | Lobby; im Spiel vorgemerkt | B08 |
| Spieler entfernen — **jederzeit, auch während eines Spiels**, aus der Party-Lobby und aus der TV-Fernbedienung (Abschnitt 6.6) | immer | D05, F13–F17 |
| Entfernten Spieler sperren / Sperre aufheben | immer | F16 |
| Spieleliste planen / umsortieren / Spiel entfernen | Lobby | E02 |
| TV koppeln / trennen / Ansicht umschalten | immer | G01, G05 |
| Spiel starten | alle bereit, Spielerzahl passt | E01–E04 |
| Regeln überspringen | Spiel-Intro | T05 |
| Weitergabe bestätigen „Ich bin Max“ | Gast dran | F01 |
| Spiel pausieren / fortsetzen | im Spiel | F10 |
| Ohne fehlenden Spieler weiter / an Host geben | Verbindung weg > 30 s | F05 |
| Spiel abbrechen | im Spiel | F07 |
| Weiter zum nächsten Spiel | nach Zwischenstand | T12 |
| Siegerehrung zeigen / Party beenden / nach Ende weiterspielen | jederzeit nach 1. Spiel | D04 |
| Party nach App-Neustart fortsetzen | ≤ 24 h | D03 |
| Code teilen (Link, Nachricht) | immer | A06 |

### 6.2 Spieler mit eigenem Handy 📱
| Handlung | Wann erlaubt | Testfall |
|---|---|---|
| QR scannen / Link öffnen / Code eingeben | Party offen | A01–A06 |
| Platz wählen / „Ich finde mich nicht – neu anlegen“ | Beitritt | B01, B11 |
| „Bist du Max?“ bestätigen oder ablehnen | Neu-Anlegen mit ähnlichem Namen | B12 |
| Profil ändern | Lobby | C01 |
| Bereit melden / zurücknehmen | Lobby | E01 |
| Spielen (Zug, Antwort, Abstimmung) | im Spiel | F09 |
| „Das bin ich nicht“ (Platz zurückgeben) | Lobby | B03 |
| Reagieren (Emoji auf TV) | Wartephasen | X01 |
| Party verlassen | immer, mit Rückfrage | D05 |
| Auf anderes Handy wechseln | immer | B06 |
| Andere Party beitreten | Rückfrage „wechseln?“ | A05 |

### 6.3 Gast am Host-Handy 🔁
| Handlung | Wie | Testfall |
|---|---|---|
| Spielen | über Weitergabe am Host-Handy | F01–F04 |
| Platz später mit eigenem Handy übernehmen | QR scannen → „Wer bist du?“ | B01, B04 |
| Aussetzen bei Echtzeit-Spielen | automatisch | F04 |

### 6.4 Fernseher
| Handlung | Wie | Testfall |
|---|---|---|
| Koppeln | QR-Kopplung oder Code-Eingabe | G01, G02 |
| Neu laden / Stromausfall | verbindet sich selbst wieder | G03 |
| Vollbild | Knopf (bestehend) | G08 |
| Zweiter Fernseher | gleicher Code | G04 |

### 6.5 System (automatisch)
| Ereignis | Reaktion | Testfall |
|---|---|---|
| Party läuft ab (24 h) | Abschluss-Hinweis, Ergebnisse lesbar | A08 |
| Verbindung weg / zurück | Pause / Fortsetzen | F05, F06 |
| Ergebnis offline | Outbox sendet nach, keine Doppelwertung | F08 |
| Kopplungscode abgelaufen | TV erneuert | G02 |
| App-Version zu alt | Update-Hinweis | I02 |
| Vorgemerkte Übernahme | nach Rundenende vollziehen | B04 |
| Spieler hängt > 30 s ohne Fortschritt | `stuck_detected` + Host-Ausweg | F11 |

### 6.6 Spieler entfernen (Host, jederzeit)

**Wo:** Spielerliste in der Party-Lobby, „Spieler“-Knopf in der TV-Fernbedienung (`TVRemote`, kompakte Pille während des Spiels) und im Pausenmenü des Spiels. Überall derselbe Ablauf:
```
Spieler antippen → „Tom entfernen?“
  ○ Nur aus diesem Spiel nehmen (bleibt in der Party)      ← nur während eines Spiels
  ● Aus der Party entfernen (Punkte bleiben in der Wertung)
  ○ Entfernen und sperren (kann nicht wieder beitreten)
[Abbrechen]  [Entfernen]
```

**Was im laufenden Spiel passiert:**
| Lage | Verhalten |
|---|---|
| Spieler ist gerade nicht dran | Wird aus `participantIds` genommen, Spiel läuft ohne Pause weiter |
| Spieler ist gerade dran | Zug wird übersprungen, nächster Spieler (T06/T07) |
| Spieler hat eine Schlüsselrolle (z. B. Hochstapler, Erklärer) | Spiel entscheidet nach `sharedDevice`-Regel: Rolle neu vergeben oder Runde neu starten; Hinweis auf TV |
| Danach zu wenige Spieler für das Spiel | Rückfrage beim Host: „Spiel abbrechen (zählt nicht)“ oder „Zurück in die Lobby“ |
| 🔁-Gast wird entfernt | Weitergaben an ihn entfallen sofort |
| Host entfernt sich selbst | nicht möglich → stattdessen „Party beenden“ / Host-Übergabe (10.2) |

**Wertung:** Punkte aus bereits beendeten Spielen bleiben (archiviert wie `past_members`). Das laufende Spiel zählt für den Entfernten nicht; für alle anderen zählt es normal.

**Was die Geräte zeigen (taktvoll):**
- Fernseher: „Tom hat die Party verlassen“ — nie „wurde entfernt“.
- Toms Handy: „Du bist nicht mehr in dieser Party“ + „Eigene Party starten“; bei Sperre kein erneuter Beitritt mit diesem Code.
- Host: kurze Bestätigung + „Rückgängig“ für 5 s (nur wenn noch kein Ergebnis betroffen ist).

---

## 7. Spiele: geteiltes Handy

Neues Pflichtfeld in `playable-games.ts`: `sharedDevice`.

| Wert | Bedeutung | Verhalten bei 🔁-Gästen |
|---|---|---|
| `turns` | immer nur einer dran | Weitergabe vor dem Zug |
| `sequential` | alle antworten gleichzeitig | Gäste antworten nacheinander, Zeit pro Person |
| `secret` | geheime Rollen/Infos | wie `sequential` + verdeckt aufdecken/zudecken |
| `team` | Echtzeit, Team möglich | Gäste im Team des Hosts |
| `sitout` | Echtzeit, kein Team | Gäste setzen aus (zählt nicht als gespielt, keine Minuspunkte) |

**Standard für nicht angepasste Spiele: `sitout`** → Mischbetrieb kann früh live gehen.

Vorläufige Einordnung (in Phase 3 je Spiel prüfen):

| Vermutlich `turns` | Vermutlich `sequential` / `secret` | Vermutlich `team` / `sitout` |
|---|---|---|
| flaschendrehen, wahrheit-pflicht, headup, pantomime, wer-bin-ich, taboo, story-builder | this-or-that, fake-or-fact, split-quiz, geteilt-gequizzt, category, emoji-raten, closeenough, wo-ist-was, pixeljagd, hochstapler (`secret`) | bomb, brew, drueck-das-wort, schnellzeichner, ohrwurm |

Ein Vitest-Test erzwingt, dass jedes Spiel `sharedDevice` deklariert.

---

## 8. Szenario-Katalog

Ebene: U = Unit, D = Datenbank-Test, B = Multi-Browser-Harness, G = echtes Gerät, P = Playtest.

### A — Beitreten
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| A01 | QR scannen, App installiert, eingeloggt | „Wer bist du?“ ≤ 3 s nach App-Start | B, G |
| A02 | App nicht installiert | Web-Seite mit Code + Store-Links, Code nach Installation nutzbar | G |
| A03 | Nicht eingeloggt | Login → automatisch weiter, kein erneutes Scannen | B, G |
| A04 | App kalt gestartet vs. im Hintergrund | beide landen im Beitritt | G |
| A05 | Bereits in anderer Party | Rückfrage „Party wechseln?“, alte sauber verlassen | B |
| A06 | Code manuell / per geteiltem Link | wie A01 | B |
| A07 | Party voll (12) | klare Meldung, kein halber Beitritt | D, B |
| A08 | Party beendet / abgelaufen | „Diese Party ist vorbei“ + „Eigene Party starten“ | D, B |
| A09 | Alte App-Version | Update-Hinweis mit Store-Link | B |
| A10 | Beitritt während Spiel | „Ab der nächsten Runde dabei“ | B |
| A11 | Frisch installiert, Universal/App Link | funktioniert oder Web-Fallback | G |
| A12 | Party erstellen mit/ohne Mitspielen | Rolle korrekt in Lobby + TV | B |

### B — Platz übernehmen / neu anlegen
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| B01 | Freien 🔁-Platz wählen | Punkte/Profil bleiben, TV 🔁 → 📱 | D, B |
| B02 | Zwei Geräte wählen gleichzeitig denselben Platz | genau einer gewinnt, anderer sieht `seat_taken` + neue Liste | D, B |
| B03 | Falscher Platz gewählt | „Das bin ich nicht“ gibt zurück, nichts verloren | D, B |
| B04 | Übernahme während Spiel | vorgemerkt, nach der Runde vollzogen | D, B |
| B05 | Nutzer hat schon einen Platz | abgelehnt mit Hinweis | D |
| B06 | Gleiches Konto auf zweitem Gerät | „Auf dieses Handy wechseln?“, altes Gerät wird Zuschauer | B |
| B07 | Neu installiert / neu gestartet | automatisch wieder eigener Platz | B, G |
| B08 | Host holt Platz zurück | Spieler-Handy: „Du spielst jetzt am Host-Handy“ | D, B |
| B09 | Keine 🔁-Plätze | „Wer bist du?“ übersprungen | B |
| B10 | Nur noch ein 🔁-Platz | trotzdem Auswahl, keine automatische Zuordnung | B |
| B11 | „Ich finde mich nicht – neu anlegen“ trotz freier 🔁-Plätze | neuer Platz, 🔁-Plätze bleiben unberührt | D, B |
| B12 | Neuer Name ähnelt freiem 🔁-Platz | „Bist du Max?“ — Ja übernimmt, Nein legt neu an | U, B |
| B13 | Neu anlegen bei voller Party | Hinweis „Party voll – übernimm einen Platz oder frag den Host“ | D, B |

### C — Profil
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| C01 | Name/Symbol/Farbe ändern | TV + alle Handys ≤ 1 s | B |
| C02 | Änderung während Spiel | gesperrt mit Hinweis | D, B |
| C03 | Leer, Leerzeichen, > 24 Zeichen, Emoji, RTL | Validierung, korrekte TV-Darstellung | U, D, B |
| C04 | Doppelter Name | Vorschlag „Max 2“, erlaubt | U |
| C05 | Unerlaubtes Symbol per manipulierter Anfrage | Server lehnt ab | D |
| C06 | Host ändert Gast-Profil; fremdes 📱-Profil | erlaubt; abgelehnt | D |

### D — Host
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| D01 | Host spielt mit / spielt nicht mit | Kennzeichnung TV + Lobby; Gäste auch bei „spielt nicht mit“ | B |
| D02 | App im Hintergrund / gesperrt | Spieler: „Warte auf Host“, Zustand bleibt | B, G |
| D03 | Host-Handy stirbt | Party auf Server, Fortsetzen-Banner | B, G |
| D04 | Party beenden | Siegerehrung TV, alle Handys → Abschluss | B |
| D05 | Spieler entfernen / verlässt selbst | Punkte archiviert, Hinweis auf dessen Gerät | D, B |
| D06 | Host verlässt dauerhaft | **offen** (Host-Übergabe, 10.2) | — |

### E — Lobby & Start
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| E01 | Nicht alle bereit | Start aus, Namen der Fehlenden | B |
| E02 | Spielerzahl passt nicht | Hinweis + nächstes passendes Spiel | U, B |
| E03 | `sitout`-Spiel mit Gästen | Vorab-Hinweis „Max & Gerda setzen aus“ | U, B |
| E04 | Zu wenige Aktive nach `sitout` | Start blockiert mit Grund | U, D |
| E05 | Premium-Spiel ohne Premium | gesperrt, Hinweis | D |

### F — Im Spiel
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| F01 | `turns`: Gast dran | Weitergabe verdeckt, Uhr pausiert, TV-Hinweis | B |
| F02 | `sequential`: 3 Gäste | alle Antworten zählen, keine fremde sichtbar | B |
| F03 | `secret`: aufdecken/zudecken | nie ohne Bestätigung sichtbar | B, P |
| F04 | `sitout` / `team` | korrekt ausgenommen/zugeordnet, Wertung stimmt | U, B |
| F05 | 📱-Spieler offline | Pause; nach 30 s Host-Optionen | B |
| F06 | Host-Handy offline | alle Gäste pausiert, kein Ergebnisverlust | B |
| F07 | Abbruch | zählt nicht, Lobby, TV Wartebereich | B |
| F08 | Ergebnis offline gemeldet | Outbox, keine Doppelwertung | U, D |
| F09 | 22 Spiele × Gast-Anteil 0/30/100 % × Host mit/ohne | kein Hänger, Ergebnis gespeichert | B (Matrix) |
| F10 | Pause / Fortsetzen | alle Uhren stehen, Fristen verschieben sich | U, B |
| F11 | Gerät hängt | `stuck_detected`, Host-Ausweg | B |
| F12 | Eingabe nach Frist (verzögertes Gerät) | verworfen, Hinweis „zu spät“ | U, B |
| F13 | Host entfernt Spieler im Spiel (nicht dran) | Spiel läuft weiter, TV „Tom hat die Party verlassen“ | B |
| F14 | Host entfernt Spieler, der gerade dran ist | Zug übersprungen, kein Hänger | B |
| F15 | Entfernen → zu wenige Spieler | Rückfrage Abbrechen / Lobby, Wertung unverfälscht | U, B |
| F16 | Entfernen + Sperren, Spieler scannt erneut | Beitritt abgelehnt; Sperre aufheben erlaubt wieder | D, B |
| F17 | Entfernen über TV-Fernbedienung vs. Lobby | identisches Ergebnis, alle Geräte ≤ 1 s aktualisiert | B |
| F18 | „Nur aus diesem Spiel nehmen“ | bleibt in Party, ist nächstes Spiel wieder dabei | B |
| F19 | Entfernter Spieler mit Schlüsselrolle | Rolle neu vergeben oder Runde neu, nie hängen | B (je Spiel) |

### G — Fernseher
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| G01 | Kopplung per QR | ≤ 10 s, Sprache des Handys | B, G |
| G02 | Kopplungscode abgelaufen | TV erneuert; alter Link → „neu scannen“ | U, B |
| G03 | TV lädt neu | verbindet sich selbst | B, G |
| G04 | Zwei Fernseher | identische Anzeige, synchron | B |
| G05 | Startbild gerufen | aktueller Stand | B |
| G06 | Geheime Infos | nie auf TV (Assertion je Spiel) | B |
| G07 | QR aus 3 m scanbar | Tizen, webOS, Fire TV | G |
| G08 | Vollbild / Bildschirmschoner | bleibt wach während Party | G |

### T — Timing
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| T-1 | Szenenwechsel 6 Geräte + TV | Versatz ≤ 250 ms | B |
| T-2 | Ein Gerät mit 800 ms Latenz | springt in laufende Szene, ≤ 500 ms Versatz | B (Chaos) |
| T-3 | Uhr eines Geräts 5 min falsch | Serverzeit-Abgleich gleicht aus | U, B |
| T-4 | Countdown T05 | alle zeigen dieselbe Zahl | B, G |
| T-5 | Konfetti T16 | gleichzeitig auf TV + Handys | G (Video) |

### H — Plattform & Netz
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| H01 | iOS Hintergrund ↔ Vordergrund | Wiederverbindung ohne Doppel-Navigation | G |
| H02 | Android-Zurücktaste überall | nie ohne Rückfrage raus | G |
| H03 | 800 ms Latenz, 5 % Verlust | spielbar, keine Geisterzustände | B (Chaos) |
| H04 | Deep Link während Spiel | Rückfrage statt stilles Verlassen | B |
| H05 | 10 Sprachen inkl. RTL | alle Texte übersetzt, Layout korrekt | U, B |

### I — Kompatibilität & Sicherheit
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| I01 | Lokale Party nach Update | läuft weiter; Umzug beim ersten Scan | U, B |
| I02 | Alte App in Misch-Party | `min_client` → Update-Hinweis | D, B |
| I03 | Fremder mit abfotografiertem QR | kann beitreten → Host entfernt; Ablauf nach 24 h | D |
| I04 | Manipulierte RPC-Aufrufe | abgelehnt | D |
| I05 | Massen-Beitritt / -Claim | Rate-Limit | D |

### X — Extras
| ID | Szenario | Erwartung | Ebene |
|---|---|---|---|
| X01 | Reaktionen in Wartephasen | Emoji fliegt über den TV, max. 1/s pro Spieler | B |

---

## 9. Datenmodell & Server

### 9.1 Migration (aufbauend auf `20260922235000_controller_parties.sql`)

`controller_party_members`:
| Spalte | Änderung |
|---|---|
| `user_id` | `NULL`-fähig (NULL = 🔁-Gast) |
| `controlled_by` | neu, `text` (`player_id` des Hosts) bei Gästen |
| `avatar` | neu, CHECK auf erlaubte Liste |
| `color` | neu, CHECK `^#[0-9a-f]{6}$` |
| `pending_claim_user` | neu, `uuid` — vorgemerkte Übernahme |
| `banned` | neu, `boolean` — gesperrt, Beitritt mit diesem Konto abgelehnt |
| CHECK | genau eins von `user_id` / `controlled_by` |

`controller_parties`: neu `min_client integer`, `paused_at timestamptz`.

### 9.2 Neue RPC-Aktionen in `controller_party_request`

| Aktion | Wer | Regeln |
|---|---|---|
| `add_guest` | Host | max. 12, Validierung |
| `remove_guest` | Host | ohne Ergebnisse löschen, sonst archivieren |
| `claim` | eingeloggt | nur 🔁; atomar (`FOR UPDATE`); zweiter → `seat_taken`; nur ein aktiver Platz pro Konto; im Spiel → `pending_claim_user` |
| `release` | Inhaber / Host | Platz zurück an Host |
| `kick` | Host | jederzeit; Optionen `match_only` / `party` / `ban`; im Spiel → aus `participant_ids`, Ergebnis des laufenden Spiels ohne ihn; nie den Host selbst |
| `unban` | Host | Sperre aufheben |
| `profile` | Inhaber / Host (Gäste) | nur Lobby, Validierung |
| `finish` (bestehend) | Host | vollzieht vorgemerkte Übernahmen |
| alle | — | Antwort enthält `server_now` für den Uhrabgleich |

Jede Aktion erhöht `revision`.

### 9.3 Raum (Realtime)
- Host-Gerät meldet Gäste als zusätzliche `RoomPlayer` mit `controlledBy`.
- `OnlineGameProps` + `localPlayerIds: string[]`, + `clock` (Serverzeit-Versatz), + `scene`-Helfer.
- `participantIds` enthält Gäste; Ergebnisse über `player_id` wie heute.

---

## 10. Sonderfälle mit Entscheidungsbedarf

### 10.1 Lokale Party → Server-Party
Ein-Handy-Abend bleibt lokal und ohne Login, **bis** jemand per Handy beitreten will. Dann einmalig Host-Login → Spieler + bisherige Ergebnisse werden als 🔁-Gäste übertragen.

### 10.2 Host-Übergabe
A: keine Übergabe (Start). B: später an einen 📱-Spieler übergeben, der alle 🔁-Gäste übernimmt.

### 10.3 Echtzeit-Spiele
`team` oder `sitout` je Spiel, Standard `sitout`.

---

## 11. Ideen, die EventBliss abheben (optional, nach Phase 3)
- **Reaktionen:** Wartende Spieler schicken Emojis, die über den TV fliegen.
- **„Bist du Max?“-Abgleich** beim Neu-Anlegen (fest eingeplant, B12).
- **Persönliche Momente:** Nach jedem Spiel auf dem eigenen Handy „Dein bester Moment“ (z. B. schnellste Antwort).
- **Ansagen-Stimme** auf dem TV für Zugwechsel (optional, stummschaltbar).
- **Abend-Rückblick:** Nach der Party eine teilbare Karte mit Podest und Highlights.

---

## 12. Teststrategie

### 12.1 Ebenen
1. **Unit (Vitest):** Play-Kontext, Claim-Zustände, Namensähnlichkeit (B12), Handover-Automat, Profil-Validierung, `sharedDevice`-Pflicht, Kopplungscode, Uhrabgleich, Fristen, Übersetzungsschlüssel in 10 Locales.
2. **Datenbank (`npm run test:db`):** jede RPC-Aktion inkl. Rechte, Wettläufe (B02), Validierung, `min_client`, `server_now`.
3. **Multi-Browser-Harness** (`controllers-browser.mjs` erweitern): TV-Client als eigene Seite mit Bildschirmfotos, Gäste am Host-Gerät, Claim/Release/Profil, Szenarien als benannte Läufe (`--scenario B02`), Zeitstempel pro Szene je Gerät (Timing T-1…T-3), Lauf gegen PGlite (CI) und `--real`.
4. **Spiel-Matrix** (`game-roster-matrix.mjs` erweitern): 22 Spiele × Spielerzahl (min/typisch/max) × Gast-Anteil (0/30/100 %) × Host mit/ohne. Abbruch: Hänger > 10 s, fehlendes Ergebnis, Konsolenfehler.
5. **Chaos:** zufällige Verzögerung, Paketverlust, Neuladen, Hintergrund; 50 Läufe pro Nacht, Ziel 0 hängende Zustände.
6. **Echte Geräte:** älteres + aktuelles iPhone, günstiges + aktuelles Android, 3 TV-Browser; G/T-Fälle mit Protokoll in `docs/qa/`.
7. **Playtests:** 12.3.

### 12.2 Freigabe je Phase
- Alle U/D/B-Fälle der Phase grün, Matrix ohne Hänger, keine neuen TypeScript-Fehler über der Grundlast (`tsc -p tsconfig.app.json`).
- G/T-Fälle auf ≥ 1 iPhone, 1 Android, 1 TV protokolliert.
- Kill-Switch `party_unified_off` getestet.

### 12.3 Spaß-Kriterien (Playtests)
Drei Gruppen: Familie gemischtes Alter, JGA 8–10 Personen, technikaffine Freunde. Aufzeichnen und auswerten:

| Messgröße | Ziel |
|---|---|
| Erster Scan → erstes Spiel (ganze Gruppe) | ≤ 2 min |
| „Was muss ich jetzt tun?“-Fragen | ≤ 1 pro Abend |
| Weitergabe am Host-Handy | ≤ 5 s pro Wechsel |
| Spürbarer Versatz zwischen Geräten | niemand bemerkt ihn |
| Abbrüche wegen Technik | 0 |
| „Nächstes Mal wieder?“ | ≥ 8/10 |

### 12.4 Messung im Betrieb
Ereignisse ohne Inhalte/Namen: `party_created`, `party_join_scan`, `seat_claimed`, `seat_claim_conflict`, `seat_new_despite_free`, `handover_duration`, `scene_skew_ms`, `game_sitout`, `game_aborted`, `tv_paired`, `stuck_detected`.

---

## 13. Phasen

| Phase | Inhalt | Aufwand |
|---|---|---|
| 0 | Offene Fixes committen; Harness: TV-Client + Szenen-Zeitstempel | 0,5 T |
| 1 | TV-Wartebereich (großer QR, Spieler, 📱/🔁 vorbereitet, Ereignisse T01–T04), falscher Link weg | 2 T |
| 2 | Server: Gäste, Claim, Release, Profil, Avatar/Farbe, `min_client`, `server_now`; „Wer bist du?“ inkl. „neu anlegen“ + „Bist du Max?“; Profil; Gäste standardmäßig `sitout` | 5 T |
| 3 | Szenen-Uhr & Fristen (Abschnitt 4), `sharedDevice`, `<HandoverScreen>`, `localPlayerIds`; Spiele in Wellen anpassen | 3 T + 0,5–1 T je Spiel |
| 4 | TV-Kopplung per QR (`/tv/pair`) | 2–3 T |
| 5 | Einstieg „Gemeinsam spielen“, ein „Mit Code beitreten“, `usePlayContext` | 3 T |
| 6 | Lokal → Server-Umzug, Host-Übergabe, Ideen aus 11 | offen |

Jede Phase: eigener Branch, eigene Testversion, ab Phase 2 Playtest vor Freigabe.

---

## 14. Offene Entscheidungen

1. Echtzeit-Spiele: `team` oder `sitout` als Regel?
2. Host-Übergabe erst später (10.2)?
3. Lokale Party → Server erst beim ersten Scan (10.1)?
4. Name „Joystick-Modus“ behalten oder „jeder am eigenen Handy“?
5. Gäste ohne Login, Host und 📱-Spieler mit Login — bestätigt?
6. Freier Beitritt mit Code, oder optional „Host bestätigt neue Spieler“?
7. Welche Ideen aus Abschnitt 11 sollen fest in den Plan?
