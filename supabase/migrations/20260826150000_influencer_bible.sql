-- =====================================================================
-- Die Influencer-Bibel
--
-- Vorbild: fambliss-family-joy (bible_chapters + bible_pages). Uebernommen
-- ist die Struktur, nicht der Inhalt — dort geht es um physische Produkte,
-- Shopify und Warenproben; hier um eine App.
--
-- KAPITEL UND SEITEN GETRENNT, nicht ein langer Text: ein Kapitel ist die
-- Einheit, die jemand "durchhat", eine Seite die Einheit, die man am Handy
-- am Stueck liest. Der Fortschritt haengt an der Seite, sonst gilt ein
-- Kapitel nach dem ersten Absatz als gelesen.
--
-- `language` steht in der Kapiteltabelle: die Bibel startet auf Deutsch,
-- Englisch kommt als weiterer Seed — ohne Migration.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.influencer_bible_chapters (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'de',
  sort_order INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  icon TEXT DEFAULT 'BookOpen',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug, language)
);

CREATE TABLE IF NOT EXISTS public.influencer_bible_pages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chapter_id BIGINT NOT NULL REFERENCES public.influencer_bible_chapters(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  -- Einfacher Text mit Leerzeilen als Absaetzen. Bewusst kein HTML: was hier
  -- steht, schreibt das Team, nicht ein Editor — und HTML aus einem Textfeld
  -- ist eine Einladung, die niemand ausschlagen sollte.
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bible_pages_chapter
  ON public.influencer_bible_pages(chapter_id, sort_order);

-- Fortschritt je Person und Seite.
CREATE TABLE IF NOT EXISTS public.influencer_bible_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id BIGINT NOT NULL REFERENCES public.influencer_bible_pages(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, page_id)
);

-- ---------------------------------------------------------------------
-- RLS
--
-- Die Bibel ist kein Geheimnis, aber auch nichts fuer die Oeffentlichkeit:
-- angemeldete Menschen duerfen lesen, schreiben darf nur der Adminbereich.
-- Den Fortschritt sieht und setzt jeder nur fuer sich.
-- ---------------------------------------------------------------------
ALTER TABLE public.influencer_bible_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_bible_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_bible_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read bible chapters" ON public.influencer_bible_chapters
  FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Authenticated read bible pages" ON public.influencer_bible_pages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage bible chapters" ON public.influencer_bible_chapters
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage bible pages" ON public.influencer_bible_pages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Own bible progress" ON public.influencer_bible_progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Inhalt (Deutsch)
--
-- KEINE ZAHLEN AUSSER DEN GEPRUEFTEN. 22 Spiele sind nachgezaehlt;
-- Nutzerzahlen, Reichweiten und Verdienstversprechen stehen bewusst
-- nirgends. Eine Bibel, die Einnahmen verspricht, wird zum Vorwurf, sobald
-- sie nicht eintreten.
-- ---------------------------------------------------------------------
INSERT INTO public.influencer_bible_chapters (slug, language, sort_order, title, summary, icon)
SELECT v.slug, 'de', v.ord, v.title, v.summary, v.icon
FROM (VALUES
  ('willkommen', 1, 'Willkommen', 'Was dieses Programm ist — und was es nicht ist.', 'Handshake'),
  ('zugang', 2, 'Dein Zugang', 'Code einlösen, Premium, Laufzeit.', 'KeyRound'),
  ('portal', 3, 'Das Portal in fünf Minuten', 'Wo was steht und was du hier tun kannst.', 'LayoutDashboard'),
  ('app-verstehen', 4, 'Die App verstehen', 'Planung, Formular, KI, Ideen, Kosten, Nachrichten.', 'Compass'),
  ('marktplatz', 5, 'Agenturen und Leistungen', 'Anbieter vor Ort anfragen und buchen.', 'Store'),
  ('spiele', 6, 'Spiele und TV-Modus', 'Der leichteste Einstieg für Inhalte.', 'Gamepad2'),
  ('briefing', 7, 'Dein Briefing', 'Wie du es liest und was verbindlich ist.', 'FileText'),
  ('formate', 8, 'Formate', 'Reel, Story, Post, Video — was wofür trägt.', 'Clapperboard'),
  ('hooks', 9, 'Die ersten drei Sekunden', 'Woran entschieden wird, ob jemand bleibt.', 'Zap'),
  ('kennzeichnung', 10, 'Kennzeichnung', 'Pflicht, nicht Höflichkeit.', 'BadgeAlert'),
  ('verbotenes', 11, 'Was du nicht sagen solltest', 'Aussagen, die dich angreifbar machen.', 'ShieldAlert'),
  ('code', 12, 'Dein Code', 'Wie Einlösungen gezählt werden.', 'Ticket'),
  ('verguetung', 13, 'Vergütung', 'Provision, Auszahlung, Rechnung.', 'Wallet'),
  ('nachweise', 14, 'Nachweise', 'Einreichen, Freigabe, Reichweite.', 'CircleCheck'),
  ('faq', 15, 'Häufige Fragen', 'Was am meisten gefragt wird.', 'CircleHelp')
) AS v(slug, ord, title, summary, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM public.influencer_bible_chapters c WHERE c.slug = v.slug AND c.language = 'de'
);

