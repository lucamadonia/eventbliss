-- Meldungen aus den Spielen auswertbar machen.
--
-- `user_feedback` gibt es bereits (Migration 20260110122610) und nimmt seit
-- jeher freien Text von der Landingpage entgegen. Ab jetzt melden Spieler auch
-- direkt aus dem laufenden Spiel: eine falsche Antwort bei NAH DRAN, ein Song,
-- der wegen eines toten Links nicht abspielt.
--
-- Ohne diese drei Spalten landete der Zusammenhang nur im Fliesstext. Man
-- koennte ihn lesen, aber nicht filtern — und genau das braucht es: "zeig mir
-- alle Meldungen zu closeenough" oder "welcher Song wurde am haeufigsten
-- gemeldet". Zehn Meldungen zur selben Inhalts-ID sind ein klares Signal, im
-- Fliesstext sind sie unsichtbar.
--
-- Alle drei Spalten sind nullbar: Bestehende Zeilen von der Landingpage bleiben
-- gueltig, und eine Meldung ohne erkannten Inhalt soll trotzdem ankommen.

ALTER TABLE public.user_feedback
  ADD COLUMN IF NOT EXISTS game_id     text,
  ADD COLUMN IF NOT EXISTS content_id  text,
  ADD COLUMN IF NOT EXISTS report_type text;

COMMENT ON COLUMN public.user_feedback.game_id IS
  'Spiel-ID wie in playable-games.ts, z. B. closeenough, ohrwurm. NULL bei Meldungen ausserhalb der Spiele.';
COMMENT ON COLUMN public.user_feedback.content_id IS
  'Kennung des gemeldeten Inhalts, soweit vorhanden — UUID bei DB-Inhalten (Frage, Song), sonst NULL. Spiele mit handgepflegten Inhaltsdateien haben keine stabile ID.';
COMMENT ON COLUMN public.user_feedback.report_type IS
  'wrong_answer | not_loading | inappropriate | other';

-- Index auf die beiden Felder, nach denen tatsaechlich gesucht wird. Teilindex,
-- weil der Grossteil der Zeilen (Landingpage-Feedback) game_id NULL hat und
-- diese Zeilen den Index nur aufblaehen wuerden.
CREATE INDEX IF NOT EXISTS idx_user_feedback_game
  ON public.user_feedback (game_id, content_id)
  WHERE game_id IS NOT NULL;

-- RLS bleibt unveraendert: INSERT ist fuer jeden offen (auch anonym) — ein
-- Partyspiel hat keinen Login, und eine Meldung, die eine Anmeldung verlangt,
-- wird nie abgeschickt. Lesen und Aendern bleibt Admins vorbehalten.
