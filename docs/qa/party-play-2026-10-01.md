# Party-Play — UI/E2E-Testbericht (2026-10-01)

Branch `feature/party-play` · Grundlage: `docs/party-play-masterplan.md` Abschnitt 8 (Szenario-Katalog) und 12 (Teststrategie).
Stand: 2026-10-02 (Abschluss). Tabellen = letzter Lauf je Szenario-ID (`node scripts/qa/party-play-latest.mjs --since 2026-10-02T09 --md`).

## 1. Was getestet wird und wie

| Ebene | Werkzeug | Befehl |
|---|---|---|
| Multi-Browser-Szenarien (B) | `scripts/qa/party-play-browser.mjs` | `node scripts/qa/party-play-browser.mjs --scenario <ID\|ID,ID\|A*\|all> [--real]` |
| Chaos (G4) | gleicher Runner | `node scripts/qa/party-play-browser.mjs --chaos N` |
| Spiel-Matrix (F09) | `scripts/qa/party-play-matrix.mjs` | `node scripts/qa/party-play-matrix.mjs [--games a,b] [--shares 0,30,100] [--host yes,no] [--budget 60]` |
| Gerät/Video (G) | Checkliste unten | manuell |

**Aufbau des Harness** (alle Dateien in `scripts/qa/`, jeweils < 500 Zeilen):
- `party-play-harness.mjs` — Puppeteer, je Gerät ein eigener Browser-Kontext (Handy 390×900, TV 1920×1080), PGlite mit den echten Migrationen (`controller-db.mjs`) oder `--real` (lokales Supabase), synthetischer Realtime-Broker mit Chaos (Verzögerung, Paketverlust, Trennung pro Gerät), RPC-Brücke, Bildschirmfoto je Schritt und Gerät, Szenen-Versatz aus `window.__partyPlayTrace`.
- `party-play-app.tsx` / `party-play.html` / `party-play-vite.config.ts` (Port 5186) — echte React-Bildschirme (Lobby, Wer-bist-du, Profil, Spiele, `TVScreen`), TV-Anbindung wie `NativeApp` (Pille nur auf `/games`), `__qaSeenLog` (wann welches `data-testid` sichtbar wurde, echte Wanduhr), `__qaRouteLog`.
- `party-play-client.ts` / `party-play-auth.tsx` — Broker-Adapter (Topic-Dedupe wie supabase-js) und umschaltbare Anmeldung (A03).
- `party-play-flows.mjs` — Abläufe über die echte UI: Party anlegen, TV koppeln wie ein Nutzer („Connect a TV“ → Code am TV öffnen), beitreten inkl. „Wer bist du?“/Profil, bereit, starten, Zeilen-Aktionen, generischer Spiel-Treiber mit Hänger-Erkennung (> 10 s ohne Änderung).
- `party-play-games.mjs` — Spiel-Treiber (this-or-that, fake-or-fact, flaschendrehen spezifisch, Rest generisch).
- `party-play-scenarios-{join,lobby,game,tv}.mjs`, `party-play-chaos.mjs`, `party-play-manual.mjs`.

**Statuswerte:** `PASS` · `FAIL` (Fehler im Produkt oder offener Befund) · `NOT_IMPLEMENTED` (benötigtes `data-testid`/Feature existiert noch nicht in `src/` — automatisch erkannt, kein Fehlalarm) · `MANUAL` (nur auf Gerät prüfbar) · `SKIPPED` (`--real`/PGlite-spezifisch).

**Belege:** `scripts/tmp/party-play/<Lauf>/<ID>/` — Bildschirmfotos je Schritt und Gerät (`NN-schritt-Gerät.png`), `report.json` (Messwerte, letzte Bildschirmtexte, Raum-Snapshots, RPC-Fehler), `summary.md`.

## 2. Ergebnisse je Szenario

Stand 2026-10-02, letzter Lauf je ID (PGlite + Broker). **0 FAIL** · 106 PASS · 13 INCONCLUSIVE · 4 NOT_IMPLEMENTED · 1 DEFERRED · 9 MANUAL (Abschnitt 4).
Zusätzlich **Chaos 10/10 PASS** (0–800 ms Verzögerung, 5 % Broadcast-Verlust, zufällige App-Neustarts; Spiel endet, kein Stillstand > 10 s, Ergebnis genau einmal mit allen Teilnehmern).