INSERT INTO public.influencer_bible_pages (chapter_id, sort_order, title, body)
SELECT c.id, v.ord, v.title, v.body
FROM public.influencer_bible_chapters c
JOIN (VALUES
  ('willkommen', 1, 'Worum es geht',
   'Du empfiehlst eine App, mit der Gruppen ihren Junggesellenabschied, Geburtstag oder Städtetrip planen. Kein Produkt, das ankommt und ausgepackt wird — Software, die man benutzt.

Das ist für dich einfacher und schwerer zugleich: einfacher, weil du nichts lagern, auspacken oder zurückschicken musst. Schwerer, weil man Software nicht in die Kamera halten kann. Sie wird erst interessant, wenn jemand sie benutzt.

Deshalb ist alles in dieser Bibel darauf ausgerichtet, dass du die App im Gebrauch zeigst — mit deiner eigenen Gruppe, deiner eigenen Planung.'),
  ('willkommen', 2, 'Was wir nicht von dir erwarten',
   'Wir erwarten keine Begeisterung, die du nicht hast. Wenn dir etwas nicht gefällt, sag es uns — das ist nützlicher als ein Beitrag, dem man das Bemühen ansieht.

Wir erwarten keine Zahlen. Weder deine noch unsere. Wir geben keine Nutzerzahlen heraus, weil sie nicht geprüft sind, und wir bitten dich, keine zu erfinden.

Und wir erwarten keine Exklusivität. Du darfst über andere Anbieter sprechen, auch über bessere.'),

  ('zugang', 1, 'So bekommst du Premium',
   'Es gibt zwei Wege, je nachdem, ob du schon ein Konto hast.

Ohne Konto bekommst du einen persönlichen Code in der Form INF-DEINNAME-XXXX. Du meldest dich bei EventBliss an, gibst den Code ein, und der Zugang läuft. Die Laufzeit beginnt beim Einlösen — nicht, wenn wir ihn vergeben. Der Code selbst ist 60 Tage einlösbar.

Hast du schon ein Konto und wir haben es verknüpft, brauchst du gar nichts zu tun. Der Zugang steht dann bereits, und in deinem Bereich siehst du, bis wann.'),
  ('zugang', 2, 'Wenn die Laufzeit endet',
   'Ein Probe-Zugang endet, ohne dass etwas passiert: kein Abbuchen, keine Verlängerung, keine Rechnung. Danach kannst du die App weiter kostenlos zum Planen nutzen; nur die Premium-Funktionen sind dann zu.

Wenn du länger brauchst, sag Bescheid. Das ist keine Verhandlung, sondern eine Frage.'),

  ('portal', 1, 'Was hier steht',
   'Oben siehst du, was vereinbart ist: Laufzeit, Provision, Honorar — je nachdem, worauf wir uns geeinigt haben.

Darunter dein Briefing: Kernbotschaft, was du zeigen sollst, was nicht, welche Markierungen und Hashtags gesetzt werden und ob wir vor der Veröffentlichung noch draufschauen wollen.

Dann deine Aufgaben mit Fristen. Dort reichst du auch die Links zu deinen Beiträgen ein.

Und schließlich das Material: Texte zum Kopieren, Bilder, Logos, alle Vorlagen.'),

  ('app-verstehen', 1, 'Der Kern in einem Satz',
   'Eine Gruppe plant gemeinsam an einem Ort, statt in drei Chats aneinander vorbei.

Konkret: Termin abstimmen, Ideen sammeln, ein Formular an die Gruppe schicken, Zeitplan bauen, Ausgaben eintragen, am Ende sehen, wer wem was schuldet. Dazu Vorschläge der KI, wenn niemand eine Idee hat, und eine Bibliothek voller Aktivitäten.

Wenn du nur eine Sache zeigst, zeig das Vorher-Nachher: den Gruppenchat, in dem niemand entscheidet — und daneben die Planung, in der es steht.'),
  ('app-verstehen', 2, 'Die Module, kurz',
   'Übersicht: alle sehen dasselbe, auch Gäste ohne eigenes Konto.

Formular: du stellst der Gruppe eigene Fragen — wer kommt, wer schläft wo, wer isst was. Die Antworten laufen zusammen ein.

KI: Vorschläge für Programm und Ablauf, wenn die Ideen ausgehen.

Ideen: eine Bibliothek mit Aktivitäten, sortiert nach Ort und Anlass.

Kosten: Ausgaben eintragen, gleichmäßig oder nach Anteilen teilen, mehrere Zahler möglich. Am Ende steht, wer wem was schuldet.

Nachrichten: vorgefertigte Texte je Anlass, die man in Sekunden anpasst.'),

  ('marktplatz', 1, 'Anbieter vor Ort',
   'In der App sind Agenturen und Anbieter gelistet, die Programme für Gruppen machen — Stadtrallyes, Boote, Tastings, Kartbahnen. Wer in einer Stadt plant, sieht, wer dort etwas anbietet, und kann direkt anfragen.

Für dich ist das nur dann ein Thema, wenn dein Publikum ohnehin verreist. Erzwing es nicht.

Wichtig: Buchungen laufen zwischen der Gruppe und dem Anbieter. Wir sind nicht der Veranstalter, und du solltest nichts versprechen, was ein Anbieter halten muss.'),

  ('spiele', 1, 'Warum die Spiele der leichteste Einstieg sind',
   'Es gibt 22 Party-Spiele in der App. Alle laufen im Browser, ohne dass jemand etwas installiert, und alle spielen am eigenen Handy mit.

Dazu kommt der TV-Modus: das Spiel läuft auf dem Fernseher, gespielt wird trotzdem am Handy. Das ist der Moment, in dem es bei den meisten klickt.

Für Inhalte ist das dankbar, weil du nichts erklären musst. Eine Runde, echte Reaktionen, fertig. Zeig ein bis zwei Spiele — nicht alle 22.'),

  ('briefing', 1, 'Was verbindlich ist und was nicht',
   'Dein Briefing hat drei Sorten Inhalt.

Verbindlich: die Kennzeichnung, die Fristen und — falls angekreuzt — dass wir vor der Veröffentlichung draufschauen.

Gewünscht: Kernbotschaft, Markierungen, Hashtags, der Link. Wenn dir etwas davon im Weg steht, sag es vorher.

Vorschlag: alles unter Do und Don''t. Das ist Erfahrung, kein Gesetz. Du kennst dein Publikum besser als wir.'),

  ('formate', 1, 'Was wofür trägt',
   'Reel oder kurzes Video: der Ersteindruck. Hier zeigst du das Vorher-Nachher oder eine Spielrunde. Alles, was Bewegung hat.

Story: der Alltag. Am besten als Serie über mehrere Tage — Tag 1 das Chaos, Tag 2 der Termin, und so weiter. Stories vertragen Unfertiges.

Post im Feed: das Nachschlagewerk. Bleibt liegen, wird später gefunden, trägt den Link.

Langes Video oder Podcast: die Erklärung. Nur sinnvoll, wenn dein Publikum ohnehin zuhört.'),

  ('hooks', 1, 'Die ersten drei Sekunden',
   'Entschieden wird am Anfang. Ein paar Anfänge, die bei diesem Thema funktionieren:

„Zehn Leute, drei Gruppenchats, keiner entscheidet."

„Wer von euch hat schon mal einen JGA organisiert? Dann kennst du das."

„Am Ende zahlt immer derselbe."

„Wir haben das Spiel auf den Fernseher geworfen und dann ging es los."

Was nicht funktioniert: „Heute zeige ich euch eine App." Damit ist die Frage beantwortet, bevor sie gestellt wurde.'),

  ('kennzeichnung', 1, 'Pflicht, nicht Höflichkeit',
   'Wenn du für einen Beitrag eine Gegenleistung bekommst — Geld, Provision oder auch nur kostenlosen Zugang — ist der Beitrag Werbung und muss gekennzeichnet werden. Das gilt auch dann, wenn du ehrlich deine Meinung sagst.

Setz die Kennzeichnung an den Anfang, nicht ans Ende der Hashtags. „Werbung" oder „Anzeige" auf Deutsch, „ad" auf Englisch.

Wenn dein Briefing eine bestimmte Kennzeichnung vorgibt, nimm die.

Das schützt in erster Linie dich. Ein fehlender Hinweis ist dein Problem, nicht unseres — und genau deshalb steht er in jedem Briefing von uns bereits drin.'),

  ('verbotenes', 1, 'Sätze, die dich angreifbar machen',
   'Keine erfundenen Zahlen. Weder Nutzerzahlen noch Downloads noch „die meistgenutzte App für …". Wir geben keine heraus, weil sie nicht geprüft sind.

Keine Zahlungsversprechen. Die App teilt Kosten auf und hält fest, wer wem was schuldet — sie überweist kein Geld zwischen Teilnehmern.

Keine Buchungsgarantien. Anbieter im Marktplatz entscheiden selbst, ob sie eine Anfrage annehmen.

Nicht behaupten, die App plane von allein. Sie hält zusammen, was die Gruppe entscheidet.

Und kein Schlechtreden anderer Anbieter. Das fällt immer auf den zurück, der es sagt.'),

  ('code', 1, 'Wie gezählt wird',
   'Dein Code hat zwei mögliche Rollen: als Zugang für dich selbst, und — wenn wir das vereinbart haben — als Rabattcode für deine Community.

Löst jemand deinen Community-Code ein, ist die Einlösung dir zugeordnet. Sie taucht in deinem Bereich auf, sobald sie verbucht ist.

Was nicht gezählt wird: jemand sieht deinen Beitrag, sucht die App später selbst und meldet sich ohne Code an. Das ist der Grund, warum der Code in den Beitrag gehört und nicht nur in die Beschreibung.'),

  ('verguetung', 1, 'Was wann fließt',
   'Möglich sind drei Dinge, einzeln oder zusammen: kostenloser Premium-Zugang auf Zeit, Provision je geworbenem Kunden, oder ein Festhonorar.

Was für dich gilt, steht in deinem Bereich unter „Was du bekommst". Wenn dort etwas anderes steht, als besprochen wurde, sag Bescheid — nicht später, sondern sofort.

Bei Provision: sie entsteht mit der Einlösung, nicht mit dem Beitrag. Zwischen beidem können Wochen liegen.

Bei Honorar: wir sagen dir, was wir für die Rechnung brauchen. Ohne Rechnung keine Zahlung — das ist keine Schikane, sondern Buchhaltung.'),

  ('nachweise', 1, 'Einreichen und Freigabe',
   'Zu jeder Aufgabe gehört ein Link zum veröffentlichten Beitrag. Den trägst du in deinem Bereich ein; danach steht die Aufgabe auf „eingereicht".

Freigeben können wir sie — nicht du. Das ist kein Misstrauen, sondern die Trennung, die verhindert, dass sich jemand selbst genehmigt.

Wenn du die Reichweite kennst, sag sie uns dazu. Sie hilft uns einzuschätzen, was funktioniert, und dir bei der nächsten Vereinbarung.'),

  ('faq', 1, 'Häufige Fragen',
   'Muss ich die App wirklich benutzen? Ja. Einem Beitrag über etwas, das man nicht benutzt hat, sieht man das an.

Was, wenn mir etwas nicht gefällt? Sag es uns. Kritik im Gespräch ist besser als ein lustloser Beitrag.

Darf ich meine eigenen Worte nehmen? Unbedingt. Die Vorlagen sind Ausgangspunkte, keine Skripte.

Was, wenn ich eine Frist nicht halte? Sag vorher Bescheid. Fristen verschieben ist einfach, Schweigen ist das Problem.

Kann ich mehrere Beiträge zu einem Thema machen? Gern. Serien funktionieren bei diesem Thema besser als Einzelstücke.

Wem gehören meine Beiträge? Dir. Wenn wir etwas weiterverwenden wollen, fragen wir vorher.')
) AS v(chapter_slug, ord, title, body)
  ON v.chapter_slug = c.slug AND c.language = 'de'
WHERE NOT EXISTS (
  SELECT 1 FROM public.influencer_bible_pages p
  WHERE p.chapter_id = c.id AND p.sort_order = v.ord
);
