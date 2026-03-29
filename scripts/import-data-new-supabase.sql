-- ============================================
-- EventBliss Data Import Script
-- Generated: 2026-03-28
-- Source: Supabase export
-- ============================================

BEGIN;

-- ============================================
-- Step 0: Create auth.users entries first
-- These are needed for foreign key references
-- Password is temporary - users will need to reset
-- ============================================
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  ('8e9ede54-5841-4325-aa73-5f92b1da78a5', '00000000-0000-0000-0000-000000000000', 'rebecca_veser@hotmail.de', crypt('TempPassword123!', gen_salt('bf')), now(), '2025-12-29T14:54:45.583074+00:00', now(), 'authenticated', 'authenticated'),
  ('726e1709-9123-4d66-abbc-036fde273071', '00000000-0000-0000-0000-000000000000', 'tim@tom.de', crypt('TempPassword123!', gen_salt('bf')), now(), '2025-12-29T14:56:59.796+00:00', now(), 'authenticated', 'authenticated'),
  ('42c9b952-3990-4a14-a79b-6a2102c627ab', '00000000-0000-0000-0000-000000000000', 'info@myfamblissgroup.com', crypt('TempPassword123!', gen_salt('bf')), now(), '2026-01-02T08:50:44.495552+00:00', now(), 'authenticated', 'authenticated'),
  ('bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', '00000000-0000-0000-0000-000000000000', 'thomas.veser@kinderleicht-geniessen.de', crypt('TempPassword123!', gen_salt('bf')), now(), '2026-01-10T18:18:08.838327+00:00', now(), 'authenticated', 'authenticated'),
  ('aeec7eb2-cb02-4338-a2c0-82bb946900c6', '00000000-0000-0000-0000-000000000000', 'luca@madonia-freiburg.de', crypt('TempPassword123!', gen_salt('bf')), now(), '2025-12-29T13:45:00+00:00', now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create identities for each user (required for email login)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  ('8e9ede54-5841-4325-aa73-5f92b1da78a5', '8e9ede54-5841-4325-aa73-5f92b1da78a5', '8e9ede54-5841-4325-aa73-5f92b1da78a5', 'email', '{"sub":"8e9ede54-5841-4325-aa73-5f92b1da78a5","email":"rebecca_veser@hotmail.de"}'::jsonb, now(), now(), now()),
  ('726e1709-9123-4d66-abbc-036fde273071', '726e1709-9123-4d66-abbc-036fde273071', '726e1709-9123-4d66-abbc-036fde273071', 'email', '{"sub":"726e1709-9123-4d66-abbc-036fde273071","email":"tim@tom.de"}'::jsonb, now(), now(), now()),
  ('42c9b952-3990-4a14-a79b-6a2102c627ab', '42c9b952-3990-4a14-a79b-6a2102c627ab', '42c9b952-3990-4a14-a79b-6a2102c627ab', 'email', '{"sub":"42c9b952-3990-4a14-a79b-6a2102c627ab","email":"info@myfamblissgroup.com"}'::jsonb, now(), now(), now()),
  ('bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'email', '{"sub":"bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1","email":"thomas.veser@kinderleicht-geniessen.de"}'::jsonb, now(), now(), now()),
  ('aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'email', '{"sub":"aeec7eb2-cb02-4338-a2c0-82bb946900c6","email":"luca@madonia-freiburg.de"}'::jsonb, now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- settings (3 rows)
INSERT INTO public.settings (key, value) VALUES ('deadline', '{"iso":null}'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('locked_block', '{"block":null,"label":null}'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('form_locked', '{"enabled":false}'::jsonb) ON CONFLICT (key) DO NOTHING;

-- events (25 rows)
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('9ecaeb69-9b59-4f57-bac6-14dba36a9f51', 'Dominik Bachelor Party', 'dominik-bachelor-party-7wjd', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"date_blocks":{},"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"]}'::jsonb, 'Europe/Berlin', false, '2025-12-28T22:58:27.091761+00:00', NULL, NULL, 'bachelor'::event_type, '2025-12-28T22:58:27.091761+00:00', '2L67U5', NULL, 'Dominik', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('217ef8c4-ed71-49c5-b02f-efa12a590c07', 'Dominik  Epic Party', 'dominik-epic-party-mhk9', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"date_blocks":{},"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"]}'::jsonb, 'Europe/Berlin', false, '2025-12-28T23:13:31.380958+00:00', NULL, NULL, 'bachelor'::event_type, '2025-12-28T23:13:31.380958+00:00', 'ZBF6E9', NULL, 'Dominik', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('a28ae563-4096-42ef-9499-96e9523ee3a5', 'Neu', 'neu-vvob', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"date_blocks":{},"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"]}'::jsonb, 'Europe/Berlin', false, '2025-12-28T23:17:28.686107+00:00', NULL, '2025-12-30', 'bachelor'::event_type, '2025-12-28T23:17:28.686107+00:00', 'HXFM5V', NULL, 'Test', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('cb227db5-84cd-4dfa-9712-0c6ce26d695e', 'Dominik Bachelor Party', 'dominik-bachelor-party-ptak', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"template_id":"jga-classic","accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"80–150 €","value":"80-150"},{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400 €+","value":"400+"}],"travel_options":[{"label":"Tagestrip ohne Übernachtung","value":"daytrip"},{"label":"1 Nacht ist ok","value":"one_night"},{"label":"2 Nächte sind ok","value":"two_nights"},{"label":"Egal – flexibel","value":"either"}],"alcohol_options":[{"emoji":"🍻","label":"Mit Alkohol ok","value":"yes"},{"label":"Lieber alkoholfrei","value":"no"},{"label":"Egal","value":"either"}],"fitness_options":[{"emoji":"🛋️","label":"Entspannt","value":"chill"},{"emoji":"🚶","label":"Normal","value":"normal"},{"emoji":"💪","label":"Sportlich","value":"sporty"}],"activity_options":[{"emoji":"🏎️","label":"Karting","value":"karting","category":"action"},{"emoji":"🔐","label":"Escape Room","value":"escape_room","category":"action"},{"emoji":"🔫","label":"Lasertag","value":"lasertag","category":"action"},{"emoji":"🪓","label":"Axtwerfen","value":"axe_throwing","category":"action"},{"emoji":"🎮","label":"VR Arena / Sim-Racing","value":"vr_simracing","category":"action"},{"emoji":"🧗","label":"Klettern/Bouldern","value":"climbing","category":"outdoor"},{"emoji":"⚽","label":"Bubble Soccer","value":"bubble_soccer","category":"action"},{"emoji":"🏕️","label":"Outdoor Challenge","value":"outdoor","category":"outdoor"},{"emoji":"🧖","label":"Wellness / Sauna","value":"wellness","category":"chill"},{"emoji":"🍽️","label":"Food / Dinner Experience","value":"food","category":"food"},{"emoji":"🎯","label":"Gemischt – alles ein bisschen","value":"mixed","category":"other"}],"custom_questions":[],"duration_options":[{"label":"Tages-JGA (nur Samstag)","value":"day"},{"label":"Wochenende (2–3 Tage)","value":"weekend"},{"label":"Egal – beides ok","value":"either"}],"attendance_options":[{"emoji":"🎉","label":"Ja, bin dabei!","value":"yes"},{"label":"Vielleicht / unter Vorbehalt","value":"maybe"},{"emoji":"😔","label":"Leider nein","value":"no"}],"destination_options":[{"label":"Großstadt in Deutschland","value":"de_city"},{"emoji":"🇪🇸","label":"Barcelona","value":"barcelona"},{"emoji":"🇵🇹","label":"Lissabon","value":"lisbon"},{"emoji":"🇨🇿","label":"Prag","value":"prague"},{"emoji":"🇭🇺","label":"Budapest","value":"budapest"},{"label":"Egal – Hauptsache cool","value":"either"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-28T23:53:56.703459+00:00', NULL, NULL, 'bachelor'::event_type, '2025-12-29T00:05:13.530658+00:00', 'KARWPQ', NULL, 'Dominik', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('8230431a-939d-4bb2-ad8d-5602137483cf', 'Dominik JGA', 'dominik-jga-0gue', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'active'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"key_date":"2026-04-25","hero_title":"Domi‘s JGA","template_id":"jga-classic","accent_color":"#06B6D4","hero_subtitle":"","primary_color":"#8B5CF6","key_date_label":"Hochzeit","background_style":"gradient"},"date_blocks":{"A":"Fr. 27.02.–So. 01.03.2026","B":"Fr. 06.03.–So. 08.03.2026","C":"Fr. 03.04.–So. 05.04.2026","D":"Fr. 10.04.–So. 12.04.2026"},"form_locked":true,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"locked_block":"C","date_warnings":{},"budget_options":[{"label":"80–150 €","value":"80-150"},{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400 €+","value":"400+"}],"travel_options":[{"label":"Tagestrip ohne Übernachtung","value":"daytrip"},{"label":"1 Nacht ist ok","value":"one_night"},{"label":"2 Nächte sind ok","value":"two_nights"},{"label":"Egal – flexibel","value":"either"}],"alcohol_options":[{"emoji":"🍻","label":"Mit Alkohol ok","value":"yes"},{"label":"Lieber alkoholfrei","value":"no"},{"label":"Egal","value":"either"}],"fitness_options":[{"emoji":"🛋️","label":"Entspannt","value":"chill"},{"emoji":"🚶","label":"Normal","value":"normal"},{"emoji":"💪","label":"Sportlich","value":"sporty"}],"question_config":{"budget":{"enabled":true,"multiSelect":false},"travel":{"enabled":true,"multiSelect":true},"alcohol":{"enabled":true,"multiSelect":true},"fitness":{"enabled":true,"multiSelect":true},"duration":{"enabled":true,"multiSelect":true},"activities":{"enabled":true,"multiSelect":true},"attendance":{"enabled":true,"multiSelect":false},"date_blocks":{"enabled":true,"multiSelect":true},"destination":{"enabled":true,"multiSelect":true}},"activity_options":[{"emoji":"🏎️","label":"Karting","value":"karting","category":"action"},{"emoji":"🔐","label":"Escape Room","value":"escape_room","category":"action"},{"emoji":"🔫","label":"Lasertag","value":"lasertag","category":"action"},{"emoji":"🪓","label":"Axtwerfen","value":"axe_throwing","category":"action"},{"emoji":"🎮","label":"VR Arena / Sim-Racing","value":"vr_simracing","category":"action"},{"emoji":"🧗","label":"Klettern/Bouldern","value":"climbing","category":"outdoor"},{"emoji":"⚽","label":"Bubble Soccer","value":"bubble_soccer","category":"action"},{"emoji":"🏕️","label":"Outdoor Challenge","value":"outdoor","category":"outdoor"},{"emoji":"🧖","label":"Wellness / Sauna","value":"wellness","category":"chill"},{"emoji":"🍽️","label":"Food / Dinner Experience","value":"food","category":"food"},{"emoji":"🎯","label":"Gemischt – alles ein bisschen","value":"mixed","category":"other"},{"emoji":"🎯","label":"Paintball","value":"paintball","category":"action"},{"emoji":"🏍️","label":"Quad Tour","value":"quad_tour","category":"action"},{"emoji":"🥷","label":"Ninja Warrior Parcours","value":"ninja_warrior","category":"action"},{"emoji":"🦘","label":"Trampolin-Park","value":"trampoline_park","category":"action"},{"emoji":"🛴","label":"Segway Tour","value":"segway_tour","category":"action"},{"emoji":"🏄","label":"Wakeboarding","value":"wakeboarding","category":"action"},{"emoji":"🎯","label":"Schießstand","value":"shooting_range","category":"action"},{"emoji":"🏋️","label":"Crossfit Challenge","value":"crossfit_challenge","category":"action"},{"emoji":"🏐","label":"Beach Volleyball","value":"beach_volleyball","category":"outdoor"},{"emoji":"🌲","label":"Hochseilgarten","value":"high_ropes","category":"outdoor"},{"emoji":"🎢","label":"Zipline","value":"zipline","category":"outdoor"},{"emoji":"🥏","label":"Disc Golf","value":"disc_golf","category":"outdoor"},{"emoji":"🌳","label":"Baumklettern","value":"tree_climbing","category":"outdoor"},{"emoji":"♨️","label":"Thermalbad","value":"thermal_bath","category":"chill"},{"emoji":"🔥","label":"Sauna","value":"sauna","category":"chill"},{"emoji":"🍸","label":"Cocktail Kurs","value":"cocktail_course","category":"food"},{"emoji":"🍷","label":"Weinprobe","value":"wine_tasting","category":"food"},{"emoji":"🏭","label":"Brauereibesichtigung","value":"brewery_tour","category":"food"},{"emoji":"🎰","label":"Casino Abend","value":"casino","category":"other"},{"emoji":"🕵️","label":"Speakeasy Bar","value":"speakeasy","category":"other"},{"emoji":"🚗","label":"Autoscooter","value":"bumper_cars","category":"action"},{"emoji":"🥾","label":"Wandern","value":"hiking","category":"outdoor"},{"emoji":"🚵","label":"Mountainbike Tour","value":"mtb_tour","category":"outdoor"},{"emoji":"🔥","label":"Survival Training","value":"survival_training","category":"outdoor"},{"emoji":"🗺️","label":"Geocaching","value":"geocaching","category":"outdoor"},{"emoji":"🍤","label":"Tapas Tour","value":"tapas_tour","category":"food"},{"emoji":"🧠","label":"Quiz Night","value":"quiz_night","category":"other"},{"emoji":"🎳","label":"Bowling","value":"bowling","category":"other"},{"emoji":"⚽","label":"Fußball","value":"football","category":"action"},{"emoji":"🏸","label":"Badminton","value":"badminton","category":"action"},{"emoji":"🎾","label":"Squash","value":"squash","category":"action"},{"emoji":"🎾","label":"Tennis","value":"tennis","category":"action"},{"emoji":"🏓","label":"Tischtennis","value":"table_tennis","category":"action"},{"emoji":"🏐","label":"Volleyball","value":"volleyball","category":"action"},{"emoji":"🏀","label":"Basketball","value":"basketball","category":"action"},{"emoji":"🎾","label":"Padel","value":"padel","category":"action"},{"emoji":"🍺","label":"Pub Crawl","value":"pub_crawl","category":"other"},{"emoji":"🍹","label":"Cocktail Bar","value":"cocktail_bar","category":"other"},{"emoji":"🧗","label":"Klettersteig","value":"via_ferrata","category":"outdoor"},{"emoji":"🏰","label":"Historische Stätte","value":"historic_site","category":"other"},{"emoji":"🎨","label":"Street Art Tour","value":"street_art_tour","category":"other"}],"custom_questions":[{"id":"special_wishes_1766968433717","type":"textarea","label":"Gibt es etwas, das du uns noch mitteilen möchtest?","required":false,"placeholder":"Besondere Wünsche, Ideen, Anmerkungen..., Ideen für Ziele"}],"duration_options":[{"label":"Tages-JGA (nur Samstag)","value":"day"},{"label":"Wochenende (2–3 Tage)","value":"weekend"},{"label":"Egal – beides ok","value":"either"}],"attendance_options":[{"emoji":"🎉","label":"Ja, bin dabei!","value":"yes"},{"label":"Vielleicht / unter Vorbehalt","value":"maybe"},{"emoji":"😔","label":"Leider nein","value":"no"}],"destination_options":[{"label":"Großstadt in Deutschland","value":"de_city"},{"emoji":"🇪🇸","label":"Barcelona","value":"barcelona"},{"emoji":"🇵🇹","label":"Lissabon","value":"lisbon"},{"emoji":"🇭🇺","label":"Budapest","value":"budapest"},{"label":"Neapel","value":"neapel"},{"label":"Rom","value":"rom"},{"label":"Schottland","value":"schottland"},{"label":"London","value":"london"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-29T00:14:56.802215+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', NULL, 'bachelor'::event_type, '2026-03-28T06:17:44.105106+00:00', '63QNHP', NULL, 'Dominik', '2026-01-15T08:17:00+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('54fba1ca-a381-4aef-82f9-64f2637d1bc9', 'Geburstag Rebecca', 'geburstag-rebecca-jouv', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"80–150 €","value":"80-150"},{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400 €+","value":"400+"}],"travel_options":[{"label":"Tagestrip ohne Übernachtung","value":"daytrip"},{"label":"1 Nacht ist ok","value":"one_night"},{"label":"2 Nächte sind ok","value":"two_nights"},{"label":"Egal – flexibel","value":"either"}],"alcohol_options":[{"emoji":"🍻","label":"Mit Alkohol ok","value":"yes"},{"label":"Lieber alkoholfrei","value":"no"},{"label":"Egal","value":"either"}],"fitness_options":[{"emoji":"🛋️","label":"Entspannt","value":"chill"},{"emoji":"🚶","label":"Normal","value":"normal"},{"emoji":"💪","label":"Sportlich","value":"sporty"}],"activity_options":[{"emoji":"🏎️","label":"Karting","value":"karting","category":"action"},{"emoji":"🔐","label":"Escape Room","value":"escape_room","category":"action"},{"emoji":"🔫","label":"Lasertag","value":"lasertag","category":"action"},{"emoji":"🪓","label":"Axtwerfen","value":"axe_throwing","category":"action"},{"emoji":"🎮","label":"VR Arena / Sim-Racing","value":"vr_simracing","category":"action"},{"emoji":"🧗","label":"Kletterhalle / Bouldern","value":"climbing","category":"outdoor"},{"emoji":"⚽","label":"Bubble Soccer","value":"bubble_soccer","category":"action"},{"emoji":"🏕️","label":"Outdoor Challenge","value":"outdoor","category":"outdoor"},{"emoji":"🧖","label":"Wellness / Sauna","value":"wellness","category":"chill"},{"emoji":"🍽️","label":"Food / Dinner Experience","value":"food","category":"food"},{"emoji":"🎯","label":"Gemischt – alles ein bisschen","value":"mixed","category":"other"}],"duration_options":[{"label":"Tages-JGA (nur Samstag)","value":"day"},{"label":"Wochenende (2–3 Tage)","value":"weekend"},{"label":"Egal – beides ok","value":"either"}],"attendance_options":[{"emoji":"🎉","label":"Ja, bin dabei!","value":"yes"},{"label":"Vielleicht / unter Vorbehalt","value":"maybe"},{"emoji":"😔","label":"Leider nein","value":"no"}],"destination_options":[{"label":"Großstadt in Deutschland","value":"de_city"},{"emoji":"🇪🇸","label":"Barcelona","value":"barcelona"},{"emoji":"🇵🇹","label":"Lissabon","value":"lisbon"},{"emoji":"🇨🇿","label":"Prag","value":"prague"},{"emoji":"🇭🇺","label":"Budapest","value":"budapest"},{"label":"Egal – Hauptsache cool","value":"either"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-29T02:41:08.710789+00:00', NULL, '2025-12-29', 'birthday'::event_type, '2025-12-29T02:41:08.710789+00:00', '46QPW3', NULL, 'Rebecc', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('f6edfeb3-56d6-4d4b-a623-5b0684769e0d', 'Rebecca bday', 'rebecca-bday-dml4', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"template_id":"birthday-fun","accent_color":"#EAB308","primary_color":"#F97316","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"500","value":"500"},{"label":"1000","value":"1000"}],"travel_options":[{"label":"Tagestrip ohne Übernachtung","value":"daytrip"},{"label":"1 Nacht ist ok","value":"one_night"},{"label":"2 Nächte sind ok","value":"two_nights"},{"label":"Egal – flexibel","value":"either"}],"alcohol_options":[{"emoji":"🍻","label":"Mit Alkohol ok","value":"yes"},{"label":"Lieber alkoholfrei","value":"no"},{"label":"Egal","value":"either"}],"fitness_options":[{"emoji":"🛋️","label":"Entspannt","value":"chill"},{"emoji":"🚶","label":"Normal","value":"normal"},{"emoji":"💪","label":"Sportlich","value":"sporty"}],"question_config":{"budget":{"enabled":true,"multiSelect":false},"travel":{"enabled":true,"multiSelect":false},"alcohol":{"enabled":true,"multiSelect":false},"fitness":{"enabled":true,"multiSelect":false},"duration":{"enabled":true,"multiSelect":false},"activities":{"enabled":true,"multiSelect":true},"attendance":{"enabled":true,"multiSelect":false},"date_blocks":{"enabled":true,"multiSelect":true},"destination":{"enabled":true,"multiSelect":false}},"activity_options":[{"emoji":"🏎️","label":"Karting","value":"karting","category":"action"},{"emoji":"🔐","label":"Escape Room","value":"escape_room","category":"action"},{"emoji":"🔫","label":"Lasertag","value":"lasertag","category":"action"},{"emoji":"🪓","label":"Axtwerfen","value":"axe_throwing","category":"action"},{"emoji":"🎮","label":"VR Arena / Sim-Racing","value":"vr_simracing","category":"action"},{"emoji":"🧗","label":"Klettern/Bouldern","value":"climbing","category":"outdoor"},{"emoji":"⚽","label":"Bubble Soccer","value":"bubble_soccer","category":"action"},{"emoji":"🏕️","label":"Outdoor Challenge","value":"outdoor","category":"outdoor"},{"emoji":"🧖","label":"Wellness / Sauna","value":"wellness","category":"chill"},{"emoji":"🍽️","label":"Food / Dinner Experience","value":"food","category":"food"},{"emoji":"🎯","label":"Gemischt – alles ein bisschen","value":"mixed","category":"other"}],"custom_questions":[],"duration_options":[{"label":"Tages-JGA (nur Samstag)","value":"day"},{"label":"Wochenende (2–3 Tage)","value":"weekend"},{"label":"Egal – beides ok","value":"either"}],"attendance_options":[{"emoji":"🎉","label":"Ja, bin dabei!","value":"yes"},{"label":"Vielleicht / unter Vorbehalt","value":"maybe"},{"emoji":"😔","label":"Leider nein","value":"no"}],"destination_options":[{"label":"Großstadt in Deutschland","value":"de_city"},{"emoji":"🇪🇸","label":"Barcelona","value":"barcelona"},{"emoji":"🇵🇹","label":"Lissabon","value":"lisbon"},{"emoji":"🇨🇿","label":"Prag","value":"prague"},{"emoji":"🇭🇺","label":"Budapest","value":"budapest"},{"label":"Egal – Hauptsache cool","value":"either"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-29T15:59:23.537217+00:00', NULL, '2025-12-29', 'birthday'::event_type, '2025-12-29T16:00:43.138418+00:00', 'JVAUKY', NULL, 'Rebeccs', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('c19829a5-491c-400d-b61d-2569922b50ee', 'Feier 50 Jahre', 'feier-50-jahre-2pxl', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"template_id":"vegas-neon","accent_color":"#F0ABFC","primary_color":"#22C55E","background_style":"dark"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"80–150 €","value":"80-150"},{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400 €+","value":"400+"}],"travel_options":[{"label":"Tagestrip ohne Übernachtung","value":"daytrip"},{"label":"1 Nacht ist ok","value":"one_night"},{"label":"2 Nächte sind ok","value":"two_nights"},{"label":"Egal – flexibel","value":"either"}],"alcohol_options":[{"emoji":"🍻","label":"Mit Alkohol ok","value":"yes"},{"label":"Lieber alkoholfrei","value":"no"},{"label":"Egal","value":"either"}],"fitness_options":[{"emoji":"🛋️","label":"Entspannt","value":"chill"},{"emoji":"🚶","label":"Normal","value":"normal"},{"emoji":"💪","label":"Sportlich","value":"sporty"}],"question_config":{"budget":{"enabled":true,"multiSelect":false},"travel":{"enabled":true,"multiSelect":false},"alcohol":{"enabled":true,"multiSelect":false},"fitness":{"enabled":true,"multiSelect":false},"duration":{"enabled":true,"multiSelect":false},"activities":{"enabled":true,"multiSelect":true},"attendance":{"enabled":true,"multiSelect":false},"date_blocks":{"enabled":true,"multiSelect":true},"destination":{"enabled":true,"multiSelect":false}},"activity_options":[{"emoji":"🏎️","label":"Karting","value":"karting","category":"action"},{"emoji":"🔐","label":"Escape Room","value":"escape_room","category":"action"},{"emoji":"🔫","label":"Lasertag","value":"lasertag","category":"action"},{"emoji":"🪓","label":"Axtwerfen","value":"axe_throwing","category":"action"},{"emoji":"🎮","label":"VR Arena / Sim-Racing","value":"vr_simracing","category":"action"},{"emoji":"🧗","label":"Klettern/Bouldern","value":"climbing","category":"outdoor"},{"emoji":"⚽","label":"Bubble Soccer","value":"bubble_soccer","category":"action"},{"emoji":"🏕️","label":"Outdoor Challenge","value":"outdoor","category":"outdoor"},{"emoji":"🧖","label":"Wellness / Sauna","value":"wellness","category":"chill"},{"emoji":"🍽️","label":"Food / Dinner Experience","value":"food","category":"food"},{"emoji":"🎯","label":"Gemischt – alles ein bisschen","value":"mixed","category":"other"}],"custom_questions":[],"duration_options":[{"label":"Tages-JGA (nur Samstag)","value":"day"},{"label":"Wochenende (2–3 Tage)","value":"weekend"},{"label":"Egal – beides ok","value":"either"}],"attendance_options":[{"emoji":"🎉","label":"Ja, bin dabei!","value":"yes"},{"label":"Vielleicht / unter Vorbehalt","value":"maybe"},{"emoji":"😔","label":"Leider nein","value":"no"}],"destination_options":[{"label":"Großstadt in Deutschland","value":"de_city"},{"emoji":"🇪🇸","label":"Barcelona","value":"barcelona"},{"emoji":"🇵🇹","label":"Lissabon","value":"lisbon"},{"emoji":"🇨🇿","label":"Prag","value":"prague"},{"emoji":"🇭🇺","label":"Budapest","value":"budapest"},{"label":"Egal – Hauptsache cool","value":"either"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-29T16:29:41.726497+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '2025-12-29', 'other'::event_type, '2025-12-29T16:31:10.46324+00:00', 'FAHN2U', NULL, 'Jubiläum', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('10f78522-1a91-4f9b-8783-44ac72a5b82c', 'Test', 'test-1kbh', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"80–150 €","value":"80-150"},{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400 €+","value":"400+"}],"travel_options":[{"label":"Tagestrip ohne Übernachtung","value":"daytrip"},{"label":"1 Nacht ist ok","value":"one_night"},{"label":"2 Nächte sind ok","value":"two_nights"},{"label":"Egal – flexibel","value":"either"}],"alcohol_options":[{"emoji":"🍻","label":"Mit Alkohol ok","value":"yes"},{"label":"Lieber alkoholfrei","value":"no"},{"label":"Egal","value":"either"}],"fitness_options":[{"emoji":"🛋️","label":"Entspannt","value":"chill"},{"emoji":"🚶","label":"Normal","value":"normal"},{"emoji":"💪","label":"Sportlich","value":"sporty"}],"activity_options":[{"emoji":"🏎️","label":"Karting","value":"karting","category":"action"},{"emoji":"🔐","label":"Escape Room","value":"escape_room","category":"action"},{"emoji":"🔫","label":"Lasertag","value":"lasertag","category":"action"},{"emoji":"🪓","label":"Axtwerfen","value":"axe_throwing","category":"action"},{"emoji":"🎮","label":"VR Arena / Sim-Racing","value":"vr_simracing","category":"action"},{"emoji":"🧗","label":"Kletterhalle / Bouldern","value":"climbing","category":"outdoor"},{"emoji":"⚽","label":"Bubble Soccer","value":"bubble_soccer","category":"action"},{"emoji":"🏕️","label":"Outdoor Challenge","value":"outdoor","category":"outdoor"},{"emoji":"🧖","label":"Wellness / Sauna","value":"wellness","category":"chill"},{"emoji":"🍽️","label":"Food / Dinner Experience","value":"food","category":"food"},{"emoji":"🎯","label":"Gemischt – alles ein bisschen","value":"mixed","category":"other"}],"duration_options":[{"label":"Tages-JGA (nur Samstag)","value":"day"},{"label":"Wochenende (2–3 Tage)","value":"weekend"},{"label":"Egal – beides ok","value":"either"}],"attendance_options":[{"emoji":"🎉","label":"Ja, bin dabei!","value":"yes"},{"label":"Vielleicht / unter Vorbehalt","value":"maybe"},{"emoji":"😔","label":"Leider nein","value":"no"}],"destination_options":[{"label":"Großstadt in Deutschland","value":"de_city"},{"emoji":"🇪🇸","label":"Barcelona","value":"barcelona"},{"emoji":"🇵🇹","label":"Lissabon","value":"lisbon"},{"emoji":"🇨🇿","label":"Prag","value":"prague"},{"emoji":"🇭🇺","label":"Budapest","value":"budapest"},{"label":"Egal – Hauptsache cool","value":"either"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-29T17:01:03.470911+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '2025-12-29', 'trip'::event_type, '2025-12-29T17:01:03.470911+00:00', 'TLSG6D', NULL, 'Luca Madonia', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('4fd86091-9a8f-42ad-adf5-aa582e2c9294', 'Domi LGA', 'domi-lga-666t', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400–600 €","value":"400-600"},{"label":"600 €+","value":"600+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"🚣","label":"templates.activities.rafting","value":"rafting","category":"outdoor"},{"emoji":"🏞️","label":"templates.activities.canyoning","value":"canyoning","category":"outdoor"},{"emoji":"🧗","label":"templates.activities.climbing","value":"climbing","category":"outdoor"},{"emoji":"🥾","label":"templates.activities.hiking","value":"hiking","category":"outdoor"},{"emoji":"🚵","label":"templates.activities.mountainBiking","value":"mountain_biking","category":"outdoor"},{"emoji":"🏕️","label":"templates.activities.survivalTraining","value":"survival_training","category":"outdoor"},{"emoji":"🦘","label":"templates.activities.bungee","value":"bungee","category":"action"},{"emoji":"🪂","label":"templates.activities.paragliding","value":"paragliding","category":"action"},{"emoji":"🏍️","label":"templates.activities.quadTour","value":"quad_tour","category":"action"},{"emoji":"🏠","label":"templates.activities.cabinBbq","value":"cabin_bbq","category":"chill"}],"duration_options":[{"label":"templates.duration.weekend","value":"weekend"},{"label":"templates.duration.longWeekend","value":"long_weekend"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"⛰️","label":"templates.destinations.alps","value":"alps"},{"emoji":"🌊","label":"templates.destinations.seaCoast","value":"sea_coast"},{"emoji":"🌲","label":"templates.destinations.forestNature","value":"forest_nature"},{"emoji":"🏞️","label":"templates.destinations.lakeRegion","value":"lake_region"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-29T17:22:15.279016+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '2025-12-29', 'bachelor'::event_type, '2025-12-29T17:22:15.279016+00:00', '8SK3BK', NULL, 'Domi', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('b865a5b7-83e9-4e0d-bf37-b93c280fa344', 'Dominiks Legendärer JGA', 'dominiks-legend-rer-jga-7xcc', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"template_id":"jga-classic","accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{"A":"Fr. 03.04.–So. 05.04.2026","B":"Fr. 06.03.–So. 08.03.2026","C":"Fr. 10.04.–So. 12.04.2026"},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"80–150 €","value":"80-150"},{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400 €+","value":"400+"}],"travel_options":[{"label":"Tagestrip ohne Übernachtung","value":"daytrip"},{"label":"1 Nacht ist ok","value":"one_night"},{"label":"2 Nächte sind ok","value":"two_nights"},{"label":"Egal – flexibel","value":"either"}],"alcohol_options":[{"emoji":"🍻","label":"Mit Alkohol ok","value":"yes"},{"label":"Lieber alkoholfrei","value":"no"},{"label":"Egal","value":"either"}],"fitness_options":[{"emoji":"🛋️","label":"Entspannt","value":"chill"},{"emoji":"🚶","label":"Normal","value":"normal"},{"emoji":"💪","label":"Sportlich","value":"sporty"}],"question_config":{"budget":{"enabled":true,"multiSelect":true},"travel":{"enabled":true,"multiSelect":true},"alcohol":{"enabled":true,"multiSelect":false},"fitness":{"enabled":true,"multiSelect":true},"duration":{"enabled":true,"multiSelect":true},"activities":{"enabled":true,"multiSelect":true},"attendance":{"enabled":true,"multiSelect":false},"date_blocks":{"enabled":true,"multiSelect":true},"destination":{"enabled":true,"multiSelect":false}},"activity_options":[{"emoji":"🏎️","label":"Karting","value":"karting","category":"action"},{"emoji":"🔐","label":"Escape Room","value":"escape_room","category":"action"},{"emoji":"🔫","label":"Lasertag","value":"lasertag","category":"action"},{"emoji":"🎮","label":"VR Arena / Sim-Racing","value":"vr_simracing","category":"action"},{"emoji":"🧗","label":"Klettern/Bouldern","value":"climbing","category":"outdoor"},{"emoji":"⚽","label":"Bubble Soccer","value":"bubble_soccer","category":"action"},{"emoji":"🏕️","label":"Outdoor Challenge","value":"outdoor","category":"outdoor"},{"emoji":"🧖","label":"Wellness / Sauna","value":"wellness","category":"chill"},{"emoji":"🍽️","label":"Food / Dinner Experience","value":"food","category":"food"},{"emoji":"🎯","label":"Gemischt – alles ein bisschen","value":"mixed","category":"other"},{"emoji":"🎯","label":"Paintball","value":"paintball","category":"action"},{"emoji":"🥽","label":"VR Arena","value":"vr_arena","category":"action"},{"emoji":"🥷","label":"Ninja Warrior Parcours","value":"ninja_warrior","category":"action"},{"emoji":"🛴","label":"Segway Tour","value":"segway_tour","category":"action"},{"emoji":"🥾","label":"Wandern","value":"hiking","category":"outdoor"},{"emoji":"🏐","label":"Beach Volleyball","value":"beach_volleyball","category":"outdoor"},{"emoji":"🧖","label":"Wellness/Spa","value":"spa","category":"chill"},{"emoji":"🎳","label":"Bowling","value":"bowling","category":"other"},{"emoji":"🧠","label":"Quiz Night","value":"quiz_night","category":"other"},{"emoji":"🃏","label":"Poker Turnier","value":"poker_tournament","category":"other"},{"emoji":"🎰","label":"Casino Abend","value":"casino","category":"other"},{"emoji":"🪩","label":"Club/Disco","value":"club","category":"other"},{"emoji":"✨","label":"Fine Dining","value":"fine_dining","category":"food"},{"emoji":"🏭","label":"Brauereibesichtigung","value":"brewery_tour","category":"food"},{"emoji":"🍸","label":"Gin Tasting","value":"gin_tasting","category":"food"},{"emoji":"🥃","label":"Whisky Tasting","value":"whisky_tasting","category":"food"},{"emoji":"🍷","label":"Weinprobe","value":"wine_tasting","category":"food"},{"emoji":"🍸","label":"Cocktail Kurs","value":"cocktail_course","category":"food"},{"emoji":"🍤","label":"Tapas Tour","value":"tapas_tour","category":"food"},{"emoji":"🌮","label":"Street Food Tour","value":"street_food_tour","category":"food"},{"emoji":"🌅","label":"Sunset Cruise","value":"sunset_cruise","category":"chill"},{"emoji":"🎱","label":"Billard","value":"billiards","category":"other"},{"emoji":"🔍","label":"Murder Mystery Dinner","value":"murder_mystery","category":"other"},{"emoji":"🍻","label":"Bar Hopping","value":"bar_hopping","category":"other"},{"emoji":"🧗","label":"Klettersteig","value":"via_ferrata","category":"outdoor"},{"emoji":"🗺️","label":"Stadtführung","value":"city_tour","category":"other"},{"emoji":"🚵","label":"Mountainbike Tour","value":"mtb_tour","category":"outdoor"},{"emoji":"🎢","label":"Zipline","value":"zipline","category":"outdoor"},{"emoji":"🌲","label":"Hochseilgarten","value":"high_ropes","category":"outdoor"},{"emoji":"🍖","label":"BBQ Event","value":"bbq_event","category":"food"},{"emoji":"⚽","label":"Fußball","value":"football","category":"action"},{"emoji":"🎾","label":"Squash","value":"squash","category":"action"},{"emoji":"🏸","label":"Badminton","value":"badminton","category":"action"},{"emoji":"🏓","label":"Tischtennis","value":"table_tennis","category":"action"},{"emoji":"🏀","label":"Basketball","value":"basketball","category":"action"},{"emoji":"🏐","label":"Volleyball","value":"volleyball","category":"action"},{"emoji":"🎾","label":"Padel","value":"padel","category":"action"}],"custom_questions":[{"id":"special_wishes_1766999679067","type":"textarea","label":"Gibt es etwas, das du uns noch mitteilen möchtest?","required":false,"placeholder":"Besondere Wünsche, Ideen, Anmerkungen..."}],"duration_options":[{"label":"Tages-JGA (nur Samstag)","value":"day"},{"label":"Wochenende (2–3 Tage)","value":"weekend"},{"label":"Egal – beides ok","value":"either"}],"attendance_options":[{"emoji":"🎉","label":"Ja, bin dabei!","value":"yes"},{"label":"Vielleicht / unter Vorbehalt","value":"maybe"},{"emoji":"😔","label":"Leider nein","value":"no"}],"destination_options":[{"label":"Großstadt in Deutschland","value":"de_city"},{"emoji":"🇪🇸","label":"Barcelona","value":"barcelona"},{"emoji":"🇵🇹","label":"Lissabon","value":"lisbon"},{"emoji":"🇨🇿","label":"Prag","value":"prague"},{"emoji":"🇭🇺","label":"Budapest","value":"budapest"},{"label":"Egal – Hauptsache cool","value":"either"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-29T09:06:06.623985+00:00', NULL, '2026-04-25', 'bachelor'::event_type, '2025-12-29T09:16:46.133161+00:00', 'VXSUUA', NULL, 'Dominik', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('a7888282-cc6b-4e61-b85e-03516a25e853', 'Luca Madonia', 'luca-madonia-rhyc', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"200–400 €","value":"200-400"},{"label":"400–700 €","value":"400-700"},{"label":"700–1000 €","value":"700-1000"},{"label":"1000 €+","value":"1000+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"📸","label":"templates.activities.sightseeing","value":"sightseeing","category":"other"},{"emoji":"🌙","label":"templates.activities.nightlife","value":"nightlife","category":"action"},{"emoji":"🍕","label":"templates.activities.foodTour","value":"food_tour","category":"food"},{"emoji":"🥾","label":"templates.activities.hiking","value":"hiking","category":"outdoor"},{"emoji":"🏖️","label":"templates.activities.beach","value":"beach","category":"chill"},{"emoji":"🏄","label":"templates.activities.waterSports","value":"water_sports","category":"outdoor"},{"emoji":"🌍","label":"templates.activities.localExperiences","value":"local_experiences","category":"other"},{"emoji":"🎤","label":"templates.activities.concertsEvents","value":"concerts_events","category":"other"}],"duration_options":[{"label":"templates.duration.longWeekend","value":"long_weekend"},{"label":"templates.duration.week","value":"week"},{"label":"templates.duration.twoWeeks","value":"two_weeks"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"🏛️","label":"templates.destinations.cityEurope","value":"city_europe"},{"emoji":"🏖️","label":"templates.destinations.beachEurope","value":"beach_europe"},{"emoji":"🏔️","label":"templates.destinations.adventureEurope","value":"adventure_europe"},{"emoji":"🚗","label":"templates.destinations.roadTrip","value":"road_trip"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-29T17:53:45.923868+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '2025-12-29', 'trip'::event_type, '2025-12-29T17:53:45.923868+00:00', '2LCZDN', NULL, 'Luca Madonia', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('21ed18f7-35fa-4854-9c2d-934361e28bf4', 'Luca Madonia', 'luca-madonia-oohf', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400–600 €","value":"400-600"},{"label":"600 €+","value":"600+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"🚣","label":"templates.activities.rafting","value":"rafting","category":"outdoor"},{"emoji":"🏞️","label":"templates.activities.canyoning","value":"canyoning","category":"outdoor"},{"emoji":"🧗","label":"templates.activities.climbing","value":"climbing","category":"outdoor"},{"emoji":"🥾","label":"templates.activities.hiking","value":"hiking","category":"outdoor"},{"emoji":"🚵","label":"templates.activities.mountainBiking","value":"mountain_biking","category":"outdoor"},{"emoji":"🏕️","label":"templates.activities.survivalTraining","value":"survival_training","category":"outdoor"},{"emoji":"🦘","label":"templates.activities.bungee","value":"bungee","category":"action"},{"emoji":"🪂","label":"templates.activities.paragliding","value":"paragliding","category":"action"},{"emoji":"🏍️","label":"templates.activities.quadTour","value":"quad_tour","category":"action"},{"emoji":"🏠","label":"templates.activities.cabinBbq","value":"cabin_bbq","category":"chill"}],"duration_options":[{"label":"templates.duration.weekend","value":"weekend"},{"label":"templates.duration.longWeekend","value":"long_weekend"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"⛰️","label":"templates.destinations.alps","value":"alps"},{"emoji":"🌊","label":"templates.destinations.seaCoast","value":"sea_coast"},{"emoji":"🌲","label":"templates.destinations.forestNature","value":"forest_nature"},{"emoji":"🏞️","label":"templates.destinations.lakeRegion","value":"lake_region"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-30T12:45:07.254208+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '2025-12-30', 'bachelor'::event_type, '2025-12-30T12:45:07.254208+00:00', 'FCYBPH', NULL, 'Luca Madonia', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('cf14b759-e3bb-4d4a-9690-05847dbf3479', 'JGA Matthias', 'jga-matthias-bpxs', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"80–150 €","value":"80-150"},{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400 €+","value":"400+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"🏎️","label":"templates.activities.karting","value":"karting","category":"action"},{"emoji":"🔐","label":"templates.activities.escapeRoom","value":"escape_room","category":"action"},{"emoji":"🔫","label":"templates.activities.lasertag","value":"lasertag","category":"action"},{"emoji":"🪓","label":"templates.activities.axeThrowing","value":"axe_throwing","category":"action"},{"emoji":"🎮","label":"templates.activities.vrArena","value":"vr_arena","category":"action"},{"emoji":"🧗","label":"templates.activities.climbing","value":"climbing","category":"outdoor"},{"emoji":"⚽","label":"templates.activities.bubbleSoccer","value":"bubble_soccer","category":"action"},{"emoji":"🏕️","label":"templates.activities.outdoor","value":"outdoor","category":"outdoor"},{"emoji":"🧖","label":"templates.activities.spaWellness","value":"wellness","category":"chill"},{"emoji":"🍽️","label":"templates.activities.food","value":"food","category":"food"},{"emoji":"🎯","label":"templates.activities.mixed","value":"mixed","category":"other"}],"duration_options":[{"label":"templates.duration.dayTrip","value":"day"},{"label":"templates.duration.weekend","value":"weekend"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"label":"templates.destinations.deCity","value":"de_city"},{"emoji":"🇪🇸","label":"templates.destinations.barcelona","value":"barcelona"},{"emoji":"🇵🇹","label":"templates.destinations.lisbon","value":"lisbon"},{"emoji":"🇨🇿","label":"templates.destinations.prague","value":"prague"},{"emoji":"🇭🇺","label":"templates.destinations.budapest","value":"budapest"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2025-12-30T17:06:26.53827+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', NULL, 'bachelor'::event_type, '2025-12-30T17:06:26.53827+00:00', 'Z72W7F', NULL, 'Matthias', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('10aaeae8-c897-4b06-9799-bdd3b8ec3133', 'Trip', 'trip-jw11', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"200–400 €","value":"200-400"},{"label":"400–700 €","value":"400-700"},{"label":"700–1000 €","value":"700-1000"},{"label":"1000 €+","value":"1000+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"📸","label":"templates.activities.sightseeing","value":"sightseeing","category":"other"},{"emoji":"🌙","label":"templates.activities.nightlife","value":"nightlife","category":"action"},{"emoji":"🍕","label":"templates.activities.foodTour","value":"food_tour","category":"food"},{"emoji":"🥾","label":"templates.activities.hiking","value":"hiking","category":"outdoor"},{"emoji":"🏖️","label":"templates.activities.beach","value":"beach","category":"chill"},{"emoji":"🏄","label":"templates.activities.waterSports","value":"water_sports","category":"outdoor"},{"emoji":"🌍","label":"templates.activities.localExperiences","value":"local_experiences","category":"other"},{"emoji":"🎤","label":"templates.activities.concertsEvents","value":"concerts_events","category":"other"}],"duration_options":[{"label":"templates.duration.longWeekend","value":"long_weekend"},{"label":"templates.duration.week","value":"week"},{"label":"templates.duration.twoWeeks","value":"two_weeks"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"🏛️","label":"templates.destinations.cityEurope","value":"city_europe"},{"emoji":"🏖️","label":"templates.destinations.beachEurope","value":"beach_europe"},{"emoji":"🏔️","label":"templates.destinations.adventureEurope","value":"adventure_europe"},{"emoji":"🚗","label":"templates.destinations.roadTrip","value":"road_trip"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-01T11:53:23.071807+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', NULL, 'trip'::event_type, '2026-01-01T11:53:23.071807+00:00', '9W82W5', NULL, 'Pascal', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('cbd1a3db-4a8d-4ea0-9ff5-205007669975', 'Las Vegas Trip', 'las-vegas-trip-f9to', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"5.000€ - 10.000€","value":"5000-10000"},{"label":"10.000€ - 20.000€","value":"10000-20000"},{"label":"20.000€ - 30.000€","value":"20000-30000"},{"label":"30.000€ - 50.000€","value":"30000-50000"},{"label":"Über 50.000€","value":"50000_plus"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"question_config":{"budget":{"enabled":true,"multiSelect":false},"travel":{"enabled":true,"multiSelect":false},"alcohol":{"enabled":true,"multiSelect":false},"fitness":{"enabled":true,"multiSelect":false},"duration":{"enabled":true,"multiSelect":false},"activities":{"enabled":true,"multiSelect":true},"attendance":{"enabled":true,"multiSelect":false},"date_blocks":{"enabled":true,"multiSelect":true},"destination":{"enabled":true,"multiSelect":false}},"activity_options":[{"emoji":"🎭","label":"Cirque du Soleil Show besuchen","value":"cirque_du_soleil","category":"action"},{"emoji":"🍽️","label":"Feines Dinner in einem Starkoch-Restaurant","value":"gourmet_dining","category":"food"},{"emoji":"🚁","label":"Helikopterflug zum Grand Canyon","value":"helicopter_grand_canyon","category":"action"},{"emoji":"☀️","label":"Luxuriöse Pool Cabana im Resort","value":"luxury_pool_cabana","category":"chill"},{"emoji":"🛍️","label":"High-End-Shopping auf dem Strip","value":"shopping_high_end","category":"action"},{"emoji":"⛲","label":"Bellagio Fountains und Conservatory","value":"bellagio_fountains","category":"chill"},{"emoji":"💨","label":"Indoor Skydiving","value":"indoor_skydiving","category":"action"},{"emoji":"🦈","label":"Shark Reef Aquarium im Mandalay Bay","value":"aquarium_shark_reef","category":"chill"},{"emoji":"⛳","label":"Golf auf einem exklusiven Platz","value":"golf_exclusive_course","category":"outdoor"},{"emoji":"🥂","label":"VIP-Lounge/Club-Zugang (für Erwachsene)","value":"vip_club_access","category":"action"}],"custom_questions":[],"duration_options":[{"label":"3 Tage","value":"3_days"},{"label":"5 Tage","value":"5_days"},{"label":"7 Tage","value":"7_days"},{"label":"10 Tage","value":"10_days"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"✨","label":"Der Strip","value":"las_vegas_strip"},{"emoji":"🎰","label":"Downtown Las Vegas","value":"downtown_vegas"},{"emoji":"⛰️","label":"Red Rock Canyon (Tagesausflug)","value":"red_rock_canyon"},{"emoji":"🚤","label":"Lake Mead (Tagesausflug)","value":"lake_mead"},{"emoji":"🏞️","label":"Zion Nationalpark (Mehrtagesausflug)","value":"zion_national_park"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-02T08:53:29.197971+00:00', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, 'trip'::event_type, '2026-01-02T08:55:05.128587+00:00', '67QZLD', NULL, 'Luca Madonia', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('0851b13c-28e6-4c1a-9532-6bcb7fd11562', 'SKI Trip 2026', 'ski-trip-2026-k8rg', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"200–400 €","value":"200-400"},{"label":"400–700 €","value":"400-700"},{"label":"700–1000 €","value":"700-1000"},{"label":"1000 €+","value":"1000+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"📸","label":"templates.activities.sightseeing","value":"sightseeing","category":"other"},{"emoji":"🌙","label":"templates.activities.nightlife","value":"nightlife","category":"action"},{"emoji":"🍕","label":"templates.activities.foodTour","value":"food_tour","category":"food"},{"emoji":"🥾","label":"templates.activities.hiking","value":"hiking","category":"outdoor"},{"emoji":"🏖️","label":"templates.activities.beach","value":"beach","category":"chill"},{"emoji":"🏄","label":"templates.activities.waterSports","value":"water_sports","category":"outdoor"},{"emoji":"🌍","label":"templates.activities.localExperiences","value":"local_experiences","category":"other"},{"emoji":"🎤","label":"templates.activities.concertsEvents","value":"concerts_events","category":"other"}],"duration_options":[{"label":"templates.duration.longWeekend","value":"long_weekend"},{"label":"templates.duration.week","value":"week"},{"label":"templates.duration.twoWeeks","value":"two_weeks"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"🏛️","label":"templates.destinations.cityEurope","value":"city_europe"},{"emoji":"🏖️","label":"templates.destinations.beachEurope","value":"beach_europe"},{"emoji":"🏔️","label":"templates.destinations.adventureEurope","value":"adventure_europe"},{"emoji":"🚗","label":"templates.destinations.roadTrip","value":"road_trip"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-02T09:05:24.344717+00:00', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, 'trip'::event_type, '2026-01-02T09:05:24.344717+00:00', '2A35WJ', NULL, 'Luca ', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('d9cd9f83-7572-4e68-81f7-76f05a49483e', 'Rebeccas 33', 'rebeccas-33-jf15', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"50–100 €","value":"50-100"},{"label":"100–200 €","value":"100-200"},{"label":"200–400 €","value":"200-400"},{"label":"400 €+","value":"400+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"👨‍🍳","label":"templates.activities.cookingClass","value":"cooking_class","category":"food"},{"emoji":"🍷","label":"templates.activities.wineTasting","value":"wine_tasting","category":"food"},{"emoji":"💆","label":"templates.activities.spaDay","value":"spa_day","category":"chill"},{"emoji":"🎸","label":"templates.activities.concert","value":"concert","category":"other"},{"emoji":"🏟️","label":"templates.activities.sportsEvent","value":"sports_event","category":"other"},{"emoji":"🔐","label":"templates.activities.escapeRoom","value":"escape_room","category":"action"},{"emoji":"🎨","label":"templates.activities.artClass","value":"art_class","category":"chill"},{"emoji":"🎢","label":"templates.activities.adventurePark","value":"adventure_park","category":"action"}],"duration_options":[{"label":"templates.duration.halfDay","value":"half_day"},{"label":"templates.duration.fullDay","value":"day"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"📍","label":"templates.destinations.local","value":"local"},{"emoji":"🏙️","label":"templates.destinations.nearbyCity","value":"nearby_city"},{"emoji":"🌳","label":"templates.destinations.nature","value":"nature"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-02T13:18:14.502951+00:00', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, 'birthday'::event_type, '2026-01-02T13:18:14.502951+00:00', 'QVJLMT', NULL, 'Rebecca', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('3814b54a-3d64-4cac-9c8c-28948b9b7cfa', 'test', 'test-gvte', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"30–50 €","value":"30-50"},{"label":"50–100 €","value":"50-100"},{"label":"100–200 €","value":"100-200"},{"label":"200 €+","value":"200+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"🍽️","label":"templates.activities.dinnerParty","value":"dinner_party","category":"food"},{"emoji":"🎤","label":"templates.activities.karaoke","value":"karaoke","category":"action"},{"emoji":"🎳","label":"templates.activities.bowling","value":"bowling","category":"action"},{"emoji":"🔐","label":"templates.activities.escapeRoom","value":"escape_room","category":"action"},{"emoji":"🎲","label":"templates.activities.gamesNight","value":"games_night","category":"chill"},{"emoji":"🍸","label":"templates.activities.cocktailParty","value":"cocktail_party","category":"food"},{"emoji":"🕺","label":"templates.activities.dancing","value":"dancing","category":"action"},{"emoji":"🎵","label":"templates.activities.liveMusic","value":"live_music","category":"other"}],"duration_options":[{"label":"templates.duration.evening","value":"evening"},{"label":"templates.duration.fullDay","value":"day"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"📍","label":"templates.destinations.local","value":"local"},{"emoji":"🍽️","label":"templates.destinations.restaurant","value":"restaurant"},{"emoji":"🎪","label":"templates.destinations.eventLocation","value":"event_location"},{"emoji":"🌃","label":"templates.destinations.rooftopBar","value":"rooftop_bar"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-02T14:30:06.13484+00:00', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, 'birthday'::event_type, '2026-01-02T14:30:06.13484+00:00', 'NRYMSS', NULL, 'tes', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('aa0c2cab-bfa9-453e-be38-caa2227d579a', 'Luxury Trip', 'luxury-trip-zf92', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{"A":"Mi. 01.07.–Sa. 18.07.2026"},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"2.000€ - 3.000€","value":"2000_3000"},{"label":"3.000€ - 4.000€","value":"3000_4000"},{"label":"4.000€ - 5.000€","value":"4000_5000"},{"label":"5.000€+","value":"5000_plus"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"question_config":{"budget":{"enabled":true,"multiSelect":false},"travel":{"enabled":true,"multiSelect":false},"alcohol":{"enabled":true,"multiSelect":false},"fitness":{"enabled":true,"multiSelect":false},"duration":{"enabled":true,"multiSelect":false},"activities":{"enabled":true,"multiSelect":true},"attendance":{"enabled":true,"multiSelect":false},"date_blocks":{"enabled":true,"multiSelect":true},"destination":{"enabled":true,"multiSelect":false}},"activity_options":[{"emoji":"🌉","label":"Golden Gate Bridge besuchen 🌉","value":"golden_gate_bridge","category":"action"},{"emoji":"⛓️","label":"Alcatraz Tour machen ⛓️","value":"alcatraz_tour","category":"action"},{"emoji":"🌟","label":"Hollywood Walk of Fame 🌟","value":"hollywood_walk_fame","category":"chill"},{"emoji":"🔭","label":"Griffith Observatorium 🔭","value":"griffith_observatory","category":"chill"},{"emoji":"🎥","label":"Universal Studios besuchen 🎥","value":"universal_studios","category":"action"},{"emoji":"🏜️","label":"Grand Canyon Ausflug 🏜️","value":"grand_canyon_trip","category":"outdoor"},{"emoji":"⛲","label":"Bellagio Fountains Show ⛲","value":"bellagio_fountains","category":"chill"},{"emoji":"🎲","label":"Casinos in Las Vegas 🎲","value":"casinos_las_vegas","category":"action"},{"emoji":"☀️","label":"Strände Kaliforniens ☀️","value":"california_beaches","category":"chill"},{"emoji":"🍔","label":"Klassische Roadside Diner 🍔","value":"roadside_diners","category":"food"},{"emoji":"🍷","label":"Weinprobe (Napa Valley) 🍷","value":"wine_tasting_napa","category":"food"},{"emoji":"🌲","label":"Tagesausflug Yosemite 🌲","value":"yosemite_day_trip","category":"outdoor"}],"custom_questions":[],"duration_options":[{"label":"7 Tage","value":"7_days"},{"label":"10 Tage","value":"10_days"},{"label":"14 Tage","value":"14_days"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"🌉","label":"San Francisco 🌉","value":"san_francisco"},{"emoji":"🎬","label":"Los Angeles 🎬","value":"los_angeles"},{"emoji":"🎰","label":"Las Vegas 🎰","value":"las_vegas"},{"emoji":"🛣️","label":"Highway 1 Route 🛣️","value":"highway_1_route"},{"emoji":"🏞️","label":"Nationalparks 🏞️","value":"nationalparks"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-02T19:56:32.651+00:00', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, 'trip'::event_type, '2026-01-02T20:06:40.862192+00:00', 'F78ZNN', NULL, 'Luca Madonia', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('e264533d-7a89-478b-8c6f-94d524d7b277', 'Domis Winterland JGA', 'domis-winterland-jga-nwtu', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"template_id":"jga-classic","accent_color":"#7C3AED","primary_color":"#EF4444","background_style":"gradient"},"date_blocks":{"A":"Fr. 27.02.–So. 01.03.2026","B":"Fr. 27.03.–So. 29.03.2026"},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"200€ - 500€ pro Person","value":"200-500"},{"label":"500€ - 800€ pro Person","value":"500-800"},{"label":"800€ - 1200€ pro Person","value":"800-1200"},{"label":"Über 1200€ pro Person","value":"1200+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"question_config":{"budget":{"enabled":true,"multiSelect":false},"travel":{"enabled":true,"multiSelect":false},"alcohol":{"enabled":true,"multiSelect":false},"fitness":{"enabled":true,"multiSelect":false},"duration":{"enabled":true,"multiSelect":false},"activities":{"enabled":true,"multiSelect":true},"attendance":{"enabled":true,"multiSelect":false},"date_blocks":{"enabled":true,"multiSelect":true},"destination":{"enabled":true,"multiSelect":false}},"activity_options":[{"emoji":"🥾","label":"Extreme Schneeschuhwanderung","value":"snowshoe_hike_extreme","category":"outdoor"},{"emoji":"🧗","label":"Eisklettern","value":"ice_climbing","category":"action"},{"emoji":"K","label":"Rodelnachmittag/-abend mit Rennen","value":"sledding_races","category":"action"},{"emoji":"🌊","label":"Winter Canyoning (falls verfügbar)","value":"winter_canyoning","category":"action"},{"emoji":"🚲","label":"Fatbike-Tour im Schnee","value":"fat_bike","category":"action"},{"emoji":"🔥","label":"Winter-Survival-Kurs","value":"winter_survival","category":"other"},{"emoji":"🚨","label":"Lawinensuchkurs & Sicherheitstraining","value":"guided_avalanche_course","category":"action"},{"emoji":"🧊","label":"Iglu bauen & Übernachtung","value":"igloo_building","category":"outdoor"},{"emoji":"🍺","label":"Bierverkostung auf einer Hütte","value":"beer_tasting_huette","category":"food"},{"emoji":"🍽️","label":"Exklusives Hüttenabendessen","value":"gourmet_hut_dinner","category":"food"},{"emoji":"🧖","label":"Alpiner Spa & Wellness","value":"spa_wellness_mountain","category":"chill"},{"emoji":"🪓","label":"Axtwerfen","value":"axe_throwing","category":"action"}],"custom_questions":[{"id":"drivers_license_1767429278091","type":"toggle","label":"Hast du einen Führerschein und kannst fahren?","required":false},{"id":"special_wishes_1767429273622","type":"textarea","label":"Gibt es etwas, das du uns noch mitteilen möchtest?","required":false,"placeholder":"Besondere Wünsche, Ideen, Anmerkungen..."},{"id":"custom_1767429330561_1767429330561","type":"toggle","label":"","required":false,"placeholder":""},{"id":"custom_1767429319251_1767429319251","type":"toggle","label":"Kannst du ein Auto organisieren","required":false,"placeholder":""},{"id":"custom_1767429334702_1767429334702","type":"toggle","label":"Bist du schwanger","required":false,"placeholder":""}],"duration_options":[{"label":"2 Tage (Wochenende)","value":"2_days"},{"label":"3 Tage (langes Wochenende)","value":"3_days"},{"label":"4 Tage","value":"4_days"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"🏔️","label":"Tiroler Alpen","value":"tirol_alps"},{"emoji":"🏞️","label":"Salzburger Land","value":"salzburger_land"},{"emoji":"🌲","label":"Steirische Alpen","value":"styrian_alps"},{"emoji":"🇦🇹","label":"Vorarlberg","value":"vorarlberg"},{"emoji":"🌊","label":"Kärnten (mit Bergseen)","value":"carinthia"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-03T08:29:37.056205+00:00', '42c9b952-3990-4a14-a79b-6a2102c627ab', '2026-02-28', 'bachelor'::event_type, '2026-01-03T08:35:49.161117+00:00', 'HW2QGB', NULL, 'Dominic', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('1f727e74-03e4-4ee4-a629-cb3f43a35e2b', 'JGA winterwonderland', 'jga-winterwonderland-05nr', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["No strippers","No street selling / embarrassing tasks","No pub crawl / bar hopping"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Action, fun, activities","Shared experiences","Cool, not embarrassing","No one is forced to do anything"],"date_warnings":{},"budget_options":[{"label":"200€ - 400€","value":"200-400"},{"label":"400€ - 600€","value":"400-600"},{"label":"600€ - 800€","value":"600-800"},{"label":"800€+","value":"800+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"🥾","label":"Schneeschuhwandern","value":"snowshoe_hiking","category":"outdoor"},{"emoji":"🛷","label":"Rodeln","value":"sledding","category":"action"},{"emoji":"⛸️","label":"Eislaufen","value":"ice_skating","category":"action"},{"emoji":"🔦","label":"Fackelwanderung","value":"torch_hike","category":"outdoor"},{"emoji":"🧊","label":"Iglu bauen","value":"igloo_building","category":"action"},{"emoji":"🍖","label":"Wintergrillen","value":"winter_bbq","category":"food"},{"emoji":"🍻","label":"Brauereiführung","value":"brewery_tour","category":"food"},{"emoji":"🎶","label":"Hüttenabend","value":"cabin_party","category":"chill"},{"emoji":"🪓","label":"Axtwerfen","value":"axe_throwing","category":"action"},{"emoji":"🧖","label":"Wellness & Sauna","value":"wellness","category":"chill"},{"emoji":"🏍️","label":"Schneemobilfahren","value":"snowmobile_ride","category":"action"}],"duration_options":[{"label":"2 Nächte, 3 Tage","value":"2_night_3_day"},{"label":"3 Nächte, 4 Tage","value":"3_night_4_day"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"🏔️","label":"Alpen","value":"alpen"},{"emoji":"🌲","label":"Harz","value":"harz"},{"emoji":"🇩🇪","label":"Schwarzwald","value":"schwarzwald"},{"emoji":"🏞️","label":"Sächsische Schweiz","value":"sachsen-schweiz"},{"emoji":"🇦🇹","label":"Tirol","value":"tirol"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-03T09:07:12.928095+00:00', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, 'bachelor'::event_type, '2026-01-03T09:07:12.928095+00:00', 'F9UG5R', NULL, 'Domi ', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('daade170-c96a-4600-8346-55d43c0fdeab', 'JGA UTE', 'jga-ute-m3jv', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["Langeweile und eintönige Abende","Hotels fernab des Geschehens","Aktivitäten, die nur einer Person gefallen","Günstige Standard-Restaurantketten"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Maximale Party & Unterhaltung","Exklusive Erlebnisse, die man selten macht","Unvergessliche Abende auf dem Strip","Top-Casinos und Nachtleben","Hochwertige Verpflegung"],"date_warnings":{},"budget_options":[{"label":"Bis 10.000 €","value":"low"},{"label":"10.000 € - 15.000 €","value":"medium"},{"label":"15.000 € - 20.000 €","value":"high"},{"label":"Über 20.000 €","value":"premium"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"🃏","label":"Casino-Glücksspiel","value":"casino_gambling","category":"action"},{"emoji":"🌃","label":"Exklusive Nachtclub-Party","value":"nightclub_party","category":"action"},{"emoji":"☀️","label":"Pool-Party am Tag","value":"pool_party","category":"action"},{"emoji":"🍽️","label":"Exquisites Fine Dining","value":"fine_dining","category":"food"},{"emoji":"🎭","label":"Spektakuläre Show/Konzert","value":"show_concert","category":"chill"},{"emoji":"🥂","label":"Limousinen-Tour über den Strip","value":"limo_tour","category":"chill"},{"emoji":"🏞️","label":"Tagesausflug zum Grand Canyon","value":"grand_canyon_trip","category":"outdoor"},{"emoji":"🔫","label":"Schießstand-Erlebnis","value":"shooting_range","category":"action"},{"emoji":"💃","label":"Besuch eines Strip-Clubs","value":"striptease_club","category":"action"},{"emoji":"🧖","label":"Entspannender Spa-Besuch","value":"luxury_spa","category":"chill"}],"duration_options":[{"label":"3 Nächte","value":"3_nights"},{"label":"4 Nächte","value":"4_nights"},{"label":"5 Nächte","value":"5_nights"},{"label":"6 Nächte","value":"6_nights"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"🎰","label":"Las Vegas Strip","value":"las_vegas_the_strip"},{"emoji":"✨","label":"Downtown Las Vegas (Fremont Street)","value":"las_vegas_downtown"},{"emoji":"🏨","label":"Luxuriöses Resort außerhalb des Trubels","value":"las_vegas_luxury_resort"},{"emoji":"🏜️","label":"Las Vegas + Grand Canyon","value":"las_vegas_plus_grand_canyon"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-07T17:00:20.244099+00:00', '42c9b952-3990-4a14-a79b-6a2102c627ab', '2026-01-07', 'bachelor'::event_type, '2026-01-07T17:00:20.244099+00:00', '9F7MGL', NULL, 'UTE', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('8beda246-c847-4146-96aa-47e8464477b2', 'JGA Arthur', 'jga-arthur-nnlz', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":[],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":[],"date_warnings":{},"budget_options":[{"label":"150–250 €","value":"150-250"},{"label":"250–400 €","value":"250-400"},{"label":"400–600 €","value":"400-600"},{"label":"600 €+","value":"600+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"🚣","label":"templates.activities.rafting","value":"rafting","category":"outdoor"},{"emoji":"🏞️","label":"templates.activities.canyoning","value":"canyoning","category":"outdoor"},{"emoji":"🧗","label":"templates.activities.climbing","value":"climbing","category":"outdoor"},{"emoji":"🥾","label":"templates.activities.hiking","value":"hiking","category":"outdoor"},{"emoji":"🚵","label":"templates.activities.mountainBiking","value":"mountain_biking","category":"outdoor"},{"emoji":"🏕️","label":"templates.activities.survivalTraining","value":"survival_training","category":"outdoor"},{"emoji":"🦘","label":"templates.activities.bungee","value":"bungee","category":"action"},{"emoji":"🪂","label":"templates.activities.paragliding","value":"paragliding","category":"action"},{"emoji":"🏍️","label":"templates.activities.quadTour","value":"quad_tour","category":"action"},{"emoji":"🏠","label":"templates.activities.cabinBbq","value":"cabin_bbq","category":"chill"}],"duration_options":[{"label":"templates.duration.weekend","value":"weekend"},{"label":"templates.duration.longWeekend","value":"long_weekend"},{"label":"templates.duration.flexible","value":"flexible"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"⛰️","label":"templates.destinations.alps","value":"alps"},{"emoji":"🌊","label":"templates.destinations.seaCoast","value":"sea_coast"},{"emoji":"🌲","label":"templates.destinations.forestNature","value":"forest_nature"},{"emoji":"🏞️","label":"templates.destinations.lakeRegion","value":"lake_region"},{"label":"templates.destinations.flexible","value":"flexible"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-09T10:35:29.544958+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', NULL, 'bachelor'::event_type, '2026-01-09T10:35:29.544958+00:00', 'SPQUVU', NULL, 'Arthur', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.events (id, name, slug, theme, locale, status, currency, settings, timezone, is_public, created_at, created_by, event_date, event_type, updated_at, access_code, description, honoree_name, survey_deadline) VALUES ('a86d2ef2-a669-42f6-836b-befc9e7cb678', 'America Trip', 'america-trip-jq5s', '{"accent_color":"#06B6D4","primary_color":"#8B5CF6"}'::jsonb, 'de', 'planning'::event_status, 'EUR', '{"no_gos":["Reiseziele außerhalb der Westküste","Extrem budgetbeschränkte Aktivitäten","Übernachtungen in unattraktiven Unterkünften","Aktivitäten, die nur für Einzelpersonen gedacht sind"],"branding":{"accent_color":"#06B6D4","primary_color":"#8B5CF6","background_style":"gradient"},"date_blocks":{},"form_locked":false,"focus_points":["Einen unvergesslichen Westküsten-Trip erleben","Gemeinsame Erlebnisse für 6 Freunde","Gutes Budget-Management","Mix aus Sightseeing & Entspannung","Kulinarische Höhepunkte"],"date_warnings":{},"budget_options":[{"label":"15.000€ - 20.000€","value":"15000-20000"},{"label":"20.000€ - 25.000€","value":"20000-25000"},{"label":"25.000€ - 30.000€","value":"25000-30000"},{"label":"Über 30.000€","value":"30000+"}],"travel_options":[{"label":"templates.travel.daytrip","value":"daytrip"},{"label":"templates.travel.oneNight","value":"one_night"},{"label":"templates.travel.twoNights","value":"two_nights"},{"label":"templates.travel.flexible","value":"flexible"}],"alcohol_options":[{"emoji":"🍻","label":"templates.alcohol.yes","value":"yes"},{"label":"templates.alcohol.no","value":"no"},{"label":"templates.alcohol.flexible","value":"flexible"}],"fitness_options":[{"emoji":"🛋️","label":"templates.fitness.chill","value":"chill"},{"emoji":"🚶","label":"templates.fitness.normal","value":"normal"},{"emoji":"💪","label":"templates.fitness.sporty","value":"sporty"}],"activity_options":[{"emoji":"🎬","label":"Hollywood Tour & Sightseeing","value":"hollywood_sightseeing","category":"action"},{"emoji":"🏖️","label":"Strandtage & Entspannung","value":"beach_relax","category":"chill"},{"emoji":"⛰️","label":"Wandern im Nationalpark (z.B. Yosemite/Grand Canyon)","value":"national_park_hike","category":"outdoor"},{"emoji":"🍇","label":"Weinprobe im Napa Valley","value":"wine_tasting","category":"food"},{"emoji":"🍽️","label":"Exquisite Abendessen","value":"gourmet_dining","category":"food"},{"emoji":"🚠","label":"Cable Car Fahrt in San Francisco","value":"cable_car_sf","category":"action"},{"emoji":"🏄","label":"Surfkurse","value":"surf_lessons","category":"outdoor"},{"emoji":"🖼️","label":"Museumsbesuche (z.B. Getty Center)","value":"museum_visits","category":"chill"},{"emoji":"🎢","label":"Besuch eines Freizeitparks (z.B. Disneyland)","value":"theme_park","category":"action"},{"emoji":"🎶","label":"Live-Musik & Abendunterhaltung","value":"live_music_show","category":"other"}],"duration_options":[{"label":"7 Tage","value":"7_days"},{"label":"10 Tage","value":"10_days"},{"label":"14 Tage","value":"14_days"},{"label":"Länger als 14 Tage","value":"more_than_14_days"}],"attendance_options":[{"emoji":"🎉","label":"templates.attendance.yes","value":"yes"},{"label":"templates.attendance.maybe","value":"maybe"},{"emoji":"😔","label":"templates.attendance.no","value":"no"}],"destination_options":[{"emoji":"🌴","label":"Los Angeles","value":"los_angeles"},{"emoji":"🌉","label":"San Francisco","value":"san_francisco"},{"emoji":"☀️","label":"San Diego","value":"san_diego"},{"emoji":"🚗","label":"Pacific Coast Highway Roadtrip","value":"pacific_coast_highway"},{"emoji":"🎰","label":"Las Vegas (mit Westküsten-Anbindung)","value":"las_vegas_side_trip"}]}'::jsonb, 'Europe/Berlin', false, '2026-01-11T09:49:03.1495+00:00', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', NULL, 'trip'::event_type, '2026-01-11T09:49:03.1495+00:00', 'WLSQVC', NULL, 'Rebecca Madonia', NULL) ON CONFLICT (id) DO NOTHING;

-- profiles (5 rows)
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at, must_change_password) VALUES ('8e9ede54-5841-4325-aa73-5f92b1da78a5', 'rebecca_veser@hotmail.de', 'Rebecca Madonia', '2025-12-29T14:54:45.583074+00:00', '2025-12-29T14:54:45.726677+00:00', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at, must_change_password) VALUES ('726e1709-9123-4d66-abbc-036fde273071', 'tim@tom.de', NULL, '2025-12-29T14:56:59.796+00:00', '2025-12-29T14:56:59.796+00:00', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at, must_change_password) VALUES ('42c9b952-3990-4a14-a79b-6a2102c627ab', 'info@myfamblissgroup.com', 'Test', '2026-01-02T08:50:44.495552+00:00', '2026-01-02T08:51:28.876339+00:00', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at, must_change_password) VALUES ('bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'thomas.veser@kinderleicht-geniessen.de', NULL, '2026-01-10T18:18:08.838327+00:00', '2026-01-10T18:18:08.838327+00:00', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at, must_change_password) VALUES ('aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'luca@madonia-freiburg.de', 'Luca Madonia', '2026-03-27T06:05:22.791823+00:00', '2026-03-27T06:06:05.972422+00:00', false) ON CONFLICT (id) DO NOTHING;

-- user_roles (2 rows)
INSERT INTO public.user_roles (id, role, user_id, created_at) VALUES ('fca217d1-481a-4219-b5ce-4581b0e0b3cb', 'admin'::app_role, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '2025-12-29T13:53:45.43536+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_roles (id, role, user_id, created_at) VALUES ('22a3bce5-1552-438c-a6b6-b7e79842023f', 'admin'::app_role, '42c9b952-3990-4a14-a79b-6a2102c627ab', '2026-01-02T08:50:56.625211+00:00') ON CONFLICT (id) DO NOTHING;

-- plan_configs (5 rows) - delete existing from migrations first
DELETE FROM public.plan_configs;
INSERT INTO public.plan_configs (id, features, plan_key, is_active, created_at, sort_order, updated_at, price_cents, display_name, price_currency, stripe_price_id, billing_interval, ai_credits_monthly) VALUES ('2d3000b3-d7a5-4d1a-9c28-df783521279a', '["ai_assistant", "expense_tracking", "team_management"]'::jsonb, 'monthly', true, '2026-01-02T16:09:55.292271+00:00', 1, '2026-01-02T16:09:55.292271+00:00', 999, 'Monthly', 'EUR', NULL, 'month', 50) ON CONFLICT DO NOTHING;
INSERT INTO public.plan_configs (id, features, plan_key, is_active, created_at, sort_order, updated_at, price_cents, display_name, price_currency, stripe_price_id, billing_interval, ai_credits_monthly) VALUES ('2c84ec6b-6097-4605-8d08-9cbe45f42dbf', '["ai_assistant", "expense_tracking", "team_management", "priority_support"]'::jsonb, 'yearly', true, '2026-01-02T16:09:55.292271+00:00', 2, '2026-01-02T16:09:55.292271+00:00', 7999, 'Yearly', 'EUR', NULL, 'year', 100) ON CONFLICT DO NOTHING;
INSERT INTO public.plan_configs (id, features, plan_key, is_active, created_at, sort_order, updated_at, price_cents, display_name, price_currency, stripe_price_id, billing_interval, ai_credits_monthly) VALUES ('f54b3125-e920-4581-93e5-c524f66f68f8', '["ai_assistant", "expense_tracking", "team_management", "priority_support", "lifetime_updates"]'::jsonb, 'lifetime', true, '2026-01-02T16:09:55.292271+00:00', 3, '2026-01-02T16:19:20.37461+00:00', 1999, 'Lifetime', 'EUR', NULL, NULL, 35) ON CONFLICT DO NOTHING;
INSERT INTO public.plan_configs (id, features, plan_key, is_active, created_at, sort_order, updated_at, price_cents, display_name, price_currency, stripe_price_id, billing_interval, ai_credits_monthly) VALUES ('a0f40710-2c9d-4d78-899a-0a4c19266f00', '["basic_planning"]'::jsonb, 'free', true, '2026-01-02T16:09:55.292271+00:00', 0, '2026-01-05T18:31:20.928063+00:00', 0, 'Free', 'EUR', NULL, NULL, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.plan_configs (id, features, plan_key, is_active, created_at, sort_order, updated_at, price_cents, display_name, price_currency, stripe_price_id, billing_interval, ai_credits_monthly) VALUES ('81eef87d-3db9-43da-b4db-1bc37633ec48', '["ai_assistant", "expense_tracking", "team_management"]'::jsonb, 'premium', true, '2026-01-05T18:57:11.557499+00:00', 1, '2026-01-05T18:57:11.557499+00:00', 0, 'Premium', 'EUR', NULL, NULL, 50) ON CONFLICT DO NOTHING;

-- participants (137 rows)
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('148b1a6a-4af7-4608-b29c-00e0cc30b253', 'Luca', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, NULL, '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', NULL, NULL, '2025-12-28T22:58:27.236074+00:00', '2025-12-28T22:58:27.236074+00:00', NULL, 'e8a163f6-87ff-4477-b0b5-1d74dcb9729f', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('e685d479-61d1-4213-b95b-695ffb469e99', 'Luca Madonia', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', NULL, NULL, '2025-12-28T22:58:27.446777+00:00', '2025-12-28T22:58:27.446777+00:00', NULL, 'eb197adc-0298-4198-b0af-b13033d55fb8', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('9ed5ac99-7947-462a-8a2f-7064facacc00', 'TIm Struppi', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', NULL, NULL, '2025-12-28T22:58:27.446777+00:00', '2025-12-28T22:58:27.446777+00:00', NULL, 'a9fb40c5-3b59-4c39-a5c5-44b01cf81670', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('ff2825d3-a26f-4742-92a5-4ae79fee0476', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, NULL, '217ef8c4-ed71-49c5-b02f-efa12a590c07', NULL, NULL, '2025-12-28T23:13:31.603264+00:00', '2025-12-28T23:13:31.603264+00:00', NULL, '2be4d17f-ef53-463a-846c-d5f1cb331866', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('45162fe1-c98b-409c-9bb3-67974c99060e', 'Test', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '217ef8c4-ed71-49c5-b02f-efa12a590c07', NULL, NULL, '2025-12-28T23:13:31.672591+00:00', '2025-12-28T23:13:31.672591+00:00', NULL, '4f431382-5792-4d39-88ad-3c89998dfb38', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('c30fd740-ab21-424b-97fb-fcb79fd84e5b', 'Test 2', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '217ef8c4-ed71-49c5-b02f-efa12a590c07', NULL, NULL, '2025-12-28T23:13:31.672591+00:00', '2025-12-28T23:13:31.672591+00:00', NULL, '3702a6b4-f70b-4c48-9137-05bc15aef0e8', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('9a648252-1a37-4ade-b082-b3a9daf4118a', 'Test 3', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '217ef8c4-ed71-49c5-b02f-efa12a590c07', NULL, NULL, '2025-12-28T23:13:31.672591+00:00', '2025-12-28T23:13:31.672591+00:00', NULL, '2190ca64-0f7f-4b0d-8cc4-974208d42bb8', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('18570798-d7b6-4676-8f44-0729033868c3', 'Test 4', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '217ef8c4-ed71-49c5-b02f-efa12a590c07', NULL, NULL, '2025-12-28T23:13:31.672591+00:00', '2025-12-28T23:13:31.672591+00:00', NULL, '6398edd0-7073-45a5-86ef-d20eb08dcaeb', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('8ac8db3f-0153-4e2d-a503-ce58dacacac8', 'Test 5', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '217ef8c4-ed71-49c5-b02f-efa12a590c07', NULL, NULL, '2025-12-28T23:13:31.672591+00:00', '2025-12-28T23:13:31.672591+00:00', NULL, 'b16f27a4-6504-4719-bd8e-e19475c29746', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('5b0dbe4f-538b-4bee-9b18-ba1aa3282b72', 'Test', 'organizer'::participant_role, 'test@test.de', NULL, 'confirmed'::participant_status, NULL, 'a28ae563-4096-42ef-9499-96e9523ee3a5', NULL, NULL, '2025-12-28T23:17:28.74811+00:00', '2025-12-28T23:17:28.74811+00:00', NULL, '6315278e-b6a8-4541-a31b-be3812888124', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('d61a006c-6c0a-4002-be1f-6ec2e84cee9f', 'test', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a28ae563-4096-42ef-9499-96e9523ee3a5', NULL, NULL, '2025-12-28T23:17:28.808729+00:00', '2025-12-28T23:17:28.808729+00:00', NULL, 'a6c9ebef-1101-4b65-aebc-3722629d4692', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('aba5beb8-3ac5-4c93-b8c3-8d6f10110717', 'trrterrt', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a28ae563-4096-42ef-9499-96e9523ee3a5', NULL, NULL, '2025-12-28T23:17:28.808729+00:00', '2025-12-28T23:17:28.808729+00:00', NULL, '51adc68f-b5ca-485d-af1c-ca49b213c77a', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('098bbf50-d788-4524-9bbd-1d6bd122de62', 'rterrter', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a28ae563-4096-42ef-9499-96e9523ee3a5', NULL, NULL, '2025-12-28T23:17:28.808729+00:00', '2025-12-28T23:17:28.808729+00:00', NULL, '7bc2d1c5-aeca-458f-b8e0-a2081a995a6f', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('99fcf3d4-8c97-457b-8ff0-8df12895a7dd', 'rterrterrt', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a28ae563-4096-42ef-9499-96e9523ee3a5', NULL, NULL, '2025-12-28T23:17:28.808729+00:00', '2025-12-28T23:17:28.808729+00:00', NULL, 'e9bb9615-b686-4801-82f5-055017ca74bf', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('e1a148f2-84f2-44f1-a1a3-5c47923dfa0a', 'Luca madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, NULL, 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', NULL, NULL, '2025-12-28T23:53:56.784547+00:00', '2025-12-28T23:53:56.784547+00:00', NULL, 'dffdc271-b5b4-4275-ad86-698ce24a78e4', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('a3c05b90-d210-4a35-a671-62caeb06e641', 'DOminic', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', NULL, NULL, '2025-12-28T23:53:56.847393+00:00', '2025-12-28T23:53:56.847393+00:00', NULL, 'a133f050-c1f6-4511-be94-0dae0749bb63', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('bda71915-1b3c-4b9a-851c-9c04af46d2d9', 'Max', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', NULL, NULL, '2025-12-28T23:53:56.847393+00:00', '2025-12-28T23:53:56.847393+00:00', NULL, '68b6b614-9879-4d03-a9c4-c5a58087044b', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('d2c97352-fb81-4d95-ac37-e9c8c3214354', 'Marco', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', NULL, NULL, '2025-12-28T23:53:56.847393+00:00', '2025-12-28T23:53:56.847393+00:00', NULL, '3fd94edf-7242-4079-8484-887cafcb05cf', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('36b13ef0-b7a2-48b0-8958-382b0bdd8e9a', 'Marcos', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', NULL, NULL, '2025-12-28T23:53:56.847393+00:00', '2025-12-28T23:53:56.847393+00:00', NULL, '57d5cf9b-c76c-4e90-a4b1-203b5de0cc02', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('5b0fe431-c80d-48e8-8a64-4fb14dc516c9', 'Marcus', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', NULL, NULL, '2025-12-28T23:53:56.847393+00:00', '2025-12-28T23:53:56.847393+00:00', NULL, '0166cd0d-8528-47d4-a2bf-141712262703', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('c59985b5-eb67-44ad-bdba-9096aa145620', 'Luca', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, NULL, '54fba1ca-a381-4aef-82f9-64f2637d1bc9', NULL, NULL, '2025-12-29T02:41:08.787726+00:00', '2025-12-29T02:41:08.787726+00:00', NULL, 'c8d312bd-86d1-4375-8567-81ac35dfc77e', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('6a735b77-17ce-4f08-9648-64d5540c295e', 'Tim', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '54fba1ca-a381-4aef-82f9-64f2637d1bc9', NULL, NULL, '2025-12-29T02:41:08.858278+00:00', '2025-12-29T02:41:08.858278+00:00', NULL, '0370a1ad-c629-460a-bb4f-3cf128110441', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('7a3fa6ff-adb5-4677-a58b-b516d5e066bf', 'Tom', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '54fba1ca-a381-4aef-82f9-64f2637d1bc9', NULL, NULL, '2025-12-29T02:41:08.858278+00:00', '2025-12-29T02:41:08.858278+00:00', NULL, '8d912eb9-638e-4ba5-a038-26e4252e72d8', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('f0de4e61-320b-45af-bdb8-a498be1e14b2', 'Thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '54fba1ca-a381-4aef-82f9-64f2637d1bc9', NULL, NULL, '2025-12-29T02:41:08.858278+00:00', '2025-12-29T02:41:08.858278+00:00', NULL, '27163ac3-a480-4c45-b207-a14d1d71bff1', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('1a53c97b-0239-46dc-a937-d04c49067a5a', 'Marina', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '54fba1ca-a381-4aef-82f9-64f2637d1bc9', NULL, NULL, '2025-12-29T02:41:08.858278+00:00', '2025-12-29T02:41:08.858278+00:00', NULL, 'ad499296-64fc-4188-a92d-9c6d4471b7b0', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('25ea54c5-76e4-4b77-b565-4f5c89b916c3', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, NULL, 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', NULL, NULL, '2025-12-29T09:06:06.732398+00:00', '2025-12-29T09:06:06.732398+00:00', NULL, '39d70f28-d52f-4059-9d61-2961fd7086af', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('52539684-272e-414a-8c58-6e7c6c2a5858', 'Erwin Huhn', 'guest'::participant_role, NULL, NULL, 'confirmed'::participant_status, NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', NULL, NULL, '2025-12-29T00:14:56.952451+00:00', '2026-01-01T08:24:44.540357+00:00', '9101f659-8be2-419b-aa36-7a0a6b8e76ea', '73bd0bb3-c50d-4694-958d-ab0473a1f55b', '2025-12-29T05:12:42.319+00:00', NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('446f5d9b-e10d-44dd-92dd-fba4b504999f', 'Mario Buchfelner', 'guest'::participant_role, NULL, NULL, 'confirmed'::participant_status, NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', NULL, NULL, '2025-12-29T00:14:56.952451+00:00', '2026-03-28T06:17:18.734062+00:00', '93c5ac6b-7884-47b2-bc6a-6299053d4f26', 'a319af03-edbe-4916-ba00-61716f1637dd', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('fecea80c-5f03-4fb4-886f-e135059a4b8e', 'Daniel Streng', 'guest'::participant_role, NULL, NULL, 'confirmed'::participant_status, NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', NULL, NULL, '2025-12-29T00:14:56.952451+00:00', '2026-03-28T06:17:25.941171+00:00', 'eea02e4f-fb02-4584-8ccb-53cd86eef36d', 'ca92e31e-271e-442d-b7c5-5af5e4cf8a44', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('e82fe03e-5a5e-4b07-9ee6-023e4b79da08', 'Adrian Bayerlein', 'guest'::participant_role, NULL, NULL, 'maybe'::participant_status, NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', NULL, NULL, '2025-12-29T00:14:56.952451+00:00', '2026-03-28T06:25:41.173043+00:00', '557e4267-776d-4050-ad50-91083e6ad0bf', '4a14567f-cc61-4afe-b9f5-f9ad6d618acd', '2026-03-28T06:25:41.089+00:00', NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5', 'Marcus', 'guest'::participant_role, NULL, NULL, 'confirmed'::participant_status, NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', NULL, NULL, '2025-12-29T00:14:56.952451+00:00', '2026-03-28T06:17:14.196953+00:00', '413e5920-991d-4e48-a14b-e7fa4febb6bf', '2645bec4-ed76-4477-9166-c057e8895ae7', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('95dc74e9-c1d9-45df-98e6-727375680e7d', 'Marc Dirnberger', 'guest'::participant_role, NULL, NULL, 'confirmed'::participant_status, NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', NULL, NULL, '2025-12-29T00:14:56.952451+00:00', '2026-03-28T06:17:09.577568+00:00', 'fa9ab1fe-db5d-4995-80bf-c4b32811ef79', '95d14511-7a4d-4e4b-a65c-70e5750a106e', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('7777744c-3061-4bf7-a462-607578ac15a5', 'Daniel Streng', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', NULL, NULL, '2025-12-29T09:06:06.8062+00:00', '2025-12-29T09:06:06.8062+00:00', NULL, 'fe868f96-f8b8-4aaa-a90b-1df76cca095d', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('7a33cca0-1fa4-44ec-ae63-bbfda8c0c86d', 'Erwin Huhn', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', NULL, NULL, '2025-12-29T09:06:06.8062+00:00', '2025-12-29T09:06:06.8062+00:00', NULL, 'b045ab28-5d4a-42b1-bd77-c49728adf839', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('6257dafe-a83c-4ae2-b756-c01ec8ae0c11', 'Marc Ehrlich', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', NULL, NULL, '2025-12-29T09:06:06.8062+00:00', '2025-12-29T09:06:06.8062+00:00', NULL, '4deb6141-4280-4f8c-be23-c7a9f06d23a2', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('7e49e580-21ad-4f54-afbc-063b94fa99c5', 'Marc Dirnberger', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', NULL, NULL, '2025-12-29T09:06:06.8062+00:00', '2025-12-29T09:06:06.8062+00:00', NULL, '9527be85-7960-4d56-83c1-aa3361e5d769', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('5b605e10-6126-4ae8-8c68-4724f88555b5', 'Marcus', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', NULL, NULL, '2025-12-29T09:06:06.8062+00:00', '2025-12-29T09:06:06.8062+00:00', NULL, '66eccf9c-9df7-46a2-bceb-270348fbc9cd', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('cb0c026a-3d7f-4b0f-9066-2c2f55894c5c', 'Mario Buchfelner', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', NULL, NULL, '2025-12-29T09:06:06.8062+00:00', '2025-12-29T09:06:06.8062+00:00', NULL, '76cc4a09-4108-48ac-aefb-34080fae99ca', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('8376f81d-4f67-4f9d-af1d-742f15d02067', 'Adrian Bayerlein', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', NULL, NULL, '2025-12-29T09:06:06.8062+00:00', '2025-12-29T09:06:06.8062+00:00', NULL, '411f59cc-d429-44fb-a418-baab1de6ad22', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('fdf6b82d-8501-4197-b47f-83ab5809872b', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', NULL, NULL, '2025-12-29T00:14:56.878734+00:00', '2025-12-29T10:52:48.005653+00:00', '7368aee8-c8f9-449a-b42b-371950cab2d8', 'db8f4e59-27c5-4bcd-8cd9-a4fe755ac98f', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('3fcd23e3-5355-4432-a44a-79dcb26c4621', 'Rebecca', 'organizer'::participant_role, 'rebecca_veser@hotmail.de', NULL, 'confirmed'::participant_status, NULL, 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', NULL, NULL, '2025-12-29T15:59:23.681093+00:00', '2025-12-29T15:59:23.681093+00:00', NULL, 'ba20c884-6fe3-49b1-ad76-fa3aa6eb0f52', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('da178447-51f4-4f08-8924-8d905b5f6a31', 'Luca', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', NULL, NULL, '2025-12-29T15:59:23.794067+00:00', '2025-12-29T15:59:23.794067+00:00', NULL, '309937cd-712d-40fe-8f39-0136ad60eb18', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('f9ec6e68-f82e-4aa0-8dbf-e33ee38ee574', 'Thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', NULL, NULL, '2025-12-29T15:59:23.794067+00:00', '2025-12-29T15:59:23.794067+00:00', NULL, 'c2b90603-6ce5-4db0-b7e1-8c33e0dd3cb2', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('aee48bd4-cfdd-4742-bf1b-b95bbd911dcf', 'Marina', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', NULL, NULL, '2025-12-29T15:59:23.794067+00:00', '2025-12-29T15:59:23.794067+00:00', NULL, '42c2d85d-cc61-4e57-9261-e9f2d3adf640', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('918c9b4d-fb01-4a03-b2e4-b101f5bda55e', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'c19829a5-491c-400d-b61d-2569922b50ee', NULL, NULL, '2025-12-29T16:29:41.833757+00:00', '2025-12-29T16:29:41.833757+00:00', NULL, '3414ae48-d476-4f1c-9701-4511a698ebca', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('60a2194f-6481-4a51-8197-8cc22cc5d8e2', 'Matthias', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'c19829a5-491c-400d-b61d-2569922b50ee', NULL, NULL, '2025-12-29T16:29:41.942817+00:00', '2025-12-29T16:29:41.942817+00:00', NULL, '8d22c5e5-4593-4180-8fb5-879b1ecb339d', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('96fab895-4d0a-4700-af36-08f6100325d0', 'Nadine', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'c19829a5-491c-400d-b61d-2569922b50ee', NULL, NULL, '2025-12-29T16:29:41.942817+00:00', '2025-12-29T16:29:41.942817+00:00', NULL, '8463984c-aa8b-403e-8570-9a2bd059fdf9', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('0a61e692-b54b-44ac-af63-c5f30fa80daf', 'Rebecca', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'c19829a5-491c-400d-b61d-2569922b50ee', NULL, NULL, '2025-12-29T16:29:41.942817+00:00', '2025-12-29T16:29:41.942817+00:00', NULL, '989e2fbc-90da-49a0-b871-e7bd34c39756', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('cc75de90-7cfd-45bd-ab3d-b7950431438a', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '10f78522-1a91-4f9b-8783-44ac72a5b82c', NULL, NULL, '2025-12-29T17:01:03.760647+00:00', '2025-12-29T17:01:03.760647+00:00', NULL, 'd81f9fb8-ab32-4fb9-89d3-5dd09744496e', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('e8297643-4527-4f6a-85f3-82506fdeda01', 'Luca Madonia', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10f78522-1a91-4f9b-8783-44ac72a5b82c', NULL, NULL, '2025-12-29T17:01:03.902908+00:00', '2025-12-29T17:01:03.902908+00:00', NULL, 'fab9eae2-293a-4dc7-b9ea-4413364b6539', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('5274d883-0869-4f49-97df-eb39a5b668e0', 'Rebecca', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10f78522-1a91-4f9b-8783-44ac72a5b82c', NULL, NULL, '2025-12-29T17:01:03.902908+00:00', '2025-12-29T17:01:03.902908+00:00', NULL, '8c5836fd-af3a-422f-abf8-c08561c38700', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('6f1c1508-5c7c-4d1e-a093-275ea8b6022d', 'Marinaden', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10f78522-1a91-4f9b-8783-44ac72a5b82c', NULL, NULL, '2025-12-29T17:01:03.902908+00:00', '2025-12-29T17:01:03.902908+00:00', NULL, '16539a32-4720-4056-be19-06ffcd0832d7', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('ee5d4af4-1199-4649-865a-5fb9e49cb34a', 'Max', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10f78522-1a91-4f9b-8783-44ac72a5b82c', NULL, NULL, '2025-12-29T17:01:03.902908+00:00', '2025-12-29T17:01:03.902908+00:00', NULL, 'e1626341-042e-412a-81e6-a97f1af8e94f', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('6fc1be5d-2bbe-408e-ad99-c211c8b2e881', 'Thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10f78522-1a91-4f9b-8783-44ac72a5b82c', NULL, NULL, '2025-12-29T17:01:03.902908+00:00', '2025-12-29T17:01:03.902908+00:00', NULL, '0136ccdd-5322-429f-a6f0-8ee45e5f419a', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('016ff0c3-fd7d-46fe-ae4a-d3cbd96c0eb4', 'Peter', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10f78522-1a91-4f9b-8783-44ac72a5b82c', NULL, NULL, '2025-12-29T17:01:03.902908+00:00', '2025-12-29T17:01:03.902908+00:00', NULL, '1048093a-d15f-40ad-8426-7c2440bfa578', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('f1e9f87a-d180-4bba-a147-93dc1d94a170', 'Luca Madonia', 'organizer'::participant_role, 'Luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '4fd86091-9a8f-42ad-adf5-aa582e2c9294', NULL, NULL, '2025-12-29T17:22:15.393469+00:00', '2025-12-29T17:22:15.393469+00:00', NULL, '9cfd362f-540e-47ab-8d4e-8ab3fd9e71f5', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('2bb6717d-bab1-4252-bd24-ba0828b718ac', 'Tim', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '4fd86091-9a8f-42ad-adf5-aa582e2c9294', NULL, NULL, '2025-12-29T17:22:15.480528+00:00', '2025-12-29T17:22:15.480528+00:00', NULL, '380f44d3-0381-47d9-84ed-287295737b86', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('88116e75-e4ec-48e1-a457-ebe9369c86f8', 'Tom', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '4fd86091-9a8f-42ad-adf5-aa582e2c9294', NULL, NULL, '2025-12-29T17:22:15.480528+00:00', '2025-12-29T17:22:15.480528+00:00', NULL, '791caf12-2678-4a82-9bb5-e9202faa92b3', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('e1cf564d-cb7c-43c9-86cf-890ec94d662f', 'Thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '4fd86091-9a8f-42ad-adf5-aa582e2c9294', NULL, NULL, '2025-12-29T17:22:15.480528+00:00', '2025-12-29T17:22:15.480528+00:00', NULL, 'a731d44d-f10c-45ca-825d-d8c9e7e1863c', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('2aae0103-967e-410c-8716-f9186d0190ee', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'a7888282-cc6b-4e61-b85e-03516a25e853', NULL, NULL, '2025-12-29T17:53:46.127071+00:00', '2025-12-29T17:53:46.127071+00:00', NULL, 'd793c414-55de-48c6-a058-7c286f235d01', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('0a3330b2-ad1e-4dff-8253-1117c8f43094', 'Tim', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a7888282-cc6b-4e61-b85e-03516a25e853', NULL, NULL, '2025-12-29T17:53:46.237293+00:00', '2025-12-29T17:53:46.237293+00:00', NULL, '9ea6d66d-8c78-4d1d-8c1d-520c7dbe0521', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('a3151a57-42f5-4b50-8cd9-9609a11ece7f', 'Struppi', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a7888282-cc6b-4e61-b85e-03516a25e853', NULL, NULL, '2025-12-29T17:53:46.237293+00:00', '2025-12-29T17:53:46.237293+00:00', NULL, '1a9d6868-0fdb-42f4-86d4-7e8f8b52c9bc', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('e9b7af3c-404c-48d8-9097-d40f8554b0ac', 'Max', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a7888282-cc6b-4e61-b85e-03516a25e853', NULL, NULL, '2025-12-29T17:53:46.237293+00:00', '2025-12-29T17:53:46.237293+00:00', NULL, '2750ef82-11ad-4240-b039-b4b24ae45247', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('feb23fcd-0c01-4507-bfd9-42d07149aba2', 'Stefan', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a7888282-cc6b-4e61-b85e-03516a25e853', NULL, NULL, '2025-12-29T17:53:46.237293+00:00', '2025-12-29T17:53:46.237293+00:00', NULL, '6348d96a-825d-47df-adcd-6b9e2e14e132', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('47ae15f6-4bb3-4eb9-a0c0-8d8f40c93d0c', 'Marco', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a7888282-cc6b-4e61-b85e-03516a25e853', NULL, NULL, '2025-12-29T17:53:46.237293+00:00', '2025-12-29T17:53:46.237293+00:00', NULL, 'bf4edebc-0fa7-4b68-9154-622ce1eeb8ff', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('dc900dd7-8903-4e48-a979-03ffe2f50d35', 'Marina', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'aa0c2cab-bfa9-453e-be38-caa2227d579a', NULL, NULL, '2026-01-02T19:56:32.844437+00:00', '2026-01-02T19:56:32.844437+00:00', NULL, '97da19b0-275a-40d9-b362-dc473da5151a', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('12a079c3-ef4c-49bb-a06f-7674b9faa4e2', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '21ed18f7-35fa-4854-9c2d-934361e28bf4', NULL, NULL, '2025-12-30T12:45:07.35666+00:00', '2025-12-30T12:45:07.35666+00:00', NULL, '76458b40-34e9-419f-a033-43541c0c2b9d', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('30ecd962-966d-476d-8839-93b0b407e94f', 'Tim', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '21ed18f7-35fa-4854-9c2d-934361e28bf4', NULL, NULL, '2025-12-30T12:45:07.447889+00:00', '2025-12-30T12:45:07.447889+00:00', NULL, '3f27f2a8-4c74-4988-8781-c2fc2477547c', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('68886493-d799-4de7-8d9b-57956b5866a7', 'Tom', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '21ed18f7-35fa-4854-9c2d-934361e28bf4', NULL, NULL, '2025-12-30T12:45:07.447889+00:00', '2025-12-30T12:45:07.447889+00:00', NULL, '72fb8f7b-4a9a-4c9b-bc37-1ee8d2015c8f', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('b68a4fcf-cb29-4f58-9fb0-94d181496ca7', 'Stefan', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '21ed18f7-35fa-4854-9c2d-934361e28bf4', NULL, NULL, '2025-12-30T12:45:07.447889+00:00', '2025-12-30T12:45:07.447889+00:00', NULL, '30adf75c-bd94-4a71-acc7-e188230fd935', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('dcfcb56f-b12f-46c6-aaae-baf500e6a33c', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'cf14b759-e3bb-4d4a-9690-05847dbf3479', NULL, NULL, '2025-12-30T17:06:26.661428+00:00', '2025-12-30T17:06:26.661428+00:00', NULL, 'aca83aaf-0b45-4578-b00d-f2ee939423db', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('048ba257-bc73-475f-adde-c5dc476559bc', 'Stefsn', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cf14b759-e3bb-4d4a-9690-05847dbf3479', NULL, NULL, '2025-12-30T17:06:26.765268+00:00', '2025-12-30T17:06:26.765268+00:00', NULL, 'cd07822b-7411-4ca0-b6b3-0de0edb8575e', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('f2d83d40-8329-4935-b058-e02988e6b545', 'Tim', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cf14b759-e3bb-4d4a-9690-05847dbf3479', NULL, NULL, '2025-12-30T17:06:26.765268+00:00', '2025-12-30T17:06:26.765268+00:00', NULL, '087b3e4a-874f-41c8-9805-1d2d9ce3f7cf', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('3a4c5b1c-2570-4981-a4fe-a1a3863ac340', 'Matthias', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cf14b759-e3bb-4d4a-9690-05847dbf3479', NULL, NULL, '2025-12-30T17:06:26.765268+00:00', '2025-12-30T17:32:51.073733+00:00', NULL, 'ef1fe123-9663-4df8-bb52-678d6affc234', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('8aedee59-fb67-46d7-91bd-5872c83b9fd1', 'Luca', 'organizer'::participant_role, 'luca.madonia93@googlemail.com', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '10aaeae8-c897-4b06-9799-bdd3b8ec3133', NULL, NULL, '2026-01-01T11:53:23.167432+00:00', '2026-01-01T11:53:23.167432+00:00', NULL, 'aeebbda4-2953-4295-950e-e9a1a28ef562', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('f8fa3cc0-dc67-4b26-ab80-cad6862e0c30', 'Pascal', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10aaeae8-c897-4b06-9799-bdd3b8ec3133', NULL, NULL, '2026-01-01T11:53:23.25773+00:00', '2026-01-01T11:53:23.25773+00:00', NULL, '202b137f-f09a-4739-81ff-ed4d16abe0fd', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('bc32f6ad-bb7b-4f1d-81cf-a6f310156bcd', 'Silvia', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10aaeae8-c897-4b06-9799-bdd3b8ec3133', NULL, NULL, '2026-01-01T11:53:23.25773+00:00', '2026-01-01T11:53:23.25773+00:00', NULL, 'c5300df4-08e8-43dd-99b3-338f33563f5f', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('530fb2c3-0d97-40f5-aeb0-a02ba0cdff29', 'Rebecca', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '10aaeae8-c897-4b06-9799-bdd3b8ec3133', NULL, NULL, '2026-01-01T11:53:23.25773+00:00', '2026-01-01T11:53:23.25773+00:00', NULL, 'ed3129a2-92ea-4541-908a-1064ef8260d9', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('29bb9277-ff64-4e0d-87f5-c210d580f4fb', 'Luca Madonia', 'organizer'::participant_role, 'info@myfamblissgroup.com', NULL, 'confirmed'::participant_status, '42c9b952-3990-4a14-a79b-6a2102c627ab', 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', NULL, NULL, '2026-01-02T08:53:29.674655+00:00', '2026-01-02T08:53:29.674655+00:00', NULL, '4fdaf675-5961-4f4e-ab6b-f10501882177', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('6b312f36-3bd2-4ed2-98a7-c135e6dca67b', 'Emilia', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', NULL, NULL, '2026-01-02T08:53:29.889177+00:00', '2026-01-02T08:53:29.889177+00:00', NULL, '5678685d-2aac-479b-b203-b402ad02cda6', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('be4f9a42-5c80-4359-b86f-87723054f77f', 'Liah', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', NULL, NULL, '2026-01-02T08:53:29.889177+00:00', '2026-01-02T08:53:29.889177+00:00', NULL, 'e1f7dbe4-25d0-426a-aa46-aa22ee22a57c', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('a1aac881-f63c-4070-a554-8e78e75e9d2a', 'Luca Madonia', 'organizer'::participant_role, 'info@myfamblissgroup.com', NULL, 'confirmed'::participant_status, '42c9b952-3990-4a14-a79b-6a2102c627ab', '0851b13c-28e6-4c1a-9532-6bcb7fd11562', NULL, NULL, '2026-01-02T09:05:24.445263+00:00', '2026-01-02T09:05:24.445263+00:00', NULL, 'd1d000b4-42ff-492a-b1cf-a389cfb16765', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('ea2e27d8-a86b-4162-a9c5-5757984fc895', 'Arthur', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '0851b13c-28e6-4c1a-9532-6bcb7fd11562', NULL, NULL, '2026-01-02T09:05:24.52763+00:00', '2026-01-02T09:05:24.52763+00:00', NULL, '808af7ba-7add-430f-af47-129d5cf39b3d', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('c4a5ee6c-00cd-4e17-b9c8-8fcc0235fffb', 'Timo', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '0851b13c-28e6-4c1a-9532-6bcb7fd11562', NULL, NULL, '2026-01-02T09:05:24.52763+00:00', '2026-01-02T09:05:24.52763+00:00', NULL, '54495c7d-f698-437f-aaad-ea9ec86a214b', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('f8bfd669-4d79-4d58-8d8c-caed92f2ee60', 'Pascal', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '0851b13c-28e6-4c1a-9532-6bcb7fd11562', NULL, NULL, '2026-01-02T09:05:24.52763+00:00', '2026-01-02T09:05:24.52763+00:00', NULL, '0e75e940-7af5-495c-a6aa-7a8b1fd771e5', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('8bb1cfe2-cdc0-47c7-a533-1ef29bd9fcd5', 'Felix', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '0851b13c-28e6-4c1a-9532-6bcb7fd11562', NULL, NULL, '2026-01-02T09:05:24.52763+00:00', '2026-01-02T09:05:24.52763+00:00', NULL, 'e3b10364-2fac-4507-bec7-96fc95117c15', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('e277c9d2-4c92-42fb-a9ea-bfabe092159e', 'Marco', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '0851b13c-28e6-4c1a-9532-6bcb7fd11562', NULL, NULL, '2026-01-02T09:05:24.52763+00:00', '2026-01-02T09:05:24.52763+00:00', NULL, '183f1972-9ba8-491f-a2be-61f158a94b1c', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('fd02da80-3f63-4f12-955e-e96c592d8ab2', 'test', 'organizer'::participant_role, 'test@test.de', NULL, 'confirmed'::participant_status, '42c9b952-3990-4a14-a79b-6a2102c627ab', '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', NULL, NULL, '2026-01-02T14:30:06.212203+00:00', '2026-01-02T14:30:06.212203+00:00', NULL, 'e9bffafb-25b2-4c44-9f9a-2e963dc4acbe', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('5233292b-012a-44d1-9fa1-961e7b6cc4ad', 'Rebecca', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', NULL, NULL, '2026-01-02T08:53:29.889177+00:00', '2026-01-02T09:49:31.413391+00:00', NULL, '1f34b740-9604-4469-a1d2-71e2b0b0c06e', '2026-01-02T09:49:31.051+00:00', NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('4d713649-1490-4900-a46a-a4edccf79da2', 'Luca Madonia', 'organizer'::participant_role, 'info@myfamblissgroup.com', NULL, 'confirmed'::participant_status, '42c9b952-3990-4a14-a79b-6a2102c627ab', 'd9cd9f83-7572-4e68-81f7-76f05a49483e', NULL, NULL, '2026-01-02T13:18:14.586191+00:00', '2026-01-02T13:18:14.586191+00:00', NULL, '2e09256d-7667-4008-b388-70aca27f0b47', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('a76d634c-616f-4f38-8d90-db9b0caffc27', 'Thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'd9cd9f83-7572-4e68-81f7-76f05a49483e', NULL, NULL, '2026-01-02T13:18:14.667349+00:00', '2026-01-02T13:18:14.667349+00:00', NULL, '9cec25d5-d962-4e88-b1d0-b631e378879a', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('5741b6db-d962-485e-8f88-5cad2b527f00', 'Marina', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'd9cd9f83-7572-4e68-81f7-76f05a49483e', NULL, NULL, '2026-01-02T13:18:14.667349+00:00', '2026-01-02T13:18:14.667349+00:00', NULL, 'b106f103-16b1-4539-92b0-46522807e401', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('87827ce6-d693-4191-808d-0f8b6cf19392', 'Rolf', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'd9cd9f83-7572-4e68-81f7-76f05a49483e', NULL, NULL, '2026-01-02T13:18:14.667349+00:00', '2026-01-02T13:18:14.667349+00:00', NULL, '69c9bcb2-e580-40be-9a2b-1e2d96afa51c', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('75e5c06e-cad5-4d5f-9897-4992c3ebb17d', 'Pipin', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'd9cd9f83-7572-4e68-81f7-76f05a49483e', NULL, NULL, '2026-01-02T13:18:14.667349+00:00', '2026-01-02T13:18:14.667349+00:00', NULL, 'e22376fa-ea16-420e-ba69-1e4195d08ee7', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('948796cf-f509-4da6-95b4-8cd45d0d5a8c', 'Bailey', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'd9cd9f83-7572-4e68-81f7-76f05a49483e', NULL, NULL, '2026-01-02T13:18:14.667349+00:00', '2026-01-02T13:18:14.667349+00:00', NULL, '47c89f91-2fd7-47a0-91fb-4ab17ed37316', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('04326cbf-abac-4248-8bb0-227520020037', 'Ole', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'd9cd9f83-7572-4e68-81f7-76f05a49483e', NULL, NULL, '2026-01-02T13:18:14.667349+00:00', '2026-01-02T13:18:14.667349+00:00', NULL, '91e6ac8e-5eb6-4f11-9b09-387d4bfe58c1', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('d2ba02a0-b733-4fd1-8eb3-4a5c65f12763', 'luca', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', NULL, NULL, '2026-01-02T14:30:06.290833+00:00', '2026-01-02T14:30:06.290833+00:00', NULL, '31f38d39-daba-412b-bed5-4b782e1beaac', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('29617861-1ef0-42aa-8491-c94632bcca77', 'test', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', NULL, NULL, '2026-01-02T14:30:06.290833+00:00', '2026-01-02T14:30:06.290833+00:00', NULL, '883a1f57-2e18-4881-a892-4b3a365588df', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('2c282153-e9e8-4f45-a16e-81eb3350b9e2', 'Luca Madonia', 'organizer'::participant_role, 'info@myfamblissgroup.com', NULL, 'confirmed'::participant_status, '42c9b952-3990-4a14-a79b-6a2102c627ab', 'aa0c2cab-bfa9-453e-be38-caa2227d579a', NULL, NULL, '2026-01-02T19:56:32.768562+00:00', '2026-01-02T19:56:32.768562+00:00', NULL, '8b1ba014-418b-4dd4-a15a-2946b683bd23', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('bbe34df2-686c-46fb-ac6e-4496a4800f07', 'Thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'aa0c2cab-bfa9-453e-be38-caa2227d579a', NULL, NULL, '2026-01-02T19:56:32.844437+00:00', '2026-01-02T19:56:32.844437+00:00', NULL, '66841475-7e77-4598-931b-8e45d37cfbf1', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('dcb96c57-a89b-4ed9-b6f3-725f0a25d32c', 'Kai', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'aa0c2cab-bfa9-453e-be38-caa2227d579a', NULL, NULL, '2026-01-02T19:56:32.844437+00:00', '2026-01-02T19:56:32.844437+00:00', NULL, '0996da5d-7985-4af8-8bf2-f9006bb158bc', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('3a9fd2f3-d35a-4f68-8c9b-3cc84755a22a', 'Claudia', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'aa0c2cab-bfa9-453e-be38-caa2227d579a', NULL, NULL, '2026-01-02T19:56:32.844437+00:00', '2026-01-02T19:56:32.844437+00:00', NULL, 'b30a6f1e-b625-4d5d-920c-d7e532742f3a', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('345513bc-7cc8-4c41-99b2-be71ea1332dc', 'Thomy', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'aa0c2cab-bfa9-453e-be38-caa2227d579a', NULL, NULL, '2026-01-02T19:56:32.844437+00:00', '2026-01-02T19:56:32.844437+00:00', NULL, 'a2958f38-6af9-48b2-bb76-0913fb780713', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('838c4a00-df6c-4163-ae94-b8afa72c7678', 'Luca Madonia', 'organizer'::participant_role, 'info@myfamblissgroup.com', NULL, 'confirmed'::participant_status, '42c9b952-3990-4a14-a79b-6a2102c627ab', 'e264533d-7a89-478b-8c6f-94d524d7b277', NULL, NULL, '2026-01-03T08:29:37.203742+00:00', '2026-01-03T08:29:37.203742+00:00', NULL, 'ae3263df-589a-44f7-9ef3-8777145322cb', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('82f332d6-f88b-4377-a9fe-76aee7e1a23b', 'Adrian', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'e264533d-7a89-478b-8c6f-94d524d7b277', NULL, NULL, '2026-01-03T08:29:37.320967+00:00', '2026-01-03T08:29:37.320967+00:00', NULL, '28bb2fd2-cebd-405e-ada7-e59bd65b112b', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('f7bf9f9c-ad92-4af4-b4a4-70febb494222', 'Marcus', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'e264533d-7a89-478b-8c6f-94d524d7b277', NULL, NULL, '2026-01-03T08:29:37.320967+00:00', '2026-01-03T08:29:37.320967+00:00', NULL, '718c5ece-08a9-4b32-9341-b91741ef9cc6', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('5f1a8cf1-5cd0-45d1-a91f-da53251d8ef9', 'Marc', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'e264533d-7a89-478b-8c6f-94d524d7b277', NULL, NULL, '2026-01-03T08:29:37.320967+00:00', '2026-01-03T08:29:37.320967+00:00', NULL, '416dfb05-3b79-448b-8069-b3d095570c89', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('60e6daba-253d-4f69-873d-daf2e6f71b48', 'Marc', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'e264533d-7a89-478b-8c6f-94d524d7b277', NULL, NULL, '2026-01-03T08:29:37.320967+00:00', '2026-01-03T08:29:37.320967+00:00', NULL, '3f2ae45e-c2bc-4624-90d9-4867e5869379', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('e42473f5-89a0-42c6-9994-056282e52325', 'Daniel', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'e264533d-7a89-478b-8c6f-94d524d7b277', NULL, NULL, '2026-01-03T08:29:37.320967+00:00', '2026-01-03T08:29:37.320967+00:00', NULL, '68424010-4d71-41a1-9e2c-77e182cea244', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('faafc67e-9283-4d3e-b991-5611955fea00', 'Mario', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'e264533d-7a89-478b-8c6f-94d524d7b277', NULL, NULL, '2026-01-03T08:29:37.320967+00:00', '2026-01-03T08:29:37.320967+00:00', NULL, '0add8151-fcf7-4843-9a90-6f6b35a5c7cc', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('b62acb6e-77f6-4b7a-99d3-621a11a2e23a', 'Erwin', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'e264533d-7a89-478b-8c6f-94d524d7b277', NULL, NULL, '2026-01-03T08:29:37.320967+00:00', '2026-01-03T08:29:37.320967+00:00', NULL, '29b12df4-166d-46d7-b826-72cbe1742e75', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('bde9bd58-1922-4fa5-8f5a-e39a0a3b5a7c', 'Luca Madonia', 'organizer'::participant_role, 'info@myfamblissgroup.com', NULL, 'confirmed'::participant_status, '42c9b952-3990-4a14-a79b-6a2102c627ab', '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', NULL, NULL, '2026-01-03T09:07:13.067632+00:00', '2026-01-03T09:07:13.067632+00:00', NULL, 'dc2ce68f-612e-4afc-902d-f5efeb3db780', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('61e8a68c-d952-4b94-9422-1d5b36923cac', 'Marc', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', NULL, NULL, '2026-01-03T09:07:13.181597+00:00', '2026-01-03T09:07:13.181597+00:00', NULL, '61d38253-1ee2-4c9f-92b4-a1d26de6c2a8', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('71b1d7ee-26c4-467d-818e-bf9cb0b6597a', 'Tom', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', NULL, NULL, '2026-01-03T09:07:13.181597+00:00', '2026-01-03T09:07:13.181597+00:00', NULL, '7e3bd64c-9a5f-469e-9f8f-11f221fe2e65', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('efe1ef02-8bbf-4121-a531-dcb87e03ebbf', 'Tim', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', NULL, NULL, '2026-01-03T09:07:13.181597+00:00', '2026-01-03T09:07:13.181597+00:00', NULL, '8601aa81-c592-45df-a728-bad89fdeb090', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('894d21b2-327c-4bd0-8b90-23a2ceee8f26', 'Thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', NULL, NULL, '2026-01-03T09:07:13.181597+00:00', '2026-01-03T09:07:13.181597+00:00', NULL, '945d819c-7ef0-4405-b3e6-08c2f79c1a09', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('f357ba85-e3de-4fa9-bc11-63da961dd34c', 'Daniel', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', NULL, NULL, '2026-01-03T09:07:13.181597+00:00', '2026-01-03T09:07:13.181597+00:00', NULL, 'aa165fc9-80ea-463d-92a4-7bfcda3736c7', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('b01525f1-239a-47f0-9abb-9f34660c1a1d', 'Stefan', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', NULL, NULL, '2026-01-03T09:07:13.181597+00:00', '2026-01-03T09:07:13.181597+00:00', NULL, 'e7d6e1d7-bd36-4b2e-acdc-64db6cf12c69', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('d2aba3a6-dc1d-4884-96fd-4bb0ee379668', 'Luca', 'organizer'::participant_role, 'info@myfamblissgroup.com', NULL, 'confirmed'::participant_status, '42c9b952-3990-4a14-a79b-6a2102c627ab', 'daade170-c96a-4600-8346-55d43c0fdeab', NULL, NULL, '2026-01-07T17:00:20.456808+00:00', '2026-01-07T17:00:20.456808+00:00', NULL, '1dd4c0cd-4632-43e2-8414-e9315a0a1307', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('d0c3b70a-b3d6-4910-9299-4839efac8e07', 'ute', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'daade170-c96a-4600-8346-55d43c0fdeab', NULL, NULL, '2026-01-07T17:00:20.547261+00:00', '2026-01-07T17:00:20.547261+00:00', NULL, '355fd5f4-02aa-43b1-a6f4-cb1f51769c6d', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('3a05fc8f-ac44-44b6-97e9-4c100507d23e', 'nino', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'daade170-c96a-4600-8346-55d43c0fdeab', NULL, NULL, '2026-01-07T17:00:20.547261+00:00', '2026-01-07T17:00:20.547261+00:00', NULL, 'b74a4b43-b9fe-425c-85c3-a55f7f466d27', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('ae5b3089-614b-4765-b9c1-62f4c62a4f9b', 'thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'daade170-c96a-4600-8346-55d43c0fdeab', NULL, NULL, '2026-01-07T17:00:20.547261+00:00', '2026-01-07T17:00:20.547261+00:00', NULL, '5ee3c117-f452-4797-ab89-23873d890070', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('ba92ba15-39dd-450d-9c42-390ce016ef64', 'stefan', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'daade170-c96a-4600-8346-55d43c0fdeab', NULL, NULL, '2026-01-07T17:00:20.547261+00:00', '2026-01-07T17:00:20.547261+00:00', NULL, 'c0810425-379a-4ffc-9c4c-191fb10462bf', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('8cfa0564-17b4-4d77-8e96-c27ae0cbd8c0', 'Luca Madonia', 'organizer'::participant_role, 'luca@madonia-freiburg.de', NULL, 'confirmed'::participant_status, 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8beda246-c847-4146-96aa-47e8464477b2', NULL, NULL, '2026-01-09T10:35:29.812837+00:00', '2026-01-09T10:35:29.812837+00:00', NULL, 'dd521e69-cb6f-4842-9863-2e6b84c21409', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('3a459916-08ec-44d6-a327-668aa1ed9fa8', 'Chris', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '8beda246-c847-4146-96aa-47e8464477b2', NULL, NULL, '2026-01-09T10:35:30.040379+00:00', '2026-01-09T10:35:30.040379+00:00', NULL, '93b5959f-f2b2-425a-8c52-83b42f979331', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('ac3cd271-3e7a-4f9c-a442-4bcad8893874', 'Fabio', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '8beda246-c847-4146-96aa-47e8464477b2', NULL, NULL, '2026-01-09T10:35:30.040379+00:00', '2026-01-09T10:35:30.040379+00:00', NULL, '68a70939-f759-4b97-adc2-5424874d0c5c', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('de84a070-b5e8-4831-a97e-fc8ca9d1cfb0', 'Test', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '8beda246-c847-4146-96aa-47e8464477b2', NULL, NULL, '2026-01-09T10:35:30.040379+00:00', '2026-01-09T10:35:30.040379+00:00', NULL, '748203bb-beda-47b0-a708-eda1c9d0c692', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('724f2a1d-2386-430f-bfe4-e4de2bb56a5e', 'te', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '8beda246-c847-4146-96aa-47e8464477b2', NULL, NULL, '2026-01-09T10:35:30.040379+00:00', '2026-01-09T10:35:30.040379+00:00', NULL, '6d6e938a-a2c3-489e-b65b-14f3d2a5f62f', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('bef81a05-3fcc-4cf5-915d-942e14d40d88', 'st', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '8beda246-c847-4146-96aa-47e8464477b2', NULL, NULL, '2026-01-09T10:35:30.040379+00:00', '2026-01-09T10:35:30.040379+00:00', NULL, 'dff52c66-d624-41a4-9bec-39e6905f443a', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('b973a016-eab8-46d0-b71d-6e95daf26962', 'sdfsd', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '8beda246-c847-4146-96aa-47e8464477b2', NULL, NULL, '2026-01-09T10:35:30.040379+00:00', '2026-01-09T10:35:30.040379+00:00', NULL, '09d5e038-1c53-47e8-a4df-d7934efef403', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('51c6138a-a4f7-4d41-b096-975bdf51661f', 'sd', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, '8beda246-c847-4146-96aa-47e8464477b2', NULL, NULL, '2026-01-09T10:35:30.040379+00:00', '2026-01-09T10:35:30.040379+00:00', NULL, 'cb385704-ca54-4b02-82f4-db32a90d36d7', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('1f173122-4d71-42b6-af9c-c32bf8e1b826', 'Luca', 'organizer'::participant_role, 'thomas.veser@kinderleicht-geniessen.de', NULL, 'confirmed'::participant_status, 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'a86d2ef2-a669-42f6-836b-befc9e7cb678', NULL, NULL, '2026-01-11T09:49:03.242095+00:00', '2026-01-11T09:49:03.242095+00:00', NULL, '738fe57a-5157-4af6-9a8c-ecc5867d1bb3', NULL, NULL, true, '{"can_add_expenses":true,"can_edit_settings":true,"can_view_responses":true,"can_view_all_expenses":true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('79c6d3d5-afdd-4cdb-8161-5d89b23aa27d', 'Marina', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a86d2ef2-a669-42f6-836b-befc9e7cb678', NULL, NULL, '2026-01-11T09:49:03.323077+00:00', '2026-01-11T09:49:03.323077+00:00', NULL, '2dc54545-5e09-4171-9bd0-b7d92f337365', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('eb0f0e2e-8927-4839-8506-e340875959d3', 'Thomas', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a86d2ef2-a669-42f6-836b-befc9e7cb678', NULL, NULL, '2026-01-11T09:49:03.323077+00:00', '2026-01-11T09:49:03.323077+00:00', NULL, '74c91261-35b8-450e-8763-e517bc099184', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('5eb67b99-736e-49e7-bdc2-3cdb5facfc5b', 'Natascha', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a86d2ef2-a669-42f6-836b-befc9e7cb678', NULL, NULL, '2026-01-11T09:49:03.323077+00:00', '2026-01-11T09:49:03.323077+00:00', NULL, 'ce99a49f-fe35-4499-bd48-8f1273e242d6', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('0bf5af7b-281d-44d1-a710-a638acb4b0ba', 'Koen', 'guest'::participant_role, NULL, NULL, 'invited'::participant_status, NULL, 'a86d2ef2-a669-42f6-836b-befc9e7cb678', NULL, NULL, '2026-01-11T09:49:03.323077+00:00', '2026-01-11T09:49:03.323077+00:00', NULL, '2de9e307-8565-453a-86e7-b053beb49c80', NULL, NULL, false, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.participants (id, name, role, email, phone, status, user_id, event_id, joined_at, avatar_url, created_at, updated_at, response_id, invite_token, invite_sent_at, invite_claimed_at, can_access_dashboard, dashboard_permissions) VALUES ('74f27783-5710-4993-9ef5-512fb977f120', 'Marc Ehrlich', 'guest'::participant_role, NULL, NULL, 'confirmed'::participant_status, NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', NULL, NULL, '2025-12-29T00:14:56.952451+00:00', '2026-03-28T06:26:18.967439+00:00', 'a6ef677e-83f2-4932-a5c5-a867858a6c40', 'ca7dcb8d-efc6-426e-97d3-fc9fe4a46491', '2026-03-28T06:26:18.887+00:00', NULL, true, '{"can_add_expenses":true,"can_edit_settings":false,"can_view_responses":false,"can_view_all_expenses":false}'::jsonb) ON CONFLICT (id) DO NOTHING;

-- responses (8 rows)
INSERT INTO public.responses (id, meta, budget, alcohol, de_city, event_id, attendance, created_at, updated_at, date_blocks, destination, participant, preferences, suggestions, travel_pref, partial_days, restrictions, duration_pref, fitness_level) VALUES ('7368aee8-c8f9-449a-b42b-371950cab2d8', '{"budget_choices":["250-400","150-250"],"duration_choices":["day"],"destination_choices":["barcelona","de_city","lisbon","neapel"]}'::jsonb, '250-400', 'yes', NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', 'yes', '2025-12-29T10:52:47.893894+00:00', '2025-12-29T10:52:47.893894+00:00', ARRAY['A', 'D', 'C']::TEXT[], 'barcelona', 'Luca Madonia', ARRAY['karting', 'lasertag', 'vr_simracing', 'paintball', 'ninja_warrior', 'segway_tour', 'shooting_range', 'badminton', 'volleyball', 'padel', 'basketball', 'football', 'trampoline_park', 'bubble_soccer', 'escape_room', 'climbing', 'beach_volleyball', 'mtb_tour', 'geocaching', 'via_ferrata', 'hiking', 'high_ropes', 'outdoor', 'food', 'tapas_tour', 'cocktail_course', 'brewery_tour', 'wine_tasting', 'wellness', 'sauna', 'quiz_night', 'cocktail_bar', 'street_art_tour', 'bowling', 'casino', 'mixed', 'pub_crawl', 'historic_site']::TEXT[], NULL, 'either', NULL, 'keine', 'day', 'sporty') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.responses (id, meta, budget, alcohol, de_city, event_id, attendance, created_at, updated_at, date_blocks, destination, participant, preferences, suggestions, travel_pref, partial_days, restrictions, duration_pref, fitness_level) VALUES ('9101f659-8be2-419b-aa36-7a0a6b8e76ea', '{"budget_choices":["150-250"],"duration_choices":["day"],"destination_choices":["de_city","barcelona","lisbon","budapest","neapel","rom","schottland","london"]}'::jsonb, '150-250', 'no', 'Köln ', '8230431a-939d-4bb2-ad8d-5602137483cf', 'yes', '2026-01-01T08:24:44.463606+00:00', '2026-01-01T08:24:44.463606+00:00', ARRAY['A', 'B']::TEXT[], 'de_city', 'Erwin Huhn', ARRAY['karting', 'escape_room', 'bubble_soccer', 'paintball', 'football', 'squash', 'outdoor', 'hiking', 'survival_training', 'geocaching', 'tapas_tour', 'food', 'wellness', 'thermal_bath', 'mixed', 'speakeasy', 'quiz_night', 'historic_site', 'street_art_tour']::TEXT[], NULL, 'one_night', NULL, NULL, 'day', 'normal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.responses (id, meta, budget, alcohol, de_city, event_id, attendance, created_at, updated_at, date_blocks, destination, participant, preferences, suggestions, travel_pref, partial_days, restrictions, duration_pref, fitness_level) VALUES ('413e5920-991d-4e48-a14b-e7fa4febb6bf', '{"budget_choices":["80-150","150-250","250-400"],"duration_choices":["day"],"destination_choices":["de_city"]}'::jsonb, '80-150', 'yes', NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', 'yes', '2026-01-01T09:13:59.119207+00:00', '2026-01-01T09:13:59.119207+00:00', ARRAY['B', 'D', 'A']::TEXT[], 'de_city', 'Marcus', ARRAY['karting', 'axe_throwing', 'vr_simracing', 'bubble_soccer', 'paintball', 'shooting_range', 'football', 'badminton', 'squash', 'tennis', 'table_tennis', 'volleyball', 'basketball', 'quad_tour', 'beach_volleyball', 'high_ropes', 'mtb_tour', 'brewery_tour', 'food', 'bowling']::TEXT[], NULL, 'daytrip', NULL, NULL, 'day', 'normal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.responses (id, meta, budget, alcohol, de_city, event_id, attendance, created_at, updated_at, date_blocks, destination, participant, preferences, suggestions, travel_pref, partial_days, restrictions, duration_pref, fitness_level) VALUES ('557e4267-776d-4050-ad50-91083e6ad0bf', '{"budget_choices":["250-400"],"duration_choices":["day"],"destination_choices":["de_city"]}'::jsonb, '250-400', 'no', 'komplett offen', '8230431a-939d-4bb2-ad8d-5602137483cf', 'maybe', '2026-01-01T10:38:36.691641+00:00', '2026-01-01T10:38:36.691641+00:00', ARRAY['A', 'C']::TEXT[], 'de_city', 'Adrian Bayerlein', ARRAY['karting', 'escape_room', 'lasertag', 'axe_throwing', 'bubble_soccer', 'paintball', 'quad_tour', 'segway_tour', 'shooting_range', 'bumper_cars', 'football', 'badminton', 'tennis', 'table_tennis', 'volleyball', 'basketball', 'padel', 'food', 'tapas_tour', 'casino', 'bowling', 'quiz_night', 'mtb_tour']::TEXT[], NULL, 'daytrip', 'Block A ginge bei mir nur Samstag (28.02.) - jedoch nur alkoholfrei
Block C ginge bei mir vollumfänglich - auch mit Alkohol (Favorisierter Termin)

Wenn die Mehrheit für Block B oder D ist, dann ist es für mich auch völlig ok, wenn ich nicht dabei bin.
Genauso, wenn die Mehrheit für einen Wochenendtrip ist.', 'Ein bisschen Höhenangst', 'day', 'sporty') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.responses (id, meta, budget, alcohol, de_city, event_id, attendance, created_at, updated_at, date_blocks, destination, participant, preferences, suggestions, travel_pref, partial_days, restrictions, duration_pref, fitness_level) VALUES ('eea02e4f-fb02-4584-8ccb-53cd86eef36d', '{"budget_choices":["150-250"],"duration_choices":["either"],"destination_choices":["de_city"]}'::jsonb, '150-250', 'either', NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', 'yes', '2026-01-01T11:42:41.078769+00:00', '2026-01-01T11:42:41.078769+00:00', ARRAY['A', 'B', 'D']::TEXT[], 'de_city', 'Daniel Streng', ARRAY['outdoor', 'hiking']::TEXT[], 'Hütte in den Bergen und evtl. Skifahren. 

Cartfahren findet er super scheiße (nur schon mal so vorab )😅', 'two_nights', NULL, NULL, 'either', 'normal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.responses (id, meta, budget, alcohol, de_city, event_id, attendance, created_at, updated_at, date_blocks, destination, participant, preferences, suggestions, travel_pref, partial_days, restrictions, duration_pref, fitness_level) VALUES ('fa9ab1fe-db5d-4995-80bf-c4b32811ef79', '{"budget_choices":["400+"],"custom_answers":{},"duration_choices":[],"destination_choices":["de_city","barcelona","lisbon","budapest","neapel","rom","london"]}'::jsonb, '400+', 'either', NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', 'yes', '2026-01-07T07:05:50.867103+00:00', '2026-01-07T07:05:50.867103+00:00', ARRAY['A', 'B', 'C', 'D']::TEXT[], 'de_city', 'Marc Dirnberger', ARRAY['karting', 'paintball', 'ninja_warrior', 'shooting_range', 'squash', 'tennis', 'table_tennis', 'padel', 'climbing', 'high_ropes']::TEXT[], NULL, 'either', NULL, 'Höhenangst bei extremen Höhen...', 'either', 'normal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.responses (id, meta, budget, alcohol, de_city, event_id, attendance, created_at, updated_at, date_blocks, destination, participant, preferences, suggestions, travel_pref, partial_days, restrictions, duration_pref, fitness_level) VALUES ('93c5ac6b-7884-47b2-bc6a-6299053d4f26', '{"budget_choices":["250-400"],"custom_answers":{},"duration_choices":[],"destination_choices":["de_city","budapest","london"]}'::jsonb, '250-400', 'yes', NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', 'yes', '2026-01-14T15:31:21.511129+00:00', '2026-01-14T15:31:21.511129+00:00', ARRAY['A', 'B', 'C', 'D']::TEXT[], 'de_city', 'Mario Buchfelner', ARRAY['high_ropes', 'zipline', 'hiking', 'food', 'cocktail_course', 'wine_tasting', 'brewery_tour', 'tapas_tour', 'wellness', 'thermal_bath', 'sauna', 'mixed']::TEXT[], NULL, 'one_night', NULL, 'Tod bei Pilzeverzehr :-)', 'either', 'normal') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.responses (id, meta, budget, alcohol, de_city, event_id, attendance, created_at, updated_at, date_blocks, destination, participant, preferences, suggestions, travel_pref, partial_days, restrictions, duration_pref, fitness_level) VALUES ('a6ef677e-83f2-4932-a5c5-a867858a6c40', '{"budget_choices":["150-250"],"custom_answers":{},"duration_choices":[],"destination_choices":["de_city"]}'::jsonb, '150-250', 'yes', NULL, '8230431a-939d-4bb2-ad8d-5602137483cf', 'yes', '2026-01-15T20:57:32.135518+00:00', '2026-01-15T20:57:32.135518+00:00', ARRAY['A', 'B', 'D']::TEXT[], 'de_city', 'Marc Ehrlich', ARRAY['karting', 'vr_simracing', 'paintball', 'shooting_range', 'padel', 'football', 'crossfit_challenge', 'wakeboarding', 'mtb_tour']::TEXT[], NULL, 'one_night', NULL, NULL, 'either', 'sporty') ON CONFLICT (id) DO NOTHING;

-- subscriptions (5 rows)
INSERT INTO public.subscriptions (id, plan, notes, user_id, is_manual, created_at, expires_at, started_at, updated_at, stripe_customer_id, stripe_subscription_id) VALUES ('b4b9bf5e-ee8f-4768-a455-f35b36ee1c6f', 'premium', NULL, '8e9ede54-5841-4325-aa73-5f92b1da78a5', false, '2025-12-29T14:54:45.804435+00:00', '2026-12-29T14:54:45.757+00:00', '2025-12-29T14:54:45.757+00:00', '2025-12-29T14:54:45.804435+00:00', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subscriptions (id, plan, notes, user_id, is_manual, created_at, expires_at, started_at, updated_at, stripe_customer_id, stripe_subscription_id) VALUES ('e2e96e43-078f-4a91-bc24-eb9437d81070', 'free', NULL, '726e1709-9123-4d66-abbc-036fde273071', false, '2025-12-29T15:00:09.204091+00:00', NULL, '2025-12-29T15:00:09.204091+00:00', '2025-12-29T15:32:22.968738+00:00', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subscriptions (id, plan, notes, user_id, is_manual, created_at, expires_at, started_at, updated_at, stripe_customer_id, stripe_subscription_id) VALUES ('43004b8b-ff0a-4dd4-bf20-3ea2f8b03b22', 'premium', NULL, '42c9b952-3990-4a14-a79b-6a2102c627ab', false, '2026-01-02T08:50:44.699349+00:00', '2027-01-02T08:50:44.66+00:00', '2026-01-02T08:50:44.66+00:00', '2026-01-02T08:50:44.699349+00:00', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subscriptions (id, plan, notes, user_id, is_manual, created_at, expires_at, started_at, updated_at, stripe_customer_id, stripe_subscription_id) VALUES ('9d226bad-5448-45ce-90ca-c945284495e7', 'free', NULL, 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', false, '2026-01-11T09:15:55.997044+00:00', NULL, '2026-01-11T09:15:55.997044+00:00', '2026-01-22T09:58:07.514564+00:00', 'cus_Tle4PwbdbiGFJ1', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subscriptions (id, plan, notes, user_id, is_manual, created_at, expires_at, started_at, updated_at, stripe_customer_id, stripe_subscription_id) VALUES ('b94b1259-fe53-4d64-9beb-d87b0510fe34', 'premium', 'Lifetime Premium - manuell vergeben', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', true, '2025-12-29T13:45:17.77591+00:00', NULL, '2025-12-29T13:45:17.77591+00:00', '2026-03-27T06:05:24.40507+00:00', NULL, NULL) ON CONFLICT (id) DO NOTHING;

-- vouchers (4 rows)
INSERT INTO public.vouchers (id, code, max_uses, is_active, created_at, created_by, used_count, valid_from, valid_until, discount_type, discount_value, stripe_coupon_id) VALUES ('b82bf076-9e77-4d36-8717-2fee67ac7655', 'EVB-7UI6YRCS', 5, true, '2025-12-29T14:55:38.158555+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 0, '2025-12-29T14:55:38.158555+00:00', '2025-12-31T00:00:00+00:00', 'percentage', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.vouchers (id, code, max_uses, is_active, created_at, created_by, used_count, valid_from, valid_until, discount_type, discount_value, stripe_coupon_id) VALUES ('2195643c-5bf7-4739-a9ac-61c4bda0924e', 'EVB-E8NY5CS5', 5, true, '2025-12-29T15:07:05.964295+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 1, '2025-12-29T15:07:05.964295+00:00', '2025-12-31T00:00:00+00:00', 'percentage', 50, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.vouchers (id, code, max_uses, is_active, created_at, created_by, used_count, valid_from, valid_until, discount_type, discount_value, stripe_coupon_id) VALUES ('3e9cbf04-0e65-4e57-bb69-fc43f1270b92', 'EVB-9JNITHAE', 3, true, '2025-12-29T15:30:55.936243+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 0, '2025-12-29T15:30:55.936243+00:00', '2025-12-31T00:00:00+00:00', 'percentage', 50, 'xU2SKDRC') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.vouchers (id, code, max_uses, is_active, created_at, created_by, used_count, valid_from, valid_until, discount_type, discount_value, stripe_coupon_id) VALUES ('0bf1f237-63ee-4f92-9dfa-c18c7af8e194', 'EVB-RBMU0P9L', 5, true, '2026-01-02T08:37:19.112488+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 0, '2026-01-02T08:37:19.112488+00:00', '2026-12-31T00:00:00+00:00', 'percentage', 100, 'EsB2yBzl') ON CONFLICT (id) DO NOTHING;

-- affiliates (3 rows)
INSERT INTO public.affiliates (id, tier, email, notes, phone, status, tax_id, user_id, website, created_at, updated_at, company_name, contact_name, payout_method, payout_details, total_earnings, commission_rate, commission_type, pending_balance) VALUES ('53389be3-1466-4d9d-8840-eefec176adaa', 'bronze', 'luca.madonia93@googlemail.com', NULL, '01744734440', 'active', NULL, NULL, 'Google.de', '2025-12-29T19:39:53.064392+00:00', '2025-12-29T19:39:53.064392+00:00', 'SH business COM GmbH', 'Ich ', 'bank_transfer', '{}'::jsonb, 0, 35, 'percentage', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.affiliates (id, tier, email, notes, phone, status, tax_id, user_id, website, created_at, updated_at, company_name, contact_name, payout_method, payout_details, total_earnings, commission_rate, commission_type, pending_balance) VALUES ('971b12cb-5b9b-40eb-907d-e404d182d0d4', 'bronze', 'max.mustermann@gmbh.de', 'DAs ist super

Promotion Method: Social Media', '156465465', 'pending', 'DE12354352', NULL, 'https:/max-mustermann@gmbh.de', '2025-12-31T08:30:34.714647+00:00', '2025-12-31T08:30:34.714647+00:00', 'Max Mustermann Gmbh', 'Max Mustermann', 'bank_transfer', '{}'::jsonb, 0, 10, 'percentage', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.affiliates (id, tier, email, notes, phone, status, tax_id, user_id, website, created_at, updated_at, company_name, contact_name, payout_method, payout_details, total_earnings, commission_rate, commission_type, pending_balance) VALUES ('fcb896b7-450b-4ee6-b196-c9895558c120', 'bronze', 'luca@madonia-freiburg.de', 'Promotion Method: Social Media', '0041795057180', 'active', '', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'https://mfg.cy', '2026-01-01T08:15:53.87879+00:00', '2026-01-01T08:21:07.097707+00:00', 'MYFAMBLISS GROUP LTD', 'Luca Madonia', 'bank_transfer', '{}'::jsonb, 0, 50, 'percentage', 0) ON CONFLICT (id) DO NOTHING;

-- expenses (21 rows)
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('41161855-488f-4fcd-8e08-7c34b9b07d87', 800, 'drinks'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T11:51:39.754051+00:00', '2025-12-29T12:13:23.892+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2025-12-29T12:13:24.030166+00:00', 'Bier', NULL, '2025-12-29', NULL, '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('8486d72d-0d7c-4344-a636-9fe3a6e41526', 500, 'food'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T11:50:59.266331+00:00', '2025-12-29T12:13:27.585+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2025-12-29T12:13:27.699964+00:00', 'Essen ', NULL, '2025-12-29', NULL, 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('a58d0e56-c462-4139-860d-2baa23fa7514', 540, 'transport'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T11:50:23.415298+00:00', '2025-12-29T12:13:33.428+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2025-12-29T12:13:33.548008+00:00', 'Car Rental', NULL, '2025-12-29', NULL, 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('47b25d0b-1aa4-46a8-ae99-e79c48f92323', 400, 'transport'::expense_category, 'EUR', 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:35:41.939548+00:00', NULL, NULL, 'equal'::split_type, '2025-12-30T17:35:41.939548+00:00', 'Mietwagen ', NULL, '2025-12-30', NULL, 'dcfcb56f-b12f-46c6-aaae-baf500e6a33c') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('0d77ed03-4fa3-4187-af1b-5d43112624bb', 200, 'activities'::expense_category, 'EUR', 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:36:41.370573+00:00', NULL, NULL, 'equal'::split_type, '2025-12-30T17:36:41.370573+00:00', 'Museum', NULL, '2025-12-30', NULL, '3a4c5b1c-2570-4981-a4fe-a1a3863ac340') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('d484147b-1759-42b8-a98b-170ceeebfce4', 250, 'drinks'::expense_category, 'EUR', 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:37:02.685608+00:00', NULL, NULL, 'equal'::split_type, '2025-12-30T17:37:02.685608+00:00', 'Bier', NULL, '2025-12-30', NULL, 'dcfcb56f-b12f-46c6-aaae-baf500e6a33c') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', 400, 'drinks'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T13:45:11.060616+00:00', '2026-01-01T10:10:50.82+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-01T10:10:50.986234+00:00', 'bIER', NULL, '2025-12-29', NULL, 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('7920f303-0822-4e48-a9eb-3529f25c1cb1', 250, 'activities'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T13:44:54.935149+00:00', '2026-01-01T10:11:10.326+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-01T10:11:10.493081+00:00', 'PainpALL', NULL, '2025-12-29', NULL, '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('99f15e3f-a084-48e5-9b6e-a1f58762915d', 500, 'transport'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T13:44:30.057263+00:00', '2026-01-01T10:11:23.577+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-01T10:11:23.736261+00:00', 'Bus', NULL, '2025-12-29', NULL, 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('b1431515-16c3-47b4-bd25-c27f9adbe275', 23, 'activities'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-01-02T06:39:55.626549+00:00', '2026-01-02T06:40:32.475+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-02T06:40:32.749362+00:00', 'Aktivität: sightseeing', NULL, '2026-04-05', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('9a4c747c-4427-4c25-babe-374f52916afa', 233, 'transport'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-01-02T06:39:30.592899+00:00', '2026-01-02T06:40:35.733+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-02T06:40:36.049278+00:00', 'Aktivität: auto', NULL, '2026-04-06', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('f7f8ce3f-3c88-4952-8e59-c47689067e50', 342, 'food'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-01-02T06:39:01.537926+00:00', '2026-01-02T06:40:39.099+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-02T06:40:39.382525+00:00', 'Aktivität: restauranr', NULL, '2026-04-07', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('7cde057a-e519-4ef7-a4a7-fd46f0901b15', 3242, 'activities'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-01-02T06:38:37.977812+00:00', '2026-01-02T06:40:42.367+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-02T06:40:42.648388+00:00', 'Aktivität: test', NULL, '2026-04-08', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('894946c6-f146-4878-9096-3a2e8f189f31', 200, 'gifts'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-01-01T15:36:56.895191+00:00', '2026-01-02T06:40:47.04+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-02T06:40:47.329183+00:00', 'Geschenk ', NULL, '2026-01-01', NULL, '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('c5cf7228-f596-44ec-84b3-e5d5b1ea1570', 300, 'drinks'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-01-01T15:29:35.889991+00:00', '2026-01-02T06:40:49.63+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-02T06:40:49.92158+00:00', 'Bier', NULL, '2026-01-01', NULL, '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('8d6e8772-e336-4659-b09c-9817d7f4f0ec', 200, 'transport'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-01-01T15:29:04.986407+00:00', '2026-01-02T06:40:55.11+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'equal'::split_type, '2026-01-02T06:40:55.400511+00:00', 'Mietwagen ', NULL, '2026-01-01', NULL, 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('2d011ff8-82a5-4ece-b344-1c6255ccc6cb', 500, 'accommodation'::expense_category, 'EUR', 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-05T15:07:26.769174+00:00', NULL, NULL, 'equal'::split_type, '2026-01-05T15:07:26.769174+00:00', 'Hotel ', NULL, '2026-01-05', NULL, '29bb9277-ff64-4e0d-87f5-c210d580f4fb') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', 800, 'transport'::expense_category, 'EUR', '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:37:16.361525+00:00', NULL, NULL, 'equal'::split_type, '2026-01-09T10:37:16.361525+00:00', 'Mietwagen', NULL, '2026-01-09', NULL, 'ac3cd271-3e7a-4f9c-a442-4bcad8893874') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('177bcd92-4fbe-4404-bac9-e44abbbc0cbd', 483.45, 'accommodation'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-03-27T05:55:23.785574+00:00', NULL, NULL, 'equal'::split_type, '2026-03-27T05:55:23.785574+00:00', 'Hotel Meininger', NULL, '2026-03-27', NULL, 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('82372052-5849-411f-91f6-80bd7f585d62', 486, 'activities'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-03-27T05:56:57.229534+00:00', NULL, NULL, 'equal'::split_type, '2026-03-27T05:56:57.229534+00:00', 'Bier Olympiade', NULL, '2026-03-27', NULL, 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expenses (id, amount, category, currency, event_id, created_at, deleted_at, deleted_by, split_type, updated_at, description, receipt_url, expense_date, deletion_reason, paid_by_participant_id) VALUES ('1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', 441, 'activities'::expense_category, 'EUR', '8230431a-939d-4bb2-ad8d-5602137483cf', '2026-03-28T06:16:30.14143+00:00', NULL, NULL, 'equal'::split_type, '2026-03-28T06:16:30.14143+00:00', 'Mountain Cart', NULL, '2026-03-28', NULL, 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;

-- expense_shares (120 rows)
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('26644f1d-6007-411e-bce2-67cca1b60b99', 67.5, false, NULL, '2025-12-29T11:50:23.552161+00:00', 'a58d0e56-c462-4139-860d-2baa23fa7514', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('e288e640-9cd6-4f52-9155-9e18252d9846', 67.5, false, NULL, '2025-12-29T11:50:23.552161+00:00', 'a58d0e56-c462-4139-860d-2baa23fa7514', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('c6169234-2e76-4563-b258-d441acc7ebfe', 67.5, false, NULL, '2025-12-29T11:50:23.552161+00:00', 'a58d0e56-c462-4139-860d-2baa23fa7514', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('5bec312e-c78a-4c62-9006-5fb8d0503bae', 67.5, false, NULL, '2025-12-29T11:50:23.552161+00:00', 'a58d0e56-c462-4139-860d-2baa23fa7514', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('7e21b2f9-b629-4037-9146-c1d021598f2c', 67.5, false, NULL, '2025-12-29T11:50:23.552161+00:00', 'a58d0e56-c462-4139-860d-2baa23fa7514', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('3474713b-195f-480e-8af0-3b6737271e3d', 67.5, false, NULL, '2025-12-29T11:50:23.552161+00:00', 'a58d0e56-c462-4139-860d-2baa23fa7514', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('47f68df8-86dc-4b09-a205-58ab87634d33', 67.5, false, NULL, '2025-12-29T11:50:23.552161+00:00', 'a58d0e56-c462-4139-860d-2baa23fa7514', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('9c88ab64-08d4-4367-ab82-47b36a3ff5a0', 67.5, false, NULL, '2025-12-29T11:50:23.552161+00:00', 'a58d0e56-c462-4139-860d-2baa23fa7514', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('1bdbefad-0906-4365-9682-a071a9352662', 62.5, false, NULL, '2025-12-29T11:50:59.415517+00:00', '8486d72d-0d7c-4344-a636-9fe3a6e41526', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('e69734ea-d284-4bca-aaa7-6aa181a57a0c', 62.5, false, NULL, '2025-12-29T11:50:59.415517+00:00', '8486d72d-0d7c-4344-a636-9fe3a6e41526', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('180eed50-3413-45bb-900f-512f8280c6d0', 62.5, false, NULL, '2025-12-29T11:50:59.415517+00:00', '8486d72d-0d7c-4344-a636-9fe3a6e41526', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('0b7c859b-efae-46b5-8fff-9387dbdfd94c', 62.5, false, NULL, '2025-12-29T11:50:59.415517+00:00', '8486d72d-0d7c-4344-a636-9fe3a6e41526', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('8f547a36-677d-4acb-ac37-5bf95fedce73', 62.5, false, NULL, '2025-12-29T11:50:59.415517+00:00', '8486d72d-0d7c-4344-a636-9fe3a6e41526', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('2cb65dd3-ea44-4772-a036-d657b88299cb', 62.5, false, NULL, '2025-12-29T11:50:59.415517+00:00', '8486d72d-0d7c-4344-a636-9fe3a6e41526', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('ab276ce6-c154-48b0-a637-d114dddb291c', 62.5, false, NULL, '2025-12-29T11:50:59.415517+00:00', '8486d72d-0d7c-4344-a636-9fe3a6e41526', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('38f073ed-67fb-4a40-859a-c483d27cb0cf', 62.5, false, NULL, '2025-12-29T11:50:59.415517+00:00', '8486d72d-0d7c-4344-a636-9fe3a6e41526', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('10bf19df-8613-49dd-ade1-209e7cf44f8f', 100, false, NULL, '2025-12-29T11:51:39.857146+00:00', '41161855-488f-4fcd-8e08-7c34b9b07d87', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('c9897fee-4820-4b42-a2ff-f59049c2ab8d', 100, false, NULL, '2025-12-29T11:51:39.857146+00:00', '41161855-488f-4fcd-8e08-7c34b9b07d87', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('e7bb580e-c6cc-4424-9c51-97cf67ad5c27', 100, false, NULL, '2025-12-29T11:51:39.857146+00:00', '41161855-488f-4fcd-8e08-7c34b9b07d87', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('ac1e0e33-885e-49cc-bc35-88813a3426cb', 100, false, NULL, '2025-12-29T11:51:39.857146+00:00', '41161855-488f-4fcd-8e08-7c34b9b07d87', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('a545f85c-ca30-44f5-a781-fb7c91c773b5', 100, false, NULL, '2025-12-29T11:51:39.857146+00:00', '41161855-488f-4fcd-8e08-7c34b9b07d87', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('0ce5b619-0e52-48a1-8916-2ee6359969cf', 100, false, NULL, '2025-12-29T11:51:39.857146+00:00', '41161855-488f-4fcd-8e08-7c34b9b07d87', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('65154488-b275-4e86-a5d9-d46803417e57', 100, false, NULL, '2025-12-29T11:51:39.857146+00:00', '41161855-488f-4fcd-8e08-7c34b9b07d87', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('2e6591fe-562a-4154-a03c-f464db3dc0eb', 100, false, NULL, '2025-12-29T11:51:39.857146+00:00', '41161855-488f-4fcd-8e08-7c34b9b07d87', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('fdb056cd-aa82-470b-af46-ef7dd1158144', 62.5, false, NULL, '2025-12-29T13:44:30.179804+00:00', '99f15e3f-a084-48e5-9b6e-a1f58762915d', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('46288a19-d9a1-48cd-b26f-143183c6c20f', 62.5, false, NULL, '2025-12-29T13:44:30.179804+00:00', '99f15e3f-a084-48e5-9b6e-a1f58762915d', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('6ca31c3f-870e-4961-9e27-b55bf0aa89d0', 62.5, false, NULL, '2025-12-29T13:44:30.179804+00:00', '99f15e3f-a084-48e5-9b6e-a1f58762915d', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('ca1bfdf3-628d-4469-ba63-f4d158eeb240', 62.5, false, NULL, '2025-12-29T13:44:30.179804+00:00', '99f15e3f-a084-48e5-9b6e-a1f58762915d', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('01805ab1-2aab-453e-8b45-3abe26ca4ed6', 62.5, false, NULL, '2025-12-29T13:44:30.179804+00:00', '99f15e3f-a084-48e5-9b6e-a1f58762915d', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('a53386e6-fb4c-4c5a-9e93-82be4ee10180', 62.5, false, NULL, '2025-12-29T13:44:30.179804+00:00', '99f15e3f-a084-48e5-9b6e-a1f58762915d', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('3d0ec433-b2ee-4790-a6e6-3cbd98cc9674', 62.5, false, NULL, '2025-12-29T13:44:30.179804+00:00', '99f15e3f-a084-48e5-9b6e-a1f58762915d', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('5b6e0380-abe0-4c82-925d-39ce2a4081f8', 62.5, false, NULL, '2025-12-29T13:44:30.179804+00:00', '99f15e3f-a084-48e5-9b6e-a1f58762915d', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('90803264-8736-4fc1-b46a-f53774ff7171', 31.25, false, NULL, '2025-12-29T13:44:55.016837+00:00', '7920f303-0822-4e48-a9eb-3529f25c1cb1', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('c6432bd8-c065-47ea-bfdb-3e549fe89605', 31.25, false, NULL, '2025-12-29T13:44:55.016837+00:00', '7920f303-0822-4e48-a9eb-3529f25c1cb1', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('85954a33-9ceb-4fe7-a293-0b66225809f8', 31.25, false, NULL, '2025-12-29T13:44:55.016837+00:00', '7920f303-0822-4e48-a9eb-3529f25c1cb1', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('2b0f2ac0-bf64-48d8-be16-1bed97b2951c', 31.25, false, NULL, '2025-12-29T13:44:55.016837+00:00', '7920f303-0822-4e48-a9eb-3529f25c1cb1', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('9ee0fceb-4093-401c-b5b7-015d01c0b267', 31.25, false, NULL, '2025-12-29T13:44:55.016837+00:00', '7920f303-0822-4e48-a9eb-3529f25c1cb1', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('458914fc-3df1-4885-a89a-05520037621e', 31.25, false, NULL, '2025-12-29T13:44:55.016837+00:00', '7920f303-0822-4e48-a9eb-3529f25c1cb1', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('dcd6161c-c581-4c2f-9d19-633385877e70', 31.25, false, NULL, '2025-12-29T13:44:55.016837+00:00', '7920f303-0822-4e48-a9eb-3529f25c1cb1', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('77cb1889-c481-4b9e-a387-77a0be091549', 31.25, false, NULL, '2025-12-29T13:44:55.016837+00:00', '7920f303-0822-4e48-a9eb-3529f25c1cb1', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('497b300a-9d0b-4bfa-b3c6-6ef155c47bed', 50, false, NULL, '2025-12-29T13:45:11.149907+00:00', '8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('20d3c33b-9447-4d65-abf3-66ef471a1a50', 50, false, NULL, '2025-12-29T13:45:11.149907+00:00', '8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('33d1d0c8-5117-452f-821a-60b35443c952', 50, false, NULL, '2025-12-29T13:45:11.149907+00:00', '8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('07226c8f-0c63-491d-96e3-0017c67c685e', 50, false, NULL, '2025-12-29T13:45:11.149907+00:00', '8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('abac1f82-900f-4883-9a7a-dd11f0a880a3', 50, false, NULL, '2025-12-29T13:45:11.149907+00:00', '8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('afd075ee-4b66-41a5-b926-22c1d33655ef', 50, false, NULL, '2025-12-29T13:45:11.149907+00:00', '8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('cad1a2f3-8d3e-421b-8e56-78b63a88826b', 50, false, NULL, '2025-12-29T13:45:11.149907+00:00', '8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('652c8cce-5b50-46fd-812c-b241878cd1aa', 50, false, NULL, '2025-12-29T13:45:11.149907+00:00', '8b92b14c-c1cb-4f5f-b36c-87f37a598cdd', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('96018be0-07ef-4f1a-a67f-7f20f84dcf5c', 100, false, NULL, '2025-12-30T17:35:42.124+00:00', '47b25d0b-1aa4-46a8-ae99-e79c48f92323', 'dcfcb56f-b12f-46c6-aaae-baf500e6a33c') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('69d04f29-aee7-4465-be1e-78966ba7ff31', 100, false, NULL, '2025-12-30T17:35:42.124+00:00', '47b25d0b-1aa4-46a8-ae99-e79c48f92323', '3a4c5b1c-2570-4981-a4fe-a1a3863ac340') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('dd62898d-1f7a-4045-b05e-835056d8aa35', 100, false, NULL, '2025-12-30T17:35:42.124+00:00', '47b25d0b-1aa4-46a8-ae99-e79c48f92323', '048ba257-bc73-475f-adde-c5dc476559bc') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('9280db2e-9d22-4457-8e16-456beb2f181b', 100, false, NULL, '2025-12-30T17:35:42.124+00:00', '47b25d0b-1aa4-46a8-ae99-e79c48f92323', 'f2d83d40-8329-4935-b058-e02988e6b545') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('31704961-2b25-43ad-ac6e-3783f21506d6', 50, false, NULL, '2025-12-30T17:36:41.539772+00:00', '0d77ed03-4fa3-4187-af1b-5d43112624bb', 'dcfcb56f-b12f-46c6-aaae-baf500e6a33c') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('a699904c-2806-4d89-8d1b-e5e422a932cd', 50, false, NULL, '2025-12-30T17:36:41.539772+00:00', '0d77ed03-4fa3-4187-af1b-5d43112624bb', '3a4c5b1c-2570-4981-a4fe-a1a3863ac340') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('ddff82f9-b9c4-4fae-856a-fdb51efca56b', 50, false, NULL, '2025-12-30T17:36:41.539772+00:00', '0d77ed03-4fa3-4187-af1b-5d43112624bb', '048ba257-bc73-475f-adde-c5dc476559bc') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('30ca8f18-a8b4-43fc-8a26-210098c32711', 50, false, NULL, '2025-12-30T17:36:41.539772+00:00', '0d77ed03-4fa3-4187-af1b-5d43112624bb', 'f2d83d40-8329-4935-b058-e02988e6b545') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('850b5389-3b66-4799-ace7-27586889e68b', 62.5, false, NULL, '2025-12-30T17:37:02.82661+00:00', 'd484147b-1759-42b8-a98b-170ceeebfce4', 'dcfcb56f-b12f-46c6-aaae-baf500e6a33c') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('1b0fea58-a955-440e-b421-077bb5e19b46', 62.5, false, NULL, '2025-12-30T17:37:02.82661+00:00', 'd484147b-1759-42b8-a98b-170ceeebfce4', '3a4c5b1c-2570-4981-a4fe-a1a3863ac340') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('adc9b50e-ff2c-4a47-b7c0-9ea0235ba05a', 62.5, false, NULL, '2025-12-30T17:37:02.82661+00:00', 'd484147b-1759-42b8-a98b-170ceeebfce4', '048ba257-bc73-475f-adde-c5dc476559bc') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('89cda352-7570-42f3-9b9e-b4835a743e91', 62.5, false, NULL, '2025-12-30T17:37:02.82661+00:00', 'd484147b-1759-42b8-a98b-170ceeebfce4', 'f2d83d40-8329-4935-b058-e02988e6b545') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('18d5914c-0706-40df-9f49-3dfc2db219e8', 25, false, NULL, '2026-01-01T15:29:05.149592+00:00', '8d6e8772-e336-4659-b09c-9817d7f4f0ec', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('44451998-7ea6-4819-bb58-a2bb8f5a53c3', 25, false, NULL, '2026-01-01T15:29:05.149592+00:00', '8d6e8772-e336-4659-b09c-9817d7f4f0ec', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('85abcf9e-524c-4c0f-8cf7-314bef400349', 25, false, NULL, '2026-01-01T15:29:05.149592+00:00', '8d6e8772-e336-4659-b09c-9817d7f4f0ec', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('849da275-192a-41d8-9df2-587a6f1c1806', 25, false, NULL, '2026-01-01T15:29:05.149592+00:00', '8d6e8772-e336-4659-b09c-9817d7f4f0ec', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('b52ce287-f9b3-4217-a275-ff20bd7dc25b', 25, false, NULL, '2026-01-01T15:29:05.149592+00:00', '8d6e8772-e336-4659-b09c-9817d7f4f0ec', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('38598479-2687-411e-a474-89210eb2bba4', 25, false, NULL, '2026-01-01T15:29:05.149592+00:00', '8d6e8772-e336-4659-b09c-9817d7f4f0ec', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('7d5496ec-62d8-4934-bde6-cd14a00a8d04', 25, false, NULL, '2026-01-01T15:29:05.149592+00:00', '8d6e8772-e336-4659-b09c-9817d7f4f0ec', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('66a9569b-21eb-4a44-9cee-823e86ae291d', 25, false, NULL, '2026-01-01T15:29:05.149592+00:00', '8d6e8772-e336-4659-b09c-9817d7f4f0ec', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('076fca87-e037-452d-8bcb-654688f8c1e7', 37.5, false, NULL, '2026-01-01T15:29:36.021526+00:00', 'c5cf7228-f596-44ec-84b3-e5d5b1ea1570', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('a108728f-ab05-4717-b14e-6e286d765406', 37.5, false, NULL, '2026-01-01T15:29:36.021526+00:00', 'c5cf7228-f596-44ec-84b3-e5d5b1ea1570', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('5b7f2a9d-8a7c-4ada-bd61-87c67dc585a1', 37.5, false, NULL, '2026-01-01T15:29:36.021526+00:00', 'c5cf7228-f596-44ec-84b3-e5d5b1ea1570', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('4c6aee82-898b-40f5-913a-f443859680d0', 37.5, false, NULL, '2026-01-01T15:29:36.021526+00:00', 'c5cf7228-f596-44ec-84b3-e5d5b1ea1570', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('5e7ccf3b-5ae4-4c26-8cab-366d65be2f50', 37.5, false, NULL, '2026-01-01T15:29:36.021526+00:00', 'c5cf7228-f596-44ec-84b3-e5d5b1ea1570', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('2a224083-debd-4ced-95ae-718112c3a59a', 37.5, false, NULL, '2026-01-01T15:29:36.021526+00:00', 'c5cf7228-f596-44ec-84b3-e5d5b1ea1570', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('ee25620b-4b70-4f3c-b880-081c73a87386', 37.5, false, NULL, '2026-01-01T15:29:36.021526+00:00', 'c5cf7228-f596-44ec-84b3-e5d5b1ea1570', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('5c4b19b4-cb57-4273-85cd-350b012d0c29', 37.5, false, NULL, '2026-01-01T15:29:36.021526+00:00', 'c5cf7228-f596-44ec-84b3-e5d5b1ea1570', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('c8ea7894-65fc-4f16-a524-4465cb222818', 25, false, NULL, '2026-01-01T15:36:57.06488+00:00', '894946c6-f146-4878-9096-3a2e8f189f31', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('eb12fcdf-8548-439d-a498-ef07f03f0729', 25, false, NULL, '2026-01-01T15:36:57.06488+00:00', '894946c6-f146-4878-9096-3a2e8f189f31', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('774c44f8-bcc6-4975-b997-15352631ff51', 25, false, NULL, '2026-01-01T15:36:57.06488+00:00', '894946c6-f146-4878-9096-3a2e8f189f31', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('2801f08f-dfbb-4ca1-b065-0c5f2679f741', 25, false, NULL, '2026-01-01T15:36:57.06488+00:00', '894946c6-f146-4878-9096-3a2e8f189f31', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('c8d167f8-fce7-4094-a38b-9be58ce742bc', 25, false, NULL, '2026-01-01T15:36:57.06488+00:00', '894946c6-f146-4878-9096-3a2e8f189f31', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('cc31b43d-971d-4e04-b501-6e11483be401', 25, false, NULL, '2026-01-01T15:36:57.06488+00:00', '894946c6-f146-4878-9096-3a2e8f189f31', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('8bcf09f4-54f0-4827-9321-94f0820e0f82', 25, false, NULL, '2026-01-01T15:36:57.06488+00:00', '894946c6-f146-4878-9096-3a2e8f189f31', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('703835ea-b9de-4089-a9d7-3e7e5dfd26e4', 25, false, NULL, '2026-01-01T15:36:57.06488+00:00', '894946c6-f146-4878-9096-3a2e8f189f31', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('861d7a1f-6105-45bb-9c2f-9fd99d3545ae', 125, false, NULL, '2026-01-05T15:07:26.875716+00:00', '2d011ff8-82a5-4ece-b344-1c6255ccc6cb', '29bb9277-ff64-4e0d-87f5-c210d580f4fb') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('bec24adc-ad56-4d53-957f-74a50d737fac', 125, false, NULL, '2026-01-05T15:07:26.875716+00:00', '2d011ff8-82a5-4ece-b344-1c6255ccc6cb', '5233292b-012a-44d1-9fa1-961e7b6cc4ad') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('802a4665-5904-49ed-a51e-9f44fc237cac', 125, false, NULL, '2026-01-05T15:07:26.875716+00:00', '2d011ff8-82a5-4ece-b344-1c6255ccc6cb', '6b312f36-3bd2-4ed2-98a7-c135e6dca67b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('8e193cf3-e295-4293-a1f9-b2b545810423', 125, false, NULL, '2026-01-05T15:07:26.875716+00:00', '2d011ff8-82a5-4ece-b344-1c6255ccc6cb', 'be4f9a42-5c80-4359-b86f-87723054f77f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('b12649a8-a339-410f-a353-3402a6adcfdb', 100, false, NULL, '2026-01-09T10:37:16.523542+00:00', '98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', '8cfa0564-17b4-4d77-8e96-c27ae0cbd8c0') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('1ac7278b-705a-45a4-893a-23cda8985656', 100, false, NULL, '2026-01-09T10:37:16.523542+00:00', '98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', '3a459916-08ec-44d6-a327-668aa1ed9fa8') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('efc212c6-2564-4527-b8e6-cef4f83fac23', 100, false, NULL, '2026-01-09T10:37:16.523542+00:00', '98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', 'ac3cd271-3e7a-4f9c-a442-4bcad8893874') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('5f1fad19-f964-4710-9072-694733185632', 100, false, NULL, '2026-01-09T10:37:16.523542+00:00', '98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', 'de84a070-b5e8-4831-a97e-fc8ca9d1cfb0') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('a3ca556c-75e7-4724-b551-29946bdd55d9', 100, false, NULL, '2026-01-09T10:37:16.523542+00:00', '98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', '724f2a1d-2386-430f-bfe4-e4de2bb56a5e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('4bde64b2-1da1-4d4e-a058-263f846efec4', 100, false, NULL, '2026-01-09T10:37:16.523542+00:00', '98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', 'bef81a05-3fcc-4cf5-915d-942e14d40d88') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('ca43aa99-bb97-4605-ad16-433e8e2ec720', 100, false, NULL, '2026-01-09T10:37:16.523542+00:00', '98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', 'b973a016-eab8-46d0-b71d-6e95daf26962') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('f028afca-8e22-481c-877f-9f839d2fc92a', 100, false, NULL, '2026-01-09T10:37:16.523542+00:00', '98ec2cf9-54e0-42c4-b4b2-f7bc04e57510', '51c6138a-a4f7-4d41-b096-975bdf51661f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('e1af74f2-fe2c-4a6b-b3e3-60664588d875', 60.43, false, NULL, '2026-03-27T05:55:24.094424+00:00', '177bcd92-4fbe-4404-bac9-e44abbbc0cbd', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('3ce15551-6a51-4ba2-8181-f6d5653d9595', 60.43, false, NULL, '2026-03-27T05:55:24.094424+00:00', '177bcd92-4fbe-4404-bac9-e44abbbc0cbd', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('4f755180-73cc-44b5-a770-63151ec787ef', 60.43, false, NULL, '2026-03-27T05:55:24.094424+00:00', '177bcd92-4fbe-4404-bac9-e44abbbc0cbd', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('ab7a66a5-aed4-406b-bc16-cc8f4150c7ad', 60.43, false, NULL, '2026-03-27T05:55:24.094424+00:00', '177bcd92-4fbe-4404-bac9-e44abbbc0cbd', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('9e68b365-e641-4cab-9347-b467aeb24e37', 60.43, false, NULL, '2026-03-27T05:55:24.094424+00:00', '177bcd92-4fbe-4404-bac9-e44abbbc0cbd', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('2cda44c2-5e8a-434f-8411-b36f9b652d7f', 60.43, false, NULL, '2026-03-27T05:55:24.094424+00:00', '177bcd92-4fbe-4404-bac9-e44abbbc0cbd', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('b1f25662-253c-48c7-a659-eb405c20916a', 60.43, false, NULL, '2026-03-27T05:55:24.094424+00:00', '177bcd92-4fbe-4404-bac9-e44abbbc0cbd', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('eeb45474-b63f-489b-8f9c-400d18876e02', 60.43, false, NULL, '2026-03-27T05:55:24.094424+00:00', '177bcd92-4fbe-4404-bac9-e44abbbc0cbd', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('8c568576-d25e-497d-8da9-dc16c2368e2b', 60.75, false, NULL, '2026-03-27T05:56:57.376833+00:00', '82372052-5849-411f-91f6-80bd7f585d62', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('a9b7e558-446c-49a9-ab7f-bf1034fc88df', 60.75, false, NULL, '2026-03-27T05:56:57.376833+00:00', '82372052-5849-411f-91f6-80bd7f585d62', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('bc7a1480-e95d-404d-97f7-b0856db4f88e', 60.75, false, NULL, '2026-03-27T05:56:57.376833+00:00', '82372052-5849-411f-91f6-80bd7f585d62', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('06611146-1af5-489a-bf1f-2874bc092b6b', 60.75, false, NULL, '2026-03-27T05:56:57.376833+00:00', '82372052-5849-411f-91f6-80bd7f585d62', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('cb391c89-0821-4aca-8b24-21c0e6d826ca', 60.75, false, NULL, '2026-03-27T05:56:57.376833+00:00', '82372052-5849-411f-91f6-80bd7f585d62', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('c45cafb8-f809-473f-ac66-061c7804f983', 60.75, false, NULL, '2026-03-27T05:56:57.376833+00:00', '82372052-5849-411f-91f6-80bd7f585d62', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('29a20382-c7fc-4a87-9e8b-57b51ebc6159', 60.75, false, NULL, '2026-03-27T05:56:57.376833+00:00', '82372052-5849-411f-91f6-80bd7f585d62', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('a717dcb8-7da5-4127-9fc8-2ed022b1c958', 60.75, false, NULL, '2026-03-27T05:56:57.376833+00:00', '82372052-5849-411f-91f6-80bd7f585d62', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('4a2824a9-8110-4de7-8c0c-1377d8f242a6', 55.13, false, NULL, '2026-03-28T06:16:30.346883+00:00', '1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', 'fdf6b82d-8501-4197-b47f-83ab5809872b') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('6e83df1b-8ae6-4391-94e6-4c1cf235b8dc', 55.13, false, NULL, '2026-03-28T06:16:30.346883+00:00', '1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', '52539684-272e-414a-8c58-6e7c6c2a5858') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('bc75b6a9-6dc9-4a21-afce-9ea4b44d9bff', 55.13, false, NULL, '2026-03-28T06:16:30.346883+00:00', '1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', '95dc74e9-c1d9-45df-98e6-727375680e7d') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('03ffc8b0-839c-4bd7-a6b6-525f4f0fbe2a', 55.13, false, NULL, '2026-03-28T06:16:30.346883+00:00', '1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', '762c5cc9-4c49-4721-b5c6-3cde4cc7e2f5') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('50d4b234-db27-4899-b3d8-690ae224f66b', 55.13, false, NULL, '2026-03-28T06:16:30.346883+00:00', '1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', '446f5d9b-e10d-44dd-92dd-fba4b504999f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('414135c6-d255-4fb8-9d79-7b5c87696e44', 55.13, false, NULL, '2026-03-28T06:16:30.346883+00:00', '1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', 'e82fe03e-5a5e-4b07-9ee6-023e4b79da08') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('7797e12d-68c0-4162-9c9b-ad0c05b22dfc', 55.13, false, NULL, '2026-03-28T06:16:30.346883+00:00', '1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', 'fecea80c-5f03-4fb4-886f-e135059a4b8e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.expense_shares (id, amount, is_paid, paid_at, created_at, expense_id, participant_id) VALUES ('216c4591-26c3-4a93-8cb1-b084069955a0', 55.13, false, NULL, '2026-03-28T06:16:30.346883+00:00', '1e7b4ec5-01b6-4212-ad0a-c07bd841e8a8', '74f27783-5710-4993-9ef5-512fb977f120') ON CONFLICT (id) DO NOTHING;

-- schedule_activities (1 rows)
INSERT INTO public.schedule_activities (id, notes, title, category, currency, day_date, end_time, event_id, location, created_at, sort_order, start_time, updated_at, description, contact_name, location_url, requirements, contact_email, contact_phone, estimated_cost, cost_per_person, responsible_participant_id) VALUES ('5b700f0f-5bda-4454-a13d-e45da4987882', '', 'Test', 'activity', 'EUR', '2025-12-31', '11:00:00', '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '', '2026-01-03T10:23:40.72293+00:00', 0, '10:00:00', '2026-01-03T10:23:40.72293+00:00', '', '', '', ARRAY[]::TEXT[], '', '', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

-- message_templates (250 rows)
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e51c99d0-5c70-472d-b822-831874276bd9', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 1, '2025-12-28T22:58:27.528802+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('7f51c737-cb6b-4836-95bb-e994c7e73866', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 2, '2025-12-28T22:58:27.528802+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('cf4fff5b-bf1e-4f28-b706-1cf3dcab404b', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 3, '2025-12-28T22:58:27.528802+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a37b1cfd-540e-40dd-911e-7b9bed283250', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 4, '2025-12-28T22:58:27.528802+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c8d7e078-3259-4dfc-b632-78fdfe774ab6', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 5, '2025-12-28T22:58:27.528802+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8e71bdaf-a927-4051-865f-564aee833f4a', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 6, '2025-12-28T22:58:27.528802+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('35403a65-868a-4242-b6cd-d9b60efcad0e', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 7, '2025-12-28T22:58:27.528802+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8e1ad8c4-feae-420d-92e8-e5562c040aeb', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 8, '2025-12-28T22:58:27.528802+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('39e168e3-3f08-4309-b9bb-800046d743a0', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 9, '2025-12-28T22:58:27.528802+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('3c0dab53-44e9-41e8-9c77-d79b640370dc', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '9ecaeb69-9b59-4f57-bac6-14dba36a9f51', '2025-12-28T22:58:27.528802+00:00', 10, '2025-12-28T22:58:27.528802+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c65e1434-ab08-469b-8d05-5cc21a0cc3ec', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 1, '2025-12-28T23:13:31.73128+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d58c82ae-0f5c-4777-b600-fa8f940fb161', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 2, '2025-12-28T23:13:31.73128+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('fa74f345-be41-438d-80b6-5ee735e5637a', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 3, '2025-12-28T23:13:31.73128+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('18f85e58-201f-4bd1-9ea1-223a953996a7', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 4, '2025-12-28T23:13:31.73128+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('01563a26-d96a-49ab-8d7e-1b97512c93fd', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 5, '2025-12-28T23:13:31.73128+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('59cfa265-9e1a-411c-92df-e10657a58995', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 6, '2025-12-28T23:13:31.73128+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c29c4baa-bcd0-401a-8c7e-79d671ff0e6e', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 7, '2025-12-28T23:13:31.73128+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c0979405-6345-4d55-9d33-4d7019c10239', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 8, '2025-12-28T23:13:31.73128+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d6f0fe1b-5ac8-437e-8397-fe807fe6f34a', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 9, '2025-12-28T23:13:31.73128+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('af5fd975-5f6d-4e82-b45b-7f798bb4ac0b', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '217ef8c4-ed71-49c5-b02f-efa12a590c07', '2025-12-28T23:13:31.73128+00:00', 10, '2025-12-28T23:13:31.73128+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('566ccb31-2aa1-4fc7-a076-e79fa93a1408', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 1, '2025-12-28T23:17:28.922234+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('1faf73a3-ce4c-4be2-b526-eed388c42dfc', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 2, '2025-12-28T23:17:28.922234+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('4aedf4ea-e134-4772-b0c2-2929ac261bd2', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 3, '2025-12-28T23:17:28.922234+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e6b388a6-7609-4cb3-9233-a2ec1d03c774', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 4, '2025-12-28T23:17:28.922234+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8ba4f30a-cb58-4dc0-aa65-a770ca8cc15b', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 5, '2025-12-28T23:17:28.922234+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c211dd4e-2b72-45f0-bf62-086243193166', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 6, '2025-12-28T23:17:28.922234+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('9d2b0413-e97d-4db3-952a-d3774d98b176', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 7, '2025-12-28T23:17:28.922234+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('1ad86217-ce04-437b-8bb7-f74ecec41c42', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 8, '2025-12-28T23:17:28.922234+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('6902ce2f-ff29-4827-aa47-7fbad17e3b32', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 9, '2025-12-28T23:17:28.922234+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('034664fa-e415-4acc-b77c-81f31f52a658', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'a28ae563-4096-42ef-9499-96e9523ee3a5', '2025-12-28T23:17:28.922234+00:00', 10, '2025-12-28T23:17:28.922234+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('3f3f625f-9c1c-463e-a746-a1293b4c04b3', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 1, '2025-12-28T23:53:56.915069+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e7a5094f-59fa-4900-8768-03e07308da9e', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 2, '2025-12-28T23:53:56.915069+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8f24b6b1-2590-405d-8512-04138f31e00c', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 3, '2025-12-28T23:53:56.915069+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('cf700760-da5d-47d2-b0a6-9507cfa29d2b', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 4, '2025-12-28T23:53:56.915069+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b067328a-2c71-4c81-b483-458c46a5accc', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 5, '2025-12-28T23:53:56.915069+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('509e6427-6325-46d9-9c56-6e2030eed535', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 6, '2025-12-28T23:53:56.915069+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('4b6d6ede-8bfa-4577-a9a5-a4ba98b126b5', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 7, '2025-12-28T23:53:56.915069+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('5b902800-404a-492d-b60f-26749013c682', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 8, '2025-12-28T23:53:56.915069+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('ed775d62-5e52-425f-94e7-d7d13d3eb0b7', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 9, '2025-12-28T23:53:56.915069+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('4d80ec31-d546-4d04-862b-72a51f6e4a11', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'cb227db5-84cd-4dfa-9712-0c6ce26d695e', '2025-12-28T23:53:56.915069+00:00', 10, '2025-12-28T23:53:56.915069+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('31ee40c0-0456-4420-81b8-7653dbce48d2', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 1, '2025-12-29T00:14:57.02547+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('515386a3-b56a-4cba-a4ed-067e9daa65bc', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 2, '2025-12-29T00:14:57.02547+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c2fbc76d-9795-4d40-a792-7919de1b8cb9', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 3, '2025-12-29T00:14:57.02547+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('60747dbe-b803-4ccb-b438-f7f74760e30e', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 4, '2025-12-29T00:14:57.02547+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('ad9b7ed5-dc18-4fe3-af18-ca96aaf856e8', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 5, '2025-12-29T00:14:57.02547+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f8084e49-ac99-45bc-9714-13639056314f', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 6, '2025-12-29T00:14:57.02547+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('efe79748-2575-41fe-aa3b-ad022c502a3e', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 7, '2025-12-29T00:14:57.02547+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b42e311f-c577-4d97-90ba-7829c0d2b8e0', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 8, '2025-12-29T00:14:57.02547+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('84aa8c54-97d6-4c3a-99af-9fa332aed96e', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 9, '2025-12-29T00:14:57.02547+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('cdcedacb-9924-4215-96ff-317336463c30', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '8230431a-939d-4bb2-ad8d-5602137483cf', '2025-12-29T00:14:57.02547+00:00', 10, '2025-12-29T00:14:57.02547+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e35392e3-0a70-4a3d-bbc8-1372efb8ec1a', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 1, '2025-12-29T02:41:08.941739+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('6279d53b-5b98-45cb-8433-064ac267980d', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 2, '2025-12-29T02:41:08.941739+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f8c56ce0-6d28-4bdc-9d07-dd8f045f2fa5', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 3, '2025-12-29T02:41:08.941739+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('1f74af37-7721-4900-bb44-7310abd6b003', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 4, '2025-12-29T02:41:08.941739+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('0ef753e2-0f97-45ab-845e-cba35bbe74c8', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 5, '2025-12-29T02:41:08.941739+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('9896404c-142a-4c5c-a0c5-caac143bbb9c', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 6, '2025-12-29T02:41:08.941739+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b54268e2-b74f-4ba6-b855-94eb09be207b', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 7, '2025-12-29T02:41:08.941739+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('31088e17-be69-417a-a73f-2031282fc80d', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 8, '2025-12-29T02:41:08.941739+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f21d5857-b8df-424f-b06f-28bb56332ed8', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 9, '2025-12-29T02:41:08.941739+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('33df0218-dc8d-4273-a798-bb373328a822', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '54fba1ca-a381-4aef-82f9-64f2637d1bc9', '2025-12-29T02:41:08.941739+00:00', 10, '2025-12-29T02:41:08.941739+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('753705cf-4c74-4baf-8a64-1af2993dc20b', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 1, '2025-12-29T09:06:06.878022+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('49d738c4-303f-4448-9806-eac02266aa92', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 2, '2025-12-29T09:06:06.878022+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('30322db0-60dd-4bf9-8a6b-b0cef772b4a6', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 3, '2025-12-29T09:06:06.878022+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e6eab24d-74e2-4e89-b382-e4c62fc084dd', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 4, '2025-12-29T09:06:06.878022+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b9ed8bfa-726f-4ce7-803c-5428e5db44af', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 5, '2025-12-29T09:06:06.878022+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a33c3a77-7d14-4047-a1d6-d04963c59050', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 6, '2025-12-29T09:06:06.878022+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('fe65cf48-e68f-43e4-989e-d40f0b5937b0', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 7, '2025-12-29T09:06:06.878022+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('41f0c847-747a-4e1b-a9df-0b51542ccf8f', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 8, '2025-12-29T09:06:06.878022+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('28fa9506-9ee2-4440-9a37-0f3975bc5d14', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 9, '2025-12-29T09:06:06.878022+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b407a763-079c-4a04-a71f-032c34808734', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'b865a5b7-83e9-4e0d-bf37-b93c280fa344', '2025-12-29T09:06:06.878022+00:00', 10, '2025-12-29T09:06:06.878022+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('481fea08-5080-4954-8f0e-2f698e5fc99e', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 1, '2025-12-29T15:59:23.876011+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('5093799e-b1d1-4d8f-af5d-e6962bc9232f', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 2, '2025-12-29T15:59:23.876011+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('132dd87f-1554-46d2-914d-54bf0f9cbaf5', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 3, '2025-12-29T15:59:23.876011+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f2a62a10-585a-4111-808d-16f629a76e9e', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 4, '2025-12-29T15:59:23.876011+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b0e17486-6b85-4a38-a189-910a64a5945a', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 5, '2025-12-29T15:59:23.876011+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f8fc8061-8e9f-4b00-92fb-2a3f5c5d1c46', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 6, '2025-12-29T15:59:23.876011+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('120b8c8f-f741-41db-bf2f-4e9d1b8fe9cf', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 7, '2025-12-29T15:59:23.876011+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('650665bb-cebb-42a0-b186-498b12346d5b', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 8, '2025-12-29T15:59:23.876011+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('5d7b2251-b5f6-4861-a434-084e53f3806e', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 9, '2025-12-29T15:59:23.876011+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a731a8e4-cf19-46ef-b12e-e4f36b43aeab', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'f6edfeb3-56d6-4d4b-a623-5b0684769e0d', '2025-12-29T15:59:23.876011+00:00', 10, '2025-12-29T15:59:23.876011+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('dda6e6a0-263a-420c-9471-cf75b53e76d8', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 1, '2025-12-29T16:29:42.155288+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a664f274-2554-47c5-a797-e9480d402027', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 2, '2025-12-29T16:29:42.155288+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c1bff606-4a92-4f97-91e3-bb2bfbac0719', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 3, '2025-12-29T16:29:42.155288+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('6341f094-cca3-435b-b6c1-a6976d8bf35a', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 4, '2025-12-29T16:29:42.155288+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a5db85da-4721-48c7-aa4b-47221fc937c9', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 5, '2025-12-29T16:29:42.155288+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('49ecc689-1f60-4944-9a2c-826528adb63c', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 6, '2025-12-29T16:29:42.155288+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f41cf913-19c2-432a-a763-ab79e1148f27', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 7, '2025-12-29T16:29:42.155288+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('7f8f535f-6da6-45a1-9897-92e760af0b0e', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 8, '2025-12-29T16:29:42.155288+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('73a9b074-b84d-4d09-abcf-b21aeb874272', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 9, '2025-12-29T16:29:42.155288+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('0ecca36b-3bbf-4918-ad58-53d9224fc5cf', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'c19829a5-491c-400d-b61d-2569922b50ee', '2025-12-29T16:29:42.155288+00:00', 10, '2025-12-29T16:29:42.155288+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b2b5f932-4609-4ef9-9460-34b2ef6ccaa8', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 1, '2025-12-29T17:01:04.130509+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e8722aa0-fc47-40fc-9d4e-481bac3312cb', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 2, '2025-12-29T17:01:04.130509+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('ec5e7fe4-9b95-41b2-a408-62a664b1c304', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 3, '2025-12-29T17:01:04.130509+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('7498ebff-2306-428e-8485-5945f50fc02b', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 4, '2025-12-29T17:01:04.130509+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f7cd76ab-d51c-4069-aa1e-b859e9eb1b0e', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 5, '2025-12-29T17:01:04.130509+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d0a4d589-c520-4630-8888-4deff0be751f', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 6, '2025-12-29T17:01:04.130509+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('454c90b8-a65d-4916-bf76-626b8eef01ce', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 7, '2025-12-29T17:01:04.130509+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('7357eb7a-061b-4ce7-915a-d550f7335ee2', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 8, '2025-12-29T17:01:04.130509+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f79d4b2b-78b1-43af-bd45-4ed4340f5917', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 9, '2025-12-29T17:01:04.130509+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e82e9154-dbd7-4a5d-a9fe-f976913a2d99', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '10f78522-1a91-4f9b-8783-44ac72a5b82c', '2025-12-29T17:01:04.130509+00:00', 10, '2025-12-29T17:01:04.130509+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f529d5e0-f654-4f1e-a85c-20e3718635a0', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 1, '2025-12-29T17:22:15.576681+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('3733a2ca-0204-4806-ac66-cff709d3d663', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 2, '2025-12-29T17:22:15.576681+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d38acf34-c6b8-4061-8324-31735c0ff833', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 3, '2025-12-29T17:22:15.576681+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('5e9cef3b-541d-47d9-aafc-74e91fd0ee10', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 4, '2025-12-29T17:22:15.576681+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('27b733b0-aadf-4b10-a46d-00805c6b9eb8', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 5, '2025-12-29T17:22:15.576681+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('eff67cb8-30e1-4efe-bc5f-c2c30cf7a501', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 6, '2025-12-29T17:22:15.576681+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('34917f5b-c537-45f3-a4b5-1e683b38f9ee', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 7, '2025-12-29T17:22:15.576681+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('98bf362f-ac56-4f92-8626-99337b62f055', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 8, '2025-12-29T17:22:15.576681+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('ceb17378-de5f-4b6c-98d3-021f09d785b0', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 9, '2025-12-29T17:22:15.576681+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8887def8-638c-4852-845c-51bb8b70a30f', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '2025-12-29T17:22:15.576681+00:00', 10, '2025-12-29T17:22:15.576681+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('78b957ea-2755-46a6-8f57-d7ffc2f87a72', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 8, '2026-01-02T13:18:14.757521+00:00', '🎤', 'motivation', 'Heute feiern wir Rebecca!

🎈 Spaß haben
🎈 Das Geburtstagskind feiern
🎈 Gute Stimmung verbreiten

Los geht''s! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('013bce66-dc8e-47a8-86a5-82b60a6d74bc', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 1, '2025-12-29T17:53:46.337224+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c8497ca3-5b23-4887-8021-a32a8388800b', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 2, '2025-12-29T17:53:46.337224+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('29445ced-b0cb-496e-98bd-4f9ce7b5343d', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 3, '2025-12-29T17:53:46.337224+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('4b06ba57-1036-48f3-b97c-068f6412991e', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 4, '2025-12-29T17:53:46.337224+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('0842afd5-263a-4100-b6ec-0829d1bfc0b3', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 5, '2025-12-29T17:53:46.337224+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c5035a0b-dcdf-4bb6-9856-c4ee03d446b8', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 6, '2025-12-29T17:53:46.337224+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('505613fa-a40d-41ae-8b93-6577e5d06035', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 7, '2025-12-29T17:53:46.337224+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c3f82c89-4cae-4810-9fcc-d5a10459818e', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 8, '2025-12-29T17:53:46.337224+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d7fd007c-30d7-4513-a582-d41bfd89ccc7', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 9, '2025-12-29T17:53:46.337224+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('46c77656-100b-47ce-b936-2fa6aceedb51', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'a7888282-cc6b-4e61-b85e-03516a25e853', '2025-12-29T17:53:46.337224+00:00', 10, '2025-12-29T17:53:46.337224+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c24cfdaa-2576-4f7d-a949-4a7d7314c457', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 1, '2025-12-30T12:45:07.509984+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c0fb02b7-c284-4d84-910c-29d36ba2abac', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 2, '2025-12-30T12:45:07.509984+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('49d2b9e3-7387-4090-aa9b-54a029ba8f4c', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 3, '2025-12-30T12:45:07.509984+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('2e1198c1-17ba-4984-be88-9191b93ce9f7', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 4, '2025-12-30T12:45:07.509984+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a7f132a3-3b36-4a6a-aed5-5910b627ea59', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 5, '2025-12-30T12:45:07.509984+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d475b558-abc3-4a17-8ef3-ccf0eaea4c6b', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 6, '2025-12-30T12:45:07.509984+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('53bbe933-ffda-4517-82b7-2e4d478ed194', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 7, '2025-12-30T12:45:07.509984+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('39d277cb-f5e5-44a0-bc8d-fb273f718c19', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 8, '2025-12-30T12:45:07.509984+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('07ef2df0-de06-4631-8cef-542a97069292', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 9, '2025-12-30T12:45:07.509984+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c3dfe456-4805-4bae-adc4-1699aaaad1d1', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '21ed18f7-35fa-4854-9c2d-934361e28bf4', '2025-12-30T12:45:07.509984+00:00', 10, '2025-12-30T12:45:07.509984+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('880b93d9-9316-42a6-bb7b-345db11ba853', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 1, '2025-12-30T17:06:26.868165+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d670c17b-dc1c-49f9-a770-85dc20200d63', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 2, '2025-12-30T17:06:26.868165+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8f3a6b07-014e-4546-a72d-05a3124790de', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 3, '2025-12-30T17:06:26.868165+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('cf7b5288-0476-4f54-9af3-869ab5212ec7', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 4, '2025-12-30T17:06:26.868165+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8859f64c-47ff-4364-a299-01ae19a5b281', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 5, '2025-12-30T17:06:26.868165+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a2a46f8a-d22a-44b7-b36a-814196289538', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 6, '2025-12-30T17:06:26.868165+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('5f2e74f0-7b2b-41f8-a912-87406bd8aeb3', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 7, '2025-12-30T17:06:26.868165+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('ca5e3ff4-2e03-4d46-bfcc-b5adbb19e2a5', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 8, '2025-12-30T17:06:26.868165+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('fffecac6-8e57-4fca-9a8c-b6a20c0d3212', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 9, '2025-12-30T17:06:26.868165+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('66a858a8-1b13-44b9-8563-9a6b040af801', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'cf14b759-e3bb-4d4a-9690-05847dbf3479', '2025-12-30T17:06:26.868165+00:00', 10, '2025-12-30T17:06:26.868165+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('783c7857-24c7-4b87-ad66-5bbd64e1a439', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 1, '2026-01-01T11:53:23.362577+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('15d14540-ba25-4253-b11b-2f0c446fb106', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 2, '2026-01-01T11:53:23.362577+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('cba66970-09a8-4156-9935-edbad4b11227', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 3, '2026-01-01T11:53:23.362577+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('84c6a229-a202-4a7b-88ea-7c583de8c22d', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 4, '2026-01-01T11:53:23.362577+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('6c55028b-9825-4e91-a48e-05407f323f6d', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 5, '2026-01-01T11:53:23.362577+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('cfcc83d0-fe20-4d53-927f-724e74e53078', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 6, '2026-01-01T11:53:23.362577+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('3a07c8e4-e080-4530-9f16-f63ae25ec09a', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 7, '2026-01-01T11:53:23.362577+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('40d61023-a90f-4ad5-878e-1655373e8e65', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 8, '2026-01-01T11:53:23.362577+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c90c7028-0612-439f-8b16-e809081b8932', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 9, '2026-01-01T11:53:23.362577+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8d50a483-1a67-462e-af3a-401ad41c57ed', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '10aaeae8-c897-4b06-9799-bdd3b8ec3133', '2026-01-01T11:53:23.362577+00:00', 10, '2026-01-01T11:53:23.362577+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('0d5f63ce-634e-4f2d-aed1-52fd4f1f7f37', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 1, '2026-01-02T08:53:30.116125+00:00', '🎉', 'kickoff', 'Hey Männer!
Einer aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.

👉 Bitte füllt die Umfrage aus: {{link}}
Code: {{code}}

Ziel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('71745a64-233a-4ea1-a5f9-d76ad142c240', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 2, '2026-01-02T08:53:30.116125+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('bbfc0955-b3b6-41f7-9109-f43bd909341e', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 3, '2026-01-02T08:53:30.116125+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('6b8abbe6-b5eb-4977-b10d-59d2207726d0', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 4, '2026-01-02T08:53:30.116125+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('09cbdfca-5a95-4bdd-9891-77af539527af', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 5, '2026-01-02T08:53:30.116125+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('ae649c94-b1f9-4c36-8e97-3b0ea6c00611', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 6, '2026-01-02T08:53:30.116125+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('571dc133-3f0a-40bb-b729-ab6c9db4777f', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 7, '2026-01-02T08:53:30.116125+00:00', '🎁', 'gifts', 'Wer bringt was für {{honoree_name}}?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('03ab4e5e-5f27-4fb1-b7a1-fbb78bebbe75', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 8, '2026-01-02T08:53:30.116125+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('9cb8f0ee-e549-4487-b1f6-47b1fd55c23a', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 9, '2026-01-02T08:53:30.116125+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('6f7b497e-2eaf-49a6-8e85-731585bba139', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-02T08:53:30.116125+00:00', 10, '2026-01-02T08:53:30.116125+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f6c7861a-9a3a-4839-ab1a-b0e4b243bcfa', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 1, '2026-01-02T09:05:24.604925+00:00', '🎉', 'kickoff', 'Hey Leute! 🌍

Wir planen einen gemeinsamen Trip! ✈️

Damit wir das perfekte Abenteuer organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Reiseziel-Wahl

Je schneller alle antworten, desto schneller können wir buchen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('57492be2-75b0-4a2b-a88f-a36f69bb012b', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 2, '2026-01-02T09:05:24.604925+00:00', '💸', 'budget_poll', 'Damit wir planen können – was darf der Trip kosten (pro Person, inkl. Unterkunft)?

🔘 bis 200 € – Budget-Reise
🔘 200–500 € – Mittelklasse
🔘 500–1000 € – Komfortabel
🔘 1000 €+ – Luxus

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8a785e81-3dd1-494a-b64b-1ceb4a0169d9', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 3, '2026-01-02T09:05:24.604925+00:00', '🏨', 'accommodation', 'Wo übernachten wir am liebsten?

🔘 Hotel (bequem)
🔘 Airbnb (gemeinsame Unterkunft)
🔘 Hostel (günstig & social)
🔘 Camping (Abenteuer)

Schreibt eure Präferenz!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8e9646ca-0815-429f-85db-a7a322224919', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 4, '2026-01-02T09:05:24.604925+00:00', '🧳', 'packing_list', 'Packliste für den Trip:
✅ Ausweis/Reisepass
✅ Handy & Ladegerät
✅ Powerbank
✅ Wetterangepasste Kleidung
✅ Bequeme Schuhe
✅ Kamera
✅ Gute Laune 🌟') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('186d4305-9d16-4e5b-bc1b-abe29c3d1334', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 5, '2026-01-02T09:05:24.604925+00:00', '🗺️', 'travel_info', 'Reiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt/fliegt mit wem?
Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Reisepartner von [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('08396551-94a5-4e60-98f3-7452e6ebbd07', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 6, '2026-01-02T09:05:24.604925+00:00', '📢', 'countdown', 'Nur noch 3 Tage bis zum Trip! 🌍

✅ Koffer gepackt?
✅ Tickets gesichert?
✅ Reisedokumente bereit?
✅ Unterkunft bestätigt?

Der Countdown läuft! ✈️') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('37242585-cdb0-4db9-94b5-9d77fdd3cd5b', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 7, '2026-01-02T09:05:24.604925+00:00', '🎁', 'gifts', 'Organisatorisches für die Gruppe:
📋 Wer übernimmt welche Buchung?
📋 Gemeinsame Kasse einrichten?
📋 Notfallnummern austauschen

Bitte kurz abstimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('4f267353-4356-4094-bbb8-f36e4553670f', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 8, '2026-01-02T09:05:24.604925+00:00', '🎤', 'motivation', 'Es geht los! 🌍✈️

Was wir heute vorhaben:
🗺️ Abenteuer erleben
🗺️ Neue Orte entdecken
🗺️ Gemeinsam Spaß haben

Auf geht''s! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('68f4937b-7062-4b59-a0a0-8f8c7eb8731d', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 9, '2026-01-02T09:05:24.604925+00:00', '🧾', 'payment', 'Finanz-Update für den Trip:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Danke fürs prompte Überweisen! 🙏') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('5a4eb777-9720-4ac2-a970-06bbc6623b7b', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '0851b13c-28e6-4c1a-9532-6bcb7fd11562', '2026-01-02T09:05:24.604925+00:00', 10, '2026-01-02T09:05:24.604925+00:00', '✅', 'date_locked', 'Der Reisetermin steht!

📅 {{locked_date}}

Bitte alle Urlaub nehmen und Tickets buchen! ✈️🌍') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('1f0db465-b446-4244-b1c0-5a980adeb641', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 1, '2026-01-02T13:18:14.757521+00:00', '🎉', 'kickoff', 'Hey Leute! 🎉

Wir planen eine Überraschungsfeier für Rebecca! 🎂

Damit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Location-Wahl

Je schneller alle antworten, desto schneller können wir loslegen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('3db06c13-52b6-4e96-953b-785f6287da4d', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 2, '2026-01-02T13:18:14.757521+00:00', '💸', 'budget_poll', 'Damit keiner am Ende pleite ist – was darf die Feier kosten (pro Person)?

🔘 bis 50 € – Klein aber fein
🔘 50–100 € – Realistisch
🔘 100 €+ – Richtig feiern

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('169a4fc8-0a4c-4ac8-b77c-1afff0427edf', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 3, '2026-01-02T13:18:14.757521+00:00', '🏨', 'accommodation', 'Falls wir länger feiern oder weiter weg fahren – wo übernachten?

🔘 Hotel
🔘 Airbnb
🔘 Bei jemandem zu Hause
🔘 Keine Übernachtung nötig') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('5bb00f3d-cfc5-43c8-8b67-c83ee0315241', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 4, '2026-01-02T13:18:14.757521+00:00', '🧳', 'packing_list', 'Bitte mitbringen:
✅ Geschenk für Rebecca
✅ Gute Laune
✅ Bequeme Kleidung
✅ Evtl. Handyladegerät
✅ Bargeld für spontane Ausgaben') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('bbedd93c-a545-4f40-a1a0-e8c60d29a1f0', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 5, '2026-01-02T13:18:14.757521+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('1f834112-c683-4248-a166-f17c884881e8', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 6, '2026-01-02T13:18:14.757521+00:00', '📢', 'countdown', 'Nur noch 3 Tage bis zur Feier für Rebecca! 🎂

✅ Geschenk besorgt?
✅ Outfit klar?
✅ Treffpunkt notiert?

Wir sehen uns bald! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('31c2eb89-47de-4733-bd17-b58a233950bb', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 7, '2026-01-02T13:18:14.757521+00:00', '🎁', 'gifts', 'Wer bringt was für Rebecca?
🎁 Hauptgeschenk (Sammelaktion?)
🎁 Karte unterschreiben
🎁 Deko mitbringen

Bitte kurz in die Gruppe schreiben, damit wir koordiniert sind!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e3fd937f-bedf-4b8a-a854-12b9111dd71f', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 9, '2026-01-02T13:18:14.757521+00:00', '🧾', 'payment', 'Kurzes Finanz-Update:
Bitte überweist bis {{deadline}} für Geschenk/Location/Essen:
{{payment_link}}

Betrag: {{amount}}

Danke euch! 🙏') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('82a5b9f2-3318-4541-ab51-be4d7aff30fa', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'd9cd9f83-7572-4e68-81f7-76f05a49483e', '2026-01-02T13:18:14.757521+00:00', 10, '2026-01-02T13:18:14.757521+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken – Rebecca wird sich riesig freuen! 🎂🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('17f97bf4-86e6-4c00-839b-8d7b954d7e61', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 1, '2026-01-02T14:30:06.352934+00:00', '🎉', 'kickoff', 'Hey Leute! 🎉

Wir planen eine Überraschungsfeier für tes! 🎂

Damit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Location-Wahl

Je schneller alle antworten, desto schneller können wir loslegen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('4f6fdefb-921d-4c6d-86b4-84024356847e', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 2, '2026-01-02T14:30:06.352934+00:00', '💸', 'budget_poll', 'Damit keiner am Ende pleite ist – was darf die Feier kosten (pro Person)?

🔘 bis 50 € – Klein aber fein
🔘 50–100 € – Realistisch
🔘 100 €+ – Richtig feiern

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('cd19d1c0-00f1-489f-b7af-57d820237802', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 3, '2026-01-02T14:30:06.352934+00:00', '🏨', 'accommodation', 'Falls wir länger feiern oder weiter weg fahren – wo übernachten?

🔘 Hotel
🔘 Airbnb
🔘 Bei jemandem zu Hause
🔘 Keine Übernachtung nötig') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('2cde0baa-d93f-4eb3-9f22-f4f1b9f7cd93', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 4, '2026-01-02T14:30:06.352934+00:00', '🧳', 'packing_list', 'Bitte mitbringen:
✅ Geschenk für tes
✅ Gute Laune
✅ Bequeme Kleidung
✅ Evtl. Handyladegerät
✅ Bargeld für spontane Ausgaben') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('55e91c97-0c00-4521-b6ab-95340114211f', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 5, '2026-01-02T14:30:06.352934+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('3ffc506f-7e5e-4534-9d81-78244d463a3e', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 6, '2026-01-02T14:30:06.352934+00:00', '📢', 'countdown', 'Nur noch 3 Tage bis zur Feier für tes! 🎂

✅ Geschenk besorgt?
✅ Outfit klar?
✅ Treffpunkt notiert?

Wir sehen uns bald! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b585bfe7-f950-46df-842d-8e9bd04998b7', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 7, '2026-01-02T14:30:06.352934+00:00', '🎁', 'gifts', 'Wer bringt was für tes?
🎁 Hauptgeschenk (Sammelaktion?)
🎁 Karte unterschreiben
🎁 Deko mitbringen

Bitte kurz in die Gruppe schreiben, damit wir koordiniert sind!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b2a08ed2-f820-4444-81a4-8362453c5307', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 8, '2026-01-02T14:30:06.352934+00:00', '🎤', 'motivation', 'Heute feiern wir tes!

🎈 Spaß haben
🎈 Das Geburtstagskind feiern
🎈 Gute Stimmung verbreiten

Los geht''s! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('738871ac-73d0-463e-aef4-0c361c3ae5da', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 9, '2026-01-02T14:30:06.352934+00:00', '🧾', 'payment', 'Kurzes Finanz-Update:
Bitte überweist bis {{deadline}} für Geschenk/Location/Essen:
{{payment_link}}

Betrag: {{amount}}

Danke euch! 🙏') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('346e4c11-a94b-4534-8a39-f9741c2f52e5', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '3814b54a-3d64-4cac-9c8c-28948b9b7cfa', '2026-01-02T14:30:06.352934+00:00', 10, '2026-01-02T14:30:06.352934+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken – tes wird sich riesig freuen! 🎂🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('0a4fa63d-0833-42aa-8e1a-83440caf8c3e', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 1, '2026-01-02T19:56:32.915381+00:00', '🎉', 'kickoff', 'Hey Leute! 🌍

Wir planen einen gemeinsamen Trip! ✈️

Damit wir das perfekte Abenteuer organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Reiseziel-Wahl

Je schneller alle antworten, desto schneller können wir buchen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('39e14483-6021-476f-b38a-3e50acbf0728', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 2, '2026-01-02T19:56:32.915381+00:00', '💸', 'budget_poll', 'Damit wir planen können – was darf der Trip kosten (pro Person, inkl. Unterkunft)?

🔘 bis 200 € – Budget-Reise
🔘 200–500 € – Mittelklasse
🔘 500–1000 € – Komfortabel
🔘 1000 €+ – Luxus

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('34326ab2-6de4-48db-aa28-19d1e0a544cf', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 3, '2026-01-02T19:56:32.915381+00:00', '🏨', 'accommodation', 'Wo übernachten wir am liebsten?

🔘 Hotel (bequem)
🔘 Airbnb (gemeinsame Unterkunft)
🔘 Hostel (günstig & social)
🔘 Camping (Abenteuer)

Schreibt eure Präferenz!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('0b69b9b0-c04b-4bf7-a20d-00916b8f396a', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 4, '2026-01-02T19:56:32.915381+00:00', '🧳', 'packing_list', 'Packliste für den Trip:
✅ Ausweis/Reisepass
✅ Handy & Ladegerät
✅ Powerbank
✅ Wetterangepasste Kleidung
✅ Bequeme Schuhe
✅ Kamera
✅ Gute Laune 🌟') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('bae11ac2-78ee-49dc-b93d-dd19af2a6f23', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 5, '2026-01-02T19:56:32.915381+00:00', '🗺️', 'travel_info', 'Reiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt/fliegt mit wem?
Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Reisepartner von [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a2122cea-4834-4a63-9bf2-7c73c79b43a1', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 6, '2026-01-02T19:56:32.915381+00:00', '📢', 'countdown', 'Nur noch 3 Tage bis zum Trip! 🌍

✅ Koffer gepackt?
✅ Tickets gesichert?
✅ Reisedokumente bereit?
✅ Unterkunft bestätigt?

Der Countdown läuft! ✈️') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('bf2583d5-44fb-4881-bf06-d3d1c8de1483', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 7, '2026-01-02T19:56:32.915381+00:00', '🎁', 'gifts', 'Organisatorisches für die Gruppe:
📋 Wer übernimmt welche Buchung?
📋 Gemeinsame Kasse einrichten?
📋 Notfallnummern austauschen

Bitte kurz abstimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8265ad78-e765-4932-99cb-c5991117b033', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 8, '2026-01-02T19:56:32.915381+00:00', '🎤', 'motivation', 'Es geht los! 🌍✈️

Was wir heute vorhaben:
🗺️ Abenteuer erleben
🗺️ Neue Orte entdecken
🗺️ Gemeinsam Spaß haben

Auf geht''s! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('abbff6eb-2ec0-4acf-b801-139d099b7946', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 9, '2026-01-02T19:56:32.915381+00:00', '🧾', 'payment', 'Finanz-Update für den Trip:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Danke fürs prompte Überweisen! 🙏') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('27d0824f-19cd-4e22-bf57-de868566b5d8', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'aa0c2cab-bfa9-453e-be38-caa2227d579a', '2026-01-02T19:56:32.915381+00:00', 10, '2026-01-02T19:56:32.915381+00:00', '✅', 'date_locked', 'Der Reisetermin steht!

📅 {{locked_date}}

Bitte alle Urlaub nehmen und Tickets buchen! ✈️🌍') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('38a121a9-dd19-43af-b9a1-d3e76c61d6cf', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 1, '2026-01-03T08:29:37.412509+00:00', '🎉', 'kickoff', 'Hey Männer! 🎉

Es ist soweit - wir planen den JGA für Dominic! 🥳

Damit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Reiseziel-Wahl

Je schneller alle antworten, desto schneller können wir loslegen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('57811520-6e89-43f4-91d2-6dfb6615e4c4', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 2, '2026-01-03T08:29:37.412509+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('390fbf00-bffa-4f50-b5f1-e0a89312858d', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 3, '2026-01-03T08:29:37.412509+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('46135ab3-09c4-456f-b8a8-a9a302617af4', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 4, '2026-01-03T08:29:37.412509+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a259d0e6-73fd-4582-b246-41b4514b9b2b', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 5, '2026-01-03T08:29:37.412509+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('7f63248f-d5d1-4e14-8566-779b5ee2c09e', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 6, '2026-01-03T08:29:37.412509+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA für Dominic. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('4c601156-fcad-47f7-acba-a5dfc8c01167', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 7, '2026-01-03T08:29:37.412509+00:00', '🎁', 'gifts', 'Wer bringt was für Dominic?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('af5db695-037b-4a1d-bcf9-5e84b765d535', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 8, '2026-01-03T08:29:37.412509+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b147abaa-5c18-49d7-b4a3-bc45daafce42', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 9, '2026-01-03T08:29:37.412509+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('ec50c5aa-bff9-4af6-a061-6f3396c9089c', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'e264533d-7a89-478b-8c6f-94d524d7b277', '2026-01-03T08:29:37.412509+00:00', 10, '2026-01-03T08:29:37.412509+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('fcbfe813-67f3-456c-a598-9f4641471ca9', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 1, '2026-01-03T09:07:13.269923+00:00', '🎉', 'kickoff', 'Hey Männer! 🎉

Es ist soweit - wir planen den JGA für Domi ! 🥳

Damit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Reiseziel-Wahl

Je schneller alle antworten, desto schneller können wir loslegen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('55fd5a0d-f1be-44e0-978a-49bc58b5a745', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 2, '2026-01-03T09:07:13.269923+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('37846c6a-477e-4cae-820d-a14942823e48', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 3, '2026-01-03T09:07:13.269923+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b6b291b0-752f-48dd-a9f7-997fe43002f6', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 4, '2026-01-03T09:07:13.269923+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d1bfb549-8bf6-4603-a364-3deae44cf4c4', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 5, '2026-01-03T09:07:13.269923+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('d6a7170c-1296-4f47-918a-37523d26191a', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 6, '2026-01-03T09:07:13.269923+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA für Domi . Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('0f910666-5e0b-48ff-b2da-137b1f6965f4', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 7, '2026-01-03T09:07:13.269923+00:00', '🎁', 'gifts', 'Wer bringt was für Domi ?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('3996977d-6d6c-471f-a7f4-c6600059af5d', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 8, '2026-01-03T09:07:13.269923+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('de2c3465-332a-4881-b278-df827b8f1398', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 9, '2026-01-03T09:07:13.269923+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('a3423c64-ba6b-48f6-b3ac-19548e525ccc', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '1f727e74-03e4-4ee4-a629-cb3f43a35e2b', '2026-01-03T09:07:13.269923+00:00', 10, '2026-01-03T09:07:13.269923+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f5948fd6-cbc3-43b2-adc3-d77d19f83bdc', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 1, '2026-01-07T17:00:20.68348+00:00', '🎉', 'kickoff', 'Hey Männer! 🎉

Es ist soweit - wir planen den JGA für UTE! 🥳

Damit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Reiseziel-Wahl

Je schneller alle antworten, desto schneller können wir loslegen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c8bb9ad3-ba7a-40e2-a4fe-df9a72f6d723', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 2, '2026-01-07T17:00:20.68348+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('97077342-bbd2-456b-9637-f7f13b6ac74f', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 3, '2026-01-07T17:00:20.68348+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('5e8f45ad-17fa-44cd-aad6-53d269f4303f', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 4, '2026-01-07T17:00:20.68348+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('2c5d829e-45f4-43df-ac8a-e58f31cbee23', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 5, '2026-01-07T17:00:20.68348+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('f6502b69-c1dd-4e13-901c-4a1f99d82df0', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 6, '2026-01-07T17:00:20.68348+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA für UTE. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8c86b4ee-313e-4d85-97e3-0c8bd96f2072', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 7, '2026-01-07T17:00:20.68348+00:00', '🎁', 'gifts', 'Wer bringt was für UTE?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('b5871a59-2673-4579-a33d-6c09e43181b4', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 8, '2026-01-07T17:00:20.68348+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('9710f839-4f60-4ca5-8aaa-1582076a67cc', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 9, '2026-01-07T17:00:20.68348+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('11d9f45f-0a31-41b5-9e90-e10c901938b6', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:00:20.68348+00:00', 10, '2026-01-07T17:00:20.68348+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('9fb2df57-f137-46d6-be07-66e2ac33e52f', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 1, '2026-01-09T10:35:30.159599+00:00', '🎉', 'kickoff', 'Hey Männer! 🎉

Es ist soweit - wir planen den JGA für Arthur! 🥳

Damit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Reiseziel-Wahl

Je schneller alle antworten, desto schneller können wir loslegen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('1cbdc2c0-b568-4422-bb3f-25340717fc17', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 2, '2026-01-09T10:35:30.159599+00:00', '💸', 'budget_poll', 'Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?

🔘 bis 100 € – Team Sparfuchs
🔘 150–200 € – Team realistisch
🔘 250 €+ – Team Eskalation

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('e46f06d5-70d4-4d79-bbaa-e2e586b594b3', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 3, '2026-01-09T10:35:30.159599+00:00', '🏨', 'accommodation', 'Wir brauchen ein Bett – oder wenigstens einen Boden.

Lieber:
🔘 Hotel (bequem, aber teurer)
🔘 Airbnb (mehr Platz & Chaos)
🔘 Hostel (weniger Komfort, mehr Abenteuer)

Wer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('40480fb4-aa77-4128-a08f-a24648bbd766', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 4, '2026-01-09T10:35:30.159599+00:00', '🧳', 'packing_list', 'Jungs, bitte einpacken:
✅ Ausweis
✅ Bargeld
✅ Handy & Ladegerät
✅ Kopfschmerztabletten (ihr wisst wieso)
✅ Wechselshirt (für alle Fälle)
✅ gute Laune') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c4ed5b6e-8311-4b87-906b-586c7f6d4aec', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 5, '2026-01-09T10:35:30.159599+00:00', '🗺️', 'travel_info', 'Anreiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt mit wem? Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Mitfahrgelegenheit aus [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('40879149-f00c-4e0c-93c2-0f5e5668b1fa', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 6, '2026-01-09T10:35:30.159599+00:00', '📢', 'countdown', 'Männer!
Noch 3 Tage bis zum JGA für Arthur. Jetzt nochmal kurz checken:
✅ Geld überwiesen
✅ Outfit klar
✅ Zimmerverteilung verstanden
✅ Gruppe gemutet – sonst wird der Chat wild

Der Countdown läuft… und keiner kommt raus!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('52c4bda5-a11a-4b1d-bfc0-32c01fd65f05', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 7, '2026-01-09T10:35:30.159599+00:00', '🎁', 'gifts', 'Wer bringt was für Arthur?
🔹 Eine peinliche Aufgabe
🔹 Ein Geschenk mit Erinnerungswert
🔹 Ein Shot aus seiner Vergangenheit

Bitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('8a92b1aa-0ae8-4656-baf3-7a3cbe7c6354', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 8, '2026-01-09T10:35:30.159599+00:00', '🎤', 'motivation', 'Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.
Jeder hat heute eine Aufgabe:
🔸 Spaß haben
🔸 Bräutigam feiern
🔸 Nicht verloren gehen
🔸 Und: Wer meckert, muss ''nen Shot trinken 🍻') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('0fb53271-838d-4e09-989a-98026f2eb5bc', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 9, '2026-01-09T10:35:30.159599+00:00', '🧾', 'payment', 'Kleines Finanz-Update:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Ohne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('37ba926e-9878-48ad-856d-aa8856025557', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], '8beda246-c847-4146-96aa-47e8464477b2', '2026-01-09T10:35:30.159599+00:00', 10, '2026-01-09T10:35:30.159599+00:00', '✅', 'date_locked', 'Der Termin steht!

📅 {{locked_date}}

Bitte alle vormerken und keine Ausreden mehr! 🎉') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('75e991b5-e4ba-4a3c-980d-709620783ee7', 'Kickoff Message', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 1, '2026-01-11T09:49:03.38535+00:00', '🎉', 'kickoff', 'Hey Leute! 🌍

Wir planen einen gemeinsamen Trip! ✈️

Damit wir das perfekte Abenteuer organisieren können, brauchen wir eure Hilfe!

👉 Bitte füllt diese kurze Umfrage aus:
{{link}}

🔑 Zugangscode: {{code}}

Die Umfrage dauert nur 2-3 Minuten und hilft uns bei:
📅 Terminfindung
💰 Budget-Planung
🎯 Aktivitäten-Auswahl
📍 Reiseziel-Wahl

Je schneller alle antworten, desto schneller können wir buchen! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('9dd5cb9a-e1e8-456d-b5a4-aa0871ef05fc', 'Budget Poll', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 2, '2026-01-11T09:49:03.38535+00:00', '💸', 'budget_poll', 'Damit wir planen können – was darf der Trip kosten (pro Person, inkl. Unterkunft)?

🔘 bis 200 € – Budget-Reise
🔘 200–500 € – Mittelklasse
🔘 500–1000 € – Komfortabel
🔘 1000 €+ – Luxus

Bitte ehrlich stimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('270b0e90-c362-4450-a168-f78f8460e6f0', 'Accommodation Poll', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 3, '2026-01-11T09:49:03.38535+00:00', '🏨', 'accommodation', 'Wo übernachten wir am liebsten?

🔘 Hotel (bequem)
🔘 Airbnb (gemeinsame Unterkunft)
🔘 Hostel (günstig & social)
🔘 Camping (Abenteuer)

Schreibt eure Präferenz!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('587143f9-bc29-489b-aedd-6fff529a1752', 'Packing List', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 4, '2026-01-11T09:49:03.38535+00:00', '🧳', 'packing_list', 'Packliste für den Trip:
✅ Ausweis/Reisepass
✅ Handy & Ladegerät
✅ Powerbank
✅ Wetterangepasste Kleidung
✅ Bequeme Schuhe
✅ Kamera
✅ Gute Laune 🌟') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('aae2a593-67f4-48fc-8c8e-01902536a2ff', 'Travel Info', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 5, '2026-01-11T09:49:03.38535+00:00', '🗺️', 'travel_info', 'Reiseplan:
Treffpunkt: {{meeting_point}}
Uhrzeit: {{meeting_time}}

Wer fährt/fliegt mit wem?
Bitte in die Gruppe schreiben:
„Fahre selbst + Platz für X Leute"
oder
„Suche Reisepartner von [Ort]"') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('28849b51-bf7f-4daa-a112-7800ea10e62f', 'Countdown Reminder', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 6, '2026-01-11T09:49:03.38535+00:00', '📢', 'countdown', 'Nur noch 3 Tage bis zum Trip! 🌍

✅ Koffer gepackt?
✅ Tickets gesichert?
✅ Reisedokumente bereit?
✅ Unterkunft bestätigt?

Der Countdown läuft! ✈️') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('849139ea-0f09-417b-83df-1acebad3052a', 'Gift Coordination', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 7, '2026-01-11T09:49:03.38535+00:00', '🎁', 'gifts', 'Organisatorisches für die Gruppe:
📋 Wer übernimmt welche Buchung?
📋 Gemeinsame Kasse einrichten?
📋 Notfallnummern austauschen

Bitte kurz abstimmen!') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('c4361b21-ab4a-492d-9e5e-f80e63108045', 'Motivation', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 8, '2026-01-11T09:49:03.38535+00:00', '🎤', 'motivation', 'Es geht los! 🌍✈️

Was wir heute vorhaben:
🗺️ Abenteuer erleben
🗺️ Neue Orte entdecken
🗺️ Gemeinsam Spaß haben

Auf geht''s! 🚀') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('4717d1bd-d32d-46d0-9eb1-342a26a5c280', 'Payment Request', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 9, '2026-01-11T09:49:03.38535+00:00', '🧾', 'payment', 'Finanz-Update für den Trip:
Bitte überweist bis {{deadline}} auf folgendes Konto/Link:
{{payment_link}}

Betrag: {{amount}}

Danke fürs prompte Überweisen! 🙏') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.message_templates (id, title, locale, channels, event_id, created_at, sort_order, updated_at, emoji_prefix, template_key, content_template) VALUES ('cd60f2e6-de6d-4f7f-b19d-44d959113174', 'Date Confirmed', 'de', ARRAY['whatsapp']::TEXT[], 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:49:03.38535+00:00', 10, '2026-01-11T09:49:03.38535+00:00', '✅', 'date_locked', 'Der Reisetermin steht!

📅 {{locked_date}}

Bitte alle Urlaub nehmen und Tickets buchen! ✈️🌍') ON CONFLICT (id) DO NOTHING;

-- admin_messages (1 rows)
INSERT INTO public.admin_messages (id, content, subject, user_id, admin_id, created_at, template_key) VALUES ('b29b24e0-1998-4676-a475-b1a07ddee5a7', 'Das ist ein TEst', 'Bitte prüfen', '726e1709-9123-4d66-abbc-036fde273071', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '2026-01-09T17:09:47.057531+00:00', NULL) ON CONFLICT (id) DO NOTHING;

-- ai_usage (21 rows)
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('be14bde3-b312-4ac5-9d53-0f48aca396ae', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T18:40:39.279541+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('731da8ee-7242-4d1b-8d32-a009b3add44e', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T18:40:57.825852+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('abffd388-de61-4ba9-bf87-87eb3c8ac564', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T18:53:34.728533+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('5f872f91-3889-428f-9a97-85b3278da733', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T18:55:49.289913+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('1a63e2ee-8d28-437d-8081-7388f45b6940', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T18:56:09.322815+00:00', 0, 'section_regeneration') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('d860a420-2047-4655-8c1e-d0ddac27977a', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T18:57:49.72605+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('9f4b879b-d0d2-4639-9c4d-0b8e57692ac6', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T18:58:37.488245+00:00', 0, 'template_expansion') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('2211de1e-27d7-408e-bc05-2810f3dbb684', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T19:14:08.867687+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('83549395-8d32-4cba-883c-e00ddaa27f1c', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-05T19:16:50.836882+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('69e61887-4de2-4994-9db5-6772e0a1224e', '42c9b952-3990-4a14-a79b-6a2102c627ab', 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-05T19:18:20.968908+00:00', 1, 'day_plan') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('e4245b27-bde2-4dd5-b6dc-e379c5b767d1', '42c9b952-3990-4a14-a79b-6a2102c627ab', 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '2026-01-05T19:19:29.763041+00:00', 1, 'day_plan') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('6d453bc7-9f3b-4b90-b4ab-739e5e6380ae', '42c9b952-3990-4a14-a79b-6a2102c627ab', NULL, '2026-01-07T16:59:11.970336+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('8fcd1972-eb8a-4445-b6dc-5c707e0dde33', '42c9b952-3990-4a14-a79b-6a2102c627ab', 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:02:40.278385+00:00', 1, 'day_plan') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('8c068597-442c-4c6b-85dc-4bab3ee14690', '42c9b952-3990-4a14-a79b-6a2102c627ab', 'daade170-c96a-4600-8346-55d43c0fdeab', '2026-01-07T17:04:21.118083+00:00', 1, 'activities') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('3b4d76e7-6981-451a-bf10-c40ef91dca31', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', NULL, '2026-01-11T09:34:44.651888+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('cc2603a2-cd21-4057-84f2-3881b5a3d640', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', NULL, '2026-01-11T09:35:15.157401+00:00', 0, 'template_expansion') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('22afcfeb-e9cc-4073-a4a6-dbd1a5c62580', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', NULL, '2026-01-11T09:35:20.437347+00:00', 0, 'section_regeneration') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('1457b6e0-9a37-4df5-a22d-7bc2425790e7', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', NULL, '2026-01-11T09:47:34.374818+00:00', 0, 'template_generation') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('a83b99c7-8e70-49cb-a92f-5f7bd5acb137', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:50:01.724889+00:00', 1, 'day_plan') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('269dab71-18a1-4cca-b110-ff167e04b562', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:51:03.785638+00:00', 1, 'day_plan') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ai_usage (id, user_id, event_id, created_at, tokens_used, request_type) VALUES ('6c106e29-8c3e-4880-b033-6ab70b5f7e80', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '2026-01-11T09:52:26.115104+00:00', 1, 'day_plan') ON CONFLICT (id) DO NOTHING;

-- ai_credit_adjustments (1 rows)
INSERT INTO public.ai_credit_adjustments (id, amount, reason, user_id, created_at, adjusted_by) VALUES ('f8396a9d-d9a4-4265-8a1a-bd52745a1a85', 10, 'Bonus Feature', '726e1709-9123-4d66-abbc-036fde273071', '2026-01-09T17:10:24.09243+00:00', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6') ON CONFLICT (id) DO NOTHING;

-- agency_affiliates (1 rows)
INSERT INTO public.agency_affiliates (id, phone, status, website, agency_id, created_at, updated_at, agency_city, agency_name, is_verified, affiliate_id, contact_email, agency_country, description_ar, description_de, description_en, description_es, description_fr, description_it, description_nl, description_pl, description_pt, description_tr, total_bookings, commission_rate, commission_type, total_referrals, total_commission) VALUES ('5dcbec9e-97c1-4466-afe3-5c0c223e479b', NULL, 'active', NULL, 'manual-1767339490152-pdq4ck9sx', '2026-01-02T07:38:10.515567+00:00', '2026-01-02T07:38:10.515567+00:00', 'Aarau', 'YJBN Media Agentur ', true, NULL, 'info@yjbn-media.com', 'Schweiz', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 10, 'percentage', 0, 0) ON CONFLICT (id) DO NOTHING;

-- agency_interactions (13 rows)
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('495219e0-ed98-4b79-a353-a17b4b473a6d', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Berlin","country":"DE","agency_email":"info@jajoco.com","agency_phone":"030 50154408","agency_website":"https://www.jga-berlin.com/"}'::jsonb, NULL, '1', false, '2026-01-02T06:56:39.467996+00:00', 'JaJoCo GmbH (JGA Berlin)', NULL, NULL, 'website') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('c9f73e15-946a-4b2b-8c58-599f566169e9', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Berlin","country":"DE","agency_email":"info@jajoco.com","agency_phone":"030 50154408","agency_website":"https://www.jga-berlin.com/"}'::jsonb, NULL, '1', false, '2026-01-02T06:56:45.946886+00:00', 'JaJoCo GmbH (JGA Berlin)', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('1f03a836-5322-47b4-bc7f-bf0dcbbdf5bc', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Berlin","country":"DE","agency_email":"hallo@pissup.de","agency_phone":"+49-800-723-7979","agency_website":"https://www.pissup.de/junggesellenabschied-berlin/"}'::jsonb, NULL, '2', false, '2026-01-02T06:57:40.870276+00:00', 'Pissup Reisen', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('3a07f2db-2931-4636-a142-8804d81f70d9', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Berlin","country":"DE","agency_email":"info@jajoco.com","agency_phone":"030 50154408","agency_website":"https://www.jga-berlin.com/"}'::jsonb, NULL, '1', false, '2026-01-02T06:58:12.811735+00:00', 'JaJoCo GmbH (JGA Berlin)', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('f7a0a9f7-e1a4-46c1-bef8-8a7ca77e1e70', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Berlin","country":"DE","agency_email":"hallo@jga-buddies.de","agency_phone":"+49 7142 999 8440","agency_website":"https://jga-buddies.de/"}'::jsonb, NULL, '3', false, '2026-01-02T06:58:20.875226+00:00', 'JGA Buddies', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('7acf8fb1-6c49-499d-9a27-61a9ef95bd6b', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Berlin","country":"DE","agency_email":"info@jajoco.com","agency_phone":"030 50154408","agency_website":"https://www.jga-berlin.com/"}'::jsonb, NULL, '1', false, '2026-01-02T06:59:08.171907+00:00', 'JaJoCo GmbH (JGA Berlin)', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('5e9ae615-ac19-4e17-91c7-8839a6e63dcc', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Aarau","country":"CH","agency_email":"info@yjbn-media.com","agency_phone":"","agency_website":""}'::jsonb, NULL, '1000', false, '2026-01-02T08:02:42.550092+00:00', 'YJBN Media Agentur ', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('eb9a682b-83d3-4750-adaa-4c89b63ce59f', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Aarau","country":"CH","agency_email":"info@yjbn-media.com","agency_phone":"","agency_website":""}'::jsonb, NULL, '1000', false, '2026-01-02T08:02:51.13956+00:00', 'YJBN Media Agentur ', NULL, NULL, 'website') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('d5ebb631-f22a-4520-9478-b8d799dcf28e', '42c9b952-3990-4a14-a79b-6a2102c627ab', 'cbd1a3db-4a8d-4ea0-9ff5-205007669975', '{"city":"Berlin","country":"DE","agency_email":"hallo@jga-buddies.de","agency_phone":"+49 7142 999 8440","agency_website":"https://jga-buddies.de/"}'::jsonb, NULL, '3', false, '2026-01-02T13:16:14.849168+00:00', 'JGA Buddies', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('11eb4bc4-5c4c-431c-bc14-cbc1b37f172e', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Berlin","country":"DE","agency_email":"info@jajoco.com","agency_phone":"030 50154408","agency_website":"https://www.jga-berlin.com/"}'::jsonb, NULL, '1', false, '2026-01-02T21:24:39.03731+00:00', 'JaJoCo GmbH (JGA Berlin)', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('c31bb199-2bd5-4dc6-a299-fe44b0086c40', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '8230431a-939d-4bb2-ad8d-5602137483cf', '{"city":"Berlin","country":"DE","agency_email":"hallo@pissup.de","agency_phone":"+49-800-723-7979","agency_website":"https://www.pissup.de/junggesellenabschied-berlin/"}'::jsonb, NULL, '2', false, '2026-01-09T15:59:56.022015+00:00', 'Pissup Reisen', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('18a2cc55-ca93-4e70-a867-5d017a2d98a8', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '4fd86091-9a8f-42ad-adf5-aa582e2c9294', '{"city":"Berlin","country":"DE","agency_email":"info@jajoco.com","agency_phone":"030 50154408","agency_website":"https://www.jga-berlin.com/"}'::jsonb, NULL, '1', false, '2026-01-09T16:00:48.205975+00:00', 'JaJoCo GmbH (JGA Berlin)', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agency_interactions (id, user_id, event_id, metadata, ref_code, agency_id, converted, created_at, agency_name, converted_at, booking_value, interaction_type) VALUES ('68928493-5570-49c6-94d9-b2a392b94008', 'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1', 'a86d2ef2-a669-42f6-836b-befc9e7cb678', '{"city":"Berlin","country":"DE","agency_email":"info@jajoco.com","agency_phone":"030 50154408","agency_website":"https://www.jga-berlin.com/"}'::jsonb, NULL, '1', false, '2026-01-11T09:52:47.925294+00:00', 'JaJoCo GmbH (JGA Berlin)', NULL, NULL, 'email') ON CONFLICT (id) DO NOTHING;

-- voucher_redemptions (1 rows)
INSERT INTO public.voucher_redemptions (id, user_id, voucher_id, redeemed_at, subscription_id) VALUES ('ae741a05-45fa-45d9-a62e-acc40c19061d', 'aeec7eb2-cb02-4338-a2c0-82bb946900c6', '2195643c-5bf7-4739-a9ac-61c4bda0924e', '2025-12-29T15:14:34.34227+00:00', NULL) ON CONFLICT (id) DO NOTHING;

COMMIT;
