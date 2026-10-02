# Party-Play — UI/E2E-Testbericht (2026-10-01)

Branch `feature/party-play` · Grundlage: `docs/party-play-masterplan.md` Abschnitt 8 (Szenario-Katalog) und 12 (Teststrategie).
Stand: laufend während der Umsetzung; die Tabelle unten ist der letzte vollständige Lauf plus gezielte Nachläufe.

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

_Wird am Ende des Laufs aktualisiert (siehe Abschnitt 6)._

## 3. Gemeldete Fehler

_Siehe Abschnitt 6._

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
