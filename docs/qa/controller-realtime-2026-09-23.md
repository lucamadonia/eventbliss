# Joystick: tatsächlicher Supabase-Transport

## Nachweis

`node scripts/qa/controller-supabase.mjs` endete am 23.09.2026 mit Exitcode 0. Der Lauf verwendet lokale Supabase-Dienste (Auth, PostgREST, Realtime) mit der neuen Migration und vier eigens angelegten Konten. Konten werden anschließend gelöscht.

- Drei aufeinanderfolgende Matches: Bombe, Kategorien und Entweder/Oder, jeweils neue Match-ID.
- Nicht mitspielender Moderator bleibt autoritativ und erhält keine Spielerstatistik.
- Signierte Spieleraktion wird dem richtigen Absender zugeordnet.
- Später Beitritt wartet bis zum nächsten Match.
- Abgemeldeter Gast tritt mit derselben Spieleridentität wieder bei; die laufende Teilnehmerreihenfolge bleibt erhalten.
- Wiederholte Ergebnisübermittlung erzeugt keine doppelten Ergebnisse oder Statistiken: acht erwartete Statistikzeilen.
- Nicht angemeldeter Zugriff wird abgelehnt.

Bericht: `scripts/tmp/controller-supabase-result.json`. Dies ist ein echter lokaler Backendtest mit synthetischen Spielpunkten; er ersetzt weder die Bedienung vollständiger Spiele noch einen Test des produktiven Backends.

## Behobene Verbindungsfehler

1. Gleichnamige Realtime-Kanäle wurden vor abgeschlossenem Abmelden wiederverwendet. Der neue Beitritt wartet auf `unsubscribe`; parallele Beitritte teilen einen Versuch. Der gemeinsame Socket bleibt bestehen.
2. Verspätete Presence-Verifikation oder Fehler einer alten Verbindung konnten den neuen Zustand überschreiben. Verbindungs- und Revisionsprüfungen verwerfen solche Antworten.
3. Spielwechsel aktualisierten unnötig Presence und überschritten das serverseitige Budget. Die [offizielle Realtime-Konfiguration](https://github.com/supabase/realtime/blob/main/config/runtime.exs) setzt standardmäßig fünf Presence-Aufrufe je 30 Sekunden. Presence enthält jetzt den anfänglichen Gastgebernachweis; aktuelle Spielinformationen werden weiterhin sofort als signierter `room-state` gesendet. Bereitschaftsänderungen werden zusammengefasst und auf vier Aufrufe je 30,1 Sekunden begrenzt. Das Budget überlebt einen Kanalwechsel. Der Beitritts-Timeout berücksichtigt eine notwendige Budgetwartezeit.

Bei absichtlich sehr schnellem wiederholtem Umschalten der Bereitschaft kann deren Bestätigung verzögert eintreffen. Spielzüge und Spielzustände unterliegen dieser Presence-Warteschlange nicht.
