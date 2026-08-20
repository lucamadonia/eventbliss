# Übergabe — Nacht vom 19. auf den 20. August 2026

Stand am Ende: Arbeitsverzeichnis sauber, alles gepusht, keine Migration ausstehend,
**61 Tests grün**, Web live, TestFlight-Build durch.

---

## Ausgeliefert

### PIXELJAGD — fertig

| | |
|---|---|
| Bildmotive | **885** in der Datenbank, Ø 9,5 von 10 Sprachen |
| Kategorien | Stars 193, Essen 170, Marken 161, Orte 156, Tiere 120, Filme 85 |
| Quelle | Wikimedia Commons über Wikidata — freie Lizenz, Bildnachweis, zehn Sprachen |
| Fernsehansicht | eigene View, drei Registrierungsstellen |
| Spielkarte | 480×480, ersetzt den verzerrten Platzhalter |

**Zwei Fehler behoben, die das Spiel unbrauchbar machten:**

1. **Der Auflösungsablauf war unspielbar.** Nach dem Buzzern standen sofort „Falsch" und
   „Richtig" da — die Gruppe sollte urteilen, ohne die Lösung zu kennen. Jetzt zweistufig:
   laut sagen → Auflösung aufdecken → urteilen.
2. **Bilder wurden beschnitten.** `object-fit: cover` (`Math.max`) kappte bei Hochformaten
   Kopf und Füße. Bei einem Ratespiel fällt damit genau das weg, woran man das Motiv
   erkennt. Jetzt `contain`.

