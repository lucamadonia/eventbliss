-- =====================================================================
-- Startbestand: Briefing-Vorlagen, Leistungspakete, Gruppen
--
-- WARUM ALS MIGRATION UND NICHT VON HAND: dieselbe Ausstattung soll auf
-- jeder Umgebung stehen, und ein leeres Paket-Auswahlfeld ("nur 'Ohne Paket'")
-- ist der haeufigste Grund, warum ein neuer Bereich unbenutzbar wirkt.
--
-- ALLE ANGABEN SIND CODE-VERIFIZIERT (Stand 2026-08-26):
--   22 Party-Spiele  — Zaehlung aus src/pages/GamesHub.tsx
--   10 Sprachen      — src/lib/seo-routes.ts (SEO_LANGS)
--   Web + iOS + Android, TV-Modus, Kostenteilung, KI-Vorschlaege,
--   Agentur-Marktplatz
-- Wer eine Zahl aendert, muss sie hier UND in der App aendern. Eine Vorlage,
-- die eine falsche Zahl in tausend Beitraege traegt, ist schlimmer als keine.
--
-- KEINE PROVISIONS- ODER HONORARSAETZE. Die Gruppen tragen nur Laufzeiten;
-- Konditionen sind eine geschaeftliche Entscheidung und werden im Deal
-- gesetzt, nicht von einer Migration erfunden.
--
-- Eingefuegt wird nur, was noch nicht da ist (Abgleich ueber den Namen) —
-- die Datei darf gefahrlos erneut laufen.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Leistungspakete
-- ---------------------------------------------------------------------
INSERT INTO public.influencer_packages (name, description, duration_days, is_active)
SELECT v.name, v.description, v.duration_days, true
FROM (VALUES
  ('Schnupperpaket', 'Erster gemeinsamer Test: ein Reel und zwei Stories.', 21),
  ('Standardpaket', 'Der Normalfall: zwei Reels, drei Stories.', 30),
  ('Kampagne', 'Begleitung über mehrere Wochen — Reels, Stories und ein Feed-Post.', 45),
  ('Nur Stories', 'Leichtgewicht für Konten, die vor allem in Stories leben.', 14),
  ('Video / Podcast', 'Ein längeres Format plus ein begleitender Post.', 30)
) AS v(name, description, duration_days)
WHERE NOT EXISTS (SELECT 1 FROM public.influencer_packages p WHERE p.name = v.name);

-- Posten der Pakete. `due_offset_days` ist die Frist ab Deal-Start, nicht ab
-- Veroeffentlichung — deshalb liegen die Stories bewusst NACH dem Reel: erst
-- das Stueck, das Arbeit macht, dann die Begleitung.
INSERT INTO public.influencer_package_items (package_id, kind, quantity, due_offset_days, requirements, sort_order)
SELECT p.id, v.kind, v.quantity, v.due_offset_days, v.requirements, v.sort_order
FROM public.influencer_packages p
JOIN (VALUES
  ('Schnupperpaket', 'reel',  1, 10, 'Die App im Einsatz zeigen — echte Planung, kein Werbefilm.', 0),
  ('Schnupperpaket', 'story', 2, 14, 'Eine Story zum Ankündigen, eine mit dem Link.', 1),

  ('Standardpaket',  'reel',  2, 14, 'Ein Reel zur Planung, eines zu den Spielen.', 0),
  ('Standardpaket',  'story', 3, 21, 'Begleitend zum jeweiligen Reel, mit Link.', 1),

  ('Kampagne',       'reel',  3, 21, 'Drei Blickwinkel: Planung, Kosten, Abend selbst.', 0),
  ('Kampagne',       'story', 5, 30, 'Über die Laufzeit verteilt, nicht alle an einem Tag.', 1),
  ('Kampagne',       'post',  1, 40, 'Zusammenfassender Beitrag im Feed.', 2),

  ('Nur Stories',    'story', 5, 10, 'Als kleine Serie, nicht am Stück.', 0),

  ('Video / Podcast','video', 1, 21, 'Ausführlicher: warum Gruppenplanung so oft im Chaos endet.', 0),
  ('Video / Podcast','post',  1, 25, 'Begleitender Beitrag mit Link.', 1)
) AS v(pkg, kind, quantity, due_offset_days, requirements, sort_order)
  ON v.pkg = p.name
WHERE NOT EXISTS (
  SELECT 1 FROM public.influencer_package_items i
  WHERE i.package_id = p.id AND i.kind = v.kind AND i.sort_order = v.sort_order
);

-- ---------------------------------------------------------------------
-- 2) Gruppen — nur Laufzeiten, keine erfundenen Konditionen
-- ---------------------------------------------------------------------
INSERT INTO public.influencer_groups (name, description, default_trial_months, default_package_id)
SELECT v.name, v.description, v.months,
       (SELECT id FROM public.influencer_packages WHERE name = v.pkg LIMIT 1)
