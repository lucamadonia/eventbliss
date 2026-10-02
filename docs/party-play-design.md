# Party-Play — Design-Spezifikation

Stand: 2026-10-01 · Gehört zu `docs/party-play-masterplan.md` · Code-Quelle: `src/lib/party-motion.ts`

> Ein Abend, drei Bildschirme, ein Look. Der Fernseher ist die Bühne, das Handy die Fernbedienung in deiner Hand. Alles wechselt im selben Moment, und jede Bewegung hat einen Grund.

---

## 1. Prinzipien

1. **Der TV erzählt, das Handy handelt.** Große Gesten, Ton und Konfetti gehören dem Fernseher. Das Handy zeigt nur, was *ich* jetzt tun muss, mit Haptik statt Ton.
2. **Bewegung erklärt einen Zustand.** Jede Animation beantwortet eine Frage: Wer ist neu? Wer ist dran? Was hat sich geändert? Dekoration ohne Aussage gibt es nur in seltenen Momenten (Beitritt, Siegerehrung).
3. **Eintritt ease-out, Austritt schneller.** Nichts erscheint aus `scale(0)`, Startwert ist mindestens 0.6 bei Avataren und 0.92 bei UI. Handy-UI bleibt ≤ 300 ms, Sheets ≤ 420 ms.
4. **Synchron statt schnell.** Szenen starten zu `startsAt` (Vorlauf 600 ms). Wer zu spät ankommt, springt per `animationProgress()` (mit `elapsedMs` aus `sceneProgress()` in scene-schedule.ts) in die laufende Animation, statt neu zu beginnen.
5. **Taktvoll.** Gehen ist leise: kein Ton und kein Rot beim Verlassen („Tom hat die Party verlassen“, nie „wurde entfernt“).
6. **Ein Look.** Gleiche Fläche (#060810 / #0d0915 / #16101f), gleiche Akzente (#df8eff Primär, #8ff5ff Bestätigt/Info, #ff6b98 Achtung), gleiche Radien (28 px Panels, 20 px Karten, voll gerundete Pills) auf TV und Handy.

## 2. Tokens (`@/lib/party-motion`)

| Token | Wert | Verwendung |
|---|---|---|
| `partyMs.press` | 140 ms | Druck-Feedback (`pressable`: scale 0.97) |
| `partyMs.micro` | 200 ms | Haken, Zähler, Austritte |
| `partyMs.ui` | 260 ms | Listen, Statuswechsel am Handy |
| `partyMs.sheet` | 320 ms | Sheets, TV-Kreuzblende (T18) |
| `partyMs.card` | 480 ms | TV-Karte, Profil-Morph |
| `partyMs.flip` | 700 ms | 🔁→📱 Dreh-Animation |
| `partyMs.arrival` | 1200 ms | Avatar fliegt am TV ein |
| `partyMs.banner` | 1500 ms | „Lena ist dran“ |
| `partyEase.out` | `[0.23,1,0.32,1]` | alle Eintritte |
| `partyEase.inOut` | `[0.77,0,0.175,1]` | Bewegung auf dem Bildschirm (Flip) |
| `partyEase.drawer` | `[0.32,0.72,0,1]` | Sheet-Austritt |
| `partySpring.settle/pop/sheet` | bounce 0.12 / 0.28 / 0.08 | Karten / Haken / Sheets |
| `SCENE_LEAD_MS` / `SCENE_SKEW_BUDGET_MS` | 600 / 250 | Szenen-Uhr |
| `STAGGER_MS` | 50 | Listen-Staffelung |
| `UNDO_WINDOW_MS` | 5000 | Rückgängig nach Entfernen |
| `confettiBurst` | Wirbel 2,4 s → Ausbruch 2,6 s; TV 160 / Handy 70 Partikel | T16 |

**Varianten:** `cardEnter`, `avatarArrive`, `seatFlip`, `profileMorph`, `leaveFade`, `countdownTick`, `handoverReveal`, `sheetEnter`, `scrimFade`, `checkPop`, `reactionFloat`, `listStagger`. Immer über `partyMotion(name, useReducedMotion())` beziehen.

**Übergangskarte:** `PARTY_TRANSITIONS[T01…T19][tv|host|phone]` → `{ token, durationMs, haptic, sound, semantic?, delayMs? }`. Ton gibt es nur am TV (Mapping auf `useTVAudio()`: `chime` → `playChime` …), Haptik nur am Handy (`firePartyHaptic(useHaptics(), cue.haptic)`). Ein Test sichert die Budgets aus Masterplan 4.2.

## 3. Bildschirme

### 3.1 TV — Wartebereich
- **Raster:** links QR-Kachel, rechts Anleitung + Code, unten volle Breite „DABEI“ und „ALS NÄCHSTES“. 5 % Sicherheitsrand (Overscan).
- **QR:** ≥ 30 % Bildhöhe (Ziel 38vh), weiße Kachel mit Ruhezone ≥ 4 Module, ohne Animation auf dem Code. Dahinter atmet ein Halo (nur Deckkraft, 4 s, aus bei Bewegungsarmut).
- **Code:** `tvType.title`, tabellarische Ziffern, Laufweite .2em, Gruppen à 3 (`K7Q M4X`).
- **Spieler-Chips:** Avatar in Farbscheibe, Name weiß in `tvType.body`, Ring = `playerGlow(color)`. Bereit = ✓ in #8ff5ff (`checkPop`), nicht bereit = langsam pulsierender Punkt. 🔁 = gestrichelter Ring + „am Host-Handy“.
- **Leerzustand:** drei Geisterplätze „Dein Platz“ mit gestrichelter Kontur, damit der Bildschirm einlädt statt kaputt zu wirken.
- **Mehrere Beitritte:** Animationen gestaffelt (`STAGGER_MS`), höchstens ein Chime pro 400 ms.

### 3.2 Handy — „Wer bist du?“
- Kopf: Partyname + Spielerzahl. Wählbare 🔁-Plätze als große Zeilen (≥ 64 px) mit `cardEnter` + `listStagger`.
- 📱-Plätze als eine zusammengefasste graue Zeile („Lena, Tom, Sara sind schon dabei“), ohne Tippziel.
- „Ich finde mich nicht – neu anlegen“ immer sichtbar, unten fixiert (Safe Area).
- Auswahl: `pressable` → Ring wird `playerGlow(…, 'active')` → Haptik `select` → Bestätigung.
- „Bist du Max?“ als Bottom-Sheet mit Max' Avatar und Punkten. Ja ist primär, „Nein, ich bin jemand anderes“ gleichwertig darunter.
- Suche ab 7 Plätzen; das Feld steht oben und bekommt nicht automatisch den Fokus (sonst verdeckt die Tastatur die Liste).

### 3.3 Handy — Profil
- Oben eine Live-Vorschau „So sieht dich der Fernseher“: exakt der TV-Chip auf #060810, `profileMorph` bei jeder Änderung.
- Name: Eingabe ≥ 16 px, Zähler `12/24` erst ab 18 Zeichen.
- Symbole: Raster mit Zellen ≥ 48 px. Farben: Kreise mit 40 px Fläche und 44 px Trefferfläche, Auswahl mit weißem Ring + Haken. Von anderen belegte Farben bekommen einen kleinen Punkt (bleiben aber wählbar).
- Im Spiel gesperrt: Felder ausgegraut + Hinweis „Nach der Runde änderbar“ statt verschwinden.

### 3.4 Host-Lobby
- Spielerzeilen: Avatar, Name, Platz-Symbol (📱/🔁 als Icon-Chip), Bereit-Haken, Verbindungspunkt (grün, gelb pulsierend bei Wiederverbindung).
- Wischen nach links zeigt Entfernen/Zurückholen (Schwelle oder Geschwindigkeit > 0.11 px/ms), Langdruck öffnet dasselbe Sheet.
- Startknopf: deaktiviert mit Grund direkt darunter. Der Zähler „4/5 bereit“ springt kurz (scale 1→1.12→1, 200 ms).
- TV-Kachel: drei Zustände (verbunden / koppeln / Ansicht umschalten). Verbunden zeigt einen ruhigen #8ff5ff-Punkt.

### 3.5 Entfernen-Sheet (6.6)
- `sheetEnter` + `scrimFade`, Optionen als Radiokarten. Vorauswahl ist „Aus der Party entfernen“, „Nur aus diesem Spiel“ gibt es nur im Spiel.
- Knopf: normal neutral (weiß/10, Text rot). Nur bei „Entfernen und sperren“ füllt sich der Knopf in #ff6b98.
- Danach Toast mit Rückgängig-Leiste: `clip-path: inset(0 X% 0 0)` linear über 5 s, Haptik `medium`.
- Betroffenes Handy: ruhiger Vollbild-Zustand „Du bist nicht mehr in dieser Party“ + „Eigene Party starten“, ohne rote Fläche.

### 3.6 Weitergabe (HandoverScreen)
- Komplett deckend, kein Durchscheinen geheimer Inhalte. Hintergrund ist ein radialer Verlauf in der Farbe des nächsten Spielers (18 %) auf #060810.
- Riesiger Avatar (96 px), Name in `font-game` Großbuchstaben: „Gib das Handy an MAX“.
- Bestätigung „Ich bin Max – los geht's“ in voller Breite, ≥ 56 px. Bei `secret`-Spielen 600 ms gedrückt halten (Füllung per clip-path, Loslassen springt in 200 ms zurück).
- Aufdecken mit `handoverReveal`. Gast→Gast wechselt nur Name/Avatar per Morph, ohne Neuaufbau.

### 3.7 Dialog „Zu wenige Spieler“
- Sheet, nicht per Scrim schließbar. Zurücktaste = „Zurück in die Lobby“.
- Zwei Karten: „Zurück in die Lobby“ (primär, vorausgewählt, Fokus) / „Spiel abbrechen – zählt nicht“ (sekundär, #ff6b98-Text).
- Wer gegangen ist: Name + Farbpunkt. Ton am TV erst bei Abbruch (T14, 2 s Hinweis, dann Wartebereich).

## 4. Mikro-Interaktionen

| Moment | Handy | TV |
|---|---|---|
| Antippen | scale 0.97, 140 ms | — |
| Beitritt (T01) | „Du bist dabei ✓“ `checkPop` + `success` | `avatarArrive` 1,2 s + Chime |
| Bereit (T04) | Knopf morpht zu „Bereit ✓“ + `medium` | ✓ `checkPop` + Tick |
| Ich bin dran (T06) | Bildschirm hellt auf (Hintergrund in Spielerfarbe 0→14 %) + `heavy` | Banner 1,5 s + Chime |
| Frist (T09) | Eingabe sperrt, „Zeit!“ + `warning` | Ring + Tick in den letzten 5 s |
| Siegerehrung (T16) | Konfetti synchron + `celebrate` (Sieger) | Trommelwirbel → Podest → Konfetti |

### 4.1 Verfügbarkeits-Chips (TV, Host-Handy, Online-Raum identisch)

| Zustand | Text | Icon | Farbe | Kachel |
|---|---|---|---|---|
| passt | „Startklar · {{count}} Spieler“ | Check | #8ff5ff | aktiv |
| Gäste setzen aus | „{{names}} setzen aus“ (eine Person: „setzt aus“; ohne Namen: „{{count}} Gäste setzen aus“) | Users | #8ff5ff | aktiv |
| zu wenige (planbar) | „Wartet auf {{count}} Spieler“ | Hourglass | #fbbf24 | aktiv, nur Start gesperrt |
| zu wenige wegen Aussetzern | „{{names}} setzen aus – noch {{count}} Spieler mit Handy nötig“ (ohne Namen: „Gäste setzen aus – …“) | Hourglass | #fbbf24 | aktiv, nur Start gesperrt |
| zu viele | „Höchstens {{max}} Spieler“ | Ban | #ff6b98 | `aria-disabled`, Bild/Name 45 % |
| Premium | „Nur mit Premium“ | Crown | #df8eff | `aria-disabled`, Bild/Name 45 % |
| unbekannt | „Nicht verfügbar“ | Ban | #ff6b98 | `aria-disabled`, Bild/Name 45 % |

Texte aus `availabilityChip()` (`src/lib/playable-games.ts`) unter `partyPlay.availability.*`; die Sprachdateien sind die Quelle der Wahrheit (Stand eingefroren). Stil: Pill, ≥ 11 px (TV ≥ `lu(2)`), Text in Tonfarbe, Fläche Ton + `1a`, Ring innen 1 px Ton + `38`. Der Chip selbst wird nie abgedunkelt. In Rastern und Listen mit vielen Spielen erscheint er nur bei Abweichungen (nicht „Startklar“), denn „Startklar“ steht nur dort, wo genau ein Spiel gezeigt wird (TV-Fußzeile, „Als Nächstes“). Der Spielname ist nie kleiner als der Chip. Platz-Symbole 📱/🔁 werden als Lucide-Icons (`Smartphone`/`Repeat2`) gezeichnet, nicht als Emoji, weil TV-Browser und Android sie unleserlich rendern.

## 5. Leer-, Lade- und Fehlerzustände
- **Laden:** Skelett-Zeilen in Endform (Kreis + Balken, Shimmer 1,4 s linear). Spinner nur in Knöpfen und erst nach 300 ms.
- **Leer:** einladend formulieren („Noch niemand da – zeig den QR“), immer mit Handlung.
- **Fehler:** Ursache + Ausweg in einem Satz („Platz wurde gerade vergeben – wähle einen anderen“). Die Liste aktualisiert sich dabei sichtbar, der weggefallene Platz geht per `leaveFade`. Nie eine Sackgasse.
- **Wiederverbinden:** pulsierender Punkt + „Verbinde neu …“, ohne Countdown für Spieler.

## 6. Barrierefreiheit
- Kontrast Text ≥ 4.5:1, große Schrift ≥ 3:1. **Spielerfarben nie als Textfarbe** (#6c5ce7 und #0984e3 fallen auf #060810 durch). Auf Farbflächen ist die Schrift `readableOn(color)`.
- Trefferflächen ≥ 44 × 44 px, Hauptaktionen ≥ 56 px hoch, Abstand zwischen Zielen ≥ 8 px.
- Fokus: `:focus-visible` mit 2 px #8ff5ff Ring + 2 px Abstand. Sheets fangen den Fokus und geben ihn beim Schließen zurück.
- Bewegungsarmut: `partyMotion(name, true)` zeigt dasselbe Endbild ohne Weg. `semantic`-Zeiten (Countdown, Fristen, Rückgängig) bleiben. Konfetti wird zu einem 400-ms-Aufleuchten.
- RTL (Arabisch): logische Eigenschaften (`ps/pe`, `ms/me`, `start/end`). Zeilen spiegeln sich, Zahlen, Codes und QR nicht. Wischrichtung folgt der Leserichtung.
- Status nie nur über Farbe: ✓/… zusätzlich zum Farbpunkt, und `aria-live="polite"` für Beitritte/Abgänge in Listen.

## 7. TV: Sicherheitsrand & Lesbarkeit aus 3 m
- 5 % Rand auf allen Seiten, keine Inhalte in den Ecken.
- Minimale Schrift: alles, was Gäste lesen müssen, ≥ `tvType.label` (~22 px bei 1080p). Namen ≥ `tvType.body`, Ansagen ≥ `tvType.title`. `tvType.micro` nur für Dekoration.
- Höchstens zwei Schriftgewichte pro Ansicht, Großbuchstaben nur in `font-game`-Ansagen.
- Keine Haarlinien unter 2 px als einziges Unterscheidungsmerkmal. Aktiver Zustand = `playerGlow(…, 'active')`.

## 8. Drei Akzente, die EventBliss abheben
1. **Deine Farbe folgt dir.** Jeder Spieler hat einen persönlichen Schein (`playerGlow`). Er umrahmt deine TV-Karte, deine Zeile beim Host und, wenn du dran bist, leuchtet dein eigenes Handy kurz in derselben Farbe auf. So weiß man ohne Lesen: „Das bin ich.“
2. **Ein Konfetti, drei Bildschirme.** Bei der Siegerehrung startet das Konfetti auf TV und allen Handys zur selben `startsAt`. Die Partikel des Handys fallen in der Spielerfarbe des Siegers, der Sieger selbst spürt `celebrate`.
3. **Reaktionen steigen auf.** Wartende tippen ein Emoji, das am TV aus der Kante des eigenen Chips aufsteigt (`reactionFloat`, 2,2 s, max. 1/s pro Spieler, höchstens 12 gleichzeitig). Bei Bewegungsarmut erscheint es nur als kurzer Badge am Chip.
