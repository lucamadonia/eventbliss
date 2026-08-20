-- CLOSE ENOUGH — Toleranz bei Jahreszahlen korrigieren.
--
-- Die Pipeline hatte Jahresrahmen mit 2-3 % Toleranz angelegt. Ein Prozentsatz
-- einer Jahreszahl ist aber riesig: 3 % von 1889 sind +-57 Jahre. Die
-- Bonusgrenze laege damit zwischen 1832 und 1946 -- der Volltreffer-Bonus waere
-- bei jeder Jahresfrage geschenkt gewesen.
--
-- 0,15 % sind rund +-3 Jahre und damit eine echte Huerde. Betroffen sind die
-- Rahmen built_year, founded_year und released_year.

UPDATE public.closeenough_questions
   SET tolerance_pct = 0.15
 WHERE unit_key = 'year'
   AND tolerance_pct > 0.5;