FROM (VALUES
  ('Micro (bis 10 Tsd.)', 'Kleine, sehr nahe Communitys. Provision und Honorar im Deal festlegen.', 3,  'Schnupperpaket'),
  ('Mid (10–100 Tsd.)',   'Der Regelfall. Provision und Honorar im Deal festlegen.',                6,  'Standardpaket'),
  ('Macro (ab 100 Tsd.)', 'Große Reichweite, meist mit Honorar. Konditionen im Deal festlegen.',    12, 'Kampagne'),
  ('Podcast & YouTube',   'Lange Formate, längere Vorlaufzeit.',                                     6,  'Video / Podcast')
) AS v(name, description, months, pkg)
WHERE NOT EXISTS (SELECT 1 FROM public.influencer_groups g WHERE g.name = v.name);

-- ---------------------------------------------------------------------
-- 3) Briefing-Vorlagen
--
-- Der Ton folgt derselben Regel wie die Agentur-Ansprache: nichts behaupten,
-- was der Zuschauer nicht selbst sieht. Deshalb steht in jedem Do "zeig",
-- nicht "sag". Und in jedem Don't die Sorte Satz, die eine Empfehlung sofort
-- unglaubwuerdig macht.
-- ---------------------------------------------------------------------
INSERT INTO public.influencer_briefing_templates (
  name, package_id, headline, core_message, tone, dos, donts,
  mention_handles, hashtags, link_url, discount_note,
  disclosure_required, disclosure_text, approval_required, extra, internal_notes
)
SELECT
  v.name,
  (SELECT id FROM public.influencer_packages WHERE name = v.pkg LIMIT 1),
  v.headline, v.core_message, v.tone, v.dos, v.donts,
  ARRAY['@eventbliss'], v.hashtags, 'https://event-bliss.com', v.discount_note,
  true, 'Werbung', v.approval, v.extra, v.internal_notes