**Bildrechte:** Alle vier CC-BY-Pflichten erfüllt — Urheber, Lizenz, Quelle als Link und
seit `3b85d7e` auch der Bearbeitungshinweis („verpixelt dargestellt"). Der Punkt, an dem
es kippt, ist immer derselbe: eine Bildquelle ohne freie Lizenz. Das Admin-Feld verlangt
nur *irgendeinen* Nachweistext, es prüft keine Erlaubnis.

### OHRWURM — behoben

- **Stumme Runden an der Wurzel behoben.** Drei Ursachen zugleich: Die Uhr startete vor
  der Tonprüfung, `spotifyUri` täuschte einen funktionierenden Spieler vor, und
  `ohrwurm-preview` verkaufte Drosselung als „nicht gefunden".
- **Zurück-Weg im Spiel repariert** (`useBackGuard`, Phasenrückweg).
- **Songzuordnung auf echte Chartplatzierungen umgestellt** statt Künstlerherkunft.
- **Welthit-Schwelle repariert:** Sie verlangte vier *Sprachen*, die historischen Quellen
  decken nur drei ab — unerreichbar. Zählt jetzt *Märkte*.

### CLOSE ENOUGH (de: „Nah Dran") — Fundament

Neues Schätzspiel. Pro Runde eine Frage mit einer Zahl als Antwort, alle tippen
gleichzeitig, wer am nächsten dran liegt, gewinnt.

| Fertig und getestet | |
|---|---|
| Tabelle `closeenough_questions` | RLS mit `WITH CHECK`, GIN-Index |
| **864 Fragen live** | Ø **9,9 von 10 Sprachen** |
| `number-format.ts` | 17 Tests — de/en/**ar** |
| `closeenough-scoring.ts` | 17 Tests — Gleichstand, kein Tipp, Bonusgrenze |
| `closeenough-anchors.ts` | 9 Tests — Selbstverrats-Schutz |
| Pipeline `scripts/closeenough-seed.mjs` | wiederholbar, mit `--probe` |

Bestand: laender 256, natur 197, sport 136, bauwerke 129, technik 118, tierwelt 28,
**alltag 0**.

---

## Vier Fehler, die sonst still Schaden angerichtet hätten

Drei davon kamen durch Nachfragen des Nutzers ans Licht.

| Fehler | Was passiert wäre |
|---|---|
| **Welthit-Schwelle** unerreichbar | Polnische und türkische Spieler hätten aus 25 Jahren Chartgeschichte fast nichts gesehen |
| **Deezer-Adressen laufen nach 15 Min ab** | Die Datenbank hätte für *jeden* Song eine tote Adresse gehabt — schlimmer als der Ausgangszustand |
| **Bildbeschnitt** | Motive dauerhaft unerkennbar |
| **Jahres-Toleranz ±57 Jahre** | 3 % von 1889; der Volltreffer-Bonus wäre bei jeder Jahresfrage geschenkt gewesen. 184 Fragen korrigiert |

Dazu ein eigener Denkfehler, den eine Nachfrage aufdeckte: Ein Vergleichsanker **je
Einheit** (27) ist zu grob — „Meter" reicht von Bauwerkshöhen bis zu 60 km langen Tunneln.
Richtig ist ein Anker **je Fragerahmen** (42).

---

## Offen für die nächste Sitzung

### Sofort, ohne Code

1. **`service_role`-Schlüssel austauschen.** Er stand lesbar in einem Screenshot. Gute
   Nachricht: Das Projekt nutzt das neue Supabase-Schlüsselsystem
   (`VITE_SUPABASE_PUBLISHABLE_KEY`), einzelne Schlüssel lassen sich also widerrufen, ohne
   das JWT-Geheimnis zu rollen — **kein Redeploy nötig**.
2. **OHRWURM-Vorschau-Backfill.** iTunes hatte gedrosselt; das Kontingent setzt sich
   täglich zurück:
   ```powershell
   $env:EB_SERVICE_KEY = "…"
   node scripts/backfill-previews.mjs
   ```
   Das Skript hält bei Drosselung von selbst an und macht beim nächsten Start weiter.
   Danach ist die Obergrenze für gleichzeitige Partien aufgehoben.
3. **GitHub-Secret `EB_SERVICE_KEY`** anlegen, damit der monatliche Chart-Abgleich läuft.

### CLOSE ENOUGH fertigbauen

Der vollständige Plan liegt in
`~/.claude/plans/bitte-analysiere-folgende-bug-typed-bachman.md` und enthält fertigen
JSX-Entwurf, Adminaufbau und alle Fundstellen mit Zeilennummern. Einstieg bei
**Schritt 4**:

4. Vier Spielbildschirme (Einrichtung, Eingabe, Auflösung, Endstand)
5. Online-Pfad nach dem `act()`-Muster
6. Fernsehansicht
7. Adminseite mit Toleranz-Vorschau
8. Einhängung an 16 Stellen, acht restliche Sprachen

**Vier Fallen, die im Plan stehen und teuer wären:**

- Die Phase muss **`reveal`** heißen, nicht `roundEnd` — sonst blendet `TVScreen.tsx:92`
  die Spielansicht aus. (Genau deshalb ist der Auflösungszweig in `TVPixeljagdView` dort
  toter Code.)
- **Tipps erst ab `reveal` in den Snapshot**, sonst liest ein Mitspieler sie in der
  Konsole mit.
- **`Number(row.answer)`** im Loader — `numeric` kommt je nach Größe als String.
- **Jahreszahlen linear**, nicht logarithmisch — `log10` liefert bei v. Chr. NaN.

### Kleinere Restpunkte

- **Kategorie *Alltag* ist leer.** Wikidata kann sie nicht liefern; die 130 Partyfragen
  entstehen nur über den Freitext-Modus der Adminseite. Deshalb ist der kein Nebenfeature.
- **Tierwelt** hat nur 28 statt 120 Fragen — Wikidata pflegt Tiergrößen kaum.
- `ResultScreen.tsx` hat harte deutsche Texte und einen ungenutzten Prop `gameId`.
- Zurück-Guard fehlt in sechs Spielen (nur OHRWURM und PIXELJAGD nutzen ihn).

---

## Wichtige Betriebshinweise

| | |
|---|---|
| Supabase-CLI | global über Scoop — `supabase db push`, **nicht** `npx` |
| Deploy Web | `vercel --prod` (nur CLI, kein Git-Auto-Deploy) |
| Deploy App | `gh workflow run ios-testflight.yml --ref main`, ~13 Min |
| Build-Tor | `npx vite build` — `npx tsc` prüft nichts (`files: []`) |
| Zeilendeckel | Supabase deckelt REST bei 1000 Zeilen; **immer `.range()`** |
| Bilder-Cache | seit `c8c91bb` ein Tag statt ein Jahr — `/images/` war als „unveränderlich" ausgeliefert |