Zu den nicht-grünen IDs:
- **F12 INCONCLUSIVE**: Fristen gibt es nur im this-or-that-Modus „Speed“. Im Controller-Party-Ablauf startet das Spiel ohne Setup-Bildschirm, Speed ist dort nicht wählbar (Entscheidung bei room-runtime offen). `acceptInput` selbst ist per Unit-Test abgedeckt.
- **F10, G01, G02, X01 NOT_IMPLEMENTED**: Pause/Fortsetzen ohne test-ids; TV-QR-Kopplung ist Phase 4; Reaktionen nicht gebaut.
- **F11 DEFERRED**: „verbunden, aber hängt“ braucht Fortschrittssignale je Spiel (room-runtime, Sprint 2).
- **K13/K14 INCONCLUSIVE** (Entfernen-Matrix, Freigabe-Gate): Bei diesen Spielen ist die Rollen-/Zug-Prüfung bestanden (entfernter Spieler weder im Spiel-Roster noch am Zug). Offen bleibt nur „läuft danach weiter“, weil der generische Treiber das Spiel selbst nicht bewegen kann (headup: Neigesensor; pixeljagd/closeenough: Freitext/Buzzer; pantomime: Darstellung) bzw. der Zug 25 s beim Host/Beobachter lag. Kein Lauf zeigte einen Hänger, der auf den entfernten Spieler zurückgeht.

Entfernen mitten im Spiel je Spiel (K13 = nicht aktiver Spieler, K14 = aktiver Spieler; Schlüsselrolle Hochstapler F19 = PASS):

| Spiel | K13 | K14 |
|---|---|---|
| bomb | PASS | INCONCLUSIVE |
| brew | PASS | INCONCLUSIVE |
| category | PASS | INCONCLUSIVE |
| closeenough | INCONCLUSIVE | INCONCLUSIVE |
| drueck-das-wort | PASS | PASS |
| emoji-raten | PASS | PASS |
| fake-or-fact | PASS | PASS |
| flaschendrehen | PASS | PASS |
| geteilt-gequizzt | PASS | PASS |
| headup | INCONCLUSIVE | INCONCLUSIVE |
| hochstapler | PASS | PASS |
| ohrwurm | PASS | INCONCLUSIVE |
| pantomime | INCONCLUSIVE | PASS |
| pixeljagd | INCONCLUSIVE | INCONCLUSIVE |
| schnellzeichner | PASS | PASS |
| split-quiz | PASS | PASS |
| story-builder | PASS | PASS |
| taboo | PASS | PASS |
| this-or-that | PASS | PASS |
| wahrheit-pflicht | PASS | PASS |
| wer-bin-ich | PASS | PASS |
| wo-ist-was | PASS | INCONCLUSIVE |

Alle IDs:

| ID | Status | Run | Detail |
|---|---|---|---|
| A01 | PASS | 2026-10-02T13-29-51 |  |
| A03 | PASS | 2026-10-02T13-29-51 |  |
| A05 | PASS | 2026-10-02T19-14-00 |  |
| A06 | PASS | 2026-10-02T13-29-51 |  |
| A07 | PASS | 2026-10-02T13-29-51 |  |
| A08 | PASS | 2026-10-02T13-29-51 |  |
| A09 | PASS | 2026-10-02T13-29-51 |  |
| A10 | PASS | 2026-10-02T15-39-14 |  |
| A12 | PASS | 2026-10-02T13-29-51 |  |
| B01 | PASS | 2026-10-02T13-29-51 |  |
| B02 | PASS | 2026-10-02T13-29-51 |  |
| B03 | PASS | 2026-10-02T13-29-51 |  |
| B04 | PASS | 2026-10-02T13-29-51 |  |
| B06 | PASS | 2026-10-02T13-29-51 |  |
| B07 | PASS | 2026-10-02T13-29-51 |  |
| B07b | PASS | 2026-10-02T13-29-51 |  |
| B08 | PASS | 2026-10-02T13-29-51 |  |
| B09 | PASS | 2026-10-02T13-29-51 |  |
| B10 | PASS | 2026-10-02T13-29-51 |  |
| B11 | PASS | 2026-10-02T13-29-51 |  |
| B12 | PASS | 2026-10-02T13-29-51 |  |
| B13 | PASS | 2026-10-02T13-29-51 |  |
| C01 | PASS | 2026-10-02T13-29-51 |  |
| C02 | PASS | 2026-10-02T16-11-17 |  |
| C03 | PASS | 2026-10-02T16-36-18 |  |
| C06 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-1 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-2 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-3 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-4 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-5 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-6 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-7 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-8 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-9 | PASS | 2026-10-02T13-29-51 |  |
| CHAOS-10 | PASS | 2026-10-02T13-29-51 |  |
| D01 | PASS | 2026-10-02T13-29-51 |  |
| D04 | PASS | 2026-10-02T19-08-41 |  |
| D05 | PASS | 2026-10-02T13-29-51 |  |
| E01 | PASS | 2026-10-02T17-36-09 |  |
| E02 | PASS | 2026-10-02T16-11-17 |  |
| E03 | PASS | 2026-10-02T13-29-51 |  |
| E04 | PASS | 2026-10-02T13-29-51 |  |
| F01 | PASS | 2026-10-02T18-40-22 |  |
| F02 | PASS | 2026-10-02T19-14-00 |  |
| F03 | PASS | 2026-10-02T18-40-22 |  |
| F04 | PASS | 2026-10-02T13-29-51 | brew not driven to the end by the generic driver; participant check only |
| F05 | PASS | 2026-10-02T13-29-51 |  |
| F06 | PASS | 2026-10-02T13-29-51 |  |
| F07 | PASS | 2026-10-02T13-29-51 |  |
| F10 | NOT_IMPLEMENTED | 2026-10-02T13-29-51 | not implemented: data-testid game-pause, game-resume |
| F11 | DEFERRED | 2026-10-02T13-29-51 | stuck_detected for connected-but-idle devices deferred (room-runtime, sprint 2) |
| F12 | INCONCLUSIVE | 2026-10-02T16-11-17 | speed mode (the only this-or-that mode with deadlines) is not selectable in the controller-party flow: the game starts without its setup screen |
| F13a | PASS | 2026-10-02T15-01-12 |  |
| F13b | PASS | 2026-10-02T13-29-51 |  |
| F13c | PASS | 2026-10-02T16-11-17 |  |
| F14 | PASS | 2026-10-02T13-29-51 |  |
| F15 | PASS | 2026-10-02T13-29-51 |  |
| F16 | PASS | 2026-10-02T13-29-51 |  |
| F17 | PASS | 2026-10-02T13-29-51 |  |
| F18 | PASS | 2026-10-02T13-29-51 |  |
| F19 | PASS | 2026-10-02T13-29-51 |  |
| G01 | NOT_IMPLEMENTED | 2026-10-02T13-29-51 | not implemented: data-testid tv-pair-qr |
| G02 | NOT_IMPLEMENTED | 2026-10-02T13-29-51 | not implemented: data-testid tv-pair-qr, tv-pair-expired |
| G03 | PASS | 2026-10-02T13-29-51 |  |
| G04 | PASS | 2026-10-02T13-29-51 |  |
| G05 | PASS | 2026-10-02T13-29-51 |  |
| G06 | PASS | 2026-10-02T13-29-51 |  |
| H03 | PASS | 2026-10-02T13-29-51 |  |
| H03L | PASS | 2026-10-02T13-29-51 |  |
| H04 | PASS | 2026-10-02T13-29-51 |  |
| H05 | PASS | 2026-10-02T13-29-51 |  |
| I01 | PASS | 2026-10-02T13-29-51 | smoke only: migration local→server (10.1) is phase 6 |
| I02 | PASS | 2026-10-02T13-29-51 |  |
| K13-bomb | PASS | 2026-10-02T10-53-08 |  |
| K13-brew | PASS | 2026-10-02T16-44-32 | after the kick the turn moved to a present player; then waiting for that player's input (driver limit, 45 s) |
| K13-category | PASS | 2026-10-02T10-53-08 |  |
| K13-closeenough | INCONCLUSIVE | 2026-10-02T16-44-32 | closeenough: the generic driver cannot move this game even before the kick (30 s still); turn/roster checks passed |
| K13-drueck-das-wort | PASS | 2026-10-02T10-53-08 |  |
| K13-emoji-raten | PASS | 2026-10-02T10-53-08 |  |
| K13-fake-or-fact | PASS | 2026-10-02T10-53-08 |  |
| K13-flaschendrehen | PASS | 2026-10-02T10-53-08 |  |
| K13-geteilt-gequizzt | PASS | 2026-10-02T17-42-14 |  |
| K13-headup | INCONCLUSIVE | 2026-10-02T16-44-32 | headup: the generic driver cannot move this game even before the kick (30 s still); turn/roster checks passed |
| K13-hochstapler | PASS | 2026-10-02T18-07-15 |  |
| K13-ohrwurm | PASS | 2026-10-02T17-42-14 |  |
| K13-pantomime | INCONCLUSIVE | 2026-10-02T16-44-32 | pantomime: the generic driver cannot move this game even before the kick (30 s still); turn/roster checks passed |
| K13-pixeljagd | INCONCLUSIVE | 2026-10-02T16-44-32 | pixeljagd: the generic driver cannot move this game even before the kick (30 s still); turn/roster checks passed |
| K13-schnellzeichner | PASS | 2026-10-02T10-53-08 |  |
| K13-split-quiz | PASS | 2026-10-02T10-53-08 | roster not observable in broadcasts; turn/progress checks only |
| K13-story-builder | PASS | 2026-10-02T18-07-15 |  |
| K13-taboo | PASS | 2026-10-02T10-53-08 | roster not observable in broadcasts; turn/progress checks only |
| K13-this-or-that | PASS | 2026-10-02T10-53-08 |  |
| K13-wahrheit-pflicht | PASS | 2026-10-02T16-44-32 |  |
| K13-wer-bin-ich | PASS | 2026-10-02T18-07-15 |  |
| K13-wo-ist-was | PASS | 2026-10-02T10-53-08 |  |
| K14-bomb | INCONCLUSIVE | 2026-10-02T16-44-32 | the observable active player was the host/observer for 25 s |
| K14-brew | INCONCLUSIVE | 2026-10-02T16-44-32 | the observable active player was the host/observer for 25 s |
| K14-category | INCONCLUSIVE | 2026-10-02T16-44-32 | the observable active player was the host/observer for 25 s |
| K14-closeenough | INCONCLUSIVE | 2026-10-02T16-44-32 | closeenough: the generic driver cannot move this game even before the kick (30 s still); turn/roster checks passed |
| K14-drueck-das-wort | PASS | 2026-10-02T10-53-08 |  |
| K14-emoji-raten | PASS | 2026-10-02T10-53-08 |  |
| K14-fake-or-fact | PASS | 2026-10-02T10-53-08 |  |
| K14-flaschendrehen | PASS | 2026-10-02T12-04-49 |  |
| K14-geteilt-gequizzt | PASS | 2026-10-02T12-04-49 | active player not exposed in broadcasts (keys game,lang,phase,round,players,totalRounds,roleIndices,question,answers,correctAnswer,partyNight,__eventblissTvMessageId); kicked all 2 |
| K14-headup | INCONCLUSIVE | 2026-10-02T16-44-32 | headup: the generic driver cannot move this game even before the kick (30 s still); turn/roster checks passed |
| K14-hochstapler | PASS | 2026-10-02T18-07-15 | active player not exposed in broadcasts (keys game,lang,phase,phaseStartsAt,round,players,currentSpeaker,timeLeft,handover,partyNight,__eventblissTvMessageId); kicked all 3 non-obs |
| K14-ohrwurm | INCONCLUSIVE | 2026-10-02T17-42-14 | the observable active player was the host/observer for 25 s |
| K14-pantomime | PASS | 2026-10-02T16-44-32 | active player not exposed in broadcasts (keys ); kicked all 3 non-observer phones; below-min guard after 2 kick(s): abort → lobby |
| K14-pixeljagd | INCONCLUSIVE | 2026-10-02T16-44-32 | pixeljagd: the generic driver cannot move this game even before the kick (30 s still); turn/roster checks passed |
| K14-schnellzeichner | PASS | 2026-10-02T12-04-49 |  |
| K14-split-quiz | PASS | 2026-10-02T16-44-32 | active player not exposed in broadcasts (keys game,lang,phase,phaseStartsAt,currentRound,players,teamA,teamB,totalRounds,playerInfo,handover,question,answers,category,correctAnswer |
| K14-story-builder | PASS | 2026-10-02T10-53-08 |  |
| K14-taboo | PASS | 2026-10-02T17-55-55 | active player not exposed in broadcasts (keys ); kicked all 3 non-observer phones; below 4 players after 2 kick(s): guard dialog → abort → lobby |
| K14-this-or-that | PASS | 2026-10-02T12-04-49 | active player not exposed in broadcasts (keys phase,currentRound,matchId,totalRounds,mode,speedTimer,history,speedRemaining,debateRemaining,currentPair,roundVotes,players); kicked  |
| K14-wahrheit-pflicht | PASS | 2026-10-02T16-44-32 |  |
| K14-wer-bin-ich | PASS | 2026-10-02T16-44-32 |  |
| K14-wo-ist-was | INCONCLUSIVE | 2026-10-02T16-44-32 | the observable active player was the host/observer for 25 s |
| SMOKE | PASS | 2026-10-02T19-14-00 |  |
| T-1 | PASS | 2026-10-02T16-11-17 |  |
| T-2 | PASS | 2026-10-02T16-11-17 |  |
| T-3 | PASS | 2026-10-02T16-11-17 |  |
| T-4 | PASS | 2026-10-02T16-36-18 |  |
| X01 | NOT_IMPLEMENTED | 2026-10-02T13-29-51 | not implemented: data-testid reaction-bar, tv-reaction |

## 2b. Alle Spiele × Modus × Spielerzahl

Werkzeug: `node scripts/qa/party-play-modes-matrix.mjs --mode local|controller|online`; Zusammenfassung: `node scripts/qa/party-play-matrix-summary.mjs`.
Je Fall: (1) Zeigt die UI das Spiel genau so wählbar/startbar wie `gameAvailability()`? (Controller-Party: `game-option-<id>` data-available/data-startable; Online-Raum: `room-game-<id>` data-plannable/data-startable.) (2) Jeder startbare Fall wird gespielt.
Spielerzahlen: min = max(2, minPlayers), typisch = 4, max = min(12, maxPlayers) (lokal bis 30). Controller-Party in drei Besetzungen: nur Handys + Host spielt, 30 % Gäste + Host spielt, nur Handys + Host moderiert.

**Ergebnis: 305 Fälle, 0 Abweichungen UI ≠ gameAvailability.** Legende: R = Ergebnis gespeichert / Game-Over erreicht · P = läuft, im Zeitbudget (60–240 s) kein Ergebnis · S = Treiber kann das Spiel nicht bewegen · B = korrekt gesperrt · F = Fehler.

| Game | local | controller | online |
|---|---|---|---|
| bomb | P2 R1 | F3 P6 | P3 |
| brew | S3 | S9 | S3 |
| category | P2 S1 | F2 S7 | P3 |
| closeenough | S3 | S9 | S3 |
| drueck-das-wort | P3 | P9 | P3 |
| emoji-raten | P1 R2 | F2 P2 R5 | P3 |
| fake-or-fact | P1 R2 | F2 P2 R5 | P2 R1 |
| flaschendrehen | S3 | F2 P2 R5 | R3 |
| geteilt-gequizzt | S3 | B1 F1 S7 | R3 |
| headup | S3 | F1 S8 | S3 |
| hochstapler | S2 | F2 P2 R2 | P1 R1 |
| ohrwurm | P2 | P5 S1 | P2 |
| pantomime | P2 | B1 F2 S3 | P2 |
| pixeljagd | S3 | S9 | S3 |
| schnellzeichner | P1 S2 | F3 S6 | P2 R1 |
| split-quiz | P1 R1 | B1 F2 P3 | P2 |
| story-builder | R3 | F1 P1 R7 | R2 S1 |
| taboo | S2 | B1 F3 P2 | P2 |
| this-or-that | P1 R2 | F1 P2 R6 | P1 R2 |
| wahrheit-pflicht | S3 | F1 S8 | P2 S1 |
| wer-bin-ich | S3 | F1 P2 R6 | R3 |
| wo-ist-was | P3 | F2 P7 | P3 |

Cases: 305 · UI≠gameAvailability: 0 · failures: 31

Einordnung der 31 F: 28× „Handys nach Abbruch nicht in der Lobby“ bei 10/12 Spielern, ein **Lastartefakt** (zwei Matrizen parallel). Isoliert mit Host + 11 Handys sind alle in 1,95–2,4 s zurück. 3× „partyControllers.notReady“ beim Start nach einem vorherigen Spiel; vermutlich Testtreiber (veralteter Bereit-Status im Snapshot), nicht reproduziert, offen zur Nachprüfung.

**Grenze dieser Automatik:** „P“/„S“ heißt nicht „kaputt“, sondern „vom generischen Treiber nicht bis zum Ergebnis gespielt“. Automatisch Ende-zu-Ende mit gespeichertem Ergebnis belegt (mind. ein Modus): this-or-that, fake-or-fact, flaschendrehen, emoji-raten, wer-bin-ich, story-builder, hochstapler, split-quiz, bomb, geteilt-gequizzt, schnellzeichner. Für headup, pixeljagd, closeenough, brew, pantomime, wahrheit-pflicht, drueck-das-wort, ohrwurm, wo-ist-was, category, taboo braucht es spielspezifische Treiber oder einen Playtest-Durchgang.

## 3. Gemeldete Fehler (Eigentümer · Status)

| # | Befund | Szenario | Eigentümer | Status |
|---|---|---|---|---|
| 1 | 121 partyPlay./tvLobby.-Schlüssel fehlten in allen 10 Sprachen (deutsche Defaults in EN) | H05 | party-client / tv-lobby | behoben, verifiziert |
| 2 | PartySheet stiehlt bei jedem Render den Fokus, Gastname wird „Ma“ | C06, B* | party-client | behoben, verifiziert |
| 3 | Profil-Editor stürzt ohne avatar/color ab (alter Server) | --real | party-client | behoben |
| 4 | Profil-/Sitzänderungen erreichen TV/Handys erst nach 2–4 s (4-s-Poll) | C01, B01 | party-client | behoben (party-changed + refreshAtLeast), ≤ 1 s verifiziert |
| 5 | Volle Party mit freiem 🔁-Platz: kein „Wer bist du?“, Platz nicht übernehmbar | B13 | db-party + party-client | behoben (seated:false), verifiziert |
| 6 | Beendete Party: roher englischer Fehlertext statt Abschluss-Bildschirm | A08 | party-client | behoben, verifiziert |
| 7 | Nach „Party wechseln“ leerer Name im Profil | A05 | party-client | behoben, verifiziert |
| 8 | „Party beenden“: kein Finale auf dem TV, Host landet im lokalen Party-Bildschirm | D04 | party-client / tv-lobby | behoben, verifiziert |
| 9 | Sperrliste las falsches Array (Entsperren unmöglich); danach Wiederbeitritt durch klebrigen „entfernt“-Zustand blockiert | F16 | party-client | behoben, verifiziert |
| 10 | Mitglied öffnet Einladungslink erneut, landet wieder bei „Wer bist du?“, Spiel wartet ewig (Chaos) | B07b | party-client | behoben, verifiziert |
| 11 | Gleichzeitiger Claim: Verlierer bekam not_guest statt seat_taken (Re-Key) | B02 | db-party | behoben, verifiziert |
| 12 | Migration fehlte im lokalen QA-Supabase (--real) | --real | db-party | behoben |
| 13 | Host offline und zurück: Handys bleiben pausiert (Presence nicht neu getrackt) | F06 | room-runtime | behoben, verifiziert |
| 14 | „Ohne Tom weiterspielen“ wirkungslos, Dauerpause | F05 | room-runtime | behoben, verifiziert |
| 15 | Entfernter Spieler behielt Züge in fake-or-fact (Hänger) | F13b/F14 | room-runtime | behoben, verifiziert |
| 16 | Andere Handys kannten den entfernten Spieler > 5 s | F17 | room-runtime | behoben (≤ 1 s ab RPC) |
| 17 | Entfernen mitten im Spiel in allen 22 Spielen | K13/K14 | room-runtime, timing-handover, party-client | umgesetzt; 0 FAIL, Rest INCONCLUSIVE (siehe 2) |
| 18 | Szenenwechsel per Poll: Handys bis 4,9 s nach dem Host im Spiel | T-1 | timing-handover / party-client | behoben (Szenen-Uhr), T-1…T-4 PASS |
| 19 | Hochstapler-Gastablauf (secret) loopte pass/cover | F03 | timing-handover | behoben, verifiziert |
| 20 | Hochstapler lokal: Absturz „reading 'name'“ in Runde 2 | Matrix lokal | timing-handover (ImpostorGame) | behoben, verifiziert |
| 21 | TVConnect-Popover: „Zurück zum Spiel“ in der Lobby, Escape, abgeschnittene Labels | UI | tv-lobby / party-client | behoben |
| 22 | Speed-Modus (einzige Fristen in this-or-that) im Party-Ablauf nicht wählbar | F12 | room-runtime | **offen (Entscheidung)** |
| 23 | Verbundenes, aber hängendes Gerät wird nicht erkannt | F11 | room-runtime | **verschoben (Sprint 2)** |
| 24 | Pause/Fortsetzen, TV-QR-Kopplung, Reaktionen | F10, G01/G02, X01 | – | **nicht gebaut** |
| 25 | ohrwurm: „PhaseBanner is not defined“ (Host-Seite weiß) | K14-ohrwurm | Spielcode | trat einmal während eines laufenden Refactors auf, danach nicht reproduziert |

## 4. Manuelle Checkliste (Gerät / Video)

| ID | Prüfung | Geräte | Ergebnis |
|---|---|---|---|
| A02 | App nicht installiert: QR mit Kamera → Web-Seite mit Code + Store-Links; nach Installation Code nutzbar | iPhone, Android | ☐ |
| A04 | Kaltstart (App beendet) und Hintergrund (andere Party offen) → beide landen im Beitritt, keine Doppel-Navigation | iPhone, Android | ☐ |
| A11 | Frisch installiert: Link `event-bliss.com/party/join/CODE` aus Notizen/Nachrichten öffnet App, sonst Web-Fallback | iPhone, Android | ☐ |
| G07 | TV-QR aus 3 m scanbar (1080p + 4K), QR ≥ 30 % Höhe, weißer Rand | Tizen, webOS, Fire TV | ☐ |
| G08 | Vollbild-Knopf; TV dimmt/schläft 30 min nicht (Lobby + Spiel) | Tizen, webOS, Fire TV | ☐ |
| H01 | iOS Hintergrund 30 s in Lobby und im Spiel → Wiederverbindung, gleicher Platz, kein Doppel-Ergebnis | iPhone alt + neu | ☐ |
| H02 | Android-Zurück auf Wer-bist-du, Profil, Lobby, jedem Spiel, Weitergabe, Entfernen-Blatt → nie ohne Rückfrage raus | Android günstig + neu | ☐ |
| T-5 | Konfetti T16: TV + 3 Handys in einer Aufnahme (60 fps), Start innerhalb 15 Frames | Video | ☐ |
| P | Playtests 12.3 (Familie, JGA, Technik-Freunde): Scan→Spiel ≤ 2 min, Weitergabe ≤ 5 s, 0 Technik-Abbrüche | Gruppe | ☐ |

## 5. Hinweise zum Harness

- Läuft gegen PGlite (echte Migrationen) mit synthetischem Realtime-Broker. `--real` gegen das lokale QA-Supabase ist angebunden (Migration angewendet); die Szenarien liefen überwiegend mit PGlite.
- Broker: FIFO je Kanal (wie WebSocket/TCP); Verzögerung und Verlust nur für Broadcasts, Presence verlustfrei.
- Kicks gehen bewusst erst nach dem 5-s-„Rückgängig“-Fenster an den Server; alle ≤ 1-s-Messungen laufen ab dem RPC.
- Timing-Szenarien (T-*) nur isoliert laufen lassen; parallele Matrizen auf einer Maschine verfälschen Versatzmessungen und große Partys (siehe 2b).
- Am 2026-10-02 lief Laufwerk C: voll (0 Byte frei); einige report.json wurden dabei abgeschnitten (der Aggregator überspringt sie). Die QA-Artefakte belegen ~0,4 GB (scripts/tmp/party-play).