FROM (VALUES
  (
    'JGA — das Chaos vorher',
    'Standardpaket',
    'Junggesellenabschied planen, ohne drei WhatsApp-Gruppen',
    'Jeder, der schon mal einen JGA organisiert hat, kennt denselben Ablauf: zehn Leute, drei Gruppenchats, niemand entscheidet, niemand zahlt. Zeig genau diesen Moment — und dann, wie dieselbe Planung in einer App aussieht: Termin abstimmen, Ideen sammeln, Budget festhalten, Kosten teilen. Der Witz liegt im Vorher-Nachher, nicht in der Aufzählung von Funktionen.',
    'Locker und ehrlich, so wie du sonst auch redest. Kein Werbesprech, kein "Ich zeige euch heute ein geniales Tool".',
    ARRAY[
      'Steig mit dem Chaos ein: Screenshots vom eigenen Gruppenchat wirken stärker als jede Erklärung.',
      'Zeig die App im echten Gebrauch — Termin, Ideen, Budget, Kostenteilung.',
      'Sag klar, für wen es sich lohnt: Gruppen ab etwa fünf Personen.',
      'Nenne, dass die Planung kostenlos ist.'
    ],
    ARRAY[
      'Keine Funktionsliste herunterbeten — drei Dinge im Einsatz sind besser als zehn genannte.',
      'Keine erfundenen Zahlen zu Nutzern oder Downloads.',
      'Nicht behaupten, die App plane den JGA von allein. Sie hält zusammen, was die Gruppe entscheidet.',
      'Keine fremden Anbieter schlechtreden.'
    ],
    ARRAY['#jga','#junggesellenabschied','#eventbliss','#gruppenreise'],
    'Rabattcode wird im Deal vergeben — hier eintragen, sobald er steht.',
    false,
    'Fakten, die stimmen: 22 Party-Spiele, zehn Sprachen, für iPhone, Android und im Browser. Die Planung ist kostenlos; Premium ist optional.',
    'Kernvorlage für den JGA-Bereich. Bei sehr junger Zielgruppe eher die Spiele-Vorlage nehmen.'
  ),
  (
    'Party-Spiele und TV-Modus',
    'Standardpaket',
    '22 Spiele für die Gruppe — auch auf dem Fernseher',
    'Der zugänglichste Einstieg: die Spiele. Zeig eine Runde mit echten Leuten, echtem Lachen, ohne Schnittgewitter. Wichtig ist der Moment, in dem klar wird, dass alle mitspielen können — jeder am eigenen Handy, und auf Wunsch läuft das Spiel auf dem Fernseher mit.',
    'Beiläufig. Am besten mitten aus einem Abend heraus, nicht als Ankündigung.',
    ARRAY[
      'Eine Runde wirklich spielen und die Reaktionen zeigen.',
      'Den TV-Modus zeigen, wenn ein Fernseher da ist — das ist der Aha-Moment.',
      'Ein bis zwei Spiele beim Namen nennen statt alle 22 aufzuzählen.',
      'Sagen, dass die Spiele ohne Installation im Browser laufen.'
    ],
    ARRAY[
      'Keine gestellten Lacher.',
      'Nicht alle Spiele durchklicken — das ermüdet.',
      'Keine Altersfreigabe-Behauptungen; einige Inhalte sind für Erwachsene.'
    ],
    ARRAY['#partyspiele','#spieleabend','#eventbliss','#gruppenspiele'],
    'Rabattcode wird im Deal vergeben.',
    false,
    'Verifiziert: 22 Spiele, TV-Modus vorhanden, kein Download nötig für die Web-Version.',
    'Beste Vorlage für Reichweite. Funktioniert auch ohne JGA-Bezug.'
  ),
  (
    'Kostenteilung — wer schuldet wem',
    'Nur Stories',
    'Am Ende zahlt immer derselbe',
    'Der Punkt, an dem jede Gruppenreise unangenehm wird: Einer legt aus, einer vergisst, und am Ende rechnet niemand nach. Zeig, wie Ausgaben eingetragen und aufgeteilt werden — gleichmäßig, nach Anteilen oder mit mehreren Zahlern — und wie am Schluss dasteht, wer wem was schuldet.',
    'Sachlich und trocken. Dieser Schmerz braucht keine Übertreibung.',
    ARRAY[
      'Eine echte Abrechnung zeigen, gern mit unrunden Beträgen.',
      'Den Moment zeigen, in dem die Schulden zusammengefasst werden.',
      'Erwähnen, dass auch ungleiche Anteile möglich sind.'
    ],
    ARRAY[
      'Keine Zahlungsversprechen — die App rechnet, sie überweist nicht.',
      'Keine echten Namen oder Beträge Dritter ohne deren Einverständnis zeigen.'
    ],
    ARRAY['#kostenteilen','#gruppenreise','#eventbliss'],
    'Rabattcode wird im Deal vergeben.',
    false,
    'Wichtig: Die App teilt Kosten auf und hält fest, wer wem was schuldet. Sie führt selbst keine Zahlungen zwischen Teilnehmern aus.',
    'Sehr guter Aufhänger für Reise- und Spar-Konten.'
  ),
  (
    'Gruppenreise / Städtetrip',
    'Standardpaket',
    'Zu zehnt verreisen, ohne dass es im Chat untergeht',
    'Städtetrip mit Freunden: Termin finden, Unterkunft abstimmen, Programm sammeln, Kosten teilen. Zeig die Planung entlang deiner echten Reise — Vorbereitung, unterwegs, Abrechnung danach.',
    'Erzählend, entlang der Reise. Gern in mehreren Teilen.',
    ARRAY[
      'Die Planung vor der Reise zeigen, nicht nur das Ergebnis.',
      'Unterwegs kurz zeigen, wie Ausgaben eingetragen werden.',
      'Nach der Reise die Abrechnung zeigen.'
    ],
    ARRAY[
      'Keine Buchungsversprechen — Unterkunft und Flüge bucht ihr weiterhin selbst.',
      'Keine Ortsangaben von Mitreisenden ohne deren Einverständnis.'
    ],
    ARRAY['#gruppenreise','#städtetrip','#eventbliss','#reiseplanung'],
    'Rabattcode wird im Deal vergeben.',
    false,
    'Die App ist international in den Stores verfügbar und spricht zehn Sprachen — nützlich, wenn die Gruppe gemischt ist.',
    'Für Reisekonten. Mehrteilige Umsetzung bringt hier am meisten.'
  ),
  (
    'Hochzeit und Geburtstag',
    'Schnupperpaket',
    'Auch für Hochzeit, Geburtstag und Firmenfeier',
    'EventBliss ist nicht nur JGA. Zeig es an dem Anlass, der zu deinem Konto passt: Geburtstag, Hochzeit, Firmenfeier. Der Kern bleibt derselbe — mehrere Leute, ein Termin, ein Budget, viele Ideen.',
    'Ruhiger als die JGA-Vorlage. Hier zählt Organisation, nicht Party.',
    ARRAY[
      'Den Anlass wählen, der zu deinem Publikum passt.',
      'Zeigen, wie mehrere Personen gleichzeitig planen.',
      'Erwähnen, dass Gäste ohne eigenes Konto teilnehmen können.'
    ],
    ARRAY[
      'Nicht als Hochzeitsplaner-Ersatz darstellen.',
      'Keine Preise für Dienstleistungen Dritter nennen.'
    ],
    ARRAY['#hochzeitsplanung','#geburtstagsparty','#eventbliss'],
    'Rabattcode wird im Deal vergeben.',
    false,
    'Es gibt Vorlagen für unterschiedliche Anlässe; Nachrichten und Vorschläge passen sich dem Anlass an.',
    'Für Familien- und Hochzeitskonten. Ruhigere Bildsprache.'
  ),
  (
    'Story-Serie: Wir planen unseren JGA',
    'Nur Stories',
    'In fünf Stories vom Chaos zum Plan',
    'Eine Serie statt eines einzelnen Beitrags: Tag 1 das Chaos, Tag 2 der Termin, Tag 3 die Ideen, Tag 4 das Budget, Tag 5 der Abend selbst mit einem Spiel. Jede Story steht für sich, zusammen erzählen sie den Ablauf.',
    'Tagebuchartig, ungeschnitten, im Alltagstempo.',
    ARRAY[
      'Über mehrere Tage verteilen, nicht an einem Tag hochladen.',
      'Jede Story mit einem Satz beginnen, der auch allein verständlich ist.',
      'Am letzten Tag den Link setzen.'
    ],
    ARRAY[
      'Nicht alle fünf Stories vorproduzieren und stapeln — das merkt man.',
      'Keine Wiederholung derselben Aufnahme.'
    ],
    ARRAY['#jga','#eventbliss','#planung'],
    'Rabattcode wird im Deal vergeben.',
    false,
    'Fünf Stories sind das Paket "Nur Stories". Die Reihenfolge ist ein Vorschlag, kein Zwang.',
    'Gut für Konten, die selten Reels machen.'
  ),
  (
    'EN — Stag and hen planning',
    'Standardpaket',
    'Planning a stag do without three group chats',
    'Anyone who has organised a stag or hen do knows the pattern: ten people, three chats, nobody decides, nobody pays. Show that moment — then show the same planning inside one app: agree a date, collect ideas, keep the budget, split the costs. The point is the before-and-after, not a list of features.',
    'Relaxed and honest, the way you normally speak. No ad voice.',
    ARRAY[
      'Open with the chaos — screenshots of a real group chat work better than any explanation.',
      'Show the app actually being used: date, ideas, budget, splitting costs.',
      'Say who it is for: groups of about five people and up.',
      'Mention that planning is free.'
    ],
    ARRAY[
      'Do not recite a feature list — three things in use beat ten things named.',
      'No invented user or download numbers.',
      'Do not claim the app plans the trip by itself. It holds together what the group decides.'
    ],
    ARRAY['#stagdo','#hendo','#eventbliss','#grouptrip'],
    'A discount code is issued with the deal.',
    false,
    'Verified facts: 22 party games, ten languages, available on iPhone, Android and in the browser. Planning is free; Premium is optional.',
    'Core template for English-speaking creators.'
  ),
  (
    'EN — Party games and TV mode',
    'Standardpaket',
    '22 games for the group — and on the TV',
    'The easiest way in: the games. Show one real round with real people and real laughter, no fast cuts. What matters is the moment it becomes clear that everyone can join from their own phone — and that the game can run on the TV as well.',
    'Casual. Ideally filmed in the middle of an evening, not announced.',
    ARRAY[
      'Actually play a round and show the reactions.',
      'Show the TV mode if a TV is around — that is the moment it clicks.',
      'Name one or two games instead of listing all 22.',
      'Mention that the games run in the browser without installing anything.'
    ],
    ARRAY[
      'No staged laughter.',
      'Do not click through every game — it gets tiring.',
      'No age-rating claims; some content is for adults.'
    ],
    ARRAY['#partygames','#gamenight','#eventbliss'],
    'A discount code is issued with the deal.',
    false,
    'Verified: 22 games, TV mode exists, no download needed for the web version.',
    'Best template for reach. Works without any stag-do angle.'
  ),
  (
    'EN — Splitting the costs',
    'Nur Stories',
    'The same person always ends up paying',
    'The point where every group trip turns awkward: one person fronts the money, another forgets, and nobody adds it up. Show how expenses are entered and split — evenly, by shares, or with several payers — and how the app ends with who owes whom.',
    'Dry and factual. This pain needs no exaggeration.',
    ARRAY[
      'Show a real settlement, ideally with odd amounts.',
      'Show the moment the debts are summarised.',
      'Mention that uneven shares are possible.'
    ],
    ARRAY[
      'No payment promises — the app calculates, it does not transfer money.',
      'Do not show other people''s names or amounts without their consent.'
    ],
    ARRAY['#splitthebill','#grouptrip','#eventbliss'],
    'A discount code is issued with the deal.',
    false,
    'Important: the app splits costs and records who owes whom. It does not move money between participants.',
    'Strong hook for travel and money-saving accounts.'
  )
) AS v(name, pkg, headline, core_message, tone, dos, donts, hashtags, discount_note, approval, extra, internal_notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.influencer_briefing_templates t WHERE t.name = v.name
);
