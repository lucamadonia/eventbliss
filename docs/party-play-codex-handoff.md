# Party-Play — Übergabe an Codex

Stand: 2026-10-03 · Branch `feature/party-play` (gepusht) · nicht in `main` gemergt

## Was Party-Play ist
Ein Party-Abend, bei dem jeder Spieler entweder ein **eigenes Handy** (📱) hat oder **am Host-Handy** (🔁 Gast) mitspielt. Fernseher (`event-bliss.com/tv`) zeigt Wartebereich mit QR, Spieler, Kino-Übergänge und Siegerehrung. Alle Geräte wechseln Szenen synchron über die Serveruhr.

Pflichtlektüre (in dieser Reihenfolge):
1. `docs/party-play-masterplan.md` — Spezifikation, Szenario-Katalog (A01…X01), Phasen
2. `docs/party-play-design.md` — Design-System (§4.1 Chips, §9 Next-Level-Brief)
3. `docs/qa/party-play-2026-10-01.md` — QA-Bericht (106 PASS, 0 FAIL zum letzten Lauf)
4. `docs/qa/party-play-handoff.md` — Detailstand je Bereich (von den Agents gepflegt)

## Deploy-Stand
| Teil | Stand |
|---|---|
| Supabase-Migration `20261001120000_party_play_guests.sql` | ✅ in Produktion |
| Web/TV (Vercel, `npx vercel --prod --yes --scope eventbliss-projects`) | ✅ live, aber **vor** dem TV-Code-Fix unten |
| iOS TestFlight 1.6.0 | ✅ Build hochgeladen (Run 37085759708) — **vor** TV-Code-Fix und „Euer Abend“ |
| Android | ❌ nicht gebaut (versionCode der Play Console unbekannt) |

## Wichtigste Architektur-Punkte
- Server: RPC `controller_party_request` (Gäste, claim/release/profile/kick/ban, `server_now`), anon `party_server_now()`.
- Client-Party: `src/games/party/controller-session.ts`, `controller-normalize.ts` (alte Server-Payloads), `party-scene.ts`.
- Raum/Runtime: `src/games/multiplayer/*` (Gäste als RoomPlayer, `localPlayerIds`, `useRemovedPlayers`, privacy guard: keine privaten Pakete an Gast-Sitze).
- Timing: `src/games/party/scene-clock.ts`, `scene-schedule.ts`, `phase-gate.ts`/`usePhaseGate.ts`.
- Weitergabe: `src/games/ui/HandoverScreen.tsx`, `useGuestHandover.tsx`, `guest-handover.ts`.
- Spielbarkeit: `src/lib/playable-games.ts` (`gameAvailability`, `availabilityChip`, `sharedDevice`, `sharedDeviceSupported`).
- TV: `src/games/tv/*`, `src/games/tv/cinema/*`, `src/hooks/useTVBroadcast.ts`.
- Bewegung/Design-Tokens: `src/lib/party-motion.ts`.
- Übersetzungen: alle 10 Locales in `src/i18n/locales/*.json`; Guard-Tests `src/i18n/dead-keys.test.ts`, `party-play-keys.test.ts`.

## Offene Punkte (Priorität)
1. **Neu, unbedingt testen: TV-Code-Fix** in `src/hooks/useTVBroadcast.ts` — TV zeigte „Warte auf den Host“, weil der Host auf einem beim App-Start eingefrorenen Zufallscode sendete. Jetzt folgt der Code der Party. Braucht neuen TestFlight-Build + Web-Deploy.
2. **„Euer Abend“-Bildschirm** (party-client, in Arbeit beim Stopp): nach Spielauswahl kein Auto-Start mehr; Wartebereich mit Beitreten (QR), editierbarer Spielerliste (Name/Symbol/Farbe, hinzufügen/entfernen/Reihenfolge), erstes Spiel als Hero, restlicher Abend, TV-Status, „Erstes Spiel starten“ → synchroner Countdown. TV soll parallel den Abendplan zeigen. Design-Gate-Anforderungen: siehe `docs/qa/party-play-handoff.md`.
3. **Gäste-Freigabe:** `sharedDeviceSupported` nur für flaschendrehen, this-or-that, hochstapler. Übrige 19 Spiele sind im Code angepasst; je Spiel QA (F01–F04, F09, F13/F14/F19, T-1, Geheimnis-Check) und dann Flag setzen. QA-Schalter nur in Dev/QA-Builds: `window.__partyPlayForceShared = [gameIds]`.
4. **GamesHub-Kanal-Besitz:** GamesHub kann `game-room:<code>` öffnen/schließen vor room-session → Risiko Verbindungsabbruch. Nur room-session soll den Kanal besitzen.
5. Ausstehende Re-Captures (Design): Tabu-Schiedsrichter-Vorschau, Wer-bin-ich-Abstand, Bombe Rundenende.
6. Bewusst nicht gebaut: Pause/Fortsetzen (F10), TV per QR koppeln (G01/G02), Emoji-Reaktionen (X01), „Zu spät“-Hinweis in Pantomime, Stuck-Detection (F11).
7. Übergroße Dateien (>500 Zeilen): Pantomime, Split-Quiz, OHRWURM, GEBRÄU, Wo-ist-was.
8. Nur auf echten Geräten prüfbar: QR aus 3 m, Konfetti-Sync, iOS Hintergrund, Android-Zurück, NAH-DRAN-Listen, Wer-bin-ich „Halten zum Ansehen“.

## Prüfen
```
npx tsc -p tsconfig.app.json --noEmit     # zuletzt 0 Fehler
npx vitest run                            # zuletzt 1907/1907 grün
npm run test:db                           # 27/27
npm run build
node scripts/qa/party-play-browser.mjs --scenario <IDs> --lang de|en --viewport 390x844   # Mehrgeräte-Harness
```
Hinweis: Festplatte C: war zwischendurch voll — Harness-Ausgaben in `scripts/tmp/` regelmäßig aufräumen. `.vercelignore` schließt `*.aab`, `.android-release-*`, `scripts/tmp` aus (sonst bricht der Upload ab).

## Release-Ablauf
1. Tests/Build grün → Commit/Push `feature/party-play`
2. `npx vercel --prod --yes --scope eventbliss-projects`
3. iOS: `gh workflow run ios-testflight.yml --ref feature/party-play`; im Log auf „UPLOAD SUCCEEDED“ prüfen (Workflow schlägt jetzt bei altool-Fehlern fehl)
4. Konten: siehe lokale Notiz bzw. Supabase-GitHub-Login luca.madonia@edu.teko.ch, Vercel info@event-bliss.com
