-- =============================================
-- FAMBLISS Test-Services (8 actionreiche Aktivitäten in Freiburg)
-- Führe dieses SQL im Supabase SQL Editor aus
-- =============================================

DO $$
DECLARE
  v_agency_id UUID;
  v_service_id UUID;
BEGIN
  SELECT id INTO v_agency_id FROM public.agencies WHERE slug = 'fambliss' LIMIT 1;

  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'FAMBLISS Agency nicht gefunden! Stelle sicher dass die Agency mit slug "fambliss" existiert.';
  END IF;

  RAISE NOTICE 'FAMBLISS gefunden: %', v_agency_id;

  -- 1) Kajak-Tour auf der Dreisam (49€/Person)
  INSERT INTO public.marketplace_services (agency_id, slug, status, category, price_cents, price_type, min_participants, max_participants, duration_minutes, location_type, location_city, location_country, cancellation_policy, auto_confirm, advance_booking_days, is_featured, avg_rating, review_count, booking_count, gallery_urls, requires_deposit, deposit_percent)
  VALUES (v_agency_id, 'kajak-tour-dreisam-' || substr(md5(random()::text),1,4), 'approved', 'sport', 4900, 'per_person', 4, 16, 180, 'on_site', 'Freiburg', 'DE', 'moderate', false, 3, false, 0, 0, 0, '{}', false, 0)
  RETURNING id INTO v_service_id;
  INSERT INTO public.marketplace_service_translations (service_id, locale, title, short_description, description, includes, requirements)
  VALUES (v_service_id, 'de', 'Kajak-Tour auf der Dreisam', 'Paddelt gemeinsam durch Freiburg — Action pur auf dem Wasser mit professionellem Guide!', 'Erlebt Freiburg von der Wasserseite! Unsere geführte Kajak-Tour führt euch über die Dreisam durch die schönsten Ecken der Stadt. Inklusive Equipment, Einweisung und wasserdichtem Beutel für eure Sachen. Perfekt für JGA, Teamevents oder Geburtstage.', ARRAY['Kajak + Paddel + Schwimmweste','Professioneller Guide','Wasserdichter Packsack','Gruppenfotos','Erfrischungsgetränke nach der Tour'], ARRAY['Schwimmkenntnisse erforderlich','Mindestalter 16 Jahre','Sportliche Kleidung die nass werden darf']);
  RAISE NOTICE '✅ 1/8 Kajak-Tour erstellt';

  -- 2) Schwarzwald Quad-Tour (89€/Person)
  INSERT INTO public.marketplace_services (agency_id, slug, status, category, price_cents, price_type, min_participants, max_participants, duration_minutes, location_type, location_city, location_country, cancellation_policy, auto_confirm, advance_booking_days, is_featured, avg_rating, review_count, booking_count, gallery_urls, requires_deposit, deposit_percent)
  VALUES (v_agency_id, 'schwarzwald-quad-tour-' || substr(md5(random()::text),1,4), 'approved', 'sport', 8900, 'per_person', 2, 12, 240, 'on_site', 'Freiburg', 'DE', 'strict', false, 7, true, 0, 0, 0, '{}', false, 0)
  RETURNING id INTO v_service_id;
  INSERT INTO public.marketplace_service_translations (service_id, locale, title, short_description, description, includes, requirements)
  VALUES (v_service_id, 'de', 'Schwarzwald Quad-Tour Adrenalin', 'Offroad durch den Schwarzwald — 4 Stunden Quad-Action auf wilden Trails!', 'Pure Adrenalin-Action im Schwarzwald! Mit unseren leistungsstarken Quads geht es über Wald- und Feldwege durch die atemberaubende Landschaft rund um Freiburg. Inklusive Einweisung, Schutzausrüstung und einer Pause an einer Schwarzwald-Hütte mit Vesper.', ARRAY['Quad inkl. Benzin','Helm + Schutzausrüstung','Professioneller Tourguide','Schwarzwald-Vesper an der Hütte','Action-Fotos der Tour'], ARRAY['Führerschein Klasse B erforderlich','Mindestalter 18 Jahre','Wetterfeste Kleidung']);
  RAISE NOTICE '✅ 2/8 Quad-Tour erstellt';

  -- 3) Kletterpark Schauinsland (55€/Person)
  INSERT INTO public.marketplace_services (agency_id, slug, status, category, price_cents, price_type, min_participants, max_participants, duration_minutes, location_type, location_city, location_country, cancellation_policy, auto_confirm, advance_booking_days, is_featured, avg_rating, review_count, booking_count, gallery_urls, requires_deposit, deposit_percent)
  VALUES (v_agency_id, 'kletterpark-schauinsland-' || substr(md5(random()::text),1,4), 'approved', 'sport', 5500, 'per_person', 4, 20, 180, 'on_site', 'Freiburg', 'DE', 'moderate', true, 2, false, 0, 0, 0, '{}', false, 0)
  RETURNING id INTO v_service_id;
  INSERT INTO public.marketplace_service_translations (service_id, locale, title, short_description, description, includes, requirements)
  VALUES (v_service_id, 'de', 'Kletterpark Schauinsland Adventure', 'Hochseilgarten am Schauinsland — 7 Parcours von Easy bis Extrem!', 'Der ultimative Kletterpark am Freiburger Hausberg! 7 verschiedene Parcours in bis zu 15 Meter Höhe. Von Anfänger bis Adrenalin-Junkie ist für jeden was dabei. Inklusive Flying Fox, Tarzan-Sprung und Team-Challenges.', ARRAY['Klettergurt + Sicherung','Einweisung durch Trainer','Alle 7 Parcours','Flying Fox (120m)','Tarzan-Sprung'], ARRAY['Mindestalter 12 Jahre','Sportliche Kleidung','Geschlossene Schuhe']);
  RAISE NOTICE '✅ 3/8 Kletterpark erstellt';

  -- 4) Wildwasser-Rafting (69€/Person)
  INSERT INTO public.marketplace_services (agency_id, slug, status, category, price_cents, price_type, min_participants, max_participants, duration_minutes, location_type, location_city, location_country, cancellation_policy, auto_confirm, advance_booking_days, is_featured, avg_rating, review_count, booking_count, gallery_urls, requires_deposit, deposit_percent)
  VALUES (v_agency_id, 'wildwasser-rafting-' || substr(md5(random()::text),1,4), 'approved', 'sport', 6900, 'per_person', 6, 24, 240, 'on_site', 'Freiburg', 'DE', 'moderate', false, 5, false, 0, 0, 0, '{}', false, 0)
  RETURNING id INTO v_service_id;
  INSERT INTO public.marketplace_service_translations (service_id, locale, title, short_description, description, includes, requirements)
  VALUES (v_service_id, 'de', 'Wildwasser-Rafting Schwarzwald', 'Schlauchboot-Action auf wildem Wasser — Teamwork und Adrenalin pur!', 'Stürzt euch als Team ins wilde Wasser! Unsere Rafting-Tour führt euch durch aufregende Stromschnellen in der Umgebung von Freiburg. Perfekt für Gruppen die gemeinsam Grenzen überwinden wollen. Professionelle Guides sorgen für Sicherheit und maximalen Spaß.', ARRAY['Schlauchboot + Paddel','Neoprenanzug + Schwimmweste + Helm','Professioneller Raftguide','Umkleidemöglichkeit','Gruppenfoto'], ARRAY['Schwimmkenntnisse','Mindestalter 14 Jahre','Badekleidung mitbringen']);
  RAISE NOTICE '✅ 4/8 Rafting erstellt';

  -- 5) Bubble Soccer (35€/Person)
  INSERT INTO public.marketplace_services (agency_id, slug, status, category, price_cents, price_type, min_participants, max_participants, duration_minutes, location_type, location_city, location_address, location_country, cancellation_policy, auto_confirm, advance_booking_days, is_featured, avg_rating, review_count, booking_count, gallery_urls, requires_deposit, deposit_percent)
  VALUES (v_agency_id, 'bubble-soccer-' || substr(md5(random()::text),1,4), 'approved', 'entertainment', 3500, 'per_person', 8, 30, 120, 'at_agency', 'Freiburg', 'Sportpark Freiburg', 'DE', 'flexible', true, 2, false, 0, 0, 0, '{}', false, 0)
  RETURNING id INTO v_service_id;
  INSERT INTO public.marketplace_service_translations (service_id, locale, title, short_description, description, includes, requirements)
  VALUES (v_service_id, 'de', 'Bubble Soccer Turnier', 'Fußball mal anders — in aufblasbaren Bällen gegeneinander antreten!', 'Das ultimative Spaß-Event! Schlüpft in riesige aufblasbare Blasen und spielt Fußball wie noch nie. Garantiert der lustigste Sport den ihr je erlebt habt. Inklusive Turnier-Modus mit Pokal für das Gewinnerteam.', ARRAY['Bubble Suits für alle','Spielfeld + Tore','Schiedsrichter','Turnier-Organisation','Siegerpokal + Urkunden'], ARRAY['Sportschuhe mitbringen','Bequeme Sportkleidung']);
  RAISE NOTICE '✅ 5/8 Bubble Soccer erstellt';

  -- 6) Axtwerfen (39€/Person)
  INSERT INTO public.marketplace_services (agency_id, slug, status, category, price_cents, price_type, min_participants, max_participants, duration_minutes, location_type, location_city, location_country, cancellation_policy, auto_confirm, advance_booking_days, is_featured, avg_rating, review_count, booking_count, gallery_urls, requires_deposit, deposit_percent)
  VALUES (v_agency_id, 'axtwerfen-freiburg-' || substr(md5(random()::text),1,4), 'approved', 'entertainment', 3900, 'per_person', 4, 16, 90, 'at_agency', 'Freiburg', 'DE', 'moderate', true, 2, false, 0, 0, 0, '{}', false, 0)
  RETURNING id INTO v_service_id;
  INSERT INTO public.marketplace_service_translations (service_id, locale, title, short_description, description, includes, requirements)
  VALUES (v_service_id, 'de', 'Axtwerfen Challenge Freiburg', 'Werft Äxte wie ein Wikinger — der neue Trend-Sport mit Turnier-Modus!', 'Axtwerfen ist der ultimative Adrenalinkick! In unserer Indoor-Arena lernt ihr die Technik und tretet dann im Turnier-Modus gegeneinander an. Inklusive Einweisung, Turnier und einem Getränk. Perfekt für JGA und Teamevents.', ARRAY['Professionelle Einweisung','Alle Äxte + Equipment','Turnier mit Rangliste','1 Getränk pro Person','Siegerurkunde'], ARRAY['Mindestalter 18 Jahre','Geschlossene Schuhe','Kein Alkohol vor dem Werfen']);
  RAISE NOTICE '✅ 6/8 Axtwerfen erstellt';

  -- 7) Outdoor Escape Game (29€/Person)
  INSERT INTO public.marketplace_services (agency_id, slug, status, category, price_cents, price_type, min_participants, max_participants, duration_minutes, location_type, location_city, location_country, cancellation_policy, auto_confirm, advance_booking_days, is_featured, avg_rating, review_count, booking_count, gallery_urls, requires_deposit, deposit_percent)
  VALUES (v_agency_id, 'escape-outdoor-freiburg-' || substr(md5(random()::text),1,4), 'approved', 'entertainment', 2900, 'per_person', 4, 30, 120, 'on_site', 'Freiburg', 'DE', 'flexible', true, 1, false, 0, 0, 0, '{}', false, 0)
  RETURNING id INTO v_service_id;
  INSERT INTO public.marketplace_service_translations (service_id, locale, title, short_description, description, includes, requirements)
  VALUES (v_service_id, 'de', 'Outdoor Escape Game Freiburg Altstadt', 'Löst Rätsel durch die Freiburger Altstadt — das Escape Room Erlebnis an der frischen Luft!', 'Freiburgs Altstadt wird zum riesigen Escape Room! In Teams löst ihr knifflige Rätsel, entschlüsselt Codes und entdeckt versteckte Hinweise an historischen Orten. Vom Münster über die Bächle bis zum Schwabentor — ein Abenteuer das Teamwork und Köpfchen erfordert.', ARRAY['Spiel-Equipment + App','Spielleiter per Funk','Alle Rätsel + Hinweise','Siegerehrung','Erinnerungsfoto'], ARRAY['Smartphone mitbringen','Bequeme Schuhe zum Laufen']);
  RAISE NOTICE '✅ 7/8 Escape Game erstellt';

  -- 8) Cocktail Masterclass (45€/Person)
  INSERT INTO public.marketplace_services (agency_id, slug, status, category, price_cents, price_type, min_participants, max_participants, duration_minutes, location_type, location_city, location_country, cancellation_policy, auto_confirm, advance_booking_days, is_featured, avg_rating, review_count, booking_count, gallery_urls, requires_deposit, deposit_percent)
  VALUES (v_agency_id, 'cocktail-masterclass-fr-' || substr(md5(random()::text),1,4), 'approved', 'workshop', 4500, 'per_person', 6, 20, 150, 'at_agency', 'Freiburg', 'DE', 'moderate', false, 3, false, 0, 0, 0, '{}', false, 0)
  RETURNING id INTO v_service_id;
  INSERT INTO public.marketplace_service_translations (service_id, locale, title, short_description, description, includes, requirements)
  VALUES (v_service_id, 'de', 'Cocktail Masterclass Freiburg', 'Mixt eure eigenen Signature Cocktails — mit professionellem Barkeeper!', 'Werdet zum Cocktail-Profi! In unserer Masterclass lernt ihr die Kunst des Mixens von einem erfahrenen Barkeeper. Von Klassikern bis zu euren eigenen Kreationen — inklusive 4 Cocktails, Rezeptkarten und jede Menge Spaß.', ARRAY['4 Cocktails pro Person','Alle Zutaten + Equipment','Professioneller Barkeeper','Rezeptkarten zum Mitnehmen','Snackplatte'], ARRAY['Mindestalter 18 Jahre']);
  RAISE NOTICE '✅ 8/8 Cocktail Masterclass erstellt';

  RAISE NOTICE '🎉 Fertig! 8 actionreiche Services für FAMBLISS in Freiburg erstellt.';
END $$;
